import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// ── Model routing ─────────────────────────────────────────────────────────────

type RunwayModel = 'runway_turbo' | 'runway_aleph'
type VeoModel    = 'veo3_fast' | 'veo3'
type VideoModel  = RunwayModel | VeoModel

const RUNWAY_MODELS = new Set<VideoModel>(['runway_turbo', 'runway_aleph'])
const ALL_MODELS    = new Set<VideoModel>(['runway_turbo', 'runway_aleph', 'veo3_fast', 'veo3'])

const VEO_MODEL_ID: Record<VeoModel, string> = {
  veo3_fast: 'veo3_fast',
  veo3:      'veo3',
}

// Normalise dashboard aspect ratio label → kie.ai format
const AR_MAP: Record<string, string> = {
  '16:9 Widescreen': '16:9',
  '9:16 Vertical':   '9:16',
  '1:1 Square':      '1:1',
  '4:3 Landscape':   '4:3',
  '3:4 Portrait':    '3:4',
}

const DAILY_LIMIT   = 10
const POLL_INTERVAL = 8_000   // 8 s
const POLL_TIMEOUT  = 300_000 // 5 min

const KIE_BASE = 'https://api.kie.ai'

// ── kie.ai response shapes ────────────────────────────────────────────────────

interface KieSubmitResponse {
  code:  number
  msg?:  string
  data?: { taskId?: string }
}

interface KieRunwayStatus {
  code:  number
  data?: {
    state?:     string   // wait | queueing | generating | success | fail
    videoInfo?: { videoUrl?: string }
  }
}

interface KieVeoStatus {
  code:  number
  data?: {
    successFlag?: number  // 0 generating | 1 success | 2/3 failed
    resultUrls?:  string[]
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function submitRunway(
  prompt: string,
  aspectRatio: string | undefined,
  apiKey: string,
): Promise<string> {
  const body: Record<string, unknown> = {
    prompt,
    duration: 5,
    quality:  '720p',
  }
  if (aspectRatio) body.aspectRatio = aspectRatio

  const res = await fetch(`${KIE_BASE}/api/v1/runway/generate`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const raw = await res.text()
  console.log(`[generate-video] runway submit ${res.status}:`, raw)

  const data = JSON.parse(raw) as KieSubmitResponse
  if (data.code !== 200 || !data.data?.taskId) {
    throw new Error(`kie.ai Runway error: ${data.msg ?? raw.slice(0, 200)}`)
  }
  return data.data.taskId
}

async function submitVeo(
  prompt: string,
  model: VeoModel,
  aspectRatio: string | undefined,
  apiKey: string,
): Promise<string> {
  const body: Record<string, unknown> = {
    prompt,
    model: VEO_MODEL_ID[model],
  }
  // Veo only supports 16:9 and 9:16; default to 16:9 for others
  if (aspectRatio === '9:16') body.aspect_ratio = '9:16'
  else body.aspect_ratio = '16:9'

  const res = await fetch(`${KIE_BASE}/api/v1/veo/generate`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const raw = await res.text()
  console.log(`[generate-video] veo submit ${res.status}:`, raw)

  const data = JSON.parse(raw) as KieSubmitResponse
  if (data.code !== 200 || !data.data?.taskId) {
    throw new Error(`kie.ai Veo error: ${data.msg ?? raw.slice(0, 200)}`)
  }
  return data.data.taskId
}

async function pollRunway(taskId: string, apiKey: string): Promise<string> {
  const deadline = Date.now() + POLL_TIMEOUT
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL))
    const res  = await fetch(`${KIE_BASE}/api/v1/runway/record-detail?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const data = (await res.json()) as KieRunwayStatus
    const state = data.data?.state
    console.log('[generate-video] runway poll:', state)

    if (state === 'success') {
      const url = data.data?.videoInfo?.videoUrl
      if (!url) throw new Error('Runway completed but no video URL returned')
      return url
    }
    if (state === 'fail') throw new Error('Runway video generation failed')
  }
  throw new Error('Video generation timed out — try again')
}

async function pollVeo(taskId: string, apiKey: string): Promise<string> {
  const deadline = Date.now() + POLL_TIMEOUT
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL))
    const res  = await fetch(`${KIE_BASE}/api/v1/veo/record-info?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const data = (await res.json()) as KieVeoStatus
    const flag = data.data?.successFlag
    console.log('[generate-video] veo poll successFlag:', flag)

    if (flag === 1) {
      const url = data.data?.resultUrls?.[0]
      if (!url) throw new Error('Veo completed but no video URL returned')
      return url
    }
    if (flag === 2 || flag === 3) throw new Error('Veo video generation failed')
  }
  throw new Error('Video generation timed out — try again')
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Validate body
  const body = await request.json().catch(() => ({})) as {
    prompt?: unknown; model?: unknown; aspectRatio?: unknown
  }
  const { prompt, model, aspectRatio } = body

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }
  if (!model || !ALL_MODELS.has(model as VideoModel)) {
    return NextResponse.json({ error: 'Invalid video model' }, { status: 400 })
  }

  const apiKey = process.env.KIE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'KIE API key not configured' }, { status: 500 })
  }

  const service = createServiceClient()

  // 3. Look up internal user
  const { data: dbUser, error: userErr } = await service
    .from('users').select('id').eq('auth_id', user.id).single()
  if (userErr || !dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // 4. Rate limit (videos table, separate from images)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { count } = await service
    .from('videos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', dbUser.id)
    .in('status', ['pending', 'done'])
    .gte('created_at', todayStart.toISOString())
  if ((count ?? 0) >= DAILY_LIMIT) {
    return NextResponse.json({ error: 'Daily video limit reached' }, { status: 429 })
  }

  const ar = typeof aspectRatio === 'string' ? AR_MAP[aspectRatio] : undefined

  // 5. Insert pending row
  const { data: videoRow, error: insertErr } = await service
    .from('videos')
    .insert({
      user_id:      dbUser.id,
      prompt:       prompt.trim(),
      model:        model as string,
      status:       'pending',
      aspect_ratio: ar ?? null,
    })
    .select('id')
    .single()
  if (insertErr || !videoRow) {
    return NextResponse.json({ error: 'Failed to create video record' }, { status: 500 })
  }
  const videoId: string = videoRow.id
  const isRunway = RUNWAY_MODELS.has(model as VideoModel)

  try {
    // 6. Submit to kie.ai
    const taskId = isRunway
      ? await submitRunway(prompt.trim(), ar, apiKey)
      : await submitVeo(prompt.trim(), model as VeoModel, ar, apiKey)

    // Store task ID immediately for traceability
    await service.from('videos').update({ job_id: taskId }).eq('id', videoId)
    console.log('[generate-video] task ID:', taskId)

    // 7. Poll for result
    const videoUrl = isRunway
      ? await pollRunway(taskId, apiKey)
      : await pollVeo(taskId, apiKey)

    // 8. Mark done
    await service
      .from('videos')
      .update({ video_url: videoUrl, status: 'done' })
      .eq('id', videoId)

    return NextResponse.json({ videoUrl, videoId })

  } catch (err) {
    await service.from('videos').update({ status: 'failed' }).eq('id', videoId)
    const message = err instanceof Error ? err.message : 'Video generation failed'
    console.error('[generate-video] error:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
