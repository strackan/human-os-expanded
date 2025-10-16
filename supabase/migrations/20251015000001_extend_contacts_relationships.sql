-- ============================================================================
-- Extend Contacts Table with Relationship Metadata
-- Purpose: Support stakeholder relationship data for executive engagement workflows
-- Phase: 2B.1 (Data Extraction)
-- ============================================================================

-- Add relationship metadata columns to contacts table
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS relationship_strength TEXT CHECK (relationship_strength IN ('weak', 'moderate', 'strong')),
ADD COLUMN IF NOT EXISTS communication_style TEXT,
ADD COLUMN IF NOT EXISTS key_concerns JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS leverage_points JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS recent_interactions TEXT,
ADD COLUMN IF NOT EXISTS relationship_notes TEXT;

-- Add indexes for relationship queries
CREATE INDEX IF NOT EXISTS idx_contacts_relationship_strength
ON public.contacts(relationship_strength)
WHERE relationship_strength IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_key_concerns
ON public.contacts USING GIN (key_concerns)
WHERE key_concerns IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.contacts.relationship_strength IS 'Strength of CSM relationship with this contact (weak/moderate/strong)';
COMMENT ON COLUMN public.contacts.communication_style IS 'Preferred communication style and personality notes';
COMMENT ON COLUMN public.contacts.key_concerns IS 'Array of key concerns this contact has expressed';
COMMENT ON COLUMN public.contacts.leverage_points IS 'Array of leverage points for building relationship';
COMMENT ON COLUMN public.contacts.recent_interactions IS 'Summary of recent interactions and sentiment';
COMMENT ON COLUMN public.contacts.relationship_notes IS 'Additional notes about relationship dynamics';

-- Grant permissions (if needed)
-- Note: Existing RLS policies should cover these new columns

DO $$
BEGIN
  RAISE NOTICE 'Contacts table extended with relationship metadata columns';
END $$;
