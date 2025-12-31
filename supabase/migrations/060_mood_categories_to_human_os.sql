-- 060_mood_categories_to_human_os.sql
-- Move mood_categories and mood_category_mappings from founder_os to human_os
-- Makes the complete mood system portable across all products

-- =============================================================================
-- MOVE TABLES FROM FOUNDER_OS TO HUMAN_OS (idempotent)
-- =============================================================================

do $$
begin
  -- Move mood_categories
  if exists (select 1 from information_schema.tables where table_schema = 'founder_os' and table_name = 'mood_categories') then
    alter table founder_os.mood_categories set schema human_os;
    raise notice 'Moved mood_categories to human_os schema';
  end if;

  -- Move mood_category_mappings
  if exists (select 1 from information_schema.tables where table_schema = 'founder_os' and table_name = 'mood_category_mappings') then
    alter table founder_os.mood_category_mappings set schema human_os;
    raise notice 'Moved mood_category_mappings to human_os schema';
  end if;
end $$;

-- =============================================================================
-- RECREATE HELPER FUNCTIONS IN HUMAN_OS SCHEMA
-- =============================================================================

-- Drop old functions from founder_os if they exist
drop function if exists founder_os.get_moods_by_category(text);
drop function if exists founder_os.search_moods(text, text, int, int, int, int);

-- Get moods by category slug
create or replace function human_os.get_moods_by_category(
  p_category_slug text
)
returns table (
  mood_id uuid,
  mood_name text,
  joy_rating int,
  trust_rating int,
  fear_rating int,
  surprise_rating int,
  sadness_rating int,
  anticipation_rating int,
  anger_rating int,
  disgust_rating int,
  intensity int,
  valence int,
  color_hex text,
  relevance_score numeric
)
language sql
stable
as $$
  select
    m.id as mood_id,
    m.name as mood_name,
    m.joy_rating,
    m.trust_rating,
    m.fear_rating,
    m.surprise_rating,
    m.sadness_rating,
    m.anticipation_rating,
    m.anger_rating,
    m.disgust_rating,
    m.intensity,
    m.valence,
    m.color_hex,
    mcm.relevance_score
  from human_os.mood_definitions m
  join human_os.mood_category_mappings mcm on m.id = mcm.mood_id
  join human_os.mood_categories c on mcm.category_id = c.id
  where c.slug = p_category_slug
  order by mcm.relevance_score desc, m.name;
$$;

-- Search moods with filters
create or replace function human_os.search_moods(
  p_search_term text default null,
  p_category_type text default null,
  p_min_valence int default null,
  p_max_valence int default null,
  p_min_intensity int default null,
  p_max_intensity int default null
)
returns table (
  mood_id uuid,
  mood_name text,
  category text,
  joy_rating int,
  trust_rating int,
  fear_rating int,
  surprise_rating int,
  sadness_rating int,
  anticipation_rating int,
  anger_rating int,
  disgust_rating int,
  intensity int,
  valence int,
  color_hex text
)
language sql
stable
as $$
  select distinct
    m.id as mood_id,
    m.name as mood_name,
    m.category,
    m.joy_rating,
    m.trust_rating,
    m.fear_rating,
    m.surprise_rating,
    m.sadness_rating,
    m.anticipation_rating,
    m.anger_rating,
    m.disgust_rating,
    m.intensity,
    m.valence,
    m.color_hex
  from human_os.mood_definitions m
  left join human_os.mood_category_mappings mcm on m.id = mcm.mood_id
  left join human_os.mood_categories c on mcm.category_id = c.id
  where
    (p_search_term is null or m.name ilike '%' || p_search_term || '%')
    and (p_category_type is null or c.category_type = p_category_type)
    and (p_min_valence is null or m.valence >= p_min_valence)
    and (p_max_valence is null or m.valence <= p_max_valence)
    and (p_min_intensity is null or m.intensity >= p_min_intensity)
    and (p_max_intensity is null or m.intensity <= p_max_intensity)
  order by m.name;
$$;

-- Get mood with full category details
create or replace function human_os.get_mood_details(
  p_mood_name text
)
returns table (
  mood_id uuid,
  mood_name text,
  joy_rating int,
  trust_rating int,
  fear_rating int,
  surprise_rating int,
  sadness_rating int,
  anticipation_rating int,
  anger_rating int,
  disgust_rating int,
  intensity int,
  arousal_level int,
  valence int,
  dominance int,
  color_hex text,
  is_core boolean,
  categories jsonb
)
language sql
stable
as $$
  select
    m.id as mood_id,
    m.name as mood_name,
    m.joy_rating,
    m.trust_rating,
    m.fear_rating,
    m.surprise_rating,
    m.sadness_rating,
    m.anticipation_rating,
    m.anger_rating,
    m.disgust_rating,
    m.intensity,
    m.arousal_level,
    m.valence,
    m.dominance,
    m.color_hex,
    m.is_core,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'name', c.name,
          'slug', c.slug,
          'type', c.category_type,
          'color', c.color_hex,
          'isPrimary', mcm.is_primary
        )
      ) filter (where c.id is not null),
      '[]'::jsonb
    ) as categories
  from human_os.mood_definitions m
  left join human_os.mood_category_mappings mcm on m.id = mcm.mood_id
  left join human_os.mood_categories c on mcm.category_id = c.id
  where m.name ilike p_mood_name
  group by m.id;
$$;

-- =============================================================================
-- GRANTS
-- =============================================================================

grant all on human_os.mood_categories to service_role;
grant select on human_os.mood_categories to authenticated;
grant select on human_os.mood_categories to anon;

grant all on human_os.mood_category_mappings to service_role;
grant select on human_os.mood_category_mappings to authenticated;
grant select on human_os.mood_category_mappings to anon;

grant execute on function human_os.get_moods_by_category to authenticated;
grant execute on function human_os.get_moods_by_category to service_role;
grant execute on function human_os.get_moods_by_category to anon;

grant execute on function human_os.search_moods to authenticated;
grant execute on function human_os.search_moods to service_role;
grant execute on function human_os.search_moods to anon;

grant execute on function human_os.get_mood_details to authenticated;
grant execute on function human_os.get_mood_details to service_role;
grant execute on function human_os.get_mood_details to anon;

-- =============================================================================
-- COMMENTS
-- =============================================================================

comment on table human_os.mood_categories is
  'Categories for organizing moods by life domain, emotional type, intensity, or context. Portable across all products.';

comment on table human_os.mood_category_mappings is
  'Maps moods to categories for filtering and organization.';

comment on function human_os.get_moods_by_category is
  'Get all moods belonging to a category by slug.';

comment on function human_os.search_moods is
  'Search moods with optional filters for term, category type, valence, and intensity.';

comment on function human_os.get_mood_details is
  'Get detailed mood information including all linked categories.';
