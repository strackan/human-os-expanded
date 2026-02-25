/**
 * User API Client
 *
 * Operations for user profile and preferences.
 */

import { apiFetch } from './index';
import { API_ROUTES } from '@/lib/constants/api-routes';
import type { UserProfile, ApiResponse } from './types';

// =====================================================
// User API
// =====================================================

export const userApi = {
  /**
   * Get current user's profile
   * Used by WelcomeMessage and other components that need user info
   */
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return apiFetch<UserProfile>('/api/user/profile');
  },

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<ApiResponse<Record<string, unknown>>> {
    return apiFetch<Record<string, unknown>>(API_ROUTES.USER.PREFERENCES);
  },

  /**
   * Update user preferences
   */
  async updatePreferences(
    preferences: Record<string, unknown>
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return apiFetch<Record<string, unknown>>(API_ROUTES.USER.PREFERENCES, {
      method: 'PUT',
      body: preferences,
    });
  },

  /**
   * Update profile name
   */
  async updateProfileName(name: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiFetch<{ success: boolean }>(API_ROUTES.USER.UPDATE_PROFILE_NAME, {
      method: 'POST',
      body: { name },
    });
  },
};
