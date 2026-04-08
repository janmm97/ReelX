// lib/apply-voice.ts
import { createServiceClient } from '@/lib/supabase/server'
import { generateSpeech, VoiceSettings } from './elevenlabs'
import { mergeAudioIntoVideo } from './ffmpeg-merge'

type ServiceClient = ReturnType<typeof createServiceClient>

export async function applyVoiceToVideo(
  videoUrl: string,
  voice: {
    voiceId:         string
    narrationScript: string
    voiceSettings?:  Partial<VoiceSettings>
  },
  apiKey:  string,
  service: ServiceClient,
  videoId: string,
): Promise<string> {
  // 1. Generate TTS + download video in parallel
  const [audioBuffer, videoRes] = await Promise.all([
    generateSpeech(apiKey, voice.voiceId, voice.narrationScript, voice.voiceSettings),
    fetch(videoUrl),
  ])

  if (!videoRes.ok) throw new Error('Could not download generated video')
  const videoBuffer = Buffer.from(await videoRes.arrayBuffer())

  // 2. Replace audio track (background AI audio is always stripped)
  const mergedBuffer = await mergeAudioIntoVideo(videoBuffer, audioBuffer)

  // 3. Upload merged video to Supabase Storage
  const storagePath = `merged/${Date.now()}-${videoId}.mp4`
  await service.storage.createBucket('uploads', { public: true }).catch(() => {})
  const { error } = await service.storage
    .from('uploads')
    .upload(storagePath, mergedBuffer, { contentType: 'video/mp4', upsert: false })
  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = service.storage.from('uploads').getPublicUrl(storagePath)
  return data.publicUrl
}
