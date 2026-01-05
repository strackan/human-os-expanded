/**
 * Pure utility functions for assessment scoring
 * Extracted from AssessmentScoringService for better testability and maintainability
 */

import {
  AssessmentDimensions,
  CategoryScores,
  ClaudeScoringResponse,
} from './validation';
import { ValidationError, ResponseParsingError } from './errors';

/**
 * Parses Claude's JSON response from the <scoring> tags
 *
 * @param responseText - Raw text response from Claude API
 * @returns Parsed scoring data object
 * @throws {ResponseParsingError} If response doesn't contain valid scoring JSON
 *
 * @example
 * const parsed = parseClaudeResponse(rawResponse);
 * // Returns: { dimensions: {...}, personality_profile: {...}, ... }
 */
export function parseClaudeResponse(responseText: string): ClaudeScoringResponse {
  try {
    // Extract JSON from response (Claude wraps it in <scoring> tags)
    const jsonMatch = responseText.match(/<scoring>([\s\S]*?)<\/scoring>/);

    if (!jsonMatch || !jsonMatch[1]) {
      throw new ResponseParsingError(
        'No scoring JSON found in Claude response',
        { responsePreview: responseText.substring(0, 200) }
      );
    }

    const scoringData = JSON.parse(jsonMatch[1]);
    return scoringData as ClaudeScoringResponse;
  } catch (error) {
    if (error instanceof ResponseParsingError) {
      throw error;
    }

    throw new ResponseParsingError(
      'Failed to parse scoring response from Claude',
      {
        originalError: error instanceof Error ? error.message : String(error),
        responsePreview: responseText.substring(0, 200),
      }
    );
  }
}

/**
 * Validates dimension scores to ensure they're within valid range (0-100)
 *
 * @param dimensions - All 14 dimension scores
 * @returns Validation result with isValid flag and any errors
 *
 * @example
 * const result = validateDimensionScores(dimensions);
 * if (!result.isValid) {
 *   console.error('Invalid dimensions:', result.errors);
 * }
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateDimensionScores(
  dimensions: AssessmentDimensions
): ValidationResult {
  const errors: string[] = [];

  // Check each dimension
  Object.entries(dimensions).forEach(([key, value]) => {
    if (typeof value !== 'number') {
      errors.push(`Dimension "${key}" must be a number, got ${typeof value}`);
    } else if (value < 0 || value > 100) {
      errors.push(`Dimension "${key}" must be between 0-100, got ${value}`);
    } else if (!Number.isInteger(value)) {
      errors.push(`Dimension "${key}" must be an integer, got ${value}`);
    }
  });

  // Check that all 14 dimensions are present
  const requiredDimensions = [
    'iq',
    'eq',
    'empathy',
    'self_awareness',
    'technical',
    'ai_readiness',
    'gtm',
    'personality',
    'motivation',
    'work_history',
    'passions',
    'culture_fit',
    'organization',
    'executive_leadership',
  ];

  requiredDimensions.forEach((dim) => {
    if (!(dim in dimensions)) {
      errors.push(`Missing required dimension: "${dim}"`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculates category scores from individual dimension scores
 * Uses weighted averages with category-based grouping
 *
 * @param dimensions - All 14 dimension scores (0-100)
 * @returns Category scores (technical, emotional, creative) with subscores
 * @throws {ValidationError} If dimension scores are invalid
 *
 * @example
 * const categories = calculateCategoryScores(dimensions);
 * // Returns: { technical: { overall: 75, subscores: {...} }, ... }
 */
export function calculateCategoryScores(
  dimensions: AssessmentDimensions
): CategoryScores {
  // Validate input
  const validation = validateDimensionScores(dimensions);
  if (!validation.isValid) {
    throw new ValidationError(
      'Invalid dimension scores for category calculation',
      { errors: validation.errors }
    );
  }

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
 * Calculates overall assessment score from category scores
 * Uses simple average of the three category overall scores
 *
 * @param categoryScores - Category scores (technical, emotional, creative)
 * @returns Overall score (0-100), adjusted for hard grading (avg ~50)
 * @throws {ValidationError} If category scores are out of range
 *
 * @example
 * const overall = calculateOverallScore(categoryScores);
 * // Returns: 68 (average of technical:72, emotional:65, creative:67)
 */
export function calculateOverallScore(categoryScores: CategoryScores): number {
  const { technical, emotional, creative } = categoryScores;

  // Validate category scores
  const scores = [technical.overall, emotional.overall, creative.overall];
  scores.forEach((score, index) => {
    const category = ['technical', 'emotional', 'creative'][index];
    if (score < 0 || score > 100) {
      throw new ValidationError(
        `Category score "${category}" out of range (0-100): ${score}`
      );
    }
  });

  // Simple average
  return Math.round((technical.overall + emotional.overall + creative.overall) / 3);
}

/**
 * Builds the scoring prompt with formatted candidate answers
 *
 * @param answers - Record of question IDs to answer objects
 * @returns Formatted prompt string for Claude API
 *
 * @example
 * const prompt = buildScoringPrompt(answers);
 * // Returns: "Please score this CS assessment...\n\nQuestion ID: pers-1\nAnswer: ..."
 */
export function buildScoringPrompt(
  answers: Record<string, { question_id: string; answer: string; answered_at: string }>
): string {
  const formattedAnswers = Object.entries(answers)
    .map(([questionId, data]) => {
      return `Question ID: ${questionId}\nAnswer: ${data.answer}\n`;
    })
    .join('\n---\n\n');

  return `
Please score this CS assessment based on the candidate's answers. The assessment has 20 questions across 4 sections:
1. Personality & Work Style (10 questions) - MBTI and Enneagram typing
2. AI & Systems Thinking (5 questions) - AI orchestration capability
3. Professional Background (3 questions) - Experience and goals
4. Culture & Self-Awareness (2 questions) - Cultural fit

## Candidate's Answers:

${formattedAnswers}

Please provide comprehensive scoring following the guidelines in the system prompt. Return your analysis in the specified JSON format within <scoring> tags.
`;
}

/**
 * Validates that all required questions have been answered
 *
 * @param answers - Record of question IDs to answer objects
 * @param requiredCount - Expected number of answers (default: 20)
 * @returns True if all required questions are answered
 *
 * @example
 * const isComplete = validateAnswersComplete(answers, 20);
 * if (!isComplete) throw new Error('Incomplete assessment');
 */
export function validateAnswersComplete(
  answers: Record<string, unknown>,
  requiredCount: number = 20
): boolean {
  return Object.keys(answers).length >= requiredCount;
}

/**
 * Sanitizes and truncates answer text to prevent extremely long responses
 *
 * @param answer - Raw answer text
 * @param maxLength - Maximum allowed length (default: 10000 characters)
 * @returns Sanitized and truncated answer
 *
 * @example
 * const clean = sanitizeAnswer(userInput, 10000);
 */
export function sanitizeAnswer(answer: string, maxLength: number = 10000): string {
  // Trim whitespace
  let cleaned = answer.trim();

  // Truncate if too long
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  return cleaned;
}

/**
 * Formats timestamp to ISO string, handling both Date objects and strings
 *
 * @param timestamp - Date object or ISO string
 * @returns ISO 8601 formatted timestamp string
 *
 * @example
 * const iso = formatTimestamp(new Date());
 * // Returns: "2025-01-15T10:30:00.000Z"
 */
export function formatTimestamp(timestamp: Date | string): string {
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }

  // Validate that string is a valid date
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    throw new ValidationError('Invalid timestamp format', { timestamp });
  }

  return date.toISOString();
}
