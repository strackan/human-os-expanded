/**
 * Question E Data File
 *
 * Contains the E01-E12 questions for personality baseline.
 * These questions fill gaps in identity and founder-os documentation to enable
 * effective support, not just content generation.
 *
 * Consolidated from original 24 questions by removing overlaps and converting
 * appropriate questions to multiple choice for faster completion.
 */

export interface QuestionEItem {
  id: string;
  section: QuestionESection;
  text: string;
  options?: string[]; // For multiple choice questions (Other is added automatically)
}

export type QuestionESection =
  | 'decision-making'
  | 'energy-cognitive'
  | 'communication'
  | 'crisis-recovery'
  | 'work-style';

export interface QuestionESectionMeta {
  id: QuestionESection;
  title: string;
  description: string;
  populatesFiles: string[];
}

/**
 * Question E Section Metadata
 * Maps sections to the Founder OS files they populate
 */
export const QUESTION_E_SECTIONS: QuestionESectionMeta[] = [
  {
    id: 'decision-making',
    title: 'Decision-Making',
    description: 'How you handle decisions and feeling overwhelmed',
    populatesFiles: ['DECISION_MAKING.md'],
  },
  {
    id: 'energy-cognitive',
    title: 'Energy & Focus',
    description: "When you're at your best and what drains you",
    populatesFiles: ['ENERGY_PATTERNS.md'],
  },
  {
    id: 'communication',
    title: 'Communication',
    description: 'How you prefer to receive input and feedback',
    populatesFiles: ['CONVERSATION_PROTOCOLS.md'],
  },
  {
    id: 'crisis-recovery',
    title: 'When Things Get Hard',
    description: "What helps when you're stuck and what makes it worse",
    populatesFiles: ['AVOIDANCE_PATTERNS.md', 'RECOVERY_PROTOCOLS.md'],
  },
  {
    id: 'work-style',
    title: 'Work Style',
    description: 'How you like to be helped and how you work best',
    populatesFiles: ['WORK_STYLE.md'],
  },
];

/**
 * Adds "Other" option to multiple choice questions automatically
 */
export function withOtherOption(options: string[]): string[] {
  return [...options, 'Other'];
}

/**
 * Full Question E Set (E01-E12)
 * Consolidated from original 24 questions
 */
export const QUESTION_E_SET: QuestionEItem[] = [
  // Section 1: Decision-Making (E01-E03)
  {
    id: 'E01',
    section: 'decision-making',
    text: 'When you have too many options, what do you usually do?',
    options: withOtherOption([
      'Narrow down quickly and decide',
      'Seek input from others',
      'Delay until it becomes clearer',
      'Get overwhelmed and avoid',
    ]),
  },
  {
    id: 'E02',
    section: 'decision-making',
    text: 'When helping you decide, I should:',
    options: withOtherOption([
      'Present options and let you choose',
      'Make a recommendation you can override',
      'Just make the call unless it\'s high-stakes',
      'Ask what level of support you want',
    ]),
  },
  {
    id: 'E03',
    section: 'decision-making',
    text: 'What does decision overwhelm look like for you? How does it start and what helps?',
    // Open-ended - combines old E01 (overwhelm signs) + E08 (overwhelm spiral)
  },

  // Section 2: Energy & Focus (E04-E05)
  {
    id: 'E04',
    section: 'energy-cognitive',
    text: 'When are you typically at your best?',
    options: withOtherOption([
      'Early morning',
      'Late morning / midday',
      'Afternoon',
      'Evening / night',
      'It varies a lot',
    ]),
  },
  {
    id: 'E05',
    section: 'energy-cognitive',
    text: 'What drains your energy faster than people might expect? What decisions or tasks wear you out?',
    // Open-ended - combines old E04 (drain/energize) + E06 (unexpected drains)
  },

  // Section 3: Communication (E06-E07)
  {
    id: 'E06',
    section: 'communication',
    text: 'When working together, I prefer:',
    options: withOtherOption([
      'Direct recommendations',
      'Questions to help me figure it out',
      'Just execute with minimal check-ins',
      'Depends on the task',
    ]),
  },
  {
    id: 'E07',
    section: 'communication',
    text: 'What kind of feedback helps vs. frustrates you? How should someone push back if they disagree?',
    // Open-ended - combines old E12 (helpful vs annoying) + E13 (push back)
  },

  // Section 4: When Things Get Hard (E08-E10)
  {
    id: 'E08',
    section: 'crisis-recovery',
    text: 'How do you know when you\'re stuck or avoiding something? What are the signs?',
    // Open-ended - combines old E07 (avoiding) + E15 (stuck)
  },
  {
    id: 'E09',
    section: 'crisis-recovery',
    text: 'What helps you get unstuck?',
    options: withOtherOption([
      'Talk it through with someone',
      'Take a break and come back fresh',
      'Break it into smaller pieces',
      'Switch to something else entirely',
      'A deadline or external pressure',
    ]),
  },
  {
    id: 'E10',
    section: 'crisis-recovery',
    text: 'When you\'re struggling, I should:',
    options: withOtherOption([
      'Give you space to work through it',
      'Help carry the load',
      'Provide distraction and normality',
      'Ask what you need',
    ]),
  },

  // Section 5: Work Style (E11-E12)
  {
    id: 'E11',
    section: 'work-style',
    text: 'How should priorities be presented to you?',
    options: withOtherOption([
      'Ranked list with clear order',
      'Top 1-2 only, hide the rest',
      'Visual overview of everything',
      'Let me discover organically',
    ]),
  },
  {
    id: 'E12',
    section: 'work-style',
    text: 'What\'s your relationship with deadlines?',
    options: withOtherOption([
      'Helpful pressure - I work better with them',
      'Stressful - I prefer soft targets',
      'Fine if I set them, stressful if others do',
      'I ignore them until the last minute',
    ]),
  },
];

/**
 * Gap Final Data structure from E_QUESTIONS_OUTSTANDING.json
 */
export interface GapFinalData {
  status: 'complete' | 'partial';
  entity_slug: string;
  session_id: string;
  outstanding_questions: string[]; // E01, E02, etc.
  questions_answered: number;
  questions_total: number;
}

/**
 * Mapping from old question IDs to new consolidated IDs
 * Used to translate GAP_ANALYSIS results to new question set
 */
export const QUESTION_ID_MIGRATION: Record<string, string | null> = {
  // Old ID -> New ID (null means removed/consolidated elsewhere)
  'E01': 'E03', // Old overwhelm signs -> new E03 (combined overwhelm)
  'E02': 'E01', // Old too many options -> new E01
  'E03': 'E02', // Old decision support -> new E02
  'E04': 'E05', // Old drain/energize -> new E05 (combined drains)
  'E05': 'E04', // Old peak time -> new E04
  'E06': 'E05', // Old unexpected drains -> new E05 (combined)
  'E07': 'E08', // Old avoiding -> new E08 (combined stuck)
  'E08': 'E03', // Old overwhelm spiral -> new E03 (combined)
  'E09': null,  // REMOVED - neurodivergent
  'E10': null,  // Answered by Scott, not in new set (structure)
  'E11': 'E06', // Old working together pref -> new E06
  'E12': 'E07', // Old helpful vs annoying -> new E07 (combined feedback)
  'E13': 'E07', // Old push back -> new E07 (combined)
  'E14': 'E10', // Old not feeling great -> new E10 (combined struggling)
  'E15': 'E08', // Old stuck -> new E08 (combined)
  'E16': 'E09', // Old get unstuck -> new E09
  'E17': 'E10', // Old makes worse -> new E10 (combined)
  'E18': null,  // Answered by Scott (chronic pain)
  'E19': 'E10', // Old crisis mode -> new E10
  'E20': 'E10', // Old how to help -> new E10 (combined)
  'E21': 'E11', // Old priorities -> new E11
  'E22': 'E12', // Old deadlines -> new E12
  'E23': null,  // REMOVED - done enough
  'E24': null,  // Answered by Scott (catch-all)
};

/**
 * Migrate old outstanding question IDs to new IDs
 */
export function migrateOutstandingQuestions(oldIds: string[]): string[] {
  const newIds = new Set<string>();

  for (const oldId of oldIds) {
    const newId = QUESTION_ID_MIGRATION[oldId];
    if (newId) {
      newIds.add(newId);
    }
  }

  return Array.from(newIds).sort();
}

/**
 * Get questions that are still outstanding based on gap_final data
 * If no gap_final exists, returns all questions
 */
export function getOutstandingQuestions(gapFinal: GapFinalData | null): QuestionEItem[] {
  if (!gapFinal || !gapFinal.outstanding_questions || gapFinal.outstanding_questions.length === 0) {
    // No gap_final or no outstanding list - return all questions
    return QUESTION_E_SET;
  }

  // Migrate old IDs to new IDs if needed
  const migratedIds = migrateOutstandingQuestions(gapFinal.outstanding_questions);

  // If migration resulted in fewer questions, use migrated; otherwise check if IDs match new format
  const idsToUse = migratedIds.length > 0 ? migratedIds : gapFinal.outstanding_questions;

  // Filter to only outstanding questions
  return QUESTION_E_SET.filter((q) => idsToUse.includes(q.id));
}

/**
 * Get questions by section
 */
export function getQuestionsBySection(section: QuestionESection): QuestionEItem[] {
  return QUESTION_E_SET.filter((q) => q.section === section);
}

/**
 * Get section metadata by ID
 */
export function getSectionMeta(section: QuestionESection): QuestionESectionMeta | undefined {
  return QUESTION_E_SECTIONS.find((s) => s.id === section);
}

/**
 * Group questions by their sections (preserves order)
 */
export function groupQuestionsBySection(questions: QuestionEItem[]): Map<QuestionESection, QuestionEItem[]> {
  const grouped = new Map<QuestionESection, QuestionEItem[]>();

  // Initialize sections in order
  for (const sectionMeta of QUESTION_E_SECTIONS) {
    const sectionQuestions = questions.filter((q) => q.section === sectionMeta.id);
    if (sectionQuestions.length > 0) {
      grouped.set(sectionMeta.id, sectionQuestions);
    }
  }

  return grouped;
}

/**
 * Check if a question is multiple choice
 */
export function isMultipleChoice(question: QuestionEItem): boolean {
  return !!question.options && question.options.length > 0;
}

/**
 * Get total question count
 */
export const QUESTION_E_COUNT = QUESTION_E_SET.length;
