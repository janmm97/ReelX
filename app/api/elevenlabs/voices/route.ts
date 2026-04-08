// app/api/elevenlabs/voices/route.ts
// Returns voices for the connected ElevenLabs account.
// Falls back to server-side ELEVENLABS_API_KEY when no One Auth connection exists.
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { fetchVoices } from '@/lib/elevenlabs'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Try One Auth passthrough first
  const secretKey = process.env.ONE_SECRET_KEY
  if (secretKey) {
    const service = createServiceClient()
    const { data: conn } = await service
      .from('user_connections')
      .select('connection_key')
      .eq('user_id', user.id)
      .eq('platform', 'elevenlabs')
      .single()

    if (conn) {
      const res = await fetch(
        'https://api.withone.ai/v1/passthrough/elevenlabs/v1/voices',
        {
          headers: {
            'x-one-secret':         secretKey,
            'x-one-connection-key': conn.connection_key,
          },
        },
      )
      if (res.ok) {
        const data = (await res.json()) as {
          voices: Array<{ voice_id: string; name: string; category: string; preview_url: string }>
        }
        const voices = data.voices.map((v) => ({
          voiceId:    v.voice_id,
          name:       v.name,
          category:   v.category === 'cloned' ? 'cloned' : 'library',
          previewUrl: v.preview_url,
        }))
        return NextResponse.json({ voices })
      }
    }
  }

  // Fall back to server-side API key
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ElevenLabs account not connected. Connect it first.' },
      { status: 400 },
    )
  }

  try {
    const raw    = await fetchVoices(apiKey)
    const voices = raw.map((v) => ({
      voiceId:    v.id,
      name:       v.name,
      category:   v.category,
      previewUrl: v.previewUrl,
    }))
    return NextResponse.json({ voices })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch voices'
    console.error('[elevenlabs/voices] fallback error:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
