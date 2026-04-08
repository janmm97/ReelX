// app/api/video/callback/route.ts
// Called by kie.ai when an InfiniteTalk chunk finishes. No user auth.
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface KieCallbackBody {
  taskId?:     string
  state?:      string  // success | fail
  resultJson?: string  // JSON string with resultUrls
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as KieCallbackBody
  const { taskId, state, resultJson } = body

  if (!taskId) {
    return NextResponse.json({ error: 'taskId is required' }, { status: 400 })
  }

  const service = createServiceClient()

  // Find the job that owns this taskId
  const { data: jobs, error: findErr } = await service
    .from('video_jobs')
    .select('id, user_id, completed_chunks, total_chunks, chunk_task_ids, chunk_video_urls')
    .contains('chunk_task_ids', [taskId])
    .limit(1)

  if (findErr || !jobs || jobs.length === 0) {
    console.error('[callback] job not found for taskId:', taskId)
    return NextResponse.json({ ok: true }) // ACK regardless to avoid retries
  }

  const job = jobs[0]

  if (state === 'fail') {
    console.error('[callback] chunk failed for job:', job.id, 'taskId:', taskId)
    await service.from('video_jobs').update({ status: 'failed' }).eq('id', job.id)
    return NextResponse.json({ ok: true })
  }

  if (state !== 'success') {
    // Still processing — just ACK
    return NextResponse.json({ ok: true })
  }

  // Parse the video URL from resultJson
  let videoUrl: string | null = null
  if (resultJson) {
    const parsed = JSON.parse(resultJson) as { resultUrls?: string[] }
    videoUrl = parsed.resultUrls?.[0] ?? null
  }

  if (!videoUrl) {
    console.error('[callback] no video URL in resultJson for taskId:', taskId)
    return NextResponse.json({ ok: true })
  }

  // Find the chunk index from chunk_task_ids to order segments correctly
  const chunkIndex  = (job.chunk_task_ids as string[]).indexOf(taskId)
  const chunkUrls   = [...((job.chunk_video_urls ?? []) as (string | null)[])]

  // Download chunk video and re-upload to Supabase Storage
  const videoRes = await fetch(videoUrl)
  if (!videoRes.ok) {
    console.error('[callback] failed to download chunk video:', videoUrl)
    return NextResponse.json({ ok: true })
  }

  const videoBuffer  = Buffer.from(await videoRes.arrayBuffer())
  const storagePath  = `segments/${job.id}/segment_${chunkIndex}.mp4`

  await service.storage.createBucket('video-assets', { public: false }).catch(() => {})
  const { error: upErr } = await service.storage
    .from('video-assets')
    .upload(storagePath, videoBuffer, { contentType: 'video/mp4', upsert: true })

  if (upErr) {
    console.error('[callback] segment upload failed:', upErr.message)
    return NextResponse.json({ ok: true })
  }

  // Ensure array is large enough
  while (chunkUrls.length <= chunkIndex) chunkUrls.push(null)
  chunkUrls[chunkIndex] = storagePath

  const newCompleted = (job.completed_chunks as number) + 1

  await service.from('video_jobs').update({
    completed_chunks: newCompleted,
    chunk_video_urls: chunkUrls,
    updated_at: new Date().toISOString(),
  }).eq('id', job.id)

  // All chunks done — trigger stitch
  if (newCompleted >= (job.total_chunks as number)) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (appUrl) {
      fetch(`${appUrl}/api/video/stitch`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ jobId: job.id }),
      }).catch((err) => console.error('[callback] stitch trigger failed:', err))
    }
  }

  return NextResponse.json({ ok: true })
}
