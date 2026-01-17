/**
 * Assessment Type Definitions
 *
 * Shared types for assessment components (GoodHang D&D and Work Style assessments).
 */

// =============================================================================
// QUESTION TYPES
// =============================================================================

/**
 * Base question interface
 */
export interface AssessmentQuestion {
  id: string;
  text: string;
  followUp?: string;
  /** For ranking questions only */
  isRanking?: boolean;
  /** Options for ranking questions */
  options?: string[];
}

/**
 * Section containing multiple questions
 */
export interface AssessmentSection {
  id: string;
  title: string;
  transitionMessage: string;
  questions: AssessmentQuestion[];
}

/**
 * Flattened question with section context for navigation
 */
export interface FlattenedQuestion extends AssessmentQuestion {
  sectionId: string;
  sectionTitle: string;
  sectionIndex: number;
  questionIndexInSection: number;
  transitionMessage?: string;
}

// =============================================================================
// PROGRESS & STATE
// =============================================================================

/**
 * Assessment progress stored in localStorage
 */
export interface AssessmentProgress {
  answers: Record<string, string>;
  currentIndex: number;
  updatedAt: string;
}

/**
 * Assessment configuration
 */
export interface AssessmentConfig {
  /** Storage key for localStorage persistence */
  storageKey: string;
  /** Sections with questions */
  sections: AssessmentSection[];
  /** Loading messages shown during completion */
  loadingMessages: string[];
  /** Theme color (purple for GoodHang, blue for work-style) */
  themeColor: 'purple' | 'blue';
  /** Title shown in header */
  title: string;
  /** Subtitle shown in header */
  subtitle?: string;
  /** Completion card title */
  completionTitle: string;
  /** Completion card description */
  completionDescription: string;
  /** Submit button text */
  submitButtonText: string;
}

// =============================================================================
// CALLBACKS
// =============================================================================

/**
 * Callback when assessment is completed
 */
export type OnCompleteCallback = (answers: Record<string, string>) => Promise<void>;

/**
 * Callback when user exits (with current progress)
 */
export type OnExitCallback = (answers: Record<string, string>, currentIndex: number) => void;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Flatten sections into a navigable question list
 */
export function flattenQuestions(sections: AssessmentSection[]): FlattenedQuestion[] {
  return sections.flatMap((section, sectionIndex) =>
    section.questions.map((q, questionIndex) => ({
      ...q,
      sectionId: section.id,
      sectionTitle: section.title,
      sectionIndex,
      questionIndexInSection: questionIndex,
      transitionMessage: questionIndex === 0 ? section.transitionMessage : undefined,
    }))
  );
}

/**
 * Check if all questions in a section are answered
 */
export function isSectionCompleted(
  section: AssessmentSection,
  answers: Record<string, string>
): boolean {
  return section.questions.every((q) => !!answers[q.id]);
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(
  answers: Record<string, string>,
  totalQuestions: number
): number {
  return (Object.keys(answers).length / totalQuestions) * 100;
}
