/**
 * Tutorial Types
 */

import type { TutorialStepId } from '@human-os/tutorial';
import type { PersonaFingerprint } from '../renubu/prompts';

export type TutorialStep = TutorialStepId;

export interface TutorialProgress {
  currentStep: TutorialStep;
  stepIndex: number;
  questionsAnswered: number;
  totalQuestions: number;
  viewedReport: boolean;
}

export interface TutorialContext {
  firstName: string;
  progress: TutorialProgress;
  personaFingerprint: PersonaFingerprint | null | undefined;
  currentQuestion?: {
    id: string;
    title: string;
    prompt: string;
    category: string;
  } | null | undefined;
  executiveReport?: {
    summary: string;
    personality: { trait: string; description: string; insight: string }[];
    communication: { style: string; preferences: string[] };
    workStyle: { approach: string; strengths: string[] };
    keyInsights: string[];
  } | null | undefined;
}

export type TutorialAction =
  | 'show_report'
  | 'skip_report'
  | 'step_complete'
  | 'start_voice_testing'
  | 'skip_voice_testing'
  | 'pause_tutorial'
  | 'question_answered'
  | 'tutorial_complete'
  | 'continue';
