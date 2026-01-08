import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  sessionId: string | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  checkSession: () => Promise<void>;
  setSession: (userId: string, sessionId: string, token: string) => void;
  clearSession: () => Promise<void>;
}

// In-memory token storage (cleared on app restart)
let memoryToken: string | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userId: null,
  sessionId: null,
  token: null,
  loading: true,
  error: null,

  checkSession: async () => {
    set({ loading: true, error: null });
    try {
      const session = await invoke<{ userId: string; sessionId: string } | null>(
        'get_session'
      );
      if (session) {
        set({
          isAuthenticated: true,
          userId: session.userId,
          sessionId: session.sessionId,
          token: memoryToken, // Restore from memory if available
          loading: false,
        });
      } else {
        set({ isAuthenticated: false, loading: false });
      }
    } catch (err) {
      console.error('Failed to check session:', err);
      set({ isAuthenticated: false, loading: false, error: String(err) });
    }
  },

  setSession: (userId, sessionId, token) => {
    memoryToken = token; // Store in memory
    set({ isAuthenticated: true, userId, sessionId, token, loading: false });
  },

  clearSession: async () => {
    try {
      await invoke('clear_session');
      memoryToken = null;
      set({
        isAuthenticated: false,
        userId: null,
        sessionId: null,
        token: null,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to clear session:', err);
    }
  },
}));
