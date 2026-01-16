import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/stores/auth';
import { useUserStatusStore, getRecommendedRoute } from '@/lib/stores/user';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { clearSession, isAuthenticated, token, userId, product } = useAuthStore();
  const { status, loading, fetchStatus } = useUserStatusStore();

  // Fetch status if not loaded and authenticated
  useEffect(() => {
    if (isAuthenticated && token && !status && !loading) {
      fetchStatus(token, userId || undefined);
    }
  }, [isAuthenticated, token, status, loading, userId, fetchStatus]);

  // Auto-redirect based on user's products or activation product
  useEffect(() => {
    if (!loading && status?.found) {
      const route = getRecommendedRoute(status);
      // Only auto-redirect if it's a specific product route, not back to dashboard
      if (route !== '/dashboard' && route !== '/activate') {
        navigate(route, { replace: true });
      } else if (product) {
        // Fallback to product from activation if status doesn't have a specific route
        console.log('[Dashboard] Using activation product for routing:', product);
        if (product === 'founder_os') {
          navigate('/founder-os/onboarding', { replace: true });
        } else if (product === 'goodhang') {
          navigate('/goodhang/results', { replace: true });
        }
      }
    } else if (!loading && !status?.found && product) {
      // No status found but we have a product from activation
      console.log('[Dashboard] No status but have activation product:', product);
      if (product === 'founder_os') {
        navigate('/founder-os/onboarding', { replace: true });
      } else if (product === 'goodhang') {
        navigate('/goodhang/results', { replace: true });
      }
    }
  }, [loading, status, navigate, product]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gh-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading your products...</p>
        </motion.div>
      </div>
    );
  }

  const products = status?.products || {
    goodhang: { enabled: false, assessment: null },
    founder_os: { enabled: false, sculptor: null, identity_profile: null },
    voice_os: { enabled: false, context_files_count: 0 },
  };

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            {status?.user?.full_name && (
              <p className="text-gray-400">
                Welcome back, {status.user.full_name}
              </p>
            )}
          </div>
          <button
            onClick={() => clearSession()}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Good Hang */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`bg-gh-dark-800 rounded-2xl p-6 ${
              products.goodhang.enabled
                ? 'border border-gh-purple-500/30 cursor-pointer hover:border-gh-purple-500/60'
                : 'opacity-50'
            }`}
            onClick={() => products.goodhang.enabled && navigate('/goodhang/results')}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gh-purple-600/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gh-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">Good Hang</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Social assessment and community matching
            </p>
            {products.goodhang.assessment ? (
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    products.goodhang.assessment.completed
                      ? 'bg-green-600/20 text-green-400'
                      : 'bg-yellow-600/20 text-yellow-400'
                  }`}
                >
                  {products.goodhang.assessment.completed
                    ? products.goodhang.assessment.archetype || 'Completed'
                    : 'In Progress'}
                </span>
                {products.goodhang.assessment.tier && (
                  <span className="px-2 py-1 bg-gh-purple-600/20 text-gh-purple-400 rounded text-xs">
                    {products.goodhang.assessment.tier}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-500 text-sm">Not started</span>
            )}
          </motion.div>

          {/* Founder OS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gh-dark-800 rounded-2xl p-6 border border-blue-500/30 cursor-pointer hover:border-blue-500/60"
            onClick={() => navigate('/founder-os/onboarding')}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">Founder OS</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Personal operating system for founders
            </p>
            {products.founder_os.sculptor?.completed ||
            products.founder_os.identity_profile?.completed ? (
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">
                  Sculptor Complete
                </span>
                {products.founder_os.identity_profile?.annual_theme && (
                  <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">
                    {products.founder_os.identity_profile.annual_theme}
                  </span>
                )}
              </div>
            ) : products.founder_os.sculptor ? (
              <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs">
                Sculptor In Progress
              </span>
            ) : (
              <span className="text-gray-500 text-sm">
                {products.founder_os.enabled ? 'Ready to start' : 'Not enabled'}
              </span>
            )}
          </motion.div>

          {/* Voice OS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`bg-gh-dark-800 rounded-2xl p-6 ${
              products.voice_os.enabled
                ? 'border border-cyan-500/30'
                : 'opacity-50'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-600/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">Voice OS</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              AI-powered voice and writing synthesis
            </p>
            {products.voice_os.enabled ? (
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-cyan-600/20 text-cyan-400 rounded text-xs">
                  {products.voice_os.context_files_count} context files
                </span>
              </div>
            ) : (
              <span className="text-gray-500 text-sm">Coming soon</span>
            )}
          </motion.div>
        </div>

        {/* Entities & Contexts */}
        {status?.entities && status.entities.count > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-gh-dark-800 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Your Network
            </h3>
            <div className="flex gap-4">
              <div className="bg-gh-dark-900 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">
                  {status.entities.count}
                </div>
                <div className="text-gray-400 text-sm">Entities</div>
              </div>
              {status.contexts.available.length > 0 && (
                <div className="bg-gh-dark-900 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">
                    {status.contexts.available.length}
                  </div>
                  <div className="text-gray-400 text-sm">Contexts</div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
