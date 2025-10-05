import React, { useState, useMemo } from 'react';
import { ArtifactsConfig, SidePanelConfig } from '../config/WorkflowConfig';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import EmailComposer from './EmailComposer';
import PlanningChecklistArtifactHD, { ChecklistItem } from '../../PlanningChecklistArtifactHD';
import PlanningChecklistEnhancedArtifact from '../../PlanningChecklistEnhancedArtifact';
import PricingAnalysisArtifact from '../../PricingAnalysisArtifact';
import ContractArtifact from '../../ContractArtifact';
import ContactStrategyArtifact from '../../ContactStrategyArtifact';
import PlanSummaryArtifact from '../../PlanSummaryArtifact';
import DocumentArtifact from '../../DocumentArtifact';
import QuoteArtifact from '../../QuoteArtifact';

interface ArtifactsPanelHDProps {
  config: ArtifactsConfig;
  sidePanelConfig?: SidePanelConfig;
  className?: string;
  workflowConfigName?: string;
  visibleArtifacts?: Set<string>;
  onStepClick?: (stepId: string, workflowBranch: string) => void;
  onChapterNavigation?: (chapterNumber: number) => void;
  onToggleStatsVisibility?: () => void;
}

const LicenseAnalysisSectionHD = ({ content }: { content: any }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-3">
    <h3 className="font-semibold text-gray-800 mb-3 text-sm">License Analysis</h3>
    <div className="space-y-2 text-xs">
      <div className="flex justify-between items-center py-1 border-b border-gray-100">
        <span className="text-gray-600">Current License:</span>
        <span className="font-medium">
          {content.currentLicense.tokens.toLocaleString()} tokens @ ${content.currentLicense.unitPrice} - <strong>${content.currentLicense.total.toLocaleString()}</strong>
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-gray-100">
        <span className="text-gray-600">Anticipated Renewal Cost:</span>
        <span className="font-medium">
          {content.anticipatedRenewal.tokens.toLocaleString()} tokens @ ${content.anticipatedRenewal.unitPrice} = <strong>${content.anticipatedRenewal.total.toLocaleString()}</strong>
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-gray-100">
        <span className="text-gray-600">Early Discount (10%):</span>
        <span className="font-medium text-green-600">
          <strong>${content.earlyDiscount.total.toLocaleString()}</strong>
        </span>
      </div>
      <div className="flex justify-between items-center py-1">
        <span className="text-gray-600">Multi-Year Discount (18%):</span>
        <span className="font-medium text-green-600">
          <strong>${content.multiYearDiscount.total.toLocaleString()}</strong>
        </span>
      </div>
    </div>
  </div>
);

const WorkflowSummarySectionHD = ({ content }: { content: any }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-3">
    <h3 className="font-semibold text-gray-800 mb-3 text-sm">Workflow Summary</h3>
    <div className="space-y-2 text-xs">
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Customer:</span>
        <span className="font-medium">{content.customerName}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Current Stage:</span>
        <span className="font-medium">{content.currentStage}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Progress:</span>
        <span className="font-medium">{content.progressPercentage}%</span>
      </div>
      
      {content.completedActions && content.completedActions.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-medium text-gray-700 mb-1">Completed Actions:</h4>
          <ul className="space-y-1">
            {content.completedActions.map((action: string, index: number) => (
              <li key={index} className="text-xs text-gray-600 flex items-center">
                <span className="w-1 h-1 bg-green-500 rounded-full mr-2"></span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {content.nextSteps && content.nextSteps.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-medium text-gray-700 mb-1">Next Steps:</h4>
          <ul className="space-y-1">
            {content.nextSteps.map((step: string, index: number) => (
              <li key={index} className="text-xs text-gray-600 flex items-center">
                <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </div>
);

const ArtifactsPanelHD: React.FC<ArtifactsPanelHDProps> = ({
  config,
  sidePanelConfig,
  className = '',
  workflowConfigName,
  visibleArtifacts,
  onStepClick,
  onChapterNavigation,
  onToggleStatsVisibility
}) => {
  const [activeArtifact, setActiveArtifact] = useState<string | null>(null);

  // Filter artifacts based on visibility
  const filteredArtifacts = useMemo(() => {
    if (!config.sections) return [];
    
    if (visibleArtifacts && visibleArtifacts.size > 0) {
      return config.sections.filter(section => visibleArtifacts.has(section.id));
    }
    
    return config.sections.filter(section => section.visible);
  }, [config.sections, visibleArtifacts]);

  const renderArtifact = (section: any) => {
    switch (section.type) {
      case 'planning-checklist':
        return (
          <PlanningChecklistArtifactHD
            title={section.title}
            items={section.content.items}
            showActions={section.content.showActions}
            className="text-sm"
          />
        );
      
      case 'planning-checklist-enhanced':
        return (
          <PlanningChecklistEnhancedArtifact
            title={section.title}
            description={section.content.description}
            items={section.content.items}
            showActions={section.content.showActions}
            className="text-sm"
          />
        );
      
      case 'pricing-analysis':
        return (
          <PricingAnalysisArtifact
            title={section.title}
            content={section.content}
            className="text-sm"
          />
        );
      
      case 'contract':
        return (
          <ContractArtifact
            title={section.title}
            content={section.content}
            className="text-sm"
          />
        );
      
      case 'contact-strategy':
        return (
          <ContactStrategyArtifact
            title={section.title}
            content={section.content}
            className="text-sm"
          />
        );
      
      case 'plan-summary':
        return (
          <PlanSummaryArtifact
            title={section.title}
            content={section.content}
            className="text-sm"
          />
        );
      
      case 'document':
        return (
          <DocumentArtifact
            title={section.title}
            content={section.content}
            className="text-sm"
          />
        );
      
      case 'quote':
        return (
          <QuoteArtifact
            title={section.title}
            content={section.content}
            className="text-sm"
          />
        );
      
      case 'email':
        return (
          <EmailComposer
            title={section.title}
            content={section.content}
            editable={section.editable}
            className="text-sm"
          />
        );
      
      case 'license-analysis':
        return <LicenseAnalysisSectionHD content={section.content} />;
      
      case 'workflow-summary':
        return <WorkflowSummarySectionHD content={section.content} />;
      
      default:
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">{section.title}</h3>
            <div className="text-xs text-gray-600">
              {typeof section.content === 'string' ? section.content : JSON.stringify(section.content, null, 2)}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`flex h-full bg-gray-50 ${className}`}>
      {/* Main Artifacts Area */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-3">
          {filteredArtifacts.map((section) => (
            <div key={section.id}>
              {renderArtifact(section)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArtifactsPanelHD;
