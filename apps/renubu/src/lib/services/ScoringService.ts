/**
 * ScoringService - Handles AI-powered assessment scoring via Claude API
 *
 * This service:
 * - Takes interview transcripts
 * - Sends to Claude API with comprehensive scoring prompt
 * - Parses structured JSON response
 * - Returns scored analysis with dimensions, archetype, tier, flags
 *
 * Updated: Now uses AnthropicService for consistency with other LLM services
 */

import { AnthropicService } from '@/lib/services/AnthropicService';
import { CLAUDE_SONNET_CURRENT } from '@/lib/constants/claude-models';
import { buildScoringPrompt, parseAssessmentResponse } from '@/lib/prompts/cs-assessment-scoring';
import { determineTier } from '@/lib/assessment/scoring-rubrics';
import { InterviewMessage, CandidateAnalysis } from '@/types/talent';

export interface ScoringResult {
  analysis: CandidateAnalysis;
  success: boolean;
  error?: string;
  tokensUsed?: number;
}

export class ScoringService {
  /**
   * Score an interview transcript using Claude API
   *
   * @param transcript - Array of interview messages (questions and answers)
   * @returns Structured analysis with scores, archetype, tier, flags, and token usage
   */
  static async scoreAssessment(transcript: InterviewMessage[]): Promise<ScoringResult> {
    try {
      // Validate transcript
      if (!transcript || transcript.length === 0) {
        return {
          success: false,
          error: 'No transcript provided',
          analysis: null as any,
        };
      }

      // Build scoring prompt
      const scoringPrompt = buildScoringPrompt(transcript);

      // Use AnthropicService for consistency
      const response = await AnthropicService.generateCompletion({
        prompt: scoringPrompt,
        systemPrompt: 'You are an expert talent assessment specialist. Analyze the interview transcript and provide a structured JSON assessment.',
        model: CLAUDE_SONNET_CURRENT, // Use centralized model constant
        maxTokens: 4000,
        temperature: 0.3, // Lower temperature for more consistent scoring
      });

      const responseText = response.content;

      if (!responseText) {
        return {
          success: false,
          error: 'Empty response from Claude API',
          analysis: null as any,
        };
      }

      // Parse AI response
      const parsedAnalysis = parseAssessmentResponse(responseText);

      // Determine tier from overall score
      const tier = determineTier(parsedAnalysis.overall_score);

      // Build full analysis object
      const analysis: CandidateAnalysis = {
        dimensions: parsedAnalysis.dimensions,
        archetype: parsedAnalysis.archetype,
        archetype_confidence: parsedAnalysis.archetype_confidence,
        flags: {
          red_flags: parsedAnalysis.red_flags || [],
          green_flags: parsedAnalysis.green_flags || [],
        },
        overall_score: parsedAnalysis.overall_score,
        tier,
        recommendation: parsedAnalysis.recommendation,
        best_fit_roles: parsedAnalysis.best_fit_roles,
        analyzed_at: new Date().toISOString(),
      };

      console.log('[ScoringService] Assessment scored successfully, tokens used:', response.tokensUsed.total);

      return {
        success: true,
        analysis,
        tokensUsed: response.tokensUsed.total,
      };
    } catch (error: any) {
      console.error('[ScoringService] Error scoring assessment:', error);
      return {
        success: false,
        error: error.message || 'Failed to score assessment',
        analysis: null as any,
      };
    }
  }

  /**
   * Score multiple assessments in batch
   * (For future use - bulk processing)
   *
   * @param transcripts - Array of transcripts to score
   * @returns Array of scoring results
   */
  static async scoreAssessmentsBatch(
    transcripts: InterviewMessage[][]
  ): Promise<ScoringResult[]> {
    // Process in parallel with rate limiting
    const results = await Promise.all(transcripts.map((t) => this.scoreAssessment(t)));

    return results;
  }
}
