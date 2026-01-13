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
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}
