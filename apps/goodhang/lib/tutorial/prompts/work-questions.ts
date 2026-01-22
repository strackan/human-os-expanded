/**
 * Work Questions Step Prompt - The 10 work style questions
 */

import { getTutorialBasePrompt } from './base';
import { getNextStep, getStepConfig } from '@human-os/tutorial';
import type { TutorialContext } from '../types';

export function getWorkQuestionsStepPrompt(context: TutorialContext): string {
  const question = context.currentQuestion;
  const remaining = context.progress.totalQuestions - context.progress.questionsAnswered;

  const nextStepId = getNextStep('work_questions');
  const nextStepConfig = nextStepId ? getStepConfig(nextStepId) : null;
  const nextStepLabel = nextStepConfig?.label ?? 'the next step';

  return `${getTutorialBasePrompt(context)}

## Current Step: Work Style Questions (${context.progress.questionsAnswered + 1} of ${context.progress.totalQuestions})

${question ? `## Current Question
**Category:** ${question.category}
**Topic:** ${question.title}

Ask them:
${question.prompt}
` : `## No more questions - proceed to ${nextStepLabel}`}

## Your Job
1. Listen to their answer
2. Acknowledge briefly (1 sentence max)
3. If their answer is too vague, ask ONE follow-up
4. When you have enough, move to the next question

## Progress Update
After acknowledging a sufficient answer, say something like:
"Got it.${remaining > 1 ? ` Just ${remaining - 1} more to go.` : remaining === 1 ? ' One more to go.' : ''}"

Then include <!-- QUESTION_ANSWERED --> at the end.

${remaining <= 0 ? `If no questions remain, mention we're moving to ${nextStepLabel} and include <!-- STEP_COMPLETE -->.` : ''}

## Keep It Moving
- Don't over-probe
- Don't repeat back everything they said
- One follow-up max, then accept the answer
- Keep responses SHORT`;
}

export function getWorkQuestionsInitialMessage(context: TutorialContext): string {
  if (context.currentQuestion) {
    return `Now I need to learn a bit more about how you work day-to-day. This helps me give you actually useful support instead of generic advice.

I've got ${context.progress.totalQuestions} quick questions. Let's start:

**${context.currentQuestion.title}**

${context.currentQuestion.prompt}`;
  }
  return `Now I need to learn a bit more about how you work. Let's cover a few quick questions.`;
}
