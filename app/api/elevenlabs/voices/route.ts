// app/api/elevenlabs/voices/route.ts
// source=free  → voices from the app's ELEVENLABS_API_KEY (always available)
// source=user  → voices from the user's own connected ElevenLabs account via One Auth
//                returns { voices: [], connected: false } when the user hasn't connected
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { fetchVoices } from '@/lib/elevenlabs'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const source = req.nextUrl.searchParams.get('source') ?? 'free'

  // ── User's own ElevenLabs account (via One Auth) ──────────────────────────
  if (source === 'user') {
    const secretKey = process.env.ONE_SECRET_KEY
    if (!secretKey) return NextResponse.json({ voices: [], connected: false })

    const service = createServiceClient()
    const { data: conn } = await service
      .from('user_connections')
      .select('connection_key')
      .eq('user_id', user.id)
      .eq('platform', 'elevenlabs')
      .single()

    if (!conn) return NextResponse.json({ voices: [], connected: false })

    const res = await fetch(
      'https://api.withone.ai/v1/passthrough/elevenlabs/v1/voices',
      {
        headers: {
          'x-one-secret':         secretKey,
          'x-one-connection-key': conn.connection_key,
        },
      },
    )
    if (!res.ok) return NextResponse.json({ voices: [], connected: false })

    const data = (await res.json()) as {
      voices: Array<{ voice_id: string; name: string; category: string; preview_url: string }>
    }
    const voices = data.voices.map((v) => ({
      voiceId:    v.voice_id,
      name:       v.name,
      category:   v.category === 'cloned' ? 'cloned' : 'library',
      previewUrl: v.preview_url,
    }))
    return NextResponse.json({ voices, connected: true })
  }

  // ── Free voices via the app's ELEVENLABS_API_KEY (default) ────────────────
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ElevenLabs not configured' }, { status: 500 })
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
    console.error('[elevenlabs/voices] error:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
