import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-neon-purple/20 py-8">
      <div className="container mx-auto px-6 text-center text-foreground-dim font-mono text-sm">
        <p>
          © 2025 Good Hang. A{' '}
          <a
            href="https://renubu.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-purple hover:text-neon-magenta transition-colors"
          >
            Renubu
          </a>{' '}
          initiative.
        </p>
        <div className="mt-2">
          <Link
            href="/privacy"
            className="text-neon-purple hover:text-neon-magenta transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
