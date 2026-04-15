-- ── Credit system schema ──────────────────────────────────────────────────────
-- model_credit_costs: admin-configurable per-model credit prices.
-- Stored in DB (not hardcoded) so costs can be updated without a redeploy.

CREATE TABLE IF NOT EXISTS model_credit_costs (
  model_key    TEXT PRIMARY KEY,
  credits      INTEGER NOT NULL CHECK (credits > 0),
  tier         TEXT NOT NULL CHECK (tier IN ('free', 'standard', 'premium', 'ultra-premium')),
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Seed: image models (via OpenRouter) ──────────────────────────────────────
-- Costs derived from codebase annotations in app/api/generate/route.ts.
-- 1 credit = $0.001. Credit costs rounded up ~5-10% over raw API cost.

INSERT INTO model_credit_costs (model_key, credits, tier) VALUES
  ('flux2klein',           4,   'free'),
  ('riverflowfast',        5,   'standard'),
  ('riverflowfastpreview', 8,   'standard'),
  ('flux2pro',             8,   'standard'),
  ('gpt5mini',             9,   'standard'),
  ('riverflowstandard',    9,   'standard'),
  ('seedream',             10,  'standard'),
  ('flux2flex',            15,  'standard'),
  ('flux2max',             18,  'standard'),
  ('riverflowmax',         18,  'standard'),
  ('gemini25flash',        32,  'premium'),
  ('riverflowp',           38,  'premium'),
  ('gpt5',                 42,  'premium'),
  ('gemini',               64,  'premium'),
  ('gemini3pro',           128, 'ultra-premium')
ON CONFLICT (model_key) DO UPDATE
  SET credits = EXCLUDED.credits,
      tier    = EXCLUDED.tier,
      updated_at = NOW();

-- ── Seed: video models (via kie.ai) ──────────────────────────────────────────
-- ⚠️  All video costs are ESTIMATED from kie.ai market rates Q1 2026.
-- Validate against actual kie.ai invoices before launch and update here.
-- Costs cover a standard 5-second / 720p clip.
-- Long-video generations multiply by ceil(total_seconds / 10).

INSERT INTO model_credit_costs (model_key, credits, tier) VALUES
  -- T2V free-eligible
  ('bytedance_v1_lite',       100, 'free'),
  ('bytedance_v1_lite_i2v',   100, 'free'),
  -- T2V standard
  ('wan26',                   120, 'standard'),
  ('wan26_flash',             120, 'standard'),
  ('wan26_i2v',               160, 'standard'),
  ('bytedance_v1_pro',        160, 'standard'),
  ('bytedance_v1_pro_i2v',    160, 'standard'),
  ('wan27',                   180, 'standard'),
  ('wan27_i2v',               180, 'standard'),
  ('kling25_turbo',           200, 'standard'),
  ('kling25_turbo_i2v',       200, 'standard'),
  ('seedance2_fast',          200, 'standard'),
  ('hailuo_std',              200, 'standard'),
  ('hailuo23_std',            200, 'standard'),
  ('grok_t2v',                220, 'standard'),
  ('grok',                    220, 'standard'),
  ('kling21_std',             250, 'standard'),
  ('kling21_i2v',             250, 'standard'),
  ('seedance2',               300, 'standard'),
  ('seedance15_pro_i2v',      300, 'standard'),
  -- T2V / I2V premium
  ('seedance15_pro',          300, 'premium'),
  ('hailuo_pro',              300, 'premium'),
  ('hailuo23_pro',            300, 'premium'),
  ('hailuo_std_i2v',          300, 'premium'),
  ('hailuo23_std_i2v',        300, 'premium'),
  ('hailuo_pro_i2v',          350, 'premium'),
  ('hailuo23_pro_i2v',        350, 'premium'),
  ('kling21_pro',             350, 'premium'),
  ('kling26',                 400, 'premium'),
  ('runway_turbo',            400, 'premium'),
  -- T2V / I2V ultra-premium
  ('sora2',                   500, 'ultra-premium'),
  ('sora2_i2v',               500, 'ultra-premium'),
  ('runway_aleph',            550, 'ultra-premium'),
  ('kling3',                  550, 'ultra-premium'),
  ('kling3_audio',            650, 'ultra-premium'),
  ('kling3_i2v',              550, 'ultra-premium'),
  ('kling3_audio_i2v',        650, 'ultra-premium'),
  ('veo3_lite',               650, 'ultra-premium'),
  ('sora2_pro',               750, 'ultra-premium'),
  ('sora2_audio',             750, 'ultra-premium'),
  ('sora2_pro_i2v',           750, 'ultra-premium'),
  ('veo3_fast',               900, 'ultra-premium'),
  ('veo3_fast_i2v',           900, 'ultra-premium'),
  ('veo3',                   1200, 'ultra-premium'),
  ('veo3_audio',             1500, 'ultra-premium'),
  ('veo3_i2v',               1200, 'ultra-premium')
ON CONFLICT (model_key) DO UPDATE
  SET credits = EXCLUDED.credits,
      tier    = EXCLUDED.tier,
      updated_at = NOW();

-- ── Subscription plan definitions ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                  TEXT NOT NULL CHECK (plan IN ('free', 'creator', 'pro', 'premium', 'enterprise')),
  billing_cycle         TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual', 'custom')),
  credits_per_month     INTEGER NOT NULL DEFAULT 0,
  rollover_max          INTEGER NOT NULL DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  current_period_end    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  stripe_subscription_id TEXT,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status  ON user_subscriptions(status);

-- ── Credit transactions (append-only ledger) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS credit_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount          INTEGER NOT NULL,  -- positive = credit in, negative = debit
  balance_after   INTEGER NOT NULL,  -- denormalised snapshot for fast audit
  type            TEXT NOT NULL
                    CHECK (type IN (
                      'subscription_grant',  -- monthly credit allocation
                      'rollover',            -- carried credits from prior period
                      'topup',               -- à la carte pack purchase
                      'generation',          -- credit consumed by a generation
                      'refund',              -- reversed failed generation
                      'admin_adjustment'     -- manual correction
                    )),
  model_key       TEXT REFERENCES model_credit_costs(model_key) ON DELETE SET NULL,
  generation_id   UUID,              -- FK to images.id or videos.id (cross-table, no FK constraint)
  generation_type TEXT CHECK (generation_type IN ('image', 'video', NULL)),
  notes           TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user_id    ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_tx_type       ON credit_transactions(type);

-- ── Current balance view ──────────────────────────────────────────────────────
-- Summing the full ledger on every read is expensive at scale.
-- Use this view for reporting/admin. For real-time checks, maintain
-- a denormalised balance column on users (updated via trigger or app logic).

CREATE OR REPLACE VIEW user_credit_balances AS
SELECT
  user_id,
  SUM(amount) AS balance
FROM credit_transactions
GROUP BY user_id;

-- ── Top-up packs reference table ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS credit_topup_packs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  credits      INTEGER NOT NULL CHECK (credits > 0),
  price_usd    NUMERIC(10, 2) NOT NULL CHECK (price_usd > 0),
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO credit_topup_packs (name, credits, price_usd) VALUES
  ('Spark',  500,   1.49),
  ('Boost',  2000,  4.99),
  ('Power',  6000,  12.99),
  ('Studio', 15000, 29.99)
ON CONFLICT DO NOTHING;

-- ── Tier model access policy ─────────────────────────────────────────────────
-- Enforced at the application layer (API routes check this before deducting
-- credits). This table makes the policy inspectable and patchable without code.

CREATE TABLE IF NOT EXISTS plan_model_access (
  plan       TEXT NOT NULL CHECK (plan IN ('free', 'creator', 'pro', 'premium', 'enterprise')),
  max_tier   TEXT NOT NULL CHECK (max_tier IN ('free', 'standard', 'premium', 'ultra-premium')),
  PRIMARY KEY (plan)
);

INSERT INTO plan_model_access (plan, max_tier) VALUES
  ('free',       'free'),
  ('creator',    'standard'),
  ('pro',        'premium'),
  ('premium',    'ultra-premium'),
  ('enterprise', 'ultra-premium')
ON CONFLICT (plan) DO UPDATE SET max_tier = EXCLUDED.max_tier;

-- ── Free tier hard caps (separate from credit wallet) ────────────────────────

CREATE TABLE IF NOT EXISTS free_tier_usage (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start     TIMESTAMP WITH TIME ZONE NOT NULL,
  images_used      INTEGER NOT NULL DEFAULT 0,
  videos_used      INTEGER NOT NULL DEFAULT 0,
  images_cap       INTEGER NOT NULL DEFAULT 50,
  videos_cap       INTEGER NOT NULL DEFAULT 3
);

CREATE INDEX IF NOT EXISTS idx_free_tier_usage_user_id ON free_tier_usage(user_id);
