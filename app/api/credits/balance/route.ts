import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const [userResult, subResult] = await Promise.all([
    service.from('users').select('credit_balance').eq('auth_id', user.id).single(),
    service
      .from('user_subscriptions')
      .select('plan, billing_cycle, credits_per_month, rollover_max, status, current_period_end')
      .eq('user_id', user.id)
      .single(),
  ])

  return NextResponse.json({
    balance:         userResult.data?.credit_balance ?? 0,
    plan:            subResult.data?.plan            ?? 'free',
    billing_cycle:   subResult.data?.billing_cycle   ?? 'monthly',
    credits_per_month: subResult.data?.credits_per_month ?? 0,
    rollover_max:    subResult.data?.rollover_max    ?? 0,
    status:          subResult.data?.status          ?? 'active',
    period_ends_at:  subResult.data?.current_period_end ?? null,
  })
}
