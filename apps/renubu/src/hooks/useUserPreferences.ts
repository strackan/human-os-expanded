/**
 * User Preferences Hook
 *
 * Manages user preferences with API persistence and localStorage fallback.
 * Handles loading, saving, and synchronizing preferences.
 *
 * Phase 2.4: User Preferences Integration
 */

import { useState, useEffect, useCallback } from 'react';

// =====================================================
// Types
// =====================================================

export interface UserPreferences {
  chat_shift_enter_to_submit?: boolean;
  chat_auto_focus?: boolean;
  theme?: 'light' | 'dark' | 'system';
  notifications_enabled?: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  chat_shift_enter_to_submit: false,
  chat_auto_focus: true,
  theme: 'light',
  notifications_enabled: true
};

const STORAGE_KEY = 'user_preferences';

// =====================================================
// useUserPreferences Hook
// =====================================================

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  // Load preferences from API with localStorage fallback
  const loadPreferences = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to load from API
      const response = await fetch('/api/user/preferences');

      if (response.ok) {
        const data = await response.json();
        const loadedPrefs = { ...DEFAULT_PREFERENCES, ...data.preferences };
        setPreferences(loadedPrefs);

        // Sync to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedPrefs));
      } else if (response.status === 404 || response.status === 401) {
        // API not available or user not authenticated - use localStorage
        loadFromLocalStorage();
      } else {
        throw new Error('Failed to load preferences');
      }
    } catch (err) {
      console.warn('[useUserPreferences] API error, falling back to localStorage:', err);
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  // Load from localStorage
  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (err) {
      console.error('[useUserPreferences] localStorage error:', err);
    }
  };

  // Update a single preference
  const updatePreference = useCallback(async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    // Optimistically update localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
    } catch (err) {
      console.error('[useUserPreferences] localStorage save error:', err);
    }

    // Try to persist to API
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });

      if (!response.ok) {
        console.warn('[useUserPreferences] API save failed, preference saved to localStorage only');
      }
    } catch (err) {
      console.warn('[useUserPreferences] API save error, preference saved to localStorage only:', err);
    } finally {
      setSaving(false);
    }
  }, [preferences]);

  // Update multiple preferences at once
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);

    // Optimistically update localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
    } catch (err) {
      console.error('[useUserPreferences] localStorage save error:', err);
    }

    // Try to persist to API
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        console.warn('[useUserPreferences] API save failed, preferences saved to localStorage only');
      }
    } catch (err) {
      console.warn('[useUserPreferences] API save error, preferences saved to localStorage only:', err);
    } finally {
      setSaving(false);
    }
  }, [preferences]);

  // Reset to defaults
  const resetPreferences = useCallback(async () => {
    setPreferences(DEFAULT_PREFERENCES);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES));
    } catch (err) {
      console.error('[useUserPreferences] localStorage reset error:', err);
    }

    // Try to reset on API
    try {
      await fetch('/api/user/preferences', {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('[useUserPreferences] API reset error:', err);
    }
  }, []);

  return {
    preferences,
    loading,
    error,
    saving,
    updatePreference,
    updatePreferences,
    resetPreferences,
    refresh: loadPreferences
  };
};

export default useUserPreferences;
