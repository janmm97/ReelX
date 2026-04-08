// app/api/connections/save/route.ts
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as {
    platform?: unknown
    connectionKey?: unknown
  }
  const { platform, connectionKey } = body

  if (!platform || typeof platform !== 'string') {
    return NextResponse.json({ error: 'platform is required' }, { status: 400 })
  }
  if (!connectionKey || typeof connectionKey !== 'string') {
    return NextResponse.json({ error: 'connectionKey is required' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service
    .from('user_connections')
    .upsert(
      { user_id: user.id, platform, connection_key: connectionKey },
      { onConflict: 'user_id,platform' },
    )

  if (error) {
    console.error('[connections/save] error:', error.message)
    return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { platform?: unknown }
  if (!body.platform || typeof body.platform !== 'string') {
    return NextResponse.json({ error: 'platform is required' }, { status: 400 })
  }

  const service = createServiceClient()
  await service
    .from('user_connections')
    .delete()
    .eq('user_id', user.id)
    .eq('platform', body.platform)

  return NextResponse.json({ ok: true })
}
