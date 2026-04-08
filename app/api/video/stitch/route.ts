// app/api/video/stitch/route.ts
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as { jobId?: unknown }
  const { jobId } = body

  if (!jobId || typeof jobId !== 'string') {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
  }

  if (!ffmpegStatic) {
    return NextResponse.json({ error: 'ffmpeg binary not found' }, { status: 500 })
  }
  ffmpeg.setFfmpegPath(ffmpegStatic)

  const service = createServiceClient()

  const { data: job, error: jobErr } = await service
    .from('video_jobs')
    .select('id, user_id, chunk_video_urls, status')
    .eq('id', jobId)
    .single()

  if (jobErr || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }
  if (job.status === 'complete') {
    return NextResponse.json({ ok: true }) // already stitched
  }

  const segmentPaths = job.chunk_video_urls as string[]
  if (!segmentPaths || segmentPaths.some((p) => !p)) {
    return NextResponse.json({ error: 'Not all segments are ready' }, { status: 400 })
  }

  const tmp   = os.tmpdir()
  const runId = randomUUID()
  const localSegments: string[] = []

  try {
    // Download all segments from Supabase Storage in order
    for (let i = 0; i < segmentPaths.length; i++) {
      const { data, error } = await service.storage
        .from('video-assets')
        .download(segmentPaths[i])
      if (error || !data) throw new Error(`Failed to download segment ${i}: ${error?.message}`)

      const localPath = path.join(tmp, `seg-${runId}-${i}.mp4`)
      await fs.writeFile(localPath, Buffer.from(await data.arrayBuffer()))
      localSegments.push(localPath)
    }

    // Write ffmpeg concat manifest
    const manifestPath = path.join(tmp, `manifest-${runId}.txt`)
    const manifest     = localSegments.map((p) => `file '${p}'`).join('\n')
    await fs.writeFile(manifestPath, manifest)

    const outputPath = path.join(tmp, `final-${runId}.mp4`)

    // Concatenate all segments
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(manifestPath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-c copy'])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(new Error(`Stitch failed: ${err.message}`)))
        .run()
    })

    const finalBuffer = await fs.readFile(outputPath)
    const storagePath = `final/${job.user_id}/${jobId}.mp4`

    const { error: upErr } = await service.storage
      .from('video-assets')
      .upload(storagePath, finalBuffer, { contentType: 'video/mp4', upsert: true })
    if (upErr) throw new Error(`Final upload failed: ${upErr.message}`)

    // 24-hour signed URL for the final video
    const { data: su } = await service.storage
      .from('video-assets')
      .createSignedUrl(storagePath, 86400)

    const finalVideoUrl = su?.signedUrl ?? null

    await service.from('video_jobs').update({
      status:         'complete',
      final_video_url: finalVideoUrl,
      updated_at:     new Date().toISOString(),
    }).eq('id', jobId)

    return NextResponse.json({ finalVideoUrl })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stitch failed'
    console.error('[video/stitch] error:', message)
    await service.from('video_jobs').update({ status: 'failed' }).eq('id', jobId)
    return NextResponse.json({ error: message }, { status: 500 })

  } finally {
    for (const p of localSegments) await fs.unlink(p).catch(() => {})
    const manifestPath = path.join(tmp, `manifest-${runId}.txt`)
    await fs.unlink(manifestPath).catch(() => {})
    const outputPath = path.join(tmp, `final-${runId}.mp4`)
    await fs.unlink(outputPath).catch(() => {})
  }
}
