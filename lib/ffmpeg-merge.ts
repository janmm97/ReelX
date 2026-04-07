// lib/ffmpeg-merge.ts
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import { promises as fs } from 'fs'
import { randomUUID } from 'crypto'
import path from 'path'

export async function mergeAudioIntoVideo(
  videoBuffer: Buffer,
  audioBuffer: Buffer,
  keepBackground: boolean,
): Promise<Buffer> {
  if (!ffmpegStatic) throw new Error('ffmpeg binary not found — is ffmpeg-static installed?')
  ffmpeg.setFfmpegPath(ffmpegStatic)

  const id          = randomUUID()
  const videoPath   = path.join('/tmp', `video-${id}.mp4`)
  const audioPath   = path.join('/tmp', `audio-${id}.mp3`)
  const outputPath  = path.join('/tmp', `merged-${id}.mp4`)

  await fs.writeFile(videoPath, videoBuffer)
  await fs.writeFile(audioPath, audioBuffer)

  try {
    await new Promise<void>((resolve, reject) => {
      const cmd = ffmpeg().input(videoPath).input(audioPath)

      if (keepBackground) {
        cmd
          .complexFilter('[0:a]volume=0.3[a0];[a0][1:a]amix=inputs=2[a]')
          .outputOptions(['-map 0:v', '-map [a]', '-shortest'])
      } else {
        cmd.outputOptions(['-c:v copy', '-map 0:v:0', '-map 1:a:0', '-shortest'])
      }

      cmd
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
