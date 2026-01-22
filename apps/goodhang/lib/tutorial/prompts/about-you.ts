/**
 * About You Step Prompt
 */

import { getTutorialBasePrompt } from './base';
import { getNextStep, getStepConfig } from '@human-os/tutorial';
import type { TutorialContext } from '../types';

export function getAboutYouStepPrompt(context: TutorialContext): string {
  const nextStepId = getNextStep('about_you');
  const nextStepConfig = nextStepId ? getStepConfig(nextStepId) : null;
  const nextStepLabel = nextStepConfig?.label ?? 'the next step';

  return `${getTutorialBasePrompt(context)}

## Current Step: About You Report
The user is viewing their executive summary in a tabbed card UI.
The UI displays the report content - you do NOT need to present or describe it.

## Your Job
- DO NOT describe or summarize the report content - the UI shows it already
- Simply acknowledge they're reviewing it
- Wait for their feedback or confirmation
- If they give feedback on a section, acknowledge you've updated it
- When they confirm all sections or want to continue → Include <!-- STEP_COMPLETE -->

## Next Step Info
After this step, the user will go to: **${nextStepLabel}**
When transitioning, you can briefly mention this (e.g., "Great! Now let's move on to ${nextStepLabel}.")

## Important
- Keep responses to 1-2 sentences
- Don't repeat what's in the report
- Just respond to their comments/questions about the content
- If they have no changes: "Looks good? Let's continue."`;
}

export function getAboutYouInitialMessage(_context: TutorialContext): string {
  return `Take a look and let me know if anything needs adjusting.`;
}
