'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface NavLink {
  href: string;
  label: string;
}

interface MobileNavProps {
  links: NavLink[];
  className?: string;
}

export function MobileNav({ links, className = '' }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger Button - Mobile Only */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`md:hidden z-50 relative w-10 h-10 flex flex-col items-center justify-center gap-1.5 ${className}`}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <span
          className={`block w-6 h-0.5 bg-neon-cyan transition-all duration-300 ${
            isOpen ? 'rotate-45 translate-y-2' : ''
          }`}
        />
        <span
          className={`block w-6 h-0.5 bg-neon-cyan transition-all duration-300 ${
            isOpen ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`block w-6 h-0.5 bg-neon-cyan transition-all duration-300 ${
            isOpen ? '-rotate-45 -translate-y-2' : ''
          }`}
        />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-background border-l-2 border-neon-cyan/30 z-40 md:hidden transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <nav className="flex flex-col gap-2 p-6 pt-20">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-foreground hover:text-neon-cyan transition-colors font-mono py-3 px-4 border-2 border-transparent hover:border-neon-cyan/30 active:bg-neon-cyan/10 touch-manipulation"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Decorative scanlines */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="h-px bg-neon-cyan"
              style={{ marginTop: `${i * 5}%` }}
            />
          ))}
        </div>
      </div>
    </>
  );
}

// Desktop Navigation Component
interface DesktopNavProps {
  links: NavLink[];
  className?: string;
}

export function DesktopNav({ links, className = '' }: DesktopNavProps) {
  return (
    <div className={`hidden md:flex gap-6 items-center ${className}`}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-foreground hover:text-neon-cyan transition-colors font-mono py-2 px-3 hover:bg-neon-cyan/10 active:bg-neon-cyan/20 touch-manipulation"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
