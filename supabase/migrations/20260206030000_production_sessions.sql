-- Production Sessions
-- Tracks active production mode chat sessions for Founder OS

CREATE TABLE IF NOT EXISTS founder_os.production_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entity_slug TEXT NOT NULL,
  mode VARCHAR(20) DEFAULT 'default',
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  context JSONB DEFAULT '{}',
  message_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_sessions_user ON founder_os.production_sessions(user_id, started_at DESC);

ALTER TABLE founder_os.production_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON founder_os.production_sessions;
CREATE POLICY "service_role_all" ON founder_os.production_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_production_sessions_updated_at ON founder_os.production_sessions;
CREATE TRIGGER update_production_sessions_updated_at
  BEFORE UPDATE ON founder_os.production_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
