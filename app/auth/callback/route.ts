import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  const { user } = data.session
  const serviceClient = createServiceClient()

  await serviceClient.from('users').upsert(
    {
      auth_id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    },
    { onConflict: 'auth_id' }
  )

  const createdAt = new Date(user.created_at).getTime()
  const isNewUser = Date.now() - createdAt < 60_000
  const destination = isNewUser ? `${origin}/dashboard?welcome=true` : `${origin}${next}`
  return NextResponse.redirect(destination)
}
