// app/api/video/generate/route.ts
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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
  }
  const { imageUrl, audioChunkUrls, prompt, seed } = body

  if (!imageUrl || typeof imageUrl !== 'string') {
    return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
  }
  if (!Array.isArray(audioChunkUrls) || audioChunkUrls.length === 0) {
    return NextResponse.json({ error: 'audioChunkUrls must be a non-empty array' }, { status: 400 })
  }
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
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

  const service    = createServiceClient()
  const chunkSeeds = typeof seed === 'number' ? seed : Math.floor(Math.random() * 2 ** 31)
  const taskIds: string[] = []

  // Submit one InfiniteTalk task per audio chunk (same seed for visual consistency)
  for (const audioUrl of audioChunkUrls as string[]) {
    const res = await fetch(CREATE_TASK_URL, {
      method:  'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        model:       'infinitalk/from-audio',
        callBackUrl: `${appUrl}/api/video/callback`,
        input: {
          image_url:  imageUrl,
          audio_url:  audioUrl,
          prompt:     prompt.trim(),
          resolution: '720p',
          seed:       chunkSeeds,
        },
      }),
    })

    const raw  = await res.text()
    const data = JSON.parse(raw) as KieSubmitResponse
    if (data.code !== 200 || !data.data?.taskId) {
      console.error('[video/generate] kie.ai error:', raw.slice(0, 200))
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
      user_id:       user.id,
      status:        'pending',
      total_chunks:  taskIds.length,
      chunk_task_ids: taskIds,
      prompt:        prompt.trim(),
    })
    .select('id')
    .single()

  if (insertErr || !jobRow) {
    console.error('[video/generate] insert error:', insertErr?.message)
    return NextResponse.json({ error: 'Failed to create job record' }, { status: 500 })
  }

  return NextResponse.json({ jobId: jobRow.id })
}
