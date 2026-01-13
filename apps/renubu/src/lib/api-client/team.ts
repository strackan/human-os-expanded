/**
 * Team API Client
 *
 * Operations for team member management.
 */

import { apiFetch } from './index';
import { API_ROUTES } from '@/lib/constants/api-routes';
import type { TeamMember, ApiResponse } from './types';

// =====================================================
// Response Types
// =====================================================

interface TeamMembersResponse {
  members: TeamMember[];
}

// =====================================================
// Team API
// =====================================================

export const teamApi = {
  /**
   * List team members
   * Supports search parameter for filtering
   */
  async listMembers(search?: string): Promise<ApiResponse<TeamMembersResponse>> {
    return apiFetch<TeamMembersResponse>(API_ROUTES.TEAM.MEMBERS, {
      params: search ? { search } : undefined,
    });
  },

  /**
   * Invite a team member
   */
  async invite(email: string, role?: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiFetch<{ success: boolean }>(API_ROUTES.TEAM.INVITE, {
      method: 'POST',
      body: { email, role },
    });
  },

  /**
   * Promote a team member to admin
   */
  async promote(userId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiFetch<{ success: boolean }>(API_ROUTES.TEAM.PROMOTE(userId), {
      method: 'POST',
    });
  },

  /**
   * Disable a team member
   */
  async disable(userId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiFetch<{ success: boolean }>(API_ROUTES.TEAM.DISABLE(userId), {
      method: 'POST',
    });
  },
};
