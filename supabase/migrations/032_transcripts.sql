-- Migration: 032_transcripts
-- Create transcripts table for call transcript ingestion and search

-- Create the table in founder_os schema
create table founder_os.transcripts (
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

-- Indexes for search
create index transcripts_call_date_idx on founder_os.transcripts(call_date desc);
create index transcripts_call_type_idx on founder_os.transcripts(call_type);
create index transcripts_topics_idx on founder_os.transcripts using gin(key_topics);
create index transcripts_tags_idx on founder_os.transcripts using gin(context_tags);
create index transcripts_entity_ids_idx on founder_os.transcripts using gin(entity_ids);

-- Full-text search on raw content and summary
create index transcripts_content_fts_idx on founder_os.transcripts
  using gin(to_tsvector('english', coalesce(raw_content, '') || ' ' || coalesce(summary, '')));

-- Updated_at trigger (reuse existing function from founder_os schema)
create trigger transcripts_updated_at
  before update on founder_os.transcripts
  for each row
  execute function founder_os.update_updated_at_column();

-- RLS policies
alter table founder_os.transcripts enable row level security;

-- For now, allow all operations (single-user system)
-- Can be refined later with user_id/org_id if needed
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
