import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { applyVoiceToVideo } from '@/lib/apply-voice'
import {
  getUserSub, canAfford, deductCreditsAmount, refundCreditsAmount,
  checkAndIncrementFreeCap, affordErrorMessage, FREE_VIDEO_MODELS,
} from '@/lib/credits'

export const maxDuration = 300

// ── Model routing ─────────────────────────────────────────────────────────────

type I2VModel =
  | 'grok'
  | 'kling21_i2v'
  | 'kling25_turbo_i2v'
  | 'kling3'
  | 'kling3_audio'
  | 'seedance2'
  | 'seedance15_pro_i2v'
  | 'hailuo_pro'
  | 'hailuo_std'
  | 'hailuo23_pro'
  | 'hailuo23_std'
  | 'wan26'
  | 'wan26_flash'
  | 'wan27_i2v'
  | 'bytedance_v1_pro_i2v'
  | 'bytedance_v1_lite_i2v'
  | 'sora2'
  | 'sora2_pro'
  | 'veo3_i2v'
  | 'veo3_fast_i2v'

type Quality  = '480p' | '720p' | '1080p'

const ALL_MODELS = new Set<I2VModel>([
  'grok',
  'kling21_i2v', 'kling25_turbo_i2v', 'kling3', 'kling3_audio',
  'seedance2', 'seedance15_pro_i2v',
  'hailuo_pro', 'hailuo_std', 'hailuo23_pro', 'hailuo23_std',
  'wan26', 'wan26_flash', 'wan27_i2v',
  'bytedance_v1_pro_i2v', 'bytedance_v1_lite_i2v',
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
  imageUrls: string[],
  quality: Quality,
  aspectRatio: string | undefined,
  duration: string,
) {
  const ar = aspectRatio ?? '16:9'
  const dur = duration ?? '5'
  const imageUrl = imageUrls[0]  // first image for single-image models

  switch (model) {
    case 'grok':
      return {
        model: 'grok-imagine/image-to-video',
        input: {
          image_urls: imageUrls,
          prompt,
          mode: 'normal',
          resolution: quality === '1080p' ? '720p' : quality, // Grok max 720p
          aspect_ratio: ar,
        },
      }

    case 'kling21_i2v':
      return {
        model: 'kling-2.1/image-to-video',
        input: {
          image_urls: imageUrls,
          prompt,
          mode: quality === '1080p' ? 'pro' : 'std',
          duration: dur,
          sound: false,
          aspect_ratio: ar,
        },
      }

    case 'kling25_turbo_i2v':
      return {
        model: 'kling-2.5-turbo/image-to-video-pro',
        input: {
          image_urls: imageUrls,
          prompt,
          duration: dur,
          sound: false,
          aspect_ratio: ar,
        },
      }

    case 'kling3':
      return {
        model: 'kling-3.0/video',
        input: {
          image_urls: imageUrls,
          prompt,
          mode: quality === '1080p' ? 'pro' : 'std',
          duration: dur,
          sound: false,
          aspect_ratio: ar,
          multi_shots: imageUrls.length > 1,
        },
      }

    case 'kling3_audio':
      return {
        model: 'kling-3.0/video',
        input: {
          image_urls: imageUrls,
          prompt,
          mode: 'pro',
          duration: dur,
          sound: true,
          aspect_ratio: ar,
          multi_shots: imageUrls.length > 1,
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
          duration: parseInt(dur, 10),
          generate_audio: true,
        },
      }

    case 'seedance15_pro_i2v':
      return {
        model: 'bytedance/seedance-1-5-pro-image-to-video',
        input: {
          prompt,
          first_frame_url: imageUrl,
          resolution: quality === '1080p' ? '720p' : quality,
          aspect_ratio: ar,
          duration: parseInt(dur, 10),
          generate_audio: true,
        },
      }

    case 'hailuo_pro':
      return {
        model: 'hailuo/02-image-to-video-pro',
        input: {
          image_urls: imageUrls,
          prompt,
        },
      }

    case 'hailuo_std':
      return {
        model: 'hailuo/02-image-to-video-standard',
        input: {
          image_urls: imageUrls,
          prompt,
        },
      }

    case 'hailuo23_pro':
      return {
        model: 'hailuo/2-3-image-to-video-pro',
        input: {
          image_urls: imageUrls,
          prompt,
        },
      }

    case 'hailuo23_std':
      return {
        model: 'hailuo/2-3-image-to-video-standard',
        input: {
          image_urls: imageUrls,
          prompt,
        },
      }

    case 'wan26':
      return {
        model: 'wan/2-6-image-to-video',
        input: {
          image_urls: imageUrls,
          prompt,
          duration: `${dur} seconds`,
          resolution: quality === '480p' ? '720p' : quality,
        },
      }

    case 'wan26_flash':
      return {
        model: 'wan/2-6-flash-image-to-video',
        input: {
          image_urls: imageUrls,
          prompt,
          duration: `${dur} seconds`,
          resolution: quality === '480p' ? '720p' : quality,
        },
      }

    case 'wan27_i2v': {
      // Wan 2.7 I2V: uses first_frame_url, numeric duration (2–10s), aspect_ratio auto from image
      const wan27Dur = Math.min(10, Math.max(2, parseInt(dur, 10)))
      return {
        model: 'wan/2-7-image-to-video',
        input: {
          first_frame_url: imageUrl,
          prompt,
          duration: wan27Dur,
          resolution: quality === '480p' ? '720p' : quality,
        },
      }
    }

    case 'bytedance_v1_pro_i2v':
      return {
        model: 'bytedance/v1-pro-image-to-video',
        input: {
          prompt,
          image_url: imageUrl,
          first_frame_url: imageUrl,
          resolution: quality === '1080p' ? '720p' : quality,
          aspect_ratio: ar,
          duration: parseInt(dur, 10),
          generate_audio: true,
        },
      }

    case 'bytedance_v1_lite_i2v':
      return {
        model: 'bytedance/v1-lite-image-to-video',
        input: {
          prompt,
          image_url: imageUrl,
          first_frame_url: imageUrl,
          resolution: quality === '1080p' ? '720p' : quality,
          aspect_ratio: ar,
          duration: parseInt(dur, 10),
          generate_audio: true,
        },
      }

    case 'sora2':
      return {
        model: 'sora-2-image-to-video',
        input: {
          image_urls: imageUrls,
          prompt,
          aspect_ratio: ar === '9:16' ? 'portrait' : 'landscape',
          upload_method: 's3',
        },
      }

    case 'sora2_pro':
      return {
        model: 'sora-2-pro-image-to-video',
        input: {
          image_urls: imageUrls,
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
    resultJson?:  string
  }
}

async function submitVeoI2V(
  prompt: string,
  model: I2VModel,
  imageUrls: string[],
  aspectRatio: string | undefined,
  apiKey: string,
): Promise<string> {
  const veoId = model === 'veo3_fast_i2v' ? 'veo3_fast' : 'veo3'
  const body: Record<string, unknown> = {
    prompt,
    model: veoId,
    generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO',
    imageUrls,
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
      let url = data.data?.resultUrls?.[0]
      if (!url && data.data?.resultJson) {
        try {
          const parsed = JSON.parse(data.data.resultJson) as { resultUrls?: string[] }
          url = parsed.resultUrls?.[0]
        } catch { /* ignore */ }
      }
      if (!url) {
        console.error('[i2v] veo response missing URL:', JSON.stringify(data).slice(0, 400))
        throw new Error('Veo completed but no video URL returned')
      }
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
    if (state === 'fail') {
      console.error('[i2v] poll fail response:', JSON.stringify(data))
      throw new Error('Video generation failed')
    }
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

function buildAugmentedPrompt(prompt: string, descriptions: string[]): string {
  const nonEmpty = descriptions.map(d => d.trim()).filter(Boolean)
  if (nonEmpty.length === 0) return prompt
  const preamble = nonEmpty.map((d, i) => `[Image ${i + 1}: ${d}]`).join(' ')
  return `${preamble}\n${prompt}`
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
  const imageFiles  = (formData.getAll('images[]') as File[]).filter(f => f.size > 0)
  const imageDescriptions = formData.getAll('imageDescriptions[]').map(d => String(d))
  const narrationScript   = (formData.get('narrationScript') as string | null) ?? ''
  const voiceId           = (formData.get('voiceId') as string | null) ?? ''
  const duration          = (formData.get('duration') as string | null) ?? '5'
  const voiceStability    = parseFloat((formData.get('voiceStability') as string | null) ?? 'NaN')
  const voiceSimilarity   = parseFloat((formData.get('voiceSimilarity') as string | null) ?? 'NaN')
  const voiceStyle        = parseFloat((formData.get('voiceStyle') as string | null) ?? 'NaN')
  const voiceSpeed        = parseFloat((formData.get('voiceSpeed') as string | null) ?? 'NaN')

  const hasScript = narrationScript.trim().length > 0
  const hasVoice  = voiceId.trim().length > 0
  if (hasScript !== hasVoice) {
    return NextResponse.json(
      { error: 'narrationScript and voiceId must both be provided together' },
      { status: 400 },
    )
  }

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

  // 5. Rate limit (shared with videos)
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

  // 5. Upload all images to Supabase Storage
  const imageUrls: string[] = []
  try {
    for (const f of imageFiles) {
      const buffer = Buffer.from(await f.arrayBuffer())
      const url = await uploadToStorage(service, buffer, f.name, f.type)
      imageUrls.push(url)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Image upload failed'
    console.error('[i2v] upload error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // 5b. Augment prompt with image descriptions
  const augmentedPrompt = buildAugmentedPrompt(prompt.trim(), imageDescriptions)

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

  // Deduct credits upfront (paid users only)
  if (plan !== 'free' && creditsCost > 0) {
    try {
      await deductCreditsAmount(user.id, creditsCost, model as string, videoId, 'video')
    } catch {
      await service.from('videos').update({ status: 'failed' }).eq('id', videoId)
      return NextResponse.json({ error: 'Credit deduction failed. Please try again.' }, { status: 500 })
    }
  }

  const isVeoI2V = VEO_I2V_MODELS.has(model as I2VModel)

  try {
    // Submit to kie.ai
    let taskId: string
    let videoUrl: string

    if (isVeoI2V) {
      taskId = await submitVeoI2V(augmentedPrompt, model as I2VModel, imageUrls, ar, apiKey)
      await service.from('videos').update({ job_id: taskId }).eq('id', videoId)
      console.log('[i2v] veo task ID:', taskId)
      videoUrl = await pollVeoI2V(taskId, apiKey)
    } else {
      const taskBody = buildTaskBody(model as I2VModel, augmentedPrompt, imageUrls, quality as Quality, ar, duration)
      console.log('[i2v] taskBody:', JSON.stringify(taskBody, null, 2))
      taskId = await submitTask(taskBody, apiKey)
      await service.from('videos').update({ job_id: taskId }).eq('id', videoId)
      console.log('[i2v] task ID:', taskId)
      videoUrl = await pollTask(taskId, apiKey)
    }

    // 8. Optional: apply ElevenLabs voice narration
    if (hasScript && hasVoice) {
      const elevenKey = process.env.ELEVENLABS_API_KEY
      if (!elevenKey) throw new Error('ElevenLabs API key not configured')
      videoUrl = await applyVoiceToVideo(
        videoUrl,
        {
          voiceId:         voiceId.trim(),
          narrationScript: narrationScript.trim(),
          voiceSettings: {
            stability:        isNaN(voiceStability) ? undefined : voiceStability,
            similarity_boost: isNaN(voiceSimilarity) ? undefined : voiceSimilarity,
            style:            isNaN(voiceStyle) ? undefined : voiceStyle,
            speed:            isNaN(voiceSpeed) ? undefined : voiceSpeed,
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
    console.error('[i2v] error:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
