import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // Look up internal user id
  const { data: dbUser } = await service
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (dbUser) {
    // Soft-delete all user data
    await Promise.allSettled([
      service.from('images').update({ hidden: true }).eq('user_id', dbUser.id),
      service.from('videos').delete().eq('user_id', dbUser.id),
    ])
    // Remove user row (cascades to subscriptions etc.)
    await service.from('users').delete().eq('id', dbUser.id)
  }

  // Delete auth user — this requires service role
  const { error } = await service.auth.admin.deleteUser(user.id)
  if (error) {
    return NextResponse.json({ error: 'Could not delete account. Please contact support.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
