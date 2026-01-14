/**
 * Questions API Client
 * Fetches questions from the unified question system and saves answers
 */

// Get API base URL from environment or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Question {
  id: string;
  slug: string;
  text: string;
  question_type: 'open' | 'choice' | 'binary' | 'scale';
  category: string;
  subcategory: string;
  description?: string;
  options?: string[];
  maps_to_output?: string;
  display_order: number;
}

export interface QuestionSet {
  id: string;
  slug: string;
  name: string;
  domain: string;
  target: string;
  description?: string;
}

export interface EntityAnswer {
  question_id: string;
  value_text?: string;
  value_choice?: string;
  value_numeric?: number;
  answered: boolean;
}

export interface QuestionsResponse {
  questions: Question[];
  answers?: Record<string, EntityAnswer>;
  metadata: {
    question_set?: QuestionSet;
    entity_slug?: string;
    unanswered_only?: boolean;
    total_questions: number;
  };
}

export interface AnswerRequest {
  entity_slug: string;
  question_slug: string;
  value_text?: string;
  value_choice?: string;
  value_numeric?: number;
  source?: string;
}

export interface AnswerResponse {
  success: boolean;
  answer_id: string;
  entity_slug: string;
  question_slug: string;
}

/**
 * Fetch questions for a question set
 * @param questionSetSlug - The slug of the question set (e.g., 'fos-question-e')
 * @param entitySlug - Optional entity slug to also fetch their answers
 * @param unansweredOnly - If true, only return unanswered questions for the entity
 */
export async function fetchQuestions(
  questionSetSlug: string,
  entitySlug?: string,
  unansweredOnly: boolean = false
): Promise<QuestionsResponse> {
  const params = new URLSearchParams();
  if (entitySlug) {
    params.set('entity', entitySlug);
  }
  if (unansweredOnly) {
    params.set('unanswered', 'true');
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/questions/${questionSetSlug}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Failed to fetch questions: ${response.status}`);
  }

  return response.json();
}

/**
 * Save an answer for an entity
 * @param answer - The answer to save
 */
export async function saveAnswer(answer: AnswerRequest): Promise<AnswerResponse> {
  const response = await fetch(`${API_BASE_URL}/api/questions/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(answer),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Failed to save answer: ${response.status}`);
  }

  return response.json();
}

/**
 * Group questions by subcategory for display as sections
 */
export function groupQuestionsBySubcategory(questions: Question[]): Map<string, Question[]> {
  const groups = new Map<string, Question[]>();

  for (const question of questions) {
    const key = question.subcategory || 'general';
    const existing = groups.get(key) || [];
    existing.push(question);
    groups.set(key, existing);
  }

  return groups;
}

// Section display names for Question E
export const SECTION_DISPLAY_NAMES: Record<string, { title: string; description: string }> = {
  'decision-making': {
    title: 'Decision-Making Under Stress',
    description: 'Understanding how you navigate tough choices',
  },
  'energy-cognitive': {
    title: 'Energy & Cognitive Patterns',
    description: 'Learning your rhythms and how you work best',
  },
  'communication': {
    title: 'Communication Preferences',
    description: 'How you like to work with others',
  },
  'crisis-recovery': {
    title: 'Crisis & Recovery',
    description: 'What helps and what to avoid when things get hard',
  },
  'work-style': {
    title: 'Work Style & Support',
    description: 'How to help you effectively',
  },
  'general': {
    title: 'General Questions',
    description: 'Additional questions about you',
  },
};
