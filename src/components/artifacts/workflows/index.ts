/**
 * Workflow Artifacts
 *
 * Exports all workflow-specific artifact components.
 */

// Core artifacts
export { default as ActionPlanArtifact } from './ActionPlanArtifact';
export { default as ContractAnalysisArtifact } from './ContractAnalysisArtifact';
export { default as ContractReviewArtifact } from './ContractReviewArtifact';
export { default as MeetingNotesArtifact } from './MeetingNotesArtifact';
export { default as PricingTableArtifact } from './PricingTableArtifact';
export { default as RecommendationsArtifact } from './RecommendationsArtifact';
export { default as StakeholderMapArtifact } from './StakeholderMapArtifact';

// New primitives-based artifacts
export {
  ContactsOverviewArtifact,
  type Contact,
  type ContactsOverviewArtifactProps,
  type RelationshipStrength,
} from './ContactsOverviewArtifact';

export {
  ReportArtifact,
  type ReportArtifactProps,
  type ReportSection,
  type ReportSectionType,
  type ReportMetric,
  type ReportMetadata,
} from './ReportArtifact';

export {
  AccountSummaryArtifact,
  type AccountSummaryContact,
  type AccountSummaryMetric,
  type AccountSummaryArtifactProps,
} from './AccountSummaryArtifact';

// Renderer
export { default as ArtifactRenderer } from './ArtifactRenderer';

// Task mode variants
export { default as TaskArtifactsDisplay } from './TaskArtifactsDisplay';
export { default as TaskModeAdvanced } from './TaskModeAdvanced';
export { default as TaskModeCustom } from './TaskModeCustom';
export { default as TaskModeGallery } from './TaskModeGallery';
