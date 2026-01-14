import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useNavigate } from 'react-router-dom';
import ActivatePage from './routes/activate';
import SignupPage from './routes/signup';
import SigninPage from './routes/signin';
import AuthCallbackPage from './routes/auth-callback';
import ResultsPage from './routes/results';
import DashboardPage from './routes/dashboard';
import FounderOSOnboardingPage from './routes/founder-os/onboarding';
import QuestionEPage from './routes/founder-os/question-e';
import QuestionECompletePage from './routes/founder-os/question-e-complete';
import { useAuthStore } from './lib/stores/auth';
import { useUserStatusStore, getRecommendedRoute } from './lib/stores/user';

function App() {
  const navigate = useNavigate();
  const { isAuthenticated, checkSession, token, userId, loading: authLoading } = useAuthStore();
  const { status, fetchStatus, loading: statusLoading } = useUserStatusStore();

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Fetch user status when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchStatus(token, userId || undefined);
    }
  }, [isAuthenticated, token, userId, fetchStatus]);

  // Listen for deep link activation codes
  useEffect(() => {
    const unlisten = listen<string>('activation-code', (event) => {
      const code = event.payload;
      navigate(`/activate?code=${encodeURIComponent(code)}`);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [navigate]);

  // Determine where to redirect authenticated users
  const getAuthenticatedRedirect = () => {
    if (statusLoading) {
      // Still loading status - go to dashboard which will handle loading state
      return '/dashboard';
    }
    if (status?.found) {
      return getRecommendedRoute(status);
    }
    // Default to dashboard if no status found
    return '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gh-dark-900">
      {/* Window drag region for frameless window */}
      <div className="titlebar">
        <div className="titlebar-drag" />
      </div>

      <main className="pt-8">
        <Routes>
          {/* Root redirect based on auth and product status */}
          <Route
            path="/"
            element={
              authLoading ? (
                <div className="flex min-h-screen items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : isAuthenticated ? (
                <Navigate to={getAuthenticatedRedirect()} replace />
              ) : (
                <Navigate to="/activate" replace />
              )
            }
          />

          {/* Auth flow */}
          <Route path="/activate" element={<ActivatePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signin" element={<SigninPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Dashboard - product selector */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* GoodHang routes */}
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/goodhang/results" element={<ResultsPage />} />

          {/* Founder OS routes */}
          <Route path="/founder-os/onboarding" element={<FounderOSOnboardingPage />} />
          <Route path="/founder-os/dashboard" element={<FounderOSOnboardingPage />} />
          <Route path="/founder-os/question-e" element={<QuestionEPage />} />
          <Route path="/founder-os/question-e-complete" element={<QuestionECompletePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
