// lib/elevenlabs.ts
const ELEVENLABS_BASE = 'https://api.elevenlabs.io'

export interface Voice {
  id: string
  name: string
  category: 'library' | 'cloned'
  previewUrl: string
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
): Promise<Buffer> {
  const res = await fetch(`${ELEVENLABS_BASE}/v1/text-to-speech/${voiceId}`, {
    method:  'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }),
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
