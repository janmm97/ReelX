// app/api/voice-clone/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cloneVoice } from '@/lib/elevenlabs'

const ALLOWED_TYPES = new Set(['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/m4a'])
const MAX_SIZE      = 25 * 1024 * 1024 // 25 MB

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 })
  }

  const formData = await request.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })

  const audioFile = formData.get('audio') as File | null
  const name      = formData.get('name') as string | null

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  if (!audioFile || audioFile.size === 0) {
    return NextResponse.json({ error: 'audio file is required' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(audioFile.type)) {
    return NextResponse.json({ error: 'Only mp3, wav, and m4a are supported' }, { status: 400 })
  }
  if (audioFile.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Audio file must be under 25 MB' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await audioFile.arrayBuffer())
    const result = await cloneVoice(apiKey, buffer, audioFile.name, audioFile.type, name.trim())
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Voice cloning failed'
    console.error('[voice-clone] error:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
