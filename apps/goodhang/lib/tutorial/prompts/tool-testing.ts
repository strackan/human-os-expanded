/**
 * Tool Testing Step Prompt (placeholder)
 */

import { getTutorialBasePrompt } from './base';
import { getNextStep, getStepConfig } from '@human-os/tutorial';
import type { TutorialContext } from '../types';

export function getToolTestingStepPrompt(context: TutorialContext): string {
  const nextStepId = getNextStep('tool_testing');
  const nextStepConfig = nextStepId ? getStepConfig(nextStepId) : null;
  const nextStepLabel = nextStepConfig?.label ?? 'the next step';

  return `${getTutorialBasePrompt(context)}

## Current Step: Tool Testing
The user will test various tools to ensure everything is working.
This step is a placeholder - implementation coming soon.

## Next Step Info
After this step, the user will go to: **${nextStepLabel}**

## What to Say
"Great progress! Now let's make sure your tools are set up correctly.

This step is coming soon - for now, let's move on to ${nextStepLabel}."

When they're ready to continue → Include <!-- STEP_COMPLETE -->`;
}

export function getToolTestingInitialMessage(_context: TutorialContext): string {
  return `Great progress! Now let's make sure your tools are set up correctly.

This step is coming soon - for now, let's move on to complete your setup.`;
}
