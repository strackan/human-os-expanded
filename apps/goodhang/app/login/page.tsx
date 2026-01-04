'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LinkedInSignInButton } from '@/components/auth/LinkedInSignInButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  // Create client lazily to avoid SSR issues during build
  const supabase = useMemo(() => createClient(), []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/members');
      router.refresh();
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for the login link!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="font-mono text-4xl font-bold neon-purple mb-2">
              GOOD_HANG
            </h1>
          </Link>
          <p className="text-foreground-dim font-mono text-sm">
            Member Login
          </p>
        </div>

        {/* Login Form */}
        <div className="border-2 border-neon-purple/30 bg-background-lighter p-8">
          {error && (
            <div className="mb-4 p-3 border border-red-500/50 bg-red-500/10 text-red-400 font-mono text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 border border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan font-mono text-sm">
              {message}
            </div>
          )}

          {/* LinkedIn Sign In - Primary Method */}
          <div className="mb-6">
            <LinkedInSignInButton redirectTo="/members" variant="primary" fullWidth />
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neon-purple/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background-lighter text-foreground-dim font-mono">
                Or use email
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-mono text-foreground mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-background border-2 border-neon-cyan/30 text-foreground font-mono focus:border-neon-cyan focus:outline-none transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-mono text-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-background border-2 border-neon-cyan/30 text-foreground font-mono focus:border-neon-cyan focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-3 border-2 border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-background font-mono uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_20px_rgba(119,0,204,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleMagicLink}
              disabled={loading || !email}
              className="text-neon-cyan hover:text-neon-magenta transition-colors font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send magic link instead
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-neon-purple/20 text-center">
            <p className="text-foreground-dim font-mono text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/apply" className="text-neon-cyan hover:text-neon-magenta transition-colors">
                Apply for membership
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-foreground-dim hover:text-neon-cyan transition-colors font-mono text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
