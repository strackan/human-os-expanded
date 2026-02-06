-- Human OS Subscriptions and API Keys
-- Billing infrastructure

-- Subscription/billing
CREATE TABLE IF NOT EXISTS human_os.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES human_os.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',    -- 'free', 'pro', 'business'
  status TEXT DEFAULT 'active',         -- 'active', 'canceled', 'past_due', 'trialing'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  price_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API key management (for third-party apps)
CREATE TABLE IF NOT EXISTS human_os.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES human_os.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,               -- Hashed, never store plaintext
  name TEXT,
  scopes TEXT[],                        -- ['read:public', 'write:personal', 'read:graph']
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment history
CREATE TABLE IF NOT EXISTS human_os.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  invoice_id TEXT,
  amount INTEGER,
  status TEXT,                          -- 'succeeded', 'failed'
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON human_os.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON human_os.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON human_os.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON human_os.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_payment_history_customer ON human_os.payment_history(customer_id);
