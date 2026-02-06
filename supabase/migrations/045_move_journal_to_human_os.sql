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
  -- Move mood_definitions (only if in public AND not already in human_os)
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'mood_definitions')
     and not exists (select 1 from information_schema.tables where table_schema = 'human_os' and table_name = 'mood_definitions') then
    alter table public.mood_definitions set schema human_os;
    raise notice 'Moved mood_definitions to human_os schema';
  end if;

  -- Move journal_entries
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'journal_entries')
     and not exists (select 1 from information_schema.tables where table_schema = 'human_os' and table_name = 'journal_entries') then
    alter table public.journal_entries set schema human_os;
    raise notice 'Moved journal_entries to human_os schema';
  end if;

  -- Move journal_entry_moods
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'journal_entry_moods')
     and not exists (select 1 from information_schema.tables where table_schema = 'human_os' and table_name = 'journal_entry_moods') then
    alter table public.journal_entry_moods set schema human_os;
    raise notice 'Moved journal_entry_moods to human_os schema';
  end if;

  -- Move journal_entity_mentions
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'journal_entity_mentions')
     and not exists (select 1 from information_schema.tables where table_schema = 'human_os' and table_name = 'journal_entity_mentions') then
    alter table public.journal_entity_mentions set schema human_os;
    raise notice 'Moved journal_entity_mentions to human_os schema';
  end if;

  -- Move journal_leads
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'journal_leads')
     and not exists (select 1 from information_schema.tables where table_schema = 'human_os' and table_name = 'journal_leads') then
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
  -- First, clean up any orphaned mood_category_mappings records
  if exists (select 1 from information_schema.tables where table_schema = 'founder_os' and table_name = 'mood_category_mappings')
     and exists (select 1 from information_schema.tables where table_schema = 'human_os' and table_name = 'mood_definitions') then
    delete from founder_os.mood_category_mappings
    where mood_id not in (select id from human_os.mood_definitions);
    raise notice 'Cleaned up orphaned mood_category_mappings records';
  end if;

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
    ALTER TABLE founder_os.mood_category_mappings
      ADD CONSTRAINT mood_category_mappings_mood_id_fkey
      FOREIGN KEY (mood_id) REFERENCES human_os.mood_definitions(id) ON DELETE CASCADE;

    raise notice 'Updated mood_category_mappings FK to reference human_os.mood_definitions';
  end if;

  -- Also handle case where constraint doesn't exist yet but table does
  if exists (select 1 from information_schema.tables where table_schema = 'founder_os' and table_name = 'mood_category_mappings')
     and exists (select 1 from information_schema.tables where table_schema = 'human_os' and table_name = 'mood_definitions')
     and not exists (
       select 1 from information_schema.table_constraints
       where table_schema = 'founder_os'
         and table_name = 'mood_category_mappings'
         and constraint_name = 'mood_category_mappings_mood_id_fkey'
     ) then
    ALTER TABLE founder_os.mood_category_mappings
      ADD CONSTRAINT mood_category_mappings_mood_id_fkey
      FOREIGN KEY (mood_id) REFERENCES human_os.mood_definitions(id) ON DELETE CASCADE;
    raise notice 'Added mood_category_mappings FK to reference human_os.mood_definitions';
  end if;
end $$;

-- =============================================================================
-- GRANTS FOR HUMAN_OS TABLES (if they exist)
-- =============================================================================

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'human_os' and table_name = 'mood_definitions') then
    grant all on human_os.mood_definitions to service_role;
    grant select on human_os.mood_definitions to authenticated;
    grant select on human_os.mood_definitions to anon;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'human_os' and table_name = 'journal_entries') then
    grant all on human_os.journal_entries to service_role;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'human_os' and table_name = 'journal_entry_moods') then
    grant all on human_os.journal_entry_moods to service_role;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'human_os' and table_name = 'journal_entity_mentions') then
    grant all on human_os.journal_entity_mentions to service_role;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'human_os' and table_name = 'journal_leads') then
    grant all on human_os.journal_leads to service_role;
  end if;
end $$;
