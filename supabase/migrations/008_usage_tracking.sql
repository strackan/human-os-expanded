-- Human OS Usage Tracking
-- Usage events and onboarding progress

-- Usage events (for retention metric discovery)
CREATE TABLE IF NOT EXISTS human_os.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES human_os.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,             -- 'context_save', 'context_read', 'entity_create', 'link_query', 'search', 'audit'
  entity_slug TEXT,
  layer TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_user_time ON human_os.usage_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_type ON human_os.usage_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_entity ON human_os.usage_events(entity_slug);

-- Onboarding progress (for high-touch follow-up)
CREATE TABLE IF NOT EXISTS human_os.onboarding_progress (
  user_id UUID PRIMARY KEY REFERENCES human_os.users(id) ON DELETE CASCADE,
  steps_completed TEXT[] DEFAULT '{}',
  current_step TEXT,
  percent_complete INTEGER DEFAULT 0,
  first_entity_created_at TIMESTAMPTZ,
  first_context_saved_at TIMESTAMPTZ,
  first_link_created_at TIMESTAMPTZ,
  onboarding_call_scheduled BOOLEAN DEFAULT FALSE,
  onboarding_call_completed BOOLEAN DEFAULT FALSE,
  scheduled_call TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API usage tracking (for rate limiting and billing)
CREATE TABLE IF NOT EXISTS human_os.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES human_os.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_user ON human_os.api_usage(user_id, created_at DESC);
