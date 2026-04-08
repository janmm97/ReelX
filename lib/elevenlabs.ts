// lib/elevenlabs.ts
const ELEVENLABS_BASE = 'https://api.elevenlabs.io'

export interface Voice {
  id: string
  name: string
  category: 'library' | 'cloned'
  previewUrl: string
}

export interface VoiceSettings {
  stability:        number  // 0–1  (default 0.5)
  similarity_boost: number  // 0–1  (default 0.75)
  style:            number  // 0–1  (default 0.4)
  speed:            number  // 0.7–1.3 (default 1.0)
}

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability:        0.5,
  similarity_boost: 0.75,
  style:            0.4,
  speed:            1.0,
}

interface ElevenLabsVoicesResponse {
  voices: Array<{
    voice_id: string
    name: string
    category: string
    preview_url: string
  }>
}

export async function fetchVoices(apiKey: string): Promise<Voice[]> {
  const res = await fetch(`${ELEVENLABS_BASE}/v1/voices`, {
    headers: { 'xi-api-key': apiKey },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`ElevenLabs voices error: ${text.slice(0, 200)}`)
  }
  const data = (await res.json()) as ElevenLabsVoicesResponse
  return data.voices.map((v) => ({
    id:         v.voice_id,
    name:       v.name,
    category:   v.category === 'cloned' ? 'cloned' : 'library',
    previewUrl: v.preview_url,
  }))
}

export async function generateSpeech(
  apiKey: string,
  voiceId: string,
  text: string,
  settings?: Partial<VoiceSettings>,
): Promise<Buffer> {
  const merged = { ...DEFAULT_VOICE_SETTINGS, ...settings }
  const res = await fetch(`${ELEVENLABS_BASE}/v1/text-to-speech/${voiceId}`, {
    method:  'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability:        merged.stability,
        similarity_boost: merged.similarity_boost,
        style:            merged.style,
        speed:            merged.speed,
        use_speaker_boost: true,
      },
    }),
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`ElevenLabs TTS error: ${msg.slice(0, 200)}`)
  }
  return Buffer.from(await res.arrayBuffer())
}

export async function cloneVoice(
  apiKey: string,
  audioBuffer: Buffer,
  filename: string,
  mimeType: string,
  name: string,
): Promise<{ voiceId: string; name: string }> {
  const form = new FormData()
  form.append('name', name)
  form.append('files', new Blob([new Uint8Array(audioBuffer)], { type: mimeType }), filename)

  const res = await fetch(`${ELEVENLABS_BASE}/v1/voices/add`, {
    method:  'POST',
    headers: { 'xi-api-key': apiKey },
    body:    form,
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`ElevenLabs clone error: ${msg.slice(0, 200)}`)
  }
  const data = (await res.json()) as { voice_id: string }
  return { voiceId: data.voice_id, name }
}
