import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

// ── Plan configuration ────────────────────────────────────────────────────────
// credits_per_month / rollover_max must stay in sync with the DB seed in
// 20260409_credit_system.sql and the plan_model_access table.

export const PLAN_CONFIG = {
  free:       { credits: 0,      rollover: 0,     label: 'Free'       },
  creator:    { credits: 2_000,  rollover: 0,     label: 'Creator'    },
  pro:        { credits: 5_000,  rollover: 0,     label: 'Pro'        },
  premium:    { credits: 10_000, rollover: 2_500, label: 'Premium'    },
  enterprise: { credits: 0,      rollover: 0,     label: 'Enterprise' },
} as const

export type Plan = keyof typeof PLAN_CONFIG

// ── Stripe price IDs ──────────────────────────────────────────────────────────
// Create these products/prices in your Stripe dashboard and set the env vars.
// All six subscription prices + four top-up pack prices.

export const STRIPE_PRICES: Record<string, string> = {
  creator_monthly:  process.env.STRIPE_PRICE_CREATOR_MONTHLY  ?? '',
  creator_annual:   process.env.STRIPE_PRICE_CREATOR_ANNUAL   ?? '',
  pro_monthly:      process.env.STRIPE_PRICE_PRO_MONTHLY      ?? '',
  pro_annual:       process.env.STRIPE_PRICE_PRO_ANNUAL       ?? '',
  premium_monthly:  process.env.STRIPE_PRICE_PREMIUM_MONTHLY  ?? '',
  premium_annual:   process.env.STRIPE_PRICE_PREMIUM_ANNUAL   ?? '',
  topup_spark:      process.env.STRIPE_PRICE_TOPUP_SPARK      ?? '',
  topup_boost:      process.env.STRIPE_PRICE_TOPUP_BOOST      ?? '',
  topup_power:      process.env.STRIPE_PRICE_TOPUP_POWER      ?? '',
  topup_studio:     process.env.STRIPE_PRICE_TOPUP_STUDIO     ?? '',
}

export type TopupPackId = 'spark' | 'boost' | 'power' | 'studio'

export const TOPUP_PACKS: Record<TopupPackId, { credits: number; priceUsd: number; label: string }> = {
  spark:  { credits: 500,    priceUsd: 1.49,  label: 'Spark'  },
  boost:  { credits: 2_000,  priceUsd: 4.99,  label: 'Boost'  },
  power:  { credits: 6_000,  priceUsd: 12.99, label: 'Power'  },
  studio: { credits: 15_000, priceUsd: 29.99, label: 'Studio' },
}

/** Resolve which plan a Stripe price ID belongs to. */
export function planFromPriceId(priceId: string): Plan | null {
  for (const [key, id] of Object.entries(STRIPE_PRICES)) {
    if (id === priceId && !key.startsWith('topup_')) {
      return key.split('_')[0] as Plan
    }
  }
  return null
}

/** Resolve which billing cycle a Stripe price ID is for. */
export function cycleFromPriceId(priceId: string): 'monthly' | 'annual' | null {
  for (const [key, id] of Object.entries(STRIPE_PRICES)) {
    if (id === priceId) {
      if (key.endsWith('_monthly')) return 'monthly'
      if (key.endsWith('_annual'))  return 'annual'
    }
  }
  return null
}

/** Get or create a Stripe customer for a user. Updates the users table with the customer ID. */
export async function getOrCreateStripeCustomer(
  authUserId: string,
  email: string,
  supabaseService: ReturnType<typeof import('@/lib/supabase/server').createServiceClient>,
): Promise<string> {
  // Check for existing customer ID
  const { data: userRow } = await supabaseService
    .from('users')
    .select('stripe_customer_id')
    .eq('auth_id', authUserId)
    .single()

  if (userRow?.stripe_customer_id) return userRow.stripe_customer_id

  // Create new customer in Stripe
  const customer = await stripe.customers.create({
    email,
    metadata: { auth_user_id: authUserId },
  })

  // Persist to users table
  await supabaseService
    .from('users')
    .update({ stripe_customer_id: customer.id })
    .eq('auth_id', authUserId)

  return customer.id
}
