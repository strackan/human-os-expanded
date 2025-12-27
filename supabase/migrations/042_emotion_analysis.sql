-- 042_emotion_analysis.sql
-- Storage for emotion analysis results
--
-- Stores results of text emotion analysis for:
-- - Transcripts (meeting recordings, calls)
-- - Journal entries
-- - Social media posts
-- - Ad-hoc text analysis
--
-- Enables trend analysis, relationship health tracking, and emotional pattern recognition.

-- =============================================================================
-- EMOTION ANALYSES TABLE
-- =============================================================================

create table if not exists founder_os.emotion_analyses (
  id uuid primary key default gen_random_uuid(),

  -- Source reference
  source_type text not null check (source_type in ('transcript', 'journal', 'text', 'social')),
  source_id uuid,                    -- FK to transcript/journal if applicable
  source_text_hash text,             -- Hash of analyzed text for deduplication

  -- Plutchik 8-dimension vector (0-1 normalized scores)
  joy numeric(4,3) not null default 0,
  trust numeric(4,3) not null default 0,
  fear numeric(4,3) not null default 0,
  surprise numeric(4,3) not null default 0,
  sadness numeric(4,3) not null default 0,
  anticipation numeric(4,3) not null default 0,
  anger numeric(4,3) not null default 0,
  disgust numeric(4,3) not null default 0,

  -- VAD (Valence-Arousal-Dominance) dimensions
  valence numeric(4,3),              -- -1 (negative) to +1 (positive)
  arousal numeric(4,3),              -- 0 (calm) to 1 (intense)
  dominance numeric(4,3),            -- 0 (submissive) to 1 (dominant)

  -- Derived metrics
  dominant_emotion text not null,    -- Primary Plutchik emotion
  emotion_confidence numeric(4,3),   -- Confidence in dominant emotion
  emotion_density numeric(4,3),      -- keywords/words ratio

  -- Context for grouping/trending
  analyzed_date date,                -- Date of source content (for trending)
  participant_names text[],          -- People involved (from transcript)
  context_tags text[],               -- Tags for filtering/grouping

  -- Analysis details
  word_count int,
  keyword_count int,
  detected_keywords jsonb,           -- [{word, emotion, confidence}]
  analysis_method text default 'keyword', -- 'keyword' or 'transformer'

  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add comment
comment on table founder_os.emotion_analyses is
  'Stores emotion analysis results from text-to-Plutchik-vector analysis. Used for trend analysis and relationship tracking.';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Source lookup
create index if not exists emotion_analyses_source_idx
  on founder_os.emotion_analyses(source_type, source_id);

-- Deduplication
create index if not exists emotion_analyses_hash_idx
  on founder_os.emotion_analyses(source_text_hash);

-- Trend queries by date
create index if not exists emotion_analyses_date_idx
  on founder_os.emotion_analyses(analyzed_date);

-- Participant filtering (GIN for array)
create index if not exists emotion_analyses_participants_idx
  on founder_os.emotion_analyses using gin(participant_names);

-- Tag filtering (GIN for array)
create index if not exists emotion_analyses_tags_idx
  on founder_os.emotion_analyses using gin(context_tags);

-- Dominant emotion filtering
create index if not exists emotion_analyses_dominant_idx
  on founder_os.emotion_analyses(dominant_emotion);

-- Valence trend queries
create index if not exists emotion_analyses_valence_idx
  on founder_os.emotion_analyses(analyzed_date, valence);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at
create trigger emotion_analyses_updated_at
  before update on founder_os.emotion_analyses
  for each row
  execute function public.update_updated_at_column();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

alter table founder_os.emotion_analyses enable row level security;

-- Allow all operations for now (founder_os is single-user)
create policy "Allow all emotion analysis operations"
  on founder_os.emotion_analyses for all
  using (true) with check (true);

-- =============================================================================
-- GRANTS
-- =============================================================================

grant all on founder_os.emotion_analyses to authenticated;
grant all on founder_os.emotion_analyses to service_role;
grant all on founder_os.emotion_analyses to anon;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get emotion trends by time period
create or replace function founder_os.get_emotion_trends(
  p_group_by text default 'month',        -- 'day', 'week', 'month'
  p_date_from date default null,
  p_date_to date default null,
  p_participant text default null,
  p_source_type text default null
)
returns table (
  period text,
  avg_joy numeric,
  avg_trust numeric,
  avg_fear numeric,
  avg_surprise numeric,
  avg_sadness numeric,
  avg_anticipation numeric,
  avg_anger numeric,
  avg_disgust numeric,
  avg_valence numeric,
  avg_arousal numeric,
  dominant_emotion text,
  entry_count bigint
)
language sql
stable
as $$
  with filtered as (
    select *
    from founder_os.emotion_analyses
    where
      (p_date_from is null or analyzed_date >= p_date_from)
      and (p_date_to is null or analyzed_date <= p_date_to)
      and (p_source_type is null or source_type = p_source_type)
      and (p_participant is null or p_participant = any(participant_names))
  ),
  grouped as (
    select
      case p_group_by
        when 'day' then to_char(analyzed_date, 'YYYY-MM-DD')
        when 'week' then to_char(analyzed_date, 'IYYY-IW')
        when 'month' then to_char(analyzed_date, 'YYYY-MM')
        else to_char(analyzed_date, 'YYYY-MM')
      end as period,
      avg(joy) as avg_joy,
      avg(trust) as avg_trust,
      avg(fear) as avg_fear,
      avg(surprise) as avg_surprise,
      avg(sadness) as avg_sadness,
      avg(anticipation) as avg_anticipation,
      avg(anger) as avg_anger,
      avg(disgust) as avg_disgust,
      avg(valence) as avg_valence,
      avg(arousal) as avg_arousal,
      count(*) as entry_count,
      -- Mode of dominant_emotion
      mode() within group (order by dominant_emotion) as dominant_emotion
    from filtered
    where analyzed_date is not null
    group by 1
  )
  select
    period,
    round(avg_joy, 3),
    round(avg_trust, 3),
    round(avg_fear, 3),
    round(avg_surprise, 3),
    round(avg_sadness, 3),
    round(avg_anticipation, 3),
    round(avg_anger, 3),
    round(avg_disgust, 3),
    round(avg_valence, 3),
    round(avg_arousal, 3),
    dominant_emotion,
    entry_count
  from grouped
  order by period;
$$;

comment on function founder_os.get_emotion_trends is
  'Returns emotion trends aggregated by time period. Supports filtering by participant, source type, and date range.';

-- Grant execute
grant execute on function founder_os.get_emotion_trends to authenticated;
grant execute on function founder_os.get_emotion_trends to service_role;
grant execute on function founder_os.get_emotion_trends to anon;

-- Function to compare emotions between two participants
create or replace function founder_os.compare_participant_emotions(
  p_participant1 text,
  p_participant2 text,
  p_date_from date default null,
  p_date_to date default null
)
returns table (
  participant text,
  avg_joy numeric,
  avg_trust numeric,
  avg_fear numeric,
  avg_surprise numeric,
  avg_sadness numeric,
  avg_anticipation numeric,
  avg_anger numeric,
  avg_disgust numeric,
  avg_valence numeric,
  avg_arousal numeric,
  entry_count bigint
)
language sql
stable
as $$
  with expanded as (
    select
      p.participant,
      ea.joy, ea.trust, ea.fear, ea.surprise,
      ea.sadness, ea.anticipation, ea.anger, ea.disgust,
      ea.valence, ea.arousal
    from founder_os.emotion_analyses ea,
         lateral unnest(ea.participant_names) as p(participant)
    where
      (p_participant1 = any(ea.participant_names) or p_participant2 = any(ea.participant_names))
      and (p_date_from is null or ea.analyzed_date >= p_date_from)
      and (p_date_to is null or ea.analyzed_date <= p_date_to)
  )
  select
    participant,
    round(avg(joy), 3),
    round(avg(trust), 3),
    round(avg(fear), 3),
    round(avg(surprise), 3),
    round(avg(sadness), 3),
    round(avg(anticipation), 3),
    round(avg(anger), 3),
    round(avg(disgust), 3),
    round(avg(valence), 3),
    round(avg(arousal), 3),
    count(*)
  from expanded
  where participant in (p_participant1, p_participant2)
  group by participant;
$$;

comment on function founder_os.compare_participant_emotions is
  'Compares average emotional profiles between two participants.';

grant execute on function founder_os.compare_participant_emotions to authenticated;
grant execute on function founder_os.compare_participant_emotions to service_role;
grant execute on function founder_os.compare_participant_emotions to anon;
