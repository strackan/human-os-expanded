/**
 * CSM Dashboard - Export Facade
 *
 * Maintains backward compatibility while supporting modular architecture.
 * Components can import from either:
 * - '@/components/artifacts/dashboards/CSMDashboard' (facade, recommended)
 * - '@/components/artifacts/dashboards/CSMDashboard.tsx' (direct file)
 */

// Main component (default export)
export { default } from '../CSMDashboard';

// Data exports (for external use if needed)
export { dashboardData } from './data/dashboardData';

// Hook exports (for testing or advanced use cases)
export { useDashboardWorkflows } from './hooks/useDashboardWorkflows';
