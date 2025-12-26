/**
 * Emotion Utility Functions
 *
 * Ported from creativityjournal with Plutchik 8-dimension model.
 * Provides emotion analysis, keyword detection, and insight generation.
 */

import type {
  PlutchikProfile,
  PlutchikEmotion,
  EmotionAnalysis,
  EmotionCategory,
  MoodDefinition,
} from '../types.js';

// =============================================================================
// EMOTION CATEGORIES
// =============================================================================

export const EMOTION_CATEGORIES: Record<string, EmotionCategory> = {
  // Life Domain Categories
  'personal-growth': { name: 'Personal Growth', color: '#8B5CF6' },
  'self-reflection': { name: 'Self-Reflection', color: '#6366F1' },
  'identity-values': { name: 'Identity & Values', color: '#7C3AED' },
  romantic: { name: 'Romantic Relationships', color: '#EC4899' },
  family: { name: 'Family', color: '#F59E0B' },
  friendships: { name: 'Friendships', color: '#10B981' },
  social: { name: 'Social Situations', color: '#06B6D4' },
  conflict: { name: 'Interpersonal Conflict', color: '#EF4444' },
  career: { name: 'Career Development', color: '#0EA5E9' },
  workplace: { name: 'Workplace Dynamics', color: '#0369A1' },
  performance: { name: 'Job Performance', color: '#059669' },
  'work-life-balance': { name: 'Work-Life Balance', color: '#7C2D12' },
  'physical-health': { name: 'Physical Health', color: '#DC2626' },
  'mental-health': { name: 'Mental Health', color: '#7C3AED' },
  wellness: { name: 'Wellness Practices', color: '#059669' },
  medical: { name: 'Medical Experiences', color: '#DC2626' },
  education: { name: 'Education', color: '#7C3AED' },
  skills: { name: 'Skill Development', color: '#059669' },
  intellectual: { name: 'Intellectual Growth', color: '#6366F1' },
  teaching: { name: 'Teaching & Mentoring', color: '#F59E0B' },
  creative: { name: 'Creative Expression', color: '#EC4899' },
  'performance-arts': { name: 'Artistic Performance', color: '#8B5CF6' },
  innovation: { name: 'Innovation', color: '#06B6D4' },
  aesthetic: { name: 'Aesthetic Appreciation', color: '#EC4899' },
  financial: { name: 'Financial Security', color: '#059669' },
  'economic-stress': { name: 'Economic Stress', color: '#DC2626' },
  possessions: { name: 'Material Possessions', color: '#F59E0B' },
  entertainment: { name: 'Entertainment', color: '#EC4899' },
  sports: { name: 'Sports & Competition', color: '#EF4444' },
  hobbies: { name: 'Hobbies', color: '#10B981' },
  travel: { name: 'Travel & Adventure', color: '#06B6D4' },
  nature: { name: 'Nature & Outdoors', color: '#059669' },
  home: { name: 'Home & Living Space', color: '#F59E0B' },
  weather: { name: 'Weather & Seasons', color: '#6B7280' },
  technology: { name: 'Technology & Digital', color: '#6B7280' },
  spirituality: { name: 'Spirituality', color: '#7C3AED' },
  purpose: { name: 'Life Purpose', color: '#8B5CF6' },
  mindfulness: { name: 'Mindfulness', color: '#059669' },

  // Emotional Type Categories
  'joy-emotions': { name: 'Joy & Happiness', color: '#F59E0B' },
  'trust-emotions': { name: 'Trust & Acceptance', color: '#10B981' },
  'fear-emotions': { name: 'Fear & Anxiety', color: '#8B5CF6' },
  'surprise-emotions': { name: 'Surprise & Wonder', color: '#EC4899' },
  'sadness-emotions': { name: 'Sadness & Grief', color: '#3B82F6' },
  'anticipation-emotions': { name: 'Anticipation & Hope', color: '#84CC16' },
  'anger-emotions': { name: 'Anger & Frustration', color: '#EF4444' },
  'disgust-emotions': { name: 'Disgust & Aversion', color: '#059669' },
  'mixed-emotions': { name: 'Mixed Emotions', color: '#6B7280' },
  'social-emotions': { name: 'Social Emotions', color: '#06B6D4' },
  'achievement-emotions': { name: 'Achievement Emotions', color: '#84CC16' },
  'moral-emotions': { name: 'Moral Emotions', color: '#7C3AED' },

  // Intensity Level Categories
  mild: { name: 'Mild Emotions', color: '#D1D5DB' },
  moderate: { name: 'Moderate Emotions', color: '#6B7280' },
  intense: { name: 'Intense Emotions', color: '#374151' },

  // Contextual Categories
  daily: { name: 'Daily Life', color: '#6B7280' },
  events: { name: 'Special Events', color: '#F59E0B' },
  transitions: { name: 'Transitions', color: '#8B5CF6' },
  crisis: { name: 'Crisis Situations', color: '#DC2626' },
};

// =============================================================================
// PLUTCHIK PRIMARY EMOTIONS
// =============================================================================

export const PLUTCHIK_EMOTIONS: Record<
  PlutchikEmotion,
  { name: string; color: string; angle: number }
> = {
  joy: { name: 'Joy', color: '#F59E0B', angle: 0 },
  trust: { name: 'Trust', color: '#10B981', angle: 45 },
  fear: { name: 'Fear', color: '#8B5CF6', angle: 90 },
  surprise: { name: 'Surprise', color: '#EC4899', angle: 135 },
  sadness: { name: 'Sadness', color: '#3B82F6', angle: 180 },
  anticipation: { name: 'Anticipation', color: '#84CC16', angle: 225 },
  anger: { name: 'Anger', color: '#EF4444', angle: 270 },
  disgust: { name: 'Disgust', color: '#059669', angle: 315 },
};

// =============================================================================
// EMOTION ANALYSIS
// =============================================================================

/**
 * Analyze a mood definition to extract emotion analysis
 */
export function analyzeEmotion(mood: MoodDefinition): EmotionAnalysis {
  const plutchikProfile: PlutchikProfile = {
    joy: mood.joyRating,
    trust: mood.trustRating,
    fear: mood.fearRating,
    surprise: mood.surpriseRating,
    sadness: mood.sadnessRating,
    anticipation: mood.anticipationRating,
    anger: mood.angerRating,
    disgust: mood.disgustRating,
  };

  const dominantEmotion = getDominantEmotion(plutchikProfile);
  const complexity = calculateEmotionComplexity(plutchikProfile);

  return {
    dominantEmotion,
    complexity,
    intensity: mood.intensity,
    arousal: mood.arousalLevel,
    valence: mood.valence,
    dominance: mood.dominance,
    plutchikProfile,
  };
}

/**
 * Get the dominant emotion from a Plutchik profile
 */
export function getDominantEmotion(profile: PlutchikProfile): PlutchikEmotion {
  const emotions = Object.entries(profile) as Array<[PlutchikEmotion, number]>;
  const [maxEmotion] = emotions.reduce(
    (max, [emotion, intensity]) => (intensity > max[1] ? [emotion, intensity] : max),
    ['joy' as PlutchikEmotion, 0]
  );
  return maxEmotion;
}

/**
 * Calculate emotion complexity (number of active emotions)
 */
export function calculateEmotionComplexity(profile: PlutchikProfile): number {
  return Object.values(profile).filter((rating) => rating > 0).length;
}

/**
 * Get all dominant emotions sorted by intensity
 */
export function getDominantEmotions(
  profile: PlutchikProfile
): Array<{ type: PlutchikEmotion; intensity: number }> {
  return (Object.entries(profile) as Array<[PlutchikEmotion, number]>)
    .map(([type, intensity]) => ({ type, intensity }))
    .filter((e) => e.intensity > 0)
    .sort((a, b) => b.intensity - a.intensity);
}

/**
 * Get intensity level label
 */
export function getEmotionIntensityLevel(intensity: number): 'mild' | 'moderate' | 'intense' {
  if (intensity <= 4) return 'mild';
  if (intensity <= 7) return 'moderate';
  return 'intense';
}

/**
 * Get valence label
 */
export function getEmotionValence(valence: number): 'negative' | 'neutral' | 'positive' {
  if (valence <= 3) return 'negative';
  if (valence <= 7) return 'neutral';
  return 'positive';
}

/**
 * Get arousal level label
 */
export function getEmotionArousal(arousal: number): 'low' | 'medium' | 'high' {
  if (arousal <= 3) return 'low';
  if (arousal <= 7) return 'medium';
  return 'high';
}

/**
 * Calculate distance between two emotion profiles
 */
export function calculateEmotionDistance(
  emotion1: PlutchikProfile,
  emotion2: PlutchikProfile
): number {
  const keys = Object.keys(emotion1) as Array<keyof PlutchikProfile>;
  const sum = keys.reduce((acc, key) => {
    const diff = emotion1[key] - emotion2[key];
    return acc + diff * diff;
  }, 0);

  return Math.sqrt(sum);
}

// =============================================================================
// KEYWORD-BASED EMOTION DETECTION
// =============================================================================

interface EmotionalKeyword {
  emotion: PlutchikEmotion;
  confidence: number;
}

const EMOTIONAL_KEYWORDS: Record<string, EmotionalKeyword> = {
  // Joy-related words
  happy: { emotion: 'joy', confidence: 0.8 },
  excited: { emotion: 'joy', confidence: 0.7 },
  thrilled: { emotion: 'joy', confidence: 0.9 },
  delighted: { emotion: 'joy', confidence: 0.8 },
  elated: { emotion: 'joy', confidence: 0.9 },
  joyful: { emotion: 'joy', confidence: 0.9 },
  euphoric: { emotion: 'joy', confidence: 0.95 },
  blissful: { emotion: 'joy', confidence: 0.9 },
  cheerful: { emotion: 'joy', confidence: 0.7 },
  content: { emotion: 'joy', confidence: 0.6 },

  // Sadness-related words
  sad: { emotion: 'sadness', confidence: 0.8 },
  depressed: { emotion: 'sadness', confidence: 0.9 },
  down: { emotion: 'sadness', confidence: 0.6 },
  melancholy: { emotion: 'sadness', confidence: 0.8 },
  heartbroken: { emotion: 'sadness', confidence: 0.95 },
  grief: { emotion: 'sadness', confidence: 0.9 },
  disappointed: { emotion: 'sadness', confidence: 0.7 },
  discouraged: { emotion: 'sadness', confidence: 0.7 },
  devastated: { emotion: 'sadness', confidence: 0.95 },
  lonely: { emotion: 'sadness', confidence: 0.8 },

  // Fear-related words
  afraid: { emotion: 'fear', confidence: 0.8 },
  scared: { emotion: 'fear', confidence: 0.8 },
  terrified: { emotion: 'fear', confidence: 0.95 },
  anxious: { emotion: 'fear', confidence: 0.8 },
  worried: { emotion: 'fear', confidence: 0.7 },
  nervous: { emotion: 'fear', confidence: 0.7 },
  panic: { emotion: 'fear', confidence: 0.9 },
  overwhelmed: { emotion: 'fear', confidence: 0.8 },
  apprehensive: { emotion: 'fear', confidence: 0.7 },
  fearful: { emotion: 'fear', confidence: 0.8 },

  // Anger-related words
  angry: { emotion: 'anger', confidence: 0.8 },
  furious: { emotion: 'anger', confidence: 0.9 },
  irritated: { emotion: 'anger', confidence: 0.7 },
  frustrated: { emotion: 'anger', confidence: 0.8 },
  annoyed: { emotion: 'anger', confidence: 0.6 },
  enraged: { emotion: 'anger', confidence: 0.95 },
  mad: { emotion: 'anger', confidence: 0.7 },
  hostile: { emotion: 'anger', confidence: 0.8 },
  aggressive: { emotion: 'anger', confidence: 0.8 },
  resentful: { emotion: 'anger', confidence: 0.7 },

  // Trust-related words
  confident: { emotion: 'trust', confidence: 0.8 },
  secure: { emotion: 'trust', confidence: 0.7 },
  trusting: { emotion: 'trust', confidence: 0.9 },
  peaceful: { emotion: 'trust', confidence: 0.7 },
  calm: { emotion: 'trust', confidence: 0.6 },
  relaxed: { emotion: 'trust', confidence: 0.6 },
  connected: { emotion: 'trust', confidence: 0.7 },
  accepting: { emotion: 'trust', confidence: 0.7 },

  // Surprise-related words
  surprised: { emotion: 'surprise', confidence: 0.8 },
  amazed: { emotion: 'surprise', confidence: 0.8 },
  astonished: { emotion: 'surprise', confidence: 0.9 },
  shocked: { emotion: 'surprise', confidence: 0.9 },
  stunned: { emotion: 'surprise', confidence: 0.8 },
  bewildered: { emotion: 'surprise', confidence: 0.7 },
  confused: { emotion: 'surprise', confidence: 0.6 },

  // Disgust-related words
  disgusted: { emotion: 'disgust', confidence: 0.9 },
  repulsed: { emotion: 'disgust', confidence: 0.9 },
  revolted: { emotion: 'disgust', confidence: 0.9 },
  contempt: { emotion: 'disgust', confidence: 0.8 },
  disdain: { emotion: 'disgust', confidence: 0.8 },
  loathing: { emotion: 'disgust', confidence: 0.9 },

  // Anticipation-related words
  hopeful: { emotion: 'anticipation', confidence: 0.8 },
  eager: { emotion: 'anticipation', confidence: 0.8 },
  anticipating: { emotion: 'anticipation', confidence: 0.9 },
  expectant: { emotion: 'anticipation', confidence: 0.7 },
  optimistic: { emotion: 'anticipation', confidence: 0.7 },
  enthusiastic: { emotion: 'anticipation', confidence: 0.8 },
};

/**
 * Analyze emotional keywords in text
 */
function analyzeEmotionalKeywords(
  content: string
): Array<{ word: string; emotion: PlutchikEmotion; confidence: number }> {
  const words = content.toLowerCase().split(/\s+/);
  const detectedEmotions: Array<{ word: string; emotion: PlutchikEmotion; confidence: number }> =
    [];

  words.forEach((word) => {
    // Clean punctuation
    const cleanWord = word.replace(/[^a-z]/g, '');
    if (EMOTIONAL_KEYWORDS[cleanWord]) {
      detectedEmotions.push({
        word: cleanWord,
        ...EMOTIONAL_KEYWORDS[cleanWord],
      });
    }
  });

  return detectedEmotions;
}

/**
 * Get frequent emotions from historical moods
 */
function getFrequentEmotions(
  historicalMoods: EmotionAnalysis[]
): Array<{ emotion: PlutchikEmotion; frequency: number }> {
  const emotionCounts: Record<string, number> = {};

  historicalMoods.forEach((mood) => {
    const dominant = mood.dominantEmotion;
    emotionCounts[dominant] = (emotionCounts[dominant] || 0) + 1;
  });

  return Object.entries(emotionCounts)
    .map(([emotion, count]) => ({
      emotion: emotion as PlutchikEmotion,
      frequency: count / historicalMoods.length,
    }))
    .sort((a, b) => b.frequency - a.frequency);
}

export interface EmotionRecommendation {
  emotion: PlutchikEmotion;
  confidence: number;
  reason: string;
}

/**
 * Get emotion recommendations based on journal content and history
 */
export function getEmotionRecommendations(
  journalContent: string,
  historicalMoods: EmotionAnalysis[] = []
): EmotionRecommendation[] {
  const recommendations: EmotionRecommendation[] = [];

  // Analyze journal content for emotional keywords
  const contentKeywords = analyzeEmotionalKeywords(journalContent);

  // Add recommendations based on content analysis
  contentKeywords.forEach((keyword) => {
    recommendations.push({
      emotion: keyword.emotion,
      confidence: keyword.confidence,
      reason: `Detected "${keyword.word}" in journal content`,
    });
  });

  // Consider historical patterns
  if (historicalMoods.length > 0) {
    const frequentEmotions = getFrequentEmotions(historicalMoods);
    frequentEmotions.forEach((emotion) => {
      recommendations.push({
        emotion: emotion.emotion,
        confidence: emotion.frequency * 0.3,
        reason: 'Based on your emotional patterns',
      });
    });
  }

  // Sort by confidence and deduplicate
  const seen = new Set<PlutchikEmotion>();
  return recommendations
    .sort((a, b) => b.confidence - a.confidence)
    .filter((rec) => {
      if (seen.has(rec.emotion)) return false;
      seen.add(rec.emotion);
      return true;
    })
    .slice(0, 10);
}

/**
 * Generate insights from emotion analyses
 */
export function generateEmotionInsights(emotions: EmotionAnalysis[]): string[] {
  const insights: string[] = [];

  if (emotions.length === 0) {
    return ['No emotional data available for analysis.'];
  }

  // Analyze emotional complexity
  const avgComplexity = emotions.reduce((sum, e) => sum + e.complexity, 0) / emotions.length;
  if (avgComplexity > 2) {
    insights.push(
      `You tend to experience complex emotions with an average of ${avgComplexity.toFixed(1)} emotional components.`
    );
  }

  // Analyze dominant emotions
  const dominantEmotions = emotions.map((e) => e.dominantEmotion);
  const emotionCounts: Record<string, number> = {};
  dominantEmotions.forEach((emotion) => {
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
  });

  const mostFrequent = Object.entries(emotionCounts).sort(
    ([, a], [, b]) => (b as number) - (a as number)
  )[0];

  if (mostFrequent) {
    insights.push(
      `Your most frequent emotion is ${mostFrequent[0]} (${(((mostFrequent[1] as number) / emotions.length) * 100).toFixed(1)}% of entries).`
    );
  }

  // Analyze intensity patterns
  const avgIntensity = emotions.reduce((sum, e) => sum + e.intensity, 0) / emotions.length;
  if (avgIntensity > 7) {
    insights.push(
      `You experience emotions with high intensity (average: ${avgIntensity.toFixed(1)}/10).`
    );
  } else if (avgIntensity < 4) {
    insights.push(
      `You experience emotions with mild intensity (average: ${avgIntensity.toFixed(1)}/10).`
    );
  }

  // Analyze valence patterns
  const avgValence = emotions.reduce((sum, e) => sum + e.valence, 0) / emotions.length;
  if (avgValence > 7) {
    insights.push(
      `Your emotions tend to be positive (average valence: ${avgValence.toFixed(1)}/10).`
    );
  } else if (avgValence < 4) {
    insights.push(
      `Your emotions tend to be negative (average valence: ${avgValence.toFixed(1)}/10).`
    );
  }

  return insights;
}

/**
 * Get color for an emotion
 */
export function getEmotionColor(emotionName: PlutchikEmotion): string {
  return PLUTCHIK_EMOTIONS[emotionName]?.color || '#6B7280';
}

/**
 * Format emotion name for display
 */
export function formatEmotionName(emotionName: string): string {
  return emotionName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}
