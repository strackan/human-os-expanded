/**
 * Completion Card Component
 *
 * Shown when all assessment questions are answered.
 */

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { TEST_IDS, testId } from '@/lib/test-utils';

interface CompletionCardProps {
  title: string;
  description: string;
  submitButtonText: string;
  onReview: () => void;
  onComplete: () => void;
  themeColor: 'purple' | 'blue';
  isLoading?: boolean;
}

export function CompletionCard({
  title,
  description,
  submitButtonText,
  onReview,
  onComplete,
  themeColor,
  isLoading = false,
}: CompletionCardProps) {
  const buttonColor = themeColor === 'purple'
    ? 'from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 hover:shadow-green-500/50'
    : 'from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 hover:shadow-green-500/50';

  return (
    <motion.div
      {...testId(TEST_IDS.assessment.completionCard)}
      key="completion"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-8 text-center"
    >
      <h3 className="text-2xl font-semibold text-white mb-4">{title}</h3>
      <p className="text-gray-300 mb-6">{description}</p>
      <div className="flex justify-center gap-4">
        <button
          {...testId(TEST_IDS.assessment.reviewBtn)}
          onClick={onReview}
          disabled={isLoading}
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Review Answers
        </button>
        <button
          {...testId(TEST_IDS.assessment.completeBtn)}
          onClick={onComplete}
          disabled={isLoading}
          className={`px-12 py-4 bg-gradient-to-r ${buttonColor} text-white font-bold rounded-lg transition-all duration-200 shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </span>
          ) : (
            submitButtonText
          )}
        </button>
      </div>
    </motion.div>
  );
}

export default CompletionCard;
