/**
 * Question E Assessment Configuration
 *
 * Personality Baseline Interview - fills gaps in founder-os documentation
 * for effective support (not just content generation).
 *
 * Source: GAP_ANALYSIS.md
 */

export interface SectionConfig {
  id: string;
  title: string;
  description: string;
  order: number;
  transitionMessage?: string;
  directory: string;
}

export const QUESTION_E_SECTIONS: SectionConfig[] = [
  {
    id: 'decision-making',
    title: 'Decision-Making Under Stress',
    description: 'Understanding how you navigate tough choices',
    order: 1,
    directory: '01-decision-making',
  },
  {
    id: 'energy-cognitive',
    title: 'Energy & Cognitive Patterns',
    description: 'Learning your rhythms and how you work best',
    order: 2,
    transitionMessage:
      "Now let's explore your energy patterns and cognitive rhythms. This helps us understand when and how to best support you.",
    directory: '02-energy-cognitive',
  },
  {
    id: 'communication',
    title: 'Communication Preferences',
    description: 'How you like to work with others',
    order: 3,
    transitionMessage:
      "Great insights. Now let's talk about how you prefer to communicate and collaborate.",
    directory: '03-communication',
  },
  {
    id: 'crisis-recovery',
    title: 'Crisis & Recovery',
    description: 'What helps and what to avoid when things get hard',
    order: 4,
    transitionMessage:
      "This section is about understanding what helps when you're struggling - and what makes things worse.",
    directory: '04-crisis-recovery',
  },
  {
    id: 'work-style',
    title: 'Work Style & Support',
    description: 'How to help you effectively',
    order: 5,
    transitionMessage:
      'Final section. This helps us understand exactly how to support you effectively.',
    directory: '05-work-style',
  },
];

export const QUESTION_E_CONFIG = {
  id: 'question-e-v1',
  slug: 'question-e',
  title: 'Question E: Personality Baseline',
  version: '1.0',
  estimatedMinutes: 20,
  description:
    'Fill the gaps between "writing as you" and "helping you" - enabling effective founder support.',
  completionMessage:
    "That's everything. Your personality baseline is being processed to update your founder-os protocols.",
  outputFiles: [
    'identity/cognitive-profile.md',
    'identity/communication.md',
    'founder-os/CONVERSATION_PROTOCOLS.md',
    'founder-os/CRISIS_PROTOCOLS.md',
    'founder-os/CURRENT_STATE.md',
  ],
};
