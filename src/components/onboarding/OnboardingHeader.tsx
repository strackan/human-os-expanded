'use client';

import Image from 'next/image';

interface OnboardingHeaderProps {
  userName: string;
  onSkip: () => void;
}

export default function OnboardingHeader({ userName, onSkip }: OnboardingHeaderProps) {
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

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{userName}</span>
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
