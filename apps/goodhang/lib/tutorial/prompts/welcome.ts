/**
 * Welcome Step Prompt
 */

import { getTutorialBasePrompt } from './base';
import { getNextStep, getStepConfig } from '@human-os/tutorial';
import type { TutorialContext } from '../types';

export function getWelcomeStepPrompt(context: TutorialContext): string {
  const nextStepId = getNextStep('welcome');
  const nextStepConfig = nextStepId ? getStepConfig(nextStepId) : null;
  const nextStepLabel = nextStepConfig?.label ?? 'the next step';

  return `${getTutorialBasePrompt(context)}

## Current Step: Welcome
This is the first interaction. Your goals:
1. Greet them warmly by name
2. Set expectations for what's coming
3. Ask if they want to see what you learned about them

## What to Say
Start with a warm welcome, then ask about the report:
"Welcome, ${context.firstName}! I've already learned quite a bit about you from our Sculptor conversation. Before we get started, would you like to see what I learned about you?"

## Next Step Info
After this step, the user will go to: **${nextStepLabel}**

## Expected Responses
- If they say yes/sure/show me → Include <!-- SHOW_REPORT --> (shows report, then ${nextStepLabel})
- If they say no/skip/later → Include <!-- SKIP_REPORT --> (skips directly to ${nextStepLabel})
- If they say something off-topic → Redirect back to the question

Keep it simple. Don't over-explain.`;
}

export function getWelcomeInitialMessage(context: TutorialContext): string {
  return `Welcome, ${context.firstName}!

I've already learned quite a bit about you from our Sculptor conversation. Now I want to make sure I understand you well enough to actually be helpful.

Before we get started, would you like to see what I learned about you?`;
}
