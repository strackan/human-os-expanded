-- Favor Proposals: Counter-proposal negotiation system
-- Allows back-and-forth negotiation before a favor is accepted

-- Proposal status enum
CREATE TYPE proposal_status AS ENUM (
  'pending',      -- Awaiting response from other party
  'accepted',     -- Both parties agreed to this proposal
  'declined',     -- Other party declined this proposal
  'superseded'    -- A new counter-proposal was made
);

-- Proposals table - tracks each offer/counter-offer in a negotiation
CREATE TABLE favor_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  favor_id UUID NOT NULL REFERENCES favors(id) ON DELETE CASCADE,
  proposer_id UUID NOT NULL REFERENCES profiles(id),

  -- The proposed terms
  description TEXT NOT NULL,

  -- Status tracking
  status proposal_status NOT NULL DEFAULT 'pending',

  -- Who needs to respond (the other party)
  awaiting_response_from UUID NOT NULL REFERENCES profiles(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  -- Ensure proposer is part of the favor
  CONSTRAINT proposer_is_party CHECK (proposer_id IS NOT NULL)
);

-- Add current proposal reference to favors table
ALTER TABLE favors ADD COLUMN current_proposal_id UUID REFERENCES favor_proposals(id);

-- Add mutual confirmation tracking
ALTER TABLE favors ADD COLUMN requester_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE favors ADD COLUMN recipient_confirmed BOOLEAN DEFAULT FALSE;

-- Index for querying proposals by favor
CREATE INDEX idx_favor_proposals_favor_id ON favor_proposals(favor_id);
CREATE INDEX idx_favor_proposals_status ON favor_proposals(status) WHERE status = 'pending';

-- RLS Policies
ALTER TABLE favor_proposals ENABLE ROW LEVEL SECURITY;

-- Users can view proposals for favors they're part of
CREATE POLICY "Users can view proposals for their favors"
  ON favor_proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM favors
      WHERE favors.id = favor_proposals.favor_id
      AND (favors.requester_id = auth.uid() OR favors.recipient_id = auth.uid())
    )
  );

-- Users can create proposals for favors they're part of
CREATE POLICY "Users can create proposals for their favors"
  ON favor_proposals FOR INSERT
  WITH CHECK (
    proposer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM favors
      WHERE favors.id = favor_id
      AND (favors.requester_id = auth.uid() OR favors.recipient_id = auth.uid())
    )
  );

-- Users can update proposals they need to respond to
CREATE POLICY "Users can respond to proposals"
  ON favor_proposals FOR UPDATE
  USING (awaiting_response_from = auth.uid());

-- Function to handle proposal acceptance and move to accepted state
CREATE OR REPLACE FUNCTION handle_proposal_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- When a proposal is accepted, update the favor status
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    UPDATE favors
    SET
      status = 'accepted',
      description = NEW.description,  -- Update to agreed terms
      accepted_at = NOW(),
      requester_confirmed = TRUE,
      recipient_confirmed = TRUE
    WHERE id = NEW.favor_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_proposal_accepted
  AFTER UPDATE ON favor_proposals
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION handle_proposal_acceptance();

-- Function to create initial proposal when favor is created
CREATE OR REPLACE FUNCTION create_initial_proposal()
RETURNS TRIGGER AS $$
DECLARE
  proposal_id UUID;
BEGIN
  -- Create the initial proposal from the requester
  INSERT INTO favor_proposals (
    favor_id,
    proposer_id,
    description,
    status,
    awaiting_response_from
  ) VALUES (
    NEW.id,
    NEW.requester_id,
    NEW.description,
    'pending',
    NEW.recipient_id
  ) RETURNING id INTO proposal_id;

  -- Update favor with current proposal reference
  UPDATE favors SET current_proposal_id = proposal_id WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_favor_created
  AFTER INSERT ON favors
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_proposal();

-- Comments
COMMENT ON TABLE favor_proposals IS 'Tracks proposals and counter-proposals in favor negotiations';
COMMENT ON COLUMN favor_proposals.awaiting_response_from IS 'The user who needs to respond to this proposal';
COMMENT ON COLUMN favors.current_proposal_id IS 'The active proposal being negotiated';
