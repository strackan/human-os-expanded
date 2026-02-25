-- Adventure Ghost Customer Simulation Tables
-- Used by gtm.consulting/adventure to track personalized visitor URLs and play sessions

-- Visitor profiles with personalized URL slugs
create table if not exists public.adventure_visitors (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  company text,
  role text,
  interests text[],
  context text,
  played boolean default false,
  replay_code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Play session history with scores
create table if not exists public.adventure_sessions (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid references public.adventure_visitors(id),
  scenario_id text not null,
  transcript jsonb,
  facts_discovered text[],
  action_chosen text,
  score_discovery int,
  score_action int,
  score_efficiency int,
  score_total int,
  completed_at timestamptz default now()
);

-- Indexes
create index if not exists idx_adventure_visitors_slug on public.adventure_visitors(slug);
create index if not exists idx_adventure_sessions_visitor_id on public.adventure_sessions(visitor_id);
create index if not exists idx_adventure_sessions_scenario_id on public.adventure_sessions(scenario_id);

-- RLS: adventure tables are publicly readable (no auth required for the game)
-- but only service_role can insert/update (via edge functions)
alter table public.adventure_visitors enable row level security;
alter table public.adventure_sessions enable row level security;

-- Anyone can read visitors (needed for slug lookup)
create policy "adventure_visitors_select" on public.adventure_visitors
  for select using (true);

-- Anyone can read sessions (for score display)
create policy "adventure_sessions_select" on public.adventure_sessions
  for select using (true);

-- Only service role can modify
create policy "adventure_visitors_insert" on public.adventure_visitors
  for insert with check (auth.role() = 'service_role');

create policy "adventure_visitors_update" on public.adventure_visitors
  for update using (auth.role() = 'service_role');

create policy "adventure_sessions_insert" on public.adventure_sessions
  for insert with check (auth.role() = 'service_role');

-- Updated_at trigger
create or replace function public.adventure_update_timestamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger adventure_visitors_updated_at
  before update on public.adventure_visitors
  for each row execute function public.adventure_update_timestamp();
