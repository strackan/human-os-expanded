/**
 * Authentication Middleware
 *
 * Validates API keys and extracts scopes for authorization.
 */

import type { Request, Response, NextFunction } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TABLES, type ApiKey } from '@human-os/core';

export interface AuthenticatedRequest extends Request {
  apiKey?: ApiKey;
  scopes?: string[];
}

/**
 * Create auth middleware with Supabase client
 */
export function createAuthMiddleware(supabase: SupabaseClient) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const apiKeyId = authHeader.slice(7); // Remove 'Bearer ' prefix

    // Validate API key format (hk_live_xxx or hk_test_xxx)
    if (!apiKeyId.startsWith('hk_')) {
      return res.status(401).json({ error: 'Invalid API key format' });
    }

    // Look up API key in database
    const { data: apiKey, error } = await supabase
      .from(TABLES.API_KEYS)
      .select('*')
      .eq('id', apiKeyId)
      .single();

    if (error || !apiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Check if key is active
    if (!apiKey.is_active) {
      return res.status(401).json({ error: 'API key is inactive' });
    }

    // Check if key has expired
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return res.status(401).json({ error: 'API key has expired' });
    }

    // Update last_used_at
    await supabase
      .from(TABLES.API_KEYS)
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyId);

    // Attach key info to request
    req.apiKey = {
      id: apiKey.id,
      ownerId: apiKey.owner_id,
      name: apiKey.name,
      scopes: apiKey.scopes || [],
      rateLimitPerMinute: apiKey.rate_limit_per_minute,
      isActive: apiKey.is_active,
      expiresAt: apiKey.expires_at,
      createdAt: apiKey.created_at,
      lastUsedAt: apiKey.last_used_at,
    };
    req.scopes = apiKey.scopes || [];

    return next();
  };
}

/**
 * Check if request has required scope
 */
export function requireScope(...requiredScopes: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const scopes = req.scopes || [];

    // Check if any required scope matches
    const hasScope = requiredScopes.some(required => {
      return scopes.some(scope => {
        // Exact match
        if (scope === required) return true;

        // Wildcard match (e.g., 'context:*:read' matches 'context:public:read')
        const scopeParts = scope.split(':');
        const requiredParts = required.split(':');

        if (scopeParts.length !== requiredParts.length) return false;

        return scopeParts.every((part, i) => part === '*' || part === requiredParts[i]);
      });
    });

    if (!hasScope) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: requiredScopes,
        available: scopes,
      });
    }

    return next();
  };
}
