import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// ── Model routing ─────────────────────────────────────────────────────────────

type I2VModel =
  | 'grok'
  | 'kling3'
  | 'kling3_audio'
  | 'seedance2'
  | 'hailuo_pro'
  | 'hailuo_std'
  | 'wan26'
  | 'wan26_flash'
  | 'sora2'
  | 'sora2_pro'
  | 'veo3_i2v'
  | 'veo3_fast_i2v'

type Quality  = '480p' | '720p' | '1080p'

const ALL_MODELS = new Set<I2VModel>([
  'grok', 'kling3', 'kling3_audio',
  'seedance2', 'hailuo_pro', 'hailuo_std',
  'wan26', 'wan26_flash',
  'sora2', 'sora2_pro',
  'veo3_i2v', 'veo3_fast_i2v',
])
const VALID_QUALITIES = new Set<Quality>(['480p', '720p', '1080p'])

// Veo I2V models use a different endpoint and poll mechanism
const VEO_I2V_MODELS = new Set<I2VModel>(['veo3_i2v', 'veo3_fast_i2v'])

const DAILY_LIMIT   = 10
const POLL_INTERVAL = 8_000   // 8 s
const POLL_TIMEOUT  = 300_000 // 5 min

const KIE_BASE       = 'https://api.kie.ai'
const CREATE_TASK_URL = `${KIE_BASE}/api/v1/jobs/createTask`
const RECORD_INFO_URL = `${KIE_BASE}/api/v1/jobs/recordInfo`

// Normalise dashboard aspect ratio label → kie.ai format
const AR_MAP: Record<string, string> = {
  '16:9 Widescreen': '16:9',
  '9:16 Vertical':   '9:16',
  '1:1 Square':      '1:1',
  '4:3 Landscape':   '4:3',
  '3:4 Portrait':    '3:4',
}

// ── Build model-specific request body ─────────────────────────────────────────

function buildTaskBody(
  model: I2VModel,
  prompt: string,
  imageUrl: string,
  quality: Quality,
  aspectRatio: string | undefined,
) {
  const ar = aspectRatio ?? '16:9'

  switch (model) {
    case 'grok':
      return {
        model: 'grok-imagine/image-to-video',
        input: {
          image_urls: [imageUrl],
          prompt,
          resolution: quality === '1080p' ? '720p' : quality, // Grok max 720p
          aspect_ratio: ar,
          duration: '6',
        },
      }

    case 'kling3':
      return {
        model: 'kling-3.0/video',
        input: {
          image_urls: [imageUrl],
          prompt,
          mode: quality === '1080p' ? 'pro' : 'std',
          duration: '5',
          sound: false,
          aspect_ratio: ar,
          multi_shots: false,
        },
      }

    case 'kling3_audio':
      return {
        model: 'kling-3.0/video',
        input: {
          image_urls: [imageUrl],
          prompt,
          mode: 'pro',
          duration: '5',
          sound: true,
          aspect_ratio: ar,
          multi_shots: false,
        },
      }

    case 'seedance2':
      return {
        model: 'bytedance/seedance-2',
        input: {
          prompt,
          first_frame_url: imageUrl,
          resolution: quality === '1080p' ? '720p' : quality,
          aspect_ratio: ar,
          duration: 8,
          generate_audio: true,
        },
      }

    case 'hailuo_pro':
      return {
        model: 'hailuo/02-image-to-video-pro',
        input: {
          image_urls: [imageUrl],
          prompt,
        },
      }

    case 'hailuo_std':
      return {
        model: 'hailuo/02-image-to-video-standard',
        input: {
          image_urls: [imageUrl],
          prompt,
        },
      }

    case 'wan26':
      return {
        model: 'wan/2-6-image-to-video',
        input: {
          image_urls: [imageUrl],
          prompt,
          audio: true,
          duration: '5',
          resolution: quality === '480p' ? '720p' : quality,
        },
      }

    case 'wan26_flash':
      return {
        model: 'wan/2-6-flash-image-to-video',
        input: {
          image_urls: [imageUrl],
          prompt,
          audio: true,
          duration: '5',
          resolution: quality === '480p' ? '720p' : quality,
        },
      }

    case 'sora2':
      return {
        model: 'sora-2-image-to-video',
        input: {
          image_urls: [imageUrl],
          prompt,
          aspect_ratio: ar === '9:16' ? 'portrait' : 'landscape',
          upload_method: 's3',
        },
      }

    case 'sora2_pro':
      return {
        model: 'sora-2-pro-image-to-video',
        input: {
          image_urls: [imageUrl],
          prompt,
          aspect_ratio: ar === '9:16' ? 'portrait' : 'landscape',
          upload_method: 's3',
        },
      }

    // Veo I2V models are handled separately via the Veo endpoint
    case 'veo3_i2v':
    case 'veo3_fast_i2v':
      throw new Error('Veo I2V models should not go through buildTaskBody')
  }
}

// ── Veo image-to-video helpers ───────────────────────────────────────────────

interface KieVeoSubmitResponse {
  code:  number
  msg?:  string
  data?: { taskId?: string }
}

interface KieVeoStatus {
  code:  number
  data?: {
    successFlag?: number
    resultUrls?:  string[]
  }
}

async function submitVeoI2V(
  prompt: string,
  model: I2VModel,
  imageUrl: string,
  aspectRatio: string | undefined,
  apiKey: string,
): Promise<string> {
  const veoId = model === 'veo3_fast_i2v' ? 'veo3_fast' : 'veo3'
  const body: Record<string, unknown> = {
    prompt,
    model: veoId,
    generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO',
    imageUrls: [imageUrl],
  }
  if (aspectRatio === '9:16') body.aspect_ratio = '9:16'
  else body.aspect_ratio = '16:9'

  const res = await fetch(`${KIE_BASE}/api/v1/veo/generate`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const raw = await res.text()
  console.log(`[i2v] veo submit ${res.status}:`, raw)

  const data = JSON.parse(raw) as KieVeoSubmitResponse
  if (data.code !== 200 || !data.data?.taskId) {
    throw new Error(`kie.ai Veo error: ${data.msg ?? raw.slice(0, 200)}`)
  }
  return data.data.taskId
}

async function pollVeoI2V(taskId: string, apiKey: string): Promise<string> {
  const deadline = Date.now() + POLL_TIMEOUT
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL))
    const res  = await fetch(`${KIE_BASE}/api/v1/veo/record-info?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const data = (await res.json()) as KieVeoStatus
    const flag = data.data?.successFlag
    console.log('[i2v] veo poll successFlag:', flag)

    if (flag === 1) {
      const url = data.data?.resultUrls?.[0]
      if (!url) throw new Error('Veo completed but no video URL returned')
      return url
    }
    if (flag === 2 || flag === 3) throw new Error('Veo video generation failed')
  }
  throw new Error('Video generation timed out — try again')
}

// ── kie.ai response shapes ────────────────────────────────────────────────────

interface CreateTaskResponse {
  code: number
  msg?: string
  data?: { taskId?: string }
}

interface RecordInfoResponse {
  code: number
  data?: {
    state?:      string // waiting | queuing | generating | success | fail
    resultJson?: string // JSON string with resultUrls
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function submitTask(body: object, apiKey: string): Promise<string> {
  const res = await fetch(CREATE_TASK_URL, {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const raw = await res.text()
  console.log(`[i2v] createTask ${res.status}:`, raw)

  const data = JSON.parse(raw) as CreateTaskResponse
  if (data.code !== 200 || !data.data?.taskId) {
    throw new Error(`kie.ai createTask error: ${data.msg ?? raw.slice(0, 200)}`)
  }
  return data.data.taskId
}

async function pollTask(taskId: string, apiKey: string): Promise<string> {
  const deadline = Date.now() + POLL_TIMEOUT
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL))

    const res  = await fetch(`${RECORD_INFO_URL}?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const data = (await res.json()) as RecordInfoResponse
    const state = data.data?.state
    console.log('[i2v] poll state:', state)

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

async function uploadToStorage(
  service: ReturnType<typeof createServiceClient>,
  file: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  const bucket = 'uploads'
  const path   = `i2v/${Date.now()}-${filename}`

  // Ensure bucket exists (idempotent)
  await service.storage.createBucket(bucket, { public: true }).catch(() => {})

  const { error } = await service.storage.from(bucket).upload(path, file, {
    contentType,
    upsert: false,
  })
  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = service.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Parse FormData
  const formData = await request.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const prompt      = formData.get('prompt') as string | null
  const model       = formData.get('model') as string | null
  const quality     = formData.get('quality') as string | null
  const aspectRatio = formData.get('aspectRatio') as string | null
  const imageFiles  = formData.getAll('images[]') as File[]
  const imageDescriptions = formData.getAll('imageDescriptions[]').map(d => String(d))

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }
  if (!model || !ALL_MODELS.has(model as I2VModel)) {
    return NextResponse.json({ error: 'Invalid model' }, { status: 400 })
  }
  if (!quality || !VALID_QUALITIES.has(quality as Quality)) {
    return NextResponse.json({ error: 'Invalid quality' }, { status: 400 })
  }
  if (imageFiles.length === 0 || imageFiles.every(f => f.size === 0)) {
    return NextResponse.json({ error: 'Image file is required' }, { status: 400 })
  }
  for (const f of imageFiles) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, and WebP supported' }, { status: 400 })
    }
    if (f.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 10 MB' }, { status: 400 })
    }
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

  // 4. Rate limit (shared with videos)
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

  const ar = aspectRatio ? AR_MAP[aspectRatio] : undefined

  // 5. Upload image to Supabase Storage
  let imageUrl: string
  try {
    const buffer = Buffer.from(await imageFile.arrayBuffer())
    imageUrl = await uploadToStorage(service, buffer, imageFile.name, imageFile.type)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Image upload failed'
    console.error('[i2v] upload error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // 6. Insert pending row
  const { data: videoRow, error: insertErr } = await service
    .from('videos')
    .insert({
      user_id:      dbUser.id,
      prompt:       prompt.trim(),
      model:        model,
      status:       'pending',
      aspect_ratio: ar ?? null,
    })
    .select('id')
    .single()
  if (insertErr || !videoRow) {
    return NextResponse.json({ error: 'Failed to create video record' }, { status: 500 })
  }
  const videoId: string = videoRow.id

  const isVeoI2V = VEO_I2V_MODELS.has(model as I2VModel)

  try {
    // 7. Submit to kie.ai
    let taskId: string
    let videoUrl: string

    if (isVeoI2V) {
      taskId = await submitVeoI2V(prompt.trim(), model as I2VModel, imageUrl, ar, apiKey)
      await service.from('videos').update({ job_id: taskId }).eq('id', videoId)
      console.log('[i2v] veo task ID:', taskId)
      videoUrl = await pollVeoI2V(taskId, apiKey)
    } else {
      const taskBody = buildTaskBody(model as I2VModel, prompt.trim(), imageUrl, quality as Quality, ar)
      taskId = await submitTask(taskBody, apiKey)
      await service.from('videos').update({ job_id: taskId }).eq('id', videoId)
      console.log('[i2v] task ID:', taskId)
      videoUrl = await pollTask(taskId, apiKey)
    }

    // 8. Mark done
    await service
      .from('videos')
      .update({ video_url: videoUrl, status: 'done' })
      .eq('id', videoId)

    return NextResponse.json({ videoUrl, videoId })

  } catch (err) {
    await service.from('videos').update({ status: 'failed' }).eq('id', videoId)
    const message = err instanceof Error ? err.message : 'Video generation failed'
    console.error('[i2v] error:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
