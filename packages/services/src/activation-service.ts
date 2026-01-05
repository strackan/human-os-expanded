/**
 * Activation Key Service
 *
 * Handles generation, validation, and claiming of activation keys
 * for the Good Hang desktop client registration flow.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface ActivationKeyResult {
  code: string;
  expiresAt: Date;
  deepLink: string;
}

export interface ValidationResult {
  valid: boolean;
  sessionId?: string;
  preview?: {
    tier: string;
    archetypeHint: string;
  };
  error?: string;
}

export interface ClaimResult {
  success: boolean;
  error?: string;
}

export interface CreateActivationKeyOptions {
  sessionId: string;
  expiresInDays?: number;
}

export class ActivationKeyService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Generate a new activation key for a completed assessment session
   */
  async createKey(options: CreateActivationKeyOptions): Promise<ActivationKeyResult> {
    const { sessionId, expiresInDays = 7 } = options;

    const { data, error } = await this.supabase.rpc('create_activation_key', {
      p_session_id: sessionId,
      p_expires_in_days: expiresInDays,
    });

    if (error) {
      console.error('Failed to create activation key:', error);
      throw new Error(`Failed to create activation key: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No activation key returned from database');
    }

    const result = data[0];
    return {
      code: result.code,
      expiresAt: new Date(result.expires_at),
      deepLink: result.deep_link,
    };
  }

  /**
   * Validate an activation key without claiming it
   */
  async validateKey(code: string): Promise<ValidationResult> {
    const normalizedCode = code.toUpperCase().trim();

    const { data, error } = await this.supabase.rpc('validate_activation_key', {
      p_code: normalizedCode,
    });

    if (error) {
      console.error('Failed to validate activation key:', error);
      return {
        valid: false,
        error: 'Failed to validate activation code. Please try again.',
      };
    }

    if (!data || data.length === 0) {
      return {
        valid: false,
        error: 'Invalid activation code',
      };
    }

    const result = data[0];

    if (!result.valid) {
      return {
        valid: false,
        error: result.error || 'Invalid activation code',
      };
    }

    return {
      valid: true,
      sessionId: result.session_id,
      preview: {
        tier: result.tier || 'unknown',
        archetypeHint: result.archetype_hint || 'Your character awaits...',
      },
    };
  }

  /**
   * Claim an activation key for a user
   */
  async claimKey(code: string, userId: string): Promise<ClaimResult> {
    const normalizedCode = code.toUpperCase().trim();

    const { data, error } = await this.supabase.rpc('claim_activation_key', {
      p_code: normalizedCode,
      p_user_id: userId,
    });

    if (error) {
      console.error('Failed to claim activation key:', error);
      return {
        success: false,
        error: 'Failed to claim activation code. Please try again.',
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Failed to claim activation code',
      };
    }

    const result = data[0];

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to claim activation code',
      };
    }

    return { success: true };
  }

  /**
   * Get an activation key by code (for admin/debugging)
   */
  async getKey(code: string) {
    const normalizedCode = code.toUpperCase().trim();

    const { data, error } = await this.supabase
      .from('activation_keys')
      .select('*')
      .eq('code', normalizedCode)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * Revoke an activation key
   */
  async revokeKey(code: string): Promise<boolean> {
    const normalizedCode = code.toUpperCase().trim();

    const { error } = await this.supabase
      .from('activation_keys')
      .update({ status: 'revoked' })
      .eq('code', normalizedCode)
      .eq('status', 'pending');

    if (error) {
      console.error('Failed to revoke activation key:', error);
      return false;
    }

    return true;
  }

  /**
   * List keys for a session (admin)
   */
  async listKeysForSession(sessionId: string) {
    const { data, error } = await this.supabase
      .from('activation_keys')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to list activation keys:', error);
      return [];
    }

    return data || [];
  }
}
