'use client';

import { motion } from 'framer-motion';

interface BountyProgressRingProps {
  earned: number;
  goal: number;
  size?: number;
}

export default function BountyProgressRing({ earned, goal, size = 80 }: BountyProgressRingProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(earned / goal, 1);
  const strokeDashoffset = circumference * (1 - percentage);
  const isComplete = earned >= goal;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id="bounty-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isComplete ? '#10b981' : '#a855f7'} />
            <stop offset="100%" stopColor={isComplete ? '#34d399' : '#6366f1'} />
          </linearGradient>
        </defs>
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#bounty-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-lg font-bold leading-none text-gray-900"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          {earned}
        </span>
        <span className="text-[10px] text-gray-400 mt-0.5">/ {goal}</span>
      </div>
    </div>
  );
}
