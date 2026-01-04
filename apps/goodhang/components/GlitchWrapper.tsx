'use client';

import { useState, useEffect } from 'react';
import { GlitchIntroV2 } from './GlitchIntroV2';
import { HomePage } from './HomePage';
import { SaloonModal } from './SaloonModal';

export function GlitchWrapper() {
  const [showIntro, setShowIntro] = useState(false); // Start with false
  const [isMounted, setIsMounted] = useState(false);
  const [showSaloon, setShowSaloon] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    console.log('[GlitchWrapper] Component mounted');

    // Check if mobile device (< 768px)
    const isMobile = window.innerWidth < 768;
    console.log('[GlitchWrapper] isMobile:', isMobile, 'width:', window.innerWidth);

    // Skip intro entirely on mobile devices for performance
    if (isMobile) {
      console.log('[GlitchWrapper] Mobile device detected - skipping intro for performance');
      setShowIntro(false);
      // Show saloon modal for mobile users
      setShowSaloon(true);
      return;
    }

    // Check if we should show intro
    const hasSeenGlitch = localStorage.getItem('goodhang_seen_glitch') === 'true';
    const hasEmergencySkip = localStorage.getItem('goodhang_glitch_emergency_skip') === 'true';

    console.log('[GlitchWrapper] hasSeenGlitch:', hasSeenGlitch);
    console.log('[GlitchWrapper] hasEmergencySkip:', hasEmergencySkip);

    // If emergency skip is set, never show intro again (clear it after checking)
    if (hasEmergencySkip) {
      console.log('[GlitchWrapper] Emergency skip detected - skipping intro permanently');
      localStorage.removeItem('goodhang_glitch_emergency_skip');
      localStorage.setItem('goodhang_seen_glitch', 'true');
      setShowIntro(false);
      setShowSaloon(true);
      return;
    }

    // Only show intro on first visit
    if (!hasSeenGlitch) {
      console.log('[GlitchWrapper] First visit - showing intro');
      setShowIntro(true);
    } else {
      console.log('[GlitchWrapper] Returning visit - skipping intro');
      setShowIntro(false);
      // Show saloon modal for returning visitors
      setShowSaloon(true);
    }
  }, []);

  const handleIntroComplete = () => {
    console.log('[GlitchWrapper] Intro complete - switching to homepage');
    setShowIntro(false);
    // Show saloon modal after intro completes
    setShowSaloon(true);
  };

  const handleRewatchIntro = () => {
    console.log('[GlitchWrapper] User requested rewatch');
    // Clear the localStorage flag
    if (typeof window !== 'undefined') {
      localStorage.removeItem('goodhang_seen_glitch');
      sessionStorage.removeItem('goodhang_session');
    }
    // Show intro again
    setShowIntro(true);
  };

  // Show loading state until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  console.log('[GlitchWrapper] Rendering - showIntro:', showIntro);

  return (
    <>
      {showIntro && <GlitchIntroV2 onComplete={handleIntroComplete} />}
      {!showIntro && <HomePage onRewatchIntro={handleRewatchIntro} />}
      <SaloonModal show={showSaloon && !showIntro} />
    </>
  );
}
