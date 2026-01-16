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
import WelcomeFlowPage from './routes/founder-os/welcome';
import TutorialModePage from './routes/founder-os/tutorial';
import QuestionEPage from './routes/founder-os/question-e';
import QuestionECompletePage from './routes/founder-os/question-e-complete';
import RenubuChatPage from './routes/founder-os/renubu-chat';
import { useAuthStore } from './lib/stores/auth';
import { useUserStatusStore, getRecommendedRoute } from './lib/stores/user';

function App() {
  const navigate = useNavigate();
  const { isAuthenticated, checkSession, token, userId, product, loading: authLoading } = useAuthStore();
  const { status, fetchStatus, loading: statusLoading } = useUserStatusStore();

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Fetch user status when authenticated AND we have a token
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
  // Note: This is only called after status has finished loading
  const getAuthenticatedRedirect = () => {
    // If we have status info, use it for routing
    if (status?.found) {
      const recommendedRoute = getRecommendedRoute(status);
      // If recommended route is dashboard but we have a product from activation,
      // use the product-specific route instead
      if (recommendedRoute === '/dashboard' && product) {
        console.log('[App] Overriding dashboard route with product from activation:', product);
        if (product === 'founder_os') {
          return '/founder-os/onboarding';
        } else if (product === 'goodhang') {
          return '/goodhang/results';
        }
      }
      return recommendedRoute;
    }
    // If we have product from device registration, route based on product
    if (product) {
      console.log('[App] Using product from device registration:', product);
      if (product === 'founder_os') {
        return '/founder-os/onboarding';
      } else if (product === 'goodhang') {
        return '/goodhang/results';
      }
    }
    // Default to dashboard
    return '/dashboard';
  };

  // Show loading while auth or status is loading
  const isLoading = authLoading || (isAuthenticated && token && statusLoading);

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
              isLoading ? (
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
          <Route path="/founder-os/tutorial" element={<TutorialModePage />} />
          <Route path="/founder-os/welcome" element={<WelcomeFlowPage />} />
          <Route path="/founder-os/onboarding" element={<FounderOSOnboardingPage />} />
          <Route path="/founder-os/dashboard" element={<FounderOSOnboardingPage />} />
          <Route path="/founder-os/question-e" element={<QuestionEPage />} />
          <Route path="/founder-os/question-e-complete" element={<QuestionECompletePage />} />
          <Route path="/founder-os/renubu-chat" element={<RenubuChatPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
