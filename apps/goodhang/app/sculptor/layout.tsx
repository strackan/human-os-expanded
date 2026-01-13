/**
 * Sculptor Layout
 *
 * Minimal layout for Sculptor session pages.
 * No authentication required, no sidebar.
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Sculptor - Voice-OS Premier',
  description: 'Guided interview session for Voice-OS',
};

export default function SculptorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950">
      {children}
    </div>
  );
}
