import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { stripe, planFromPriceId, cycleFromPriceId, PLAN_CONFIG, TOPUP_PACKS } from '@/lib/stripe'
import { grantCredits, processRenewal } from '@/lib/credits'
import type Stripe from 'stripe'

// Raw body required for Stripe signature verification
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig  = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid signature'
    console.error('[webhook] signature verification failed:', msg)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const service = createServiceClient()

  try {
    switch (event.type) {

      // ── Subscription created or upgraded ──────────────────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub     = event.data.object as Stripe.Subscription
        const priceId = sub.items.data[0]?.price?.id
        const plan    = planFromPriceId(priceId ?? '')
        const cycle   = cycleFromPriceId(priceId ?? '')

        if (!plan || !cycle) {
          console.warn('[webhook] unrecognised price ID:', priceId)
          break
        }

        const authUserId = sub.metadata?.auth_user_id
        if (!authUserId) {
          // Fall back: look up customer
          const { data: userRow } = await service
            .from('users')
            .select('auth_id')
            .eq('stripe_customer_id', sub.customer as string)
            .single()
          if (!userRow) { console.error('[webhook] cannot find user for customer', sub.customer); break }
          await handleSubscriptionChange(service, userRow.auth_id, sub, plan, cycle, priceId, event.type)
        } else {
          await handleSubscriptionChange(service, authUserId, sub, plan, cycle, priceId, event.type)
        }
        break
      }

      // ── Subscription cancelled / expired ──────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const authUserId = await authUserIdFromSub(service, sub)
        if (!authUserId) break

        await service
          .from('user_subscriptions')
          .update({
            plan:     'free',
            status:   'canceled',
            credits_per_month: 0,
            rollover_max: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', authUserId)

        console.log('[webhook] subscription deleted — downgraded to free:', authUserId)
        break
      }

      // ── Monthly renewal ───────────────────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.billing_reason !== 'subscription_cycle') break

        const subId = (invoice.parent?.subscription_details?.subscription ?? null) as string | null
        if (!subId) break
        const sub = await stripe.subscriptions.retrieve(subId)
        const authUserId = await authUserIdFromSub(service, sub)
        if (!authUserId) break

        const { data: subRow } = await service
          .from('user_subscriptions')
          .select('plan, credits_per_month, rollover_max')
          .eq('user_id', authUserId)
          .single()

        if (!subRow) break

        const newBalance = await processRenewal(
          authUserId,
          subRow.plan,
          subRow.credits_per_month,
          subRow.rollover_max,
        )

        await service
          .from('user_subscriptions')
          .update({
            status: 'active',
            current_period_start: new Date(invoice.period_start * 1000).toISOString(),
            current_period_end:   new Date(invoice.period_end   * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', authUserId)

        console.log(`[webhook] renewal: ${subRow.plan} — ${subRow.credits_per_month} credits, balance now ${newBalance}`)
        break
      }

      // ── One-time payment (top-up pack) ────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.metadata?.type !== 'topup') break

        const authUserId = session.metadata.auth_user_id
        const packId     = session.metadata.pack_id as keyof typeof TOPUP_PACKS
        if (!authUserId || !packId || !TOPUP_PACKS[packId]) break

        const pack = TOPUP_PACKS[packId]
        const paymentIntentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? null

        await grantCredits(
          authUserId,
          pack.credits,
          'topup',
          `Top-up: ${pack.label} (${pack.credits} credits)`,
          paymentIntentId ?? undefined,
        )

        console.log(`[webhook] topup: ${pack.label} — ${pack.credits} credits for ${authUserId}`)
        break
      }

      // ── Payment failed ────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = (invoice.parent?.subscription_details?.subscription ?? null) as string | null
        if (!subId) break
        const sub = await stripe.subscriptions.retrieve(subId)
        const authUserId = await authUserIdFromSub(service, sub)
        if (!authUserId) break

        await service
          .from('user_subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('user_id', authUserId)

        console.warn('[webhook] payment failed — status set to past_due:', authUserId)
        break
      }

      default:
        // Acknowledge unhandled events
        break
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Webhook handler error'
    console.error('[webhook] error handling event', event.type, ':', msg)
    // Return 200 to prevent Stripe retrying — internal errors are logged
    return NextResponse.json({ received: true, error: msg })
  }

  return NextResponse.json({ received: true })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function authUserIdFromSub(
  service: ReturnType<typeof createServiceClient>,
  sub: Stripe.Subscription,
): Promise<string | null> {
  if (sub.metadata?.auth_user_id) return sub.metadata.auth_user_id
  const { data } = await service
    .from('users')
    .select('auth_id')
    .eq('stripe_customer_id', sub.customer as string)
    .single()
  return data?.auth_id ?? null
}

async function handleSubscriptionChange(
  service:     ReturnType<typeof createServiceClient>,
  authUserId:  string,
  sub:         Stripe.Subscription,
  plan:        string,
  cycle:       string,
  priceId:     string,
  eventType:   string,
) {
  const planConfig = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG]
  if (!planConfig) return

  const isNew = eventType === 'customer.subscription.created'

  await service
    .from('user_subscriptions')
    .upsert(
      {
        user_id:              authUserId,
        plan,
        billing_cycle:        cycle,
        credits_per_month:    planConfig.credits,
        rollover_max:         planConfig.rollover,
        status:               sub.status === 'active' ? 'active' : sub.status,
        stripe_subscription_id: sub.id,
        stripe_price_id:      priceId,
        current_period_start: sub.items.data[0]?.current_period_start
          ? new Date(sub.items.data[0].current_period_start * 1000).toISOString()
          : new Date(sub.billing_cycle_anchor * 1000).toISOString(),
        current_period_end: sub.items.data[0]?.current_period_end
          ? new Date(sub.items.data[0].current_period_end * 1000).toISOString()
          : null,
        updated_at:           new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

  // Grant initial credits on new subscription or upgrade
  if (isNew && planConfig.credits > 0) {
    await grantCredits(
      authUserId,
      planConfig.credits,
      'subscription_grant',
      `Initial credit grant: ${plan} plan`,
    )
  }

  console.log(`[webhook] subscription ${eventType}: ${plan} (${cycle}) for ${authUserId}`)
}
