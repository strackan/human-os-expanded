'use client';

import Image from 'next/image';

interface OnboardingHeaderProps {
  userName: string;
  onSkip: () => void;
  onReset: () => void;
}

export default function OnboardingHeader({ userName, onSkip, onReset }: OnboardingHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="Renubu"
          width={36}
          height={41}
          priority
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{userName}</span>
        <button
          onClick={onReset}
          title="Start over"
          className="text-gray-300 hover:text-gray-500 transition-colors p-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0 1 15.36-5.36M20 15a9 9 0 0 1-15.36 5.36" />
          </svg>
        </button>
        <button
          onClick={onSkip}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip
        </button>
      </div>
    </header>
  );
}
