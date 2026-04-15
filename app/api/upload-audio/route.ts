// app/api/upload-audio/route.ts
// Uploads a user-supplied audio file to the private video-assets bucket.
// Returns { audioStoragePath, audioUrl } — same shape as /api/elevenlabs/tts
// so the rest of the video pipeline works unchanged.
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

const ALLOWED_TYPES = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'audio/mp4',
  'audio/ogg',
])

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await request.formData()
  const file = form.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Unsupported format. Allowed: MPEG, WAV, AAC, MP4, OGG.' },
      { status: 400 },
    )
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File must be under 10 MB.' }, { status: 400 })
  }

  const service = createServiceClient()
  await service.storage.createBucket('video-assets', { public: false }).catch(() => {})

  const ext          = file.name.split('.').pop() ?? 'mp3'
  const storagePath  = `audio/${user.id}/${Date.now()}.${ext}`
  const buf          = Buffer.from(await file.arrayBuffer())

  const { error: upErr } = await service.storage
    .from('video-assets')
    .upload(storagePath, buf, { contentType: file.type, upsert: false })

  if (upErr) {
    console.error('[upload-audio] storage error:', upErr.message)
    return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 })
  }

  const { data: signed } = await service.storage
    .from('video-assets')
    .createSignedUrl(storagePath, 3600)

  return NextResponse.json({
    audioStoragePath: storagePath,
    audioUrl:         signed?.signedUrl ?? null,
  })
}
