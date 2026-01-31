// AssessmentScoringService - Claude AI-powered scoring with D&D character generation
// Good Hang V2 - Personality assessment with 6 attributes

import Anthropic from '@anthropic-ai/sdk';
import {
  PersonalityAssessmentResults,
  Attributes,
  CharacterProfile,
  AssessmentSignals,
  MatchingProfile,
  QuestionScore,
  AlignmentScores,
  SocialEnergy,
  RelationshipStyle,
  ConnectionStyle,
  EnergyPattern,
} from '../assessment/types';
import {
  determineAlignment,
  determineRace,
  determineClass,
  applyRaceModifiers,
  generateTagline,
} from '../assessment/character-rules';
import { buildScoringPrompt, parseAssessmentResponse } from '../assessment/scoring-prompt';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface TranscriptEntry {
  role: 'assistant' | 'user';
  content: string;
  question_id?: string;
  timestamp?: string;
}

interface ScoringInput {
  mode?: 'claude' | 'hybrid' | 'lexicon';
  session_id: string;
  user_id: string;
  transcript: TranscriptEntry[];
}

interface ClaudeScoringResponse {
  question_scores: Record<string, {
    score: number;
    attribute_signals: Partial<Record<keyof Attributes, number>>;
    alignment_signal: {
      axis: 'order' | 'moral';
      direction: string;
      strength: number;
    } | null;
    extracted_interests: string[];
    notes: string;
  }>;
  attributes: Attributes;
  alignment_scores: AlignmentScores;
  signals: {
    enneagram_hint?: string;
    interest_vectors: string[];
    social_energy: string;
    relationship_style: string;
  };
  matching: {
    ideal_group_size: string;
    connection_style: string;
    energy_pattern: string;
    good_match_with: string[];
    avoid_match_with: string[];
  };
  tagline_elements: {
    core_trait: string;
    social_style: string;
    passion: string;
  };
}

export class AssessmentScoringService {
  /**
   * Main scoring method - orchestrates the entire scoring process
   */
  static async scoreAssessment(input: ScoringInput): Promise<PersonalityAssessmentResults> {
    // 1. Generate Claude AI scoring
    const claudeScoring = await this.generateClaudeScoring(input.transcript);

    // 2. Determine alignment from accumulated signals
    const alignment = determineAlignment(claudeScoring.alignment_scores);

    // 3. Determine race based on attribute pattern
    const { race, modifiers } = determineRace(claudeScoring.attributes);

    // 4. Apply race modifiers to get final attributes
    const finalAttributes = applyRaceModifiers(claudeScoring.attributes, modifiers);

    // 5. Determine class based on alignment and attributes
    const characterClass = determineClass(alignment, finalAttributes);

    // 6. Generate tagline
    const tagline = generateTagline(
      characterClass,
      race,
      finalAttributes,
      claudeScoring.signals.interest_vectors
    );

    // 7. Build character profile
    const profile: CharacterProfile = {
      tagline,
      alignment,
      race,
      class: characterClass,
    };

    // 8. Map signals to typed values
    const signals: AssessmentSignals = {
      enneagram_hint: claudeScoring.signals.enneagram_hint,
      interest_vectors: claudeScoring.signals.interest_vectors,
      social_energy: this.mapSocialEnergy(claudeScoring.signals.social_energy),
      relationship_style: this.mapRelationshipStyle(claudeScoring.signals.relationship_style),
    };

    // 9. Map matching to typed values
    const matching: MatchingProfile = {
      ideal_group_size: claudeScoring.matching.ideal_group_size,
      connection_style: this.mapConnectionStyle(claudeScoring.matching.connection_style),
      energy_pattern: this.mapEnergyPattern(claudeScoring.matching.energy_pattern),
      good_match_with: claudeScoring.matching.good_match_with,
      avoid_match_with: claudeScoring.matching.avoid_match_with,
    };

    // 10. Convert question scores
    const questionScores: Record<string, QuestionScore> = {};
    for (const [questionId, score] of Object.entries(claudeScoring.question_scores)) {
      questionScores[questionId] = {
        question_id: questionId,
        score: score.score,
        attribute_signals: score.attribute_signals as Partial<Record<keyof Attributes, number>>,
        alignment_signal: score.alignment_signal ? {
          axis: score.alignment_signal.axis,
          direction: score.alignment_signal.direction as 'Lawful' | 'Neutral' | 'Chaotic' | 'Good' | 'Evil',
          strength: score.alignment_signal.strength,
        } : undefined,
        extracted_interests: score.extracted_interests,
        notes: score.notes,
      };
    }

    // 11. Calculate overall score (average of all question scores)
    const scores = Object.values(claudeScoring.question_scores).map(q => q.score);
    const overallScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) // Scale to 0-100
      : 0;

    // 12. Generate personality summary
    const summary = await this.generatePersonalitySummary({
      profile,
      attributes: finalAttributes,
      signals,
      matching,
      transcript: input.transcript,
    });

    // 13. Assemble final results
    const results: PersonalityAssessmentResults = {
      session_id: input.session_id,
      user_id: input.user_id,
      profile,
      attributes: finalAttributes,
      signals,
      matching,
      question_scores: questionScores,
      overall_score: overallScore,
      summary,
      analyzed_at: new Date().toISOString(),
    };

    return results;
  }

  /**
   * Generates comprehensive scoring using Claude AI
   */
  private static async generateClaudeScoring(
    transcript: TranscriptEntry[]
  ): Promise<ClaudeScoringResponse> {
    const prompt = buildScoringPrompt(transcript);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      temperature: 0.3,
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
      const scoringData = parseAssessmentResponse(responseText) as unknown as ClaudeScoringResponse;

      // Validate required fields
      if (!scoringData.attributes || !scoringData.question_scores) {
        throw new Error('Missing required fields in scoring response');
      }

      // Ensure all attributes exist with defaults
      const defaultAttributes: Attributes = {
        INT: 5, WIS: 5, CHA: 5, CON: 5, STR: 5, DEX: 5
      };
      scoringData.attributes = { ...defaultAttributes, ...scoringData.attributes };

      // Ensure alignment scores exist with defaults
      const defaultAlignmentScores: AlignmentScores = {
        order: { lawful: 0, neutral: 0, chaotic: 0 },
        moral: { good: 0, neutral: 0, evil: 0 }
      };
      scoringData.alignment_scores = {
        order: { ...defaultAlignmentScores.order, ...scoringData.alignment_scores?.order },
        moral: { ...defaultAlignmentScores.moral, ...scoringData.alignment_scores?.moral }
      };

      return scoringData;
    } catch (error) {
      console.error('Error parsing Claude scoring response:', error);
      console.error('Raw response:', responseText);
      throw new Error('Failed to parse scoring response from Claude');
    }
  }

  // Type mapping helpers
  private static mapSocialEnergy(value: string): SocialEnergy {
    const map: Record<string, SocialEnergy> = {
      'introvert': 'introvert',
      'extrovert': 'extrovert',
      'ambivert': 'ambivert',
      'selective_extrovert': 'selective_extrovert',
    };
    return map[value.toLowerCase()] || 'ambivert';
  }

  private static mapRelationshipStyle(value: string): RelationshipStyle {
    const map: Record<string, RelationshipStyle> = {
      'depth_seeking': 'depth_seeking',
      'breadth_seeking': 'breadth_seeking',
      'balanced': 'balanced',
      'experience_based': 'experience_based',
    };
    return map[value.toLowerCase()] || 'balanced';
  }

  private static mapConnectionStyle(value: string): ConnectionStyle {
    const map: Record<string, ConnectionStyle> = {
      'conversation_based': 'conversation_based',
      'experience_based': 'experience_based',
      'activity_based': 'activity_based',
      'intellectual': 'intellectual',
    };
    return map[value.toLowerCase()] || 'conversation_based';
  }

  private static mapEnergyPattern(value: string): EnergyPattern {
    const map: Record<string, EnergyPattern> = {
      'spontaneous': 'spontaneous',
      'planned': 'planned',
      'flexible': 'flexible',
      'routine_oriented': 'routine_oriented',
    };
    return map[value.toLowerCase()] || 'flexible';
  }

  /**
   * Generates a personality summary (300-500 words) based on assessment results
   */
  private static async generatePersonalitySummary(input: {
    profile: CharacterProfile;
    attributes: Attributes;
    signals: AssessmentSignals;
    matching: MatchingProfile;
    transcript: TranscriptEntry[];
  }): Promise<string> {
    const { profile, attributes, signals, matching, transcript } = input;

    // Build a prompt for Claude to generate the summary
    const prompt = `Based on the following personality assessment results, write a warm, insightful personality summary (300-500 words) in the style of an Enneagram or Myers-Briggs report. The summary should feel personal and validating while offering genuine insight into the person's character.

## D&D Character Profile
- Race: ${profile.race}
- Class: ${profile.class}
- Alignment: ${profile.alignment}
- Tagline: ${profile.tagline}

## Attributes (scale 1-10)
- Intelligence (INT): ${attributes.INT}
- Wisdom (WIS): ${attributes.WIS}
- Charisma (CHA): ${attributes.CHA}
- Constitution (CON): ${attributes.CON}
- Strength (STR): ${attributes.STR}
- Dexterity (DEX): ${attributes.DEX}

## Personality Signals
- Enneagram Hint: ${signals.enneagram_hint || 'Not determined'}
- Social Energy: ${signals.social_energy}
- Relationship Style: ${signals.relationship_style}
- Interest Areas: ${signals.interest_vectors.join(', ')}

## Social Matching Profile
- Ideal Group Size: ${matching.ideal_group_size}
- Connection Style: ${matching.connection_style}
- Energy Pattern: ${matching.energy_pattern}
- Best Matches: ${matching.good_match_with.join(', ')}
- Challenging Matches: ${matching.avoid_match_with.join(', ')}

## Sample Responses from Assessment
${transcript.filter(t => t.role === 'user').slice(0, 3).map(t => `"${t.content.substring(0, 200)}${t.content.length > 200 ? '...' : ''}"`).join('\n')}

Write the summary in second person ("You are..."). Focus on:
1. Core personality traits and what drives them
2. How they relate to others and form connections
3. Their strengths and natural gifts
4. Areas for growth (framed positively)
5. What environments and relationships help them thrive

Keep the tone warm, validating, and insightful - like a trusted friend who truly sees them. Do NOT use headers or bullet points - write flowing paragraphs. Do NOT mention D&D, the game mechanics, or that this is based on an assessment.

IMPORTANT: Never use em-dashes (—). Instead, use " -- " (space, dash, dash, space). For example: "you carry a beautiful paradox -- the ability to..."`;


    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      });

      const firstContent = message.content[0];
      return firstContent?.type === 'text' ? firstContent.text : '';
    } catch (error) {
      console.error('Error generating personality summary:', error);
      return '';
    }
  }
}
