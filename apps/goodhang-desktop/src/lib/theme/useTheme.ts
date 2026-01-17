/**
 * useTheme Hook
 *
 * Manages theme loading with remote fetch, caching, and offline fallback.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  THEME_BASE_URL,
  THEME_CACHE_PREFIX,
  THEME_CACHE_TTL,
  THEME_FETCH_TIMEOUT,
  type ThemeConfig,
  DEFAULT_THEME_CONFIG,
} from './constants';

// =============================================================================
// TYPES
// =============================================================================

interface CachedTheme {
  css: string;
  timestamp: number;
  version?: string;
}

interface UseThemeOptions {
  config?: Partial<ThemeConfig>;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface UseThemeReturn {
  isLoading: boolean;
  isRemoteLoaded: boolean;
  error: Error | null;
  refreshTheme: () => Promise<void>;
  clearCache: () => void;
}

// =============================================================================
// CACHE HELPERS
// =============================================================================

function getCacheKey(variant: string): string {
  return `${THEME_CACHE_PREFIX}${variant}`;
}

function getFromCache(variant: string): CachedTheme | null {
  try {
    const cached = localStorage.getItem(getCacheKey(variant));
    if (!cached) return null;

    const parsed: CachedTheme = JSON.parse(cached);
    const isExpired = Date.now() - parsed.timestamp > THEME_CACHE_TTL;

    if (isExpired) {
      localStorage.removeItem(getCacheKey(variant));
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function setToCache(variant: string, css: string, version?: string): void {
  try {
    const cached: CachedTheme = {
      css,
      timestamp: Date.now(),
      version,
    };
    localStorage.setItem(getCacheKey(variant), JSON.stringify(cached));
  } catch (err) {
    console.warn('[useTheme] Failed to cache theme:', err);
  }
}

// =============================================================================
// STYLE INJECTION
// =============================================================================

const STYLE_ID = 'gh-remote-theme';

function injectStyles(css: string): void {
  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = css;
}

function removeStyles(): void {
  const styleEl = document.getElementById(STYLE_ID);
  if (styleEl) {
    styleEl.remove();
  }
}

// =============================================================================
// FETCH WITH TIMEOUT
// =============================================================================

async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// =============================================================================
// HOOK
// =============================================================================

export function useTheme(options: UseThemeOptions = {}): UseThemeReturn {
  const { config: configOverride, onLoad, onError } = options;
  const config: ThemeConfig = { ...DEFAULT_THEME_CONFIG, ...configOverride };

  const [isLoading, setIsLoading] = useState(false);
  const [isRemoteLoaded, setIsRemoteLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRemoteTheme = useCallback(async () => {
    if (!config.enableRemote) {
      console.log('[useTheme] Remote themes disabled');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = getFromCache(config.variant);
      if (cached) {
        console.log('[useTheme] Using cached theme for:', config.variant);
        injectStyles(cached.css);
        setIsRemoteLoaded(true);
        setIsLoading(false);
        onLoad?.();

        // Still try to refresh in background
        refreshInBackground();
        return;
      }

      // Fetch from remote
      const url = config.remoteUrl || `${THEME_BASE_URL}/theme-${config.variant}.css`;
      console.log('[useTheme] Fetching remote theme:', url);

      const response = await fetchWithTimeout(url, THEME_FETCH_TIMEOUT);

      if (!response.ok) {
        throw new Error(`Failed to fetch theme: ${response.status}`);
      }

      const css = await response.text();
      const version = response.headers.get('x-theme-version') || undefined;

      // Cache and inject
      setToCache(config.variant, css, version);
      injectStyles(css);
      setIsRemoteLoaded(true);
      console.log('[useTheme] Remote theme loaded:', config.variant);
      onLoad?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.warn('[useTheme] Failed to load remote theme:', error.message);
      setError(error);
      onError?.(error);

      // Fall back to cached version if available (even if expired)
      try {
        const cacheKey = getCacheKey(config.variant);
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed: CachedTheme = JSON.parse(cached);
          console.log('[useTheme] Using expired cache as fallback');
          injectStyles(parsed.css);
          setIsRemoteLoaded(true);
        }
      } catch {
        // No fallback available, use base CSS
        console.log('[useTheme] No cache fallback, using base theme');
      }
    } finally {
      setIsLoading(false);
    }
  }, [config.enableRemote, config.variant, config.remoteUrl, onLoad, onError]);

  const refreshInBackground = useCallback(async () => {
    try {
      const url = config.remoteUrl || `${THEME_BASE_URL}/theme-${config.variant}.css`;
      const response = await fetchWithTimeout(url, THEME_FETCH_TIMEOUT);

      if (response.ok) {
        const css = await response.text();
        const version = response.headers.get('x-theme-version') || undefined;
        setToCache(config.variant, css, version);
        // Don't inject immediately - will be used on next load
        console.log('[useTheme] Background refresh complete');
      }
    } catch {
      // Silently fail background refresh
    }
  }, [config.variant, config.remoteUrl]);

  const clearCache = useCallback(() => {
    localStorage.removeItem(getCacheKey(config.variant));
    removeStyles();
    setIsRemoteLoaded(false);
    console.log('[useTheme] Cache cleared for:', config.variant);
  }, [config.variant]);

  // Load theme on mount
  useEffect(() => {
    fetchRemoteTheme();

    return () => {
      // Cleanup styles on unmount if needed
      // removeStyles(); // Uncomment if you want to remove on unmount
    };
  }, [fetchRemoteTheme]);

  return {
    isLoading,
    isRemoteLoaded,
    error,
    refreshTheme: fetchRemoteTheme,
    clearCache,
  };
}
