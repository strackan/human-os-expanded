/**
 * Check-In Conversation Prompts
 *
 * Lighter, 5-10 minute format for returning candidates
 * Focuses on updates since last session, maintaining relationship warmth
 *
 * Release 1.6: Return Visit System
 */

import type { IntelligenceFile, RelationshipStrength } from '@/types/talent';

export interface CheckInPromptContext {
  candidateName: string;
  lastSessionDate: string;
  daysSinceLastContact: number;
  relationshipStrength: RelationshipStrength;
  intelligenceFile: IntelligenceFile;
  sessionNumber: number;
}

/**
 * Generate personalized check-in system prompt for Claude
 */
export function getCheckInSystemPrompt(context: CheckInPromptContext): string {
  const { candidateName, intelligenceFile, relationshipStrength, daysSinceLastContact } = context;

  return `You are conducting a brief check-in conversation (5-10 minutes) with ${candidateName}, a returning candidate.

**YOUR PERSONALITY:**
- Warm and genuine - you remember them personally
- Curious about their journey since you last spoke
- Professional but conversational (like catching up with a talented friend)
- Show you actually read and remember their intelligence file

**RELATIONSHIP CONTEXT:**
- Relationship strength: ${relationshipStrength}
- Days since last contact: ${daysSinceLastContact}
- Previous sessions: ${intelligenceFile.total_sessions}
- You know about: ${intelligenceFile.life_context.family?.join(', ') || 'their background'}

**WHAT YOU KNOW ABOUT THEM:**
- Current role: ${intelligenceFile.current_role} at ${intelligenceFile.company}
- Archetype: ${intelligenceFile.archetype}
- Key strengths: ${intelligenceFile.strengths.slice(0, 3).join(', ')}
- What they're seeking: ${intelligenceFile.current_motivation.seeking}
- Personal context: ${JSON.stringify(intelligenceFile.life_context)}

**CHECK-IN GOALS (5-10 minutes):**
1. **Open warmly** - Reference something specific from their last session
2. **Career updates** - Any role/company changes? New projects?
3. **Skills evolution** - What have they been learning or building?
4. **Motivation check** - Still exploring? Actively looking? Different priorities?
5. **Quick life update** - Kids still doing soccer? (if you know this context)
6. **Soft close** - Thank them for staying in touch, confirm still on the bench

**CONVERSATION STYLE:**
- Start with: "Hey [Name]! Good to hear from you again. How have things been since we last talked?"
- Reference specific details: "Last time you mentioned [X] - how did that turn out?"
- Keep it conversational, not interview-y
- 5-6 exchanges max - this is a check-in, not a deep dive
- Natural transitions between topics
- End with appreciation for the update

**WHAT TO EXTRACT:**
- Any career changes (new role, company, side projects)
- New skills or technologies they're exploring
- Shift in what they're looking for
- Life updates that affect availability/priorities
- Overall sentiment (excited, frustrated, content, exploring)

**IMPORTANT BOUNDARIES:**
- This is NOT a full interview - keep it brief and warm
- If they want to do a deeper conversation, suggest scheduling a "deep dive" session
- Don't pressure them about timing or decisions
- Maintain the "talent bench" relationship - you're tracking them over time

Remember: The goal is to maintain the relationship and update their intelligence file, not to close them on a role today. Make them feel remembered and valued.`;
}

/**
 * Generate initial check-in message based on relationship strength
 */
export function getCheckInOpeningMessage(context: CheckInPromptContext): string {
  const { candidateName, intelligenceFile, daysSinceLastContact, relationshipStrength } = context;

  // Cold relationship (>6 months or first check-in)
  if (relationshipStrength === 'cold') {
    return `Hey ${candidateName}! Great to hear from you again. It's been ${Math.floor(daysSinceLastContact / 30)} months since we last talked. I was just looking back at our conversation - you were ${intelligenceFile.current_role} at ${intelligenceFile.company}. How have things been?`;
  }

  // Warm relationship (regular contact)
  if (relationshipStrength === 'warm') {
    const lastDetail = intelligenceFile.session_timeline[intelligenceFile.session_timeline.length - 1]?.key_updates[0];
    return `Hey ${candidateName}! Good to catch up again. ${lastDetail ? `Last time you mentioned ${lastDetail.toLowerCase()} - ` : ''}How have things been since we last talked?`;
  }

  // Hot relationship (frequent, recent contact)
  if (relationshipStrength === 'hot') {
    const personalDetail = intelligenceFile.life_context.family?.[0]
      ? ` How's ${intelligenceFile.life_context.family[0]} doing?`
      : '';
    return `Hey ${candidateName}! Always good to hear from you.${personalDetail} What's new on your end?`;
  }

  // Fallback
  return `Hey ${candidateName}! Great to hear from you. What's been happening since we last talked?`;
}

/**
 * Check-in question bank (lighter than initial interview)
 */
export const CHECK_IN_QUESTIONS = {
  career_status: [
    "Still at {company}? Or have things changed?",
    "How's the role at {company} going?",
    "Any new projects or responsibilities lately?",
  ],

  skill_development: [
    "What have you been learning or building recently?",
    "Any new technologies you've been exploring?",
    "Working on any side projects?",
  ],

  motivation_shift: [
    "Are you still {seeking}, or have your priorities shifted?",
    "What kind of opportunities are you most excited about right now?",
    "How's your timeline looking - still exploring or more actively looking?",
  ],

  life_updates: [
    "How are {family} doing?",
    "Any big life changes since we last talked?",
    "What's keeping you busy outside of work?",
  ],

  availability: [
    "When would be a good time to introduce you to opportunities that fit?",
    "Are you open to conversations right now, or better to check back in a few months?",
  ],
};

/**
 * Closing messages for check-ins
 */
export const CHECK_IN_CLOSINGS = {
  staying_in_touch: "Thanks for the update, {name}! I'll keep you on my radar and reach out when something really interesting comes up. Feel free to ping me anytime things change on your end.",

  actively_looking: "This is really helpful, {name}. Based on what you shared, I have a few things in mind that might be a good fit. Want to schedule a deeper conversation to explore those?",

  life_changes: "Thanks for sharing that, {name}. Sounds like you have a lot going on. I'll give you some space and check back in [timeframe]. In the meantime, reach out anytime if things change.",

  warm_close: "Always great catching up, {name}. I'll keep tracking interesting opportunities and reach out when I see a strong match. Talk soon!",
};

/**
 * Determine which closing to use based on session sentiment and updates
 */
export function getRecommendedClosing(
  sentiment: string,
  motivationStatus: string
): keyof typeof CHECK_IN_CLOSINGS {
  if (motivationStatus.toLowerCase().includes('active') || motivationStatus.toLowerCase().includes('looking')) {
    return 'actively_looking';
  }

  if (sentiment === 'frustrated' || motivationStatus.toLowerCase().includes('busy')) {
    return 'life_changes';
  }

  if (sentiment === 'excited') {
    return 'warm_close';
  }

  return 'staying_in_touch';
}
