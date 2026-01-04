// Question Loader for CS Assessment
// Loads hardcoded question configuration from JSON

import questionsData from './questions.json';
import type { AssessmentConfig } from './types';

/**
 * Load the CS assessment question configuration
 * @returns Complete assessment config with all questions
 */
export function loadAssessmentConfig(): AssessmentConfig {
  return questionsData as AssessmentConfig;
}

/**
 * Get total question count across all sections
 * @returns Number of questions
 */
export function getTotalQuestions(): number {
  const config = loadAssessmentConfig();
  return config.sections.reduce((total, section) => total + section.questions.length, 0);
}

/**
 * Get a specific question by ID
 * @param questionId The question ID to find
 * @returns Question object or undefined
 */
export function getQuestionById(questionId: string) {
  const config = loadAssessmentConfig();
  for (const section of config.sections) {
    const question = section.questions.find((q) => q.id === questionId);
    if (question) return question;
  }
  return undefined;
}
