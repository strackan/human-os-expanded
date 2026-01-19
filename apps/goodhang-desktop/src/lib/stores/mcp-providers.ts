/**
 * MCP Providers Store
 *
 * Zustand store for managing MCP provider configurations.
 * Handles provider registry, user configurations, and sync status.
 */

import { create } from 'zustand';
import { supabase } from '../supabase';

// =============================================================================
// TYPES
// =============================================================================

export type ProviderCategory =
  | 'transcripts'
  | 'email'
  | 'calendar'
  | 'docs'
  | 'comms'
  | 'crm'
  | 'other';

export type ProviderStatus = 'pending' | 'active' | 'error' | 'paused' | 'revoked';

export interface ProviderRegistryEntry {
  slug: string;
  name: string;
  description?: string;
  category: ProviderCategory;
  iconUrl?: string;
  documentationUrl?: string;
  requiresOauth: boolean;
  oauthProvider?: string;
  oauthScopes?: string[];
  supportsSearch: boolean;
  supportsIncremental: boolean;
  status: 'alpha' | 'beta' | 'stable' | 'deprecated';
}

export interface UserMCPProvider {
  id: string;
  providerSlug: string;
  category: ProviderCategory;
  displayName?: string;
  status: ProviderStatus;
  lastQueriedAt?: string;
  lastExtractionAt?: string;
  extractionCursor: Record<string, unknown>;
  errorMessage?: string;
  errorCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface MCPProvidersState {
  // Registry of available providers
  registry: ProviderRegistryEntry[];
  registryLoading: boolean;
  registryError: string | null;

  // User's configured providers
  userProviders: UserMCPProvider[];
  userProvidersLoading: boolean;
  userProvidersError: string | null;

  // Pending providers (awaiting OAuth connection)
  pendingProviders: UserMCPProvider[];

  // Actions
  loadRegistry: () => Promise<void>;
  loadUserProviders: (userId: string) => Promise<void>;
  loadPendingProviders: (userId: string) => Promise<void>;
  addProvider: (userId: string, providerSlug: string, config?: Record<string, unknown>) => Promise<void>;
  removeProvider: (providerId: string) => Promise<void>;
  updateProviderStatus: (providerId: string, status: ProviderStatus) => Promise<void>;
  refreshProvider: (providerId: string) => Promise<void>;
  getProviderBySlug: (slug: string) => UserMCPProvider | undefined;
}

// =============================================================================
// STORE
// =============================================================================

export const useMCPProvidersStore = create<MCPProvidersState>((set, get) => ({
  // Initial state
  registry: [],
  registryLoading: false,
  registryError: null,

  userProviders: [],
  userProvidersLoading: false,
  userProvidersError: null,

  pendingProviders: [],

  // Load provider registry
  loadRegistry: async () => {
    set({ registryLoading: true, registryError: null });

    try {
      const { data, error } = await supabase
        .schema('human_os')
        .from('mcp_provider_registry')
        .select('*')
        .order('name');

      if (error) throw error;

      const registry: ProviderRegistryEntry[] = (data || []).map((row) => ({
        slug: row.slug,
        name: row.name,
        description: row.description,
        category: row.category,
        iconUrl: row.icon_url,
        documentationUrl: row.documentation_url,
        requiresOauth: row.requires_oauth || false,
        oauthProvider: row.oauth_provider,
        oauthScopes: row.oauth_scopes,
        supportsSearch: row.supports_search || false,
        supportsIncremental: row.supports_incremental || true,
        status: row.status || 'beta',
      }));

      set({ registry, registryLoading: false });
    } catch (error) {
      set({
        registryError: error instanceof Error ? error.message : 'Failed to load registry',
        registryLoading: false,
      });
    }
  },

  // Load user's configured providers
  loadUserProviders: async (userId: string) => {
    set({ userProvidersLoading: true, userProvidersError: null });

    try {
      const { data, error } = await supabase
        .schema('human_os')
        .from('user_mcp_providers')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userProviders: UserMCPProvider[] = (data || []).map((row) => ({
        id: row.id,
        providerSlug: row.provider_slug,
        category: row.category,
        displayName: row.display_name,
        status: row.status,
        lastQueriedAt: row.last_queried_at,
        lastExtractionAt: row.last_extraction_at,
        extractionCursor: row.extraction_cursor || {},
        errorMessage: row.error_message,
        errorCount: row.error_count || 0,
        metadata: row.metadata || {},
        createdAt: row.created_at,
      }));

      set({ userProviders, userProvidersLoading: false });

      // Also update pending providers
      const pendingProviders = userProviders.filter((p) => p.status === 'pending');
      set({ pendingProviders });
    } catch (error) {
      set({
        userProvidersError: error instanceof Error ? error.message : 'Failed to load providers',
        userProvidersLoading: false,
      });
    }
  },

  // Load only pending providers (awaiting OAuth)
  loadPendingProviders: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .schema('human_os')
        .from('user_mcp_providers')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const pendingProviders: UserMCPProvider[] = (data || []).map((row) => ({
        id: row.id,
        providerSlug: row.provider_slug,
        category: row.category,
        displayName: row.display_name,
        status: row.status,
        lastQueriedAt: row.last_queried_at,
        lastExtractionAt: row.last_extraction_at,
        extractionCursor: row.extraction_cursor || {},
        errorMessage: row.error_message,
        errorCount: row.error_count || 0,
        metadata: row.metadata || {},
        createdAt: row.created_at,
      }));

      set({ pendingProviders });
    } catch (error) {
      console.error('Failed to load pending providers:', error);
    }
  },

  // Get provider by slug
  getProviderBySlug: (slug: string) => {
    const { userProviders } = get();
    return userProviders.find((p) => p.providerSlug === slug);
  },

  // Add a new provider configuration
  addProvider: async (userId: string, providerSlug: string, config?: Record<string, unknown>) => {
    const { registry } = get();
    const registryEntry = registry.find((r) => r.slug === providerSlug);

    if (!registryEntry) {
      throw new Error(`Provider '${providerSlug}' not found in registry`);
    }

    const { data, error } = await supabase
      .schema('human_os')
      .from('user_mcp_providers')
      .insert({
        user_id: userId,
        provider_slug: providerSlug,
        category: registryEntry.category,
        display_name: registryEntry.name,
        mcp_config: config || {},
        status: registryEntry.requiresOauth ? 'pending' : 'active',
        supports_search: registryEntry.supportsSearch,
        supports_incremental: registryEntry.supportsIncremental,
      })
      .select()
      .single();

    if (error) throw error;

    // Add to local state
    const newProvider: UserMCPProvider = {
      id: data.id,
      providerSlug: data.provider_slug,
      category: data.category,
      displayName: data.display_name,
      status: data.status,
      lastQueriedAt: data.last_queried_at,
      lastExtractionAt: data.last_extraction_at,
      extractionCursor: data.extraction_cursor || {},
      errorMessage: data.error_message,
      errorCount: data.error_count || 0,
      metadata: data.metadata || {},
      createdAt: data.created_at,
    };

    set((state) => ({
      userProviders: [newProvider, ...state.userProviders],
    }));
  },

  // Remove a provider configuration
  removeProvider: async (providerId: string) => {
    const { error } = await supabase
      .schema('human_os')
      .from('user_mcp_providers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', providerId);

    if (error) throw error;

    set((state) => ({
      userProviders: state.userProviders.filter((p) => p.id !== providerId),
    }));
  },

  // Update provider status
  updateProviderStatus: async (providerId: string, status: ProviderStatus) => {
    const { error } = await supabase
      .schema('human_os')
      .from('user_mcp_providers')
      .update({ status })
      .eq('id', providerId);

    if (error) throw error;

    set((state) => ({
      userProviders: state.userProviders.map((p) =>
        p.id === providerId ? { ...p, status } : p
      ),
    }));
  },

  // Refresh provider (trigger manual sync)
  refreshProvider: async (providerId: string) => {
    // This would trigger a manual sync - for now just update timestamp
    const { error } = await supabase
      .schema('human_os')
      .from('user_mcp_providers')
      .update({ last_queried_at: new Date().toISOString() })
      .eq('id', providerId);

    if (error) throw error;

    set((state) => ({
      userProviders: state.userProviders.map((p) =>
        p.id === providerId ? { ...p, lastQueriedAt: new Date().toISOString() } : p
      ),
    }));
  },
}));
