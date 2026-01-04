-- Road Trip Tables - Add to existing goodhang Supabase database
-- Run this SQL in your Supabase SQL Editor

-- Table: roadtrip_interests
-- Stores interest submissions from visitors for both planned stops and custom locations
create table if not exists roadtrip_interests (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  name text not null,
  email text not null,
  linkedin text,
  stop_id text,                    -- null if custom location
  custom_city text,                -- user-entered city name (for custom spots)
  custom_lat decimal,              -- latitude for custom spots
  custom_lng decimal,              -- longitude for custom spots
  -- Work interests
  interest_brainstorm boolean default false,
  interest_renubu boolean default false,
  interest_workshop boolean default false,
  interest_happy_hour boolean default false,
  -- Fun interests
  interest_coffee boolean default false,
  interest_dinner boolean default false,
  interest_crash boolean default false,
  interest_intro boolean default false,
  -- Adventure interests
  interest_join_leg boolean default false,
  interest_unknown boolean default false,
  note text
);

-- Table: roadtrip_messages
-- Stores freeform messages from visitors
create table if not exists roadtrip_messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  name text,
  email text not null,
  message text not null
);

-- Enable Row Level Security (RLS)
alter table roadtrip_interests enable row level security;
alter table roadtrip_messages enable row level security;

-- Policies for roadtrip_interests
-- Allow anyone to insert (for form submissions)
create policy "Allow public insert on roadtrip_interests" on roadtrip_interests
  for insert with check (true);

-- Allow anyone to read custom spot data (for social proof markers)
create policy "Allow public select custom spots" on roadtrip_interests
  for select using (custom_city is not null);

-- Allow anyone to read stop_id counts (for social proof)
create policy "Allow public select stop counts" on roadtrip_interests
  for select using (stop_id is not null);

-- Policies for roadtrip_messages
-- Allow anyone to insert (for form submissions)
create policy "Allow public insert on roadtrip_messages" on roadtrip_messages
  for insert with check (true);

-- Create indexes for better query performance
create index if not exists idx_roadtrip_interests_stop_id on roadtrip_interests(stop_id);
create index if not exists idx_roadtrip_interests_custom_city on roadtrip_interests(custom_city);
create index if not exists idx_roadtrip_interests_created_at on roadtrip_interests(created_at);
create index if not exists idx_roadtrip_messages_created_at on roadtrip_messages(created_at);

-- Grant access to the anon role (public access)
grant select, insert on roadtrip_interests to anon;
grant select, insert on roadtrip_messages to anon;
