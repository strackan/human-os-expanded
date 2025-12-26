// Emotion utility functions for the enhanced emotion system
import { MoodProps } from '@prisma/client';

export const EMOTION_CATEGORIES = {
  // Life Domain Categories
  'personal-growth': { name: "Personal Growth", color: "#8B5CF6" },
  'self-reflection': { name: "Self-Reflection", color: "#6366F1" },
  'identity-values': { name: "Identity & Values", color: "#7C3AED" },
  'romantic': { name: "Romantic Relationships", color: "#EC4899" },
  'family': { name: "Family", color: "#F59E0B" },
  'friendships': { name: "Friendships", color: "#10B981" },
  'social': { name: "Social Situations", color: "#06B6D4" },
  'conflict': { name: "Interpersonal Conflict", color: "#EF4444" },
  'career': { name: "Career Development", color: "#0EA5E9" },
  'workplace': { name: "Workplace Dynamics", color: "#0369A1" },
  'performance': { name: "Job Performance", color: "#059669" },
  'work-life-balance': { name: "Work-Life Balance", color: "#7C2D12" },
  'physical-health': { name: "Physical Health", color: "#DC2626" },
  'mental-health': { name: "Mental Health", color: "#7C3AED" },
  'wellness': { name: "Wellness Practices", color: "#059669" },
  'medical': { name: "Medical Experiences", color: "#DC2626" },
  'education': { name: "Education", color: "#7C3AED" },
  'skills': { name: "Skill Development", color: "#059669" },
  'intellectual': { name: "Intellectual Growth", color: "#6366F1" },
  'teaching': { name: "Teaching & Mentoring", color: "#F59E0B" },
  'creative': { name: "Creative Expression", color: "#EC4899" },
  'performance-arts': { name: "Artistic Performance", color: "#8B5CF6" },
  'innovation': { name: "Innovation", color: "#06B6D4" },
  'aesthetic': { name: "Aesthetic Appreciation", color: "#EC4899" },
  'financial': { name: "Financial Security", color: "#059669" },
  'economic-stress': { name: "Economic Stress", color: "#DC2626" },
  'possessions': { name: "Material Possessions", color: "#F59E0B" },
  'entertainment': { name: "Entertainment", color: "#EC4899" },
  'sports': { name: "Sports & Competition", color: "#EF4444" },
  'hobbies': { name: "Hobbies", color: "#10B981" },
  'travel': { name: "Travel & Adventure", color: "#06B6D4" },
  'nature': { name: "Nature & Outdoors", color: "#059669" },
  'home': { name: "Home & Living Space", color: "#F59E0B" },
  'weather': { name: "Weather & Seasons", color: "#6B7280" },
  'technology': { name: "Technology & Digital", color: "#6B7280" },
  'spirituality': { name: "Spirituality", color: "#7C3AED" },
  'purpose': { name: "Life Purpose", color: "#8B5CF6" },
  'mindfulness': { name: "Mindfulness", color: "#059669" },
  
  // Emotional Type Categories
  'joy-emotions': { name: "Joy & Happiness", color: "#F59E0B" },
  'trust-emotions': { name: "Trust & Acceptance", color: "#10B981" },
  'fear-emotions': { name: "Fear & Anxiety", color: "#8B5CF6" },
  'surprise-emotions': { name: "Surprise & Wonder", color: "#EC4899" },
  'sadness-emotions': { name: "Sadness & Grief", color: "#3B82F6" },
  'anticipation-emotions': { name: "Anticipation & Hope", color: "#84CC16" },
  'anger-emotions': { name: "Anger & Frustration", color: "#EF4444" },
  'disgust-emotions': { name: "Disgust & Aversion", color: "#059669" },
  'mixed-emotions': { name: "Mixed Emotions", color: "#6B7280" },
  'social-emotions': { name: "Social Emotions", color: "#06B6D4" },
  'achievement-emotions': { name: "Achievement Emotions", color: "#84CC16" },
  'moral-emotions': { name: "Moral Emotions", color: "#7C3AED" },
  
  // Intensity Level Categories
  'mild': { name: "Mild Emotions", color: "#D1D5DB" },
  'moderate': { name: "Moderate Emotions", color: "#6B7280" },
  'intense': { name: "Intense Emotions", color: "#374151" },
  
  // Contextual Categories
  'daily': { name: "Daily Life", color: "#6B7280" },
  'events': { name: "Special Events", color: "#F59E0B" },
  'transitions': { name: "Transitions", color: "#8B5CF6" },
  'crisis': { name: "Crisis Situations", color: "#DC2626" },
};

export const PLUTCHIK_EMOTIONS = {
  joy: { name: 'Joy', color: '#F59E0B', angle: 0 },
  trust: { name: 'Trust', color: '#10B981', angle: 45 },
  fear: { name: 'Fear', color: '#8B5CF6', angle: 90 },
  surprise: { name: 'Surprise', color: '#EC4899', angle: 135 },
  sadness: { name: 'Sadness', color: '#3B82F6', angle: 180 },
  anticipation: { name: 'Anticipation', color: '#84CC16', angle: 225 },
  anger: { name: 'Anger', color: '#EF4444', angle: 270 },
  disgust: { name: 'Disgust', color: '#059669', angle: 315 },
};

export interface EmotionAnalysis {
  dominantEmotion: string;
  complexity: number;
  intensity: number;
  arousal: number;
  valence: number;
  dominance: number;
  plutchikProfile: PlutchikProfile;
}

export interface PlutchikProfile {
  joy: number;
  trust: number;
  fear: number;
  surprise: number;
  sadness: number;
  anticipation: number;
  anger: number;
  disgust: number;
}

export function analyzeEmotion(moodProps: MoodProps): EmotionAnalysis {
  const plutchikProfile: PlutchikProfile = {
    joy: moodProps.joyRating || 0,
    trust: moodProps.trustRating || 0,
    fear: moodProps.fearRating || 0,
    surprise: moodProps.surpriseRating || 0,
    sadness: moodProps.sadnessRating || 0,
    anticipation: moodProps.anticipationRating || 0,
    anger: moodProps.angerRating || 0,
    disgust: moodProps.disgustRating || 0,
  };

  const dominantEmotion = getDominantEmotion(plutchikProfile);
  const complexity = calculateEmotionComplexity(plutchikProfile);

  return {
    dominantEmotion,
    complexity,
    intensity: moodProps.intensity,
    arousal: moodProps.arousalLevel,
    valence: moodProps.valence,
    dominance: moodProps.dominance,
    plutchikProfile,
  };
}

export function getDominantEmotion(plutchikProfile: PlutchikProfile): string {
  const emotions = Object.entries(plutchikProfile);
  const maxEmotion = emotions.reduce((max, [emotion, intensity]) => 
    intensity > max[1] ? [emotion, intensity] : max, ['', 0]);
  
  return maxEmotion[0];
}

export function calculateEmotionComplexity(plutchikProfile: PlutchikProfile): number {
  const activeEmotions = Object.values(plutchikProfile).filter(rating => rating > 0);
  return activeEmotions.length;
}

export function getDominantEmotions(plutchikProfile: PlutchikProfile): Array<{type: string, intensity: number}> {
  const emotions = Object.entries(plutchikProfile)
    .map(([type, intensity]) => ({ type, intensity }))
    .filter(e => e.intensity > 0)
    .sort((a, b) => b.intensity - a.intensity);
  
  return emotions;
}

export function getEmotionIntensityLevel(intensity: number): 'mild' | 'moderate' | 'intense' {
  if (intensity <= 4) return 'mild';
  if (intensity <= 7) return 'moderate';
  return 'intense';
}

export function getEmotionValence(valence: number): 'negative' | 'neutral' | 'positive' {
  if (valence <= 3) return 'negative';
  if (valence <= 7) return 'neutral';
  return 'positive';
}

export function getEmotionArousal(arousal: number): 'low' | 'medium' | 'high' {
  if (arousal <= 3) return 'low';
  if (arousal <= 7) return 'medium';
  return 'high';
}

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

export function getEmotionRecommendations(
  journalContent: string,
  historicalMoods: any[],
  contextualFactors: any = {}
): Array<{emotion: any, confidence: number, reason: string}> {
  const recommendations = [];
  
  // Analyze journal content for emotional keywords
  const contentKeywords = analyzeEmotionalKeywords(journalContent);
  
  // Add recommendations based on content analysis
  contentKeywords.forEach(keyword => {
    recommendations.push({
      emotion: keyword.emotion,
      confidence: keyword.confidence,
      reason: `Detected "${keyword.word}" in journal content`
    });
  });
  
  // Consider historical patterns
  if (historicalMoods.length > 0) {
    const frequentEmotions = getFrequentEmotions(historicalMoods);
    frequentEmotions.forEach(emotion => {
      recommendations.push({
        emotion: emotion.emotion,
        confidence: emotion.frequency * 0.3,
        reason: `Based on your emotional patterns`
      });
    });
  }
  
  // Sort by confidence
  return recommendations
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);
}

function analyzeEmotionalKeywords(content: string): Array<{word: string, emotion: string, confidence: number}> {
  const emotionalKeywords = {
    // Joy-related words
    'happy': { emotion: 'joy', confidence: 0.8 },
    'excited': { emotion: 'joy', confidence: 0.7 },
    'thrilled': { emotion: 'joy', confidence: 0.9 },
    'delighted': { emotion: 'joy', confidence: 0.8 },
    'elated': { emotion: 'joy', confidence: 0.9 },
    'joyful': { emotion: 'joy', confidence: 0.9 },
    'euphoric': { emotion: 'joy', confidence: 0.95 },
    'blissful': { emotion: 'joy', confidence: 0.9 },
    'cheerful': { emotion: 'joy', confidence: 0.7 },
    'content': { emotion: 'joy', confidence: 0.6 },
    
    // Sadness-related words
    'sad': { emotion: 'sadness', confidence: 0.8 },
    'depressed': { emotion: 'sadness', confidence: 0.9 },
    'down': { emotion: 'sadness', confidence: 0.6 },
    'melancholy': { emotion: 'sadness', confidence: 0.8 },
    'heartbroken': { emotion: 'sadness', confidence: 0.95 },
    'grief': { emotion: 'sadness', confidence: 0.9 },
    'disappointed': { emotion: 'sadness', confidence: 0.7 },
    'discouraged': { emotion: 'sadness', confidence: 0.7 },
    'devastated': { emotion: 'sadness', confidence: 0.95 },
    'lonely': { emotion: 'sadness', confidence: 0.8 },
    
    // Fear-related words
    'afraid': { emotion: 'fear', confidence: 0.8 },
    'scared': { emotion: 'fear', confidence: 0.8 },
    'terrified': { emotion: 'fear', confidence: 0.95 },
    'anxious': { emotion: 'fear', confidence: 0.8 },
    'worried': { emotion: 'fear', confidence: 0.7 },
    'nervous': { emotion: 'fear', confidence: 0.7 },
    'panic': { emotion: 'fear', confidence: 0.9 },
    'overwhelmed': { emotion: 'fear', confidence: 0.8 },
    'apprehensive': { emotion: 'fear', confidence: 0.7 },
    'fearful': { emotion: 'fear', confidence: 0.8 },
    
    // Anger-related words
    'angry': { emotion: 'anger', confidence: 0.8 },
    'furious': { emotion: 'anger', confidence: 0.9 },
    'irritated': { emotion: 'anger', confidence: 0.7 },
    'frustrated': { emotion: 'anger', confidence: 0.8 },
    'annoyed': { emotion: 'anger', confidence: 0.6 },
    'enraged': { emotion: 'anger', confidence: 0.95 },
    'mad': { emotion: 'anger', confidence: 0.7 },
    'hostile': { emotion: 'anger', confidence: 0.8 },
    'aggressive': { emotion: 'anger', confidence: 0.8 },
    'resentful': { emotion: 'anger', confidence: 0.7 },
    
    // Trust-related words
    'confident': { emotion: 'trust', confidence: 0.8 },
    'secure': { emotion: 'trust', confidence: 0.7 },
    'trusting': { emotion: 'trust', confidence: 0.9 },
    'peaceful': { emotion: 'trust', confidence: 0.7 },
    'calm': { emotion: 'trust', confidence: 0.6 },
    'relaxed': { emotion: 'trust', confidence: 0.6 },
    'connected': { emotion: 'trust', confidence: 0.7 },
    'accepting': { emotion: 'trust', confidence: 0.7 },
    
    // Surprise-related words
    'surprised': { emotion: 'surprise', confidence: 0.8 },
    'amazed': { emotion: 'surprise', confidence: 0.8 },
    'astonished': { emotion: 'surprise', confidence: 0.9 },
    'shocked': { emotion: 'surprise', confidence: 0.9 },
    'stunned': { emotion: 'surprise', confidence: 0.8 },
    'bewildered': { emotion: 'surprise', confidence: 0.7 },
    'confused': { emotion: 'surprise', confidence: 0.6 },
    
    // Disgust-related words
    'disgusted': { emotion: 'disgust', confidence: 0.9 },
    'repulsed': { emotion: 'disgust', confidence: 0.9 },
    'revolted': { emotion: 'disgust', confidence: 0.9 },
    'contempt': { emotion: 'disgust', confidence: 0.8 },
    'disdain': { emotion: 'disgust', confidence: 0.8 },
    'loathing': { emotion: 'disgust', confidence: 0.9 },
    
    // Anticipation-related words
    'excited': { emotion: 'anticipation', confidence: 0.7 },
    'hopeful': { emotion: 'anticipation', confidence: 0.8 },
    'eager': { emotion: 'anticipation', confidence: 0.8 },
    'anticipating': { emotion: 'anticipation', confidence: 0.9 },
    'expectant': { emotion: 'anticipation', confidence: 0.7 },
    'optimistic': { emotion: 'anticipation', confidence: 0.7 },
    'enthusiastic': { emotion: 'anticipation', confidence: 0.8 },
  };
  
  const words = content.toLowerCase().split(/\s+/);
  const detectedEmotions = [];
  
  words.forEach(word => {
    if (emotionalKeywords[word]) {
      detectedEmotions.push({
        word,
        ...emotionalKeywords[word]
      });
    }
  });
  
  return detectedEmotions;
}

function getFrequentEmotions(historicalMoods: any[]): Array<{emotion: string, frequency: number}> {
  const emotionCounts = {};
  
  historicalMoods.forEach(mood => {
    const dominant = getDominantEmotion(mood.plutchikProfile);
    emotionCounts[dominant] = (emotionCounts[dominant] || 0) + 1;
  });
  
  return Object.entries(emotionCounts)
    .map(([emotion, count]) => ({ emotion, frequency: count / historicalMoods.length }))
    .sort((a, b) => b.frequency - a.frequency);
}

export function generateEmotionInsights(emotions: EmotionAnalysis[]): string[] {
  const insights = [];
  
  if (emotions.length === 0) {
    return ['No emotional data available for analysis.'];
  }
  
  // Analyze emotional complexity
  const avgComplexity = emotions.reduce((sum, e) => sum + e.complexity, 0) / emotions.length;
  if (avgComplexity > 2) {
    insights.push(`You tend to experience complex emotions with an average of ${avgComplexity.toFixed(1)} emotional components.`);
  }
  
  // Analyze dominant emotions
  const dominantEmotions = emotions.map(e => e.dominantEmotion);
  const emotionCounts = {};
  dominantEmotions.forEach(emotion => {
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
  });
  
  const mostFrequent = Object.entries(emotionCounts)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (mostFrequent) {
    insights.push(`Your most frequent emotion is ${mostFrequent[0]} (${((mostFrequent[1] as number) / emotions.length * 100).toFixed(1)}% of entries).`);
  }
  
  // Analyze intensity patterns
  const avgIntensity = emotions.reduce((sum, e) => sum + e.intensity, 0) / emotions.length;
  if (avgIntensity > 7) {
    insights.push(`You experience emotions with high intensity (average: ${avgIntensity.toFixed(1)}/10).`);
  } else if (avgIntensity < 4) {
    insights.push(`You experience emotions with mild intensity (average: ${avgIntensity.toFixed(1)}/10).`);
  }
  
  // Analyze valence patterns
  const avgValence = emotions.reduce((sum, e) => sum + e.valence, 0) / emotions.length;
  if (avgValence > 7) {
    insights.push(`Your emotions tend to be positive (average valence: ${avgValence.toFixed(1)}/10).`);
  } else if (avgValence < 4) {
    insights.push(`Your emotions tend to be negative (average valence: ${avgValence.toFixed(1)}/10).`);
  }
  
  return insights;
}

export function getEmotionColor(emotionName: string): string {
  const colorMap = {
    'joy': '#F59E0B',
    'trust': '#10B981',
    'fear': '#8B5CF6',
    'surprise': '#EC4899',
    'sadness': '#3B82F6',
    'anticipation': '#84CC16',
    'anger': '#EF4444',
    'disgust': '#059669',
  };
  
  return colorMap[emotionName] || '#6B7280';
}

export function formatEmotionName(emotionName: string): string {
  return emotionName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
} 