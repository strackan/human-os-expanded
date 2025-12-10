/**
 * Usage Limits Service
 *
 * Enforces plan-based limits on resources and features.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface PlanLimits {
  maxEntities: number;
  maxContextFiles: number;
  maxApiCalls: number;
  features: string[];
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxEntities: 50,
    maxContextFiles: 100,
    maxApiCalls: 1000,
    features: ['basic'],
  },
  pro: {
    maxEntities: 500,
    maxContextFiles: 1000,
    maxApiCalls: 10000,
    features: ['basic', 'voice', 'graph'],
  },
  business: {
    maxEntities: -1, // unlimited
    maxContextFiles: -1, // unlimited
    maxApiCalls: -1, // unlimited
    features: ['basic', 'voice', 'graph', 'api', 'team'],
  },
};

export class UsageLimitsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get the current plan for a user
   */
  async getUserPlan(userId: string): Promise<string> {
    const { data } = await this.supabase
      .schema('human_os')
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    return data?.plan || 'free';
  }

  /**
   * Check if user is within their limit for a resource
   */
  async checkLimit(userId: string, resource: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    const limits = PLAN_LIMITS[plan];

    if (!limits) {
      return false;
    }

    const usage = await this.getCurrentUsage(userId);
    const currentUsage = usage[resource] || 0;

    switch (resource) {
      case 'entities': {
        return limits.maxEntities === -1 || currentUsage < limits.maxEntities;
      }
      case 'contextFiles': {
        return limits.maxContextFiles === -1 || currentUsage < limits.maxContextFiles;
      }
      case 'apiCalls': {
        return limits.maxApiCalls === -1 || currentUsage < limits.maxApiCalls;
      }
      default:
        return false;
    }
  }

  /**
   * Get current usage for a user
   */
  async getCurrentUsage(userId: string): Promise<Record<string, number>> {
    // Get entity count
    const { count: entityCount } = await this.supabase
      .from('entities')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId);

    // Get context file count
    const { count: fileCount } = await this.supabase
      .from('context_files')
      .select('*', { count: 'exact', head: true })
      .like('layer', `founder:${userId}%`);

    // Get API call count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: apiCallCount } = await this.supabase
      .schema('human_os')
      .from('api_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    return {
      entities: entityCount || 0,
      contextFiles: fileCount || 0,
      apiCalls: apiCallCount || 0,
    };
  }

  /**
   * Enforce a limit, throwing an error if exceeded
   */
  async enforceLimit(userId: string, resource: string): Promise<void> {
    const withinLimit = await this.checkLimit(userId, resource);

    if (!withinLimit) {
      const plan = await this.getUserPlan(userId);
      const limits = PLAN_LIMITS[plan];

      if (!limits) {
        throw new Error(`${resource} limit exceeded. Unknown plan: ${plan}.`);
      }

      const limitKey = `max${resource.charAt(0).toUpperCase()}${resource.slice(1)}` as keyof PlanLimits;
      const limit = limits[limitKey];

      throw new Error(
        `${resource} limit exceeded. Current plan: ${plan}, Limit: ${limit}. Please upgrade your plan.`
      );
    }
  }

  /**
   * Check if a feature is available for a user
   */
  async hasFeature(userId: string, feature: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    const limits = PLAN_LIMITS[plan];

    return limits?.features.includes(feature) || false;
  }

  /**
   * Record API usage
   */
  async recordApiUsage(userId: string, endpoint: string, method: string): Promise<void> {
    await this.supabase
      .schema('human_os')
      .from('api_usage')
      .insert({
        user_id: userId,
        endpoint,
        method,
        created_at: new Date().toISOString(),
      });
  }
}
