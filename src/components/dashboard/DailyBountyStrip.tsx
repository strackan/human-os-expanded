'use client';

import { motion } from 'framer-motion';

interface DailyBountyStripProps {
  earned: number;
  goal: number;
  streak: number;
}

export default function DailyBountyStrip({ earned, goal, streak }: DailyBountyStripProps) {
  const percentage = Math.min((earned / goal) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex items-center bg-white border border-gray-200 rounded-full px-6 py-3 max-w-2xl mx-auto shadow-sm"
    >
      {/* Label */}
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-3 whitespace-nowrap">
        Today&apos;s Score
      </span>

      {/* Score number */}
      <span
        className="text-2xl font-bold text-amber-500 mr-4 leading-none"
        style={{ fontFamily: 'var(--font-fraunces)' }}
      >
        {earned}
      </span>

      {/* Linear progress bar */}
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden mr-3 min-w-[80px]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Goal */}
      <span className="text-sm text-gray-400 mr-4 whitespace-nowrap">
        of <span className="font-medium text-gray-500">{goal}</span> pts
      </span>

      {/* Divider + Streak */}
      {streak > 0 && (
        <>
          <div className="w-px h-5 bg-gray-200 mr-4" />
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-semibold text-emerald-600">{streak}-day streak</span>
          </div>
        </>
      )}
    </motion.div>
  );
}
