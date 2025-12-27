-- 045_move_journal_to_human_os.sql
-- Move journal tables from public schema to human_os schema
-- This is idempotent - safe to run multiple times

-- =============================================================================
-- ENSURE SCHEMA EXISTS
-- =============================================================================
create schema if not exists human_os;

-- Grant usage on human_os schema
grant usage on schema human_os to authenticated;
grant usage on schema human_os to service_role;
grant usage on schema human_os to anon;

-- =============================================================================
-- MOVE TABLES FROM PUBLIC TO HUMAN_OS (idempotent)
-- =============================================================================

do $$
begin
  -- Move mood_definitions
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'mood_definitions') then
    alter table public.mood_definitions set schema human_os;
    raise notice 'Moved mood_definitions to human_os schema';
  end if;

  -- Move journal_entries
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'journal_entries') then
    alter table public.journal_entries set schema human_os;
    raise notice 'Moved journal_entries to human_os schema';
  end if;

  -- Move journal_entry_moods
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'journal_entry_moods') then
    alter table public.journal_entry_moods set schema human_os;
    raise notice 'Moved journal_entry_moods to human_os schema';
  end if;

  -- Move journal_entity_mentions
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'journal_entity_mentions') then
    alter table public.journal_entity_mentions set schema human_os;
    raise notice 'Moved journal_entity_mentions to human_os schema';
  end if;

  -- Move journal_leads
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'journal_leads') then
    alter table public.journal_leads set schema human_os;
    raise notice 'Moved journal_leads to human_os schema';
  end if;
end $$;

-- =============================================================================
-- UPDATE FOREIGN KEY REFERENCES IN FOUNDER_OS TABLES
-- =============================================================================

-- Drop and recreate FK on mood_category_mappings if it references public schema
do $$
begin
  -- Check if the constraint exists and references public.mood_definitions
  if exists (
    select 1 from information_schema.table_constraints tc
    join information_schema.constraint_column_usage ccu on tc.constraint_name = ccu.constraint_name
    where tc.table_schema = 'founder_os'
      and tc.table_name = 'mood_category_mappings'
      and tc.constraint_type = 'FOREIGN KEY'
      and ccu.table_schema = 'public'
      and ccu.table_name = 'mood_definitions'
  ) then
    -- Find and drop the constraint
    execute (
      select 'alter table founder_os.mood_category_mappings drop constraint ' || tc.constraint_name
      from information_schema.table_constraints tc
      join information_schema.constraint_column_usage ccu on tc.constraint_name = ccu.constraint_name
      where tc.table_schema = 'founder_os'
        and tc.table_name = 'mood_category_mappings'
        and tc.constraint_type = 'FOREIGN KEY'
        and ccu.table_name = 'mood_definitions'
      limit 1
    );

    -- Add new FK referencing human_os.mood_definitions
    alter table founder_os.mood_category_mappings
      add constraint mood_category_mappings_mood_id_fkey
      foreign key (mood_id) references human_os.mood_definitions(id) on delete cascade;

    raise notice 'Updated mood_category_mappings FK to reference human_os.mood_definitions';
  end if;
end $$;

-- =============================================================================
-- GRANTS FOR HUMAN_OS TABLES
-- =============================================================================

grant all on human_os.mood_definitions to service_role;
grant select on human_os.mood_definitions to authenticated;
grant select on human_os.mood_definitions to anon;

grant all on human_os.journal_entries to service_role;
grant all on human_os.journal_entry_moods to service_role;
grant all on human_os.journal_entity_mentions to service_role;
grant all on human_os.journal_leads to service_role;
