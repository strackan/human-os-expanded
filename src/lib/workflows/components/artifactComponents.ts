/**
 * Artifact Component Registrations
 *
 * Registers React components for workflow artifacts.
 * These components are referenced by ID in slide definitions.
 */

import { registerComponents } from './ComponentRegistry';

// Import artifact components
import PricingAnalysisArtifact from '@/components/artifacts/PricingAnalysisArtifact';
import QuoteArtifact from '@/components/artifacts/QuoteArtifact';
import EmailArtifact from '@/components/artifacts/EmailArtifact';
import PlanSummaryArtifact from '@/components/artifacts/PlanSummaryArtifact';

// Import composite components from library
import { HealthDashboard } from '@/components/workflows/library/composite/HealthDashboard';
import { PricingRecommendation } from '@/components/workflows/library/composite/PricingRecommendation';

/**
 * All artifact components
 */
export const artifactComponents = {
  'artifact.pricing-analysis': {
    component: PricingAnalysisArtifact,
    displayName: 'Pricing Analysis',
    description: 'Displays pricing strategy analysis with market positioning and justification',
  },
  'artifact.quote': {
    component: QuoteArtifact,
    displayName: 'Renewal Quote',
    description: 'Interactive renewal quote document with inline editing',
  },
  'artifact.email': {
    component: EmailArtifact,
    displayName: 'Email Draft',
    description: 'Email composition interface with to/cc/subject/body fields',
  },
  'artifact.summary': {
    component: PlanSummaryArtifact,
    displayName: 'Workflow Summary',
    description: 'Summary of completed tasks and next steps',
  },
  'artifact.health-dashboard': {
    component: HealthDashboard,
    displayName: 'Health Dashboard',
    description: 'Customer health overview with metrics and risk factors',
  },
  'artifact.pricing-recommendation': {
    component: PricingRecommendation,
    displayName: 'Pricing Recommendation',
    description: 'AI-powered pricing recommendation with 3 scenarios',
  },
};

/**
 * Register all artifact components on module load
 *
 * IMPORTANT: This function runs automatically when this module is imported.
 * Make sure to import this module in any entry point that uses V2 slides:
 * - db-composer.ts (for browser/Next.js)
 * - test scripts (for Node.js)
 */
export function registerArtifactComponents(): void {
  registerComponents(artifactComponents);
  console.log('[V2] Registered', Object.keys(artifactComponents).length, 'artifact components');
}

// Auto-register on import
registerArtifactComponents();
