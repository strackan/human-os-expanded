'use client';

/**
 * ArtifactRenderer - Main Dispatcher
 *
 * Routes artifact rendering to specialized renderers based on artifact type.
 * This is the single entry point for all artifact rendering in workflows.
 *
 * Routing Strategy:
 * - Assessment & Recommendations → AssessmentArtifactRenderer
 * - Account & Financial Documents → AccountArtifactRenderer
 * - Planning & Summaries → PlanningArtifactRenderer
 * - Communications & People → CommunicationsArtifactRenderer
 * - Custom/Inline Artifacts → Rendered directly
 */

import React from 'react';
import { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';
import AssessmentArtifactRenderer from './AssessmentArtifactRenderer';
import AccountArtifactRenderer from './AccountArtifactRenderer';
import PlanningArtifactRenderer from './PlanningArtifactRenderer';
import CommunicationsArtifactRenderer from './CommunicationsArtifactRenderer';
import DocumentArtifact from '@/components/artifacts/DocumentArtifact';
import { componentMap } from '@/components/artifacts/componentImports';

interface ArtifactRendererProps {
  slide: WorkflowSlide;
  section: any;
  customerName: string;
  workflowState: Record<string, any>;
  customer: any;
  expansionData: any;
  stakeholders: any[];
  sequenceInfo?: {
    currentIndex: number;
    totalCount: number;
  };
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onComplete: () => void;
  onUpdateState: (key: string, value: any) => void;
}

/**
 * Determine which specialized renderer should handle this artifact
 *
 * Type taxonomy:
 * - component:informative - Styled display components (metrics, summaries, cards)
 * - component:interactive - Components with forms, buttons, actions
 * - document - Text-focused content (markdown, whitepapers)
 * - Specialized renderers for legacy types (assessment, account, planning, communications)
 */
function getRendererType(section: any): 'assessment' | 'account' | 'planning' | 'communications' | 'document' | 'component' | 'inline' {
  const componentType = section.data?.componentType;
  const type = section.type;

  // Component types - registered React components
  if (type === 'component:informative' || type === 'component:interactive') {
    if (componentType && componentMap[componentType]) {
      return 'component';
    }
    console.warn(`[ArtifactRenderer] Component type "${componentType}" not found in componentMap`);
    return 'inline';
  }

  // Assessment & Recommendations
  if (componentType === 'AssessmentArtifact' ||
      componentType === 'AssessmentSummaryArtifact' ||
      componentType === 'RecommendationSlide' ||
      componentType === 'StrategicRecommendationWithPlan') {
    return 'assessment';
  }

  // Account & Financial Documents
  if (componentType === 'AccountOverviewArtifact' ||
      componentType === 'AccountSummaryArtifact' ||
      componentType === 'ExpansionOverviewArtifact' ||
      componentType === 'ExpansionProposalArtifact' ||
      componentType === 'StrategicAccountPlanArtifact' ||
      componentType === 'PricingAnalysisArtifact') {
    return 'account';
  }

  // Planning & Summaries
  if (componentType === 'PlanSummaryArtifact' ||
      componentType === 'PlanningChecklistArtifact' ||
      type === 'plan-summary' ||
      type === 'planning-checklist') {
    return 'planning';
  }

  // Communications & People (componentType OR section.type)
  if (componentType === 'EmailArtifact' ||
      componentType === 'StakeholderProfileArtifact' ||
      componentType === 'TalkingPointsArtifact' ||
      componentType === 'QuoteArtifact' ||
      type === 'email' ||
      type === 'email-draft' ||
      type === 'quote') {
    return 'communications';
  }

  // Document artifacts (markdown, structured docs)
  if (type === 'document' ||
      type === 'html' ||
      type === 'license-analysis' ||
      type === 'workflow-summary') {
    return 'document';
  }

  // Default to inline rendering
  return 'inline';
}

export default function ArtifactRenderer({
  slide,
  section,
  customerName,
  workflowState,
  customer,
  expansionData,
  stakeholders,
  sequenceInfo,
  onNext,
  onBack,
  onClose,
  onComplete,
  onUpdateState
}: ArtifactRendererProps) {
  const rendererType = getRendererType(section);

  // Route to specialized renderers
  switch (rendererType) {
    case 'assessment':
      return (
        <AssessmentArtifactRenderer
          slide={slide}
          section={section}
          customerName={customerName}
          workflowState={workflowState}
          customer={customer}
          expansionData={expansionData}
          onNext={onNext}
          onBack={onBack}
          onClose={onClose}
          onUpdateState={onUpdateState}
        />
      );

    case 'account':
      return (
        <AccountArtifactRenderer
          slide={slide}
          section={section}
          customerName={customerName}
          workflowState={workflowState}
          customer={customer}
          expansionData={expansionData}
          stakeholders={stakeholders}
          onNext={onNext}
          onBack={onBack}
          onClose={onClose}
          onUpdateState={onUpdateState}
        />
      );

    case 'planning':
      return (
        <PlanningArtifactRenderer
          slide={slide}
          section={section}
          customerName={customerName}
          customer={customer}
          sequenceInfo={sequenceInfo}
          onNext={onNext}
          onComplete={onComplete}
        />
      );

    case 'communications':
      return (
        <CommunicationsArtifactRenderer
          slide={slide}
          section={section}
          customerName={customerName}
          workflowState={workflowState}
          customer={customer}
          expansionData={expansionData}
          stakeholders={stakeholders}
          onNext={onNext}
          onBack={onBack}
          onClose={onClose}
          onUpdateState={onUpdateState}
        />
      );

    case 'document':
      // Document artifacts - render markdown or structured content
      // section.content can be a string (markdown) or object (structured fields)
      return (
        <DocumentArtifact
          data={section.content || section.data}
          title={section.title || 'Document'}
          readOnly={section.editable === false || section.readOnly === true}
          onFieldChange={(field, value) => {
            console.log('[ArtifactRenderer] Document field changed:', field, value);
            onUpdateState(`document.${field}`, value);
          }}
        />
      );

    case 'component': {
      // Registered React components (informative or interactive)
      const componentType = section.data?.componentType;
      const Component = componentMap[componentType];
      if (!Component) {
        console.error(`[ArtifactRenderer] Component "${componentType}" not found`);
        return null;
      }
      const props = section.data?.props || {};
      // Pass onUpdateState to interactive components for workflow state communication
      return <Component {...props} onUpdateState={onUpdateState} />;
    }

    case 'inline':
      // Inline artifacts are rendered directly in the main component
      // This includes custom JSX sections defined in workflow configs
      return section.data?.content || null;

    default:
      console.warn(`Unknown artifact renderer type: ${rendererType}`);
      return null;
  }
}
