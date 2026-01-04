/**
 * Demo Mode Configuration
 *
 * Auto-enables demo mode for localhost development, disables for production domains.
 * Provides centralized demo mode detection and safety checks.
 */

export interface DemoModeConfig {
  enabled: boolean;
  userId: string;
  userEmail: string;
  reason: string;
}

/**
 * Check if demo mode should be enabled based on URL and environment
 *
 * Rules:
 * 1. Localhost/127.0.0.1 = Auto-enable (unless explicitly disabled)
 * 2. Production domains (renubu.com, renubu.demo, vercel.app) = Force disable
 * 3. Staging/preview = Respect NEXT_PUBLIC_DEMO_MODE env var
 * 4. Service role key only used on localhost
 */
export function getDemoModeConfig(): DemoModeConfig {
  // Server-side: Can't access window.location
  if (typeof window === 'undefined') {
    const envDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const nodeEnv = process.env.NODE_ENV;

    // Never enable in production builds
    if (nodeEnv === 'production' && !process.env.NEXT_PUBLIC_ALLOW_DEMO_IN_PROD) {
      return {
        enabled: false,
        userId: '',
        userEmail: '',
        reason: 'Production environment - demo mode disabled',
      };
    }

    // Otherwise respect env var for server-side
    return {
      enabled: envDemoMode,
      userId: process.env.NEXT_PUBLIC_DEMO_USER_ID || 'd152cc6c-8d71-4816-9b96-eccf249ed0ac',
      userEmail: 'justin@renubu.com',
      reason: envDemoMode ? 'Server-side demo mode enabled via env var' : 'Server-side demo mode disabled',
    };
  }

  // Client-side: Check URL
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
  const isProduction = hostname.includes('renubu.com') ||
                      hostname.includes('renubu.demo') ||
                      (hostname.includes('vercel.app') && !hostname.includes('preview'));

  // Explicit disable via env var
  const explicitDisable = process.env.NEXT_PUBLIC_DEMO_MODE === 'false';

  // Production domains: Force disable
  if (isProduction) {
    return {
      enabled: false,
      userId: '',
      userEmail: '',
      reason: `Production domain (${hostname}) - demo mode force disabled`,
    };
  }

  // Localhost: Auto-enable unless explicitly disabled
  if (isLocalhost) {
    const enabled = !explicitDisable;
    return {
      enabled,
      userId: process.env.NEXT_PUBLIC_DEMO_USER_ID || 'd152cc6c-8d71-4816-9b96-eccf249ed0ac',
      userEmail: 'justin@renubu.com',
      reason: enabled
        ? `Localhost detected - demo mode auto-enabled`
        : 'Localhost but explicitly disabled via env var',
    };
  }

  // Staging/preview: Respect env var
  const envDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  return {
    enabled: envDemoMode,
    userId: process.env.NEXT_PUBLIC_DEMO_USER_ID || 'd152cc6c-8d71-4816-9b96-eccf249ed0ac',
    userEmail: 'justin@renubu.com',
    reason: envDemoMode
      ? `Staging/preview (${hostname}) - demo mode enabled via env var`
      : `Staging/preview (${hostname}) - demo mode disabled`,
  };
}

/**
 * Check if service role key should be used (server-side only)
 *
 * Only uses service role key if:
 * 1. Demo mode is enabled
 * 2. We're in development (not production)
 * 3. Service role key is available
 */
export function shouldUseServiceRoleKey(): boolean {
  // Client-side: Never use service role key
  if (typeof window !== 'undefined') {
    return false;
  }

  const demoConfig = getDemoModeConfig();

  // Not in demo mode
  if (!demoConfig.enabled) {
    return false;
  }

  // Production: Never use service role key even in demo mode
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_ALLOW_DEMO_IN_PROD) {
    console.warn('⚠️ Demo mode requested in production but service role key usage is blocked');
    return false;
  }

  // Service role key not available
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return false;
  }

  return true;
}

/**
 * Get demo mode status for logging
 */
export function getDemoModeStatus(): string {
  const config = getDemoModeConfig();
  return config.enabled
    ? `🎮 DEMO MODE: ${config.reason}`
    : `🔒 NORMAL MODE: ${config.reason}`;
}
