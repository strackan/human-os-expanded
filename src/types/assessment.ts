// Assessment Types for Release 0.1.7: CS Assessment Interview

export type QuestionType = 'open_ended' | 'scale' | 'multiple_choice';

export type ScoringDimension =
  | 'iq'
  | 'eq'
  | 'empathy'
  | 'self_awareness'
  | 'technical'
  | 'ai_readiness'
  | 'gtm'
  | 'personality'
  | 'motivation'
  | 'work_history'
  | 'passions'
  | 'culture_fit';

export interface AssessmentQuestion {
  id: string;
  section: string;
  order: number;
  text: string;
  type: QuestionType;
  dimensions: ScoringDimension[];
  required: boolean;
  followUp?: string;
}

export interface AssessmentSection {
  id: string;
  title: string;
  description: string;
  order: number;
  transitionMessage?: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentConfig {
  id: string;
  title: string;
  version: string;
  estimatedMinutes: number;
  sections: AssessmentSection[];
  completionMessage: string;
}

export interface AssessmentResponse {
  question_id: string;
  answer_text: string;
  audio_url?: string;
  answered_at: string;
}

export interface AssessmentSession {
  id: string;
  candidate_id: string;
  started_at: string;
  completed_at?: string;
  current_question_index: number;
  responses: AssessmentResponse[];
}
