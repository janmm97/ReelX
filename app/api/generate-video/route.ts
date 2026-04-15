import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { applyVoiceToVideo } from '@/lib/apply-voice'
import {
  getUserSub, canAfford, deductCreditsAmount, refundCreditsAmount,
  checkAndIncrementFreeCap, affordErrorMessage, FREE_VIDEO_MODELS,
} from '@/lib/credits'

export const maxDuration = 300

// ── Model routing ─────────────────────────────────────────────────────────────

type VideoModel =
  | 'runway_turbo' | 'runway_aleph'
  | 'veo3_fast' | 'veo3' | 'veo3_audio' | 'veo3_lite'
  | 'kling21_std' | 'kling21_pro'
  | 'kling25_turbo'
  | 'kling26' | 'kling3' | 'kling3_audio'
  | 'seedance2' | 'seedance2_fast' | 'seedance15_pro'
  | 'hailuo_pro' | 'hailuo_std'
  | 'sora2' | 'sora2_pro' | 'sora2_audio'
  | 'wan26' | 'wan27'
  | 'bytedance_v1_pro' | 'bytedance_v1_lite'
  | 'grok_t2v'

const RUNWAY_MODELS = new Set<VideoModel>(['runway_turbo', 'runway_aleph'])
const VEO_MODELS    = new Set<VideoModel>(['veo3_fast', 'veo3', 'veo3_audio', 'veo3_lite'])
const GENERIC_MODELS = new Set<VideoModel>([
  'kling21_std', 'kling21_pro', 'kling25_turbo',
  'kling26', 'kling3', 'kling3_audio',
  'seedance2', 'seedance2_fast', 'seedance15_pro',
  'hailuo_pro', 'hailuo_std',
  'sora2', 'sora2_pro', 'sora2_audio',
  'wan26', 'wan27',
  'bytedance_v1_pro', 'bytedance_v1_lite',
  'grok_t2v',
])
const ALL_MODELS = new Set<VideoModel>([
  ...RUNWAY_MODELS, ...VEO_MODELS, ...GENERIC_MODELS,
])

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

const KIE_BASE         = 'https://api.kie.ai'
const CREATE_TASK_URL  = `${KIE_BASE}/api/v1/jobs/createTask`
const RECORD_INFO_URL  = `${KIE_BASE}/api/v1/jobs/recordInfo`

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
    resultJson?:  string   // some versions embed the URL here instead
  }
}

interface KieGenericStatus {
  code: number
  data?: {
    state?:      string // waiting | queuing | generating | success | fail
    resultJson?: string
  }
}

// ── Build generic-API task body for models using /jobs/createTask ─────────────

function buildT2VTaskBody(
  model: VideoModel,
  prompt: string,
  aspectRatio: string | undefined,
  duration: string,
) {
  const ar = aspectRatio ?? '16:9'
  const dur = duration ?? '5'

  switch (model) {
    case 'kling21_std':
      return {
        model: 'kling-2.1/text-to-video',
        input: { prompt, sound: false, mode: 'std', duration: dur, aspect_ratio: ar },
      }
    case 'kling21_pro':
      return {
        model: 'kling-2.1/text-to-video',
        input: { prompt, sound: false, mode: 'pro', duration: dur, aspect_ratio: ar },
      }
    case 'kling25_turbo':
      return {
        model: 'kling-2.5-turbo/text-to-video-pro',
        input: { prompt, sound: false, duration: dur, aspect_ratio: ar },
      }
    case 'kling26':
      return {
        model: 'kling-2.6/text-to-video',
        input: { prompt, sound: true, aspect_ratio: ar, duration: dur },
      }
    case 'kling3':
      return {
        model: 'kling-3.0/video',
        input: { prompt, sound: false, mode: 'std', duration: dur, aspect_ratio: ar, multi_shots: false },
      }
    case 'kling3_audio':
      return {
        model: 'kling-3.0/video',
        input: { prompt, sound: true, mode: 'pro', duration: dur, aspect_ratio: ar, multi_shots: false },
      }
    case 'seedance2':
      return {
        model: 'bytedance/seedance-2',
        input: { prompt, resolution: '720p', aspect_ratio: ar, duration: parseInt(dur, 10), generate_audio: true },
      }
    case 'seedance2_fast':
      return {
        model: 'bytedance/seedance-2-fast',
        input: { prompt, resolution: '720p', aspect_ratio: ar, duration: parseInt(dur, 10), generate_audio: true },
      }
    case 'seedance15_pro':
      return {
        model: 'bytedance/seedance-1-5-pro',
        input: { prompt, resolution: '720p', aspect_ratio: ar, duration: parseInt(dur, 10), generate_audio: true },
      }
    case 'hailuo_pro':
      return {
        model: 'hailuo/02-text-to-video-pro',
        input: { prompt },
      }
    case 'hailuo_std':
      return {
        model: 'hailuo/02-text-to-video-standard',
        input: { prompt },
      }
    case 'sora2':
      return {
        model: 'sora-2-text-to-video',
        input: { prompt, aspect_ratio: ar === '9:16' ? 'portrait' : 'landscape', upload_method: 's3' },
      }
    case 'sora2_pro':
      return {
        model: 'sora-2-pro-text-to-video',
        input: { prompt, aspect_ratio: ar === '9:16' ? 'portrait' : 'landscape', size: 'high', upload_method: 's3' },
      }
    case 'sora2_audio':
      return {
        model: 'sora-2-pro-text-to-video',
        input: { prompt, aspect_ratio: ar === '9:16' ? 'portrait' : 'landscape', size: 'high', upload_method: 's3' },
      }
    case 'wan26':
      return {
        model: 'wan/2-6-text-to-video',
        input: { prompt, audio: true, duration: dur, resolution: '720p' },
      }
    case 'wan27':
      return {
        model: 'wan/2-7-text-to-video',
        input: { prompt, audio: true, duration: dur, resolution: '720p', aspect_ratio: ar },
      }
    case 'bytedance_v1_pro':
      return {
        model: 'bytedance/v1-pro-text-to-video',
        input: { prompt, resolution: '720p', aspect_ratio: ar, duration: parseInt(dur, 10), generate_audio: true },
      }
    case 'bytedance_v1_lite':
      return {
        model: 'bytedance/v1-lite-text-to-video',
        input: { prompt, resolution: '720p', aspect_ratio: ar, duration: parseInt(dur, 10), generate_audio: true },
      }
    case 'grok_t2v': {
      // Grok only supports 16:9 and 9:16; fall back to 16:9 for other ratios
      const grokAr = ar === '9:16' ? '9:16' : '16:9'
      return {
        model: 'grok-imagine/text-to-video',
        input: { prompt, aspect_ratio: grokAr, mode: 'normal', duration: parseInt(dur, 10), resolution: '720p' },
      }
    }
    default:
      throw new Error(`Unsupported generic model: ${model}`)
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
  model: VideoModel,
  aspectRatio: string | undefined,
  apiKey: string,
): Promise<string> {
  const veoId = model === 'veo3_fast' ? 'veo3_fast' : model === 'veo3_lite' ? 'veo3_lite' : 'veo3'
  const body: Record<string, unknown> = {
    prompt,
    model: veoId,
  }
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

async function submitGenericTask(body: object, apiKey: string): Promise<string> {
  const res = await fetch(CREATE_TASK_URL, {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const raw = await res.text()
  console.log(`[generate-video] generic submit ${res.status}:`, raw)

  const data = JSON.parse(raw) as KieSubmitResponse
  if (data.code !== 200 || !data.data?.taskId) {
    throw new Error(`kie.ai createTask error: ${data.msg ?? raw.slice(0, 200)}`)
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
      let url = data.data?.resultUrls?.[0]
      if (!url && data.data?.resultJson) {
        try {
          const parsed = JSON.parse(data.data.resultJson) as { resultUrls?: string[] }
          url = parsed.resultUrls?.[0]
        } catch { /* ignore parse error */ }
      }
      if (!url) {
        console.error('[generate-video] veo response missing URL:', JSON.stringify(data).slice(0, 400))
        throw new Error('Veo completed but no video URL returned')
      }
      return url
    }
    if (flag === 2 || flag === 3) throw new Error('Veo video generation failed')
  }
  throw new Error('Video generation timed out — try again')
}

async function pollGenericTask(taskId: string, apiKey: string): Promise<string> {
  const deadline = Date.now() + POLL_TIMEOUT
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL))
    const res  = await fetch(`${RECORD_INFO_URL}?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const data = (await res.json()) as KieGenericStatus
    const state = data.data?.state
    console.log('[generate-video] generic poll:', state)

    if (state === 'success') {
      const resultJson = data.data?.resultJson
      if (!resultJson) throw new Error('Task completed but no resultJson returned')
      const parsed = JSON.parse(resultJson) as { resultUrls?: string[] }
      const url = parsed.resultUrls?.[0]
      if (!url) throw new Error('Task completed but no video URL in resultJson')
      return url
    }
    if (state === 'fail') throw new Error('Video generation failed')
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
    prompt?: unknown; model?: unknown; aspectRatio?: unknown; duration?: unknown
    narrationScript?: unknown; voiceId?: unknown
    voiceStability?: unknown; voiceSimilarity?: unknown; voiceStyle?: unknown; voiceSpeed?: unknown
  }
  const {
    prompt, model, aspectRatio,
    narrationScript, voiceId,
    voiceStability, voiceSimilarity, voiceStyle, voiceSpeed,
  } = body
  const duration = typeof body.duration === 'string' ? body.duration : '5'

  // Validate voice params — must provide both or neither
  const hasScript = typeof narrationScript === 'string' && narrationScript.trim().length > 0
  const hasVoice  = typeof voiceId === 'string' && voiceId.trim().length > 0
  if (hasScript !== hasVoice) {
    return NextResponse.json(
      { error: 'narrationScript and voiceId must both be provided together' },
      { status: 400 },
    )
  }

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

  // 4. Credit / plan gate
  const sub  = await getUserSub(user.id)
  const plan = sub?.plan ?? 'free'
  let creditsCost = 0

  if (plan === 'free') {
    if (!FREE_VIDEO_MODELS.has(model as string)) {
      return NextResponse.json({ error: 'Upgrade to Creator or higher to use this model.', upgrade: true }, { status: 403 })
    }
    const cap = await checkAndIncrementFreeCap(user.id, 'video')
    if (!cap.ok) {
      return NextResponse.json({ error: `Free tier limit reached (${cap.cap} videos/month). Upgrade for more.`, upgrade: true }, { status: 429 })
    }
  } else {
    const check = await canAfford(user.id, model as string)
    if (!check.ok) {
      return NextResponse.json({ error: affordErrorMessage(check.reason), upgrade: check.reason === 'upgrade_required' }, { status: 403 })
    }
    creditsCost = check.credits
  }

  // 5. Rate limit (videos table, separate from images)
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

  // Deduct credits upfront (paid users only)
  if (plan !== 'free' && creditsCost > 0) {
    try {
      await deductCreditsAmount(user.id, creditsCost, model as string, videoId, 'video')
    } catch {
      await service.from('videos').update({ status: 'failed' }).eq('id', videoId)
      return NextResponse.json({ error: 'Credit deduction failed. Please try again.' }, { status: 500 })
    }
  }

  const vm = model as VideoModel
  const isRunway = RUNWAY_MODELS.has(vm)
  const isVeo    = VEO_MODELS.has(vm)

  try {
    // Submit to kie.ai
    let taskId: string
    if (isRunway) {
      taskId = await submitRunway(prompt.trim(), ar, apiKey)
    } else if (isVeo) {
      taskId = await submitVeo(prompt.trim(), vm, ar, apiKey)
    } else {
      const taskBody = buildT2VTaskBody(vm, prompt.trim(), ar, duration)
      taskId = await submitGenericTask(taskBody, apiKey)
    }

    // Store task ID immediately for traceability
    await service.from('videos').update({ job_id: taskId }).eq('id', videoId)
    console.log('[generate-video] task ID:', taskId)

    // 7. Poll for result
    let videoUrl: string
    if (isRunway) {
      videoUrl = await pollRunway(taskId, apiKey)
    } else if (isVeo) {
      videoUrl = await pollVeo(taskId, apiKey)
    } else {
      videoUrl = await pollGenericTask(taskId, apiKey)
    }

    // 8. Optional: apply ElevenLabs voice narration
    if (hasScript && hasVoice) {
      const elevenKey = process.env.ELEVENLABS_API_KEY
      if (!elevenKey) throw new Error('ElevenLabs API key not configured')
      videoUrl = await applyVoiceToVideo(
        videoUrl,
        {
          voiceId:         (voiceId as string).trim(),
          narrationScript: (narrationScript as string).trim(),
          voiceSettings: {
            stability:        typeof voiceStability === 'number' ? voiceStability : undefined,
            similarity_boost: typeof voiceSimilarity === 'number' ? voiceSimilarity : undefined,
            style:            typeof voiceStyle === 'number' ? voiceStyle : undefined,
            speed:            typeof voiceSpeed === 'number' ? voiceSpeed : undefined,
          },
        },
        elevenKey,
        service,
        videoId,
      )
    }

    // 9. Mark done
    await service
      .from('videos')
      .update({ video_url: videoUrl, status: 'done', credits_charged: creditsCost || null })
      .eq('id', videoId)

    return NextResponse.json({ videoUrl, videoId })

  } catch (err) {
    await service.from('videos').update({ status: 'failed' }).eq('id', videoId)
    if (plan !== 'free' && creditsCost > 0) {
      await refundCreditsAmount(user.id, creditsCost, videoId, 'video').catch(() => {})
    }
    const message = err instanceof Error ? err.message : 'Video generation failed'
    console.error('[generate-video] error:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
