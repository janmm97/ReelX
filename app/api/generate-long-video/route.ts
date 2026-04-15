// app/api/generate-long-video/route.ts
// Generates long videos (>10 s) by creating N × 10-second clips in parallel and
// stitching them together with FFmpeg.  Optionally overlays ElevenLabs narration.
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  getUserSub, canAffordAmount, getModelCost, deductCreditsAmount,
  refundCreditsAmount, affordErrorMessage,
} from '@/lib/credits'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { generateSpeech } from '@/lib/elevenlabs'
import { mergeAudioIntoVideo } from '@/lib/ffmpeg-merge'
import type { VoiceSettings } from '@/lib/elevenlabs'

export const maxDuration = 600

// ── Constants ──────────────────────────────────────────────────────────────────

const CLIP_DURATION_S  = 10           // seconds per individual clip
const POLL_INTERVAL_MS = 8_000
const POLL_TIMEOUT_MS  = 540_000      // 9 min — leave 1 min for stitching

const KIE_BASE         = 'https://api.kie.ai'
const CREATE_TASK_URL  = `${KIE_BASE}/api/v1/jobs/createTask`
const RECORD_INFO_URL  = `${KIE_BASE}/api/v1/jobs/recordInfo`

const AR_MAP: Record<string, string> = {
  '16:9 Widescreen': '16:9',
  '9:16 Vertical':   '9:16',
  '1:1 Square':      '1:1',
  '4:3 Landscape':   '4:3',
  '3:4 Portrait':    '3:4',
}

const DAILY_LIMIT = 5  // long videos count extra

// ── Supported models ───────────────────────────────────────────────────────────

// Only models verified to work on kie.ai as of 2026-04-08.
// Removed: kling-2.1, kling-2.5-turbo, seedance-1.5-pro (deprecated 422);
//          seedance-2 (submits but fails internally); kling-2.6, wan-2.6 (credit-gated).

type T2VModel =
  | 'kling3' | 'kling3_audio'
  | 'wan27'
  | 'bytedance_v1_pro' | 'bytedance_v1_lite'

type I2VModel =
  | 'kling3' | 'kling3_audio'
  | 'bytedance_v1_pro_i2v' | 'bytedance_v1_lite_i2v'

const T2V_MODELS = new Set<string>([
  'kling3', 'kling3_audio',
  'wan27',
  'bytedance_v1_pro', 'bytedance_v1_lite',
])

const I2V_MODELS = new Set<string>([
  'kling3', 'kling3_audio',
  'bytedance_v1_pro_i2v', 'bytedance_v1_lite_i2v',
])

// ── Task body builders ─────────────────────────────────────────────────────────

function buildT2VBody(model: T2VModel, prompt: string, ar: string): object {
  const dur = String(CLIP_DURATION_S)
  switch (model) {
    case 'kling3':
      return { model: 'kling-3.0/video', input: { prompt, sound: false, mode: 'std', duration: dur, aspect_ratio: ar, multi_shots: false } }
    case 'kling3_audio':
      return { model: 'kling-3.0/video', input: { prompt, sound: true, mode: 'pro', duration: dur, aspect_ratio: ar, multi_shots: false } }
    case 'wan27':
      return { model: 'wan/2-7-text-to-video', input: { prompt, audio: true, duration: dur, resolution: '720p', aspect_ratio: ar } }
    case 'bytedance_v1_pro':
      return { model: 'bytedance/v1-pro-text-to-video', input: { prompt, resolution: '720p', aspect_ratio: ar, duration: CLIP_DURATION_S, generate_audio: true } }
    case 'bytedance_v1_lite':
      return { model: 'bytedance/v1-lite-text-to-video', input: { prompt, resolution: '720p', aspect_ratio: ar, duration: CLIP_DURATION_S, generate_audio: true } }
  }
}

function buildI2VBody(model: I2VModel, prompt: string, imageUrls: string[], ar: string): object {
  const dur    = String(CLIP_DURATION_S)
  const imgUrl = imageUrls[0]
  switch (model) {
    case 'kling3':
      return { model: 'kling-3.0/video', input: { image_urls: imageUrls, prompt, mode: 'std', duration: dur, sound: false, aspect_ratio: ar, multi_shots: false } }
    case 'kling3_audio':
      return { model: 'kling-3.0/video', input: { image_urls: imageUrls, prompt, mode: 'pro', duration: dur, sound: true, aspect_ratio: ar, multi_shots: false } }
    case 'bytedance_v1_pro_i2v':
      return { model: 'bytedance/v1-pro-image-to-video', input: { prompt, image_url: imgUrl, first_frame_url: imgUrl, resolution: '720p', aspect_ratio: ar, duration: CLIP_DURATION_S, generate_audio: true } }
    case 'bytedance_v1_lite_i2v':
      return { model: 'bytedance/v1-lite-image-to-video', input: { prompt, image_url: imgUrl, first_frame_url: imgUrl, resolution: '720p', aspect_ratio: ar, duration: CLIP_DURATION_S, generate_audio: true } }
  }
}

// ── kie.ai helpers ─────────────────────────────────────────────────────────────

interface KieSubmit { code: number; msg?: string; data?: { taskId?: string } }
interface KieStatus {
  code: number
  msg?: string
  data?: {
    state?:      string
    resultJson?: string
    failReason?: string   // kie.ai sometimes returns this
    errorMsg?:   string   // or this
  }
}

const SUBMIT_STAGGER_MS = 3_000  // gap between submissions to avoid rate-limits
const MAX_RETRIES       = 1      // retry a failed task once

async function submitTask(body: object, apiKey: string): Promise<string> {
  const res  = await fetch(CREATE_TASK_URL, {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const raw = await res.text()
  console.log(`[long-video] submit HTTP ${res.status}:`, raw.slice(0, 300))
  let data: KieSubmit
  try { data = JSON.parse(raw) } catch { throw new Error(`kie.ai returned non-JSON (HTTP ${res.status}): ${raw.slice(0, 200)}`) }
  if (data.code !== 200 || !data.data?.taskId) {
    throw new Error(`kie.ai submit failed (code ${data.code}): ${data.msg ?? raw.slice(0, 300)}`)
  }
  return data.data.taskId
}

/** Submit N tasks sequentially with stagger, each clip gets a unique seed. */
async function submitAllTasks(
  taskBodies: object[],
  apiKey: string,
): Promise<string[]> {
  const ids: string[] = []
  for (let i = 0; i < taskBodies.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, SUBMIT_STAGGER_MS))
    ids.push(await submitTask(taskBodies[i], apiKey))
  }
  return ids
}

async function pollTask(
  taskId: string,
  apiKey: string,
  retries = MAX_RETRIES,
  resubmitBody?: object,
): Promise<string> {
  const deadline = Date.now() + POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    const res  = await fetch(`${RECORD_INFO_URL}?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const raw  = await res.text()
    let data: KieStatus
    try { data = JSON.parse(raw) } catch { data = { code: -1 } }
    const state = data.data?.state

    if (state === 'success') {
      const parsed = JSON.parse(data.data?.resultJson ?? '{}') as { resultUrls?: string[] }
      const url    = parsed.resultUrls?.[0]
      if (!url) throw new Error(`Task ${taskId} succeeded but no URL`)
      return url
    }

    if (state === 'fail') {
      const reason = data.data?.failReason ?? data.data?.errorMsg ?? data.msg ?? 'unknown'
      console.error(`[long-video] task ${taskId} failed: ${reason}`)

      // Retry once by resubmitting the same body
      if (retries > 0 && resubmitBody) {
        console.log(`[long-video] retrying failed task (${retries} left)…`)
        await new Promise((r) => setTimeout(r, 2_000))
        const newId = await submitTask(resubmitBody, apiKey)
        return pollTask(newId, apiKey, retries - 1, resubmitBody)
      }
      throw new Error(`kie.ai task failed: ${reason}`)
    }
  }
  throw new Error(`Task ${taskId} timed out after ${POLL_TIMEOUT_MS / 1000}s`)
}

// ── FFmpeg concat ──────────────────────────────────────────────────────────────

async function concatVideos(videoBuffers: Buffer[]): Promise<Buffer> {
  if (!ffmpegStatic) throw new Error('ffmpeg binary not found')
  ffmpeg.setFfmpegPath(ffmpegStatic)

  const id        = randomUUID()
  const tmp       = os.tmpdir()
  const clipPaths: string[] = []
  const manifest  = path.join(tmp, `manifest-${id}.txt`)
  const output    = path.join(tmp, `long-${id}.mp4`)

  for (let i = 0; i < videoBuffers.length; i++) {
    const p = path.join(tmp, `clip-${id}-${i}.mp4`)
    await fs.writeFile(p, videoBuffers[i])
    clipPaths.push(p)
  }

  await fs.writeFile(manifest, clipPaths.map((p) => `file '${p}'`).join('\n'))

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(manifest)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-c copy'])
        .output(output)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(new Error(`Concat failed: ${err.message}`)))
        .run()
    })
    return await fs.readFile(output)
  } finally {
    await Promise.all([
      ...clipPaths.map((p) => fs.unlink(p).catch(() => {})),
      fs.unlink(manifest).catch(() => {}),
      fs.unlink(output).catch(() => {}),
    ])
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // 2. Parse body — FormData when images are attached (I2V), JSON for T2V
  let prompt:          string | undefined
  let mode:            string | undefined
  let videoModel:      string | undefined
  let i2vModel:        string | undefined
  let aspectRatio:     string | undefined
  let totalDuration    = 30
  let imageUrls:       string[] = []
  let narrationScript: string | undefined
  let voiceId:         string | undefined
  let voiceStability:  number | undefined
  let voiceSimilarity: number | undefined
  let voiceStyle:      number | undefined
  let voiceSpeed:      number | undefined

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    // I2V path — images sent as files, uploaded server-side to bypass RLS
    const form = await request.formData()
    prompt          = (form.get('prompt')          as string | null) ?? undefined
    mode            = (form.get('mode')            as string | null) ?? 'text'
    videoModel      = (form.get('videoModel')      as string | null) ?? undefined
    i2vModel        = (form.get('i2vModel')        as string | null) ?? undefined
    aspectRatio     = (form.get('aspectRatio')     as string | null) ?? undefined
    totalDuration   = parseInt((form.get('totalDuration') as string | null) ?? '30', 10)
    narrationScript = (form.get('narrationScript') as string | null) ?? undefined
    voiceId         = (form.get('voiceId')         as string | null) ?? undefined
    const vs  = parseFloat((form.get('voiceStability')  as string | null) ?? '')
    const vsm = parseFloat((form.get('voiceSimilarity') as string | null) ?? '')
    const vst = parseFloat((form.get('voiceStyle')      as string | null) ?? '')
    const vsp = parseFloat((form.get('voiceSpeed')      as string | null) ?? '')
    if (!isNaN(vs))  voiceStability  = vs
    if (!isNaN(vsm)) voiceSimilarity = vsm
    if (!isNaN(vst)) voiceStyle      = vst
    if (!isNaN(vsp)) voiceSpeed      = vsp

    // Upload image files with the service client (bypasses storage RLS)
    const imageFiles = form.getAll('images[]') as File[]
    if (imageFiles.length > 0) {
      await service.storage.createBucket('uploads', { public: true }).catch(() => {})
      for (const file of imageFiles) {
        const imgPath = `long-video-input/${user.id}/${Date.now()}-${file.name}`
        const buf     = Buffer.from(await file.arrayBuffer())
        const { error: upErr } = await service.storage
          .from('uploads')
          .upload(imgPath, buf, { contentType: file.type, upsert: true })
        if (upErr) {
          return NextResponse.json({ error: `Image upload failed: ${upErr.message}` }, { status: 500 })
        }
        const { data: urlData } = service.storage.from('uploads').getPublicUrl(imgPath)
        imageUrls.push(urlData.publicUrl)
      }
    }
  } else {
    // JSON path — T2V (no image files needed)
    const body = await request.json().catch(() => ({})) as {
      prompt?: unknown; mode?: unknown; videoModel?: unknown; i2vModel?: unknown
      aspectRatio?: unknown; totalDuration?: unknown; imageUrls?: unknown
      narrationScript?: unknown; voiceId?: unknown
      voiceStability?: unknown; voiceSimilarity?: unknown; voiceStyle?: unknown; voiceSpeed?: unknown
    }
    prompt          = typeof body.prompt      === 'string' ? body.prompt      : undefined
    mode            = typeof body.mode        === 'string' ? body.mode        : 'text'
    videoModel      = typeof body.videoModel  === 'string' ? body.videoModel  : undefined
    i2vModel        = typeof body.i2vModel    === 'string' ? body.i2vModel    : undefined
    aspectRatio     = typeof body.aspectRatio === 'string' ? body.aspectRatio : undefined
    totalDuration   = typeof body.totalDuration === 'number' ? body.totalDuration : 30
    imageUrls       = Array.isArray(body.imageUrls) ? (body.imageUrls as string[]) : []
    narrationScript = typeof body.narrationScript === 'string' ? body.narrationScript : undefined
    voiceId         = typeof body.voiceId     === 'string' ? body.voiceId     : undefined
    if (typeof body.voiceStability  === 'number') voiceStability  = body.voiceStability
    if (typeof body.voiceSimilarity === 'number') voiceSimilarity = body.voiceSimilarity
    if (typeof body.voiceStyle      === 'number') voiceStyle      = body.voiceStyle
    if (typeof body.voiceSpeed      === 'number') voiceSpeed      = body.voiceSpeed
  }

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }
  if (mode !== 'text' && mode !== 'image') {
    return NextResponse.json({ error: 'mode must be "text" or "image"' }, { status: 400 })
  }
  if (mode === 'text' && (!videoModel || !T2V_MODELS.has(videoModel))) {
    return NextResponse.json({ error: `videoModel "${videoModel}" is not supported for long video` }, { status: 400 })
  }
  if (mode === 'image') {
    if (!i2vModel || !I2V_MODELS.has(i2vModel)) {
      return NextResponse.json({ error: `i2vModel "${i2vModel}" is not supported for long video` }, { status: 400 })
    }
    if (imageUrls.length === 0) {
      return NextResponse.json({ error: 'imageUrls required for image-to-video mode' }, { status: 400 })
    }
  }
  if (totalDuration < 20 || totalDuration > 120) {
    return NextResponse.json({ error: 'totalDuration must be between 20 and 120 seconds' }, { status: 400 })
  }

  const apiKey = process.env.KIE_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'KIE_API_KEY not configured' }, { status: 500 })

  // 3. Look up internal user + rate limit
  const { data: dbUser, error: userErr } = await service
    .from('users').select('id').eq('auth_id', user.id).single()
  if (userErr || !dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const { count } = await service.from('videos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', dbUser.id)
    .in('status', ['pending', 'done'])
    .gte('created_at', todayStart.toISOString())
  if ((count ?? 0) >= DAILY_LIMIT) {
    return NextResponse.json({ error: 'Daily video limit reached' }, { status: 429 })
  }

  const ar        = aspectRatio ? (AR_MAP[aspectRatio] ?? '16:9') : '16:9'
  const numClips  = Math.ceil(totalDuration / CLIP_DURATION_S)
  const promptStr = prompt!.trim()
  const modelKey  = (mode === 'text' ? videoModel : i2vModel)!

  // 4. Credit / plan gate (long video is paid-only — no free tier path)
  const sub  = await getUserSub(user.id)
  const plan = sub?.plan ?? 'free'

  if (plan === 'free') {
    return NextResponse.json({ error: 'Long video generation requires a Creator plan or higher.', upgrade: true }, { status: 403 })
  }

  const perClipCost = (await getModelCost(modelKey))?.credits ?? 0
  const totalCost   = perClipCost * numClips

  const check = await canAffordAmount(user.id, totalCost, modelKey)
  if (!check.ok) {
    return NextResponse.json({ error: affordErrorMessage(check.reason), upgrade: check.reason === 'upgrade_required' }, { status: 403 })
  }

  // 5. Insert pending row
  const { data: videoRow, error: insertErr } = await service.from('videos')
    .insert({ user_id: dbUser.id, prompt: promptStr, model: (mode === 'text' ? videoModel : i2vModel)!, status: 'pending', aspect_ratio: ar })
    .select('id').single()
  if (insertErr || !videoRow) {
    return NextResponse.json({ error: 'Failed to create video record' }, { status: 500 })
  }
  const videoId: string = videoRow.id

  // Deduct total credits upfront before any API calls
  try {
    await deductCreditsAmount(user.id, totalCost, modelKey, videoId, 'video')
  } catch {
    await service.from('videos').update({ status: 'failed' }).eq('id', videoId)
    return NextResponse.json({ error: 'Credit deduction failed. Please try again.' }, { status: 500 })
  }

  try {
    // Build clip task bodies
    const taskBodies = Array.from({ length: numClips }, () => {
      return mode === 'text'
        ? buildT2VBody(videoModel! as T2VModel, promptStr, ar)
        : buildI2VBody(i2vModel! as I2VModel, promptStr, imageUrls, ar)
    })

    // 6. Submit tasks with stagger to avoid rate-limits
    const taskIds = await submitAllTasks(taskBodies, apiKey)
    console.log(`[long-video] submitted ${numClips} clips for video ${videoId}:`, taskIds)

    // 7. Poll all clips in parallel (each retries once on failure)
    const clipUrls = await Promise.all(
      taskIds.map((id, i) => pollTask(id, apiKey, MAX_RETRIES, taskBodies[i])),
    )
    console.log(`[long-video] all ${numClips} clips ready`)

    // 7. Download all clip buffers in parallel
    const clipBuffers = await Promise.all(
      clipUrls.map(async (url) => {
        const r = await fetch(url)
        if (!r.ok) throw new Error(`Failed to download clip: ${r.status}`)
        return Buffer.from(await r.arrayBuffer())
      }),
    )

    // 8. FFmpeg concat
    let finalBuffer = await concatVideos(clipBuffers)
    console.log(`[long-video] stitched ${numClips} clips — ${(finalBuffer.length / 1024 / 1024).toFixed(1)} MB`)

    // 9. Optional: apply ElevenLabs voice narration
    if (narrationScript?.trim() && voiceId?.trim()) {
      const elevenKey = process.env.ELEVENLABS_API_KEY
      if (!elevenKey) throw new Error('ElevenLabs API key not configured')

      const voiceSettings: Partial<VoiceSettings> = {
        stability:        voiceStability,
        similarity_boost: voiceSimilarity,
        style:            voiceStyle,
        speed:            voiceSpeed,
      }

      const audioBuffer = await generateSpeech(
        elevenKey,
        voiceId.trim(),
        narrationScript.trim(),
        voiceSettings,
      )
      finalBuffer = await mergeAudioIntoVideo(finalBuffer, audioBuffer)
      console.log('[long-video] voice narration applied')
    }

    // 10. Upload to Supabase Storage (public uploads bucket → public URL)
    await service.storage.createBucket('uploads', { public: true }).catch(() => {})
    const storagePath = `long-video/${dbUser.id}/${videoId}.mp4`
    const { error: upErr } = await service.storage
      .from('uploads')
      .upload(storagePath, finalBuffer, { contentType: 'video/mp4', upsert: true })
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`)

    const { data: urlData } = service.storage.from('uploads').getPublicUrl(storagePath)
    const videoUrl = urlData.publicUrl

    // 11. Mark done
    await service.from('videos').update({ video_url: videoUrl, status: 'done', credits_charged: totalCost }).eq('id', videoId)
    return NextResponse.json({ videoUrl, videoId })

  } catch (err) {
    await service.from('videos').update({ status: 'failed' }).eq('id', videoId)
    await refundCreditsAmount(user.id, totalCost, videoId, 'video').catch(() => {})
    const message = err instanceof Error ? err.message : 'Long video generation failed'
    console.error('[long-video] error:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
