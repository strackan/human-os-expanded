import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { createClient } from '@supabase/supabase-js';
import {
  getDeviceRegistration,
  clearDeviceRegistration,
  validateActivationKey,
  storeDeviceRegistration,
  type ProductType
} from '../tauri';

// Initialize Supabase client for token refresh
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  sessionId: string | null;
  token: string | null;
  product: ProductType | null;
  loading: boolean;
  error: string | null;

  // Actions
  checkSession: () => Promise<void>;
  setSession: (userId: string, sessionId: string, token: string) => void;
  clearSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userId: null,
  sessionId: null,
  token: null,
  product: null,
  loading: true,
  error: null,

  checkSession: async () => {
    set({ loading: true, error: null });
    try {
      console.log('[Auth] Checking for device registration...');

      // First check for device registration (permanent storage)
      const registration = await getDeviceRegistration();

      if (registration) {
        console.log('[Auth] Device registration found:', {
          userId: registration.userId,
          product: registration.product,
          hasRefreshToken: !!registration.refreshToken
        });

        // Validate the activation code is still valid
        console.log('[Auth] Validating activation code...');
        const validation = await validateActivationKey(registration.activationCode);

        if (validation.valid) {
          console.log('[Auth] Activation code still valid');

          // Try to refresh the Supabase session using stored refresh token
          if (registration.refreshToken) {
            console.log('[Auth] Refreshing Supabase session...');
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
              refresh_token: registration.refreshToken
            });

            if (refreshData?.session) {
              console.log('[Auth] Session refreshed successfully');
              const newToken = refreshData.session.access_token;
              const newRefreshToken = refreshData.session.refresh_token;

              // Update stored refresh token if it changed
              if (newRefreshToken && newRefreshToken !== registration.refreshToken) {
                console.log('[Auth] Updating stored refresh token');
                await storeDeviceRegistration(
                  registration.activationCode,
                  registration.userId,
                  registration.product as ProductType,
                  newRefreshToken
                );
              }

              set({
                isAuthenticated: true,
                userId: registration.userId,
                sessionId: validation.sessionId || null,
                token: newToken,
                product: registration.product as ProductType,
                loading: false,
              });
              return;
            } else {
              console.warn('[Auth] Failed to refresh session:', refreshError?.message);
              // Continue without token - user may need to re-authenticate for some features
            }
          }

          // Device is registered but no valid token - still authenticated but limited
          set({
            isAuthenticated: true,
            userId: registration.userId,
            sessionId: validation.sessionId || null,
            token: null,
            product: registration.product as ProductType,
            loading: false,
          });
          return;
        } else {
          console.log('[Auth] Activation code no longer valid, clearing registration');
          await clearDeviceRegistration();
        }
      }

      // Fall back to checking session (for backwards compatibility)
      console.log('[Auth] Checking for existing session...');
      const session = await invoke<{ userId: string; sessionId: string; token: string } | null>(
        'get_session'
      );
      if (session) {
        console.log('[Auth] Session found:', { userId: session.userId, hasToken: !!session.token });
        set({
          isAuthenticated: true,
          userId: session.userId,
          sessionId: session.sessionId,
          token: session.token,
          product: null,
          loading: false,
        });
      } else {
        console.log('[Auth] No session found');
        set({ isAuthenticated: false, loading: false });
      }
    } catch (err) {
      console.error('[Auth] Failed to check session:', err);
      set({ isAuthenticated: false, loading: false, error: String(err) });
    }
  },

  setSession: (userId, sessionId, token) => {
    console.log('[Auth] Setting session:', { userId, hasToken: !!token });
    set({ isAuthenticated: true, userId, sessionId, token, loading: false });
  },

  clearSession: async () => {
    try {
      // Clear both session and device registration
      await invoke('clear_session');
      await clearDeviceRegistration();
      set({
        isAuthenticated: false,
        userId: null,
        sessionId: null,
        token: null,
        product: null,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to clear session:', err);
    }
  },
}));
