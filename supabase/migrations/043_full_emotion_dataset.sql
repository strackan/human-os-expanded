-- 043_full_emotion_dataset.sql
-- Extended emotion dataset ported from creativityjournal
--
-- Adds:
-- 1. mood_categories table with 60+ categories
-- 2. mood_category_mappings junction table
-- 3. Additional mood definitions beyond the core 52

-- =============================================================================
-- MOOD CATEGORIES TABLE
-- =============================================================================

create table if not exists founder_os.mood_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  color_hex text default '#6B7280',
  icon_name text,
  category_type text not null check (category_type in ('life_domain', 'emotional_type', 'intensity_level', 'context')),
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table founder_os.mood_categories is
  'Categories for organizing and filtering moods by life domain, emotional type, intensity, or context.';

-- Index for lookups
create index if not exists mood_categories_slug_idx on founder_os.mood_categories(slug);
create index if not exists mood_categories_type_idx on founder_os.mood_categories(category_type);

-- =============================================================================
-- MOOD TO CATEGORY MAPPINGS
-- =============================================================================

create table if not exists founder_os.mood_category_mappings (
  id uuid primary key default gen_random_uuid(),
  mood_id uuid not null references public.mood_definitions(id) on delete cascade,
  category_id uuid not null references founder_os.mood_categories(id) on delete cascade,
  relevance_score numeric(3,2) default 1.00,
  is_primary boolean default false,
  created_at timestamptz default now(),
  unique(mood_id, category_id)
);

comment on table founder_os.mood_category_mappings is
  'Maps moods to categories for filtering and organization.';

-- Indexes
create index if not exists mood_category_mappings_mood_idx on founder_os.mood_category_mappings(mood_id);
create index if not exists mood_category_mappings_category_idx on founder_os.mood_category_mappings(category_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

alter table founder_os.mood_categories enable row level security;
alter table founder_os.mood_category_mappings enable row level security;

create policy "Allow all mood category operations"
  on founder_os.mood_categories for all
  using (true) with check (true);

create policy "Allow all mood category mapping operations"
  on founder_os.mood_category_mappings for all
  using (true) with check (true);

-- =============================================================================
-- GRANTS
-- =============================================================================

grant all on founder_os.mood_categories to authenticated;
grant all on founder_os.mood_categories to service_role;
grant all on founder_os.mood_categories to anon;

grant all on founder_os.mood_category_mappings to authenticated;
grant all on founder_os.mood_category_mappings to service_role;
grant all on founder_os.mood_category_mappings to anon;

-- =============================================================================
-- SEED CATEGORIES (60+ categories from creativityjournal)
-- =============================================================================

-- LIFE DOMAIN CATEGORIES
insert into founder_os.mood_categories (name, slug, description, color_hex, icon_name, category_type, display_order) values
('Personal Growth', 'personal-growth', 'Self-improvement, identity, and personal development emotions', '#8B5CF6', 'user', 'life_domain', 10),
('Self-Reflection', 'self-reflection', 'Introspective and self-awareness emotions', '#6366F1', 'mirror', 'life_domain', 11),
('Identity & Values', 'identity-values', 'Emotions related to personal identity and core values', '#7C3AED', 'heart', 'life_domain', 12),
('Romantic Relationships', 'romantic', 'Love, dating, marriage, and romantic emotions', '#EC4899', 'heart', 'life_domain', 20),
('Family', 'family', 'Emotions related to family relationships and dynamics', '#F59E0B', 'home', 'life_domain', 21),
('Friendships', 'friendships', 'Emotions from friendships and social connections', '#10B981', 'users', 'life_domain', 22),
('Social Situations', 'social', 'Group dynamics, social anxiety, and community emotions', '#06B6D4', 'users', 'life_domain', 23),
('Interpersonal Conflict', 'conflict', 'Emotions from disagreements and relationship tensions', '#EF4444', 'zap', 'life_domain', 24),
('Career Development', 'career', 'Professional growth, ambitions, and career changes', '#0EA5E9', 'briefcase', 'life_domain', 30),
('Workplace Dynamics', 'workplace', 'Office relationships, team interactions, and work culture', '#0369A1', 'building', 'life_domain', 31),
('Job Performance', 'performance', 'Work achievements, failures, and productivity emotions', '#059669', 'target', 'life_domain', 32),
('Work-Life Balance', 'work-life-balance', 'Managing professional and personal life demands', '#7C2D12', 'scale', 'life_domain', 33),
('Physical Health', 'physical-health', 'Body, fitness, illness, and physical wellbeing emotions', '#DC2626', 'activity', 'life_domain', 40),
('Mental Health', 'mental-health', 'Psychological wellbeing, therapy, and mental state emotions', '#7C3AED', 'brain', 'life_domain', 41),
('Wellness Practices', 'wellness', 'Meditation, self-care, and wellness routine emotions', '#059669', 'heart', 'life_domain', 42),
('Medical Experiences', 'medical', 'Healthcare, treatment, and medical procedure emotions', '#DC2626', 'shield', 'life_domain', 43),
('Education', 'education', 'Learning, studying, and academic achievement emotions', '#7C3AED', 'book', 'life_domain', 50),
('Skill Development', 'skills', 'Learning new abilities and improving competencies', '#059669', 'trending-up', 'life_domain', 51),
('Intellectual Growth', 'intellectual', 'Knowledge acquisition and cognitive development', '#6366F1', 'lightbulb', 'life_domain', 52),
('Teaching & Mentoring', 'teaching', 'Emotions from guiding and instructing others', '#F59E0B', 'user-check', 'life_domain', 53),
('Creative Expression', 'creative', 'Artistic creation, inspiration, and creative flow emotions', '#EC4899', 'palette', 'life_domain', 60),
('Artistic Performance', 'performance-arts', 'Performing arts, exhibitions, and artistic presentation', '#8B5CF6', 'music', 'life_domain', 61),
('Innovation', 'innovation', 'Invention, problem-solving, and breakthrough emotions', '#06B6D4', 'lightbulb', 'life_domain', 62),
('Aesthetic Appreciation', 'aesthetic', 'Beauty, art appreciation, and aesthetic experiences', '#EC4899', 'eye', 'life_domain', 63),
('Financial Security', 'financial', 'Money, wealth, and financial stability emotions', '#059669', 'dollar-sign', 'life_domain', 70),
('Economic Stress', 'economic-stress', 'Financial pressure, debt, and economic anxiety', '#DC2626', 'alert-triangle', 'life_domain', 71),
('Material Possessions', 'possessions', 'Emotions related to ownership and material goods', '#F59E0B', 'package', 'life_domain', 72),
('Entertainment', 'entertainment', 'Movies, games, and entertainment consumption emotions', '#EC4899', 'play', 'life_domain', 80),
('Sports & Competition', 'sports', 'Athletic activities and competitive emotions', '#EF4444', 'trophy', 'life_domain', 81),
('Hobbies', 'hobbies', 'Personal interests and recreational activities', '#10B981', 'star', 'life_domain', 82),
('Travel & Adventure', 'travel', 'Exploration, journeys, and adventure emotions', '#06B6D4', 'map', 'life_domain', 83),
('Nature & Outdoors', 'nature', 'Natural environments and outdoor experiences', '#059669', 'tree', 'life_domain', 90),
('Home & Living Space', 'home', 'Domestic life and living environment emotions', '#F59E0B', 'home', 'life_domain', 91),
('Weather & Seasons', 'weather', 'Climate and seasonal emotion influences', '#6B7280', 'cloud', 'life_domain', 92),
('Technology & Digital', 'technology', 'Digital life, social media, and technology emotions', '#6B7280', 'smartphone', 'life_domain', 93),
('Spirituality', 'spirituality', 'Religious, spiritual, and transcendent emotions', '#7C3AED', 'sun', 'life_domain', 100),
('Life Purpose', 'purpose', 'Meaning, direction, and existential emotions', '#8B5CF6', 'compass', 'life_domain', 101),
('Mindfulness', 'mindfulness', 'Present-moment awareness and mindfulness emotions', '#059669', 'circle', 'life_domain', 102)
on conflict (slug) do nothing;

-- EMOTIONAL TYPE CATEGORIES
insert into founder_os.mood_categories (name, slug, description, color_hex, icon_name, category_type, display_order) values
('Joy & Happiness', 'joy-emotions', 'Primary joy-based emotions and variations', '#F59E0B', 'smile', 'emotional_type', 200),
('Trust & Acceptance', 'trust-emotions', 'Trust, confidence, and acceptance emotions', '#10B981', 'shield-check', 'emotional_type', 201),
('Fear & Anxiety', 'fear-emotions', 'Fear, worry, and anxiety-related emotions', '#8B5CF6', 'alert-triangle', 'emotional_type', 202),
('Surprise & Wonder', 'surprise-emotions', 'Surprise, astonishment, and wonder emotions', '#EC4899', 'zap', 'emotional_type', 203),
('Sadness & Grief', 'sadness-emotions', 'Sadness, sorrow, and grief-related emotions', '#3B82F6', 'cloud-rain', 'emotional_type', 204),
('Anticipation & Hope', 'anticipation-emotions', 'Anticipation, expectation, and hope emotions', '#84CC16', 'arrow-up', 'emotional_type', 205),
('Anger & Frustration', 'anger-emotions', 'Anger, rage, and frustration emotions', '#EF4444', 'flame', 'emotional_type', 206),
('Disgust & Aversion', 'disgust-emotions', 'Disgust, contempt, and aversion emotions', '#059669', 'x-circle', 'emotional_type', 207),
('Mixed Emotions', 'mixed-emotions', 'Complex emotions with multiple components', '#6B7280', 'shuffle', 'emotional_type', 210),
('Social Emotions', 'social-emotions', 'Emotions arising from social interactions', '#06B6D4', 'users', 'emotional_type', 211),
('Achievement Emotions', 'achievement-emotions', 'Success, failure, and accomplishment emotions', '#84CC16', 'award', 'emotional_type', 212),
('Moral Emotions', 'moral-emotions', 'Ethics, guilt, pride, and moral judgment emotions', '#7C3AED', 'balance-scale', 'emotional_type', 213)
on conflict (slug) do nothing;

-- INTENSITY LEVEL CATEGORIES
insert into founder_os.mood_categories (name, slug, description, color_hex, icon_name, category_type, display_order) values
('Mild Emotions', 'mild', 'Low-intensity, subtle emotional states', '#D1D5DB', 'minus', 'intensity_level', 300),
('Moderate Emotions', 'moderate', 'Medium-intensity, noticeable emotional states', '#6B7280', 'circle', 'intensity_level', 301),
('Intense Emotions', 'intense', 'High-intensity, overwhelming emotional states', '#374151', 'plus', 'intensity_level', 302)
on conflict (slug) do nothing;

-- CONTEXTUAL CATEGORIES
insert into founder_os.mood_categories (name, slug, description, color_hex, icon_name, category_type, display_order) values
('Daily Life', 'daily', 'Routine and everyday emotional experiences', '#6B7280', 'calendar', 'context', 400),
('Special Events', 'events', 'Holidays, celebrations, and special occasions', '#F59E0B', 'gift', 'context', 401),
('Transitions', 'transitions', 'Life changes and transitional periods', '#8B5CF6', 'arrow-right', 'context', 402),
('Crisis Situations', 'crisis', 'Emergency, trauma, and crisis emotions', '#DC2626', 'alert-octagon', 'context', 403)
on conflict (slug) do nothing;

-- =============================================================================
-- ADDITIONAL MOOD DEFINITIONS (beyond core 52)
-- =============================================================================

-- Extended emotional states
insert into public.mood_definitions (name, joy_rating, trust_rating, fear_rating, surprise_rating, sadness_rating, anticipation_rating, anger_rating, disgust_rating, intensity, arousal_level, valence, dominance, is_core, category, color_hex) values
-- Additional joy variants
('Blissful', 9, 3, 0, 0, 0, 0, 0, 0, 8, 6, 9, 6, false, 'joy-emotions', '#FCD34D'),
('Cheerful', 7, 2, 0, 0, 0, 0, 0, 0, 5, 6, 8, 5, false, 'joy-emotions', '#FBBF24'),
('Elated', 9, 0, 0, 3, 0, 3, 0, 0, 8, 8, 9, 7, false, 'joy-emotions', '#F59E0B'),
('Euphoric', 10, 0, 0, 3, 0, 0, 0, 0, 9, 9, 10, 7, false, 'joy-emotions', '#D97706'),
('Jubilant', 9, 0, 0, 3, 0, 3, 0, 0, 8, 8, 9, 7, false, 'joy-emotions', '#FDE047'),
('Overjoyed', 9, 0, 0, 3, 0, 3, 0, 0, 9, 9, 9, 7, false, 'joy-emotions', '#FACC15'),
('Playful', 7, 3, 0, 2, 0, 4, 0, 0, 5, 7, 8, 6, false, 'joy-emotions', '#FEF08A'),
('Radiant', 8, 4, 0, 0, 0, 0, 0, 0, 7, 6, 9, 6, false, 'joy-emotions', '#FEF3C7'),

-- Additional trust variants
('Secure', 3, 8, 0, 0, 0, 0, 0, 0, 5, 3, 7, 6, false, 'trust-emotions', '#6EE7B7'),
('Connected', 4, 7, 0, 0, 0, 0, 0, 0, 6, 4, 8, 5, false, 'social-emotions', '#34D399'),
('Supported', 3, 8, 0, 0, 0, 0, 0, 0, 5, 3, 8, 5, false, 'social-emotions', '#10B981'),
('Affectionate', 6, 6, 0, 0, 0, 0, 0, 0, 6, 5, 8, 5, false, 'social-emotions', '#F472B6'),

-- Additional fear variants
('Worried', 0, 0, 6, 0, 2, 0, 0, 0, 5, 6, 3, 3, false, 'fear-emotions', '#C084FC'),
('Panicked', 0, 0, 9, 3, 2, 0, 0, 0, 9, 10, 1, 2, false, 'fear-emotions', '#A855F7'),
('Insecure', 0, 0, 5, 0, 3, 0, 0, 0, 5, 5, 3, 2, false, 'fear-emotions', '#D8B4FE'),
('Vulnerable', 0, 2, 5, 0, 3, 0, 0, 0, 5, 4, 3, 2, false, 'fear-emotions', '#E9D5FF'),

-- Additional sadness variants
('Heartbroken', 0, 0, 2, 0, 10, 0, 0, 0, 9, 5, 1, 2, false, 'sadness-emotions', '#2563EB'),
('Melancholy', 2, 0, 0, 0, 6, 0, 0, 0, 5, 3, 3, 4, false, 'sadness-emotions', '#60A5FA'),
('Despondent', 0, 0, 2, 0, 8, 0, 0, 0, 7, 3, 2, 2, false, 'sadness-emotions', '#3B82F6'),
('Defeated', 0, 0, 3, 0, 7, 0, 2, 0, 7, 4, 2, 2, false, 'sadness-emotions', '#1D4ED8'),
('Forlorn', 0, 0, 2, 0, 7, 0, 0, 0, 6, 3, 2, 3, false, 'sadness-emotions', '#1E40AF'),

-- Additional anger variants
('Bitter', 0, 0, 0, 0, 3, 0, 6, 2, 6, 4, 2, 5, false, 'anger-emotions', '#DC2626'),
('Resentful', 0, 0, 0, 0, 3, 0, 6, 2, 6, 5, 2, 5, false, 'anger-emotions', '#B91C1C'),
('Hostile', 0, 0, 2, 0, 0, 0, 8, 2, 7, 7, 2, 7, false, 'anger-emotions', '#991B1B'),
('Irritable', 0, 0, 2, 0, 0, 0, 5, 2, 5, 6, 3, 5, false, 'anger-emotions', '#FECACA'),
('Outraged', 0, 0, 2, 3, 0, 0, 9, 3, 9, 9, 2, 8, false, 'anger-emotions', '#7F1D1D'),

-- Additional anticipation variants
('Eager', 4, 0, 0, 0, 0, 8, 0, 0, 7, 7, 8, 6, false, 'anticipation-emotions', '#A3E635'),
('Restless', 0, 0, 3, 0, 0, 7, 2, 0, 6, 7, 4, 4, false, 'anticipation-emotions', '#BEF264'),
('Impatient', 0, 0, 2, 0, 0, 7, 4, 0, 6, 7, 4, 5, false, 'anticipation-emotions', '#D9F99D'),

-- Additional surprise variants
('Astonished', 0, 0, 0, 10, 0, 0, 0, 0, 8, 9, 5, 4, false, 'surprise-emotions', '#F9A8D4'),
('Shocked', 0, 0, 3, 9, 0, 0, 0, 0, 8, 9, 4, 3, false, 'surprise-emotions', '#F472B6'),
('Bewildered', 0, 0, 3, 7, 2, 0, 0, 0, 6, 6, 4, 3, false, 'surprise-emotions', '#EC4899'),
('Fascinated', 2, 3, 0, 6, 0, 5, 0, 0, 6, 6, 7, 5, false, 'surprise-emotions', '#FBCFE8'),

-- Additional disgust variants
('Repulsed', 0, 0, 2, 0, 0, 0, 2, 9, 8, 6, 1, 5, false, 'disgust-emotions', '#065F46'),
('Revolted', 0, 0, 2, 0, 0, 0, 2, 9, 8, 6, 1, 5, false, 'disgust-emotions', '#047857'),
('Appalled', 0, 0, 2, 5, 0, 0, 3, 8, 8, 7, 2, 5, false, 'disgust-emotions', '#059669'),
('Disdainful', 0, 0, 0, 0, 0, 0, 4, 7, 6, 4, 2, 7, false, 'disgust-emotions', '#10B981'),

-- Complex/mixed emotions
('Ambivalent', 3, 2, 2, 0, 3, 2, 0, 0, 5, 4, 5, 4, false, 'mixed-emotions', '#9CA3AF'),
('Conflicted', 2, 0, 3, 2, 3, 2, 2, 0, 6, 5, 4, 4, false, 'mixed-emotions', '#6B7280'),
('Bittersweet', 4, 2, 0, 0, 5, 0, 0, 0, 5, 4, 5, 4, false, 'mixed-emotions', '#F9A8D4'),
('Wistful', 3, 2, 0, 0, 4, 3, 0, 0, 4, 3, 5, 4, false, 'mixed-emotions', '#FED7E2'),
('Torn', 0, 0, 4, 0, 4, 3, 2, 0, 6, 6, 3, 3, false, 'mixed-emotions', '#E5E7EB'),

-- Social/moral emotions
('Empathetic', 3, 6, 0, 0, 2, 0, 0, 0, 5, 4, 6, 5, false, 'social-emotions', '#FDA4AF'),
('Compassionate', 3, 6, 0, 0, 2, 0, 0, 0, 6, 4, 7, 5, false, 'social-emotions', '#FECDD3'),
('Envious', 0, 0, 2, 0, 3, 3, 4, 0, 6, 5, 3, 4, false, 'moral-emotions', '#F87171'),
('Jealous', 0, 0, 3, 0, 2, 3, 5, 0, 6, 6, 3, 4, false, 'moral-emotions', '#FCA5A5'),
('Ashamed', 0, 0, 4, 0, 5, 0, 0, 4, 6, 4, 2, 2, false, 'moral-emotions', '#9CA3AF'),
('Humiliated', 0, 0, 5, 0, 6, 0, 2, 3, 8, 6, 1, 1, false, 'moral-emotions', '#6B7280'),
('Embarrassed', 0, 0, 4, 3, 3, 0, 0, 2, 5, 5, 3, 2, false, 'social-emotions', '#FCA5A5'),

-- Energy/wellness states
('Energetic', 6, 2, 0, 0, 0, 5, 0, 0, 7, 8, 8, 7, false, 'wellness', '#34D399'),
('Rejuvenated', 5, 3, 0, 0, 0, 4, 0, 0, 6, 6, 8, 6, false, 'wellness', '#6EE7B7'),
('Drained', 0, 0, 2, 0, 4, 0, 0, 2, 5, 2, 3, 3, false, 'wellness', '#D1D5DB'),
('Exhausted', 0, 0, 2, 0, 4, 0, 2, 2, 6, 1, 2, 2, false, 'wellness', '#9CA3AF'),
('Restful', 4, 5, 0, 0, 0, 0, 0, 0, 3, 1, 7, 5, false, 'wellness', '#E0F2FE'),
('Refreshed', 5, 4, 0, 0, 0, 3, 0, 0, 5, 5, 8, 6, false, 'wellness', '#CFFAFE'),

-- Achievement emotions
('Accomplished', 7, 5, 0, 0, 0, 3, 0, 0, 7, 6, 8, 7, false, 'achievement-emotions', '#BBF7D0'),
('Victorious', 8, 4, 0, 2, 0, 3, 0, 0, 8, 8, 9, 8, false, 'achievement-emotions', '#86EFAC'),
('Determined', 3, 4, 0, 0, 0, 8, 2, 0, 7, 7, 6, 8, false, 'achievement-emotions', '#4ADE80'),
('Driven', 3, 3, 0, 0, 0, 8, 0, 0, 7, 7, 7, 7, false, 'achievement-emotions', '#22C55E'),
('Ambitious', 4, 3, 0, 0, 0, 8, 0, 0, 7, 7, 7, 7, false, 'achievement-emotions', '#16A34A'),
('Focused', 2, 4, 0, 0, 0, 6, 0, 0, 6, 6, 6, 7, false, 'achievement-emotions', '#15803D'),

-- Creative emotions
('Creative', 5, 2, 0, 3, 0, 5, 0, 0, 6, 6, 7, 6, false, 'creative', '#F0ABFC'),
('Imaginative', 5, 2, 0, 4, 0, 5, 0, 0, 6, 6, 7, 6, false, 'creative', '#E879F9'),
('Innovative', 5, 3, 0, 4, 0, 6, 0, 0, 7, 7, 7, 7, false, 'creative', '#D946EF'),
('Expressive', 5, 3, 0, 2, 0, 4, 0, 0, 6, 6, 7, 6, false, 'creative', '#C026D3'),

-- Spiritual/transcendent emotions
('Awestruck', 3, 4, 2, 8, 0, 0, 0, 0, 8, 7, 7, 4, false, 'spirituality', '#E0E7FF'),
('Transcendent', 5, 5, 0, 4, 0, 0, 0, 0, 7, 5, 8, 5, false, 'spirituality', '#C7D2FE'),
('Reverent', 2, 7, 2, 2, 0, 0, 0, 0, 6, 4, 7, 4, false, 'spirituality', '#A5B4FC'),
('Humble', 2, 5, 0, 0, 2, 0, 0, 0, 4, 3, 6, 3, false, 'spirituality', '#818CF8'),
('Mindful', 4, 5, 0, 0, 0, 2, 0, 0, 4, 3, 7, 5, false, 'mindfulness', '#6366F1'),

-- Adventure/exploration emotions
('Adventurous', 5, 3, 2, 3, 0, 7, 0, 0, 7, 7, 7, 7, false, 'travel', '#22D3EE'),
('Curious', 2, 3, 0, 5, 0, 6, 0, 0, 5, 6, 7, 5, false, 'intellectual', '#67E8F9'),
('Exploratory', 4, 3, 1, 4, 0, 6, 0, 0, 6, 6, 7, 6, false, 'travel', '#A5F3FC'),
('Free', 6, 4, 0, 2, 0, 4, 0, 0, 6, 6, 8, 7, false, 'wellness', '#CFFAFE')

on conflict (name) do nothing;

-- =============================================================================
-- MAP MOODS TO CATEGORIES BY EMOTIONAL TYPE
-- =============================================================================

-- Map moods to emotional type categories based on their dominant Plutchik dimension
-- Joy-based emotions
insert into founder_os.mood_category_mappings (mood_id, category_id, relevance_score, is_primary)
select m.id, c.id, 1.00, true
from public.mood_definitions m
cross join founder_os.mood_categories c
where c.slug = 'joy-emotions'
  and m.joy_rating >= 5
  and not exists (
    select 1 from founder_os.mood_category_mappings mcm
    where mcm.mood_id = m.id and mcm.category_id = c.id
  );

-- Trust-based emotions
insert into founder_os.mood_category_mappings (mood_id, category_id, relevance_score, is_primary)
select m.id, c.id, 1.00, true
from public.mood_definitions m
cross join founder_os.mood_categories c
where c.slug = 'trust-emotions'
  and m.trust_rating >= 5
  and not exists (
    select 1 from founder_os.mood_category_mappings mcm
    where mcm.mood_id = m.id and mcm.category_id = c.id
  );

-- Fear-based emotions
insert into founder_os.mood_category_mappings (mood_id, category_id, relevance_score, is_primary)
select m.id, c.id, 1.00, true
from public.mood_definitions m
cross join founder_os.mood_categories c
where c.slug = 'fear-emotions'
  and m.fear_rating >= 5
  and not exists (
    select 1 from founder_os.mood_category_mappings mcm
    where mcm.mood_id = m.id and mcm.category_id = c.id
  );

-- Sadness-based emotions
insert into founder_os.mood_category_mappings (mood_id, category_id, relevance_score, is_primary)
select m.id, c.id, 1.00, true
from public.mood_definitions m
cross join founder_os.mood_categories c
where c.slug = 'sadness-emotions'
  and m.sadness_rating >= 5
  and not exists (
    select 1 from founder_os.mood_category_mappings mcm
    where mcm.mood_id = m.id and mcm.category_id = c.id
  );

-- Anticipation-based emotions
insert into founder_os.mood_category_mappings (mood_id, category_id, relevance_score, is_primary)
select m.id, c.id, 1.00, true
from public.mood_definitions m
cross join founder_os.mood_categories c
where c.slug = 'anticipation-emotions'
  and m.anticipation_rating >= 5
  and not exists (
    select 1 from founder_os.mood_category_mappings mcm
    where mcm.mood_id = m.id and mcm.category_id = c.id
  );

-- Anger-based emotions
insert into founder_os.mood_category_mappings (mood_id, category_id, relevance_score, is_primary)
select m.id, c.id, 1.00, true
from public.mood_definitions m
cross join founder_os.mood_categories c
where c.slug = 'anger-emotions'
  and m.anger_rating >= 5
  and not exists (
    select 1 from founder_os.mood_category_mappings mcm
    where mcm.mood_id = m.id and mcm.category_id = c.id
  );

-- Disgust-based emotions
insert into founder_os.mood_category_mappings (mood_id, category_id, relevance_score, is_primary)
select m.id, c.id, 1.00, true
from public.mood_definitions m
cross join founder_os.mood_categories c
where c.slug = 'disgust-emotions'
  and m.disgust_rating >= 5
  and not exists (
    select 1 from founder_os.mood_category_mappings mcm
    where mcm.mood_id = m.id and mcm.category_id = c.id
  );

-- Surprise-based emotions
insert into founder_os.mood_category_mappings (mood_id, category_id, relevance_score, is_primary)
select m.id, c.id, 1.00, true
from public.mood_definitions m
cross join founder_os.mood_categories c
where c.slug = 'surprise-emotions'
  and m.surprise_rating >= 5
  and not exists (
    select 1 from founder_os.mood_category_mappings mcm
    where mcm.mood_id = m.id and mcm.category_id = c.id
  );

-- =============================================================================
-- MAP MOODS TO INTENSITY LEVELS
-- =============================================================================

-- Mild emotions (intensity 1-4)
insert into founder_os.mood_category_mappings (mood_id, category_id, relevance_score, is_primary)
select m.id, c.id, 0.80, false
from public.mood_definitions m
cross join founder_os.mood_categories c
where c.slug = 'mild'
  and m.intensity between 1 and 4
  and not exists (
    select 1 from founder_os.mood_category_mappings mcm
    where mcm.mood_id = m.id and mcm.category_id = c.id
  );

-- Moderate emotions (intensity 5-7)
insert into founder_os.mood_category_mappings (mood_id, category_id, relevance_score, is_primary)
select m.id, c.id, 0.80, false
from public.mood_definitions m
cross join founder_os.mood_categories c
where c.slug = 'moderate'
  and m.intensity between 5 and 7
  and not exists (
    select 1 from founder_os.mood_category_mappings mcm
    where mcm.mood_id = m.id and mcm.category_id = c.id
  );

-- Intense emotions (intensity 8-10)
insert into founder_os.mood_category_mappings (mood_id, category_id, relevance_score, is_primary)
select m.id, c.id, 0.80, false
from public.mood_definitions m
cross join founder_os.mood_categories c
where c.slug = 'intense'
  and m.intensity between 8 and 10
  and not exists (
    select 1 from founder_os.mood_category_mappings mcm
    where mcm.mood_id = m.id and mcm.category_id = c.id
  );

-- =============================================================================
-- HELPER FUNCTION: Get moods by category
-- =============================================================================

create or replace function founder_os.get_moods_by_category(
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
  from public.mood_definitions m
  join founder_os.mood_category_mappings mcm on m.id = mcm.mood_id
  join founder_os.mood_categories c on mcm.category_id = c.id
  where c.slug = p_category_slug
  order by mcm.relevance_score desc, m.name;
$$;

grant execute on function founder_os.get_moods_by_category to authenticated;
grant execute on function founder_os.get_moods_by_category to service_role;
grant execute on function founder_os.get_moods_by_category to anon;

-- =============================================================================
-- HELPER FUNCTION: Search moods
-- =============================================================================

create or replace function founder_os.search_moods(
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
  from public.mood_definitions m
  left join founder_os.mood_category_mappings mcm on m.id = mcm.mood_id
  left join founder_os.mood_categories c on mcm.category_id = c.id
  where
    (p_search_term is null or m.name ilike '%' || p_search_term || '%')
    and (p_category_type is null or c.category_type = p_category_type)
    and (p_min_valence is null or m.valence >= p_min_valence)
    and (p_max_valence is null or m.valence <= p_max_valence)
    and (p_min_intensity is null or m.intensity >= p_min_intensity)
    and (p_max_intensity is null or m.intensity <= p_max_intensity)
  order by m.name;
$$;

grant execute on function founder_os.search_moods to authenticated;
grant execute on function founder_os.search_moods to service_role;
grant execute on function founder_os.search_moods to anon;
