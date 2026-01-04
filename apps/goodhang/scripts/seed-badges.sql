-- ============================================================================
-- Assessment Badges Seed Data
-- 13 badge definitions with earning criteria
-- ============================================================================
-- This script populates the assessment_badges table with all badge definitions.
-- Badges are automatically awarded based on assessment performance across:
-- - Individual dimensions (e.g., AI Readiness 90+)
-- - Category scores (Technical, Emotional, Creative 90+)
-- - Combination criteria (multiple dimensions or all categories)
-- - Experience-based achievements (score + years)
-- - Lightning round performance (top percentile)
-- ============================================================================

-- Clear existing badges (for re-seeding)
TRUNCATE TABLE public.assessment_badges CASCADE;

-- ============================================================================
-- DIMENSION BADGES (3 badges)
-- ============================================================================

INSERT INTO public.assessment_badges (id, name, description, icon, criteria, category) VALUES
(
  'ai-prodigy',
  'AI Prodigy',
  'Exceptional AI readiness and orchestration capability (90+ AI Readiness)',
  '🤖',
  '{"dimension": "ai_readiness", "min_score": 90}'::jsonb,
  'dimension'
),
(
  'perfect-empathy',
  'Perfect Empathy',
  'Exceptional emotional intelligence and empathy (95+ Empathy)',
  '🫶',
  '{"dimension": "empathy", "min_score": 95}'::jsonb,
  'dimension'
),
(
  'organization-master',
  'Organization Master',
  'Outstanding organizational and systems thinking (90+ Organization)',
  '📋',
  '{"dimension": "organization", "min_score": 90}'::jsonb,
  'dimension'
);

-- ============================================================================
-- CATEGORY BADGES (3 badges)
-- ============================================================================

INSERT INTO public.assessment_badges (id, name, description, icon, criteria, category) VALUES
(
  'technical-maestro',
  'Technical Maestro',
  'Outstanding technical prowess across all technical domains (90+ Technical category)',
  '⚙️',
  '{"category": "technical", "category_min_score": 90}'::jsonb,
  'category'
),
(
  'people-champion',
  'People Champion',
  'Exceptional emotional intelligence and leadership (90+ Emotional category)',
  '❤️',
  '{"category": "emotional", "category_min_score": 90}'::jsonb,
  'category'
),
(
  'creative-genius',
  'Creative Genius',
  'Remarkable creativity and innovative thinking (90+ Creative category)',
  '🎨',
  '{"category": "creative", "category_min_score": 90}'::jsonb,
  'category'
);

-- ============================================================================
-- COMBO BADGES (4 badges)
-- ============================================================================

INSERT INTO public.assessment_badges (id, name, description, icon, criteria, category) VALUES
(
  'triple-threat',
  'Triple Threat',
  'Excellence across all three major categories (85+ in Technical, Emotional, and Creative)',
  '⭐',
  '{"all_categories": 85}'::jsonb,
  'combo'
),
(
  'systems-architect',
  'Systems Architect',
  'Exceptional systems thinking combining organization and technical skills (90+ Organization + Technical)',
  '🏗️',
  '{"dimensions": ["organization", "technical"], "min_score": 90}'::jsonb,
  'combo'
),
(
  'strategic-mind',
  'Strategic Mind',
  'Outstanding go-to-market strategy and executive leadership (90+ GTM + Executive Leadership)',
  '🧠',
  '{"dimensions": ["gtm", "executive_leadership"], "min_score": 90}'::jsonb,
  'combo'
),
(
  'technical-empath',
  'Technical Empath',
  'Rare combination of technical excellence and deep empathy (85+ Technical + Empathy)',
  '💡',
  '{"dimensions": ["technical", "empathy"], "min_score": 85}'::jsonb,
  'combo'
);

-- ============================================================================
-- EXPERIENCE BADGES (2 badges)
-- ============================================================================

INSERT INTO public.assessment_badges (id, name, description, icon, criteria, category) VALUES
(
  'rising-star',
  'Rising Star',
  'Exceptional performance with limited experience (80+ overall score, <3 years)',
  '🌟',
  '{"overall_min": 80, "years_max": 3}'::jsonb,
  'experience'
),
(
  'veteran-pro',
  'Veteran Pro',
  'Sustained excellence over long career (85+ overall score, 10+ years)',
  '🏆',
  '{"overall_min": 85, "years_min": 10}'::jsonb,
  'experience'
);

-- ============================================================================
-- LIGHTNING ROUND BADGE (1 badge)
-- ============================================================================

INSERT INTO public.assessment_badges (id, name, description, icon, criteria, category) VALUES
(
  'lightning-champion',
  'Lightning Champion',
  'Top 10% performance in the 2-minute Lightning Round challenge',
  '⚡',
  '{"lightning_percentile": 90}'::jsonb,
  'lightning'
);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Verify all badges were inserted
SELECT
  category,
  COUNT(*) as badge_count,
  ARRAY_AGG(name ORDER BY name) as badge_names
FROM public.assessment_badges
GROUP BY category
ORDER BY category;

-- Show total count
SELECT COUNT(*) as total_badges FROM public.assessment_badges;

-- ============================================================================
-- BADGE CRITERIA REFERENCE
-- ============================================================================

-- Criteria Structure Examples:
--
-- Single Dimension:
-- {"dimension": "ai_readiness", "min_score": 90}
--
-- Multiple Dimensions (all must meet):
-- {"dimensions": ["technical", "empathy"], "min_score": 85}
--
-- Category Score:
-- {"category": "technical", "category_min_score": 90}
--
-- All Categories (all three must meet):
-- {"all_categories": 85}
--
-- Experience-Based:
-- {"overall_min": 80, "years_max": 3}
-- {"overall_min": 85, "years_min": 10}
--
-- Lightning Round Percentile:
-- {"lightning_percentile": 90}  -- Top 10%
--
-- ============================================================================
-- BADGE EVALUATION LOGIC
-- ============================================================================
--
-- Badges are evaluated and awarded automatically during assessment scoring:
--
-- 1. AssessmentScoringService completes 14-dimensional scoring
-- 2. CategoryScoringService calculates Technical/Emotional/Creative scores
-- 3. BadgeEvaluationService checks all badge criteria against:
--    - Dimension scores (from dimensions JSONB)
--    - Category scores (from category_scores JSONB)
--    - Overall score (from overall_score)
--    - Years of experience (from years_experience)
--    - Lightning percentile (from get_lightning_percentile function)
-- 4. Earned badges are stored in badges TEXT[] array
-- 5. Frontend displays badges on results page and public profile
--
-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Total Badges: 13
-- - Dimension Badges: 3 (AI Prodigy, Perfect Empathy, Organization Master)
-- - Category Badges: 3 (Technical Maestro, People Champion, Creative Genius)
-- - Combo Badges: 4 (Triple Threat, Systems Architect, Strategic Mind, Technical Empath)
-- - Experience Badges: 2 (Rising Star, Veteran Pro)
-- - Lightning Badges: 1 (Lightning Champion)
--
-- Badge Icons:
-- 🤖 AI Prodigy
-- 🫶 Perfect Empathy
-- 📋 Organization Master
-- ⚙️ Technical Maestro
-- ❤️ People Champion
-- 🎨 Creative Genius
-- ⭐ Triple Threat
-- 🏗️ Systems Architect
-- 🧠 Strategic Mind
-- 💡 Technical Empath
-- 🌟 Rising Star
-- 🏆 Veteran Pro
-- ⚡ Lightning Champion
--
-- ============================================================================
