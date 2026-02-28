/**
 * Bundle System — Curated tool sets for different products/users
 *
 * Each bundle selects a subset of tool modules from the registry.
 * Modules are organized into tiers:
 *   Infrastructure → Core Platform → Founder OS → Product-specific
 *
 * Selection: HUMAN_OS_BUNDLE env var, defaults to "founder-os" (all tools).
 */

// =============================================================================
// MODULE KEYS
// =============================================================================

/**
 * Every tool module in the registry, keyed by a short stable name.
 * These keys are used in bundle definitions — never change them
 * without updating all bundles that reference them.
 */
export type ModuleKey =
  // Infrastructure (always loaded)
  | 'do'
  | 'recall'
  | 'learn-alias'
  | 'session'
  // Core Platform
  | 'context'
  | 'search'
  | 'relationships'
  | 'glossary'
  | 'identity'
  | 'documents'
  // Founder OS productivity
  | 'tasks'
  | 'queue'
  | 'projects'
  | 'priorities'
  | 'journal'
  | 'emotions'
  | 'moods'
  | 'email'
  | 'code'
  | 'okr-goals'
  // Product-specific
  | 'voice'
  | 'skills'
  | 'conductor'
  | 'gft-ingestion'
  | 'crm'
  | 'outreach'
  | 'demo'
  | 'transcripts'
  | 'fathom'
  | 'community-intel'
  | 'nominations'
  | 'contacts'
  | 'sharing';

// =============================================================================
// TIERS
// =============================================================================

/** Infrastructure — always loaded, routing + session plumbing */
const INFRASTRUCTURE: ModuleKey[] = [
  'do',
  'recall',
  'learn-alias',
  'session',
];

/** Core Platform — shared context engine across all products */
const CORE_PLATFORM: ModuleKey[] = [
  'context',
  'search',
  'relationships',
  'glossary',
  'identity',
  'documents',
  'contacts',
  'sharing',
];

/** Founder OS — personal productivity suite */
const FOUNDER_OS: ModuleKey[] = [
  'tasks',
  'queue',
  'projects',
  'priorities',
  'journal',
  'emotions',
  'moods',
  'email',
  'code',
  'okr-goals',
];

/** Product-specific modules */
const PRODUCT_SPECIFIC: ModuleKey[] = [
  'voice',
  'skills',
  'conductor',
  'gft-ingestion',
  'crm',
  'outreach',
  'demo',
  'transcripts',
  'fathom',
  'community-intel',
  'nominations',
];

// =============================================================================
// BUNDLE DEFINITIONS
// =============================================================================

export type BundleName =
  | 'founder-os'
  | 'core'
  | 'scott-demo'
  | 'renubu'
  | 'gft'
  | 'goodhang';

interface BundleDefinition {
  description: string;
  modules: ModuleKey[];
}

const BUNDLES: Record<BundleName, BundleDefinition> = {
  /** Full personal OS — all modules, backward compatible default */
  'founder-os': {
    description: 'Full Founder OS — all tools',
    modules: [
      ...INFRASTRUCTURE,
      ...CORE_PLATFORM,
      ...FOUNDER_OS,
      ...PRODUCT_SPECIFIC,
    ],
  },

  /** Free tier — context engine + document parsing */
  core: {
    description: 'Core Platform — context engine + document parsing',
    modules: [
      ...INFRASTRUCTURE,
      ...CORE_PLATFORM,
    ],
  },

  /** Scott Demo (Mar 13) — context storage, mapping, search + voice sampling */
  'scott-demo': {
    description: 'Scott Demo — context spotlight + voice + productivity sampling',
    modules: [
      ...INFRASTRUCTURE,
      ...CORE_PLATFORM,
      'voice',
      'skills',
      'queue',
      'journal',
      'demo',
      'transcripts',
      'nominations',
    ],
  },

  /** Renubu — customer success vertical */
  renubu: {
    description: 'Renubu — customer success',
    modules: [
      ...INFRASTRUCTURE,
      ...CORE_PLATFORM,
      'transcripts',
      'community-intel',
      'emotions',
    ],
  },

  /** GFT — network intelligence vertical */
  gft: {
    description: 'GFT — network intelligence',
    modules: [
      ...INFRASTRUCTURE,
      ...CORE_PLATFORM,
      'gft-ingestion',
      'crm',
      'outreach',
      'email',
      'voice',
      'nominations',
    ],
  },

  /** Good Hang — talent assessment vertical */
  goodhang: {
    description: 'Good Hang — talent assessment',
    modules: [
      ...INFRASTRUCTURE,
      ...CORE_PLATFORM,
      'conductor',
      'community-intel',
      'transcripts',
      'emotions',
    ],
  },
};

// =============================================================================
// RESOLVER
// =============================================================================

/** Default bundle when env var is missing */
const DEFAULT_BUNDLE: BundleName = 'founder-os';

/**
 * All valid bundle names
 */
export function getBundleNames(): BundleName[] {
  return Object.keys(BUNDLES) as BundleName[];
}

/**
 * Get the description for a bundle
 */
export function getBundleDescription(name: BundleName): string {
  return BUNDLES[name].description;
}

/**
 * Resolve which module keys should be active for the given bundle name.
 *
 * - Returns deduplicated, order-preserved module key list
 * - Falls back to "founder-os" with a warning for unknown bundle names
 */
export function resolveBundleModules(bundleName: string): {
  resolvedBundle: BundleName;
  modules: ModuleKey[];
} {
  const name = bundleName as BundleName;

  if (name in BUNDLES) {
    // Deduplicate while preserving order
    const modules = [...new Set(BUNDLES[name].modules)];
    return { resolvedBundle: name, modules };
  }

  // Unknown bundle — fall back to default with warning
  console.error(
    `Warning: Unknown bundle "${bundleName}". ` +
    `Valid bundles: ${Object.keys(BUNDLES).join(', ')}. ` +
    `Falling back to "${DEFAULT_BUNDLE}".`
  );

  const modules = [...new Set(BUNDLES[DEFAULT_BUNDLE].modules)];
  return { resolvedBundle: DEFAULT_BUNDLE, modules };
}

/**
 * Read bundle name from environment, with default fallback
 */
export function getBundleFromEnv(): string {
  return process.env.HUMAN_OS_BUNDLE || DEFAULT_BUNDLE;
}
