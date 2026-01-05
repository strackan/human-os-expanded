'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { GlitchIntroV2 } from '@/components/GlitchIntroV2';
import { MobileNav, DesktopNav } from '@/components/MobileNav';
import { RSVPForm } from '@/components/RSVPForm';
import { useMobileDetection } from '@/lib/hooks/useMobileDetection';

// VERSION: 2024-10-31-FIX-V2 - RSVP submission uses server-side API route
export default function LaunchPartyPage() {
  console.log('Launch Page Version: 2024-10-31-FIX-V2 - RSVP uses API route to avoid Headers error');
  const [rsvpCount, setRsvpCount] = useState<number>(0);
  const [showIntro, setShowIntro] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Hardcoded launch event ID - created via migration 002_launch_event.sql
  const LAUNCH_EVENT_ID = '00000000-0000-0000-0000-000000000001';

  // Use mobile detection hook
  const { isMobile } = useMobileDetection();

  useEffect(() => {
    setIsMounted(true);

    // Skip intro on mobile for performance
    if (isMobile) {
      console.log('[LaunchPage] Mobile device detected - skipping intro for performance');
      setShowIntro(false);
      fetchRSVPCount();
      return;
    }

    // Check if user has seen the glitch intro before
    const hasSeenGlitch = typeof window !== 'undefined' &&
      (localStorage.getItem('goodhang_seen_glitch') || sessionStorage.getItem('goodhang_session'));

    if (!hasSeenGlitch) {
      setShowIntro(true);
    }

    fetchRSVPCount();
  }, [isMobile]);

  const fetchRSVPCount = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('rsvps')
        .select('plus_ones')
        .eq('event_id', LAUNCH_EVENT_ID);

      if (!error && data) {
        const total = data.reduce((acc: number, rsvp: { plus_ones: number | null }) => acc + 1 + (rsvp.plus_ones || 0), 0);
        setRsvpCount(total);
      }
    } catch (err) {
      console.error('Failed to fetch RSVP count:', err);
      // Silently fail - the count is not critical for the form to work
    }
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  // Show loading state until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  // Show glitch intro if first visit
  if (showIntro) {
    return <GlitchIntroV2 onComplete={handleIntroComplete} />;
  }

  return (
    <div className="min-h-screen scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-neon-purple/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="font-mono text-2xl font-bold">
            <span className="neon-purple">GOOD_HANG</span>
          </Link>
          <div className="flex gap-4 items-center">
            <DesktopNav
              links={[
                { href: '/', label: 'Home' },
                { href: '/apply', label: 'Apply' },
              ]}
            />
            <MobileNav
              links={[
                { href: '/', label: 'Home' },
                { href: '/apply', label: 'Apply' },
              ]}
            />
          </div>
        </div>
      </nav>

      {/* Hero Section - Above the fold */}
      <main className="container mx-auto px-6">
        {/* Hero content - fits within viewport */}
        <div className="min-h-[calc(100vh-5rem)] flex flex-col justify-center py-20">
          <div className="max-w-4xl mx-auto w-full">
            {/* Event Title */}
            <div className="text-center mb-6">
              <h1 className="text-5xl md:text-6xl font-bold font-mono leading-tight mb-6">
                <span className="neon-cyan block">GOOD HANG</span>
                <span className="neon-magenta block text-3xl md:text-4xl mt-2">LAUNCH PARTY</span>
              </h1>
              <p className="text-xl text-foreground-dim font-mono max-w-2xl mx-auto">
                Downtown Cary Scavenger Hunt
                <span className="text-neon-purple"> • 4 Bars • Secret VIP Party</span>
              </p>
            </div>

            {/* RSVP Button - Above the fold */}
            <div className="text-center mb-8">
              <a
                href="#rsvp-form"
                className="inline-block px-8 py-3 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-background font-mono uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,204,221,0.5)]"
              >
                RSVP Now
              </a>
            </div>

            {/* Video Embed - Compact, clickable for modal */}
            <div className="max-w-2xl mx-auto">
              <div
                className="relative w-full cursor-pointer group"
                style={{ paddingBottom: '35%' }}
                onClick={() => setShowVideoModal(true)}
              >
                <iframe
                  className="absolute top-0 left-0 w-full h-full border-2 border-neon-cyan/30 group-hover:border-neon-cyan transition-colors pointer-events-none"
                  src="https://www.youtube.com/embed/dGBPTpJJ9Ek?rel=0&modestbranding=1"
                  title="Good Hang Launch Party Promo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
                  <div className="text-neon-cyan text-6xl opacity-0 group-hover:opacity-100 transition-opacity">
                    ▶
                  </div>
                </div>
              </div>
              <p className="text-center text-foreground-dim text-sm mt-2 font-mono">Click to watch full screen</p>
            </div>
          </div>
        </div>

        {/* Content below the fold */}
        <div className="max-w-4xl mx-auto pb-20 space-y-8">

          {/* Event Details */}
          <div className="border-2 border-neon-cyan/30 bg-background-lighter p-8 md:p-12">
            <div className="space-y-6 font-mono">
              <div>
                <span className="text-neon-cyan uppercase text-sm tracking-wider">When</span>
                <p className="text-foreground text-lg mt-1">
                  Thursday, November 13, 2025
                </p>
                <p className="text-foreground-dim mt-1">
                  5:00 PM - Late
                </p>
                <p className="text-neon-magenta font-bold mt-1">
                  🚀 Caravan departs 6:00 PM SHARP
                </p>
              </div>

              <div>
                <span className="text-neon-cyan uppercase text-sm tracking-wider">Where</span>
                <p className="text-foreground text-lg mt-1">
                  The Williams House Cary
                </p>
                <p className="text-foreground-dim text-sm mt-1">
                  210 E Chatham St, Downtown Cary, NC 27511
                </p>
                <a
                  href="https://www.thewilliamshousecary.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neon-cyan hover:text-neon-magenta text-sm transition-colors inline-block mt-1"
                >
                  Visit venue website →
                </a>
              </div>

              <div>
                <span className="text-neon-cyan uppercase text-sm tracking-wider">What to Expect</span>
                <ul className="text-foreground-dim mt-2 space-y-2">
                  <li>→ Downtown Cary scavenger hunt adventure</li>
                  <li>→ 4 bars • Clues • Challenges • Surprises</li>
                  <li>→ Meet CS leaders, tech founders, interesting humans</li>
                  <li>→ Ending at a Secret VIP Party</li>
                  <li>→ The faint whisper of danger</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Google Maps Embed */}
          <div>
            <div className="border-2 border-neon-purple/30 bg-background-lighter p-4">
              <h3 className="text-neon-purple font-mono uppercase text-sm tracking-wider mb-4">
                📍 Starting Location
              </h3>
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3243.1849367890243!2d-78.78351492341743!3d35.79151197258162!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89acf3e9c6b96b6f%3A0x9d8b8f8e8e8e8e8e!2s210%20E%20Chatham%20St%2C%20Cary%2C%20NC%2027511!5e0!3m2!1sen!2sus!4v1699999999999!5m2!1sen!2sus"
                  title="The Williams House Cary Location"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

          {/* RSVP Count - Only show when >= 10 */}
          {rsvpCount >= 10 && (
            <div className="text-center">
              <p className="text-foreground-dim font-mono">
                <span className="text-neon-purple text-3xl font-bold">{rsvpCount}</span>
                <span className="text-foreground-dim ml-2">people are coming</span>
              </p>
            </div>
          )}

          {/* RSVP Form */}
          <div id="rsvp-form" className="border-2 border-neon-purple/30 bg-background-lighter p-8 md:p-12 scroll-mt-24">
            <h2 className="text-3xl font-bold font-mono neon-purple mb-4">
              RSVP NOW
            </h2>
            <div className="mb-6 p-3 border border-neon-magenta/50 bg-neon-magenta/10">
              <p className="text-neon-magenta font-mono text-sm font-bold">
                ⚡ LIMITED SPOTS AVAILABLE • First Come, First Served
              </p>
            </div>
            <p className="text-foreground-dim mb-8 font-mono">
              Reserve your spot. We&apos;ll send event updates and reminders.
            </p>

            <RSVPForm eventId={LAUNCH_EVENT_ID} currentUser={null} />
          </div>

          {/* Footer Note */}
          <div className="mt-12 text-center">
            <p className="text-foreground-dim font-mono text-sm">
              Questions? Email us at{' '}
              <a href="mailto:hello@goodhang.club" className="text-neon-cyan hover:text-neon-magenta transition-colors">
                hello@goodhang.club
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Video Modal */}
      {showVideoModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-neon-cyan text-4xl font-bold transition-colors"
              aria-label="Close video"
            >
              ×
            </button>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full border-2 border-neon-cyan"
                src="https://www.youtube.com/embed/dGBPTpJJ9Ek?rel=0&modestbranding=1&autoplay=1"
                title="Good Hang Launch Party Promo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
