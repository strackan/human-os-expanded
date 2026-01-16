import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

interface GoodHangAssessment {
  completed: boolean;
  status: string;
  tier: string | null;
  archetype: string | null;
  overall_score: number | null;
  session_id: string | null;
}

interface SculptorStatus {
  completed: boolean;
  status: string;
  transcript_available: boolean;
}

interface IdentityProfile {
  completed: boolean;
  annual_theme: string | null;
  core_values: string[] | null;
}

interface UserStatus {
  found: boolean;
  user?: {
    id: string;
    email: string | null;
    full_name: string | null;
  };
  products: {
    goodhang: {
      enabled: boolean;
      assessment: GoodHangAssessment | null;
    };
    founder_os: {
      enabled: boolean;
      sculptor: SculptorStatus | null;
      identity_profile: IdentityProfile | null;
    };
    voice_os: {
      enabled: boolean;
      context_files_count: number;
    };
  };
  entities: {
    count: number;
    has_entity: boolean;
  };
  contexts: {
    available: string[];
    active: string | null;
  };
  recommended_action:
    | 'view_assessment'
    | 'start_onboarding'
    | 'continue_context'
    | 'complete_assessment';
}

interface UserStatusState {
  status: UserStatus | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchStatus: (token: string, userId?: string) => Promise<void>;
  clearStatus: () => void;
}

const defaultStatus: UserStatus = {
  found: false,
  products: {
    goodhang: { enabled: false, assessment: null },
    founder_os: { enabled: false, sculptor: null, identity_profile: null },
    voice_os: { enabled: false, context_files_count: 0 },
  },
  entities: { count: 0, has_entity: false },
  contexts: { available: [], active: null },
  recommended_action: 'start_onboarding',
};

export const useUserStatusStore = create<UserStatusState>((set) => ({
  status: null,
  loading: false,
  error: null,

  fetchStatus: async (token: string, userId?: string) => {
    set({ loading: true, error: null });
    console.log('[UserStatus] Fetching status for userId:', userId);

    try {
      // Call Tauri command to fetch user status
      const result = await invoke<UserStatus>('fetch_user_status', {
        token,
        userId,
      });

      console.log('[UserStatus] Result:', {
        found: result.found,
        founder_os_enabled: result.products?.founder_os?.enabled,
        sculptor_status: result.products?.founder_os?.sculptor,
        contexts_active: result.contexts?.active,
      });

      set({
        status: result,
        loading: false,
      });
    } catch (err) {
      console.error('[UserStatus] Failed to fetch user status:', err);
      set({
        status: defaultStatus,
        loading: false,
        error: String(err),
      });
    }
  },

  clearStatus: () => {
    set({ status: null, loading: false, error: null });
  },
}));

// Helper to determine where to route the user
export function getRecommendedRoute(status: UserStatus | null): string {
  if (!status || !status.found) {
    return '/activate';
  }

  const { products, recommended_action, contexts } = status;

  // Check GoodHang first
  if (products.goodhang.enabled && products.goodhang.assessment?.completed) {
    return '/goodhang/results';
  }

  // Check Founder OS
  if (products.founder_os.enabled) {
    const sculptor = products.founder_os.sculptor;
    const identity = products.founder_os.identity_profile;

    // If sculptor completed, check tutorial status
    if (sculptor?.completed && !identity?.completed) {
      // Check localStorage for tutorial completion
      const tutorialCompleted = localStorage.getItem('founder-os-tutorial-completed');
      if (!tutorialCompleted) {
        // Route to tutorial mode with session context
        const sessionId = contexts?.active;
        return sessionId
          ? `/founder-os/tutorial?session=${sessionId}`
          : '/founder-os/tutorial';
      }
      // Tutorial completed, go to onboarding for remaining steps
      return '/founder-os/onboarding';
    }

    if (identity?.completed) {
      return '/founder-os/dashboard';
    }

    return '/founder-os/onboarding';
  }

  // Default based on recommended action
  switch (recommended_action) {
    case 'view_assessment':
      return '/goodhang/results';
    case 'start_onboarding':
      return '/founder-os/onboarding';
    case 'continue_context':
      return '/founder-os/dashboard';
    case 'complete_assessment':
      return '/goodhang/assessment';
    default:
      return '/dashboard';
  }
}
