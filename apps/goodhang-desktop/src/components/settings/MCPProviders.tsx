/**
 * MCP Providers Settings Component
 *
 * Settings panel for configuring external data sources via MCP.
 * Supports meeting transcripts, email, calendar, docs, and communication providers.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Mail,
  Calendar,
  FileText,
  MessageSquare,
  Users,
  Settings,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Trash2,
  Plus,
  ExternalLink,
  Clock,
  Lock,
} from 'lucide-react';
import {
  useMCPProvidersStore,
  type ProviderCategory,
  type UserMCPProvider,
  type ProviderRegistryEntry,
} from '../../lib/stores/mcp-providers';
import { useAuthStore } from '../../lib/stores/auth';

// =============================================================================
// CATEGORY ICONS
// =============================================================================

const categoryIcons: Record<ProviderCategory, React.ElementType> = {
  transcripts: Mic,
  email: Mail,
  calendar: Calendar,
  docs: FileText,
  comms: MessageSquare,
  crm: Users,
  other: Settings,
};

const categoryLabels: Record<ProviderCategory, string> = {
  transcripts: 'Meeting Transcripts',
  email: 'Email',
  calendar: 'Calendar',
  docs: 'Documents',
  comms: 'Communication',
  crm: 'CRM',
  other: 'Other',
};

const categoryDescriptions: Record<ProviderCategory, string> = {
  transcripts: 'Connect meeting recording services to extract context from your conversations.',
  email: 'Connect your email to understand communication patterns.',
  calendar: 'Connect your calendar for scheduling context.',
  docs: 'Connect document services for knowledge extraction.',
  comms: 'Connect team communication tools.',
  crm: 'Connect CRM systems for relationship context.',
  other: 'Other data sources.',
};

// =============================================================================
// PROVIDER CARD
// =============================================================================

interface ProviderCardProps {
  provider: UserMCPProvider;
  registryEntry?: ProviderRegistryEntry;
  onRemove: () => void;
  onRefresh: () => void;
}

function ProviderCard({ provider, registryEntry, onRemove, onRefresh }: ProviderCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove();
    } catch {
      setIsRemoving(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = () => {
    switch (provider.status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">
            <Check className="w-3 h-3" />
            Connected
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded-full">
            <Loader2 className="w-3 h-3 animate-spin" />
            Pending
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-xs text-red-400 bg-red-900/30 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Error
          </span>
        );
      case 'paused':
        return (
          <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
            Paused
          </span>
        );
      default:
        return null;
    }
  };

  const formatLastSync = (date?: string) => {
    if (!date) return 'Never synced';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Synced recently';
    if (diffHours < 24) return `Synced ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `Synced ${diffDays}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-gh-dark-700 border border-gh-dark-600 rounded-lg p-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gh-dark-600 rounded-lg flex items-center justify-center text-gray-300">
            {provider.providerSlug === 'fireflies' && <Mic className="w-5 h-5" />}
            {provider.providerSlug === 'gong' && <Mic className="w-5 h-5" />}
            {provider.providerSlug === 'zoom' && <Mic className="w-5 h-5" />}
            {provider.providerSlug === 'gmail' && <Mail className="w-5 h-5" />}
            {provider.providerSlug === 'google-calendar' && <Calendar className="w-5 h-5" />}
            {provider.providerSlug === 'notion' && <FileText className="w-5 h-5" />}
            {provider.providerSlug === 'slack' && <MessageSquare className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-white font-medium">
              {provider.displayName || registryEntry?.name || provider.providerSlug}
            </h4>
            <p className="text-sm text-gray-400">{registryEntry?.description}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {provider.status === 'error' && provider.errorMessage && (
        <div className="mt-3 p-2 bg-red-900/20 border border-red-900/50 rounded text-xs text-red-400">
          {provider.errorMessage}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          {formatLastSync(provider.lastExtractionAt)}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || provider.status !== 'active'}
            className="p-1.5 hover:bg-gh-dark-600 rounded transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="p-1.5 hover:bg-red-900/30 rounded transition-colors group"
            title="Remove"
          >
            {isRemoving ? (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// PROVIDER CONFIGURATION INFO
// =============================================================================

const providerConfigInfo: Record<string, {
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  helpText: string;
  docsUrl: string;
}> = {
  fireflies: {
    apiKeyLabel: 'Fireflies API Key',
    apiKeyPlaceholder: 'ff_xxxxxxxxxxxxxxxx',
    helpText: 'Find your API key in Fireflies Settings → Integrations → API & Webhooks',
    docsUrl: 'https://app.fireflies.ai/integrations',
  },
  gong: {
    apiKeyLabel: 'Gong API Key',
    apiKeyPlaceholder: 'Your Gong API key',
    helpText: 'Request API access from your Gong admin. Requires Enterprise plan.',
    docsUrl: 'https://help.gong.io/hc/en-us/articles/360042497612',
  },
  zoom: {
    apiKeyLabel: 'Zoom Server-to-Server OAuth Credentials',
    apiKeyPlaceholder: 'Account ID:Client ID:Client Secret',
    helpText: 'Create a Server-to-Server OAuth app in Zoom Marketplace',
    docsUrl: 'https://marketplace.zoom.us/docs/guides/build/server-to-server-oauth-app/',
  },
  notion: {
    apiKeyLabel: 'Notion Integration Token',
    apiKeyPlaceholder: 'secret_xxxxxxxxxxxxxxxx',
    helpText: 'Create an internal integration at notion.so/my-integrations',
    docsUrl: 'https://www.notion.so/my-integrations',
  },
};

// =============================================================================
// CONFIGURE PROVIDER MODAL
// =============================================================================

interface ConfigureProviderModalProps {
  provider: ProviderRegistryEntry;
  onSave: (apiKey: string) => Promise<void>;
  onClose: () => void;
}

function ConfigureProviderModal({ provider, onSave, onClose }: ConfigureProviderModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const config = providerConfigInfo[provider.slug] || {
    apiKeyLabel: 'API Key',
    apiKeyPlaceholder: 'Enter your API key',
    helpText: 'Enter the API key from your provider account.',
    docsUrl: '',
  };

  const handleTest = async () => {
    if (!apiKey.trim()) return;

    setTesting(true);
    setTestResult(null);

    try {
      // Call backend to test the API key
      const response = await fetch('/api/mcp/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: provider.slug,
          apiKey: apiKey.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTestResult({ success: true, message: 'Connection successful!' });
      } else {
        setTestResult({ success: false, message: result.error || 'Connection failed' });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to test connection',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) return;

    setSaving(true);
    try {
      await onSave(apiKey.trim());
      onClose();
    } catch {
      setSaving(false);
    }
  };

  const getProviderIcon = () => {
    switch (provider.slug) {
      case 'fireflies': return <Mic className="w-6 h-6 text-amber-400" />;
      case 'gong': return <Mic className="w-6 h-6 text-purple-400" />;
      case 'zoom': return <Mic className="w-6 h-6 text-blue-400" />;
      case 'gmail': return <Mail className="w-6 h-6 text-red-400" />;
      case 'google-calendar': return <Calendar className="w-6 h-6 text-blue-400" />;
      case 'notion': return <FileText className="w-6 h-6 text-gray-300" />;
      case 'slack': return <MessageSquare className="w-6 h-6 text-purple-400" />;
      default: return <Settings className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gh-dark-800 border border-gh-dark-600 rounded-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gh-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gh-dark-700 rounded-lg flex items-center justify-center">
              {getProviderIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Connect {provider.name}</h3>
              <p className="text-sm text-gray-400">{provider.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              {config.apiKeyLabel}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
              }}
              placeholder={config.apiKeyPlaceholder}
              className="w-full bg-gh-dark-700 border border-gh-dark-600 rounded-lg px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1.5">{config.helpText}</p>
            {config.docsUrl && (
              <a
                href={config.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1"
              >
                <ExternalLink className="w-3 h-3" />
                Get your API key
              </a>
            )}
          </div>

          {/* Test Connection Button */}
          <button
            onClick={handleTest}
            disabled={!apiKey.trim() || testing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gh-dark-700 hover:bg-gh-dark-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Testing connection...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Test Connection
              </>
            )}
          </button>

          {/* Test Result */}
          {testResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 p-3 rounded-lg ${
                testResult.success
                  ? 'bg-green-900/30 border border-green-800'
                  : 'bg-red-900/30 border border-red-800'
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <span className={`text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                {testResult.message}
              </span>
            </motion.div>
          )}

          {/* Privacy Note */}
          <div className="flex items-start gap-2 p-3 bg-gh-dark-700/50 rounded-lg">
            <Lock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500">
              Your API key is encrypted and stored securely. We only query your data during nightly syncs
              and never store raw content - just extracted entities and patterns.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gh-dark-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim() || saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Connect
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// ADD PROVIDER MODAL (Provider Selection)
// =============================================================================

interface AddProviderModalProps {
  category: ProviderCategory;
  availableProviders: ProviderRegistryEntry[];
  onSelectProvider: (provider: ProviderRegistryEntry) => void;
  onClose: () => void;
}

function AddProviderModal({ category, availableProviders, onSelectProvider, onClose }: AddProviderModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gh-dark-800 border border-gh-dark-600 rounded-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gh-dark-700">
          <h3 className="text-lg font-semibold text-white">Add {categoryLabels[category]} Provider</h3>
          <p className="text-sm text-gray-400 mt-1">
            Select a service to connect. You'll need to provide your API key.
          </p>
        </div>

        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
          {availableProviders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No additional providers available for this category.
            </p>
          ) : (
            availableProviders.map((provider) => (
              <button
                key={provider.slug}
                onClick={() => onSelectProvider(provider)}
                className="w-full flex items-center gap-3 p-3 bg-gh-dark-700 hover:bg-gh-dark-600 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 bg-gh-dark-600 rounded-lg flex items-center justify-center">
                  {provider.slug === 'fireflies' && <Mic className="w-5 h-5 text-amber-400" />}
                  {provider.slug === 'gong' && <Mic className="w-5 h-5 text-purple-400" />}
                  {provider.slug === 'zoom' && <Mic className="w-5 h-5 text-blue-400" />}
                  {provider.slug === 'gmail' && <Mail className="w-5 h-5 text-red-400" />}
                  {provider.slug === 'google-calendar' && <Calendar className="w-5 h-5 text-blue-400" />}
                  {provider.slug === 'notion' && <FileText className="w-5 h-5 text-gray-300" />}
                  {provider.slug === 'slack' && <MessageSquare className="w-5 h-5 text-purple-400" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{provider.name}</span>
                    <span className="text-xs text-gray-500 bg-gh-dark-600 px-1.5 py-0.5 rounded">
                      {provider.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{provider.description}</p>
                </div>
                <Plus className="w-5 h-5 text-gray-500" />
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gh-dark-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// CATEGORY SECTION
// =============================================================================

interface CategorySectionProps {
  category: ProviderCategory;
  providers: UserMCPProvider[];
  registry: ProviderRegistryEntry[];
  onAddProviderWithApiKey: (providerSlug: string, apiKey: string) => Promise<void>;
  onRemoveProvider: (providerId: string) => Promise<void>;
  onRefreshProvider: (providerId: string) => Promise<void>;
}

function CategorySection({
  category,
  providers,
  registry,
  onAddProviderWithApiKey,
  onRemoveProvider,
  onRefreshProvider,
}: CategorySectionProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [configuringProvider, setConfiguringProvider] = useState<ProviderRegistryEntry | null>(null);

  const Icon = categoryIcons[category];
  const configuredSlugs = new Set(providers.map((p) => p.providerSlug));
  const availableProviders = registry.filter(
    (r) => r.category === category && !configuredSlugs.has(r.slug)
  );

  const handleSelectProvider = (provider: ProviderRegistryEntry) => {
    setShowAddModal(false);
    setConfiguringProvider(provider);
  };

  const handleSaveProvider = async (apiKey: string) => {
    if (!configuringProvider) return;
    await onAddProviderWithApiKey(configuringProvider.slug, apiKey);
    setConfiguringProvider(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-gray-400" />
          <h3 className="text-white font-medium">{categoryLabels[category]}</h3>
        </div>
        {availableProviders.length > 0 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500">{categoryDescriptions[category]}</p>

      {providers.length === 0 ? (
        <div className="bg-gh-dark-700/50 border border-dashed border-gh-dark-600 rounded-lg p-6 text-center">
          <p className="text-gray-500 text-sm">No providers configured</p>
          {availableProviders.length > 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 text-sm text-blue-400 hover:text-blue-300"
            >
              Add a provider
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                registryEntry={registry.find((r) => r.slug === provider.providerSlug)}
                onRemove={() => onRemoveProvider(provider.id)}
                onRefresh={() => onRefreshProvider(provider.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Step 1: Select Provider */}
      <AnimatePresence>
        {showAddModal && (
          <AddProviderModal
            category={category}
            availableProviders={availableProviders}
            onSelectProvider={handleSelectProvider}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Step 2: Configure Provider (Enter API Key) */}
      <AnimatePresence>
        {configuringProvider && (
          <ConfigureProviderModal
            provider={configuringProvider}
            onSave={handleSaveProvider}
            onClose={() => setConfiguringProvider(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MCPProviders() {
  const { userId } = useAuthStore();
  const {
    registry,
    registryLoading,
    userProviders,
    userProvidersLoading,
    loadRegistry,
    loadUserProviders,
    addProvider,
    removeProvider,
    refreshProvider,
  } = useMCPProvidersStore();

  useEffect(() => {
    loadRegistry();
    if (userId) {
      loadUserProviders(userId);
    }
  }, [userId, loadRegistry, loadUserProviders]);

  if (!userId) {
    return (
      <div className="p-6 text-center text-gray-500">
        Please log in to configure data sources.
      </div>
    );
  }

  if (registryLoading || userProvidersLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  const handleAddProviderWithApiKey = async (providerSlug: string, apiKey: string) => {
    // Store API key encrypted, then add provider
    await addProvider(userId, providerSlug, { apiKey });
  };

  const handleRemoveProvider = async (providerId: string) => {
    await removeProvider(providerId);
  };

  const handleRefreshProvider = async (providerId: string) => {
    await refreshProvider(providerId);
  };

  // Group providers by category
  const providersByCategory = userProviders.reduce(
    (acc, provider) => {
      if (!acc[provider.category]) {
        acc[provider.category] = [];
      }
      acc[provider.category].push(provider);
      return acc;
    },
    {} as Record<ProviderCategory, UserMCPProvider[]>
  );

  // Categories to show (always show transcripts, then others with configured providers)
  const categoriesToShow: ProviderCategory[] = [
    'transcripts',
    'email',
    'calendar',
    'docs',
    'comms',
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white">Data Sources</h2>
        <p className="text-gray-400 mt-1">
          Connect external services to give Human OS context from your meetings, emails, and documents.
          Data stays in your providers - we only extract entities and patterns.
        </p>
      </div>

      <div className="space-y-8">
        {categoriesToShow.map((category) => (
          <CategorySection
            key={category}
            category={category}
            providers={providersByCategory[category] || []}
            registry={registry}
            onAddProviderWithApiKey={handleAddProviderWithApiKey}
            onRemoveProvider={handleRemoveProvider}
            onRefreshProvider={handleRefreshProvider}
          />
        ))}
      </div>

      <div className="pt-4 border-t border-gh-dark-700">
        <a
          href="https://docs.human-os.dev/integrations"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-400 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Learn more about integrations
        </a>
      </div>
    </div>
  );
}
