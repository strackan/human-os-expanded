'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import './saloon-modal.css';

interface SaloonModalProps {
  show: boolean;
}

export function SaloonModal({ show }: SaloonModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!show || hasAnimated) return;

    // Small delay before showing to ensure page is loaded
    const timer = setTimeout(() => {
      setIsVisible(true);
      setHasAnimated(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [show, hasAnimated]);

  if (!show || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Modal backdrop - blocks clicks */}
      <div className="absolute inset-0 bg-black/70" />

      {/* The swinging sign */}
      <Link
        href="/roadtrip"
        className="saloon-sign relative cursor-pointer group w-[90%] md:w-[50%] max-w-2xl"
      >
        {/* Chain/rope from top */}
        <div className="flex justify-center">
          <div className="w-2 h-16 bg-gradient-to-b from-amber-700 to-amber-800 rounded-full shadow-md" />
        </div>

        {/* The sign board */}
        <div className="relative">
          {/* Wood grain background */}
          <div
            className="saloon-board relative px-12 py-12 md:py-16 rounded-lg shadow-2xl border-8 border-amber-950 transform transition-transform duration-300 group-hover:scale-105 overflow-hidden"
          >
            {/* Wood texture background image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: 'url("/wood-texture.jpg")',
              }}
            />
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-amber-800/40" />

            {/* Decorative corners */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-amber-500/50 rounded-tl" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-amber-500/50 rounded-tr" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-amber-500/50 rounded-bl" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-amber-500/50 rounded-br" />

            {/* Text content */}
            <div className="relative text-center">
              <p className="text-amber-200 text-sm md:text-base uppercase tracking-widest mb-2 font-mono">
                Now Departing
              </p>
              <h2 className="saloon-title text-4xl md:text-5xl lg:text-6xl font-bold text-amber-100 mb-3">
                The Renubu
              </h2>
              <h3 className="saloon-title text-5xl md:text-6xl lg:text-7xl font-bold text-amber-50">
                Road Show
              </h3>
              <div className="mt-6 pt-6 border-t-2 border-amber-600/50">
                <p className="text-amber-300 text-lg md:text-xl font-mono">
                  Dec 29 - Jan 30
                </p>
                <p className="text-amber-200 text-sm md:text-base mt-4 group-hover:text-amber-100 transition-colors">
                  Click to see the route →
                </p>
              </div>
            </div>
          </div>

          {/* Bottom decorative hooks */}
          <div className="flex justify-between px-8 -mt-1">
            <div className="w-4 h-6 bg-amber-950 rounded-b" />
            <div className="w-4 h-6 bg-amber-950 rounded-b" />
          </div>
        </div>
      </Link>
    </div>
  );
}
