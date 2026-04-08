// app/api/video/split-audio/route.ts
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
// @ts-ignore — ffprobe-static has no bundled types
import ffprobeStatic from 'ffprobe-static'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'

export const maxDuration = 120

const CHUNK_SECONDS = 13

async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err)
      resolve(metadata.format.duration ?? 0)
    })
  })
}

async function extractChunk(
  inputPath: string,
  outputPath: string,
  startSec: number,
  durationSec: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startSec)
      .setDuration(durationSec)
      .outputOptions(['-c:a copy'])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(new Error(`Chunk extract failed: ${err.message}`)))
      .run()
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!ffmpegStatic) {
    return NextResponse.json({ error: 'ffmpeg binary not found' }, { status: 500 })
  }
  ffmpeg.setFfmpegPath(ffmpegStatic)
  ffmpeg.setFfprobePath(ffprobeStatic.path)

  const body = await request.json().catch(() => ({})) as { audioStoragePath?: unknown }
  const { audioStoragePath } = body

  if (!audioStoragePath || typeof audioStoragePath !== 'string') {
    return NextResponse.json({ error: 'audioStoragePath is required' }, { status: 400 })
  }

  const service = createServiceClient()

  // Download audio from Supabase Storage
  const { data: audioData, error: dlErr } = await service.storage
    .from('video-assets')
    .download(audioStoragePath)

  if (dlErr || !audioData) {
    return NextResponse.json({ error: 'Failed to download audio' }, { status: 500 })
  }

  const tmp    = os.tmpdir()
  const id     = randomUUID()
  const jobId  = randomUUID()
  const inPath = path.join(tmp, `audio-in-${id}.mp3`)

  const audioBuffer = Buffer.from(await audioData.arrayBuffer())
  await fs.writeFile(inPath, audioBuffer)

  let chunkPaths: string[] = []

  try {
    const totalDuration = await getAudioDuration(inPath)
    const numChunks     = Math.ceil(totalDuration / CHUNK_SECONDS)

    // Extract each chunk
    const chunkPromises: Promise<string>[] = []
    for (let i = 0; i < numChunks; i++) {
      const start    = i * CHUNK_SECONDS
      const duration = Math.min(CHUNK_SECONDS, totalDuration - start)
      const outPath  = path.join(tmp, `chunk-${id}-${i}.mp3`)
      chunkPaths.push(outPath)
      chunkPromises.push(
        extractChunk(inPath, outPath, start, duration).then(() => outPath),
      )
    }
    await Promise.all(chunkPromises)

    // Upload chunks to Supabase Storage and collect signed URLs
    const signedUrls: string[] = []
    for (let i = 0; i < chunkPaths.length; i++) {
      const chunkBuffer   = await fs.readFile(chunkPaths[i])
      const chunkPath     = `chunks/${user.id}/${jobId}/chunk_${i}.mp3`

      const { error: upErr } = await service.storage
        .from('video-assets')
        .upload(chunkPath, chunkBuffer, { contentType: 'audio/mpeg', upsert: false })
      if (upErr) throw new Error(`Chunk ${i} upload failed: ${upErr.message}`)

      const { data: su } = await service.storage
        .from('video-assets')
        .createSignedUrl(chunkPath, 3600)
      if (!su?.signedUrl) throw new Error(`Chunk ${i} signed URL failed`)
      signedUrls.push(su.signedUrl)
    }

    return NextResponse.json({ audioChunkUrls: signedUrls, jobId })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Audio split failed'
    console.error('[split-audio] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    await fs.unlink(inPath).catch(() => {})
    for (const p of chunkPaths) {
      await fs.unlink(p).catch(() => {})
    }
  }
}
