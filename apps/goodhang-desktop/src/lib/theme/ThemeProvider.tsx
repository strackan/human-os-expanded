/**
 * Theme Provider
 *
 * React context provider for theme management.
 * Wraps the app to provide theme loading and CSS variable access.
 */

import { createContext, useContext, type ReactNode } from 'react';
import { useTheme } from './useTheme';
import type { ThemeConfig, ThemeVariant } from './constants';

// =============================================================================
// CONTEXT
// =============================================================================

interface ThemeContextValue {
  isLoading: boolean;
  isRemoteLoaded: boolean;
  error: Error | null;
  variant: ThemeVariant;
  refreshTheme: () => Promise<void>;
  clearCache: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface ThemeProviderProps {
  children: ReactNode;
  config?: Partial<ThemeConfig>;
  /** Show loading state while theme loads */
  showLoadingState?: boolean;
  /** Custom loading component */
  loadingComponent?: ReactNode;
}

export function ThemeProvider({
  children,
  config,
  showLoadingState = false,
  loadingComponent,
}: ThemeProviderProps) {
  const { isLoading, isRemoteLoaded, error, refreshTheme, clearCache } = useTheme({
    config,
  });

  const value: ThemeContextValue = {
    isLoading,
    isRemoteLoaded,
    error,
    variant: config?.variant || 'default',
    refreshTheme,
    clearCache,
  };

  // Optionally show loading state
  if (showLoadingState && isLoading && !isRemoteLoaded) {
    return (
      <>
        {loadingComponent || (
          <div className="flex items-center justify-center h-screen bg-gh-dark-900">
            <div className="animate-pulse text-gray-400">Loading theme...</div>
          </div>
        )}
      </>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }

  return context;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { ThemeContext };
