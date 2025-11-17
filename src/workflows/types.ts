import { WorkflowSlide, DynamicChatBranch } from '@/components/artifacts/workflows/config/WorkflowConfig';

/**
 * Stage reference for composition
 */
export interface StageReference {
  id: string;
  config?: Record<string, any>;
}

/**
 * Pattern reference for composition
 */
export interface PatternReference {
  branchId: string;
  patternType: 'buttonFlow' | 'artifactTrigger' | 'autoAdvance' | 'complexBranch' | 'simpleResponse';
  config: Record<string, any>;
}

/**
 * Slide template for composition
 */
export interface SlideTemplate {
  id: string;
  slideNumber: number;
  title: string;
  description: string;
  label: string;
  stepMapping: string;
  showSideMenu?: boolean;

  // Stage references
  artifactStages?: StageReference[];

  // Chat configuration
  chat: {
    initialMessage?: {
      text: string;
      buttons?: Array<{ label: string; value: string; completeStep?: string }>;
      nextBranches?: Record<string, string>;
    };
    branches: Record<string, DynamicChatBranch>;
    userTriggers?: Record<string, string>;
    defaultMessage?: string;
  };

  // Side panel configuration
  sidePanel?: WorkflowSlide['sidePanel'];
}

/**
 * Workflow composition definition
 */
export interface WorkflowComposition {
  customer: {
    name: string;
    nextCustomer?: string;
  };
  slides: SlideTemplate[];
}
