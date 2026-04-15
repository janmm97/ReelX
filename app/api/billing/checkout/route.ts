import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICES, getOrCreateStripeCustomer } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as {
    priceKey?: unknown
  }
  const { priceKey } = body

  if (!priceKey || typeof priceKey !== 'string' || !STRIPE_PRICES[priceKey]) {
    return NextResponse.json({ error: 'Invalid priceKey' }, { status: 400 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
  }

  const service   = createServiceClient()
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? request.headers.get('origin') ?? ''
  const priceId   = STRIPE_PRICES[priceKey]
  const isTopup   = priceKey.startsWith('topup_')
  const packId    = isTopup ? priceKey.replace('topup_', '') : null

  const customerId = await getOrCreateStripeCustomer(user.id, user.email!, service)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode:     isTopup ? 'payment' : 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?billing=success`,
    cancel_url:  `${appUrl}/pricing?billing=cancelled`,
    metadata: {
      auth_user_id: user.id,
      ...(isTopup ? { type: 'topup', pack_id: packId! } : { type: 'subscription' }),
    },
    // For subscriptions, collect payment method upfront and use it for renewals
    ...(isTopup ? {} : {
      subscription_data: {
        metadata: { auth_user_id: user.id },
      },
    }),
  })

  return NextResponse.json({ url: session.url })
}
