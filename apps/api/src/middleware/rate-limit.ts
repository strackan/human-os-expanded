/**
 * Rate Limiting Middleware
 *
 * Simple in-memory rate limiter based on API key limits.
 */

import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

/**
 * Rate limit middleware
 */
export function rateLimit() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return next();
    }

    const keyId = req.apiKey.id;
    const limit = req.apiKey.rateLimitPerMinute || 100;
    const now = Date.now();
    const windowMs = 60000; // 1 minute

    let entry = rateLimitStore.get(keyId);

    if (!entry || entry.resetAt < now) {
      // Start new window
      entry = {
        count: 1,
        resetAt: now + windowMs,
      };
      rateLimitStore.set(keyId, entry);
    } else {
      entry.count++;
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

    if (entry.count > limit) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
    }

    next();
  };
}
