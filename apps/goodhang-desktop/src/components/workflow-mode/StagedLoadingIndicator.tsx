/**
 * Staged Loading Indicator
 *
 * Multi-stage loading animation with progress bar and messages.
 * Provides visual feedback during long-running operations.
 */

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { StagedLoadingIndicatorProps } from '@/lib/types/workflow';

export function StagedLoadingIndicator({
  stages,
  currentStage,
  progress,
  message,
  className,
}: StagedLoadingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`bg-gh-dark-700 rounded-2xl p-4 ${className ?? ''}`}
    >
      {/* Loading spinner and message */}
      <div className="flex items-center gap-3 mb-3">
        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        <span className="text-white text-sm">{message}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gh-dark-600 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
        />
      </div>

      {/* Stage dots */}
      <div className="flex justify-center gap-2 mt-3">
        {stages.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index < currentStage
                ? 'bg-green-500'
                : index === currentStage
                ? 'bg-blue-500 animate-pulse'
                : 'bg-gh-dark-500'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default StagedLoadingIndicator;
