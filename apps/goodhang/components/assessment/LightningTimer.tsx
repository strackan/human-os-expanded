/**
 * LightningTimer Component
 *
 * Visual countdown timer for Lightning Round assessment.
 * Features:
 * - 2-minute countdown with millisecond precision
 * - Color transitions: green → yellow (60s) → red (30s)
 * - Circular progress indicator
 * - Auto-calls onExpire when timer reaches 0
 */

'use client';

import { useEffect, useState, useRef, memo } from 'react';

interface LightningTimerProps {
  duration: number; // Duration in seconds
  onExpire: () => void;
}

function LightningTimerComponent({ duration, onExpire }: LightningTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onExpireRef = useRef(onExpire);

  // Keep onExpire ref up to date
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    // Start countdown
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const remainingSeconds = remaining / 1000;

      setTimeRemaining(remainingSeconds);

      if (remaining <= 0 && !isExpired) {
        setIsExpired(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        onExpireRef.current();
      }
    }, 100); // Update every 100ms for smooth animation

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [duration, isExpired]);

  // Calculate progress percentage (0-100)
  const progress = (timeRemaining / duration) * 100;

  // Determine color based on time remaining
  const getColor = () => {
    if (timeRemaining <= 30) {
      return {
        primary: 'rgb(239, 68, 68)', // red-500
        secondary: 'rgb(220, 38, 38)', // red-600
        glow: 'rgba(239, 68, 68, 0.5)',
      };
    } else if (timeRemaining <= 60) {
      return {
        primary: 'rgb(234, 179, 8)', // yellow-500
        secondary: 'rgb(202, 138, 4)', // yellow-600
        glow: 'rgba(234, 179, 8, 0.5)',
      };
    } else {
      return {
        primary: 'rgb(34, 197, 94)', // green-500
        secondary: 'rgb(22, 163, 74)', // green-600
        glow: 'rgba(34, 197, 94, 0.5)',
      };
    }
  };

  const color = getColor();

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // SVG circle properties for progress ring
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      {/* Circular Progress Timer */}
      <div className="relative w-28 h-28 md:w-32 md:h-32">
        <svg
          className="transform -rotate-90"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color.primary}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease',
              filter: `drop-shadow(0 0 8px ${color.glow})`,
            }}
          />
        </svg>

        {/* Time display in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div
              className="text-3xl md:text-4xl font-bold tabular-nums"
              style={{
                color: color.primary,
                textShadow: `0 0 10px ${color.glow}`,
                transition: 'color 0.3s ease',
              }}
            >
              {formatTime(timeRemaining)}
            </div>
            <div className="text-xs text-gray-400 mt-1">remaining</div>
          </div>
        </div>
      </div>

      {/* Warning text for final countdown */}
      {timeRemaining <= 30 && timeRemaining > 0 && (
        <div className="mt-4 text-red-400 text-sm font-semibold animate-pulse">
          Final 30 seconds!
        </div>
      )}

      {isExpired && (
        <div className="mt-4 text-red-400 text-sm font-semibold">
          Time&apos;s up!
        </div>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const LightningTimer = memo(LightningTimerComponent);

LightningTimer.displayName = 'LightningTimer';
