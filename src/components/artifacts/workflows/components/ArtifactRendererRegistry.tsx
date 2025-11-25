import React from 'react';
import { LicenseAnalysisRenderer } from './renderers/LicenseAnalysisRenderer';
import { EmailDraftRenderer } from './renderers/EmailDraftRenderer';
import { WorkflowSummaryRenderer } from './renderers/WorkflowSummaryRenderer';
import { HtmlRenderer } from './renderers/HtmlRenderer';
import { CustomRenderer } from './renderers/CustomRenderer';
import EmailComposer from './EmailComposer';
import PlanningChecklistArtifact from '../../PlanningChecklistArtifact';
import PlanningChecklistEnhancedArtifact from '../../PlanningChecklistEnhancedArtifact';
import PricingAnalysisArtifact from '../../PricingAnalysisArtifact';
import ContractArtifact from '../../ContractArtifact';
import ContactStrategyArtifact from '../../ContactStrategyArtifact';
import PlanSummaryArtifact from '../../PlanSummaryArtifact';
import DocumentArtifact from '../../DocumentArtifact';
import QuoteArtifact from '../../QuoteArtifact';

/**
 * Artifact Renderer Registry
 *
 * Central registry mapping artifact types to their renderer components.
 * Replaces the giant switch statement with a clean, extensible pattern.
 *
 * To add a new artifact type:
 * 1. Import the renderer component
 * 2. Add an entry to ARTIFACT_RENDERERS
 * 3. Define the props interface if needed
 */

interface ArtifactRenderProps {
  section: any;
  onArtifactButtonClick?: (action: any) => void;
  onChapterNavigation?: (chapterNumber: number) => void;
  setChecklistItems?: (updater: (prev: any[]) => any[]) => void;
}

/**
 * Renders a single artifact based on its type
 */
export function renderArtifact({ section, onArtifactButtonClick, onChapterNavigation, setChecklistItems }: ArtifactRenderProps): React.ReactNode {
  console.log('[ArtifactRenderer] Rendering section:', {
    id: section.id,
    type: section.type,
    hasContent: !!section.content,
    hasData: !!section.data,
    visible: section.visible,
    keys: Object.keys(section)
  });

  switch (section.type) {
    case 'license-analysis':
      return <LicenseAnalysisRenderer key={section.id} content={section.content} />;

    case 'email-draft':
      return <EmailDraftRenderer key={section.id} content={section.content} />;

    case 'email':
      return (
        <EmailComposer
          key={section.id}
          content={section.content}
          editable={section.editable !== false}
          typingSpeed={8}
        />
      );

    case 'workflow-summary':
      return <WorkflowSummaryRenderer key={section.id} content={section.content} />;

    case 'planning-checklist':
      return (
        <PlanningChecklistArtifact
          key={section.id}
          title={section.content?.description || "Let's review what we need to accomplish:"}
          items={section.content?.items || []}
          showActions={section.content?.showActions !== false}
          onItemToggle={(itemId, completed) => {
            // Update local checklist state when items are toggled
            setChecklistItems?.(prev =>
              prev.map(item =>
                item.id === itemId ? { ...item, completed } : item
              )
            );
          }}
          onLetsDoIt={() => {
            console.log('Planning Checklist: Let\'s Do It clicked!');
            // Mark "start-planning" as completed in local state
            setChecklistItems?.(prev =>
              prev.map(item =>
                item.id === 'start-planning' ? { ...item, completed: true } : item
              )
            );
            // Trigger all actions needed to transition to contract view
            if (onArtifactButtonClick) {
              // 1. Complete the step
              onArtifactButtonClick({
                type: 'completeStep',
                payload: { stepId: 'start-planning' }
              });
              // 2. Show the contract artifact
              onArtifactButtonClick({
                type: 'showArtifact',
                payload: { artifactId: 'enterprise-contract' }
              });
              // 3. Show the side menu
              onArtifactButtonClick({ type: 'showMenu' });
              // 4. Navigate to the conversation branch
              setTimeout(() => {
                console.log('ArtifactsPanel: Triggering navigateToBranch after delay');
                onArtifactButtonClick({
                  type: 'navigateToBranch',
                  payload: { branchId: 'contract-planning' }
                });
              }, 300);
            }
          }}
          onNotYet={() => {
            console.log('Planning Checklist: Not Yet clicked - showing concern dialog');
            if (onArtifactButtonClick) {
              onArtifactButtonClick({ type: 'nextCustomer' });
            }
          }}
        />
      );

    case 'planning-checklist-enhanced':
      return (
        <PlanningChecklistEnhancedArtifact
          key={section.id}
          title={section.content?.title || section.content?.description || "Let's review what we need to accomplish:"}
          subtitle={section.content?.subtitle || "Click any item to navigate to that section of the plan"}
          items={section.content?.items || []}
          onChapterNavigation={onChapterNavigation}
          showActions={section.content?.showActions !== false}
          enableAnimations={section.content?.enableAnimations !== false}
          theme={section.content?.theme || 'professional'}
        />
      );

    case 'pricing-analysis':
      return (
        <PricingAnalysisArtifact
          key={section.id}
          data={section.data || section.content}
          isLoading={section.isLoading}
        />
      );

    case 'contract':
      return (
        <ContractArtifact
          key={section.id}
          data={section.data || section.content}
          isLoading={section.isLoading}
          error={section.error}
        />
      );

    case 'document':
      return (
        <DocumentArtifact
          key={section.id}
          data={section.data || section.content}
          readOnly={section.readOnly === true}
          title={section.title || 'Document'}
          onFieldChange={(field, value) => {
            console.log('Document field changed:', field, value);
          }}
        />
      );

    case 'contact-strategy':
      return (
        <ContactStrategyArtifact
          key={section.id}
          {...section.content}
        />
      );

    case 'plan-summary':
      return (
        <PlanSummaryArtifact
          key={section.id}
          {...section.content}
        />
      );

    case 'quote':
      return (
        <QuoteArtifact
          key={section.id}
          data={section.data || section.content}
          readOnly={section.readOnly === true}
          onFieldChange={(field, value) => {
            console.log('Quote field changed:', field, value);
          }}
        />
      );

    case 'html':
      return <HtmlRenderer key={section.id} section={section} />;

    case 'custom':
      return <CustomRenderer key={section.id} section={section} />;

    default:
      return null;
  }
}
