-- Human OS RLS Policies
-- Row Level Security for all human_os schema tables

-- Enable RLS on all human_os tables
ALTER TABLE human_os.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_os.user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_os.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_os.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_os.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_os.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_os.api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_os.payment_history ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own record
DROP POLICY IF EXISTS users_own_select ON human_os.users;
CREATE POLICY users_own_select ON human_os.users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS users_own_update ON human_os.users;
CREATE POLICY users_own_update ON human_os.users FOR UPDATE USING (auth.uid() = id);

-- Users can read their own verifications
DROP POLICY IF EXISTS verifications_own ON human_os.user_verifications;
CREATE POLICY verifications_own ON human_os.user_verifications FOR ALL USING (auth.uid() = user_id);

-- Users can read/write their own usage events
DROP POLICY IF EXISTS usage_own_select ON human_os.usage_events;
CREATE POLICY usage_own_select ON human_os.usage_events FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS usage_own_insert ON human_os.usage_events;
CREATE POLICY usage_own_insert ON human_os.usage_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read/update their own onboarding
DROP POLICY IF EXISTS onboarding_own ON human_os.onboarding_progress;
CREATE POLICY onboarding_own ON human_os.onboarding_progress FOR ALL USING (auth.uid() = user_id);

-- Users can read their own subscription (updates via service role only)
DROP POLICY IF EXISTS subscriptions_own ON human_os.subscriptions;
CREATE POLICY subscriptions_own ON human_os.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own API keys
DROP POLICY IF EXISTS api_keys_own ON human_os.api_keys;
CREATE POLICY api_keys_own ON human_os.api_keys FOR ALL USING (auth.uid() = user_id);

-- Users can read/write their own API usage
DROP POLICY IF EXISTS api_usage_own ON human_os.api_usage;
CREATE POLICY api_usage_own ON human_os.api_usage FOR ALL USING (auth.uid() = user_id);

-- Payment history is read-only for users (writes via service role)
DROP POLICY IF EXISTS payment_history_own ON human_os.payment_history;
CREATE POLICY payment_history_own ON human_os.payment_history FOR SELECT
  USING (customer_id IN (
    SELECT stripe_customer_id FROM human_os.subscriptions WHERE user_id = auth.uid()
  ));

-- Service role bypass for all tables (for backend operations)
DROP POLICY IF EXISTS service_role_users ON human_os.users;
CREATE POLICY service_role_users ON human_os.users FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS service_role_verifications ON human_os.user_verifications;
CREATE POLICY service_role_verifications ON human_os.user_verifications FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS service_role_usage ON human_os.usage_events;
CREATE POLICY service_role_usage ON human_os.usage_events FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS service_role_onboarding ON human_os.onboarding_progress;
CREATE POLICY service_role_onboarding ON human_os.onboarding_progress FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS service_role_subscriptions ON human_os.subscriptions;
CREATE POLICY service_role_subscriptions ON human_os.subscriptions FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS service_role_api_keys ON human_os.api_keys;
CREATE POLICY service_role_api_keys ON human_os.api_keys FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS service_role_api_usage ON human_os.api_usage;
CREATE POLICY service_role_api_usage ON human_os.api_usage FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS service_role_payment_history ON human_os.payment_history;
CREATE POLICY service_role_payment_history ON human_os.payment_history FOR ALL TO service_role USING (true);
