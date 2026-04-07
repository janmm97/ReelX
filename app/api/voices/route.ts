// app/api/voices/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { fetchVoices } from '@/lib/elevenlabs'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 })
  }

  try {
    const voices = await fetchVoices(apiKey)
    return NextResponse.json(
      { voices },
      { headers: { 'Cache-Control': 's-maxage=60' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch voices'
    console.error('[voices] error:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
