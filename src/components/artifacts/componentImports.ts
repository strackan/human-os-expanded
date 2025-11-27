// Pre-import all components to avoid dynamic import issues
import TaskModeCustom from './workflows/TaskModeCustom';
import TaskModeGallery from './workflows/TaskModeGallery';
import PricingRecommendation from './pricing/PricingRecommendation';
import RenewalChatWorkflow from './RenewalChatWorkflow';
import PlanningChecklistArtifact from './PlanningChecklistArtifact';
import ContractArtifact from './ContractArtifact';
import PricingAnalysisArtifact from './PricingAnalysisArtifact';
import ContactStrategyArtifact from './ContactStrategyArtifact';
import PlanSummaryArtifact from './PlanSummaryArtifact';
import PlanningChecklistEnhancedArtifact from './PlanningChecklistEnhancedArtifact';
import { BrandPerformanceArtifact } from './workflows/BrandPerformanceArtifact';
import ExpansionOverviewArtifact from './ExpansionOverviewArtifact';

// TODO: Add other imports as they are confirmed to exist
// import PriceRecommendationFlat from './pricing/PriceRecommendationFlat';
// import ViewContractEnterpriseBasic from './contracts/ViewContractEnterpriseBasic';

export const componentMap: Record<string, React.ComponentType<any>> = {
  'TaskModeCustom': TaskModeCustom,
  'TaskModeGallery': TaskModeGallery,
  'PricingRecommendation': PricingRecommendation,
  'RenewalChatWorkflow': RenewalChatWorkflow,
  'PlanningChecklistArtifact': PlanningChecklistArtifact,
  'ContractArtifact': ContractArtifact,
  'PricingAnalysisArtifact': PricingAnalysisArtifact,
  'ContactStrategyArtifact': ContactStrategyArtifact,
  'PlanSummaryArtifact': PlanSummaryArtifact,
  'PlanningChecklistEnhancedArtifact': PlanningChecklistEnhancedArtifact,
  'BrandPerformanceArtifact': BrandPerformanceArtifact,
  'ExpansionOverviewArtifact': ExpansionOverviewArtifact,
  // TODO: Add other mappings as components are confirmed to exist
};

export default componentMap;