-- ── Billing augments (additive — depends on 20260409_credit_system) ─────────

-- 1. Augment the users profile table (created in the dashboard, not via migration)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS credit_balance      INTEGER NOT NULL DEFAULT 0;

-- 2. Track credit cost on each generation row
ALTER TABLE images ADD COLUMN IF NOT EXISTS credits_charged INTEGER;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS credits_charged INTEGER;

-- 3. Stripe traceability on subscription + transaction tables
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

ALTER TABLE credit_transactions
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

ALTER TABLE credit_topup_packs
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- 4. Add InfinitaTalk per-chunk model cost
INSERT INTO model_credit_costs (model_key, credits, tier) VALUES
  ('infinitalk_chunk', 50, 'standard')
ON CONFLICT (model_key) DO UPDATE
  SET credits    = EXCLUDED.credits,
      tier       = EXCLUDED.tier,
      updated_at = NOW();

-- ── Postgres functions (atomic, avoids race conditions) ───────────────────────

-- Atomically deduct credits and record the transaction
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_auth_id  UUID,
  p_amount        INTEGER,
  p_model_key     TEXT,
  p_generation_id UUID,
  p_gen_type      TEXT
) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  v_balance       INTEGER;
  v_balance_after INTEGER;
BEGIN
  SELECT credit_balance INTO v_balance
  FROM   users
  WHERE  auth_id = p_user_auth_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  v_balance_after := v_balance - p_amount;

  UPDATE users
  SET    credit_balance = v_balance_after
  WHERE  auth_id = p_user_auth_id;

  INSERT INTO credit_transactions
    (user_id, amount, balance_after, type, model_key, generation_id, generation_type)
  VALUES
    (p_user_auth_id, -p_amount, v_balance_after, 'generation',
     p_model_key, p_generation_id, p_gen_type);

  RETURN v_balance_after;
END;
$$;

-- Atomically add credits and record the transaction
CREATE OR REPLACE FUNCTION grant_credits(
  p_user_auth_id  UUID,
  p_amount        INTEGER,
  p_type          TEXT,
  p_notes         TEXT    DEFAULT NULL,
  p_payment_id    TEXT    DEFAULT NULL
) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  v_balance       INTEGER;
  v_balance_after INTEGER;
BEGIN
  SELECT credit_balance INTO v_balance
  FROM   users
  WHERE  auth_id = p_user_auth_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  v_balance_after := v_balance + p_amount;

  UPDATE users
  SET    credit_balance = v_balance_after
  WHERE  auth_id = p_user_auth_id;

  INSERT INTO credit_transactions
    (user_id, amount, balance_after, type, notes, stripe_payment_intent_id)
  VALUES
    (p_user_auth_id, p_amount, v_balance_after, p_type, p_notes, p_payment_id);

  RETURN v_balance_after;
END;
$$;

-- Monthly renewal: apply rollover cap then grant new credits
-- Called by the Stripe webhook on invoice.payment_succeeded (subscription_cycle).
CREATE OR REPLACE FUNCTION process_subscription_renewal(
  p_user_auth_id    UUID,
  p_plan            TEXT,
  p_monthly_credits INTEGER,
  p_rollover_max    INTEGER
) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  v_current  INTEGER;
  v_rollover INTEGER;
  v_new      INTEGER;
BEGIN
  SELECT credit_balance INTO v_current
  FROM   users
  WHERE  auth_id = p_user_auth_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  -- Cap rollover; negative balances (edge case) count as zero
  v_rollover := LEAST(GREATEST(v_current, 0), p_rollover_max);
  v_new      := v_rollover + p_monthly_credits;

  UPDATE users
  SET    credit_balance = v_new
  WHERE  auth_id = p_user_auth_id;

  IF v_rollover > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, balance_after, type, notes)
    VALUES (p_user_auth_id, v_rollover, v_rollover,
            'rollover', 'Monthly rollover from previous period');
  END IF;

  INSERT INTO credit_transactions (user_id, amount, balance_after, type, notes)
  VALUES (p_user_auth_id, p_monthly_credits, v_new,
          'subscription_grant', 'Monthly credit grant: ' || p_plan);

  RETURN v_new;
END;
$$;

-- ── Trigger: auto-provision free plan for every new user ──────────────────────
CREATE OR REPLACE FUNCTION fn_provision_new_user()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Free subscription row
  INSERT INTO user_subscriptions
    (user_id, plan, billing_cycle, credits_per_month, rollover_max, status)
  VALUES
    (NEW.auth_id, 'free', 'monthly', 0, 0, 'active')
  ON CONFLICT (user_id) DO NOTHING;

  -- Free tier usage caps
  INSERT INTO free_tier_usage (user_id, period_start)
  VALUES (NEW.auth_id, date_trunc('month', NOW()))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_provision_new_user ON users;
CREATE TRIGGER trg_provision_new_user
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION fn_provision_new_user();

-- ── Backfill: provision existing users who predate the trigger ─────────────────
INSERT INTO user_subscriptions (user_id, plan, billing_cycle, credits_per_month, rollover_max, status)
SELECT auth_id, 'free', 'monthly', 0, 0, 'active'
FROM   users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO free_tier_usage (user_id, period_start)
SELECT auth_id, date_trunc('month', NOW())
FROM   users
ON CONFLICT (user_id) DO NOTHING;
