import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useNavigate } from 'react-router-dom';
import ActivatePage from './routes/activate';
import SignupPage from './routes/signup';
import SigninPage from './routes/signin';
import AuthCallbackPage from './routes/auth-callback';
import ResultsPage from './routes/results';
import { useAuthStore } from './lib/stores/auth';

function App() {
  const navigate = useNavigate();
  const { isAuthenticated, checkSession } = useAuthStore();

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

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

  return (
    <div className="min-h-screen bg-gh-dark-900">
      {/* Window drag region for frameless window */}
      <div className="titlebar">
        <div className="titlebar-drag" />
      </div>

      <main className="pt-8">
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/results" replace />
              ) : (
                <Navigate to="/activate" replace />
              )
            }
          />
          <Route path="/activate" element={<ActivatePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signin" element={<SigninPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
