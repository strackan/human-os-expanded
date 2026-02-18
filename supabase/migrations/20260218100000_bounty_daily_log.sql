-- Bounty daily log table for gamified workflow progression tracking

CREATE TABLE IF NOT EXISTS bounty_daily_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  points_earned INTEGER NOT NULL DEFAULT 0,
  workflows_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- RLS: users can only see/modify their own logs
ALTER TABLE bounty_daily_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bounty logs"
  ON bounty_daily_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bounty logs"
  ON bounty_daily_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bounty logs"
  ON bounty_daily_log FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for streak calculation (recent days for a user)
CREATE INDEX idx_bounty_daily_log_user_date
  ON bounty_daily_log(user_id, log_date DESC);
