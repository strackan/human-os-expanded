/**
 * Talent Chat Generator Service
 *
 * Generates LLM-powered conversational responses for talent/hiring interviews.
 * Mirrors the GreetingGenerator pattern for consistency.
 *
 * Features:
 * - Uses AnthropicService for LLM calls
 * - Tracks token usage
 * - Supports conversation history
 * - Integrates with Human-OS for candidate enrichment
 */

import { AnthropicService } from '@/lib/services/AnthropicService';
import { CLAUDE_HAIKU_CURRENT } from '@/lib/constants/claude-models';
import { getCheckInSystemPrompt, type CheckInPromptContext } from '@/lib/prompts/checkInPrompts';
import { getTalentEnrichmentService } from '@/lib/services/TalentEnrichmentService';
import type { IntelligenceFile, InterviewMessage } from '@/types/talent';

export interface TalentChatParams {
  candidateId: string;
  candidateName: string;
  intelligenceFile: IntelligenceFile;
  conversationHistory: InterviewMessage[];
  userMessage: string;
  sessionType?: 'initial' | 'check_in' | 'deep_dive';
}

export interface TalentChatResponse {
  text: string;
  tokensUsed: number;
  sentiment?: 'excited' | 'exploring' | 'frustrated' | 'content';
  suggestedNextTopic?: string;
}

export interface TalentOpeningParams {
  candidateId: string;
  candidateName: string;
  intelligenceFile: IntelligenceFile;
  sessionType?: 'initial' | 'check_in' | 'deep_dive';
}

export interface TalentOpeningResponse {
  text: string;
  tokensUsed: number;
}

/**
 * Build the conversation history for Claude API format
 */
function buildConversationMessages(
  history: InterviewMessage[],
  userMessage: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // Add history
  for (const msg of history) {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    });
  }

  // Add current user message
  messages.push({
    role: 'user',
    content: userMessage,
  });

  return messages;
}

/**
 * Detect sentiment from conversation content
 */
function detectSentiment(
  response: string,
  userMessage: string
): 'excited' | 'exploring' | 'frustrated' | 'content' {
  const combined = `${userMessage} ${response}`.toLowerCase();

  // Excited indicators
  if (
    combined.includes('excited') ||
    combined.includes('love') ||
    combined.includes('amazing') ||
    combined.includes('can\'t wait') ||
    combined.includes('thrilled')
  ) {
    return 'excited';
  }

  // Frustrated indicators
  if (
    combined.includes('frustrated') ||
    combined.includes('stuck') ||
    combined.includes('annoyed') ||
    combined.includes('burned out') ||
    combined.includes('tired of')
  ) {
    return 'frustrated';
  }

  // Exploring indicators
  if (
    combined.includes('considering') ||
    combined.includes('thinking about') ||
    combined.includes('exploring') ||
    combined.includes('looking into') ||
    combined.includes('curious')
  ) {
    return 'exploring';
  }

  // Default to content
  return 'content';
}

/**
 * Generate a conversational response for talent check-in/interview
 */
export async function generateTalentChatResponse(
  params: TalentChatParams
): Promise<TalentChatResponse> {
  const {
    candidateName,
    intelligenceFile,
    conversationHistory,
    userMessage,
  } = params;

  try {
    // Calculate days since last contact
    const daysSinceLastContact = Math.floor(
      (Date.now() - new Date(intelligenceFile.last_contact).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Build context for system prompt
    const promptContext: CheckInPromptContext = {
      candidateName: candidateName.split(' ')[0], // First name
      lastSessionDate: intelligenceFile.last_contact,
      daysSinceLastContact,
      relationshipStrength: intelligenceFile.relationship_strength,
      intelligenceFile,
      sessionNumber: intelligenceFile.total_sessions + 1,
    };

    const systemPrompt = getCheckInSystemPrompt(promptContext);

    // Build conversation messages
    const messages = buildConversationMessages(conversationHistory, userMessage);

    // Call AnthropicService
    const response = await AnthropicService.generateConversation({
      messages,
      systemPrompt,
      model: CLAUDE_HAIKU_CURRENT, // Use Haiku for fast, cost-effective responses
      temperature: 0.7,
      maxTokens: 500, // Keep responses concise for check-ins
    });

    // Detect sentiment from the exchange
    const sentiment = detectSentiment(response.content, userMessage);

    return {
      text: response.content,
      tokensUsed: response.tokensUsed.total,
      sentiment,
    };
  } catch (error) {
    console.error('[TalentChatGenerator] Error generating response:', error);

    // Return a fallback response
    return {
      text: "That's really interesting! Tell me more about that.",
      tokensUsed: 0,
      sentiment: 'content',
    };
  }
}

/**
 * Generate an LLM-powered opening message for check-in
 * This replaces the static getCheckInOpeningMessage with a dynamic one
 * Now includes Human-OS enrichment for richer context
 */
export async function generateTalentOpening(
  params: TalentOpeningParams
): Promise<TalentOpeningResponse> {
  const {
    candidateName,
    intelligenceFile,
    sessionType = 'check_in',
  } = params;

  try {
    // Calculate days since last contact
    const daysSinceLastContact = Math.floor(
      (Date.now() - new Date(intelligenceFile.last_contact).getTime()) / (1000 * 60 * 60 * 24)
    );

    const firstName = candidateName.split(' ')[0];

    // Try to get Human-OS enrichment for additional context
    let enrichmentContext = '';
    try {
      const enrichmentService = getTalentEnrichmentService();
      if (enrichmentService.isAvailable()) {
        const enrichment = await enrichmentService.enrichCandidate({
          name: candidateName,
          company_name: intelligenceFile.company,
        });
        if (enrichment.insights?.length) {
          enrichmentContext = `\n\nEXTERNAL INSIGHTS (from LinkedIn/public data):\n- ${enrichment.insights.join('\n- ')}`;
        }
        if (enrichment.linkedin?.recent_posts?.length) {
          enrichmentContext += `\n- Recently posted on LinkedIn about: ${enrichment.linkedin.recent_posts[0]?.content?.substring(0, 100)}...`;
        }
      }
    } catch (err) {
      console.warn('[TalentChatGenerator] Human-OS enrichment failed:', err);
      // Continue without enrichment
    }

    // Build a focused system prompt for opening message
    const systemPrompt = `You are a warm, professional talent relationship manager greeting a returning candidate.

CANDIDATE CONTEXT:
- Name: ${firstName}
- Current Role: ${intelligenceFile.current_role} at ${intelligenceFile.company}
- Archetype: ${intelligenceFile.archetype}
- Relationship: ${intelligenceFile.relationship_strength} (${daysSinceLastContact} days since last contact)
- Sessions: ${intelligenceFile.total_sessions} previous conversations
- Seeking: ${intelligenceFile.current_motivation.seeking}
${intelligenceFile.life_context.family?.length ? `- Family: ${intelligenceFile.life_context.family.join(', ')}` : ''}

LAST SESSION CONTEXT:
${intelligenceFile.session_timeline.length > 0
  ? `- Key updates: ${intelligenceFile.session_timeline[intelligenceFile.session_timeline.length - 1]?.key_updates?.join(', ') || 'None recorded'}`
  : '- First recorded session'}
${enrichmentContext}

YOUR TASK:
Generate a warm, personalized opening message (2-3 sentences max) that:
1. Greets them by first name
2. References something specific from their last session or context
3. Opens the conversation naturally

Keep it brief and conversational - like catching up with a talented friend.`;

    const response = await AnthropicService.generateConversation({
      messages: [
        {
          role: 'user',
          content: `Generate an opening message for this ${sessionType} session.`,
        },
      ],
      systemPrompt,
      model: CLAUDE_HAIKU_CURRENT,
      temperature: 0.8, // Slightly higher for more natural variation
      maxTokens: 150,
    });

    return {
      text: response.content.trim(),
      tokensUsed: response.tokensUsed.total,
    };
  } catch (error) {
    console.error('[TalentChatGenerator] Error generating opening:', error);

    // Fall back to static opening
    const { getCheckInOpeningMessage } = await import('@/lib/prompts/checkInPrompts');
    const daysSinceLastContact = Math.floor(
      (Date.now() - new Date(intelligenceFile.last_contact).getTime()) / (1000 * 60 * 60 * 24)
    );

    const staticOpening = getCheckInOpeningMessage({
      candidateName: candidateName.split(' ')[0],
      lastSessionDate: intelligenceFile.last_contact,
      daysSinceLastContact,
      relationshipStrength: intelligenceFile.relationship_strength,
      intelligenceFile,
      sessionNumber: intelligenceFile.total_sessions + 1,
    });

    return {
      text: staticOpening,
      tokensUsed: 0,
    };
  }
}
