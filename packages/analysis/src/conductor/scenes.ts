/**
 * Scene and Character Definitions
 *
 * The interview journey: Elevator → Reception → Office
 * Each scene has a distinct character with natural dialogue.
 */

import type { Scene, SceneConfig, Character } from './types.js';

// =============================================================================
// CHARACTER PERSONAS
// =============================================================================

export const CHARACTERS = {
  operator: {
    name: 'Earl',
    persona: `Friendly elevator operator in his 60s. Observant but casual.
      Makes small talk that subtly reveals candidate's composure and social skills.
      Warm but not intrusive. Notices everything but says little.`,
    voice: 'warm, casual, observant',
  },

  receptionist: {
    name: 'Maria',
    persona: `Professional receptionist, mid-30s. Genuinely curious about people.
      Warm and welcoming but efficient. Asks natural questions about what
      brings them in. Good at reading energy and putting people at ease.`,
    voice: 'warm, professional, curious',
  },

  interviewer: {
    name: 'Interviewer',
    persona: `Direct but engaged interviewer. Asks open-ended questions that
      invite storytelling. Probes for specifics without interrogating.
      Genuinely interested in understanding the candidate's experience.`,
    voice: 'direct, engaged, probing',
  },
} as const;

// =============================================================================
// SCENE CONFIGURATIONS
// =============================================================================

export const SCENES: Record<Scene, SceneConfig> = {
  elevator: {
    scene: 'elevator',
    character: 'operator',
    characterName: CHARACTERS.operator.name,
    persona: CHARACTERS.operator.persona,
    purpose: [
      'warmup',
      'detect nerves/composure',
      'social calibration',
      'first impression EQ',
    ],
    openingLine: `*The elevator doors open to reveal a distinguished older gentleman in a crisp uniform*

"Going up? You look like you're heading to the executive floor. Big day?"`,

    followUpPrompts: [
      "Weather's something today, isn't it? You get here okay?",
      "*notices something* First time in the building? It's got some history.",
      "You seem ready. What's got you excited about today?",
    ],

    transitionLine: `*The elevator dings*

"Ah, here we are. 42nd floor. Good luck in there - you've got this."

*gestures toward the reception area*`,

    maxExchanges: 3,
  },

  reception: {
    scene: 'reception',
    character: 'receptionist',
    characterName: CHARACTERS.receptionist.name,
    persona: CHARACTERS.receptionist.persona,
    purpose: [
      'detect goals and interests',
      'communication style',
      'how they describe themselves',
      'what motivates them',
    ],
    openingLine: `*A warm smile greets you at a sleek reception desk*

"Welcome! I'm Maria. You must be here for the interview - we've been looking forward to meeting you.

What brings you to us? I'm always curious what draws people here."`,

    followUpPrompts: [
      "That's interesting! What is it about that kind of work that energizes you?",
      "So if this went perfectly, what would you be doing six months from now?",
      "What made you decide to make a move? Sometimes the 'why now' is as interesting as the 'what.'",
    ],

    transitionLine: `*Maria stands and gestures toward a corner office*

"That sounds wonderful. They're ready for you - right through there.

It was lovely chatting with you. Good luck!"`,

    maxExchanges: 4,
  },

  office: {
    scene: 'office',
    character: 'interviewer',
    characterName: CHARACTERS.interviewer.name,
    persona: CHARACTERS.interviewer.persona,
    purpose: [
      'deep dive all 11 dimensions',
      'technical depth',
      'leadership and ownership',
      'problem-solving approach',
      'self-awareness',
      'growth mindset',
    ],
    openingLine: `*You enter a corner office with floor-to-ceiling windows. The interviewer rises to greet you*

"Thanks for coming in. I've been looking forward to this conversation.

Let's skip the formalities - tell me about something you've built or accomplished that you're genuinely proud of. Not the biggest or most impressive thing, but the one that meant something to you."`,

    followUpPrompts: [
      "What made that challenging? Walk me through a moment where you weren't sure it would work.",
      "How did you handle the people side of that? Any friction or tough conversations?",
      "If you could go back and do it differently, what would you change? What did you learn?",
      "What gets you out of bed in the morning? What kind of problems do you actually enjoy solving?",
      "Tell me about a time you failed or made a significant mistake. What happened after?",
      "Where do you want to be in 3 years? Not the title - what do you want to be known for?",
    ],

    transitionLine: `*The interviewer leans back thoughtfully*

"This has been a great conversation. I've really enjoyed getting to know you.

We'll be in touch soon. Any questions for me before we wrap up?"`,

    maxExchanges: 7,
  },
};

// =============================================================================
// SCENE HELPERS
// =============================================================================

/**
 * Get the next scene in the journey
 */
export function getNextScene(current: Scene): Scene | null {
  const order: Scene[] = ['elevator', 'reception', 'office'];
  const currentIndex = order.indexOf(current);
  if (currentIndex === -1 || currentIndex === order.length - 1) {
    return null;
  }
  return order[currentIndex + 1];
}

/**
 * Get a follow-up prompt for the current scene
 */
export function getFollowUpPrompt(scene: Scene, exchangeNumber: number): string {
  const config = SCENES[scene];
  const prompts = config.followUpPrompts;

  // Cycle through prompts if we have more exchanges than prompts
  const promptIndex = (exchangeNumber - 1) % prompts.length;
  return prompts[promptIndex];
}

/**
 * Check if we should transition to the next scene
 */
export function shouldTransition(scene: Scene, exchangeNumber: number): boolean {
  return exchangeNumber >= SCENES[scene].maxExchanges;
}

/**
 * Get total expected exchanges across all scenes
 */
export function getTotalExpectedExchanges(): number {
  return Object.values(SCENES).reduce((sum, config) => sum + config.maxExchanges, 0);
}
