// lib/ffmpeg-merge.ts
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import { promises as fs } from 'fs'
import os from 'os'
import { randomUUID } from 'crypto'
import path from 'path'

/**
 * Replaces the video's audio track with the provided TTS audio.
 * Applies loudnorm (-16 LUFS) for consistent, broadcast-safe levels.
 * Original AI-generated audio is always stripped when narration is provided.
 */
export async function mergeAudioIntoVideo(
  videoBuffer: Buffer,
  audioBuffer: Buffer,
): Promise<Buffer> {
  if (!ffmpegStatic) throw new Error('ffmpeg binary not found — is ffmpeg-static installed?')
  ffmpeg.setFfmpegPath(ffmpegStatic)

  const id         = randomUUID()
  const tmp        = os.tmpdir()
  const videoPath  = path.join(tmp, `video-${id}.mp4`)
  const audioPath  = path.join(tmp, `audio-${id}.mp3`)
  const outputPath = path.join(tmp, `merged-${id}.mp4`)

  await fs.writeFile(videoPath, videoBuffer)
  await fs.writeFile(audioPath, audioBuffer)

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        // Normalise TTS to -16 LUFS integrated loudness, -1.5 dBTP ceiling
        .complexFilter('[1:a]loudnorm=I=-16:LRA=11:TP=-1.5[a]')
        .outputOptions(['-map 0:v:0', '-map [a]', '-c:v copy', '-shortest'])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(new Error(`Audio merge failed: ${err.message}`)))
        .run()
    })

    return await fs.readFile(outputPath)
  } finally {
    await Promise.all([
      fs.unlink(videoPath).catch((e) => console.warn('[ffmpeg] cleanup video:', e)),
      fs.unlink(audioPath).catch((e) => console.warn('[ffmpeg] cleanup audio:', e)),
      fs.unlink(outputPath).catch((e) => console.warn('[ffmpeg] cleanup output:', e)),
    ])
  }
}
