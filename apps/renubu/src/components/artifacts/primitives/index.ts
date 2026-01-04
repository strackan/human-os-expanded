/**
 * Artifact Primitives
 *
 * Composable building blocks for artifact components.
 * All primitives use consistent styling from artifact.tokens.ts
 */

// Design tokens
export {
  type ArtifactVariant,
  type ArtifactVariantStyles,
  ARTIFACT_VARIANTS,
  SECTION_STYLES,
  STATUS_BADGES,
  SPACING,
  TEXT_SIZES,
  getVariantStyles,
} from './artifact.tokens';

// ID/debugging hook
export {
  useArtifactId,
  generateArtifactId,
  type UseArtifactIdOptions,
  type UseArtifactIdReturn,
} from './useArtifactId';

// Container
export {
  ArtifactContainer,
  type ArtifactContainerProps,
} from './ArtifactContainer';

// Header
export {
  ArtifactHeader,
  type ArtifactHeaderProps,
} from './ArtifactHeader';

// Section
export {
  ArtifactSection,
  type ArtifactSectionProps,
  type SectionVariant,
  type SectionPadding,
} from './ArtifactSection';

// Table
export {
  ArtifactTable,
  type ArtifactTableProps,
  type TableColumn,
} from './ArtifactTable';

// List
export {
  ArtifactList,
  type ArtifactListProps,
  type ListItem,
  type ListVariant,
} from './ArtifactList';

// Alert
export {
  ArtifactAlert,
  type ArtifactAlertProps,
  type AlertSeverity,
} from './ArtifactAlert';

// Footer
export {
  ArtifactFooter,
  type ArtifactFooterProps,
  type FooterAlign,
} from './ArtifactFooter';

// Metric
export {
  ArtifactMetric,
  type ArtifactMetricProps,
  type MetricSize,
  type TrendDirection,
} from './ArtifactMetric';

// Approval Footer (v0.1.12)
export {
  ApprovalFooter,
  type ApprovalFooterProps,
} from './ApprovalFooter';
