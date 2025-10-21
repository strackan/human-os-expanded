"use client";

import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { ResizableModal } from '@/components/workflows/ResizableModal';
import { WorkflowExecutor } from '@/components/workflows/WorkflowExecutor';
import { WorkflowDefinition } from '@/components/workflows/WorkflowExecutor';
import { WorkflowConfig } from '../workflows/config/WorkflowConfig';
import { helloWorldWorkflow } from '@/components/workflows/definitions';
import { createACOStrategicPlanningWorkflow } from '@/components/workflows/definitions/factories/acoStrategicPlanningWorkflowFactory';
import {
  acmeCorpConfig,
  intrasoftConfig,
  bluebirdMemorialPlanningConfig,
  priceIncreaseFlatConfig,
  strategicEngagementConfig,
  quoteArtifactConfig,
  contractAnalysisConfig,
  strategicPlanningConfig,
  priceOptimizationConfig,
  simpleDynamicConfig,
  dynamicChatAI,
  dynamicChatAITemplated,
  dynamicChatUser,
  dynamicChatExampleConfig,
  dynamicClone,
  planningChecklistDemoConfig,
  contractDemoConfig,
  contactStrategyDemoConfig,
  planSummaryDemoConfig,
  pricingAnalysisDemoConfig,
  allArtifactsMasterDemo
} from '../workflows/config/configs';
import { renewalPlanningWorkflow } from '../workflows/configs/workflows/RenewalPlanning';
import Metrics from './Metrics';
import PriorityTasks from './PriorityTasks';
import RecentUpdates from './RecentUpdates';
import Reporting from './Reporting';
import { dashboardData } from './CSMDashboard/data/dashboardData';
import { useDashboardWorkflows } from './CSMDashboard/hooks/useDashboardWorkflows';

// Temporary converter: WorkflowConfig → WorkflowDefinition
// TODO: Replace with proper backend workflow definitions
function convertWorkflowConfigToDefinition(config: WorkflowConfig, configId: string): WorkflowDefinition {
  const customerName = config.customer?.name || 'Customer';
  return {
    id: configId,
    name: `Strategic Account Planning - ${customerName}`,
    description: `Complete strategic planning for ${customerName}`,
    steps: [
      {
        id: 'step-1',
        number: 1,
        title: 'Account Overview',
        description: 'Review customer information and current status',
        component: 'GenericFormStep'
      }
    ]
  };
}

// Old Config mapping (deprecated WorkflowConfig system)
const configMap: Record<string, WorkflowConfig> = {
  'acme': acmeCorpConfig,
  'intrasoft': intrasoftConfig,
  'bluebird-planning': bluebirdMemorialPlanningConfig,
  'price-increase-flat': priceIncreaseFlatConfig,
  'strategic-engagement': strategicEngagementConfig,
  'quote-artifact': quoteArtifactConfig,
  'contract-analysis': contractAnalysisConfig,
  'strategic-planning': strategicPlanningConfig,
  'price-optimization': priceOptimizationConfig,
  'simple-dynamic': simpleDynamicConfig,
  'dynamic-ai': dynamicChatAI,
  'dynamic-ai-templated': dynamicChatAITemplated,
  'test-templated-dynamic': renewalPlanningWorkflow,
  'dynamic-user': dynamicChatUser,
  'dynamic-chat-example': dynamicChatExampleConfig,
  'dynamic-ai-clone': dynamicClone,
  'planning-checklist-demo': planningChecklistDemoConfig,
  'contract-demo': contractDemoConfig,
  'contact-strategy-demo': contactStrategyDemoConfig,
  'plan-summary-demo': planSummaryDemoConfig,
  'pricing-analysis-demo': pricingAnalysisDemoConfig,
  'all-artifacts-master-demo': allArtifactsMasterDemo
};

// Static WorkflowDefinition mapping (modern system)
const staticWorkflowDefinitionsMap: Record<string, WorkflowDefinition> = {
  'hello-world': helloWorldWorkflow
};

// Factory-based workflows that need to be generated dynamically
const workflowFactories: Record<string, (customerId: string) => Promise<WorkflowDefinition>> = {
  'obsblk-strategic-planning': createACOStrategicPlanningWorkflow
};



const CSMDashboard: React.FC = () => {
  // UI state (non-workflow)
  const [activeUpdateTab, setActiveUpdateTab] = useState<'adoption' | 'sentiment' | 'market' | 'commercial' | 'conversation'>('adoption');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);

  // Workflow state (managed by hook)
  const {
    launchingTask,
    showTaskModal,
    defaultLaunchConfig,
    loadingWorkflow,
    workflowError,
    currentConfigId,
    currentConfig,
    currentWorkflowDefinition,
    handleLaunchTaskMode,
    handleCloseModal,
    handleNextCustomer
  } = useDashboardWorkflows({
    configMap,
    staticWorkflowDefinitionsMap,
    workflowFactories,
    upcomingTasks: dashboardData.upcomingTasks
  });

  const handleContextualHelp = (update: any) => {
    // TODO: Implement contextual chat functionality
    // This could launch a chat interface with context about the specific update
    console.log('Launching contextual help for update:', update);
    
    // For now, we'll just show an alert with the update details
    alert(`Contextual help for ${update.customer}:\n\n${update.update}\n\nThis will eventually launch a chat interface to help you with this specific issue.`);
  };

  const handleGoToReports = () => {
    // TODO: Navigate to reports page or open reports modal
    console.log('Navigating to reports...');
    
    // For now, we'll just show an alert
    alert('This will navigate to the detailed reports section with more comprehensive revenue analytics and insights.');
  };


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Simple Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-4">
          {defaultLaunchConfig && (
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Configured: {defaultLaunchConfig.type === 'group' ? 'Group' : 'Template'} "{defaultLaunchConfig.id}"
            </div>
          )}
          <button 
            onClick={() => handleLaunchTaskMode()}
            disabled={launchingTask !== null}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {launchingTask !== null ? (
              <>
                <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                Launching Task Mode...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Launch Task Mode
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Section */}
      <Metrics data={dashboardData.metrics} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Priority Tasks */}
        <PriorityTasks 
          data={dashboardData.upcomingTasks} 
          onLaunchTaskMode={handleLaunchTaskMode}
          launchingTask={launchingTask}
        />

        {/* Recent Updates */}
        <RecentUpdates 
          data={dashboardData.recentUpdates}
          activeTab={activeUpdateTab}
          showCriticalOnly={showCriticalOnly}
          onTabChange={setActiveUpdateTab}
          onCriticalToggle={setShowCriticalOnly}
          onContextualHelp={handleContextualHelp}
        />
      </div>

      {/* Reporting Section */}
      <Reporting 
        data={dashboardData.revenuePerformance}
        onGoToReports={handleGoToReports}
      />

      {/* Resizable Modal with WorkflowExecutor (Modern UX) */}
      <ResizableModal
        isOpen={showTaskModal}
        onClose={handleCloseModal}
        showHeader={false}
        defaultWidth={90}
        defaultHeight={90}
        minWidth={800}
        minHeight={600}
      >
        {loadingWorkflow ? (
          // Loading state while generating workflow
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium">Loading workflow...</p>
              <p className="text-gray-500 text-sm mt-2">Fetching customer data from database</p>
            </div>
          </div>
        ) : workflowError ? (
          // Error state
          <div className="flex items-center justify-center h-full text-red-500">
            <div className="text-center max-w-md">
              <p className="font-semibold mb-2">Error loading workflow</p>
              <p className="text-sm text-gray-600">{workflowError}</p>
              <button
                onClick={handleCloseModal}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        ) : currentWorkflowDefinition ? (
          // NEW SYSTEM: Use WorkflowDefinition (static or dynamically generated)
          <WorkflowExecutor
            workflowDefinition={currentWorkflowDefinition}
            customerId="550e8400-e29b-41d4-a716-446655440001"
            onComplete={(executionId) => {
              console.log('Workflow completed:', executionId);
              handleCloseModal();
            }}
            onExit={() => {
              if (confirm('Are you sure you want to exit this workflow?')) {
                handleCloseModal();
              }
            }}
          />
        ) : currentConfig ? (
          // OLD SYSTEM: Convert WorkflowConfig → WorkflowDefinition (legacy)
          <WorkflowExecutor
            workflowDefinition={convertWorkflowConfigToDefinition(currentConfig, currentConfigId || 'unknown')}
            customerId="550e8400-e29b-41d4-a716-446655440001"
            onComplete={(executionId) => {
              console.log('Workflow completed:', executionId);
              handleCloseModal();
            }}
            onExit={() => {
              if (confirm('Are you sure you want to exit this workflow?')) {
                handleCloseModal();
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p>Configuration not found</p>
              <p className="text-sm mt-2">Config ID: {currentConfigId || 'none'}</p>
            </div>
          </div>
        )}
      </ResizableModal>
    </div>
  );
};

export default CSMDashboard;