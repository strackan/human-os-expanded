/**
 * Emotion Analyzer
 *
 * Standalone text-to-emotion analysis service using a hybrid approach:
 * - VAD (Valence, Arousal, Dominance) for intensity and polarity
 * - Plutchik 8-dimension vector for specific emotion identification
 *
 * Pure functions with no database dependency - can run anywhere.
 */

import type {
  PlutchikEmotion,
  PlutchikVector,
  TextEmotionAnalysis,
  DetectedKeyword,
  EmotionComparison,
  Lexicon,
  LexiconEntry,
} from '../types/index.js';
import { EMOTION_LEXICON } from '../lexicons/index.js';

// =============================================================================
// EMOTION PROPERTIES
// =============================================================================

/**
 * VAD (Valence, Arousal, Dominance) properties for each Plutchik emotion.
 * Based on psychological research on emotional dimensions.
 */
const EMOTION_VAD: Record<PlutchikEmotion, { valence: number; arousal: number; dominance: number }> = {
  joy:          { valence:  0.9, arousal: 0.6, dominance: 0.7 },
  trust:        { valence:  0.6, arousal: 0.3, dominance: 0.5 },
  fear:         { valence: -0.7, arousal: 0.8, dominance: 0.2 },
  surprise:     { valence:  0.1, arousal: 0.8, dominance: 0.4 },
  sadness:      { valence: -0.8, arousal: 0.2, dominance: 0.2 },
  anticipation: { valence:  0.5, arousal: 0.6, dominance: 0.6 },
  anger:        { valence: -0.6, arousal: 0.9, dominance: 0.8 },
  disgust:      { valence: -0.7, arousal: 0.4, dominance: 0.6 },
};

/**
 * Opposite emotion pairs on Plutchik's wheel
 */
export const OPPOSITE_EMOTIONS: Record<PlutchikEmotion, PlutchikEmotion> = {
  joy: 'sadness',
  sadness: 'joy',
  trust: 'disgust',
  disgust: 'trust',
  fear: 'anger',
  anger: 'fear',
  surprise: 'anticipation',
  anticipation: 'surprise',
};

// =============================================================================
// EMOTION ANALYZER CLASS
// =============================================================================

export class EmotionAnalyzer {
  private lexicon: Lexicon;

  constructor(customLexicon?: Lexicon) {
    this.lexicon = customLexicon || EMOTION_LEXICON;
  }

  /**
   * Analyze text for emotional content.
   * Pure function: Text -> TextEmotionAnalysis
   */
  analyzeText(text: string): TextEmotionAnalysis {
    // 1. Tokenize and clean text
    const words = this.tokenize(text);
    const wordCount = words.length;

    if (wordCount === 0) {
      return this.createEmptyAnalysis();
    }

    // 2. Detect emotional keywords
    const detectedKeywords = this.detectKeywords(words);

    // 3. Build Plutchik vector from keywords
    const plutchikVector = this.buildPlutchikVector(detectedKeywords);

    // 4. Calculate VAD dimensions
    const { valence, arousal, dominance } = this.calculateVAD(detectedKeywords, plutchikVector);

    // 5. Determine dominant emotion
    const { dominantEmotion, emotionConfidence } = this.findDominantEmotion(plutchikVector);

    // 6. Calculate emotion density
    const emotionDensity = wordCount > 0 ? detectedKeywords.length / wordCount : 0;

    return {
      valence,
      arousal,
      dominance,
      plutchikVector,
      dominantEmotion,
      emotionConfidence,
      detectedKeywords,
      wordCount,
      emotionDensity,
      method: 'keyword',
    };
  }

  /**
   * Batch analyze multiple texts
   */
  analyzeTexts(texts: string[]): TextEmotionAnalysis[] {
    return texts.map((text) => this.analyzeText(text));
  }

  /**
   * Compare two texts emotionally
   */
  compareEmotions(text1: string, text2: string): EmotionComparison {
    const analysis1 = this.analyzeText(text1);
    const analysis2 = this.analyzeText(text2);

    const v1 = analysis1.plutchikVector;
    const v2 = analysis2.plutchikVector;

    // Calculate Euclidean distance
    const distance = this.euclideanDistance(v1, v2);

    // Calculate cosine similarity
    const similarity = this.cosineSimilarity(v1, v2);

    // Calculate shift vector (text2 - text1)
    const shift: PlutchikVector = {
      joy: v2.joy - v1.joy,
      trust: v2.trust - v1.trust,
      fear: v2.fear - v1.fear,
      surprise: v2.surprise - v1.surprise,
      sadness: v2.sadness - v1.sadness,
      anticipation: v2.anticipation - v1.anticipation,
      anger: v2.anger - v1.anger,
      disgust: v2.disgust - v1.disgust,
    };

    return {
      distance,
      similarity,
      shift,
      valenceChange: analysis2.valence - analysis1.valence,
      arousalChange: analysis2.arousal - analysis1.arousal,
      dominantShift: {
        from: analysis1.dominantEmotion,
        to: analysis2.dominantEmotion,
      },
    };
  }

  /**
   * Aggregate multiple analyses into a single average
   */
  aggregateAnalyses(analyses: TextEmotionAnalysis[]): TextEmotionAnalysis | null {
    if (analyses.length === 0) return null;

    const avgVector: PlutchikVector = {
      joy: 0, trust: 0, fear: 0, surprise: 0,
      sadness: 0, anticipation: 0, anger: 0, disgust: 0,
    };

    let totalValence = 0;
    let totalArousal = 0;
    let totalDominance = 0;
    let totalWordCount = 0;
    let totalDensity = 0;
    const allKeywords: DetectedKeyword[] = [];

    for (const analysis of analyses) {
      avgVector.joy += analysis.plutchikVector.joy;
      avgVector.trust += analysis.plutchikVector.trust;
      avgVector.fear += analysis.plutchikVector.fear;
      avgVector.surprise += analysis.plutchikVector.surprise;
      avgVector.sadness += analysis.plutchikVector.sadness;
      avgVector.anticipation += analysis.plutchikVector.anticipation;
      avgVector.anger += analysis.plutchikVector.anger;
      avgVector.disgust += analysis.plutchikVector.disgust;

      totalValence += analysis.valence;
      totalArousal += analysis.arousal;
      totalDominance += analysis.dominance;
      totalWordCount += analysis.wordCount;
      totalDensity += analysis.emotionDensity;
      allKeywords.push(...analysis.detectedKeywords);
    }

    const n = analyses.length;
    avgVector.joy /= n;
    avgVector.trust /= n;
    avgVector.fear /= n;
    avgVector.surprise /= n;
    avgVector.sadness /= n;
    avgVector.anticipation /= n;
    avgVector.anger /= n;
    avgVector.disgust /= n;

    const { dominantEmotion, emotionConfidence } = this.findDominantEmotion(avgVector);

    return {
      valence: totalValence / n,
      arousal: totalArousal / n,
      dominance: totalDominance / n,
      plutchikVector: avgVector,
      dominantEmotion,
      emotionConfidence,
      detectedKeywords: allKeywords,
      wordCount: totalWordCount,
      emotionDensity: totalDensity / n,
      method: 'keyword',
    };
  }

  /**
   * Merge a custom lexicon with the base lexicon
   */
  extendLexicon(additionalLexicon: Lexicon): void {
    this.lexicon = { ...this.lexicon, ...additionalLexicon };
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/['']/g, "'")     // Normalize apostrophes
      .replace(/[^\w\s'-]/g, ' ') // Remove punctuation except apostrophes/hyphens
      .split(/\s+/)
      .filter((word) => word.length > 0);
  }

  private detectKeywords(words: string[]): DetectedKeyword[] {
    const detected: DetectedKeyword[] = [];
    const seen = new Set<string>();

    for (const word of words) {
      // Clean the word
      const cleanWord = word.replace(/^['-]+|['-]+$/g, '');
      if (cleanWord.length < 2) continue;

      // Check exact match
      if (this.lexicon[cleanWord] && !seen.has(cleanWord)) {
        const entry = this.lexicon[cleanWord];
        detected.push({
          word: cleanWord,
          emotion: entry.emotion,
          confidence: entry.confidence,
          intensity: entry.intensity,
        });
        seen.add(cleanWord);
      }
    }

    // Also check for multi-word phrases (bigrams)
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`.replace(/^['-]+|['-]+$/g, '');
      if (this.lexicon[bigram] && !seen.has(bigram)) {
        const entry = this.lexicon[bigram];
        detected.push({
          word: bigram,
          emotion: entry.emotion,
          confidence: entry.confidence,
          intensity: entry.intensity,
        });
        seen.add(bigram);
      }
    }

    return detected;
  }

  private buildPlutchikVector(keywords: DetectedKeyword[]): PlutchikVector {
    const vector: PlutchikVector = {
      joy: 0, trust: 0, fear: 0, surprise: 0,
      sadness: 0, anticipation: 0, anger: 0, disgust: 0,
    };

    if (keywords.length === 0) return vector;

    // Aggregate scores with confidence weighting
    const emotionScores: Record<PlutchikEmotion, number[]> = {
      joy: [], trust: [], fear: [], surprise: [],
      sadness: [], anticipation: [], anger: [], disgust: [],
    };

    for (const kw of keywords) {
      // Apply intensity multiplier
      const intensityMultiplier = kw.intensity === 'intense' ? 1.2
        : kw.intensity === 'moderate' ? 1.0
        : 0.8;

      emotionScores[kw.emotion].push(kw.confidence * intensityMultiplier);
    }

    // Calculate average score for each emotion, normalized 0-1
    for (const emotion of Object.keys(vector) as PlutchikEmotion[]) {
      const scores = emotionScores[emotion];
      if (scores.length > 0) {
        // Use weighted average, capped at 1.0
        const sum = scores.reduce((a, b) => a + b, 0);
        vector[emotion] = Math.min(1.0, sum / Math.max(1, keywords.length / 2));
      }
    }

    return vector;
  }

  private calculateVAD(
    keywords: DetectedKeyword[],
    vector: PlutchikVector
  ): { valence: number; arousal: number; dominance: number } {
    if (keywords.length === 0) {
      return { valence: 0, arousal: 0, dominance: 0.5 };
    }

    let valence = 0;
    let arousal = 0;
    let dominance = 0;
    let totalWeight = 0;

    // Weight by both keyword confidence and vector magnitude
    for (const emotion of Object.keys(vector) as PlutchikEmotion[]) {
      const score = vector[emotion];
      if (score > 0) {
        const vad = EMOTION_VAD[emotion];
        valence += vad.valence * score;
        arousal += vad.arousal * score;
        dominance += vad.dominance * score;
        totalWeight += score;
      }
    }

    if (totalWeight > 0) {
      valence /= totalWeight;
      arousal /= totalWeight;
      dominance /= totalWeight;
    }

    // Clamp to valid ranges
    return {
      valence: Math.max(-1, Math.min(1, valence)),
      arousal: Math.max(0, Math.min(1, arousal)),
      dominance: Math.max(0, Math.min(1, dominance)),
    };
  }

  private findDominantEmotion(vector: PlutchikVector): {
    dominantEmotion: PlutchikEmotion;
    emotionConfidence: number;
  } {
    let maxEmotion: PlutchikEmotion = 'joy';
    let maxScore = 0;
    let secondScore = 0;

    for (const emotion of Object.keys(vector) as PlutchikEmotion[]) {
      if (vector[emotion] > maxScore) {
        secondScore = maxScore;
        maxScore = vector[emotion];
        maxEmotion = emotion;
      } else if (vector[emotion] > secondScore) {
        secondScore = vector[emotion];
      }
    }

    // Confidence is based on how much the dominant exceeds others
    const confidence = maxScore > 0
      ? Math.min(1, (maxScore - secondScore) / maxScore + 0.3)
      : 0;

    return {
      dominantEmotion: maxEmotion,
      emotionConfidence: confidence,
    };
  }

  private euclideanDistance(v1: PlutchikVector, v2: PlutchikVector): number {
    let sum = 0;
    for (const emotion of Object.keys(v1) as PlutchikEmotion[]) {
      const diff = v1[emotion] - v2[emotion];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  private cosineSimilarity(v1: PlutchikVector, v2: PlutchikVector): number {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (const emotion of Object.keys(v1) as PlutchikEmotion[]) {
      dotProduct += v1[emotion] * v2[emotion];
      mag1 += v1[emotion] * v1[emotion];
      mag2 += v2[emotion] * v2[emotion];
    }

    const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  private createEmptyAnalysis(): TextEmotionAnalysis {
    return {
      valence: 0,
      arousal: 0,
      dominance: 0.5,
      plutchikVector: {
        joy: 0, trust: 0, fear: 0, surprise: 0,
        sadness: 0, anticipation: 0, anger: 0, disgust: 0,
      },
      dominantEmotion: 'joy',
      emotionConfidence: 0,
      detectedKeywords: [],
      wordCount: 0,
      emotionDensity: 0,
      method: 'keyword',
    };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Default analyzer instance with the standard lexicon
 */
export const emotionAnalyzer = new EmotionAnalyzer();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick analysis function
 */
export function analyzeTextEmotion(text: string): TextEmotionAnalysis {
  return emotionAnalyzer.analyzeText(text);
}

/**
 * Quick comparison function
 */
export function compareTextEmotions(text1: string, text2: string): EmotionComparison {
  return emotionAnalyzer.compareEmotions(text1, text2);
}
