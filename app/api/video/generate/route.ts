// app/api/video/generate/route.ts
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  getUserSub, canAffordAmount, deductCreditsAmount,
  refundCreditsAmount, affordErrorMessage,
} from '@/lib/credits'

const INFINITALK_MODEL_KEY   = 'infinitalk_chunk'
const INFINITALK_CREDITS_PER = 50  // matches model_credit_costs seed

// kie.ai model identifiers
const KIE_INFINITALK_MODEL  = 'infinitalk/from-audio'
const KIE_KLING_AVATAR_MODEL = 'kling/virtual-human'  // verify with kie.ai docs if needed

const KIE_BASE         = 'https://api.kie.ai'
const CREATE_TASK_URL  = `${KIE_BASE}/api/v1/jobs/createTask`

interface KieSubmitResponse {
  code:  number
  msg?:  string
  data?: { taskId?: string }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as {
    imageUrl?:       unknown
    audioChunkUrls?: unknown
    prompt?:         unknown
    seed?:           unknown
    model?:          unknown
    resolution?:     unknown
  }
  const { imageUrl, audioChunkUrls, prompt, seed, model, resolution } = body

  const isKling = model === 'kling-avatar'

  if (!imageUrl || typeof imageUrl !== 'string') {
    return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
  }
  if (!Array.isArray(audioChunkUrls) || audioChunkUrls.length === 0) {
    return NextResponse.json({ error: 'audioChunkUrls must be a non-empty array' }, { status: 400 })
  }
  // prompt is required for InfiniteTalk, optional for Kling
  if (!isKling && (!prompt || typeof prompt !== 'string' || !prompt.trim())) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  const apiKey = process.env.KIE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'KIE_API_KEY not configured' }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL not configured' }, { status: 500 })
  }

  const service      = createServiceClient()
  const numChunks    = (audioChunkUrls as string[]).length
  const totalCost    = numChunks * INFINITALK_CREDITS_PER

  // Credit / plan gate (InfinitaTalk is paid-only — standard tier)
  const sub  = await getUserSub(user.id)
  const plan = sub?.plan ?? 'free'

  if (plan === 'free') {
    return NextResponse.json({ error: 'InfinitaTalk requires a Creator plan or higher.', upgrade: true }, { status: 403 })
  }

  const check = await canAffordAmount(user.id, totalCost, INFINITALK_MODEL_KEY)
  if (!check.ok) {
    return NextResponse.json({ error: affordErrorMessage(check.reason), upgrade: check.reason === 'upgrade_required' }, { status: 403 })
  }

  // Reserve credits before submitting tasks
  // job row isn't inserted yet, so we use a placeholder UUID for the generation_id
  // and update it after the job row is created
  const placeholderJobId = crypto.randomUUID()
  try {
    await deductCreditsAmount(user.id, totalCost, INFINITALK_MODEL_KEY, placeholderJobId, 'video')
  } catch {
    return NextResponse.json({ error: 'Credit deduction failed. Please try again.' }, { status: 500 })
  }

  // kie.ai seed max is 1,000,000
  const chunkSeed = typeof seed === 'number' ? Math.min(seed, 1_000_000) : Math.floor(Math.random() * 1_000_000)
  const kieModel  = isKling ? KIE_KLING_AVATAR_MODEL : KIE_INFINITALK_MODEL
  const kieRes    = typeof resolution === 'string' ? resolution : '480p'
  const taskIds: string[] = []

  // Submit one task per audio chunk (Kling: single chunk = full audio; InfiniteTalk: one per split chunk)
  for (const audioUrl of audioChunkUrls as string[]) {
    const kieInput = isKling
      ? {
          image_url: imageUrl,
          audio_url: audioUrl,
          prompt:    typeof prompt === 'string' ? prompt.trim() : '',
        }
      : {
          image_url:    imageUrl,
          audio_url:    audioUrl,
          prompt:       (prompt as string).trim(),
          resolution:   kieRes,
          nsfw_checker: true,
          seed:         chunkSeed,
        }

    const res = await fetch(CREATE_TASK_URL, {
      method:  'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        model:       kieModel,
        callBackUrl: `${appUrl}/api/video/callback`,
        input:       kieInput,
      }),
    })

    const raw  = await res.text()
    const data = JSON.parse(raw) as KieSubmitResponse
    if (data.code !== 200 || !data.data?.taskId) {
      console.error('[video/generate] kie.ai error:', raw.slice(0, 200))
      // Refund all credits — no tasks completed yet
      await refundCreditsAmount(user.id, totalCost, placeholderJobId, 'video').catch(() => {})
      return NextResponse.json(
        { error: `kie.ai task submission failed: ${data.msg ?? 'unknown error'}` },
        { status: 502 },
      )
    }
    taskIds.push(data.data.taskId)
  }

  // Create a video_jobs row
  const { data: jobRow, error: insertErr } = await service
    .from('video_jobs')
    .insert({
      user_id:        user.id,
      status:         'pending',
      total_chunks:   taskIds.length,
      chunk_task_ids: taskIds,
      prompt:         typeof prompt === 'string' ? prompt.trim() : '',
    })
    .select('id')
    .single()

  if (insertErr || !jobRow) {
    console.error('[video/generate] insert error:', insertErr?.message)
    await refundCreditsAmount(user.id, totalCost, placeholderJobId, 'video').catch(() => {})
    return NextResponse.json({ error: 'Failed to create job record' }, { status: 500 })
  }

  return NextResponse.json({ jobId: jobRow.id })
}
