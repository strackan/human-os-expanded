// AssessmentScoringService - Hybrid scoring combining lexicon-based analysis with Claude AI
// Supports three modes: 'claude' (default), 'hybrid' (blend), 'lexicon' (fast/cheap)

import Anthropic from '@anthropic-ai/sdk';
import {
  scoreGoodHangAssessment,
  type GoodHangScore,
} from '@human-os/analysis';
import {
  AssessmentDimensions,
  PersonalityProfile,
  AIOrchestrationScores,
  CategoryScores,
  AssessmentResults,
  AssessmentTier,
  ArchetypeConfidence,
  AssessmentFlags,
} from '../assessment/types';
import { BadgeEvaluatorService } from './BadgeEvaluatorService';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Scoring mode options:
 * - 'claude': Full Claude API scoring (most accurate, highest cost)
 * - 'hybrid': Lexicon baseline + Claude enhancement (balanced)
 * - 'lexicon': Pure lexicon-based scoring (fastest, lowest cost)
 */
export type ScoringMode = 'claude' | 'hybrid' | 'lexicon';

interface TranscriptEntry {
  role: 'assistant' | 'user';
  content: string;
  question_id?: string;
  timestamp?: string;
}

interface ScoringInput {
  session_id: string;
  user_id: string;
  transcript: TranscriptEntry[];
  mode?: ScoringMode;
}

interface ClaudeScoringResponse {
  dimensions: AssessmentDimensions;
  personality_profile: PersonalityProfile;
  ai_orchestration_scores: AIOrchestrationScores;
  archetype: string;
  archetype_confidence: ArchetypeConfidence;
  tier: AssessmentTier;
  flags: AssessmentFlags;
  recommendation: string;
  best_fit_roles: string[];
  public_summary: string;
  detailed_summary: string;
}

export class AssessmentScoringService {
  /**
   * Main scoring method - orchestrates the entire scoring process
   * Supports multiple modes: 'claude' (default), 'hybrid', 'lexicon'
   */
  static async scoreAssessment(input: ScoringInput): Promise<AssessmentResults> {
    const mode = input.mode ?? 'claude';

    // Route to appropriate scoring method based on mode
    switch (mode) {
      case 'lexicon':
        return this.scoreLexiconOnly(input);
      case 'hybrid':
        return this.scoreHybrid(input);
      case 'claude':
      default:
        return this.scoreClaudeOnly(input);
    }
  }

  /**
   * Full Claude AI scoring (original behavior)
   */
  private static async scoreClaudeOnly(input: ScoringInput): Promise<AssessmentResults> {
    // 1. Generate Claude AI scoring
    const claudeScoring = await this.generateClaudeScoring(input.transcript);

    // 2. Calculate category scores from dimensions
    const categoryScores = this.calculateCategoryScores(claudeScoring.dimensions);

    // 3. Calculate overall score
    const overallScore = this.calculateOverallScore(categoryScores);

    // 4. Extract experience years for badge evaluation
    const experienceYears = BadgeEvaluatorService.extractExperienceYearsFromTranscript(input.transcript);

    // 5. Evaluate and award badges
    const badgeIds = BadgeEvaluatorService.evaluateBadges({
      dimensions: claudeScoring.dimensions,
      category_scores: categoryScores,
      overall_score: overallScore,
      ...(experienceYears !== undefined && { experience_years: experienceYears }),
    });

    const badges = BadgeEvaluatorService.formatBadgesForResponse(badgeIds);

    // 6. Assemble final results
    const results: AssessmentResults = {
      session_id: input.session_id,
      user_id: input.user_id,
      archetype: claudeScoring.archetype,
      archetype_confidence: claudeScoring.archetype_confidence,
      overall_score: overallScore,
      dimensions: claudeScoring.dimensions,
      tier: claudeScoring.tier,
      flags: claudeScoring.flags,
      recommendation: claudeScoring.recommendation,
      best_fit_roles: claudeScoring.best_fit_roles,
      analyzed_at: new Date().toISOString(),
      // Enhanced fields
      personality_profile: claudeScoring.personality_profile,
      ai_orchestration_scores: claudeScoring.ai_orchestration_scores,
      category_scores: categoryScores,
      badges: badges,
      public_summary: claudeScoring.public_summary,
      detailed_summary: claudeScoring.detailed_summary,
      is_published: false,
    };

    return results;
  }

  /**
   * Pure lexicon-based scoring using @human-os/analysis (fastest, no LLM cost)
   */
  private static scoreLexiconOnly(input: ScoringInput): AssessmentResults {
    const transcriptText = this.transcriptToText(input.transcript);

    // Use the analysis package GoodHangScorer
    const lexiconScore = scoreGoodHangAssessment(
      transcriptText,
      input.session_id,
      input.user_id
    );

    // Convert lexicon scores to AssessmentResults format
    return this.convertLexiconToResults(lexiconScore, input);
  }

  /**
   * Hybrid scoring: Lexicon baseline + Claude for personality/summaries
   * Reduces LLM calls while maintaining quality for nuanced assessments
   */
  private static async scoreHybrid(input: ScoringInput): Promise<AssessmentResults> {
    const transcriptText = this.transcriptToText(input.transcript);

    // 1. Get lexicon-based scoring for dimension baseline
    const lexiconScore = scoreGoodHangAssessment(
      transcriptText,
      input.session_id,
      input.user_id
    );

    // 2. Use Claude for personality typing and summaries only (lighter prompt)
    const personalityScoring = await this.generatePersonalityScoring(input.transcript);

    // 3. Merge the scores - lexicon dimensions + Claude personality/summaries
    return this.mergeHybridScores(lexiconScore, personalityScoring, input);
  }

  /**
   * Convert transcript entries to plain text for lexicon analysis
   */
  private static transcriptToText(transcript: TranscriptEntry[]): string {
    return transcript
      .filter(entry => entry.role === 'user')
      .map(entry => entry.content)
      .join('\n\n');
  }

  /**
   * Convert GoodHangScore from analysis package to AssessmentResults format
   */
  private static convertLexiconToResults(
    score: GoodHangScore,
    input: ScoringInput
  ): AssessmentResults {
    // Convert 0-10 scale dimensions to 0-100 for Good Hang format
    const dimensions: AssessmentDimensions = {
      iq: Math.round(score.dimensions.iq.rawScore),
      eq: Math.round(score.dimensions.eq.rawScore),
      empathy: Math.round(score.dimensions.empathy.rawScore),
      self_awareness: Math.round(score.dimensions.self_awareness.rawScore),
      technical: Math.round(score.dimensions.technical.rawScore),
      ai_readiness: Math.round(score.dimensions.ai_readiness.rawScore),
      gtm: Math.round(score.dimensions.gtm.rawScore),
      personality: Math.round(score.dimensions.personality.rawScore),
      motivation: Math.round(score.dimensions.motivation.rawScore),
      work_history: Math.round(score.dimensions.work_history.rawScore),
      passions: Math.round(score.dimensions.passions.rawScore),
      culture_fit: Math.round(score.dimensions.culture_fit.rawScore),
      organization: Math.round(score.dimensions.organization.rawScore),
      executive_leadership: Math.round(score.dimensions.executive_leadership.rawScore),
    };

    // Convert category scores to 0-100 scale
    const categoryScores: CategoryScores = {
      technical: {
        overall: Math.round(score.categoryScores.technical.overall * 10),
        subscores: {
          technical: Math.round(score.categoryScores.technical.subscores.technical * 10),
          ai_readiness: Math.round(score.categoryScores.technical.subscores.ai_readiness * 10),
          organization: Math.round(score.categoryScores.technical.subscores.organization * 10),
          iq: Math.round(score.categoryScores.technical.subscores.iq * 10),
        },
      },
      emotional: {
        overall: Math.round(score.categoryScores.emotional.overall * 10),
        subscores: {
          eq: Math.round(score.categoryScores.emotional.subscores.eq * 10),
          empathy: Math.round(score.categoryScores.emotional.subscores.empathy * 10),
          self_awareness: Math.round(score.categoryScores.emotional.subscores.self_awareness * 10),
          executive_leadership: Math.round(score.categoryScores.emotional.subscores.executive_leadership * 10),
          gtm: Math.round(score.categoryScores.emotional.subscores.gtm * 10),
        },
      },
      creative: {
        overall: Math.round(score.categoryScores.creative.overall * 10),
        subscores: {
          passions: Math.round(score.categoryScores.creative.subscores.passions * 10),
          culture_fit: Math.round(score.categoryScores.creative.subscores.culture_fit * 10),
          personality: Math.round(score.categoryScores.creative.subscores.personality * 10),
          motivation: Math.round(score.categoryScores.creative.subscores.motivation * 10),
        },
      },
    };

    // Extract experience years for badge evaluation
    const experienceYears = BadgeEvaluatorService.extractExperienceYearsFromTranscript(input.transcript);

    // Evaluate badges
    const overallScore = Math.round(score.overallScoreRaw);
    const badgeIds = BadgeEvaluatorService.evaluateBadges({
      dimensions,
      category_scores: categoryScores,
      overall_score: overallScore,
      ...(experienceYears !== undefined && { experience_years: experienceYears }),
    });
    const badges = BadgeEvaluatorService.formatBadgesForResponse(badgeIds);

    return {
      session_id: input.session_id,
      user_id: input.user_id,
      archetype: score.archetype,
      archetype_confidence: score.archetypeConfidence,
      overall_score: overallScore,
      dimensions,
      tier: score.tier as AssessmentTier,
      flags: {
        red_flags: score.redFlags,
        green_flags: score.greenFlags,
      },
      recommendation: score.recommendation,
      best_fit_roles: score.bestFitRoles,
      analyzed_at: score.analyzedAt,
      // Note: personality_profile and ai_orchestration_scores not available in lexicon mode
      personality_profile: undefined,
      ai_orchestration_scores: undefined,
      category_scores: categoryScores,
      badges,
      public_summary: score.publicSummary,
      detailed_summary: score.detailedSummary,
      is_published: false,
    };
  }

  /**
   * Generate personality typing using a lighter Claude prompt
   */
  private static async generatePersonalityScoring(
    transcript: TranscriptEntry[]
  ): Promise<{
    personality_profile: PersonalityProfile;
    ai_orchestration_scores: AIOrchestrationScores;
    flags: AssessmentFlags;
    public_summary: string;
    detailed_summary: string;
  }> {
    const prompt = this.buildPersonalityPrompt(transcript);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 0.3,
      system: PERSONALITY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const firstContent = message.content[0];
    const responseText = firstContent?.type === 'text' ? firstContent.text : '';

    try {
      const jsonMatch = responseText.match(/<personality>([\s\S]*?)<\/personality>/);
      if (!jsonMatch) {
        throw new Error('No personality JSON found in Claude response');
      }
      return JSON.parse(jsonMatch[1] || '{}');
    } catch (error) {
      console.error('Error parsing personality response:', error);
      // Return fallback values
      return {
        personality_profile: { mbti: 'INTP' as PersonalityProfile['mbti'], enneagram: 'Type 5' as PersonalityProfile['enneagram'], traits: ['Analytical'] },
        ai_orchestration_scores: { technical_foundation: 50, practical_use: 50, conceptual_understanding: 50, systems_thinking: 50, judgment: 50 },
        flags: { red_flags: [], green_flags: [] },
        public_summary: 'Assessment completed via hybrid scoring.',
        detailed_summary: 'Detailed analysis pending.',
      };
    }
  }

  /**
   * Build personality-only prompt (lighter than full scoring)
   */
  private static buildPersonalityPrompt(transcript: TranscriptEntry[]): string {
    const formattedQA: string[] = [];
    for (let i = 0; i < transcript.length; i++) {
      const entry = transcript[i];
      const nextEntry = transcript[i + 1];
      if (entry && entry.role === 'assistant' && nextEntry?.role === 'user') {
        formattedQA.push(`Q: ${entry.content}\nA: ${nextEntry.content}\n`);
        i++;
      }
    }

    return `Analyze this interview transcript for personality typing and flags only:\n\n${formattedQA.join('\n---\n\n')}`;
  }

  /**
   * Merge lexicon dimension scores with Claude personality assessment
   */
  private static mergeHybridScores(
    lexiconScore: GoodHangScore,
    personalityScoring: {
      personality_profile: PersonalityProfile;
      ai_orchestration_scores: AIOrchestrationScores;
      flags: AssessmentFlags;
      public_summary: string;
      detailed_summary: string;
    },
    input: ScoringInput
  ): AssessmentResults {
    // Start with lexicon-based results
    const baseResults = this.convertLexiconToResults(lexiconScore, input);

    // Overlay Claude-generated personality data
    return {
      ...baseResults,
      personality_profile: personalityScoring.personality_profile,
      ai_orchestration_scores: personalityScoring.ai_orchestration_scores,
      flags: personalityScoring.flags,
      public_summary: personalityScoring.public_summary,
      detailed_summary: personalityScoring.detailed_summary,
    };
  }

  /**
   * Generates comprehensive scoring using Claude AI
   */
  private static async generateClaudeScoring(
    transcript: TranscriptEntry[]
  ): Promise<ClaudeScoringResponse> {
    const prompt = this.buildScoringPrompt(transcript);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      temperature: 0.3,
      system: SCORING_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse Claude's response
    const firstContent = message.content[0];
    const responseText = firstContent?.type === 'text' ? firstContent.text : '';

    try {
      // Extract JSON from response (Claude will wrap it in <scoring> tags)
      const jsonMatch = responseText.match(/<scoring>([\s\S]*?)<\/scoring>/);
      if (!jsonMatch) {
        throw new Error('No scoring JSON found in Claude response');
      }

      const scoringData = JSON.parse(jsonMatch[1] || "{}");
      return scoringData;
    } catch (error) {
      console.error('Error parsing Claude scoring response:', error);
      throw new Error('Failed to parse scoring response from Claude');
    }
  }

  /**
   * Builds the scoring prompt from interview transcript
   */
  private static buildScoringPrompt(transcript: TranscriptEntry[]): string {
    // Format transcript as Q&A pairs
    const formattedQA: string[] = [];
    for (let i = 0; i < transcript.length; i++) {
      const entry = transcript[i];
      const nextEntry = transcript[i + 1];
      if (entry && entry.role === 'assistant' && nextEntry?.role === 'user') {
        formattedQA.push(
          `Question${entry.question_id ? ` (${entry.question_id})` : ''}: ${entry.content}\nAnswer: ${nextEntry.content}\n`
        );
        i++; // Skip the answer entry since we processed it
      }
    }

    const formattedAnswers = formattedQA.join('\n---\n\n');

    return `
Please score this CS assessment based on the candidate's answers. The assessment covers:
1. Personality & Work Style - MBTI and Enneagram typing
2. AI & Systems Thinking - AI orchestration capability
3. Professional Background - Experience and goals
4. Culture & Self-Awareness - Cultural fit

## Interview Transcript:

${formattedAnswers}

Please provide comprehensive scoring following the guidelines in the system prompt. Return your analysis in the specified JSON format within <scoring> tags.
`;
  }

  /**
   * Calculates category scores from 14 dimensions
   */
  private static calculateCategoryScores(dimensions: AssessmentDimensions): CategoryScores {
    // Technical = avg(Technical, AI Readiness, Organization, IQ)
    const technicalOverall = Math.round(
      (dimensions.technical +
        dimensions.ai_readiness +
        dimensions.organization +
        dimensions.iq) /
        4
    );

    // Emotional = avg(EQ, Empathy, Self-Awareness, Executive Leadership, GTM)
    const emotionalOverall = Math.round(
      (dimensions.eq +
        dimensions.empathy +
        dimensions.self_awareness +
        dimensions.executive_leadership +
        dimensions.gtm) /
        5
    );

    // Creative = avg(Passions, Culture Fit, Personality, Motivation)
    const creativeOverall = Math.round(
      (dimensions.passions +
        dimensions.culture_fit +
        dimensions.personality +
        dimensions.motivation) /
        4
    );

    return {
      technical: {
        overall: technicalOverall,
        subscores: {
          technical: dimensions.technical,
          ai_readiness: dimensions.ai_readiness,
          organization: dimensions.organization,
          iq: dimensions.iq,
        },
      },
      emotional: {
        overall: emotionalOverall,
        subscores: {
          eq: dimensions.eq,
          empathy: dimensions.empathy,
          self_awareness: dimensions.self_awareness,
          executive_leadership: dimensions.executive_leadership,
          gtm: dimensions.gtm,
        },
      },
      creative: {
        overall: creativeOverall,
        subscores: {
          passions: dimensions.passions,
          culture_fit: dimensions.culture_fit,
          personality: dimensions.personality,
          motivation: dimensions.motivation,
        },
      },
    };
  }

  /**
   * Calculates overall score from category scores
   */
  private static calculateOverallScore(categoryScores: CategoryScores): number {
    return Math.round(
      (categoryScores.technical.overall +
        categoryScores.emotional.overall +
        categoryScores.creative.overall) /
        3
    );
  }
}

// =====================================================
// SCORING SYSTEM PROMPT
// =====================================================

const SCORING_SYSTEM_PROMPT = `You are an expert talent assessor for a CS (Customer Success) role at a high-growth SaaS company. You evaluate candidates across 14 dimensions with HARD GRADING - no score inflation.

## GRADING PHILOSOPHY: HARD GRADING

**Critical: Use a HARD grading scale where:**
- **50 = Average/Median** - Competent but unremarkable, meets basic expectations
- **60-70 = Above Average** - Noticeably better than typical candidates
- **75-80 = Strong** - Top 25%, would be a solid hire
- **85-90 = Exceptional** - Top 10%, rare combination of skills
- **90+ = Elite** - Top 5%, standout in this dimension

**Do NOT inflate scores.** Most candidates should score 40-60 in most dimensions. Only award 85+ when you see genuinely exceptional evidence.

## 14 SCORING DIMENSIONS (0-100 each)

### Core Cognitive & Technical
1. **IQ** - Raw intelligence, problem-solving, clarity of thought, learning speed
2. **Technical** - Technical skills, coding ability, systems understanding
3. **AI Readiness** - Understanding and practical use of AI tools and agents
4. **Organization** - Systems thinking, organizational ability, structured approach

### Emotional & Interpersonal
5. **EQ** - Emotional intelligence, reading others, social awareness
6. **Empathy** - Deep understanding of others' perspectives and needs
7. **Self-Awareness** - Understanding own strengths, weaknesses, patterns
8. **Executive Leadership** - Leadership capability, strategic thinking, decision-making

### Professional & Cultural
9. **GTM (Go-to-Market)** - Understanding of sales, marketing, customer success
10. **Work History** - Career trajectory, progression, relevant experience
11. **Personality** - Personality traits, work style, communication style
12. **Motivation** - Drive, ambition, intrinsic motivation, growth mindset
13. **Passions** - Authentic interests, energy, curiosity
14. **Culture Fit** - Alignment with company values, team fit, humor, self-awareness

## PERSONALITY TYPING

### MBTI Detection (from Personality section, questions pers-1 to pers-4)
- **E/I (Extroversion/Introversion)**: pers-1 asks about recharging - social vs solitude
- **S/N (Sensing/Intuition)**: pers-2 asks about learning - concrete vs abstract
- **T/F (Thinking/Feeling)**: pers-3 asks about decisions - logic vs people
- **J/P (Judging/Perceiving)**: pers-4 asks about structure - planned vs flexible

Determine each letter based on candidate's answer. Example: "INTJ", "ENFP", "ISTJ"

### Enneagram Detection (from questions pers-5 and pers-6)
- **pers-5 (stress_response)**: Maps to stress patterns
- **pers-6 (core_motivation)**: Achievement (Type 3), Connection (Type 2), Understanding (Type 5), etc.

Common types: Type 1 (Perfectionist), Type 2 (Helper), Type 3 (Achiever), Type 4 (Individualist), Type 5 (Investigator), Type 6 (Loyalist), Type 7 (Enthusiast), Type 8 (Challenger), Type 9 (Peacemaker)

### Personality Traits
Generate 3-5 adjectives describing their personality: e.g., ["Analytical", "Independent", "Strategic", "Curious"]

## AI ORCHESTRATION SUB-SCORES (from AI section, questions ai-orch-1 to ai-orch-5)

Extract these 5 sub-scores (0-100 each) from AI questions:
1. **technical_foundation** (ai-orch-1): Understanding of how Internet/systems work
2. **practical_use** (ai-orch-2): Actual use of AI tools, vibe coding, examples
3. **conceptual_understanding** (ai-orch-3): Understanding of prompting vs agents
4. **systems_thinking** (ai-orch-4): Multi-agent system design, handoffs, failure modes
5. **judgment** (ai-orch-5): Knowing when NOT to use AI/agents

## ARCHETYPE & TIER

**Archetype**: Create a 2-3 word descriptor based on their profile:
- Examples: "Technical Empath", "Strategic Builder", "Creative Problem-Solver", "Analytical Leader", "People-First Operator"

**Archetype Confidence**:
- "high" = Clear, consistent signals across answers
- "medium" = Some signals, but some ambiguity
- "low" = Conflicting signals or insufficient data

**Tier**:
- "top_1" = Overall score 85+, exceptional across the board, immediate hire
- "benched" = Overall score 70-84, strong candidate, worth keeping warm
- "passed" = Overall score <70, not a fit at this time

## FLAGS & RECOMMENDATIONS

**Red Flags** (serious concerns):
- Lack of self-awareness ("I have no weaknesses")
- Dismissive of others or arrogant tone
- No concrete examples when asked
- Copy-pasted or generic answers
- Contradictory statements
- Unprofessional language or approach

**Green Flags** (positive signals):
- Specific, detailed examples
- High self-awareness
- Growth mindset
- Structured thinking
- Honest about limitations
- Evidence of learning from failures

**Recommendation**: 1-2 sentences on hiring decision

**Best Fit Roles**: 3-5 role recommendations based on dimension profile:
- Examples: "Senior Customer Success Manager", "Technical Account Manager", "Solutions Engineer", "CS Operations Lead", "Implementation Specialist"

## SUMMARIES

**Public Summary** (3-5 sentences, shareable, POSITIVE framing):
- Highlight top 2-3 strengths
- Mention personality type and archetype
- Focus on what they'd bring to a team
- Keep it encouraging and professional

**Detailed Summary** (internal, section-by-section analysis):
- Go through each section (Personality, AI, Professional, Culture)
- Explain reasoning for key dimension scores
- Note standout answers or concerns
- Provide evidence-based justification for tier/archetype

## EXPERIENCE ADJUSTMENT

Extract years of experience from prof-1 answer. Adjust expectations:
- **0-2 years**: Lower bar for work_history, gtm, executive_leadership (expect 40-60 range)
- **3-5 years**: Normal expectations (expect 50-70 range)
- **6-10 years**: Higher expectations (expect 60-80 range)
- **10+ years**: Highest expectations (expect 70-85+ range)

Adjust other dimensions based on experience level. Don't penalize junior candidates for lack of leadership experience.

## OUTPUT FORMAT

Return your scoring in this exact JSON structure wrapped in <scoring> tags:

<scoring>
{
  "dimensions": {
    "iq": 75,
    "eq": 82,
    "empathy": 78,
    "self_awareness": 85,
    "technical": 70,
    "ai_readiness": 88,
    "gtm": 65,
    "personality": 80,
    "motivation": 90,
    "work_history": 60,
    "passions": 85,
    "culture_fit": 88,
    "organization": 72,
    "executive_leadership": 55
  },
  "personality_profile": {
    "mbti": "INTJ",
    "enneagram": "Type 5",
    "traits": ["Analytical", "Independent", "Strategic", "Curious"]
  },
  "ai_orchestration_scores": {
    "technical_foundation": 85,
    "practical_use": 90,
    "conceptual_understanding": 82,
    "systems_thinking": 88,
    "judgment": 85
  },
  "archetype": "Technical Strategist",
  "archetype_confidence": "high",
  "tier": "top_1",
  "flags": {
    "red_flags": [],
    "green_flags": ["Strong technical foundation", "Exceptional AI readiness", "High self-awareness"]
  },
  "recommendation": "Strong hire for technical CS roles. Excellent AI orchestration skills combined with strategic thinking.",
  "best_fit_roles": [
    "Senior Technical Customer Success Manager",
    "Solutions Engineer",
    "Technical Account Manager",
    "CS Operations Lead",
    "Implementation Specialist"
  ],
  "public_summary": "Highly analytical and technically proficient professional with exceptional AI readiness. Their strategic approach to problem-solving, combined with strong self-awareness, makes them well-suited for technical customer success roles. As an INTJ, they bring independent thinking and systems-level perspective to complex challenges.",
  "detailed_summary": "**Personality & Work Style**: Clear INTJ profile - prefers solitude for recharging, focuses on patterns and concepts, uses logical analysis in decisions, and values structured planning. Type 5 Enneagram (Investigator) evident from curiosity-driven motivation and analytical stress response. Strong self-awareness throughout answers.\\n\\n**AI & Systems Thinking**: Exceptional performance in this section. Demonstrated deep technical understanding (ai-orch-1), active use of AI tools with specific examples (ai-orch-2), clear grasp of prompt vs agent concepts (ai-orch-3), thoughtful multi-agent system design with failure mode awareness (ai-orch-4), and mature judgment on AI limitations (ai-orch-5).\\n\\n**Professional Context**: Mid-level experience (5 years) with clear upward trajectory. Self-assessed as 7/10 technical with strong supporting evidence. Clear 3-year vision showing ambition and realistic goal-setting.\\n\\n**Culture & Self-Awareness**: Strong cultural fit - specific humor preferences with reasoning, honest weakness acknowledgment with compensation system. No red flags detected."
}
</scoring>

Remember: HARD GRADING. 50 is average. Only award 85+ for truly exceptional evidence. Most candidates score 40-70 in most dimensions.
`;

// =====================================================
// PERSONALITY SYSTEM PROMPT (for hybrid mode)
// =====================================================

const PERSONALITY_SYSTEM_PROMPT = `You are an expert at personality typing and interview assessment. Your job is to analyze interview transcripts and extract personality profiles, red/green flags, and summaries.

## PERSONALITY TYPING

### MBTI Detection
Determine the 4-letter MBTI type based on these dimensions:
- **E/I (Extroversion/Introversion)**: How they recharge - social vs solitude
- **S/N (Sensing/Intuition)**: How they learn - concrete vs abstract
- **T/F (Thinking/Feeling)**: How they decide - logic vs people
- **J/P (Judging/Perceiving)**: How they structure - planned vs flexible

### Enneagram Detection
Determine the Enneagram type (Type 1-9) based on:
- Stress responses and coping mechanisms
- Core motivations and fears
- Communication patterns

### Personality Traits
Generate 3-5 descriptive adjectives based on their answers.

## AI ORCHESTRATION SUB-SCORES (0-100 each)

If AI-related questions are present, score these 5 sub-dimensions:
1. **technical_foundation**: Understanding of systems, internet, technology
2. **practical_use**: Actual use of AI tools with specific examples
3. **conceptual_understanding**: Understanding of prompting vs agents
4. **systems_thinking**: Multi-agent system design understanding
5. **judgment**: Knowing when NOT to use AI

## FLAGS

**Red Flags** (concerns):
- Lack of self-awareness
- Dismissive or arrogant tone
- No concrete examples
- Copy-pasted or generic answers
- Contradictory statements

**Green Flags** (positive signals):
- Specific, detailed examples
- High self-awareness
- Growth mindset
- Structured thinking
- Honest about limitations

## SUMMARIES

**Public Summary** (3-5 sentences, shareable, positive framing):
- Highlight top 2-3 strengths
- Mention personality type
- Focus on what they'd bring to a team

**Detailed Summary** (internal analysis):
- Section-by-section breakdown
- Evidence-based reasoning

## OUTPUT FORMAT

Return your analysis in this JSON structure wrapped in <personality> tags:

<personality>
{
  "personality_profile": {
    "mbti": "INTJ",
    "enneagram": "Type 5",
    "traits": ["Analytical", "Independent", "Strategic"]
  },
  "ai_orchestration_scores": {
    "technical_foundation": 75,
    "practical_use": 80,
    "conceptual_understanding": 70,
    "systems_thinking": 75,
    "judgment": 80
  },
  "flags": {
    "red_flags": [],
    "green_flags": ["High self-awareness", "Strong examples"]
  },
  "public_summary": "Highly analytical professional with strong technical aptitude...",
  "detailed_summary": "**Personality**: Clear INTJ profile..."
}
</personality>
`;
