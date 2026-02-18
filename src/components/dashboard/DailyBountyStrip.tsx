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
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider mr-3 whitespace-nowrap">
        Today&apos;s Score
      </span>

      {/* Score number — gradient orange */}
      <span
        className="text-2xl font-bold mr-4 leading-none"
        style={{
          fontFamily: 'var(--font-fraunces)',
          background: 'linear-gradient(135deg, #E8723A, #D4A843)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {earned}
      </span>

      {/* Linear progress bar */}
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden mr-3 min-w-[80px]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(135deg, #E8723A, #D4A843)' }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Goal */}
      <span className="text-sm text-gray-400 mr-4 whitespace-nowrap">
        of <span className="font-semibold text-gray-800">{goal}</span> pts
      </span>

      {/* Divider + Streak */}
      {streak > 0 && (
        <>
          <div className="w-px h-6 bg-gray-200 mr-4" />
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#E8723A">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span className="text-sm font-semibold" style={{ color: '#E8723A' }}>{streak}-day streak</span>
          </div>
        </>
      )}
    </motion.div>
  );
}
