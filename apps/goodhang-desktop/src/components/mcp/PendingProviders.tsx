/**
 * PendingProviders Component
 *
 * Shows pending OAuth providers that need connection.
 * Displays "Connect" buttons that initiate OAuth flow.
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useMCPProvidersStore, type UserMCPProvider } from '@/lib/stores/mcp-providers';

// =============================================================================
// PROVIDER ICONS
// =============================================================================

const PROVIDER_ICONS: Record<string, string> = {
  fireflies: '🔥',
  gong: '🔔',
  gmail: '📧',
  'google-calendar': '📅',
  slack: '💬',
  notion: '📝',
  linear: '📊',
  hubspot: '🎯',
};

const PROVIDER_DESCRIPTIONS: Record<string, string> = {
  fireflies: 'Meeting transcripts and notes',
  gong: 'Sales call recordings and insights',
  gmail: 'Email communications',
  'google-calendar': 'Calendar events and scheduling',
  slack: 'Team messages and channels',
  notion: 'Documents and wikis',
  linear: 'Project tracking and issues',
  hubspot: 'CRM contacts and deals',
};

// =============================================================================
// TYPES
// =============================================================================

interface PendingProvidersProps {
  /** User ID to load providers for */
  userId: string;
  /** Callback when a provider's connect button is clicked */
  onConnect?: (provider: UserMCPProvider) => void;
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Maximum providers to show (shows "more" if exceeded) */
  maxVisible?: number;
  /** Custom title */
  title?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PendingProviders({
  userId,
  onConnect,
  compact = false,
  maxVisible,
  title = 'Connect Your Tools',
}: PendingProvidersProps) {
  const { pendingProviders, loadPendingProviders, registry, loadRegistry } =
    useMCPProvidersStore();

  // Load pending providers on mount
  useEffect(() => {
    if (userId) {
      loadPendingProviders(userId);
    }
    // Also load registry for icons/descriptions if not loaded
    if (registry.length === 0) {
      loadRegistry();
    }
  }, [userId, loadPendingProviders, loadRegistry, registry.length]);

  if (pendingProviders.length === 0) {
    return null;
  }

  const visibleProviders = maxVisible
    ? pendingProviders.slice(0, maxVisible)
    : pendingProviders;
  const hiddenCount = maxVisible
    ? Math.max(0, pendingProviders.length - maxVisible)
    : 0;

  const handleConnect = async (provider: UserMCPProvider) => {
    if (onConnect) {
      onConnect(provider);
    } else {
      // Default behavior: open OAuth flow (placeholder)
      console.log('[PendingProviders] Connect clicked for:', provider.providerSlug);
      // In a real implementation, this would initiate OAuth
      // For now, just update status to show something happened
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Connect:</span>
        <div className="flex gap-1">
          {visibleProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleConnect(provider)}
              className="p-1.5 text-xl hover:bg-gh-dark-700 rounded transition-colors"
              title={`Connect ${provider.displayName || provider.providerSlug}`}
            >
              {PROVIDER_ICONS[provider.providerSlug] || '🔌'}
            </button>
          ))}
          {hiddenCount > 0 && (
            <span className="text-xs text-gray-500 self-center">+{hiddenCount} more</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gh-dark-800 rounded-xl border border-gh-dark-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gh-dark-700">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Connect your tools to unlock AI-powered insights
        </p>
      </div>

      {/* Provider List */}
      <div className="divide-y divide-gh-dark-700">
        <AnimatePresence>
          {visibleProviders.map((provider, index) => (
            <ProviderRow
              key={provider.id}
              provider={provider}
              index={index}
              onConnect={handleConnect}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Hidden count */}
      {hiddenCount > 0 && (
        <div className="px-4 py-2 text-xs text-gray-500 border-t border-gh-dark-700">
          +{hiddenCount} more integrations available
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ProviderRowProps {
  provider: UserMCPProvider;
  index: number;
  onConnect: (provider: UserMCPProvider) => void;
}

function ProviderRow({ provider, index, onConnect }: ProviderRowProps) {
  const icon = PROVIDER_ICONS[provider.providerSlug] || '🔌';
  const description =
    PROVIDER_DESCRIPTIONS[provider.providerSlug] || 'External data source';

  const isPending = provider.status === 'pending';
  const isActive = provider.status === 'active';
  const isError = provider.status === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between px-4 py-3 hover:bg-gh-dark-700/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="text-sm font-medium text-white">
            {provider.displayName || provider.providerSlug}
          </div>
          <div className="text-xs text-gray-400">{description}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isActive && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <Check className="w-3.5 h-3.5" />
            Connected
          </span>
        )}
        {isError && (
          <span className="flex items-center gap-1 text-xs text-red-400">
            <AlertCircle className="w-3.5 h-3.5" />
            Error
          </span>
        )}
        {isPending && (
          <button
            onClick={() => onConnect(provider)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Connect
          </button>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// LOADING STATE
// =============================================================================

export function PendingProvidersLoading() {
  return (
    <div className="bg-gh-dark-800 rounded-xl border border-gh-dark-700 p-8">
      <div className="flex items-center justify-center gap-2 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading integrations...</span>
      </div>
    </div>
  );
}

// =============================================================================
// EXPORT
// =============================================================================

export default PendingProviders;
