-- Adventure phone messages table
create table if not exists public.adventure_messages (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid references public.adventure_visitors(id),
  visitor_name text,
  message text not null,
  created_at timestamptz default now()
);

-- Allow anon inserts (edge function uses service role, but belt-and-suspenders)
alter table public.adventure_messages enable row level security;

create policy "Service role can manage messages"
  on public.adventure_messages
  for all
  using (true)
  with check (true);
