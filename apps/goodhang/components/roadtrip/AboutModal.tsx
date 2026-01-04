'use client';

import Modal from '@/components/roadtrip/ui/Modal';
import Button from '@/components/roadtrip/ui/Button';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="paper">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Header with stamp */}
        <div className="text-center">
          <h1 className="rt-heading-elegant text-3xl font-bold text-[var(--rt-navy)] mb-2">
            The Renubu Road Show
          </h1>
          <span className="rt-stamp">Dec 29 - Jan 30</span>
        </div>

        {/* Content */}
        <div className="space-y-4 rt-typewriter text-[var(--rt-navy)] leading-relaxed">
          <p>
            I&apos;m <strong>Justin</strong> — AI Founder, Startup Veteran, Wandering Nomad.
          </p>

          <p>
            I&apos;m an ADHD / Enneagram 7, which basically means my greatest fear is
            running out of adventures.
          </p>

          <p>
            In reality, that means every six months or so, my soul yearns for a
            great adventure.
          </p>

          <div className="py-2 border-l-4 border-[var(--rt-mustard)] pl-4 bg-[var(--rt-mustard)]/10">
            <p className="italic">
              For some, that may be a European backpacking tour, or a winter
              flight to the Caribbean.
            </p>
            <p className="italic mt-2">
              For me, though, it just means one thing — <strong>it&apos;s time to
              get in the car and drive.</strong>
            </p>
          </div>

          <p>
            Things are strange. My head is cloudy. I want to make new friends,
            have good hangs, and follow my instincts.
          </p>

          <p className="text-[var(--rt-rust)] font-bold">Maybe I&apos;ll never come back.</p>

          <div className="py-4">
            <h2 className="rt-heading-elegant text-xl font-bold text-[var(--rt-forest)] mb-3">
              Here&apos;s what I know:
            </h2>
            <p>
              From <strong>Dec 29 to Jan 31</strong>, I&apos;m hitting the road. Part
              Renubu-promotion, part spiritual reset, all fun.
            </p>
          </div>

          <p>
            I&apos;m building{' '}
            <a
              href="https://renubu.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--rt-forest)] underline hover:text-[var(--rt-rust)] transition-colors"
            >
              Renubu
            </a>{' '}
            (expansion intelligence for Customer Success teams) and would love
            to meet founders, CS leaders, investors, or just interesting humans
            along the way.
          </p>

          <p className="font-bold">
            If our paths cross, let&apos;s make something of it.
          </p>

          <div className="bg-[var(--rt-forest)]/10 p-4 rounded-lg border-2 border-dashed border-[var(--rt-forest)]">
            <p className="text-center">
              <span className="text-[var(--rt-forest)]">📍</span> Click a stop to let me know
              you&apos;re there.
              <br />
              <span className="text-[var(--rt-rust)]">🗺️</span> Or click anywhere else to
              invite me somewhere new.
            </p>
          </div>

          <p className="text-center text-xl rt-heading-elegant font-bold text-[var(--rt-navy)] pt-4">
            Let&apos;s hang.
          </p>
        </div>

        {/* Close button */}
        <div className="flex justify-center pt-4 border-t border-[var(--rt-cork)]">
          <Button onClick={onClose} variant="secondary" size="lg">
            Back to the Map
          </Button>
        </div>
      </div>
    </Modal>
  );
}
