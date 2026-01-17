/**
 * Loading Indicator Component
 *
 * Animated typing dots for chat loading states.
 */

import { motion } from 'framer-motion';
import { TEST_IDS, testId } from '@/lib/test-utils';

interface LoadingIndicatorProps {
  /** Background class for the container */
  className?: string;
}

export function LoadingIndicator({ className = 'bg-gh-dark-700' }: LoadingIndicatorProps) {
  return (
    <motion.div
      {...testId(TEST_IDS.chat.loadingIndicator)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-start"
    >
      <div className={`${className} rounded-2xl px-4 py-3`}>
        <div className="flex gap-1">
          <div
            {...testId(TEST_IDS.chat.loadingDot(0))}
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          />
          <div
            {...testId(TEST_IDS.chat.loadingDot(1))}
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '0.1s' }}
          />
          <div
            {...testId(TEST_IDS.chat.loadingDot(2))}
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '0.2s' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default LoadingIndicator;
