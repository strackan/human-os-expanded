-- fancyrobot paid tier — profiles, subscriptions, monitoring, scoring, elite runs, alerts
-- Depends on: 20260228050000_fancyrobot_core_schema.sql

-- ============================================================
-- updated_at trigger function (shared)
-- ============================================================

CREATE OR REPLACE FUNCTION fancyrobot.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Profiles (one per auth.users row that uses Fancy Robot)
-- ============================================================

CREATE TABLE IF NOT EXISTS fancyrobot.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    billing_interval TEXT CHECK (billing_interval IN ('monthly', 'annual')),
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fr_profiles_email ON fancyrobot.profiles(email);
CREATE INDEX IF NOT EXISTS idx_fr_profiles_stripe ON fancyrobot.profiles(stripe_customer_id);

ALTER TABLE fancyrobot.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "profiles_select_own" ON fancyrobot.profiles
    FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_update_own" ON fancyrobot.profiles
    FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_insert_own" ON fancyrobot.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_service_all" ON fancyrobot.profiles
    FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON fancyrobot.profiles
  FOR EACH ROW EXECUTE FUNCTION fancyrobot.set_updated_at();

-- ============================================================
-- Subscriptions
-- ============================================================

CREATE TABLE IF NOT EXISTS fancyrobot.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_price_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fr_subs_user ON fancyrobot.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_fr_subs_status ON fancyrobot.subscriptions(status);

ALTER TABLE fancyrobot.subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "subs_select_own" ON fancyrobot.subscriptions
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "subs_service_all" ON fancyrobot.subscriptions
    FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON fancyrobot.subscriptions
  FOR EACH ROW EXECUTE FUNCTION fancyrobot.set_updated_at();

-- ============================================================
-- Monitored brands (Pro feature)
-- ============================================================

CREATE TABLE IF NOT EXISTS fancyrobot.monitored_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    company_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_fr_monitored_user ON fancyrobot.monitored_brands(user_id);

ALTER TABLE fancyrobot.monitored_brands ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "monitored_select_own" ON fancyrobot.monitored_brands
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "monitored_insert_own" ON fancyrobot.monitored_brands
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "monitored_delete_own" ON fancyrobot.monitored_brands
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "monitored_service_all" ON fancyrobot.monitored_brands
    FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Score history (tracked scores per brand)
-- ============================================================

CREATE TABLE IF NOT EXISTS fancyrobot.score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    overall_score FLOAT NOT NULL,
    mention_rate FLOAT,
    provider_scores JSONB DEFAULT '{}',
    scored_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fr_score_user ON fancyrobot.score_history(user_id);
CREATE INDEX IF NOT EXISTS idx_fr_score_domain ON fancyrobot.score_history(domain);
CREATE INDEX IF NOT EXISTS idx_fr_score_scored ON fancyrobot.score_history(scored_at DESC);

ALTER TABLE fancyrobot.score_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "score_select_own" ON fancyrobot.score_history
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "score_service_all" ON fancyrobot.score_history
    FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Elite runs (ad-hoc deep audit purchases)
-- ============================================================

CREATE TABLE IF NOT EXISTS fancyrobot.elite_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    primary_domain TEXT NOT NULL,
    competitor_domains TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    gumshoe_data JSONB,
    ari_data JSONB,
    fusion_report JSONB,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fr_elite_user ON fancyrobot.elite_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_fr_elite_status ON fancyrobot.elite_runs(status);

ALTER TABLE fancyrobot.elite_runs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "elite_select_own" ON fancyrobot.elite_runs
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "elite_service_all" ON fancyrobot.elite_runs
    FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Alerts
-- ============================================================

CREATE TABLE IF NOT EXISTS fancyrobot.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    monitored_brand_id UUID REFERENCES fancyrobot.monitored_brands(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fr_alerts_user ON fancyrobot.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_fr_alerts_unread ON fancyrobot.alerts(user_id, read_at) WHERE read_at IS NULL;

ALTER TABLE fancyrobot.alerts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "alerts_select_own" ON fancyrobot.alerts
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "alerts_update_own" ON fancyrobot.alerts
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "alerts_service_all" ON fancyrobot.alerts
    FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Add user_id to existing snapshot_runs (nullable for anon)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'fancyrobot' AND table_name = 'snapshot_runs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE fancyrobot.snapshot_runs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX idx_fr_snap_user ON fancyrobot.snapshot_runs(user_id);
  END IF;
END $$;

-- Add policy for users to see their own snapshots (existing anon policy still applies for reads)
DO $$ BEGIN
  CREATE POLICY "snap_update_own" ON fancyrobot.snapshot_runs
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Grant all new tables to anon + authenticated
-- ============================================================

GRANT ALL ON ALL TABLES IN SCHEMA fancyrobot TO anon, authenticated;
