import { createServiceClient } from '@/lib/supabase/server'

// ── Tier ordering ─────────────────────────────────────────────────────────────
const TIER_ORDER = { free: 0, standard: 1, premium: 2, 'ultra-premium': 3 } as const
type Tier = keyof typeof TIER_ORDER

const PLAN_MAX_TIER: Record<string, Tier> = {
  free:       'free',
  creator:    'standard',
  pro:        'premium',
  premium:    'ultra-premium',
  enterprise: 'ultra-premium',
}

// Free tier: only these model keys are allowed without a credit wallet
export const FREE_IMAGE_MODEL   = 'flux2klein'
export const FREE_VIDEO_MODELS  = new Set(['bytedance_v1_lite', 'bytedance_v1_lite_i2v'])

// ── Basic reads ───────────────────────────────────────────────────────────────

export async function getBalance(authUserId: string): Promise<number> {
  const service = createServiceClient()
  const { data } = await service
    .from('users')
    .select('credit_balance')
    .eq('auth_id', authUserId)
    .single()
  return data?.credit_balance ?? 0
}

export async function getUserSub(authUserId: string) {
  const service = createServiceClient()
  const { data } = await service
    .from('user_subscriptions')
    .select('plan, billing_cycle, credits_per_month, rollover_max, status, current_period_end')
    .eq('user_id', authUserId)
    .single()
  return data
}

export async function getModelCost(
  modelKey: string,
): Promise<{ credits: number; tier: Tier } | null> {
  const service = createServiceClient()
  const { data } = await service
    .from('model_credit_costs')
    .select('credits, tier')
    .eq('model_key', modelKey)
    .single()
  return data as { credits: number; tier: Tier } | null
}

// ── Affordability check ───────────────────────────────────────────────────────

export type AffordResult =
  | { ok: true;  credits: number }
  | { ok: false; reason: 'model_unknown' | 'no_plan' | 'upgrade_required' | 'insufficient_credits' }

/** Check whether a paid-tier user can afford a model (tier access + balance). */
export async function canAfford(
  authUserId: string,
  modelKey:  string,
): Promise<AffordResult> {
  const service = createServiceClient()

  const [subResult, modelResult, userResult] = await Promise.all([
    service.from('user_subscriptions').select('plan, status').eq('user_id', authUserId).single(),
    service.from('model_credit_costs').select('credits, tier').eq('model_key', modelKey).single(),
    service.from('users').select('credit_balance').eq('auth_id', authUserId).single(),
  ])

  if (!modelResult.data) return { ok: false, reason: 'model_unknown' }
  if (!subResult.data)   return { ok: false, reason: 'no_plan' }

  const plan        = subResult.data.plan as string
  const modelTier   = modelResult.data.tier as Tier
  const planMaxTier = PLAN_MAX_TIER[plan] ?? 'free'

  if (TIER_ORDER[modelTier] > TIER_ORDER[planMaxTier]) {
    return { ok: false, reason: 'upgrade_required' }
  }

  const balance = userResult.data?.credit_balance ?? 0
  if (balance < modelResult.data.credits) {
    return { ok: false, reason: 'insufficient_credits' }
  }

  return { ok: true, credits: modelResult.data.credits }
}

/** Variant for multi-clip jobs (long video): checks a known total amount. */
export async function canAffordAmount(
  authUserId: string,
  amount:     number,
  modelKey:   string,
): Promise<AffordResult> {
  const service = createServiceClient()

  const [subResult, modelResult, userResult] = await Promise.all([
    service.from('user_subscriptions').select('plan, status').eq('user_id', authUserId).single(),
    service.from('model_credit_costs').select('credits, tier').eq('model_key', modelKey).single(),
    service.from('users').select('credit_balance').eq('auth_id', authUserId).single(),
  ])

  if (!modelResult.data) return { ok: false, reason: 'model_unknown' }
  if (!subResult.data)   return { ok: false, reason: 'no_plan' }

  const plan        = subResult.data.plan as string
  const modelTier   = modelResult.data.tier as Tier
  const planMaxTier = PLAN_MAX_TIER[plan] ?? 'free'

  if (TIER_ORDER[modelTier] > TIER_ORDER[planMaxTier]) {
    return { ok: false, reason: 'upgrade_required' }
  }

  const balance = userResult.data?.credit_balance ?? 0
  if (balance < amount) {
    return { ok: false, reason: 'insufficient_credits' }
  }

  return { ok: true, credits: amount }
}

export type AffordFailReason = 'model_unknown' | 'no_plan' | 'upgrade_required' | 'insufficient_credits'

export function affordErrorMessage(reason: AffordFailReason): string {
  const msgs: Record<string, string> = {
    model_unknown:        'Unknown model selected.',
    no_plan:              'No active subscription found.',
    upgrade_required:     'Your plan does not include this model. Upgrade to unlock it.',
    insufficient_credits: 'Not enough credits. Purchase a top-up pack or upgrade your plan.',
  }
  return msgs[reason] ?? 'Credit check failed.'
}

// ── Atomic credit operations (via Postgres functions) ─────────────────────────

/** Deduct credits for a single-model generation. Returns new balance. */
export async function deductCredits(
  authUserId:     string,
  modelKey:       string,
  generationId:   string,
  generationType: 'image' | 'video',
): Promise<number> {
  const cost = await getModelCost(modelKey)
  if (!cost) throw new Error(`Unknown model: ${modelKey}`)
  return deductCreditsAmount(authUserId, cost.credits, modelKey, generationId, generationType)
}

/** Deduct a specific credit amount (used for multi-clip long video). Returns new balance. */
export async function deductCreditsAmount(
  authUserId:     string,
  amount:         number,
  modelKey:       string,
  generationId:   string,
  generationType: 'image' | 'video',
): Promise<number> {
  const service = createServiceClient()
  const { data, error } = await service.rpc('deduct_credits', {
    p_user_auth_id:  authUserId,
    p_amount:        amount,
    p_model_key:     modelKey,
    p_generation_id: generationId,
    p_gen_type:      generationType,
  })
  if (error) throw new Error(error.message)
  return data as number
}

/** Refund credits for a failed generation. Fire-and-forget safe. */
export async function refundCreditsAmount(
  authUserId:     string,
  amount:         number,
  generationId:   string,
  generationType: 'image' | 'video',
): Promise<void> {
  const service = createServiceClient()
  await service.rpc('grant_credits', {
    p_user_auth_id: authUserId,
    p_amount:       amount,
    p_type:         'refund',
    p_notes:        `Refund: failed ${generationType} ${generationId}`,
  })
}

/** Grant credits (used by Stripe webhook). Returns new balance. */
export async function grantCredits(
  authUserId:    string,
  amount:        number,
  type:          'subscription_grant' | 'rollover' | 'topup' | 'admin_adjustment',
  notes?:        string,
  stripePaymentIntentId?: string,
): Promise<number> {
  const service = createServiceClient()
  const { data, error } = await service.rpc('grant_credits', {
    p_user_auth_id: authUserId,
    p_amount:       amount,
    p_type:         type,
    p_notes:        notes ?? null,
    p_payment_id:   stripePaymentIntentId ?? null,
  })
  if (error) throw new Error(error.message)
  return data as number
}

/** Monthly renewal: apply rollover cap then grant new credits. Returns new balance. */
export async function processRenewal(
  authUserId:     string,
  plan:           string,
  monthlyCredits: number,
  rolloverMax:    number,
): Promise<number> {
  const service = createServiceClient()
  const { data, error } = await service.rpc('process_subscription_renewal', {
    p_user_auth_id:    authUserId,
    p_plan:            plan,
    p_monthly_credits: monthlyCredits,
    p_rollover_max:    rolloverMax,
  })
  if (error) throw new Error(error.message)
  return data as number
}

// ── Free tier hard cap tracking ───────────────────────────────────────────────

/**
 * Check and increment the free-tier usage counter for images or videos.
 * Resets counters if the stored period is from a prior month.
 * Returns { ok: true } if the generation is allowed.
 */
export async function checkAndIncrementFreeCap(
  authUserId: string,
  type:       'image' | 'video',
): Promise<{ ok: boolean; used: number; cap: number }> {
  const service = createServiceClient()

  const periodStart = new Date()
  periodStart.setDate(1)
  periodStart.setHours(0, 0, 0, 0)

  // Ensure row exists
  await service.from('free_tier_usage').upsert(
    { user_id: authUserId, period_start: periodStart.toISOString() },
    { onConflict: 'user_id', ignoreDuplicates: true },
  )

  const { data } = await service
    .from('free_tier_usage')
    .select('period_start, images_used, videos_used, images_cap, videos_cap')
    .eq('user_id', authUserId)
    .single()

  if (!data) return { ok: false, used: 0, cap: 0 }

  // Reset if new billing month
  const storedPeriod = new Date(data.period_start)
  if (storedPeriod < periodStart) {
    await service
      .from('free_tier_usage')
      .update({ period_start: periodStart.toISOString(), images_used: 0, videos_used: 0 })
      .eq('user_id', authUserId)
    data.images_used = 0
    data.videos_used = 0
  }

  const used = type === 'image' ? data.images_used : data.videos_used
  const cap  = type === 'image' ? data.images_cap  : data.videos_cap

  if (used >= cap) return { ok: false, used, cap }

  // Increment (small TOCTOU risk, acceptable for free tier soft limits)
  const col = type === 'image' ? 'images_used' : 'videos_used'
  await service
    .from('free_tier_usage')
    .update({ [col]: used + 1 })
    .eq('user_id', authUserId)

  return { ok: true, used, cap }
}
