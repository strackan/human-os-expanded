import { ComponentType } from 'react';

export interface ChatStep {
  bot: string | string[];
  inputType: 'numberOrSkip' | 'emailOrSkip' | 'choice' | 'choiceOrInput' | 'progress';
  choices?: string[];
  progressStep?: number;
  onUser: (answer: string, ctx?: { setPrice?: (price: number) => void }) => string | string[] | { type: string; text: string; href: string; }[] | (string | { type: string; text: string; href: string; })[];
}

export interface ProgressStep {
  id: number;
  name: string;
  description?: string;
  status: 'complete' | 'current' | 'upcoming';
}

export interface ChatWorkflowConfig {
  steps: ChatStep[];
  progressSteps: ProgressStep[];
  checklistItems: string[];
  recommendedAction: {
    label: string;
    icon: ComponentType<Record<string, unknown>>;
  };
}

export interface CustomerData {
  name: string;
  arr: string;
  stages: ProgressStep[];
  stats: {
    label: string;
    value: string;
  }[];
  aiInsights: {
    category: string;
    color: 'green' | 'blue' | 'purple' | 'red';
    text: string;
  }[];
  miniCharts: {
    label: string;
    data: number[];
  }[];
} 