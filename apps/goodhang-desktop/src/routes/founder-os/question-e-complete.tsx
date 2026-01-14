/**
 * Question E Complete - Assessment completion screen
 *
 * Shows summary and next steps after completing the personality baseline
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface StoredAnswers {
  answers: Array<{
    questionId: string;
    answer: string;
    timestamp: number;
  }>;
  completedAt: string;
  entitySlug: string;
}

export default function QuestionECompletePage() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<StoredAnswers | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('question-e-answers');
    if (stored) {
      setAnswers(JSON.parse(stored));
    }
  }, []);

  const totalQuestions = 24;
  const answeredCount = answers?.answers.filter((a) => a.answer !== '[SKIPPED]').length || 0;
  const skippedCount = answers?.answers.filter((a) => a.answer === '[SKIPPED]').length || 0;

  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl text-center"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-green-600/20 mx-auto mb-8 flex items-center justify-center"
        >
          <svg
            className="w-12 h-12 text-green-400"
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
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-4"
        >
          Question E Complete
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 text-lg mb-8"
        >
          Your personality baseline has been captured. This helps us support you effectively.
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-8 mb-8"
        >
          <div className="bg-gh-dark-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{answeredCount}</div>
            <div className="text-gray-400 text-sm">Questions Answered</div>
          </div>
          {skippedCount > 0 && (
            <div className="bg-gh-dark-800 rounded-xl p-4">
              <div className="text-2xl font-bold text-yellow-400">{skippedCount}</div>
              <div className="text-gray-400 text-sm">Skipped</div>
            </div>
          )}
        </motion.div>

        {/* What happens next */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-gh-dark-800/50 rounded-xl p-6 mb-8 text-left"
        >
          <h3 className="font-semibold text-white mb-4">What happens next:</h3>
          <ul className="space-y-3 text-gray-400">
            <li className="flex items-start gap-3">
              <span className="text-blue-400 mt-1">1.</span>
              <span>
                Your answers are being processed to update your identity files
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400 mt-1">2.</span>
              <span>
                Founder-OS protocols will be calibrated to your communication preferences
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400 mt-1">3.</span>
              <span>
                Crisis and recovery patterns will be added to support protocols
              </span>
            </li>
          </ul>
        </motion.div>

        {/* Files being updated */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-left mb-8"
        >
          <h3 className="font-semibold text-white mb-3">Files being updated:</h3>
          <div className="flex flex-wrap gap-2">
            {[
              'cognitive-profile.md',
              'communication.md',
              'CONVERSATION_PROTOCOLS.md',
              'CRISIS_PROTOCOLS.md',
              'CURRENT_STATE.md',
            ].map((file) => (
              <span
                key={file}
                className="px-3 py-1 bg-gh-dark-800 text-gray-400 rounded-full text-sm"
              >
                {file}
              </span>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-3"
        >
          <button
            onClick={() => navigate('/founder-os/onboarding')}
            className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-lg transition-colors"
          >
            Return to Founder OS
          </button>
          <button
            onClick={() => {
              // Export answers as JSON for manual processing
              const blob = new Blob(
                [JSON.stringify(answers, null, 2)],
                { type: 'application/json' }
              );
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `question-e-${answers?.entitySlug || 'answers'}-${
                new Date().toISOString().split('T')[0]
              }.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="w-full px-8 py-4 bg-gh-dark-800 hover:bg-gh-dark-700 text-gray-400 hover:text-white font-medium rounded-lg transition-colors"
          >
            Export Answers (JSON)
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
