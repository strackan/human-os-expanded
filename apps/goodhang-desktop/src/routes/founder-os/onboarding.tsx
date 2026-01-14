import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/stores/auth';
import { useUserStatusStore } from '@/lib/stores/user';

export default function FounderOSOnboardingPage() {
  const navigate = useNavigate();
  const { clearSession } = useAuthStore();
  const { status, loading } = useUserStatusStore();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Preparing your Founder OS...</p>
        </motion.div>
      </div>
    );
  }

  const founderOS = status?.products.founder_os;
  const sculptor = founderOS?.sculptor;
  const identityProfile = founderOS?.identity_profile;
  const userName = status?.user?.full_name || 'Founder';

  // Check if Question E is completed
  const questionECompleted = (() => {
    try {
      const stored = localStorage.getItem('question-e-answers');
      if (stored) {
        const data = JSON.parse(stored);
        return data.completedAt && data.answers?.length > 0;
      }
    } catch {
      // ignore
    }
    return false;
  })();

  // Determine current stage
  const getStage = () => {
    if (identityProfile?.completed) return 'ready';
    if (questionECompleted) return 'polishing';
    if (sculptor?.completed) return 'question-e';
    if (sculptor && !sculptor.completed) return 'sculpting';
    return 'intro';
  };

  const stage = getStage();

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <button
            onClick={() => clearSession()}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Main Content */}
        <div className="text-center">
          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 mx-auto mb-8 flex items-center justify-center"
          >
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold text-white mb-4"
          >
            {stage === 'intro' && `Welcome, ${userName}`}
            {stage === 'sculpting' && 'The Sculptor Awaits'}
            {stage === 'question-e' && 'Personality Baseline'}
            {stage === 'polishing' && 'Almost Ready'}
            {stage === 'ready' && `Welcome Back, ${userName}`}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 mb-12"
          >
            {stage === 'intro' &&
              'Your personal operating system is being prepared...'}
            {stage === 'sculpting' &&
              'Continue your Sculptor interview to unlock your Founder OS'}
            {stage === 'question-e' &&
              'Complete Question E to calibrate your support protocols'}
            {stage === 'polishing' &&
              'Your identity profile is being finalized'}
            {stage === 'ready' && 'Your Founder OS is ready'}
          </motion.p>

          {/* Progress/Status Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4 mb-12"
          >
            {/* Sculptor Status */}
            <div
              className={`bg-gh-dark-800 rounded-xl p-6 text-left ${
                sculptor?.completed ? 'border border-green-500/30' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      sculptor?.completed
                        ? 'bg-green-600/20'
                        : sculptor
                        ? 'bg-yellow-600/20'
                        : 'bg-gray-700'
                    }`}
                  >
                    {sculptor?.completed ? (
                      <svg
                        className="w-6 h-6 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <span className="text-gray-400">1</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      The Sculptor Interview
                    </h3>
                    <p className="text-sm text-gray-400">
                      {sculptor?.completed
                        ? 'Clarification complete'
                        : sculptor
                        ? `${sculptor.status} - ${sculptor.transcript_available ? 'Transcript available' : 'In progress'}`
                        : 'Theatrical identity clarification'}
                    </p>
                  </div>
                </div>
                {sculptor?.completed && (
                  <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                    Complete
                  </span>
                )}
              </div>
            </div>

            {/* Question E Status */}
            <div
              className={`bg-gh-dark-800 rounded-xl p-6 text-left ${
                questionECompleted ? 'border border-green-500/30' : sculptor?.completed ? 'border border-blue-500/30' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      questionECompleted
                        ? 'bg-green-600/20'
                        : sculptor?.completed
                        ? 'bg-blue-600/20'
                        : 'bg-gray-700'
                    }`}
                  >
                    {questionECompleted ? (
                      <svg
                        className="w-6 h-6 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <span className={sculptor?.completed ? 'text-blue-400' : 'text-gray-400'}>2</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Question E: Personality Baseline</h3>
                    <p className="text-sm text-gray-400">
                      {questionECompleted
                        ? 'Baseline captured'
                        : sculptor?.completed
                        ? 'Ready to begin - 24 questions'
                        : 'Decision-making, energy, crisis patterns'}
                    </p>
                  </div>
                </div>
                {questionECompleted ? (
                  <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                    Complete
                  </span>
                ) : sculptor?.completed ? (
                  <button
                    onClick={() => navigate('/founder-os/question-e')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Start
                  </button>
                ) : null}
              </div>
            </div>

            {/* Identity Profile Status */}
            <div
              className={`bg-gh-dark-800 rounded-xl p-6 text-left ${
                identityProfile?.completed ? 'border border-green-500/30' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      identityProfile?.completed
                        ? 'bg-green-600/20'
                        : 'bg-gray-700'
                    }`}
                  >
                    {identityProfile?.completed ? (
                      <svg
                        className="w-6 h-6 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <span className="text-gray-400">3</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Identity Profile</h3>
                    <p className="text-sm text-gray-400">
                      {identityProfile?.completed
                        ? identityProfile.annual_theme || 'Profile complete'
                        : 'Core values and themes'}
                    </p>
                  </div>
                </div>
                {identityProfile?.completed && (
                  <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                    Complete
                  </span>
                )}
              </div>
            </div>

            {/* Onboarding Call */}
            <div className="bg-gh-dark-800 rounded-xl p-6 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-400">4</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Onboarding Call</h3>
                    <p className="text-sm text-gray-400">
                      Schedule your personalized setup session
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-gray-700 text-gray-400 rounded-full text-sm">
                  Coming Soon
                </span>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {stage === 'ready' ? (
              <button
                onClick={() => {
                  // TODO: Open Founder OS context or MCP
                }}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-lg transition-colors"
              >
                Open Founder OS
              </button>
            ) : stage === 'question-e' ? (
              <div className="space-y-4">
                <p className="text-gray-500 text-sm">
                  Complete Question E to build your personality baseline. This enables effective support.
                </p>
                <button
                  onClick={() => navigate('/founder-os/question-e')}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-lg transition-colors"
                >
                  Start Question E Assessment
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-500 text-sm">
                  {stage === 'intro'
                    ? 'Your Founder OS will be configured after completing The Sculptor interview.'
                    : stage === 'polishing'
                    ? 'Question E complete. Your identity profile is being finalized.'
                    : 'Complete the remaining steps to unlock your full Founder OS experience.'}
                </p>
                <button
                  disabled
                  className="px-8 py-4 bg-gray-700 text-gray-400 font-medium rounded-lg text-lg cursor-not-allowed"
                >
                  {stage === 'sculpting'
                    ? 'Continue Sculptor Interview'
                    : stage === 'polishing'
                    ? 'Finalizing Profile...'
                    : 'Setup In Progress...'}
                </button>
              </div>
            )}
          </motion.div>

          {/* Core Values Preview */}
          {identityProfile?.core_values &&
            identityProfile.core_values.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12 bg-gh-dark-800/50 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">
                  Your Core Values
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {identityProfile.core_values.map((value, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-full"
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
        </div>
      </motion.div>
    </div>
  );
}
