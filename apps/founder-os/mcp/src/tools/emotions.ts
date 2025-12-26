/**
 * Emotion Analysis Tools
 *
 * Standalone emotion analysis tools for text-to-Plutchik vector conversion.
 * Separate from journal tools - can be used to analyze any text including
 * transcripts, social media posts, and ad-hoc content.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { z } from 'zod';
import {
  EmotionAnalyzer,
  analyzeTextEmotion,
  compareTextEmotions,
  getLexiconStats,
  type TextEmotionAnalysis,
} from '@human-os/journal';
import crypto from 'crypto';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const emotionTools: Tool[] = [
  {
    name: 'analyze_text_emotions',
    description:
      'Analyze text for emotional content. Returns Plutchik 8-dimension vector scores, VAD (Valence-Arousal-Dominance), and detected keywords. Use this to understand the emotional tone of any text.',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to analyze for emotional content',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'compare_text_emotions',
    description:
      'Compare emotional content of two texts. Useful for before/after analysis, A/B comparisons, or tracking emotional changes over time.',
    inputSchema: {
      type: 'object',
      properties: {
        text1: {
          type: 'string',
          description: 'First text (baseline)',
        },
        text2: {
          type: 'string',
          description: 'Second text (to compare)',
        },
      },
      required: ['text1', 'text2'],
    },
  },
  {
    name: 'analyze_transcript_emotions',
    description:
      'Analyze emotions in a stored transcript by ID. Optionally store the results for trend analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        transcript_id: {
          type: 'string',
          description: 'UUID of the transcript to analyze',
        },
        store_results: {
          type: 'boolean',
          description: 'Store analysis results for trend tracking (default: false)',
        },
      },
      required: ['transcript_id'],
    },
  },
  {
    name: 'batch_analyze_transcripts',
    description:
      'Run emotion analysis on multiple transcripts matching a filter. Results are stored for trend analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        call_type: {
          type: 'string',
          enum: ['demo', 'customer', 'coaching', 'internal', 'investor', 'partnership', 'other'],
          description: 'Filter by call type',
        },
        participant_name: {
          type: 'string',
          description: 'Filter by participant name (fuzzy match)',
        },
        context_tag: {
          type: 'string',
          description: 'Filter by context tag',
        },
        date_from: {
          type: 'string',
          description: 'Filter transcripts from this date (YYYY-MM-DD)',
        },
        date_to: {
          type: 'string',
          description: 'Filter transcripts up to this date (YYYY-MM-DD)',
        },
        limit: {
          type: 'number',
          description: 'Max transcripts to analyze (default: 20)',
        },
      },
    },
  },
  {
    name: 'get_emotion_trends',
    description:
      'Get emotion trends over time. Track valence, arousal, and Plutchik dimensions across stored analyses.',
    inputSchema: {
      type: 'object',
      properties: {
        group_by: {
          type: 'string',
          enum: ['day', 'week', 'month'],
          description: 'Time period for aggregation (default: month)',
        },
        date_from: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        date_to: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)',
        },
        participant: {
          type: 'string',
          description: 'Filter by participant name',
        },
        source_type: {
          type: 'string',
          enum: ['transcript', 'journal', 'text', 'social'],
          description: 'Filter by source type',
        },
      },
    },
  },
  {
    name: 'get_lexicon_stats',
    description:
      'Get statistics about the emotion lexicon - total keywords, distribution by emotion and intensity.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const AnalyzeTextSchema = z.object({
  text: z.string().min(1),
});

const CompareTextsSchema = z.object({
  text1: z.string().min(1),
  text2: z.string().min(1),
});

const AnalyzeTranscriptSchema = z.object({
  transcript_id: z.string().uuid(),
  store_results: z.boolean().optional().default(false),
});

const BatchAnalyzeSchema = z.object({
  call_type: z
    .enum(['demo', 'customer', 'coaching', 'internal', 'investor', 'partnership', 'other'])
    .optional(),
  participant_name: z.string().optional(),
  context_tag: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(20),
});

const GetTrendsSchema = z.object({
  group_by: z.enum(['day', 'week', 'month']).optional().default('month'),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  participant: z.string().optional(),
  source_type: z.enum(['transcript', 'journal', 'text', 'social']).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Hash text content for deduplication
 */
function hashText(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex').substring(0, 32);
}

/**
 * Extract participant names from transcript
 */
function extractParticipantNames(participants: unknown[]): string[] {
  return participants
    .filter((p): p is { name: string } => typeof p === 'object' && p !== null && 'name' in p)
    .map(p => p.name);
}

/**
 * Store emotion analysis result
 */
async function storeEmotionAnalysis(
  ctx: ToolContext,
  sourceType: 'transcript' | 'journal' | 'text' | 'social',
  sourceId: string | null,
  analysis: TextEmotionAnalysis,
  analyzedDate: Date | null,
  participantNames: string[],
  contextTags: string[],
  textHash: string
): Promise<string> {
  const client = ctx.getClient();

  const { data, error } = await client
    .from('emotion_analyses')
    .insert({
      source_type: sourceType,
      source_id: sourceId,
      source_text_hash: textHash,
      joy: analysis.plutchikVector.joy,
      trust: analysis.plutchikVector.trust,
      fear: analysis.plutchikVector.fear,
      surprise: analysis.plutchikVector.surprise,
      sadness: analysis.plutchikVector.sadness,
      anticipation: analysis.plutchikVector.anticipation,
      anger: analysis.plutchikVector.anger,
      disgust: analysis.plutchikVector.disgust,
      valence: analysis.valence,
      arousal: analysis.arousal,
      dominance: analysis.dominance,
      dominant_emotion: analysis.dominantEmotion,
      emotion_confidence: analysis.emotionConfidence,
      emotion_density: analysis.emotionDensity,
      analyzed_date: analyzedDate?.toISOString().split('T')[0] ?? null,
      participant_names: participantNames,
      context_tags: contextTags,
      word_count: analysis.wordCount,
      keyword_count: analysis.detectedKeywords.length,
      detected_keywords: analysis.detectedKeywords,
      analysis_method: analysis.method,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to store emotion analysis: ${error.message}`);
  }

  return data.id;
}

// =============================================================================
// HANDLER
// =============================================================================

export async function handleEmotionTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  const client = ctx.getClient();

  // --------------------------------------------------------------------------
  // analyze_text_emotions
  // --------------------------------------------------------------------------
  if (name === 'analyze_text_emotions') {
    const { text } = AnalyzeTextSchema.parse(args);

    const analysis = analyzeTextEmotion(text);

    return {
      success: true,
      analysis: {
        // VAD dimensions
        valence: analysis.valence,
        arousal: analysis.arousal,
        dominance: analysis.dominance,

        // Plutchik vector
        plutchikVector: analysis.plutchikVector,
        dominantEmotion: analysis.dominantEmotion,
        emotionConfidence: analysis.emotionConfidence,

        // Details
        detectedKeywords: analysis.detectedKeywords.slice(0, 20), // Limit for readability
        wordCount: analysis.wordCount,
        emotionDensity: analysis.emotionDensity,
        keywordCount: analysis.detectedKeywords.length,

        // Interpretation
        interpretation: {
          tone:
            analysis.valence > 0.3
              ? 'positive'
              : analysis.valence < -0.3
                ? 'negative'
                : 'neutral',
          intensity:
            analysis.arousal > 0.6 ? 'high' : analysis.arousal > 0.3 ? 'moderate' : 'low',
          primary: analysis.dominantEmotion,
        },
      },
    };
  }

  // --------------------------------------------------------------------------
  // compare_text_emotions
  // --------------------------------------------------------------------------
  if (name === 'compare_text_emotions') {
    const { text1, text2 } = CompareTextsSchema.parse(args);

    const comparison = compareTextEmotions(text1, text2);
    const analysis1 = analyzeTextEmotion(text1);
    const analysis2 = analyzeTextEmotion(text2);

    return {
      success: true,
      comparison: {
        // Distance metrics
        distance: comparison.distance,
        similarity: comparison.similarity,

        // Changes
        valenceChange: comparison.valenceChange,
        arousalChange: comparison.arousalChange,
        dominantShift: comparison.dominantShift,

        // Vector shift
        shift: comparison.shift,

        // Interpretation
        interpretation: {
          direction:
            comparison.valenceChange > 0.1
              ? 'more positive'
              : comparison.valenceChange < -0.1
                ? 'more negative'
                : 'similar valence',
          intensityChange:
            comparison.arousalChange > 0.1
              ? 'more intense'
              : comparison.arousalChange < -0.1
                ? 'calmer'
                : 'similar intensity',
          emotionShift:
            comparison.dominantShift.from !== comparison.dominantShift.to
              ? `shifted from ${comparison.dominantShift.from} to ${comparison.dominantShift.to}`
              : `remained ${comparison.dominantShift.from}`,
        },
      },
      text1Analysis: {
        dominantEmotion: analysis1.dominantEmotion,
        valence: analysis1.valence,
        arousal: analysis1.arousal,
      },
      text2Analysis: {
        dominantEmotion: analysis2.dominantEmotion,
        valence: analysis2.valence,
        arousal: analysis2.arousal,
      },
    };
  }

  // --------------------------------------------------------------------------
  // analyze_transcript_emotions
  // --------------------------------------------------------------------------
  if (name === 'analyze_transcript_emotions') {
    const { transcript_id, store_results } = AnalyzeTranscriptSchema.parse(args);

    // Fetch transcript
    const { data: transcript, error } = await client
      .from('transcripts')
      .select('id, title, raw_content, call_date, participants, context_tags')
      .eq('id', transcript_id)
      .single();

    if (error || !transcript) {
      throw new Error(`Transcript not found: ${transcript_id}`);
    }

    // Analyze content
    const analysis = analyzeTextEmotion(transcript.raw_content);
    const textHash = hashText(transcript.raw_content);

    // Store if requested
    let analysisId: string | null = null;
    if (store_results) {
      const participantNames = extractParticipantNames(transcript.participants || []);
      analysisId = await storeEmotionAnalysis(
        ctx,
        'transcript',
        transcript_id,
        analysis,
        transcript.call_date ? new Date(transcript.call_date) : null,
        participantNames,
        transcript.context_tags || [],
        textHash
      );
    }

    return {
      success: true,
      transcript: {
        id: transcript.id,
        title: transcript.title,
        call_date: transcript.call_date,
      },
      analysis: {
        valence: analysis.valence,
        arousal: analysis.arousal,
        dominance: analysis.dominance,
        plutchikVector: analysis.plutchikVector,
        dominantEmotion: analysis.dominantEmotion,
        emotionConfidence: analysis.emotionConfidence,
        wordCount: analysis.wordCount,
        emotionDensity: analysis.emotionDensity,
        keywordCount: analysis.detectedKeywords.length,
        topKeywords: analysis.detectedKeywords.slice(0, 10),
      },
      stored: store_results,
      analysisId,
    };
  }

  // --------------------------------------------------------------------------
  // batch_analyze_transcripts
  // --------------------------------------------------------------------------
  if (name === 'batch_analyze_transcripts') {
    const { call_type, participant_name, context_tag, date_from, date_to, limit } =
      BatchAnalyzeSchema.parse(args);

    // Build query
    let query = client
      .from('transcripts')
      .select('id, title, raw_content, call_date, call_type, participants, context_tags')
      .order('call_date', { ascending: false })
      .limit(limit);

    if (call_type) {
      query = query.eq('call_type', call_type);
    }
    if (context_tag) {
      query = query.contains('context_tags', [context_tag]);
    }
    if (date_from) {
      query = query.gte('call_date', date_from);
    }
    if (date_to) {
      query = query.lte('call_date', date_to);
    }

    const { data: transcripts, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch transcripts: ${error.message}`);
    }

    // Filter by participant name if specified
    let filteredTranscripts = transcripts || [];
    if (participant_name) {
      const searchTerm = participant_name.toLowerCase();
      filteredTranscripts = filteredTranscripts.filter((t) => {
        const participants = (t.participants || []) as Array<{ name?: string }>;
        return participants.some((p) => p.name?.toLowerCase().includes(searchTerm));
      });
    }

    // Analyze and store each transcript
    const analyzer = new EmotionAnalyzer();
    const results: Array<{
      transcriptId: string;
      title: string;
      callDate: string;
      dominantEmotion: string;
      valence: number;
      arousal: number;
      analysisId: string;
    }> = [];

    for (const transcript of filteredTranscripts) {
      const analysis = analyzer.analyzeText(transcript.raw_content);
      const textHash = hashText(transcript.raw_content);
      const participantNames = extractParticipantNames(transcript.participants || []);

      const analysisId = await storeEmotionAnalysis(
        ctx,
        'transcript',
        transcript.id,
        analysis,
        transcript.call_date ? new Date(transcript.call_date) : null,
        participantNames,
        transcript.context_tags || [],
        textHash
      );

      results.push({
        transcriptId: transcript.id,
        title: transcript.title,
        callDate: transcript.call_date,
        dominantEmotion: analysis.dominantEmotion,
        valence: analysis.valence,
        arousal: analysis.arousal,
        analysisId,
      });
    }

    // Aggregate summary
    const avgValence =
      results.length > 0 ? results.reduce((sum, r) => sum + r.valence, 0) / results.length : 0;
    const avgArousal =
      results.length > 0 ? results.reduce((sum, r) => sum + r.arousal, 0) / results.length : 0;

    // Count dominant emotions
    const emotionCounts: Record<string, number> = {};
    results.forEach((r) => {
      emotionCounts[r.dominantEmotion] = (emotionCounts[r.dominantEmotion] || 0) + 1;
    });

    return {
      success: true,
      analyzedCount: results.length,
      summary: {
        averageValence: avgValence,
        averageArousal: avgArousal,
        overallTone: avgValence > 0.3 ? 'positive' : avgValence < -0.3 ? 'negative' : 'neutral',
        dominantEmotions: Object.entries(emotionCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([emotion, count]) => ({ emotion, count })),
      },
      results: results.slice(0, 10), // Return first 10 for readability
    };
  }

  // --------------------------------------------------------------------------
  // get_emotion_trends
  // --------------------------------------------------------------------------
  if (name === 'get_emotion_trends') {
    const { group_by, date_from, date_to, participant, source_type } = GetTrendsSchema.parse(args);

    // Use the database function for trend aggregation
    const { data, error } = await client.rpc('get_emotion_trends', {
      p_group_by: group_by,
      p_date_from: date_from || null,
      p_date_to: date_to || null,
      p_participant: participant || null,
      p_source_type: source_type || null,
    });

    if (error) {
      throw new Error(`Failed to get emotion trends: ${error.message}`);
    }

    // Calculate overall trend direction
    const trends = data || [];
    let valenceDirection = 'stable';
    let arousalDirection = 'stable';

    if (trends.length >= 2) {
      const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
      const secondHalf = trends.slice(Math.floor(trends.length / 2));

      const avgValence1 =
        firstHalf.reduce((sum: number, t: { avg_valence: number }) => sum + t.avg_valence, 0) /
        firstHalf.length;
      const avgValence2 =
        secondHalf.reduce((sum: number, t: { avg_valence: number }) => sum + t.avg_valence, 0) /
        secondHalf.length;
      const avgArousal1 =
        firstHalf.reduce((sum: number, t: { avg_arousal: number }) => sum + t.avg_arousal, 0) /
        firstHalf.length;
      const avgArousal2 =
        secondHalf.reduce((sum: number, t: { avg_arousal: number }) => sum + t.avg_arousal, 0) /
        secondHalf.length;

      valenceDirection =
        avgValence2 - avgValence1 > 0.1
          ? 'improving'
          : avgValence2 - avgValence1 < -0.1
            ? 'declining'
            : 'stable';
      arousalDirection =
        avgArousal2 - avgArousal1 > 0.1
          ? 'increasing'
          : avgArousal2 - avgArousal1 < -0.1
            ? 'decreasing'
            : 'stable';
    }

    return {
      success: true,
      groupBy: group_by,
      periodCount: trends.length,
      overallTrend: {
        valenceDirection,
        arousalDirection,
      },
      dataPoints: trends,
    };
  }

  // --------------------------------------------------------------------------
  // get_lexicon_stats
  // --------------------------------------------------------------------------
  if (name === 'get_lexicon_stats') {
    const stats = getLexiconStats();

    return {
      success: true,
      lexicon: {
        totalKeywords: stats.total,
        byEmotion: stats.byEmotion,
        byIntensity: stats.byIntensity,
        coverageInfo: {
          description:
            'Keywords are mapped to Plutchik 8 primary emotions with confidence scores and intensity levels',
          emotions: ['joy', 'trust', 'fear', 'surprise', 'sadness', 'anticipation', 'anger', 'disgust'],
          intensityLevels: ['mild', 'moderate', 'intense'],
        },
      },
    };
  }

  // Not handled by this module
  return null;
}
