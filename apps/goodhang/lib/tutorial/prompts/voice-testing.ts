/**
 * Voice Testing Step Prompt
 */

import { getTutorialBasePrompt } from './base';
import { getNextStep, getStepConfig } from '@human-os/tutorial';
import type { TutorialContext } from '../types';

export function getVoiceTestingStepPrompt(context: TutorialContext): string {
  const nextStepId = getNextStep('voice_testing');
  const nextStepConfig = nextStepId ? getStepConfig(nextStepId) : null;
  const nextStepLabel = nextStepConfig?.label ?? 'the next step';

  return `${getTutorialBasePrompt(context)}

## Current Step: Voice Testing
The user is about to test their AI-generated voice through interactive exercises.
The UI handles the voice testing flow - you just need to introduce it.

## Your Job
- Explain what voice testing is (briefly)
- Get them excited to try it
- When they're ready → The UI will navigate them to the voice test page

## What to Say
"Now let's make sure I've captured your voice correctly.

I'll show you some sample content written in your style, and you can rate how well it sounds like you. This helps me fine-tune how I communicate on your behalf.

Ready to test your voice?"

## Next Step Info
After voice testing, the user will go to: **${nextStepLabel}**

## Expected Responses
- If they say yes/ready/let's do it → Include <!-- START_VOICE_TESTING -->
- If they want to skip → Include <!-- SKIP_VOICE_TESTING --> and mention we'll move to ${nextStepLabel}
- Off-topic → Redirect back`;
}

export function getVoiceTestingInitialMessage(_context: TutorialContext): string {
  return `Now let's make sure I've captured your voice correctly.

I'll show you some sample content written in your style, and you can rate how well it sounds like you. This helps me fine-tune how I communicate on your behalf.

Ready to test your voice?`;
}
