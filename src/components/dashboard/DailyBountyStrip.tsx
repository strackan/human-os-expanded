'use client';

import { motion } from 'framer-motion';
import BountyProgressRing from './BountyProgressRing';

interface DailyBountyStripProps {
  earned: number;
  goal: number;
  streak: number;
  nextWorkflowPoints?: number;
}

export default function DailyBountyStrip({ earned, goal, streak, nextWorkflowPoints }: DailyBountyStripProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex items-center gap-6 bg-white/70 border border-gray-200/60 rounded-2xl px-6 py-4 max-w-2xl mx-auto"
    >
      {/* Progress ring */}
      <BountyProgressRing earned={earned} goal={goal} size={64} />

      {/* Points text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1">
          <span
            className="text-xl font-bold text-gray-900"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            {earned}
          </span>
          <span className="text-sm text-gray-400">/ {goal} points</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">Daily bounty progress</p>
      </div>

      {/* Streak badge */}
      {streak > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-semibold text-amber-700">{streak}-day streak</span>
        </div>
      )}

      {/* Next workflow points preview */}
      {nextWorkflowPoints !== undefined && nextWorkflowPoints > 0 && (
        <div className="text-right">
          <span className="text-xs text-gray-400 block">Next</span>
          <span
            className="text-sm font-bold text-purple-600"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            +{nextWorkflowPoints} pts
          </span>
        </div>
      )}
    </motion.div>
  );
}
