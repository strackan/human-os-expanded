/**
 * Component Registry with Versioning
 *
 * This registry tracks all available components with version information,
 * lifecycle status, and deprecation paths.
 *
 * Version Scheme:
 * - Use semantic versioning: MAJOR.MINOR.PATCH
 * - MAJOR: Breaking changes or major refactors
 * - MINOR: New features, backward compatible
 * - PATCH: Bug fixes
 *
 * Status Values:
 * - 'active': Component is production-ready and actively maintained
 * - 'deprecated': Component still works but should not be used in new code
 * - 'archived': Component exists but is not actively used or maintained
 *
 * Deprecation:
 * - Mark component as deprecated
 * - Add replacedBy field pointing to new component
 * - Keep in registry for backward compatibility
 * - Remove from componentImports.ts
 */

export interface ComponentItem {
  name: string;
  path: string;
  label: string;
  category?: string;

  // Version tracking (added 2025-10-20)
  version?: string;              // Semantic version (e.g., "2.0.0")
  status?: 'active' | 'deprecated' | 'archived';
  replacedBy?: string;           // Component name that replaces this (if deprecated)
  lastUpdated?: string;          // ISO date (YYYY-MM-DD)
  refactoredFrom?: string;       // Path to old version if refactored
}

export const componentRegistry: ComponentItem[] = [
  // === PRICING ===
  {
    name: 'PricingRecommendation',
    path: '/src/components/artifacts/pricing/PricingRecommendation',
    label: 'Pricing Recommendation',
    category: 'Pricing',
    version: '1.0.0',
    status: 'active',
    lastUpdated: '2025-10-20'
  },
  {
    name: 'PriceRecommendationFlat',
    path: '/src/components/artifacts/pricing/PriceRecommendationFlat',
    label: 'Price Recommendation Flat',
    category: 'Pricing',
    version: '1.0.0',
    status: 'archived',
    lastUpdated: '2025-10-20'
  },

  // === CONTRACTS ===
  {
    name: 'ViewContractEnterpriseBasic',
    path: '@/components/artifacts/contracts/ViewContractEnterpriseBasic',
    label: 'View Enterprise Contract - Basic',
    category: 'Contracts',
    version: '1.0.0',
    status: 'archived',
    lastUpdated: '2025-10-20'
  },
  {
    name: 'ViewContractEnterprise',
    path: '@/components/artifacts/contracts/ViewContractEnterprise',
    label: 'View Enterprise Contract',
    category: 'Contracts',
    version: '1.0.0',
    status: 'archived',
    lastUpdated: '2025-10-20'
  },
  {
    name: 'ContractWorkflowAlert',
    path: '@/components/artifacts/contracts/ContractWorkflowAlert',
    label: 'Sample Contract Workflow',
    category: 'Contracts',
    version: '1.0.0',
    status: 'archived',
    lastUpdated: '2025-10-20'
  },
  {
    name: 'ViewContractDetails',
    path: '@/components/artifacts/contracts/ViewContractDetails',
    label: 'View Contract',
    category: 'Contracts',
    version: '1.0.0',
    status: 'archived',
    lastUpdated: '2025-10-20'
  },
  {
    name: 'ContractArtifact',
    path: '@/components/artifacts/ContractArtifact',
    label: 'Contract Overview',
    category: 'Contracts',
    version: '1.0.0',
    status: 'active',
    lastUpdated: '2025-10-20'
  },

  // === EXPANSION ===
  {
    name: 'UsageUpsellWorkflow',
    path: '@/components/artifacts/expansion/UsageUpsellWorkflow',
    label: 'Upsell Workflow - Usage Exceeded',
    category: 'Expansion',
    version: '1.0.0',
    status: 'archived',
    lastUpdated: '2025-10-20'
  },

  // === CAMPAIGNS ===
  {
    name: 'PlgPriceIncreaseTest',
    path: '@/components/artifacts/campaigns/PlgPriceIncreaseTest',
    label: 'Price Increase A/B Test',
    category: 'Campaigns',
    version: '1.0.0',
    status: 'archived',
    lastUpdated: '2025-10-20'
  },
  {
    name: 'AutomatedPLGCampaigns',
    path: '@/components/artifacts/campaigns/AutomatedPLGCampaigns',
    label: 'CS Digital Campaign Performance',
    category: 'Campaigns',
    version: '1.0.0',
    status: 'archived',
    lastUpdated: '2025-10-20'
  },

  // === DASHBOARDS ===
  {
    name: 'RenewalsDashboard',
    path: '@/components/artifacts/dashboards/RenewalsDashboard',
    label: 'Monthly Renewals Dashboard',
    category: 'Dashboards',
    version: '1.0.0',
    status: 'archived',
    lastUpdated: '2025-10-20'
  },
  {
    name: 'ExpansionDashboard-qtr',
    path: '@/components/artifacts/dashboards/ExpansionDashboard-qtr',
    label: 'Quarterly Expansion Dashboard',
    category: 'Dashboards',
    version: '1.0.0',
    status: 'archived',
    lastUpdated: '2025-10-20'
  },
  {
    name: 'TeamForecast-qtr',
    path: '@/components/artifacts/dashboards/TeamForecast-qtr',
    label: 'Quarterly Team Forecast',
    category: 'Dashboards',
    version: '1.0.0',
    status: 'archived',
    lastUpdated: '2025-10-20'
  },
  {
    name: 'CSMDashboard',
    path: '@/components/artifacts/dashboards/CSMDashboard',
    label: 'CSM Dashboard with Task Mode',
    category: 'Dashboards',
    version: '2.0.0',
    status: 'active',
    lastUpdated: '2025-10-20',
    refactoredFrom: 'archive/refactoring-2025-10-20/CSMDashboard-v1.tsx'
  },

  // === CHAT ===
  {
    name: 'ChatTemplate',
    path: '@/components/artifacts/chat/ChatTemplate',
    label: 'Chat Template',
    category: 'Chat',
    version: '1.0.0',
    status: 'archived',
    lastUpdated: '2025-10-20'
  },
  {
    name: 'ChatQuote',
    path: '@/components/artifacts/chat/ChatQuote',
    label: 'User Chat with Quote Generation',
    category: 'Chat',
    version: '1.0.0',
    status: 'active',
    lastUpdated: '2025-10-20'
  },

  // === WORKFLOWS ===
  {
    name: 'TaskMode',
    path: '@/components/workflows/TaskMode',
    label: 'Task Mode - Modular Architecture',
    category: 'Workflows',
    version: '2.0.0',
    status: 'active',
    lastUpdated: '2025-10-20',
    refactoredFrom: 'archive/refactoring-2025-10-20/workflows/TaskModeFullscreen-v3.tsx'
  },
  {
    name: 'TaskModeAdvanced',
    path: '@/components/artifacts/workflows/TaskModeAdvanced',
    label: 'Task Mode - Advanced Interface (Deprecated)',
    category: 'Workflows',
    version: '1.0.0',
    status: 'deprecated',
    replacedBy: 'TaskMode',
    lastUpdated: '2025-10-20'
  },
  {
    name: 'TaskModeCustom',
    path: '@/components/artifacts/workflows/TaskModeCustom',
    label: 'Task Mode - Custom',
    category: 'Workflows',
    version: '1.0.0',
    status: 'active',
    lastUpdated: '2025-10-20'
  },
  {
    name: 'RenewalChatWorkflow',
    path: '@/components/artifacts/RenewalChatWorkflow',
    label: 'Renewal Chat Workflow',
    category: 'Workflows',
    version: '1.0.0',
    status: 'active',
    lastUpdated: '2025-10-20'
  },
  {
    name: 'PlanningChecklistArtifact',
    path: '@/components/artifacts/PlanningChecklistArtifact',
    label: 'Planning Checklist',
    category: 'Workflows',
    version: '1.0.0',
    status: 'active',
    lastUpdated: '2025-10-20'
  },
  {
    name: 'PlanningChecklistEnhancedArtifact',
    path: '@/components/artifacts/PlanningChecklistEnhancedArtifact',
    label: 'Enhanced Planning Checklist',
    category: 'Workflows',
    version: '1.0.0',
    status: 'active',
    lastUpdated: '2025-10-20'
  },
  {
    name: 'PlanSummaryArtifact',
    path: '@/components/artifacts/PlanSummaryArtifact',
    label: 'Plan Summary',
    category: 'Workflows',
    version: '1.0.0',
    status: 'active',
    lastUpdated: '2025-10-20'
  },

  // === PRICING ANALYSIS ===
  {
    name: 'PricingAnalysisArtifact',
    path: '@/components/artifacts/PricingAnalysisArtifact',
    label: 'Pricing Analysis',
    category: 'Pricing',
    version: '1.0.0',
    status: 'active',
    lastUpdated: '2025-10-20'
  },

  // === BRAND PERFORMANCE ===
  {
    name: 'BrandPerformanceArtifact',
    path: '@/components/artifacts/workflows/BrandPerformanceArtifact',
    label: 'Brand Performance',
    category: 'InHerSight',
    version: '1.0.0',
    status: 'active',
    lastUpdated: '2025-11-27'
  },

  // === PRESENTATIONS ===
  {
    name: 'PresentationArtifact',
    path: '@/components/artifacts/PresentationArtifact',
    label: 'Presentation Deck',
    category: 'Presentations',
    version: '1.0.0',
    status: 'active',
    lastUpdated: '2025-11-28'
  },

  // === STRATEGY ===
  {
    name: 'ContactStrategyArtifact',
    path: '@/components/artifacts/ContactStrategyArtifact',
    label: 'Contact Strategy',
    category: 'Strategy',
    version: '1.0.0',
    status: 'active',
    lastUpdated: '2025-10-20'
  },
];

export default componentRegistry;
