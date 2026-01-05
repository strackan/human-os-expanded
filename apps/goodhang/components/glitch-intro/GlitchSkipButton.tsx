import React from 'react';

interface GlitchSkipButtonProps {
  show: boolean;
  onClick: () => void;
}

export function GlitchSkipButton({ show, onClick }: GlitchSkipButtonProps) {
  if (!show) return null;

  return (
    <button onClick={onClick} className="glitch-skip-btn-fade">
      Skip
    </button>
  );
}
