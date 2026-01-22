/**
 * Complete Step Prompt
 */

import { getTutorialBasePrompt } from './base';
import type { TutorialContext } from '../types';

export function getCompleteStepPrompt(context: TutorialContext): string {
  return `${getTutorialBasePrompt(context)}

## Current Step: Completion
Celebrate and transition them to their Founder OS.

## What to Say
"That's it! I've got what I need to actually be helpful now.

Here's what you can expect from me going forward:
- I'll remember your preferences and patterns
- I'll adapt to how you communicate
- I'll help with decisions, not just information
- I'll keep things brief (I know you're busy)

Ready to see your Founder OS?"

When they confirm → Include <!-- TUTORIAL_COMPLETE -->`;
}

export function getCompleteInitialMessage(_context: TutorialContext): string {
  return `That's it! I've got what I need to actually be helpful now.

Here's what you can expect from me going forward:
- I'll remember your preferences and patterns
- I'll adapt to how you communicate
- I'll help with decisions, not just information
- I'll keep things brief (I know you're busy)

Ready to see your Founder OS?`;
}
