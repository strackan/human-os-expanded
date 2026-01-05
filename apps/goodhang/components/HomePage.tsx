'use client';

import { NeonButton } from '@/components/NeonButton';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { MobileNav, DesktopNav } from './MobileNav';

interface HomePageProps {
  onRewatchIntro?: () => void;
}

export function HomePage({ onRewatchIntro }: HomePageProps) {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    // Check if redirected from Typeform with success parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('application') === 'success') {
      setShowSuccessMessage(true);
      // Clean up URL without page reload
      window.history.replaceState({}, '', window.location.pathname);
      // Auto-hide after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, []);



  return (
    <>

      <div className="min-h-screen relative">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-neon-purple/20">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="font-mono text-2xl font-bold glitch-hover">
              <span className="neon-purple">GOOD_HANG</span>
            </Link>
            <div className="flex gap-4 items-center">
              <DesktopNav
                links={[
                  { href: '/about', label: 'About' },
                                    { href: '/login', label: 'Member Login' },
                ]}
              />
              {onRewatchIntro && (
                <button
                  onClick={onRewatchIntro}
                  className="hidden md:block text-foreground-dim hover:text-neon-cyan transition-colors font-mono text-sm opacity-50 hover:opacity-100 py-2 px-3 touch-manipulation"
                  title="Rewatch the glitch intro"
                >
                  ↻ Rewatch
                </button>
              )}
              <MobileNav
                links={[
                  { href: '/about', label: 'About' },
                                    { href: '/login', label: 'Member Login' },
                ]}
              />
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-4xl mx-auto text-center space-y-8 relative">
            {/* Success Message */}
            {showSuccessMessage && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-16 w-full max-w-2xl bg-background-lighter px-8 py-4 animate-fade-in-out z-10">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">✓</span>
                  <p className="font-mono neon-cyan text-lg">
                    Application submitted! We&apos;ll be in touch soon.
                  </p>
                </div>
              </div>
            )}

            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl font-bold font-mono leading-tight">
              <span className="neon-cyan block hero-glitch" data-text="FULLY ALIVE.">FULLY ALIVE.</span>
              <span className="neon-magenta block hero-glitch" data-text="WELL CONNECTED." style={{ animationDelay: '2s' }}>WELL CONNECTED.</span>
              <span className="neon-purple block hero-glitch" data-text="UNSTOPPABLE." style={{ animationDelay: '4s' }}>UNSTOPPABLE.</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-foreground-dim font-mono max-w-2xl mx-auto">
              An exclusive social club for tech professionals who want more than networking—
              <span className="text-neon-purple">they want adventure</span>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <NeonButton variant="cyan" href="/apply">
                Take the Assessment
              </NeonButton>
            </div>

            {/* Social Proof / Tagline */}
            <div className="pt-16">
              <p className="text-foreground-dim font-mono text-sm uppercase tracking-widest">
                Raleigh · Est. 2025 · Expanding Soon
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto pt-32">
            <FeatureCard
              title="Real Fun"
              description="Events & retreats you'll actually want to attend. Can't wait for the latest event? Drop a Happy Hour beacon and see who shows up!"
              color="cyan"
            />
            <FeatureCard
              title="Ask For Help (sans weirdness)"
              description="Use our ancient 'Coin of Wisdom' to request a favor or intro from one of our members. Giving & getting is part of the deal!"
              color="magenta"
            />
            <FeatureCard
              title="Level Up Together"
              description="AI Upskilling, Mentorship, Accountability Partners. Maybe the occasional road trip. Our members simply achieve more together."
              color="purple"
            />
          </div>

          {/* Take the Assessment Section */}
          <div id="join" className="max-w-2xl mx-auto pt-32 pb-20">
            <div className="border-2 border-neon-purple/30 bg-background-lighter p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-mono neon-purple mb-6">
                TAKE THE ASSESSMENT
              </h2>
              <p className="text-foreground-dim mb-8 font-mono text-lg">
                Discover your work style, connect with your tribe, and unlock exclusive membership.
              </p>
              <p className="text-foreground-dim mb-8 font-mono">
                Our assessment is our gift to you—keep your detailed results forever, whether you join or not.
              </p>

              <NeonButton variant="cyan" href="/apply">
                Start the Assessment
              </NeonButton>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-neon-purple/20 py-8">
          <div className="container mx-auto px-6 text-center text-foreground-dim font-mono text-sm">
            <p>© 2025 Good Hang. A <a href="https://renubu.com" target="_blank" rel="noopener noreferrer" className="text-neon-purple hover:text-neon-magenta transition-colors">Renubu</a> initiative.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

function FeatureCard({
  title,
  description,
  color
}: {
  title: string;
  description: string;
  color: 'cyan' | 'magenta' | 'purple';
}) {
  const colorClasses = {
    cyan: 'border-neon-cyan/30 hover:border-neon-cyan',
    magenta: 'border-neon-magenta/30 hover:border-neon-magenta',
    purple: 'border-neon-purple/30 hover:border-neon-purple'
  };

  const titleClasses = {
    cyan: 'neon-cyan',
    magenta: 'neon-magenta',
    purple: 'neon-purple'
  };

  return (
    <div className={`border-2 ${colorClasses[color]} bg-background-lighter p-6 transition-all duration-300 hover:scale-105`}>
      <h3 className={`text-xl font-bold font-mono mb-3 ${titleClasses[color]}`}>
        {title}
      </h3>
      <p className="text-foreground-dim font-mono text-sm">
        {description}
      </p>
    </div>
  );
}
