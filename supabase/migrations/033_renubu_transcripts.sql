-- Migration: 033_renubu_transcripts
-- Create renubu schema and transcripts table for multi-tenant transcript storage
-- Full transcript content lives in context_files, metadata here for search

-- Create renubu schema if not exists
CREATE SCHEMA IF NOT EXISTS renubu;

-- Grant usage on schema
GRANT USAGE ON SCHEMA renubu TO authenticated;
GRANT USAGE ON SCHEMA renubu TO service_role;
GRANT USAGE ON SCHEMA renubu TO anon;

-- renubu.transcripts table (metadata only, content in context_files)
CREATE TABLE renubu.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,           -- Maps to user_tenants.tenant_id
  uploaded_by UUID,                  -- User who created (optional)

  -- Core metadata
  title TEXT NOT NULL,
  slug TEXT NOT NULL,                -- For context_file lookup
  call_date DATE,
  call_type TEXT CHECK (call_type IN ('demo', 'customer', 'coaching', 'internal', 'investor', 'partnership', 'other')),
  duration_minutes INT,
  source_url TEXT,
  source TEXT DEFAULT 'manual',      -- 'manual', 'zoom', 'fathom', 'gong'

  -- Participants (JSONB array)
  -- Format: [{name, company?, role?, email?, linkedin_url?, is_internal: bool}]
  participants JSONB DEFAULT '[]',

  -- Extracted content (searchable)
  summary TEXT,
  key_topics TEXT[] DEFAULT '{}',
  action_items JSONB DEFAULT '[]',
  notable_quotes JSONB DEFAULT '[]',
  relationship_insights TEXT,

  -- Linking
  context_file_id UUID REFERENCES context_files(id),  -- Link to full content
  entity_ids UUID[] DEFAULT '{}',                     -- Linked customers/contacts
  context_tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique slug per tenant
  UNIQUE(tenant_id, slug)
);

-- Indexes for efficient querying
CREATE INDEX idx_renubu_transcripts_tenant ON renubu.transcripts(tenant_id);
CREATE INDEX idx_renubu_transcripts_date ON renubu.transcripts(call_date DESC);
CREATE INDEX idx_renubu_transcripts_type ON renubu.transcripts(call_type);
CREATE INDEX idx_renubu_transcripts_topics ON renubu.transcripts USING GIN(key_topics);
CREATE INDEX idx_renubu_transcripts_tags ON renubu.transcripts USING GIN(context_tags);
CREATE INDEX idx_renubu_transcripts_entities ON renubu.transcripts USING GIN(entity_ids);

-- Full-text search on summary and title
CREATE INDEX idx_renubu_transcripts_fts ON renubu.transcripts
  USING GIN(to_tsvector('english', coalesce(summary, '') || ' ' || coalesce(title, '')));

-- Updated_at trigger
CREATE TRIGGER renubu_transcripts_updated_at
  BEFORE UPDATE ON renubu.transcripts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE renubu.transcripts ENABLE ROW LEVEL SECURITY;

-- Tenant members can access their tenant's transcripts
CREATE POLICY "renubu_transcripts_tenant_access" ON renubu.transcripts
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  );

-- Service role can access everything (for MCP server)
CREATE POLICY "renubu_transcripts_service" ON renubu.transcripts
  FOR ALL TO service_role USING (true);

-- Grants
GRANT ALL ON renubu.transcripts TO authenticated;
GRANT ALL ON renubu.transcripts TO service_role;

-- Add helpful comment
COMMENT ON TABLE renubu.transcripts IS
  'Stores call transcript metadata for multi-tenant access. Full content lives in context_files at layer renubu:tenant-{tenant_id}';
COMMENT ON COLUMN renubu.transcripts.context_file_id IS
  'Reference to context_files entry containing full transcript at renubu/tenant-{id}/transcripts/{slug}.md';
