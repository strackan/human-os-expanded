/**
 * Question Block Types and Interfaces
 *
 * Defines the structure for different types of assessment question blocks
 */

export type QuestionBlockType =
  | 'slider-with-reason'
  | 'long-text'
  | 'multiple-choice'
  | 'radio-with-reason'
  | 'dropdown';

export interface BaseQuestionBlock {
  id: string;
  type: QuestionBlockType;
  question: string;
  description?: string;
  required?: boolean;
  helpText?: string;
}

export interface SliderWithReasonBlock extends BaseQuestionBlock {
  type: 'slider-with-reason';
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  labels?: {
    min: string;
    max: string;
  };
  reasonPlaceholder?: string;
  reasonRows?: number;
  accentColor?: 'purple' | 'red' | 'blue' | 'green';
}

export interface LongTextBlock extends BaseQuestionBlock {
  type: 'long-text';
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

export interface MultipleChoiceBlock extends BaseQuestionBlock {
  type: 'multiple-choice';
  options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  allowMultiple?: boolean;
}

export interface RadioWithReasonBlock extends BaseQuestionBlock {
  type: 'radio-with-reason';
  options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  reasonPlaceholder?: string;
  reasonRows?: number;
}

export interface DropdownBlock extends BaseQuestionBlock {
  type: 'dropdown';
  options: Array<{
    value: string;
    label: string;
  }>;
  placeholder?: string;
}

export type QuestionBlock =
  | SliderWithReasonBlock
  | LongTextBlock
  | MultipleChoiceBlock
  | RadioWithReasonBlock
  | DropdownBlock;

export interface AssessmentAnswer {
  questionId: string;
  value: any; // Could be number, string, array, object depending on question type
}

export interface AssessmentAnswers {
  [questionId: string]: any;
}
