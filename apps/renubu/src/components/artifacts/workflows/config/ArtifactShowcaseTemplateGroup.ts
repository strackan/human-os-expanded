/**
 * Artifact Showcase Template Group
 *
 * This template group provides comprehensive demos of all artifact types
 * accessible from the dashboard's "Launch Task Mode" feature.
 */

import { WorkflowConfig } from './WorkflowConfig';

// Import all demo configurations
import { planningChecklistDemoConfig } from './configs/PlanningChecklistDemoConfig';
import { contractDemoConfig } from './configs/ContractDemoConfig';
import { contactStrategyDemoConfig } from './configs/ContactStrategyDemoConfig';
import { planSummaryDemoConfig } from './configs/PlanSummaryDemoConfig';
import { pricingAnalysisDemoConfig } from './configs/PricingAnalysisDemoConfig';
import { allArtifactsMasterDemo } from './configs/AllArtifactsMasterDemo';

export interface TemplateGroupItem {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  artifacts: string[];
  config: WorkflowConfig;
  featured?: boolean;
  tags?: string[];
}

export interface TemplateGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  templates: TemplateGroupItem[];
  featured?: boolean;
}

export const artifactShowcaseTemplateGroup: TemplateGroup = {
  id: 'artifact-showcase-suite',
  name: 'Artifact Showcase Suite',
  description: 'Comprehensive demos showcasing all artifact types and their integration in real-world workflows',
  category: 'Demos & Training',
  icon: '🎯',
  featured: true,
  templates: [
    {
      id: 'complete-workflow-demo',
      name: 'Complete Workflow Demo',
      description: 'Comprehensive enterprise renewal workflow showcasing all 5 artifacts working together in a realistic scenario',
      category: 'Comprehensive',
      difficulty: 'Advanced',
      estimatedTime: '15-20 minutes',
      artifacts: ['Planning Checklist', 'Contact Strategy', 'Contract Overview', 'Pricing Analysis', 'Plan Summary'],
      config: allArtifactsMasterDemo,
      featured: true,
      tags: ['enterprise', 'comprehensive', 'integration', 'end-to-end']
    },
    {
      id: 'planning-checklist-demo',
      name: 'Planning Checklist Demo',
      description: 'Interactive demo of the planning checklist artifact with multiple template types and progress tracking',
      category: 'Individual Artifacts',
      difficulty: 'Beginner',
      estimatedTime: '5-7 minutes',
      artifacts: ['Planning Checklist'],
      config: planningChecklistDemoConfig,
      tags: ['planning', 'organization', 'templates', 'progress-tracking']
    },
    {
      id: 'contact-strategy-demo',
      name: 'Contact Strategy Demo',
      description: 'Stakeholder mapping and relationship management with interactive contact editing and strategy recommendations',
      category: 'Individual Artifacts',
      difficulty: 'Intermediate',
      estimatedTime: '6-8 minutes',
      artifacts: ['Contact Strategy'],
      config: contactStrategyDemoConfig,
      tags: ['relationships', 'stakeholders', 'strategy', 'networking']
    },
    {
      id: 'contract-overview-demo',
      name: 'Contract Overview Demo',
      description: 'Complex enterprise contract analysis with risk assessment, business terms categorization, and pricing breakdown',
      category: 'Individual Artifacts',
      difficulty: 'Intermediate',
      estimatedTime: '7-9 minutes',
      artifacts: ['Contract Overview'],
      config: contractDemoConfig,
      tags: ['contracts', 'risk-analysis', 'business-terms', 'legal']
    },
    {
      id: 'pricing-analysis-demo',
      name: 'Pricing Analysis Demo',
      description: 'Strategic pricing optimization with market analysis, competitive positioning, and AI-powered recommendations',
      category: 'Individual Artifacts',
      difficulty: 'Advanced',
      estimatedTime: '8-10 minutes',
      artifacts: ['Pricing Analysis'],
      config: pricingAnalysisDemoConfig,
      tags: ['pricing', 'market-analysis', 'optimization', 'revenue']
    },
    {
      id: 'plan-summary-demo',
      name: 'Plan Summary Demo',
      description: 'Comprehensive workflow tracking with completed tasks, integration status, and next steps planning',
      category: 'Individual Artifacts',
      difficulty: 'Intermediate',
      estimatedTime: '6-8 minutes',
      artifacts: ['Plan Summary'],
      config: planSummaryDemoConfig,
      tags: ['tracking', 'progress', 'execution', 'reporting']
    }
  ]
};

/**
 * Template Group Metadata for Dashboard Integration
 */
export const artifactShowcaseGroupMetadata = {
  groupId: 'artifact-showcase-suite',
  displayName: 'Artifact Showcase Suite',
  shortDescription: 'Complete artifact system demos',
  longDescription: 'Explore the full power of our artifact system with comprehensive demos ranging from individual artifact showcases to complete enterprise workflow integration.',
  category: 'Demos & Training',
  icon: '🎯',
  featured: true,
  difficulty: 'All Levels',
  totalTemplates: 6,
  estimatedTime: '45-60 minutes (complete suite)',
  tags: ['artifacts', 'demos', 'training', 'enterprise', 'workflows'],
  lastUpdated: '2024-12-28',
  version: '1.0.0'
};

/**
 * Template Selection Helper Functions
 */
export const getTemplateById = (templateId: string): TemplateGroupItem | undefined => {
  return artifactShowcaseTemplateGroup.templates.find(template => template.id === templateId);
};

export const getTemplatesByCategory = (category: string): TemplateGroupItem[] => {
  return artifactShowcaseTemplateGroup.templates.filter(template => template.category === category);
};

export const getTemplatesByDifficulty = (difficulty: 'Beginner' | 'Intermediate' | 'Advanced'): TemplateGroupItem[] => {
  return artifactShowcaseTemplateGroup.templates.filter(template => template.difficulty === difficulty);
};

export const getFeaturedTemplates = (): TemplateGroupItem[] => {
  return artifactShowcaseTemplateGroup.templates.filter(template => template.featured);
};

export const getTemplatesByArtifact = (artifactName: string): TemplateGroupItem[] => {
  return artifactShowcaseTemplateGroup.templates.filter(template =>
    template.artifacts.includes(artifactName)
  );
};

/**
 * Dashboard Integration Configuration
 */
export const dashboardIntegrationConfig = {
  // Configuration for "Launch Task Mode" dropdown
  taskModeIntegration: {
    enabled: true,
    groupName: 'Artifact Showcase Suite',
    groupDescription: 'Comprehensive artifact system demos',
    defaultTemplate: 'complete-workflow-demo', // Default selection
    showInMainMenu: true,
    showInQuickAccess: true,
    menuOrder: 1 // Priority order in dropdown
  },

  // Configuration for dashboard tiles/cards
  dashboardTileConfig: {
    enabled: true,
    tileTitle: 'Artifact Demos',
    tileDescription: 'Explore artifact capabilities',
    tileIcon: '🎯',
    showProgress: true,
    showDifficulty: true,
    maxTemplatesShown: 3 // Show top 3 templates in tile
  },

  // Configuration for help/training section
  trainingIntegration: {
    enabled: true,
    sectionName: 'Artifact System Training',
    learningPath: [
      'planning-checklist-demo',
      'contact-strategy-demo',
      'contract-overview-demo',
      'pricing-analysis-demo',
      'plan-summary-demo',
      'complete-workflow-demo'
    ],
    estimatedCompletionTime: '60 minutes',
    skillLevel: 'All Levels'
  }
};

/**
 * Export for template group registration
 */
export default artifactShowcaseTemplateGroup;