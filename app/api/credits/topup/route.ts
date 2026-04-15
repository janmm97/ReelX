import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { stripe, TOPUP_PACKS, STRIPE_PRICES, getOrCreateStripeCustomer } from '@/lib/stripe'
import type { TopupPackId } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { packId?: unknown }
  const packId = body.packId as TopupPackId | undefined

  if (!packId || !TOPUP_PACKS[packId]) {
    return NextResponse.json(
      { error: `Invalid packId. Must be one of: ${Object.keys(TOPUP_PACKS).join(', ')}` },
      { status: 400 },
    )
  }

  const priceId = STRIPE_PRICES[`topup_${packId}`]
  if (!priceId) {
    return NextResponse.json({ error: `Stripe price not configured for pack: ${packId}` }, { status: 503 })
  }

  const service    = createServiceClient()
  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? request.headers.get('origin') ?? ''
  const customerId = await getOrCreateStripeCustomer(user.id, user.email!, service)
  const pack       = TOPUP_PACKS[packId]

  const session = await stripe.checkout.sessions.create({
    customer:   customerId,
    mode:       'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?topup=success&pack=${packId}`,
    cancel_url:  `${appUrl}/dashboard?topup=cancelled`,
    metadata: {
      auth_user_id: user.id,
      type:         'topup',
      pack_id:      packId,
    },
  })

  return NextResponse.json({
    url:     session.url,
    pack:    { id: packId, label: pack.label, credits: pack.credits, price_usd: pack.priceUsd },
  })
}
