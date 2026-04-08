// app/api/elevenlabs/tts/route.ts
// Generates TTS audio via One Auth passthrough, falling back to server-side API key.
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateSpeech } from '@/lib/elevenlabs'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as {
    voiceId?: unknown
    transcript?: unknown
  }
  const { voiceId, transcript } = body

  if (!voiceId || typeof voiceId !== 'string') {
    return NextResponse.json({ error: 'voiceId is required' }, { status: 400 })
  }
  if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
    return NextResponse.json({ error: 'transcript is required' }, { status: 400 })
  }

  const service = createServiceClient()
  let audioBuffer: Buffer | null = null

  // Try One Auth passthrough first
  const secretKey = process.env.ONE_SECRET_KEY
  if (secretKey) {
    const { data: conn } = await service
      .from('user_connections')
      .select('connection_key')
      .eq('user_id', user.id)
      .eq('platform', 'elevenlabs')
      .single()

    if (conn) {
      const ttsRes = await fetch(
        `https://api.withone.ai/v1/passthrough/elevenlabs/v1/text-to-speech/${voiceId}`,
        {
          method:  'POST',
          headers: {
            'Content-Type':         'application/json',
            'x-one-secret':         secretKey,
            'x-one-connection-key': conn.connection_key,
          },
          body: JSON.stringify({
            text:     transcript.trim(),
            model_id: 'eleven_turbo_v2_5',
            voice_settings: {
              stability:        0.5,
              similarity_boost: 0.85,
              use_speaker_boost: true,
            },
          }),
        },
      )
      if (ttsRes.ok) {
        audioBuffer = Buffer.from(await ttsRes.arrayBuffer())
      } else {
        const text = await ttsRes.text()
        console.warn('[elevenlabs/tts] passthrough error, will try fallback:', text.slice(0, 200))
      }
    }
  }

  // Fall back to server-side API key
  if (!audioBuffer) {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ElevenLabs account not connected' }, { status: 400 })
    }
    try {
      audioBuffer = await generateSpeech(apiKey, voiceId, transcript.trim())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'TTS generation failed'
      console.error('[elevenlabs/tts] fallback error:', message)
      return NextResponse.json({ error: message }, { status: 502 })
    }
  }

  const storagePath = `audio/${user.id}/${Date.now()}.mp3`

  // Ensure bucket exists
  await service.storage.createBucket('video-assets', { public: false }).catch(() => {})

  const { error: uploadErr } = await service.storage
    .from('video-assets')
    .upload(storagePath, audioBuffer!, { contentType: 'audio/mpeg', upsert: false })

  if (uploadErr) {
    console.error('[elevenlabs/tts] storage upload error:', uploadErr.message)
    return NextResponse.json({ error: 'Audio upload failed' }, { status: 500 })
  }

  const { data: signedUrl } = await service.storage
    .from('video-assets')
    .createSignedUrl(storagePath, 3600)

  return NextResponse.json({
    audioStoragePath: storagePath,
    audioUrl: signedUrl?.signedUrl ?? null,
  })
}
