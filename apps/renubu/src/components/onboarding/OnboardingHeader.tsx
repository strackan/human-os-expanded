'use client';

import Image from 'next/image';

interface OnboardingHeaderProps {
  userName: string;
  onSkip: () => void;
  onReset: () => void;
}

export default function OnboardingHeader({ userName, onSkip, onReset }: OnboardingHeaderProps) {
  return (
    <header id="onboarding-header">
      <div>
        <Image
          src="/logo.png"
          alt="Renubu"
          width={36}
          height={41}
          priority
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span className="header-user">{userName}</span>
        <button
          onClick={onReset}
          title="Start over"
          className="header-reset"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0 1 15.36-5.36M20 15a9 9 0 0 1-15.36 5.36" />
          </svg>
        </button>
        <button onClick={onSkip} className="header-skip">
          Skip
        </button>
      </div>
    </header>
  );
}
