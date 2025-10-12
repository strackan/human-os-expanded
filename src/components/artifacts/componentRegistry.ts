export interface ComponentItem {
  name: string;
  path: string;
  label: string;
  category?: string;
}

export const componentRegistry: ComponentItem[] = [
  {
    name: 'PricingRecommendation',
    path: '/src/components/artifacts/pricing/PricingRecommendation',
    label: 'Pricing Recommendation',
    category: 'Pricing'
  },
  {
    name: 'PriceRecommendationFlat',
    path: '/src/components/artifacts/pricing/PriceRecommendationFlat',
    label: 'Price Recommendation Flat',
    category: 'Pricing'
  },
  {
    name: 'ViewContractEnterpriseBasic',
    path: '@/components/artifacts/contracts/ViewContractEnterpriseBasic',
    label: 'View Enterprise Contract - Basic',
    category: 'Contracts'
  },
  {
    name: 'ViewContractEnterprise',
    path: '@/components/artifacts/contracts/ViewContractEnterprise',
    label: 'View Enterprise Contract',
    category: 'Contracts'
  },
  {
    name: 'ContractWorkflowAlert',
    path: '@/components/artifacts/contracts/ContractWorkflowAlert',
    label: 'Sample Contract Workflow',
    category: 'Contracts'
  },
  {
    name: 'ViewContractDetails',
    path: '@/components/artifacts/contracts/ViewContractDetails',
    label: 'View Contract',
    category: 'Contracts'
  },
  {
    name: 'UsageUpsellWorkflow',
    path: '@/components/artifacts/expansion/UsageUpsellWorkflow',
    label: 'Upsell Workflow - Usage Exceeded',
    category: 'Expansion'
  },
  {
    name: 'PlgPriceIncreaseTest',
    path: '@/components/artifacts/campaigns/PlgPriceIncreaseTest',
    label: 'Price Increase A/B Test',
    category: 'Campaigns'
  },
  {
    name: 'AutomatedPLGCampaigns',
    path: '@/components/artifacts/campaigns/AutomatedPLGCampaigns',
    label: 'CS Digital Campaign Performance',
    category: 'Campaigns'
  },
  {
    name: 'RenewalsDashboard',
    path: '@/components/artifacts/dashboards/RenewalsDashboard',
    label: 'Monthly Renewals Dashboard',
    category: 'Dashboards'
  },
  {
    name: 'ExpansionDashboard-qtr',
    path: '@/components/artifacts/dashboards/ExpansionDashboard-qtr',
    label: 'Quarterly Expansion Dashboard',
    category: 'Dashboards'
  },
  {
    name: 'TeamForecast-qtr',
    path: '@/components/artifacts/dashboards/TeamForecast-qtr',
    label: 'Quarterly Team Forecast',
    category: 'Dashboards'
  },
  {
    name: 'ChatTemplate',
    path: '@/components/artifacts/chat/ChatTemplate',
    label: 'Chat Template',
    category: 'Chat'
  },
  {
    name: 'TaskModeAdvanced',
    path: '@/components/artifacts/workflows/TaskModeAdvanced',
    label: 'Task Mode - Advanced Interface',
    category: 'Workflows'
  },
  {
    name: 'TaskModeCustom',
    path: '@/components/artifacts/workflows/TaskModeCustom',
    label: 'Task Mode - Custom',
    category: 'Workflows'
  },
  {
    name: 'ChatQuote',
    path: '@/components/artifacts/chat/ChatQuote',
    label: 'User Chat with Quote Generation',
    category: 'Chat'
  },
  {
    name: 'CSMDashboard',
    path: '@/components/artifacts/dashboards/CSMDashboard',
    label: 'CSM Dashboard with Task Mode',
    category: 'Dashboards'
  },
  {
    name: 'RenewalChatWorkflow',
    path: '@/components/artifacts/RenewalChatWorkflow',
    label: 'Renewal Chat Workflow',
    category: 'Workflows'
  },
  {
    name: 'PlanningChecklistArtifact',
    path: '@/components/artifacts/PlanningChecklistArtifact',
    label: 'Planning Checklist',
    category: 'Workflows'
  },
  {
    name: 'ContractArtifact',
    path: '@/components/artifacts/ContractArtifact',
    label: 'Contract Overview',
    category: 'Contracts'
  },
  {
    name: 'PricingAnalysisArtifact',
    path: '@/components/artifacts/PricingAnalysisArtifact',
    label: 'Pricing Analysis',
    category: 'Pricing'
  },
  {
    name: 'ContactStrategyArtifact',
    path: '@/components/artifacts/ContactStrategyArtifact',
    label: 'Contact Strategy',
    category: 'Strategy'
  },
  {
    name: 'PlanSummaryArtifact',
    path: '@/components/artifacts/PlanSummaryArtifact',
    label: 'Plan Summary',
    category: 'Workflows'
  },
  {
    name: 'PlanningChecklistEnhancedArtifact',
    path: '@/components/artifacts/PlanningChecklistEnhancedArtifact',
    label: 'Enhanced Planning Checklist',
    category: 'Workflows'
  },
  // Artifact Showcase Demos
  {
    name: 'PlanningChecklistDemo',
    path: '@/components/artifacts/workflows/TaskModeAdvanced',
    label: 'Planning Checklist Demo',
    category: 'Artifact Demos'
  },
  {
    name: 'ContactStrategyDemo',
    path: '@/components/artifacts/workflows/TaskModeAdvanced',
    label: 'Contact Strategy Demo',
    category: 'Artifact Demos'
  },
  {
    name: 'ContractOverviewDemo',
    path: '@/components/artifacts/workflows/TaskModeAdvanced',
    label: 'Contract Overview Demo',
    category: 'Artifact Demos'
  },
  {
    name: 'PricingAnalysisDemo',
    path: '@/components/artifacts/workflows/TaskModeAdvanced',
    label: 'Pricing Analysis Demo',
    category: 'Artifact Demos'
  },
  {
    name: 'PlanSummaryDemo',
    path: '@/components/artifacts/workflows/TaskModeAdvanced',
    label: 'Plan Summary Demo',
    category: 'Artifact Demos'
  },
  {
    name: 'AllArtifactsMasterDemo',
    path: '@/components/artifacts/workflows/TaskModeAdvanced',
    label: 'Complete Workflow Demo (All Artifacts)',
    category: 'Artifact Demos'
  },
];

export default componentRegistry;