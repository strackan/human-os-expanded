-- =============================================================
-- Missive Bridge: Full Migration (Idempotent - safe to re-run)
-- Run in Supabase SQL Editor
-- =============================================================

-- 1. Contact → Missive conversation mapping (for threading)
CREATE TABLE IF NOT EXISTS founder_os.missive_contact_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_forest TEXT NOT NULL UNIQUE,
  entity_name TEXT,
  missive_conversation_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Bridge tracking table (which messages have been forwarded)
CREATE TABLE IF NOT EXISTS founder_os.missive_bridge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fos_message_id UUID NOT NULL,
  missive_conversation_id TEXT,
  missive_message_id TEXT,
  sender_forest TEXT NOT NULL,
  sender_name TEXT,
  direction TEXT NOT NULL DEFAULT 'inbound',
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- Indexes (all IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS idx_missive_bridge_fos_msg 
  ON founder_os.missive_bridge(fos_message_id, direction);

CREATE INDEX IF NOT EXISTS idx_missive_bridge_sender 
  ON founder_os.missive_bridge(sender_forest, direction) 
  WHERE status = 'sent';

CREATE INDEX IF NOT EXISTS idx_missive_bridge_pending
  ON founder_os.missive_bridge(status)
  WHERE status = 'pending';

-- 3. Trigger function (CREATE OR REPLACE = idempotent)
CREATE OR REPLACE FUNCTION founder_os.on_new_fos_message_for_missive()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.to_forest = 'justin' AND NEW.status = 'pending' THEN
    INSERT INTO founder_os.missive_bridge (
      fos_message_id, sender_forest, sender_name, direction, status
    ) VALUES (
      NEW.id, NEW.from_forest, NEW.from_name, 'inbound', 'pending'
    )
    ON CONFLICT (fos_message_id, direction) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop + recreate trigger (no IF NOT EXISTS for triggers)
DROP TRIGGER IF EXISTS trg_missive_bridge_inbound ON founder_os.messages;
CREATE TRIGGER trg_missive_bridge_inbound
  AFTER INSERT ON founder_os.messages
  FOR EACH ROW
  EXECUTE FUNCTION founder_os.on_new_fos_message_for_missive();

-- 4. RPC: mark sent (CREATE OR REPLACE = idempotent)
CREATE OR REPLACE FUNCTION founder_os.missive_mark_sent(
  p_bridge_id UUID,
  p_missive_conversation_id TEXT,
  p_missive_message_id TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE founder_os.missive_bridge
  SET 
    status = 'sent',
    missive_conversation_id = p_missive_conversation_id,
    missive_message_id = p_missive_message_id,
    sent_at = now()
  WHERE id = p_bridge_id;

  INSERT INTO founder_os.missive_contact_map (entity_forest, entity_name, missive_conversation_id, updated_at)
  SELECT sender_forest, sender_name, p_missive_conversation_id, now()
  FROM founder_os.missive_bridge
  WHERE id = p_bridge_id
  ON CONFLICT (entity_forest) 
  DO UPDATE SET 
    missive_conversation_id = EXCLUDED.missive_conversation_id,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- 5. RPC: mark failed (CREATE OR REPLACE = idempotent)
CREATE OR REPLACE FUNCTION founder_os.missive_mark_failed(
  p_bridge_id UUID,
  p_error TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE founder_os.missive_bridge
  SET 
    status = 'failed',
    error_message = p_error
  WHERE id = p_bridge_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Seed data (ON CONFLICT = idempotent)
INSERT INTO founder_os.missive_contact_map (entity_forest, entity_name, missive_conversation_id)
VALUES ('scott-leese', 'Scott Leese', 'd7e298dc-53cf-41ca-b267-c59c3d739db2')
ON CONFLICT (entity_forest) DO UPDATE SET 
  missive_conversation_id = EXCLUDED.missive_conversation_id,
  updated_at = now();