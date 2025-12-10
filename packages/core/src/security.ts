/**
 * Security Layer for Human OS
 *
 * Provides input sanitization, validation, rate limiting, and audit logging
 * to protect against vulnerabilities in MCP integrations.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Result of a validation check
 */
export interface ValidationResult {
  valid: boolean;
  issues: string[];
}

/**
 * Configuration for rate limiting
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  count: number;
  resetAt: number;
  remaining: number;
}

/**
 * SecurityLayer provides security controls for Human OS operations
 */
export class SecurityLayer {
  private rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(
    private supabase: SupabaseClient,
    private config: { defaultRateLimit: RateLimitConfig } = {
      defaultRateLimit: { maxRequests: 100, windowMs: 60000 },
    }
  ) {}

  /**
   * Sanitize input to prevent injection attacks
   * Addresses the 43% vulnerability rate in MCP inputs
   */
  sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Normalize unicode to prevent homograph attacks
    let sanitized = input.normalize('NFKC');

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Remove control characters (except newline, tab, carriage return)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Remove potential command injection patterns
    sanitized = sanitized.replace(/[;`$(){}[\]<>|&]/g, '');

    // Limit consecutive special characters
    sanitized = sanitized.replace(/([^a-zA-Z0-9\s])\1{3,}/g, '$1$1');

    // Trim excessive whitespace
    sanitized = sanitized.trim().replace(/\s+/g, ' ');

    return sanitized;
  }

  /**
   * Validate wiki links in content to prevent path traversal and injection
   */
  validateWikiLinks(content: string): ValidationResult {
    const issues: string[] = [];

    const wikiLinkPattern = /\[\[([^\]]+)\]\]/g;
    const matches = content.matchAll(wikiLinkPattern);

    for (const match of matches) {
      const linkText = match[1];
      if (!linkText) continue;

      // Check for path traversal attempts
      if (linkText.includes('..') || linkText.includes('./') || linkText.includes('.\\')) {
        issues.push(`Wiki link contains path traversal pattern: [[${linkText}]]`);
      }

      // Check for absolute paths
      if (linkText.startsWith('/') || /^[a-zA-Z]:\\/.test(linkText)) {
        issues.push(`Wiki link contains absolute path: [[${linkText}]]`);
      }

      // Check for protocol injection
      if (/^[a-z]+:/i.test(linkText)) {
        issues.push(`Wiki link contains protocol: [[${linkText}]]`);
      }

      // Check for HTML/script injection
      if (/<script|<iframe|<object|<embed|javascript:/i.test(linkText)) {
        issues.push(`Wiki link contains potentially malicious content: [[${linkText}]]`);
      }

      // Check for null bytes
      if (linkText.includes('\0')) {
        issues.push(`Wiki link contains null byte: [[${linkText}]]`);
      }

      // Check for excessively long links
      if (linkText.length > 500) {
        issues.push(`Wiki link exceeds maximum length (500 chars): [[${linkText.substring(0, 50)}...]]`);
      }

      // Check for control characters
      if (/[\x00-\x1F\x7F]/.test(linkText)) {
        issues.push(`Wiki link contains control characters: [[${linkText}]]`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Check rate limit for a user/API key performing an action
   */
  async checkRateLimit(identifier: string, action: string): Promise<boolean> {
    const key = `${identifier}:${action}`;
    const now = Date.now();
    const limit = this.config.defaultRateLimit;

    let state = this.rateLimitStore.get(key);

    if (!state || now >= state.resetAt) {
      state = {
        count: 0,
        resetAt: now + limit.windowMs,
      };
      this.rateLimitStore.set(key, state);
    }

    state.count++;

    if (state.count > limit.maxRequests) {
      return false;
    }

    // Clean up expired entries periodically
    if (this.rateLimitStore.size > 10000) {
      for (const [storeKey, storeState] of this.rateLimitStore.entries()) {
        if (now >= storeState.resetAt) {
          this.rateLimitStore.delete(storeKey);
        }
      }
    }

    return true;
  }

  /**
   * Log sensitive operations for audit trail
   */
  async auditLog(
    userId: string,
    action: string,
    details: Record<string, unknown>
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .schema('human_os')
        .from('usage_events')
        .insert({
          user_id: userId,
          event_type: 'audit',
          metadata: {
            ...details,
            timestamp: new Date().toISOString(),
            action,
          },
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to write audit log:', error);
      }
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }

  /**
   * Validate that a user has required API key scopes
   */
  validateScopes(requiredScopes: string[], userScopes: string[]): boolean {
    if (!requiredScopes || requiredScopes.length === 0) {
      return true;
    }

    if (!userScopes || userScopes.length === 0) {
      return false;
    }

    if (userScopes.includes('*')) {
      return true;
    }

    for (const requiredScope of requiredScopes) {
      let hasScope = false;

      for (const userScope of userScopes) {
        // Exact match
        if (userScope === requiredScope) {
          hasScope = true;
          break;
        }

        // Wildcard match (e.g., "context:*" matches "context:read")
        if (userScope.endsWith(':*')) {
          const scopePrefix = userScope.slice(0, -1);
          if (requiredScope.startsWith(scopePrefix)) {
            hasScope = true;
            break;
          }
        }

        // Hierarchical wildcard
        if (userScope.includes(':*')) {
          const pattern = userScope.replace(':*', ':');
          if (requiredScope.startsWith(pattern)) {
            hasScope = true;
            break;
          }
        }
      }

      if (!hasScope) {
        return false;
      }
    }

    return true;
  }

  /**
   * Reset rate limit state for an identifier
   */
  resetRateLimit(identifier: string, action?: string): void {
    if (action) {
      const key = `${identifier}:${action}`;
      this.rateLimitStore.delete(key);
    } else {
      for (const key of this.rateLimitStore.keys()) {
        if (key.startsWith(`${identifier}:`)) {
          this.rateLimitStore.delete(key);
        }
      }
    }
  }

  /**
   * Get current rate limit status for an identifier
   */
  getRateLimitStatus(identifier: string, action: string): RateLimitStatus | null {
    const key = `${identifier}:${action}`;
    const state = this.rateLimitStore.get(key);

    if (!state) {
      return null;
    }

    const limit = this.config.defaultRateLimit;
    return {
      count: state.count,
      resetAt: state.resetAt,
      remaining: Math.max(0, limit.maxRequests - state.count),
    };
  }
}
