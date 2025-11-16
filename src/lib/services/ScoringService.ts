/**
 * ScoringService - Handles AI-powered assessment scoring via Claude API
 *
 * This service:
 * - Takes interview transcripts
 * - Sends to Claude API with comprehensive scoring prompt
 * - Parses structured JSON response
 * - Returns scored analysis with dimensions, archetype, tier, flags
 */

import Anthropic from '@anthropic-ai/sdk';
import { buildScoringPrompt, parseAssessmentResponse } from '@/lib/prompts/cs-assessment-scoring';
import { determineTier } from '@/lib/assessment/scoring-rubrics';
import { InterviewMessage, CandidateAnalysis } from '@/types/talent';

export interface ScoringResult {
  analysis: CandidateAnalysis;
  success: boolean;
  error?: string;
}

export class ScoringService {
  private static anthropic: Anthropic | null = null;

  /**
   * Initialize Anthropic client (lazy initialization)
   */
  private static getClient(): Anthropic {
    if (!this.anthropic) {
      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable not set');
      }

      this.anthropic = new Anthropic({
        apiKey,
      });
    }

    return this.anthropic;
  }

  /**
   * Score an interview transcript using Claude API
   *
   * @param transcript - Array of interview messages (questions and answers)
   * @returns Structured analysis with scores, archetype, tier, flags
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

      // Get Anthropic client
      const client = this.getClient();

      // Call Claude API
      const message = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: scoringPrompt,
          },
        ],
      });

      // Extract text from response
      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

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

      return {
        success: true,
        analysis,
      };
    } catch (error: any) {
      console.error('Error scoring assessment:', error);
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
