/**
 * Auto-Config MCP Edge Function
 *
 * Automatically creates user_mcp_providers entries when a user activates a product.
 * Creates entries with status='pending' for OAuth providers that need connection.
 *
 * Usage:
 * - Call on product activation
 * - Pass user_id and product_slug
 * - Returns list of created provider entries
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

// =============================================================================
// TYPES
// =============================================================================

type ProductSlug = 'founder_os' | 'goodhang' | 'sculptor';
type ProviderSlug = 'fireflies' | 'gong' | 'gmail' | 'google-calendar' | 'slack' | 'notion' | 'linear' | 'hubspot';
type ProviderCategory = 'transcripts' | 'email' | 'calendar' | 'docs' | 'comms' | 'crm';

interface ProviderDefault {
  slug: ProviderSlug;
  category: ProviderCategory;
  requiresOauth: boolean;
  priority: number;
}

interface AutoConfigRequest {
  user_id: string;
  product_slug: ProductSlug;
}

interface CreatedProvider {
  id: string;
  provider_slug: string;
  status: string;
  requires_oauth: boolean;
}

// =============================================================================
// PRODUCT PROVIDER MAPPINGS
// =============================================================================

const PRODUCT_PROVIDERS: Record<ProductSlug, ProviderDefault[]> = {
  founder_os: [
    { slug: 'fireflies', category: 'transcripts', requiresOauth: true, priority: 1 },
    { slug: 'gong', category: 'transcripts', requiresOauth: true, priority: 2 },
    { slug: 'gmail', category: 'email', requiresOauth: true, priority: 3 },
    { slug: 'google-calendar', category: 'calendar', requiresOauth: true, priority: 4 },
    { slug: 'slack', category: 'comms', requiresOauth: true, priority: 5 },
    { slug: 'notion', category: 'docs', requiresOauth: true, priority: 6 },
  ],
  goodhang: [
    { slug: 'google-calendar', category: 'calendar', requiresOauth: true, priority: 1 },
    { slug: 'gmail', category: 'email', requiresOauth: true, priority: 2 },
    { slug: 'slack', category: 'comms', requiresOauth: true, priority: 3 },
  ],
  sculptor: [],
};

// =============================================================================
// MAIN HANDLER
// =============================================================================

Deno.serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const body: AutoConfigRequest = await req.json();
    const { user_id, product_slug } = body;

    // Validate input
    if (!user_id) {
      return errorResponse("user_id is required");
    }

    if (!product_slug || !PRODUCT_PROVIDERS[product_slug]) {
      return errorResponse(`Invalid product_slug. Must be one of: ${Object.keys(PRODUCT_PROVIDERS).join(', ')}`);
    }

    const supabase = createServiceClient();

    // Get providers for this product
    const providers = PRODUCT_PROVIDERS[product_slug];

    if (providers.length === 0) {
      return jsonResponse({
        status: "success",
        message: `No MCP providers configured for ${product_slug}`,
        providers_created: [],
      });
    }

    // Check which providers already exist for this user
    const { data: existingProviders, error: fetchError } = await supabase
      .schema('human_os')
      .from('user_mcp_providers')
      .select('provider_slug')
      .eq('user_id', user_id)
      .is('deleted_at', null);

    if (fetchError) {
      console.error("[auto-config-mcp] Error fetching existing providers:", fetchError);
      return errorResponse(`Database error: ${fetchError.message}`, 500);
    }

    const existingSlugs = new Set((existingProviders || []).map(p => p.provider_slug));

    // Filter to only providers that don't already exist
    const newProviders = providers.filter(p => !existingSlugs.has(p.slug));

    if (newProviders.length === 0) {
      return jsonResponse({
        status: "success",
        message: "All providers already configured for this user",
        providers_created: [],
        providers_existing: providers.length,
      });
    }

    // Get display names from registry
    const { data: registryData, error: registryError } = await supabase
      .schema('human_os')
      .from('mcp_provider_registry')
      .select('slug, name')
      .in('slug', newProviders.map(p => p.slug));

    if (registryError) {
      console.error("[auto-config-mcp] Error fetching registry:", registryError);
      // Continue without names - we'll use slugs
    }

    const nameMap = new Map((registryData || []).map(r => [r.slug, r.name]));

    // Create provider entries
    const insertData = newProviders.map(provider => ({
      user_id,
      provider_slug: provider.slug,
      category: provider.category,
      display_name: nameMap.get(provider.slug) || provider.slug,
      status: provider.requiresOauth ? 'pending' : 'active',
      supports_search: false, // Default - will be set by provider specifics
      supports_incremental: true,
      mcp_config: {},
      metadata: {
        auto_configured: true,
        product_slug,
        priority: provider.priority,
      },
    }));

    const { data: createdData, error: insertError } = await supabase
      .schema('human_os')
      .from('user_mcp_providers')
      .insert(insertData)
      .select('id, provider_slug, status');

    if (insertError) {
      console.error("[auto-config-mcp] Error inserting providers:", insertError);
      return errorResponse(`Failed to create providers: ${insertError.message}`, 500);
    }

    // Format response
    const createdProviders: CreatedProvider[] = (createdData || []).map(p => ({
      id: p.id,
      provider_slug: p.provider_slug,
      status: p.status,
      requires_oauth: newProviders.find(np => np.slug === p.provider_slug)?.requiresOauth || false,
    }));

    console.log(`[auto-config-mcp] Created ${createdProviders.length} providers for user ${user_id} (${product_slug})`);

    return jsonResponse({
      status: "success",
      message: `Created ${createdProviders.length} MCP provider configurations`,
      product_slug,
      providers_created: createdProviders,
      providers_existing: existingSlugs.size,
    });

  } catch (error) {
    console.error("[auto-config-mcp] Error:", error);
    return errorResponse(`Internal error: ${error.message}`, 500);
  }
});
