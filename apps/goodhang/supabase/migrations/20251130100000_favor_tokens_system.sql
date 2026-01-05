-- Favor Tokens System Migration
-- The reciprocity economy for Good Hang

-- ============================================================
-- ENUMS
-- ============================================================

-- How a token was minted
CREATE TYPE token_mint_source AS ENUM (
  'initial_grant',  -- Given to new members on join
  'event_drop',     -- Random drop at events
  'quest_reward',   -- Earned from quests/achievements
  'admin_grant'     -- Manual grant by admin
);

-- Favor request status
CREATE TYPE favor_status AS ENUM (
  'asked',               -- Initial request sent
  'negotiating',         -- Counter-proposal in progress
  'accepted',            -- Recipient agreed to do the favor
  'pending_confirmation', -- Recipient marked complete, awaiting confirmation
  'completed',           -- Requester confirmed, token transferred
  'declined',            -- Recipient said no
  'withdrawn',           -- Requester cancelled the request
  'disputed'             -- Escalated to admin
);

-- Favor listing categories
CREATE TYPE favor_category AS ENUM (
  'introductions',
  'expertise',
  'local_knowledge',
  'mentorship',
  'creative',
  'technical',
  'career',
  'wellness',
  'other'
);

-- ============================================================
-- FAVOR TOKENS TABLE
-- ============================================================
CREATE TABLE favor_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Unique identity
  name TEXT NOT NULL,                    -- Procedurally generated (e.g., "Gilla Macondi")
  visual_seed TEXT NOT NULL,             -- Seed for 8-bit art generation
  signature_pattern TEXT NOT NULL,       -- Unique QR-style visual identifier

  -- Provenance
  minted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mint_source token_mint_source NOT NULL,
  mint_event_id UUID REFERENCES events(id),  -- If minted at an event

  -- Ownership
  current_owner_id UUID NOT NULL REFERENCES profiles(id),
  original_owner_id UUID NOT NULL REFERENCES profiles(id),

  -- History tracking (favor IDs this token has been exchanged for)
  favor_history UUID[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE favor_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all tokens"
  ON favor_tokens FOR SELECT
  USING (true);

CREATE POLICY "System can insert tokens"
  ON favor_tokens FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update tokens"
  ON favor_tokens FOR UPDATE
  USING (true);

-- ============================================================
-- FAVORS TABLE
-- ============================================================
CREATE TABLE favors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Token being offered
  token_id UUID NOT NULL REFERENCES favor_tokens(id),

  -- Parties involved
  requester_id UUID NOT NULL REFERENCES profiles(id),
  recipient_id UUID NOT NULL REFERENCES profiles(id),

  -- The ask
  description TEXT NOT NULL,

  -- Status
  status favor_status NOT NULL DEFAULT 'asked',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Completion notes
  completion_note TEXT,
  revision_request TEXT,

  -- Constraints
  CONSTRAINT different_parties CHECK (requester_id != recipient_id)
);

-- Enable RLS
ALTER TABLE favors ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own favors"
  ON favors FOR SELECT
  USING (
    requester_id = auth.uid() OR
    recipient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_role = 'admin'
    )
  );

CREATE POLICY "Users can create favor requests"
  ON favors FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Involved parties can update favors"
  ON favors FOR UPDATE
  USING (
    requester_id = auth.uid() OR
    recipient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_role = 'admin'
    )
  );

-- ============================================================
-- FAVOR MESSAGES TABLE (conversation log)
-- ============================================================
CREATE TABLE favor_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  favor_id UUID NOT NULL REFERENCES favors(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),

  -- Message content
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'message', -- 'message', 'counter_proposal', 'status_change'

  -- For counter proposals
  proposed_description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE favor_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view messages for their favors"
  ON favor_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM favors
      WHERE favors.id = favor_messages.favor_id
      AND (favors.requester_id = auth.uid() OR favors.recipient_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_role = 'admin'
    )
  );

CREATE POLICY "Users can send messages to their favors"
  ON favor_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM favors
      WHERE favors.id = favor_messages.favor_id
      AND (favors.requester_id = auth.uid() OR favors.recipient_id = auth.uid())
    )
  );

-- ============================================================
-- FAVOR LISTINGS TABLE (marketplace)
-- ============================================================
CREATE TABLE favor_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id),

  -- What they're offering
  description TEXT NOT NULL,
  category favor_category DEFAULT 'other',

  -- Availability
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE favor_listings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active listings"
  ON favor_listings FOR SELECT
  USING (is_active = true OR owner_id = auth.uid());

CREATE POLICY "Users can create their own listings"
  ON favor_listings FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own listings"
  ON favor_listings FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own listings"
  ON favor_listings FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================
-- FAVOR BLOCKS TABLE (silent blocking)
-- ============================================================
CREATE TABLE favor_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES profiles(id),
  blocked_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint - can only block someone once
  UNIQUE(blocker_id, blocked_id),
  -- Can't block yourself
  CONSTRAINT different_users CHECK (blocker_id != blocked_id)
);

-- Enable RLS
ALTER TABLE favor_blocks ENABLE ROW LEVEL SECURITY;

-- Policies - very restrictive since blocks are silent
CREATE POLICY "Users can view their own blocks"
  ON favor_blocks FOR SELECT
  USING (blocker_id = auth.uid());

CREATE POLICY "Admins can view all blocks"
  ON favor_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_role = 'admin'
    )
  );

CREATE POLICY "Users can create blocks"
  ON favor_blocks FOR INSERT
  WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can delete their own blocks"
  ON favor_blocks FOR DELETE
  USING (blocker_id = auth.uid());

-- ============================================================
-- ADMIN NOTIFICATIONS TABLE (for block events)
-- ============================================================
CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type TEXT NOT NULL,
  subject_user_id UUID REFERENCES profiles(id),
  target_user_id UUID REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can see notifications
CREATE POLICY "Admins can view notifications"
  ON admin_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_role = 'admin'
    )
  );

CREATE POLICY "System can insert notifications"
  ON admin_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update notifications"
  ON admin_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_role = 'admin'
    )
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_favor_tokens_owner ON favor_tokens(current_owner_id);
CREATE INDEX idx_favor_tokens_minted_at ON favor_tokens(minted_at);
CREATE INDEX idx_favors_requester ON favors(requester_id);
CREATE INDEX idx_favors_recipient ON favors(recipient_id);
CREATE INDEX idx_favors_status ON favors(status);
CREATE INDEX idx_favors_token ON favors(token_id);
CREATE INDEX idx_favor_messages_favor ON favor_messages(favor_id);
CREATE INDEX idx_favor_listings_owner ON favor_listings(owner_id);
CREATE INDEX idx_favor_listings_category ON favor_listings(category);
CREATE INDEX idx_favor_listings_active ON favor_listings(is_active) WHERE is_active = true;
CREATE INDEX idx_favor_blocks_blocker ON favor_blocks(blocker_id);
CREATE INDEX idx_favor_blocks_blocked ON favor_blocks(blocked_id);
CREATE INDEX idx_admin_notifications_unread ON admin_notifications(is_read) WHERE is_read = false;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Update updated_at for favor_tokens
CREATE TRIGGER update_favor_tokens_updated_at
  BEFORE UPDATE ON favor_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at for favors
CREATE TRIGGER update_favors_updated_at
  BEFORE UPDATE ON favors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at for favor_listings
CREATE TRIGGER update_favor_listings_updated_at
  BEFORE UPDATE ON favor_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCTION: Create admin notification on block
-- ============================================================
CREATE OR REPLACE FUNCTION notify_admin_on_block()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_notifications (
    notification_type,
    subject_user_id,
    target_user_id,
    metadata
  ) VALUES (
    'favor_block',
    NEW.blocker_id,
    NEW.blocked_id,
    jsonb_build_object('block_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify admin when a block is created
CREATE TRIGGER on_favor_block_created
  AFTER INSERT ON favor_blocks
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_block();

-- ============================================================
-- FUNCTION: Transfer token on favor completion
-- ============================================================
CREATE OR REPLACE FUNCTION transfer_token_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status = 'pending_confirmation' THEN
    -- Update token ownership
    UPDATE favor_tokens
    SET
      current_owner_id = (SELECT recipient_id FROM favors WHERE id = NEW.id),
      favor_history = array_append(favor_history, NEW.id),
      updated_at = NOW()
    WHERE id = NEW.token_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to transfer token when favor is completed
CREATE TRIGGER on_favor_completed
  AFTER UPDATE ON favors
  FOR EACH ROW
  EXECUTE FUNCTION transfer_token_on_completion();

-- ============================================================
-- FUNCTION: Return token on decline/withdraw
-- ============================================================
CREATE OR REPLACE FUNCTION return_token_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  -- When favor is declined or withdrawn, ensure token stays with requester
  -- (Token ownership doesn't change, but we could log this if needed)
  IF NEW.status IN ('declined', 'withdrawn') AND OLD.status = 'asked' THEN
    -- Token already belongs to requester, nothing to do
    NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_favor_cancelled
  AFTER UPDATE ON favors
  FOR EACH ROW
  EXECUTE FUNCTION return_token_on_cancel();
