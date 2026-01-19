/**
 * Product Provider Defaults
 *
 * Defines the default MCP providers that should be auto-configured
 * when a user activates a product.
 */

// =============================================================================
// TYPES
// =============================================================================

export type ProductSlug = 'founder_os' | 'goodhang' | 'sculptor';

export type ProviderSlug =
  | 'fireflies'
  | 'gong'
  | 'gmail'
  | 'google-calendar'
  | 'slack'
  | 'notion'
  | 'linear'
  | 'hubspot';

export interface ProviderDefault {
  /** Provider slug from mcp_provider_registry */
  slug: ProviderSlug;
  /** Category for organization */
  category: 'transcripts' | 'email' | 'calendar' | 'docs' | 'comms' | 'crm';
  /** Whether this provider requires OAuth */
  requiresOauth: boolean;
  /** Priority (lower = higher priority for onboarding flow) */
  priority: number;
  /** Whether this provider is required for core functionality */
  required: boolean;
}

export interface ProductProviderMapping {
  slug: ProductSlug;
  name: string;
  providers: ProviderDefault[];
}

// =============================================================================
// PROVIDER DEFINITIONS
// =============================================================================

const FIREFLIES: ProviderDefault = {
  slug: 'fireflies',
  category: 'transcripts',
  requiresOauth: true,
  priority: 1,
  required: false,
};

const GONG: ProviderDefault = {
  slug: 'gong',
  category: 'transcripts',
  requiresOauth: true,
  priority: 2,
  required: false,
};

const GMAIL: ProviderDefault = {
  slug: 'gmail',
  category: 'email',
  requiresOauth: true,
  priority: 3,
  required: false,
};

const GOOGLE_CALENDAR: ProviderDefault = {
  slug: 'google-calendar',
  category: 'calendar',
  requiresOauth: true,
  priority: 4,
  required: false,
};

const SLACK: ProviderDefault = {
  slug: 'slack',
  category: 'comms',
  requiresOauth: true,
  priority: 5,
  required: false,
};

const NOTION: ProviderDefault = {
  slug: 'notion',
  category: 'docs',
  requiresOauth: true,
  priority: 6,
  required: false,
};

// LINEAR and HUBSPOT defined for future use but not currently in any product mapping
// const LINEAR: ProviderDefault = {
//   slug: 'linear',
//   category: 'docs',
//   requiresOauth: true,
//   priority: 7,
//   required: false,
// };

// const HUBSPOT: ProviderDefault = {
//   slug: 'hubspot',
//   category: 'crm',
//   requiresOauth: true,
//   priority: 8,
//   required: false,
// };

// =============================================================================
// PRODUCT MAPPINGS
// =============================================================================

/**
 * Founder OS providers
 * - Transcripts for meeting analysis (fireflies, gong)
 * - Communication integrations (gmail, calendar, slack)
 * - Knowledge base (notion)
 */
export const FOUNDER_OS_PROVIDERS: ProductProviderMapping = {
  slug: 'founder_os',
  name: 'Founder OS',
  providers: [
    FIREFLIES,
    GONG,
    GMAIL,
    GOOGLE_CALENDAR,
    SLACK,
    NOTION,
  ],
};

/**
 * GoodHang providers
 * - Calendar for scheduling
 * - Email for communications
 * - Slack for team coordination
 */
export const GOODHANG_PROVIDERS: ProductProviderMapping = {
  slug: 'goodhang',
  name: 'GoodHang',
  providers: [
    GOOGLE_CALENDAR,
    GMAIL,
    SLACK,
  ],
};

/**
 * Sculptor providers (minimal - assessment focused)
 */
export const SCULPTOR_PROVIDERS: ProductProviderMapping = {
  slug: 'sculptor',
  name: 'Sculptor',
  providers: [],
};

// =============================================================================
// EXPORTS
// =============================================================================

export const PRODUCT_PROVIDER_MAPPINGS: Record<ProductSlug, ProductProviderMapping> = {
  founder_os: FOUNDER_OS_PROVIDERS,
  goodhang: GOODHANG_PROVIDERS,
  sculptor: SCULPTOR_PROVIDERS,
};

/**
 * Get the default providers for a product
 */
export function getProductProviders(productSlug: ProductSlug): ProviderDefault[] {
  return PRODUCT_PROVIDER_MAPPINGS[productSlug]?.providers || [];
}

/**
 * Get all unique provider slugs across all products
 */
export function getAllProviderSlugs(): ProviderSlug[] {
  const slugs = new Set<ProviderSlug>();

  for (const mapping of Object.values(PRODUCT_PROVIDER_MAPPINGS)) {
    for (const provider of mapping.providers) {
      slugs.add(provider.slug);
    }
  }

  return Array.from(slugs);
}

/**
 * Check if a provider requires OAuth
 */
export function providerRequiresOauth(slug: ProviderSlug): boolean {
  for (const mapping of Object.values(PRODUCT_PROVIDER_MAPPINGS)) {
    const provider = mapping.providers.find((p) => p.slug === slug);
    if (provider) {
      return provider.requiresOauth;
    }
  }
  return true; // Default to requiring OAuth for unknown providers
}
