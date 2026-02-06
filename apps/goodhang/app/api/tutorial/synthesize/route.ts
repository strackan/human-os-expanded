/**
 * POST /api/tutorial/synthesize
 *
 * Unified synthesis endpoint that generates all 20 commandments + executive report
 * from all available sources (Sculptor, FOS Interview, Question E, Voice Calibration)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import {
  buildSynthesisPrompt,
  parseSynthesisResponse,
  type SynthesisInput,
  type SynthesisOutput,
} from '@/lib/assessment/synthesis-prompt';
import {
  FOS_INTERVIEW_EXTRACTION_SYSTEM,
  getFosInterviewExtractionPrompt,
  parseFosInterviewExtraction,
} from '@/lib/assessment/fos-interview-extraction-prompt';
import { mergeRegistries, generateMergedRegistryMarkdown } from '@/lib/assessment/registry-merge';
import { loadExistingRegistries, uploadRegistries } from '@/lib/assessment/registry-storage';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

interface SynthesizeRequest {
  session_id: string;
  user_id: string;
  entity_slug?: string;
  fos_interview_answers: Record<string, string>;
  question_e_answers?: Record<string, string>;
  voice_calibration_feedback?: Record<
    string,
    {
      edited: boolean;
      originalContent: string;
      editedContent?: string;
      whatDidntWork?: string;
      whatWouldHelp?: string;
    }
  >;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: SynthesizeRequest = await request.json();
    const {
      session_id,
      user_id,
      entity_slug,
      fos_interview_answers,
      question_e_answers = {},
      voice_calibration_feedback = {},
    } = body;

    // Validate required fields
    if (!session_id || !user_id) {
      return NextResponse.json(
        { error: 'session_id and user_id are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!fos_interview_answers || Object.keys(fos_interview_answers).length === 0) {
      return NextResponse.json(
        { error: 'fos_interview_answers is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(
      `[synthesize] Starting synthesis for session ${session_id}, user ${user_id}`
    );

    // Use service client to bypass RLS
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Gather all sources
    const sources = await gatherSources(supabase, session_id, entity_slug);

    // Build synthesis input
    const synthesisInput: SynthesisInput = {
      session_id,
      user_id,
      entity_slug: entity_slug || sources.entity_slug || 'unknown',
      fos_interview_answers,
      question_e_answers,
      voice_calibration_feedback,
      sculptor_transcript: sources.sculptor_transcript,
      corpus_summary: sources.corpus_summary,
      gap_analysis: sources.gap_analysis,
      gap_analysis_final: sources.gap_analysis_final,
      persona_fingerprint: sources.persona_fingerprint,
    };

    // Build the full prompt
    const prompt = buildSynthesisPrompt(synthesisInput);
    const effectiveEntitySlug = entity_slug || sources.entity_slug || 'unknown';

    console.log(
      `[synthesize] Prompt built, length: ${prompt.length} chars. Calling Claude...`
    );

    // Call Claude for synthesis + FOS extraction + load existing registries IN PARALLEL
    const anthropic = new Anthropic();

    const shouldExtractRegistries = effectiveEntitySlug !== 'unknown';

    const [response, fosExtractionResponse, existingRegistryFiles] = await Promise.all([
      // Existing synthesis (Sonnet, ~30-60s)
      anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),

      // NEW: FOS registry extraction (Haiku, ~3-8s)
      shouldExtractRegistries
        ? anthropic.messages.create({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 4000,
            system: FOS_INTERVIEW_EXTRACTION_SYSTEM,
            messages: [{
              role: 'user',
              content: getFosInterviewExtractionPrompt(
                fos_interview_answers,
                question_e_answers,
                effectiveEntitySlug
              ),
            }],
          }).catch((err) => {
            console.error('[synthesize] FOS extraction failed (non-blocking):', err);
            return null;
          })
        : Promise.resolve(null),

      // NEW: Load existing registries from storage
      shouldExtractRegistries
        ? loadExistingRegistries(supabase, effectiveEntitySlug).catch((err) => {
            console.error('[synthesize] Failed to load existing registries:', err);
            return {} as Record<string, string>;
          })
        : Promise.resolve({} as Record<string, string>),
    ]);

    // Process FOS extraction results and merge (non-blocking)
    let registryItemCount = 0;
    if (shouldExtractRegistries && fosExtractionResponse) {
      try {
        const fosRegistryItems = parseFosInterviewExtraction(fosExtractionResponse);
        const merged = mergeRegistries(existingRegistryFiles, fosRegistryItems);
        registryItemCount = merged.counts.total;

        console.log(
          `[synthesize] FOS extraction: ${merged.counts.stories} stories, ` +
          `${merged.counts.anecdotes} anecdotes, ${merged.counts.events} events, ` +
          `${merged.counts.people} people, ${merged.counts.parking_lot} parking_lot`
        );

        if (registryItemCount > 0) {
          const registryFiles = generateMergedRegistryMarkdown(merged, effectiveEntitySlug);
          // Fire-and-forget upload
          uploadRegistries(supabase, effectiveEntitySlug, registryFiles)
            .catch((err) => console.error('[synthesize] Registry upload error:', err));
        }
      } catch (err) {
        console.error('[synthesize] Registry merge/upload error (non-blocking):', err);
      }
    }

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    console.log(
      `[synthesize] Claude response received, length: ${responseText.length} chars`
    );

    // Parse the response
    let synthesisOutput: SynthesisOutput;
    try {
      synthesisOutput = parseSynthesisResponse(responseText);
    } catch (parseError) {
      console.error('[synthesize] Failed to parse response:', parseError);
      console.error('[synthesize] Raw response:', responseText.slice(0, 1000));
      return NextResponse.json(
        { error: 'Failed to parse synthesis response' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Store results
    await storeResults(supabase, session_id, user_id, synthesisOutput);

    const duration = Date.now() - startTime;
    console.log(`[synthesize] Complete in ${duration}ms`);

    return NextResponse.json(
      {
        success: true,
        session_id,
        executive_report: synthesisOutput.executive_report,
        character_profile: synthesisOutput.character_profile,
        attributes: synthesisOutput.attributes,
        signals: synthesisOutput.signals,
        matching: synthesisOutput.matching,
        founder_os: synthesisOutput.founder_os,
        voice_os: synthesisOutput.voice_os,
        summary: synthesisOutput.summary,
        registry_items: registryItemCount,
        duration_ms: duration,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[synthesize] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

interface GatheredSources {
  entity_slug?: string;
  sculptor_transcript?: string;
  corpus_summary?: string;
  gap_analysis?: string;
  gap_analysis_final?: string;
  persona_fingerprint?: {
    self_deprecation: number;
    directness: number;
    warmth: number;
    intellectual_signaling: number;
    comfort_with_sincerity: number;
    absurdism_tolerance: number;
    format_awareness: number;
    vulnerability_as_tool: number;
  };
}

/**
 * Gather all available sources from database and storage
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function gatherSources(
  supabase: any,
  sessionId: string,
  entitySlug?: string
): Promise<GatheredSources> {
  const sources: GatheredSources = {};

  try {
    // 1. Try to get sculptor session data
    const { data: sculptorSession } = await supabase
      .from('sculptor_sessions')
      .select('entity_slug, conversation_history, persona_fingerprint')
      .eq('id', sessionId)
      .single();

    if (sculptorSession) {
      sources.entity_slug = sculptorSession.entity_slug;

      // Format conversation history as transcript
      if (sculptorSession.conversation_history) {
        sources.sculptor_transcript = formatConversationHistory(
          sculptorSession.conversation_history
        );
      }

      // Extract persona fingerprint
      if (sculptorSession.persona_fingerprint) {
        sources.persona_fingerprint = sculptorSession.persona_fingerprint;
      }
    }

    // Use provided entity_slug or discovered one
    const effectiveEntitySlug = entitySlug || sources.entity_slug;

    if (effectiveEntitySlug) {
      // 2. Try to load CORPUS_SUMMARY.md
      const corpusSummary = await loadStorageFile(
        supabase,
        `contexts/${effectiveEntitySlug}/CORPUS_SUMMARY.md`
      );
      if (corpusSummary) {
        sources.corpus_summary = corpusSummary;
      }

      // 3. Try to load GAP_ANALYSIS.md
      const gapAnalysis = await loadStorageFile(
        supabase,
        `contexts/${effectiveEntitySlug}/GAP_ANALYSIS.md`
      );
      if (gapAnalysis) {
        sources.gap_analysis = gapAnalysis;
      }

      // 4. Try to load GAP_ANALYSIS_FINAL.md
      const gapAnalysisFinal = await loadStorageFile(
        supabase,
        `contexts/${effectiveEntitySlug}/GAP_ANALYSIS_FINAL.md`
      );
      if (gapAnalysisFinal) {
        sources.gap_analysis_final = gapAnalysisFinal;
      }

      // 5. Try to load SCULPTOR_TRANSCRIPT.md if we don't have conversation history
      if (!sources.sculptor_transcript) {
        const sculptorTranscript = await loadStorageFile(
          supabase,
          `contexts/${effectiveEntitySlug}/SCULPTOR_TRANSCRIPT.md`
        );
        if (sculptorTranscript) {
          sources.sculptor_transcript = sculptorTranscript;
        }
      }
    }
  } catch (error) {
    console.error('[synthesize] Error gathering sources:', error);
    // Continue with whatever sources we have
  }

  return sources;
}

/**
 * Load a file from Supabase storage
 */
async function loadStorageFile(
  supabase: ReturnType<typeof createServiceClient>,
  filePath: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('human-os')
      .download(filePath);

    if (error || !data) {
      return null;
    }

    return await data.text();
  } catch {
    return null;
  }
}

/**
 * Format conversation history array into readable transcript
 */
function formatConversationHistory(
  history: Array<{ role: string; content: string }>
): string {
  return history
    .map((msg) => {
      const speaker = msg.role === 'assistant' ? 'Sculptor' : 'User';
      return `**${speaker}:** ${msg.content}`;
    })
    .join('\n\n');
}

/**
 * Store synthesis results to database
 */
async function storeResults(
  supabase: ReturnType<typeof createServiceClient>,
  sessionId: string,
  userId: string,
  output: SynthesisOutput
): Promise<void> {
  const now = new Date().toISOString();

  try {
    // Update or create assessment session with results
    // Note: founder_os and voice_os are returned to client but not stored in cs_assessment_sessions
    // They can be stored separately in entity context files if needed
    const { error: sessionError } = await supabase
      .from('cs_assessment_sessions')
      .upsert({
        id: sessionId,
        user_id: userId,
        status: 'completed',
        completed_at: now,
        analyzed_at: now,
        overall_score: calculateOverallScore(output.attributes),
        character_profile: output.character_profile,
        attributes: output.attributes,
        signals: output.signals,
        matching: output.matching,
        archetype: output.character_profile.class,
        tier: 'top_1', // Default tier for synthesized profiles
      });

    if (sessionError) {
      console.error('[synthesize] Error storing session:', sessionError);
    }

    // Update user status
    const { data: existingStatus } = await supabase
      .from('user_status')
      .select('products')
      .eq('user_id', userId)
      .single();

    if (existingStatus) {
      const products = existingStatus.products || {};
      const goodhang = products.goodhang || {};

      await supabase
        .from('user_status')
        .update({
          products: {
            ...products,
            goodhang: {
              ...goodhang,
              assessment: {
                completed: true,
                completed_at: now,
                session_id: sessionId,
              },
              synthesis: {
                completed: true,
                completed_at: now,
              },
            },
          },
        })
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error('[synthesize] Error storing results:', error);
    // Don't throw - synthesis was successful even if storage failed
  }
}

/**
 * Calculate overall score from attributes (average scaled to 0-100)
 */
function calculateOverallScore(attributes: {
  INT: number;
  WIS: number;
  CHA: number;
  CON: number;
  STR: number;
  DEX: number;
}): number {
  const values = Object.values(attributes);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(average * 10); // Scale 0-10 to 0-100
}
