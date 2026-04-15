-- ── Row-level security for all application tables ────────────────────────────
-- All API routes use createServiceClient() which bypasses RLS entirely.
-- These policies enforce least-privilege for any direct client SDK access
-- (Supabase dashboard, future client-side queries, third-party integrations).
--
-- Pattern:
--   • Own-row tables (users, images, videos, subscriptions, wallets, etc.)
--     → authenticated user can only see/touch rows that belong to them.
--   • Catalog tables (model_credit_costs, plan_model_access, credit_topup_packs)
--     → any authenticated user can read; all writes are service-role only.
--   • Ledger tables (credit_transactions)
--     → read own rows only; append-only via Postgres functions (service role).

-- ── users ─────────────────────────────────────────────────────────────────────
-- users.auth_id maps to auth.users.id — use it as the ownership key.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth_id = auth.uid());

-- Users may update their own display name / avatar.
-- Sensitive columns (credit_balance, stripe_customer_id) are only written by
-- the service role (Stripe webhook, PG functions), so this policy is safe.
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth_id = auth.uid());

-- INSERT is handled exclusively by the auth callback (service role).
-- No authenticated INSERT policy → client cannot create rows directly.

-- ── images ────────────────────────────────────────────────────────────────────
-- images.user_id references the internal users.id (not auth.uid()).
-- Ownership check requires a sub-select through the users profile table.

ALTER TABLE images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "images_select_own"
  ON images FOR SELECT
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "images_insert_own"
  ON images FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- UPDATE / DELETE stay service-role only (route marks status done/failed).

-- ── videos ────────────────────────────────────────────────────────────────────
-- Same internal user_id pattern as images.

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "videos_select_own"
  ON videos FOR SELECT
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "videos_insert_own"
  ON videos FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ── video_jobs (InfinitaTalk / avatar pipeline) ───────────────────────────────
-- video_jobs.user_id references auth.users(id) directly (see 20260408 migration).

ALTER TABLE video_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "video_jobs_select_own"
  ON video_jobs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "video_jobs_insert_own"
  ON video_jobs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE (chunk completion, stitching) is handled by the callback route via
-- service role — no authenticated UPDATE policy needed.

-- ── user_connections (One Auth platform connections) ──────────────────────────

ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_connections_select_own"
  ON user_connections FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_connections_insert_own"
  ON user_connections FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_connections_delete_own"
  ON user_connections FOR DELETE
  USING (user_id = auth.uid());

-- ── user_subscriptions ────────────────────────────────────────────────────────
-- All writes come from the Stripe webhook (service role).

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_subscriptions_select_own"
  ON user_subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- ── credit_transactions (append-only ledger) ──────────────────────────────────
-- Written exclusively via the deduct_credits / grant_credits Postgres functions
-- which run as the service role. No client write path.

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_transactions_select_own"
  ON credit_transactions FOR SELECT
  USING (user_id = auth.uid());

-- ── free_tier_usage ───────────────────────────────────────────────────────────
-- Read/written by the service role (lib/credits.ts checkAndIncrementFreeCap).

ALTER TABLE free_tier_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "free_tier_usage_select_own"
  ON free_tier_usage FOR SELECT
  USING (user_id = auth.uid());

-- ── model_credit_costs ────────────────────────────────────────────────────────
-- Public catalog — any authenticated user can read to show pricing UI.
-- Writes (price updates) are admin / service role only.

ALTER TABLE model_credit_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "model_credit_costs_select_authenticated"
  ON model_credit_costs FOR SELECT
  TO authenticated
  USING (true);

-- ── plan_model_access ─────────────────────────────────────────────────────────
-- Public catalog — readable by all authenticated users for tier-gating UI.

ALTER TABLE plan_model_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_model_access_select_authenticated"
  ON plan_model_access FOR SELECT
  TO authenticated
  USING (true);

-- ── credit_topup_packs ────────────────────────────────────────────────────────
-- Show only active packs; inactive packs are hidden from client reads.

ALTER TABLE credit_topup_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_topup_packs_select_active"
  ON credit_topup_packs FOR SELECT
  TO authenticated
  USING (active = true);
