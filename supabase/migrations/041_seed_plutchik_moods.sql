-- ============================================
-- SEED PLUTCHIK MOOD DEFINITIONS
-- Core emotions from Plutchik's wheel of emotions
-- ============================================

-- =============================================================================
-- PRIMARY EMOTIONS (8 core Plutchik emotions)
-- =============================================================================
INSERT INTO mood_definitions (name, joy_rating, trust_rating, fear_rating, surprise_rating, sadness_rating, anticipation_rating, anger_rating, disgust_rating, intensity, arousal_level, valence, dominance, is_core, category, color_hex) VALUES
-- Primary emotions
('Joy', 10, 0, 0, 0, 0, 0, 0, 0, 7, 7, 9, 6, true, 'joy-emotions', '#F59E0B'),
('Trust', 0, 10, 0, 0, 0, 0, 0, 0, 6, 4, 7, 5, true, 'trust-emotions', '#10B981'),
('Fear', 0, 0, 10, 0, 0, 0, 0, 0, 7, 8, 2, 2, true, 'fear-emotions', '#8B5CF6'),
('Surprise', 0, 0, 0, 10, 0, 0, 0, 0, 6, 8, 5, 4, true, 'surprise-emotions', '#EC4899'),
('Sadness', 0, 0, 0, 0, 10, 0, 0, 0, 6, 3, 2, 3, true, 'sadness-emotions', '#3B82F6'),
('Anticipation', 0, 0, 0, 0, 0, 10, 0, 0, 6, 6, 7, 6, true, 'anticipation-emotions', '#84CC16'),
('Anger', 0, 0, 0, 0, 0, 0, 10, 0, 8, 9, 3, 8, true, 'anger-emotions', '#EF4444'),
('Disgust', 0, 0, 0, 0, 0, 0, 0, 10, 6, 5, 2, 6, true, 'disgust-emotions', '#059669')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- COMPOUND EMOTIONS (Plutchik dyads - combinations of adjacent emotions)
-- =============================================================================
INSERT INTO mood_definitions (name, joy_rating, trust_rating, fear_rating, surprise_rating, sadness_rating, anticipation_rating, anger_rating, disgust_rating, intensity, arousal_level, valence, dominance, is_core, category, color_hex) VALUES
-- Primary dyads (adjacent emotions)
('Love', 8, 8, 0, 0, 0, 0, 0, 0, 8, 6, 9, 5, true, 'social-emotions', '#F472B6'),
('Optimism', 7, 0, 0, 0, 0, 7, 0, 0, 7, 7, 8, 7, true, 'anticipation-emotions', '#FBBF24'),
('Submission', 0, 7, 7, 0, 0, 0, 0, 0, 5, 4, 4, 2, true, 'trust-emotions', '#A78BFA'),
('Awe', 0, 0, 7, 7, 0, 0, 0, 0, 7, 7, 6, 3, true, 'surprise-emotions', '#F9A8D4'),
('Disapproval', 0, 0, 0, 7, 7, 0, 0, 0, 6, 5, 3, 5, true, 'moral-emotions', '#6B7280'),
('Remorse', 0, 0, 0, 0, 7, 0, 0, 7, 7, 4, 2, 3, true, 'moral-emotions', '#4B5563'),
('Contempt', 0, 0, 0, 0, 0, 0, 7, 7, 7, 5, 2, 7, true, 'anger-emotions', '#B91C1C'),
('Aggressiveness', 0, 0, 0, 0, 0, 7, 7, 0, 8, 9, 3, 9, true, 'anger-emotions', '#DC2626')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- SECONDARY DYADS (emotions separated by one)
-- =============================================================================
INSERT INTO mood_definitions (name, joy_rating, trust_rating, fear_rating, surprise_rating, sadness_rating, anticipation_rating, anger_rating, disgust_rating, intensity, arousal_level, valence, dominance, is_core, category, color_hex) VALUES
('Hope', 6, 0, 0, 0, 0, 8, 0, 0, 6, 6, 7, 5, false, 'anticipation-emotions', '#A3E635'),
('Anxiety', 0, 0, 8, 0, 0, 6, 0, 0, 7, 8, 3, 3, false, 'fear-emotions', '#A855F7'),
('Envy', 0, 0, 0, 0, 6, 0, 8, 0, 7, 6, 2, 5, false, 'anger-emotions', '#F87171'),
('Guilt', 0, 0, 6, 0, 0, 0, 0, 8, 7, 5, 2, 2, false, 'moral-emotions', '#374151'),
('Delight', 9, 0, 0, 6, 0, 0, 0, 0, 7, 7, 9, 6, false, 'joy-emotions', '#FCD34D'),
('Sentimentality', 6, 6, 0, 0, 5, 0, 0, 0, 5, 4, 6, 4, false, 'social-emotions', '#FDA4AF'),
('Curiosity', 0, 5, 0, 7, 0, 6, 0, 0, 6, 7, 7, 5, false, 'surprise-emotions', '#E879F9'),
('Cynicism', 0, 0, 0, 0, 5, 0, 6, 6, 6, 4, 3, 6, false, 'disgust-emotions', '#78716C')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- INTENSITY VARIANTS (mild to intense versions of primary emotions)
-- =============================================================================
INSERT INTO mood_definitions (name, joy_rating, trust_rating, fear_rating, surprise_rating, sadness_rating, anticipation_rating, anger_rating, disgust_rating, intensity, arousal_level, valence, dominance, is_core, category, color_hex) VALUES
-- Joy variants
('Serenity', 4, 0, 0, 0, 0, 0, 0, 0, 3, 2, 7, 5, false, 'joy-emotions', '#FDE68A'),
('Ecstasy', 10, 0, 0, 0, 0, 0, 0, 0, 10, 9, 10, 7, false, 'joy-emotions', '#F59E0B'),
-- Trust variants
('Acceptance', 0, 4, 0, 0, 0, 0, 0, 0, 3, 3, 6, 4, false, 'trust-emotions', '#6EE7B7'),
('Admiration', 0, 10, 0, 0, 0, 0, 0, 0, 8, 5, 8, 4, false, 'trust-emotions', '#059669'),
-- Fear variants
('Apprehension', 0, 0, 4, 0, 0, 0, 0, 0, 3, 5, 4, 3, false, 'fear-emotions', '#C4B5FD'),
('Terror', 0, 0, 10, 0, 0, 0, 0, 0, 10, 10, 1, 1, false, 'fear-emotions', '#7C3AED'),
-- Surprise variants
('Distraction', 0, 0, 0, 4, 0, 0, 0, 0, 3, 5, 5, 4, false, 'surprise-emotions', '#FBCFE8'),
('Amazement', 0, 0, 0, 10, 0, 0, 0, 0, 9, 9, 6, 4, false, 'surprise-emotions', '#DB2777'),
-- Sadness variants
('Pensiveness', 0, 0, 0, 0, 4, 0, 0, 0, 3, 2, 4, 4, false, 'sadness-emotions', '#93C5FD'),
('Grief', 0, 0, 0, 0, 10, 0, 0, 0, 10, 4, 1, 2, false, 'sadness-emotions', '#1D4ED8'),
-- Anticipation variants
('Interest', 0, 0, 0, 0, 0, 4, 0, 0, 3, 5, 6, 5, false, 'anticipation-emotions', '#BEF264'),
('Vigilance', 0, 0, 0, 0, 0, 10, 0, 0, 9, 8, 5, 7, false, 'anticipation-emotions', '#65A30D'),
-- Anger variants
('Annoyance', 0, 0, 0, 0, 0, 0, 4, 0, 3, 5, 4, 5, false, 'anger-emotions', '#FCA5A5'),
('Rage', 0, 0, 0, 0, 0, 0, 10, 0, 10, 10, 1, 9, false, 'anger-emotions', '#B91C1C'),
-- Disgust variants
('Boredom', 0, 0, 0, 0, 0, 0, 0, 4, 3, 2, 3, 4, false, 'disgust-emotions', '#A7F3D0'),
('Loathing', 0, 0, 0, 0, 0, 0, 0, 10, 9, 6, 1, 6, false, 'disgust-emotions', '#047857')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- COMMON MOOD STATES (frequently used in journaling)
-- =============================================================================
INSERT INTO mood_definitions (name, joy_rating, trust_rating, fear_rating, surprise_rating, sadness_rating, anticipation_rating, anger_rating, disgust_rating, intensity, arousal_level, valence, dominance, is_core, category, color_hex) VALUES
('Calm', 3, 5, 0, 0, 0, 0, 0, 0, 3, 2, 7, 5, false, 'wellness', '#E0F2FE'),
('Content', 6, 5, 0, 0, 0, 0, 0, 0, 4, 3, 7, 5, false, 'wellness', '#FEF3C7'),
('Grateful', 7, 6, 0, 0, 0, 0, 0, 0, 6, 4, 8, 5, false, 'wellness', '#DCFCE7'),
('Inspired', 6, 0, 0, 5, 0, 7, 0, 0, 7, 7, 8, 6, false, 'creative', '#FDF4FF'),
('Motivated', 5, 0, 0, 0, 0, 8, 0, 0, 7, 7, 7, 7, false, 'achievement-emotions', '#ECFCCB'),
('Peaceful', 4, 6, 0, 0, 0, 0, 0, 0, 3, 1, 8, 5, false, 'wellness', '#F0F9FF'),
('Proud', 7, 5, 0, 0, 0, 0, 0, 0, 6, 5, 8, 7, false, 'achievement-emotions', '#FEF9C3'),
('Relieved', 5, 4, 0, 0, 0, 0, 0, 0, 5, 3, 7, 5, false, 'wellness', '#D1FAE5'),
('Stressed', 0, 0, 6, 0, 3, 5, 4, 0, 7, 8, 3, 4, false, 'daily', '#FEE2E2'),
('Tired', 0, 0, 0, 0, 4, 0, 0, 2, 4, 1, 4, 3, false, 'daily', '#E5E7EB'),
('Overwhelmed', 0, 0, 7, 4, 4, 0, 3, 0, 8, 8, 2, 2, false, 'crisis', '#FED7AA'),
('Lonely', 0, 0, 3, 0, 7, 0, 0, 0, 6, 3, 2, 3, false, 'social-emotions', '#DBEAFE'),
('Confident', 5, 6, 0, 0, 0, 5, 0, 0, 6, 5, 7, 8, false, 'achievement-emotions', '#FDE047'),
('Excited', 8, 0, 0, 5, 0, 7, 0, 0, 8, 9, 9, 6, false, 'joy-emotions', '#FB923C'),
('Frustrated', 0, 0, 3, 0, 3, 0, 7, 0, 6, 7, 3, 5, false, 'anger-emotions', '#F87171'),
('Nervous', 0, 0, 7, 0, 0, 5, 0, 0, 6, 7, 3, 3, false, 'fear-emotions', '#C084FC'),
('Confused', 0, 0, 4, 6, 0, 0, 0, 0, 5, 5, 4, 3, false, 'surprise-emotions', '#F0ABFC'),
('Disappointed', 0, 0, 0, 0, 6, 0, 3, 0, 5, 4, 3, 4, false, 'sadness-emotions', '#A5B4FC'),
('Nostalgic', 5, 4, 0, 0, 5, 0, 0, 0, 5, 3, 5, 4, false, 'mixed-emotions', '#FED7E2'),
('Hopeful', 5, 4, 0, 0, 0, 7, 0, 0, 6, 5, 7, 5, false, 'anticipation-emotions', '#BBF7D0')
ON CONFLICT (name) DO NOTHING;
