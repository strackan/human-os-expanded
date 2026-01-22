/**
 * Fixed 10 Onboarding Prompts
 *
 * These replace the dynamic gap_final question selection.
 * Everyone gets the same 10 prompts, ~15-20 minutes to complete.
 */

export interface OnboardingPrompt {
  id: string;
  title: string;
  prompt: string;
  maps_to: string[];
  question_type: 'open' | 'choice' | 'ranking';
  options?: string[];
}

export const ONBOARDING_PROMPTS: OnboardingPrompt[] = [
  // === Original 5 (consolidated from multiple questions) ===
  {
    id: 'peak-performance',
    title: 'Peak Performance',
    prompt:
      "Tell me about when you're at your best. Time of day, environment, conditions - what does that look like? And the flip side - when are you at your worst?",
    maps_to: ['cognitive-profile', 'current-state'],
    question_type: 'open',
  },
  {
    id: 'struggle-signals',
    title: 'Struggle Signals',
    prompt:
      "What does it look like when you're overwhelmed, stuck, or avoiding something? How does that spiral usually start for you?",
    maps_to: ['crisis-protocols', 'cognitive-profile'],
    question_type: 'open',
  },
  {
    id: 'recovery-support',
    title: 'Recovery & Support',
    prompt:
      'When things get hard, what actually helps? What makes it worse? What kind of support do you want from the people around you?',
    maps_to: ['crisis-protocols', 'conversation-protocols'],
    question_type: 'open',
  },
  {
    id: 'decisions-priorities',
    title: 'Decisions & Priorities',
    prompt:
      'How do you like decisions and priorities presented to you? Do you want options, a recommendation, or just the call made? What kinds of decisions drain you versus energize you?',
    maps_to: ['conversation-protocols', 'cognitive-profile'],
    question_type: 'open',
  },
  {
    id: 'feedback-leadership',
    title: 'Feedback & Leadership',
    prompt:
      'How do you prefer to give and receive feedback? As a leader, do you share everything with your team or filter to protect focus?',
    maps_to: ['communication', 'conversation-protocols'],
    question_type: 'open',
  },

  // === New 5 (direct questions) ===
  {
    id: 'social-rapport',
    title: 'Social & Rapport',
    prompt:
      'What makes you want to hang out with someone socially vs just working with them? Any particular senses of humor or personality types work better than others?',
    maps_to: ['communication', 'rapport'],
    question_type: 'open',
  },
  {
    id: 'challenge-style',
    title: 'Challenge Style',
    prompt:
      'How do you prefer to be disagreed with or challenged? When do you appreciate someone standing their ground vs it feeling confrontational?',
    maps_to: ['conversation-protocols', 'communication'],
    question_type: 'open',
  },
  {
    id: 'ideal-ai',
    title: 'Ideal AI',
    prompt:
      'If you could build an ideal AI assistant - what would be the 3-4 most important considerations?',
    maps_to: ['conversation-protocols', 'ai-preferences'],
    question_type: 'open',
  },
  {
    id: 'ai-role-ranking',
    title: 'AI Role Preference',
    prompt: 'Rank these AI assistant roles in order of most desirable to you:',
    maps_to: ['conversation-protocols', 'ai-preferences'],
    question_type: 'ranking',
    options: [
      'Strategic Thought Partner',
      'Deferential Assistant',
      'Coach & Accountability Partner',
      'Friend & Confidante',
    ],
  },
  {
    id: 'anything-else',
    title: 'Anything Else',
    prompt:
      'Is there anything else you\'d like me to know or take into account before creating your assistant?',
    maps_to: ['catch-all'],
    question_type: 'open',
  },
];

/**
 * Get prompts formatted for the finalize endpoint response
 */
export function getOnboardingPromptsForSession() {
  return ONBOARDING_PROMPTS.map((p) => ({
    id: p.id,
    title: p.title,
    prompt: p.prompt,
    maps_to: p.maps_to,
    question_type: p.question_type,
    options: p.options,
  }));
}
