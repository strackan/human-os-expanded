-- Migration: 032_transcripts
-- Create transcripts table for call transcript ingestion and search

-- Create the table in founder_os schema
CREATE TABLE IF NOT EXISTS founder_os.transcripts (
  id uuid primary key default gen_random_uuid(),

  -- Core metadata
  title text not null,
  call_date date,
  call_type text check (call_type in ('demo', 'customer', 'coaching', 'internal', 'investor', 'partnership', 'other')),
  duration_minutes int,
  source_url text,  -- Fathom link, Zoom recording, etc.

  -- Participants (JSONB array)
  -- Format: [{name, company?, role?, email?, linkedin_url?, is_internal: bool}]
  participants jsonb default '[]',

  -- Extracted content
  summary text,  -- 2-3 paragraph executive summary
  key_topics text[] default '{}',  -- Array of topic tags

  -- Action items format: [{description, owner?, due_date?, status: 'pending'|'done'}]
  action_items jsonb default '[]',

  -- Notable quotes format: [{speaker, quote, context?, timestamp?}]
  notable_quotes jsonb default '[]',

  -- Relationship intelligence
  relationship_insights text,  -- Freeform notes about the person/dynamic

  -- Full content
  raw_content text,  -- Complete transcript text

  -- Linking
  entity_ids uuid[] default '{}',  -- Links to entities table (people, companies)
  context_tags text[] default '{}',  -- e.g., ['renubu', 'powerpak', 'good-hang']

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure columns exist if table was created by an earlier migration
ALTER TABLE founder_os.transcripts ADD COLUMN IF NOT EXISTS call_date date;
ALTER TABLE founder_os.transcripts ADD COLUMN IF NOT EXISTS call_type text;
ALTER TABLE founder_os.transcripts ADD COLUMN IF NOT EXISTS duration_minutes int;
ALTER TABLE founder_os.transcripts ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE founder_os.transcripts ADD COLUMN IF NOT EXISTS participants jsonb DEFAULT '[]';
ALTER TABLE founder_os.transcripts ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE founder_os.transcripts ADD COLUMN IF NOT EXISTS key_topics text[] DEFAULT '{}';
ALTER TABLE founder_os.transcripts ADD COLUMN IF NOT EXISTS action_items jsonb DEFAULT '[]';
ALTER TABLE founder_os.transcripts ADD COLUMN IF NOT EXISTS notable_quotes jsonb DEFAULT '[]';
ALTER TABLE founder_os.transcripts ADD COLUMN IF NOT EXISTS relationship_insights text;
ALTER TABLE founder_os.transcripts ADD COLUMN IF NOT EXISTS raw_content text;
ALTER TABLE founder_os.transcripts ADD COLUMN IF NOT EXISTS entity_ids uuid[] DEFAULT '{}';
ALTER TABLE founder_os.transcripts ADD COLUMN IF NOT EXISTS context_tags text[] DEFAULT '{}';

-- Indexes for search
CREATE INDEX IF NOT EXISTS transcripts_call_date_idx on founder_os.transcripts(call_date desc);
CREATE INDEX IF NOT EXISTS transcripts_call_type_idx on founder_os.transcripts(call_type);
CREATE INDEX IF NOT EXISTS transcripts_topics_idx on founder_os.transcripts using gin(key_topics);
CREATE INDEX IF NOT EXISTS transcripts_tags_idx on founder_os.transcripts using gin(context_tags);
CREATE INDEX IF NOT EXISTS transcripts_entity_ids_idx on founder_os.transcripts using gin(entity_ids);

-- Full-text search on raw content and summary
CREATE INDEX IF NOT EXISTS transcripts_content_fts_idx on founder_os.transcripts
  using gin(to_tsvector('english', coalesce(raw_content, '') || ' ' || coalesce(summary, '')));

-- Updated_at trigger (reuse existing function from public schema)
DROP TRIGGER IF EXISTS transcripts_updated_at ON founder_os.transcripts;
CREATE TRIGGER transcripts_updated_at before update ON founder_os.transcripts
  for each row
  execute function update_updated_at_column();

-- RLS policies
alter table founder_os.transcripts enable row level security;

-- For now, allow all operations (single-user system)
-- Can be refined later with user_id/org_id if needed
drop policy if exists "Allow all transcript operations" on founder_os.transcripts;
create policy "Allow all transcript operations"
  on founder_os.transcripts for all
  using (true)
  with check (true);

-- Grant access to authenticated users and service role
grant all on founder_os.transcripts to authenticated;
grant all on founder_os.transcripts to service_role;

-- Add helpful comment
comment on table founder_os.transcripts is
  'Stores call transcripts with extracted metadata for search and analysis';
