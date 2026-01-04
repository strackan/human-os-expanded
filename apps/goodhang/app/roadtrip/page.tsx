'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { PlannedStop, CustomSpotData } from '@/types/roadtrip';
import Button from '@/components/roadtrip/ui/Button';
import StopInterestForm from '@/components/roadtrip/forms/StopInterestForm';
import CustomSpotForm from '@/components/roadtrip/forms/CustomSpotForm';
import NoteForm from '@/components/roadtrip/forms/NoteForm';
import AboutModal from '@/components/roadtrip/AboutModal';
import BlogModal from '@/components/roadtrip/BlogModal';

// Dynamic import for map (Leaflet needs window)
const RouteMap = dynamic(() => import('@/components/roadtrip/map/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[var(--rt-cream)] flex items-center justify-center">
      <div className="rt-paper-note p-6 rt-typewriter text-center">
        <div className="text-2xl mb-2">🗺️</div>
        Loading the adventure...
      </div>
    </div>
  ),
});

export default function RoadTripPage() {
  // Modal states
  const [selectedStop, setSelectedStop] = useState<PlannedStop | null>(null);
  const [customSpotCoords, setCustomSpotCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(true);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [blogStop, setBlogStop] = useState<PlannedStop | null>(null);

  // Handlers
  const handleStopClick = useCallback((stop: PlannedStop) => {
    setSelectedStop(stop);
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setCustomSpotCoords({ lat, lng });
  }, []);

  const handleCustomSpotClick = useCallback((spot: CustomSpotData) => {
    setCustomSpotCoords({ lat: spot.lat, lng: spot.lng });
  }, []);

  const handleBlogClick = useCallback((stop: PlannedStop) => {
    setBlogStop(stop);
  }, []);

  return (
    <div className="min-h-screen rt-cork-board flex flex-col">
      {/* Header - Pinned at top like a bulletin board header */}
      <header className="relative z-20 p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Title card - pinned note style */}
          <div className="rt-paper-note px-6 py-4 text-center md:text-left">
            <h1 className="rt-heading-elegant text-2xl md:text-3xl font-bold text-[var(--rt-navy)]">
              The Renubu Road Show
            </h1>
            <p className="rt-typewriter text-sm text-[var(--rt-cork-dark)] mt-1">
              Dec 29, 2025 - Jan 30, 2026
            </p>
          </div>

          {/* Action buttons - like pinned index cards */}
          <div className="flex flex-wrap gap-3 justify-center">
            <div className="rt-paper-note px-1 py-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsAboutOpen(true)}
              >
                About This Trip
              </Button>
            </div>
            <div className="rt-paper-note px-1 py-1">
              <Button
                variant="rust"
                size="sm"
                onClick={() => setIsNoteOpen(true)}
              >
                Send a Note
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Map Container - The main bulletin board */}
      <main className="flex-1 relative p-4 md:p-6 pt-0 md:pt-0">
        <div className="max-w-7xl mx-auto h-full">
          {/* Map frame - like a map pinned to the board */}
          <div className="relative h-[calc(100vh-180px)] md:h-[calc(100vh-160px)] rounded-lg overflow-hidden shadow-2xl">
            {/* Washi tape decorations */}
            <div
              className="rt-washi-tape rt-washi-tape-yellow absolute -top-2 left-[20%] w-24 z-30"
              style={{ transform: 'rotate(-5deg)' }}
            />
            <div
              className="rt-washi-tape rt-washi-tape-sage absolute -top-2 right-[25%] w-20 z-30"
              style={{ transform: 'rotate(3deg)' }}
            />
            <div
              className="rt-washi-tape absolute -bottom-2 left-[30%] w-28 z-30"
              style={{ transform: 'rotate(2deg)' }}
            />

            {/* The actual map */}
            <RouteMap
              onStopClick={handleStopClick}
              onMapClick={handleMapClick}
              onCustomSpotClick={handleCustomSpotClick}
              onBlogClick={handleBlogClick}
            />
          </div>
        </div>

        {/* Instructions - pinned note in corner */}
        <div className="hidden lg:block absolute bottom-8 right-8 z-[1000]">
          <div className="rt-paper-note p-4 max-w-xs transform rotate-2">
            <h3 className="rt-typewriter font-bold text-[var(--rt-forest)] mb-2">
              How to Connect:
            </h3>
            <ul className="rt-typewriter text-sm text-[var(--rt-navy)] space-y-1">
              <li>📍 Click a <span className="text-[var(--rt-mustard)] font-bold">pin</span> to meet at a planned stop</li>
              <li>🗺️ Click <span className="text-[var(--rt-rust)] font-bold">anywhere</span> to request a detour</li>
              <li>✉️ Or just <span className="text-[var(--rt-forest)] font-bold">send a note</span></li>
            </ul>
          </div>
        </div>

        {/* Mobile instructions */}
        <div className="lg:hidden mt-4">
          <div className="rt-paper-note p-3 text-center max-w-md mx-auto">
            <p className="rt-typewriter text-sm text-[var(--rt-navy)]">
              Tap a <span className="text-[var(--rt-mustard)] font-bold">pin</span> to connect •
              Tap the <span className="text-[var(--rt-rust)] font-bold">map</span> to request a detour
            </p>
          </div>
        </div>
      </main>

      {/* Footer - subtle, not distracting */}
      <footer className="relative z-20 p-4 text-center">
        <p className="rt-typewriter text-xs text-[var(--rt-cork-dark)]/70">
          Made with ☕ and wanderlust •
          <a
            href="https://renubu.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--rt-forest)] transition-colors ml-1"
          >
            renubu.com
          </a>
        </p>
      </footer>

      {/* Modals */}
      {selectedStop && (
        <StopInterestForm
          stop={selectedStop}
          isOpen={!!selectedStop}
          onClose={() => setSelectedStop(null)}
        />
      )}

      {customSpotCoords && (
        <CustomSpotForm
          lat={customSpotCoords.lat}
          lng={customSpotCoords.lng}
          isOpen={!!customSpotCoords}
          onClose={() => setCustomSpotCoords(null)}
        />
      )}

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      <NoteForm isOpen={isNoteOpen} onClose={() => setIsNoteOpen(false)} />

      {blogStop && (
        <BlogModal
          stop={blogStop}
          isOpen={!!blogStop}
          onClose={() => setBlogStop(null)}
        />
      )}
    </div>
  );
}
