import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { MemberGrid } from '@/components/MemberGrid';
import { MobileNav, DesktopNav } from '@/components/MobileNav';

export default async function MemberDirectoryPage() {
  const supabase = await createClient();

  // Get all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  // Get current user to show appropriate nav
  const { data: { user } } = await supabase.auth.getUser();

  let currentProfile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    currentProfile = data;
  }

  // Build navigation links
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/launch', label: 'Launch Party' },
  ];

  if (user) {
    navLinks.push({ href: '/members', label: 'Dashboard' });
    if (currentProfile?.user_role === 'admin') {
      navLinks.push({ href: '/admin', label: 'Admin' });
    }
  } else {
    navLinks.push({ href: '/login', label: 'Login' });
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-neon-purple/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="font-mono text-2xl font-bold">
            <span className="neon-purple">GOOD_HANG</span>
          </Link>
          <div className="flex gap-4 items-center">
            <DesktopNav links={navLinks} />
            {user && (
              <form action="/logout" method="POST" className="hidden md:block">
                <button className="text-foreground-dim hover:text-neon-cyan transition-colors font-mono text-sm py-2 px-3 touch-manipulation">
                  Logout
                </button>
              </form>
            )}
            <MobileNav links={navLinks} />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold font-mono neon-cyan mb-4">
              MEMBER DIRECTORY
            </h1>
            <p className="text-xl text-foreground-dim font-mono max-w-2xl mx-auto">
              Meet the founding members of Good Hang —
              <span className="text-neon-purple"> the innovators, builders, and connectors</span>
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-12 font-mono">
            <div className="text-center">
              <div className="text-4xl font-bold neon-purple">{profiles?.length || 0}</div>
              <div className="text-foreground-dim text-sm uppercase tracking-wider mt-1">Founding Members</div>
            </div>
          </div>

          {/* Member Grid Component (Client-side for search) */}
          <MemberGrid initialProfiles={profiles || []} />

          {/* CTA */}
          <div className="mt-16 text-center border-2 border-neon-purple/30 bg-background-lighter p-8">
            <h2 className="text-2xl font-bold font-mono neon-purple mb-4">
              JOIN THE COMMUNITY
            </h2>
            <p className="text-foreground-dim font-mono mb-6">
              Want to be part of this? Apply for membership and join our community of tech professionals.
            </p>
            <Link
              href="/apply"
              className="inline-block px-8 py-3 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-background font-mono uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,204,221,0.5)]"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
