-- ============================================================================
-- COMPLETE EMOTION SYSTEM IMPLEMENTATION SQL
-- Creativity Journal - Enhanced Mood Tracking with Categories & Analytics
-- ============================================================================

-- ============================================================================
-- STEP 1: POPULATE MOOD_PROPS WITH PLUTCHIK MAPPINGS
-- ============================================================================

-- Use INSERT OR REPLACE to handle existing data gracefully
-- Format: (mood_id, joy_rating, trust_rating, fear_rating, surprise_rating, sadness_rating, anticipation_rating, anger_rating, disgust_rating, arousal_level, valence, dominance, intensity, core)

INSERT OR REPLACE INTO mood_props (mood_id, joy_rating, trust_rating, fear_rating, surprise_rating, sadness_rating, anticipation_rating, anger_rating, disgust_rating, arousal_level, valence, dominance, intensity, core) VALUES

-- BASIC PLUTCHIK EMOTIONS (Core emotions - IDs 2-9)
(2, 3, 0, 0, 0, 0, 0, 0, 0, 7, 9, 6, 6, 1),   -- joyful
(3, 0, 3, 0, 0, 0, 0, 0, 0, 5, 7, 7, 5, 1),   -- trusting
(4, 0, 0, 3, 0, 0, 0, 0, 0, 8, 2, 3, 7, 1),   -- fearful
(5, 0, 0, 0, 3, 0, 0, 0, 0, 8, 6, 4, 6, 1),   -- surprised
(6, 0, 0, 0, 0, 3, 0, 0, 0, 4, 2, 4, 6, 1),   -- sad
(7, 0, 0, 0, 0, 0, 3, 0, 0, 6, 6, 6, 5, 1),   -- anticipation
(8, 0, 0, 0, 0, 0, 0, 3, 0, 8, 3, 7, 7, 1),   -- angry
(9, 0, 0, 0, 0, 0, 0, 0, 3, 5, 2, 5, 6, 1),   -- disgusted

-- JOY SPECTRUM (Core emotions)
(10, 2, 1, 0, 0, 0, 0, 0, 0, 3, 8, 6, 4, 1),  -- serene
(11, 3, 0, 0, 1, 0, 0, 0, 0, 9, 9, 7, 8, 1),  -- ecstatic
(26, 2, 1, 0, 0, 0, 0, 0, 0, 5, 8, 6, 5, 1),  -- content
(27, 3, 1, 0, 0, 0, 0, 0, 0, 6, 9, 6, 6, 1),  -- blissful
(28, 2, 1, 0, 0, 0, 1, 0, 0, 6, 8, 6, 6, 1),  -- grateful
(77, 3, 0, 0, 1, 0, 0, 0, 0, 8, 9, 7, 7, 1),  -- delighted
(78, 3, 0, 0, 0, 0, 0, 0, 0, 7, 9, 6, 6, 1),  -- happy
(79, 3, 0, 0, 1, 0, 1, 0, 0, 9, 9, 7, 8, 1),  -- overjoyed

-- TRUST SPECTRUM (Core emotions)
(12, 1, 2, 0, 0, 0, 0, 0, 0, 4, 7, 6, 4, 1),  -- acceptance
(13, 1, 2, 0, 0, 0, 0, 0, 0, 5, 7, 7, 5, 1),  -- admiration

-- FEAR SPECTRUM (Core emotions)
(14, 0, 0, 2, 1, 0, 0, 0, 0, 7, 3, 3, 6, 1),  -- apprehensive
(15, 0, 0, 3, 1, 0, 0, 0, 0, 9, 1, 2, 9, 1),  -- terrified

-- SADNESS SPECTRUM (Core emotions) 
(18, 0, 0, 0, 0, 2, 0, 0, 0, 3, 3, 4, 5, 1),  -- pensive
(19, 0, 0, 0, 0, 3, 0, 0, 0, 5, 1, 3, 8, 1),  -- grief

-- COMPLEX EMOTIONAL STATES (Core emotions)
(33, 3, 2, 0, 0, 0, 0, 0, 0, 7, 9, 6, 7, 1),  -- loving
(34, 1, 2, 0, 0, 0, 0, 0, 0, 4, 7, 5, 4, 0),  -- submissive
(36, 0, 0, 0, 0, 0, 0, 1, 2, 5, 3, 5, 5, 0),  -- disapproving
(37, 0, 0, 2, 1, 0, 0, 0, 0, 8, 2, 3, 7, 0),  -- alarmed
(38, 0, 0, 0, 0, 2, 0, 0, 0, 4, 2, 4, 6, 0),  -- disappointed
(39, 0, 0, 0, 0, 2, 0, 0, 0, 3, 2, 3, 6, 0),  -- discouraged
(40, 0, 0, 0, 0, 3, 0, 0, 0, 5, 1, 2, 8, 0),  -- devastated
(41, 0, 0, 0, 0, 2, 0, 0, 1, 4, 2, 3, 6, 0),  -- remorseful
(42, 0, 0, 0, 0, 2, 0, 0, 1, 4, 2, 3, 6, 0),  -- regretful
(43, 0, 0, 1, 0, 3, 0, 1, 0, 7, 1, 2, 8, 0),  -- tormented
(44, 0, 0, 0, 0, 0, 0, 1, 2, 5, 2, 6, 6, 0),  -- contempt
(45, 0, 0, 0, 0, 0, 0, 1, 2, 5, 2, 6, 6, 0),  -- disdainful
(46, 0, 0, 0, 0, 0, 0, 1, 1, 5, 2, 6, 6, 0),  -- despising
(47, 0, 0, 0, 0, 0, 0, 2, 0, 7, 3, 7, 7, 0),  -- aggressive
(48, 0, 1, 0, 0, 0, 0, 1, 0, 6, 5, 7, 5, 0),  -- assertive
(49, 0, 0, 0, 0, 0, 0, 2, 0, 7, 3, 6, 7, 0),  -- hostile
(50, 1, 1, 0, 0, 0, 2, 0, 0, 6, 7, 6, 5, 1),  -- optimistic
(53, 0, 0, 0, 0, 1, 0, 0, 1, 4, 3, 3, 6, 1),  -- guilty
(56, 1, 0, 0, 1, 0, 2, 0, 0, 6, 6, 6, 5, 1),  -- curious
(71, 2, 1, 0, 0, 0, 0, 0, 0, 6, 8, 7, 6, 1),  -- proud
(81, 1, 0, 0, 0, 1, 0, 0, 0, 5, 6, 5, 5, 1),  -- nostalgic
(83, 0, 0, 0, 0, 2, 0, 0, 1, 4, 2, 2, 7, 1),  -- ashamed
(89, 0, 0, 0, 0, 2, 0, 0, 1, 4, 2, 4, 6, 1),  -- pessimistic
(98, 0, 0, 2, 0, 1, 0, 0, 0, 7, 3, 3, 6, 1),  -- anxious
(100, 0, 0, 3, 1, 1, 0, 0, 0, 9, 1, 2, 9, 1), -- panic
(103, 0, 0, 0, 0, 3, 0, 0, 0, 6, 1, 3, 8, 1),  -- heartbroken
(104, 1, 0, 0, 0, 1, 0, 0, 0, 4, 4, 4, 5, 1),  -- ambivalent
(106, 1, 0, 1, 1, 1, 0, 0, 0, 5, 4, 4, 6, 1),  -- conflicted
(110, 0, 0, 1, 2, 0, 0, 0, 0, 6, 3, 3, 6, 1),  -- confused
(114, 2, 0, 0, 1, 0, 0, 0, 0, 6, 7, 5, 5, 0),  -- amused
(117, 1, 2, 0, 0, 0, 0, 0, 0, 6, 8, 8, 6, 1),  -- confident
(119, 2, 1, 0, 0, 0, 1, 0, 0, 6, 8, 7, 6, 0),  -- fulfilled
(125, 2, 1, 0, 0, 0, 2, 0, 0, 7, 8, 7, 7, 1),  -- inspired
(147, 0, 0, 1, 0, 1, 0, 0, 0, 4, 3, 2, 6, 1),  -- vulnerable
(150, 0, 0, 0, 0, 2, 0, 0, 0, 4, 2, 4, 6, 1),  -- melancholy
(154, 0, 0, 2, 1, 1, 0, 0, 0, 8, 2, 2, 8, 1),  -- overwhelmed
(155, 0, 0, 2, 0, 1, 0, 0, 0, 6, 3, 3, 6, 1),  -- worried
(169, 2, 0, 0, 0, 0, 1, 0, 0, 8, 8, 6, 7, 0),  -- energetic
(170, 2, 0, 0, 1, 0, 1, 0, 0, 8, 8, 6, 7, 0),  -- excited
(190, 2, 1, 0, 0, 0, 0, 0, 0, 6, 8, 6, 6, 0),  -- affectionate
(205, 1, 1, 0, 0, 0, 0, 0, 0, 4, 7, 6, 4, 0),  -- calm
(222, 1, 1, 0, 0, 0, 2, 1, 0, 8, 7, 8, 7, 1),  -- determined
(241, 3, 0, 0, 1, 0, 1, 0, 0, 9, 9, 8, 8, 1),  -- elated
(245, 2, 1, 0, 1, 0, 0, 0, 0, 6, 8, 7, 6, 1),  -- enlightened
(249, 3, 0, 0, 1, 0, 0, 0, 0, 9, 9, 7, 9, 1),  -- euphoric
(258, 0, 0, 0, 0, 1, 0, 2, 0, 6, 3, 5, 6, 1),  -- frustrated
(284, 3, 0, 0, 1, 0, 1, 0, 0, 8, 9, 7, 7, 1),  -- jubilant
(288, 0, 0, 1, 0, 2, 0, 0, 0, 3, 2, 3, 6, 1),  -- lonely
(322, 1, 1, 0, 0, 0, 0, 0, 0, 3, 7, 6, 4, 0),  -- relaxed
(346, 1, 1, 0, 0, 0, 0, 0, 0, 6, 6, 8, 6, 0),  -- strong
(355, 2, 1, 0, 0, 0, 0, 0, 0, 5, 8, 6, 5, 0),  -- thankful
(356, 2, 0, 0, 1, 0, 1, 0, 0, 8, 8, 6, 7, 0),  -- thrilled
(385, 0, 0, 1, 0, 2, 0, 1, 0, 4, 2, 2, 7, 1),  -- defeated
(386, 0, 0, 1, 1, 1, 0, 1, 0, 6, 2, 3, 7, 1),  -- betrayed
(437, 1, 2, 0, 0, 0, 0, 0, 0, 3, 8, 6, 4, 1),  -- peaceful
(462, 1, 2, 0, 0, 0, 0, 0, 0, 5, 7, 6, 5, 1),  -- connected
(487, 1, 2, 0, 0, 0, 0, 0, 0, 4, 8, 7, 5, 1),  -- secure
(494, 2, 0, 0, 1, 0, 1, 0, 0, 7, 7, 6, 6, 0),  -- imaginative
(495, 1, 0, 0, 1, 0, 2, 0, 0, 7, 7, 6, 6, 0),  -- adventurous
(497, 2, 1, 0, 0, 0, 1, 0, 0, 7, 8, 7, 6, 1),  -- successful
(499, 2, 1, 0, 0, 0, 0, 0, 0, 6, 8, 7, 6, 0);  -- free

-- ============================================================================
-- STEP 2: POPULATE CATEGORIES TABLE
-- ============================================================================

INSERT OR REPLACE INTO categories (name, slug, description, color_hex, icon_name, category_type, display_order) VALUES

-- LIFE DOMAIN CATEGORIES
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
('Nature & Outdoors', 'nature', 'Natural environments and outdoor experiences', '#059669', 'tree-pine', 'life_domain', 90),
('Home & Living Space', 'home', 'Domestic life and living environment emotions', '#F59E0B', 'home', 'life_domain', 91),
('Weather & Seasons', 'weather', 'Climate and seasonal emotion influences', '#6B7280', 'cloud', 'life_domain', 92),
('Technology & Digital', 'technology', 'Digital life, social media, and technology emotions', '#6B7280', 'smartphone', 'life_domain', 93),
('Spirituality', 'spirituality', 'Religious, spiritual, and transcendent emotions', '#7C3AED', 'sun', 'life_domain', 100),
('Life Purpose', 'purpose', 'Meaning, direction, and existential emotions', '#8B5CF6', 'compass', 'life_domain', 101),
('Mindfulness', 'mindfulness', 'Present-moment awareness and mindfulness emotions', '#059669', 'circle', 'life_domain', 102),

-- EMOTIONAL TYPE CATEGORIES
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
('Moral Emotions', 'moral-emotions', 'Ethics, guilt, pride, and moral judgment emotions', '#7C3AED', 'balance-scale', 'emotional_type', 213),

-- INTENSITY LEVEL CATEGORIES
('Mild Emotions', 'mild', 'Low-intensity, subtle emotional states', '#D1D5DB', 'minus', 'intensity_level', 300),
('Moderate Emotions', 'moderate', 'Medium-intensity, noticeable emotional states', '#6B7280', 'circle', 'intensity_level', 301),
('Intense Emotions', 'intense', 'High-intensity, overwhelming emotional states', '#374151', 'plus', 'intensity_level', 302),

-- CONTEXTUAL CATEGORIES
('Daily Life', 'daily', 'Routine and everyday emotional experiences', '#6B7280', 'calendar', 'context', 400),
('Special Events', 'events', 'Holidays, celebrations, and special occasions', '#F59E0B', 'gift', 'context', 401),
('Transitions', 'transitions', 'Life changes and transitional periods', '#8B5CF6', 'arrow-right', 'context', 402),
('Crisis Situations', 'crisis', 'Emergency, trauma, and crisis emotions', '#DC2626', 'alert-octagon', 'context', 403);

-- ============================================================================
-- STEP 3: POPULATE MOOD_CATEGORIES MAPPING
-- ============================================================================

-- Map emotions to their primary emotional type categories based on Plutchik dominance

-- Joy-based emotions
INSERT OR REPLACE INTO mood_categories (mood_id, category_id, relevance_score, is_primary)
SELECT m.id, c.id, 1.00, 1
FROM mood m
JOIN mood_props mp ON m.id = mp.mood_id
JOIN categories c ON c.slug = 'joy-emotions'
WHERE mp.joy_rating >= 2;

-- Trust-based emotions
INSERT OR REPLACE INTO mood_categories (mood_id, category_id, relevance_score, is_primary)
SELECT m.id, c.id, 1.00, 1
FROM mood m
JOIN mood_props mp ON m.id = mp.mood_id
JOIN categories c ON c.slug = 'trust-emotions'
WHERE mp.trust_rating >= 2;

-- Fear-based emotions
INSERT OR REPLACE INTO mood_categories (mood_id, category_id, relevance_score, is_primary)
SELECT m.id, c.id, 1.00, 1
FROM mood m
JOIN mood_props mp ON m.id = mp.mood_id
JOIN categories c ON c.slug = 'fear-emotions'
WHERE mp.fear_rating >= 2;

-- Surprise-based emotions
INSERT OR REPLACE INTO mood_categories (mood_id, category_id, relevance_score, is_primary)
SELECT m.id, c.id, 1.00, 1
FROM mood m
JOIN mood_props mp ON m.id = mp.mood_id
JOIN categories c ON c.slug = 'surprise-emotions'
WHERE mp.surprise_rating >= 2;

-- Sadness-based emotions
INSERT OR REPLACE INTO mood_categories (mood_id, category_id, relevance_score, is_primary)
SELECT m.id, c.id, 1.00, 1
FROM mood m
JOIN mood_props mp ON m.id = mp.mood_id
JOIN categories c ON c.slug = 'sadness-emotions'
WHERE mp.sadness_rating >= 2;

-- Anticipation-based emotions
INSERT OR REPLACE INTO mood_categories (mood_id, category_id, relevance_score, is_primary)
SELECT m.id, c.id, 1.00, 1
FROM mood m
JOIN mood_props mp ON m.id = mp.mood_id
JOIN categories c ON c.slug = 'anticipation-emotions'
WHERE mp.anticipation_rating >= 2;

-- Anger-based emotions
INSERT OR REPLACE INTO mood_categories (mood_id, category_id, relevance_score, is_primary)
SELECT m.id, c.id, 1.00, 1
FROM mood m
JOIN mood_props mp ON m.id = mp.mood_id
JOIN categories c ON c.slug = 'anger-emotions'
WHERE mp.anger_rating >= 2;

-- Disgust-based emotions
INSERT OR REPLACE INTO mood_categories (mood_id, category_id, relevance_score, is_primary)
SELECT m.id, c.id, 1.00, 1
FROM mood m
JOIN mood_props mp ON m.id = mp.mood_id
JOIN categories c ON c.slug = 'disgust-emotions'
WHERE mp.disgust_rating >= 2;

-- Mixed emotions (emotions with multiple high ratings)
INSERT OR REPLACE INTO mood_categories (mood_id, category_id, relevance_score, is_primary)
SELECT m.id, c.id, 0.80, 0
FROM mood m
JOIN mood_props mp ON m.id = mp.mood_id
JOIN categories c ON c.slug = 'mixed-emotions'
WHERE (CASE WHEN mp.joy_rating > 0 THEN 1 ELSE 0 END) + 
      (CASE WHEN mp.trust_rating > 0 THEN 1 ELSE 0 END) + 
      (CASE WHEN mp.fear_rating > 0 THEN 1 ELSE 0 END) + 
      (CASE WHEN mp.surprise_rating > 0 THEN 1 ELSE 0 END) + 
      (CASE WHEN mp.sadness_rating > 0 THEN 1 ELSE 0 END) + 
      (CASE WHEN mp.anticipation_rating > 0 THEN 1 ELSE 0 END) + 
      (CASE WHEN mp.anger_rating > 0 THEN 1 ELSE 0 END) + 
      (CASE WHEN mp.disgust_rating > 0 THEN 1 ELSE 0 END) >= 3;

-- Map emotions to intensity levels based on intensity score
INSERT OR REPLACE INTO mood_categories (mood_id, category_id, relevance_score, is_primary)
SELECT m.id, c.id, 0.70, 0
FROM mood m
JOIN mood_props mp ON m.id = mp.mood_id
JOIN categories c ON c.slug = 'mild'
WHERE mp.intensity BETWEEN 1 AND 4;

INSERT OR REPLACE INTO mood_categories (mood_id, category_id, relevance_score, is_primary)
SELECT m.id, c.id, 0.70, 0
FROM mood m
JOIN mood_props mp ON m.id = mp.mood_id
JOIN categories c ON c.slug = 'moderate'
WHERE mp.intensity BETWEEN 5 AND 7;

INSERT OR REPLACE INTO mood_categories (mood_id, category_id, relevance_score, is_primary)
SELECT m.id, c.id, 0.70, 0
FROM mood m
JOIN mood_props mp ON m.id = mp.mood_id
JOIN categories c ON c.slug = 'intense'
WHERE mp.intensity BETWEEN 8 AND 10;

-- ============================================================================
-- STEP 4: CREATE PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_mood_props_core ON mood_props(core);
CREATE INDEX IF NOT EXISTS idx_mood_props_mood_id ON mood_props(mood_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(category_type);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_mood_categories_mood ON mood_categories(mood_id);
CREATE INDEX IF NOT EXISTS idx_mood_categories_category ON mood_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_mood_categories_primary ON mood_categories(is_primary); 