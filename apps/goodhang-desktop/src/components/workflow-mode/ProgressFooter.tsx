/**
 * Progress Footer Component
 *
 * Footer showing workflow completion progress and unlock button.
 */

import { motion } from 'framer-motion';
import { Lock, Unlock, Sparkles, RefreshCw } from 'lucide-react';
import type { ProgressFooterProps } from '@/lib/types/workflow';

export function ProgressFooter({
  progress,
  canUnlock,
  onUnlock,
  onReset,
  resetLabel = 'Reset Progress',
  className,
}: ProgressFooterProps) {
  // Determine progress color based on completion
  const getProgressColor = () => {
    if (progress >= 100) return 'from-green-500 to-emerald-500';
    if (progress >= 75) return 'from-blue-500 to-green-500';
    if (progress >= 50) return 'from-blue-500 to-purple-500';
    return 'from-purple-500 to-blue-500';
  };

  return (
    <div className={`p-4 border-t border-gh-dark-700 bg-gh-dark-800/50 ${className ?? ''}`}>
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[11px] text-gray-500 mb-2 font-medium uppercase tracking-wide">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2.5 bg-gh-dark-600 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full bg-gradient-to-r ${getProgressColor()} rounded-full`}
          />
        </div>
      </div>

      {/* Unlock/Continue button */}
      <motion.button
        onClick={onUnlock}
        disabled={!canUnlock}
        whileHover={canUnlock ? { scale: 1.02 } : undefined}
        whileTap={canUnlock ? { scale: 0.98 } : undefined}
        className={`
          w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl
          text-[13px] font-semibold transition-all duration-200
          ${
            canUnlock
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/20'
              : 'bg-gh-dark-600 text-gray-500 cursor-not-allowed'
          }
        `}
      >
        {canUnlock ? (
          <>
            <Unlock className="w-4 h-4" />
            <span>Continue to Dashboard</span>
            <Sparkles className="w-4 h-4" />
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Complete Required Steps</span>
          </>
        )}
      </motion.button>

      {/* Completion message */}
      {canUnlock && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-[11px] text-green-400 mt-3"
        >
          All required steps complete! You can now proceed.
        </motion.p>
      )}

      {/* Reset button - always visible for easy access */}
      {onReset && (
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 mt-3 text-[13px] text-orange-400/70 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {resetLabel}
        </button>
      )}
    </div>
  );
}

export default ProgressFooter;
