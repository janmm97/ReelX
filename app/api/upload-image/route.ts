// app/api/upload-image/route.ts
// Uploads an image using the service client (bypasses storage RLS).
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await request.formData()
  const file = form.get('file') as File | null
  const prefix = (form.get('prefix') as string | null) ?? 'studio'

  if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 })

  const service = createServiceClient()
  await service.storage.createBucket('uploads', { public: true }).catch(() => {})

  const storagePath = `${prefix}/${user.id}/${Date.now()}-${file.name}`
  const buf = Buffer.from(await file.arrayBuffer())

  const { error: upErr } = await service.storage
    .from('uploads')
    .upload(storagePath, buf, { contentType: file.type, upsert: true })

  if (upErr) {
    return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 })
  }

  const { data } = service.storage.from('uploads').getPublicUrl(storagePath)
  return NextResponse.json({ publicUrl: data.publicUrl })
}
