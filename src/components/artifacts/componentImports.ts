// Pre-import all components to avoid dynamic import issues
import TaskModeCustom from './workflows/TaskModeCustom';
import TaskModeGallery from './workflows/TaskModeGallery';
import PricingRecommendation from './pricing/PricingRecommendation';

// TODO: Add other imports as they are confirmed to exist
// import PriceRecommendationFlat from './pricing/PriceRecommendationFlat';
// import ViewContractEnterpriseBasic from './contracts/ViewContractEnterpriseBasic';

export const componentMap: Record<string, React.ComponentType> = {
  'TaskModeCustom': TaskModeCustom,
  'TaskModeGallery': TaskModeGallery,
  'PricingRecommendation': PricingRecommendation,
  // TODO: Add other mappings as components are confirmed to exist
};

export default componentMap;