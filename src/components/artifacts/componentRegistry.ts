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
];

export default componentRegistry;