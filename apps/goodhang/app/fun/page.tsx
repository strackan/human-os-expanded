import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface FunLink {
  href: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  badge?: string;
}

const FUN_LINKS: FunLink[] = [
  {
    href: '/character',
    title: 'D&D Character',
    description: 'Discover your fantasy archetype through personality assessment',
    emoji: '🐉',
    color: 'neon-purple',
    badge: 'NEW',
  },
  {
    href: '/favors',
    title: 'Favor Tokens',
    description: 'Exchange unique collectible tokens for favors with members',
    emoji: '🎭',
    color: 'neon-gold',
    badge: 'NEW',
  },
  {
    href: '/beacons',
    title: 'Happy Hour Beacons',
    description: 'Drop a pin when you\'re out - see who\'s nearby and wants to hang',
    emoji: '📍',
    color: 'neon-magenta',
    badge: 'NEW',
  },
  {
    href: '/assessment/start',
    title: 'CS Assessment',
    description: 'AI-powered technical interview for the talent bench',
    emoji: '🧠',
    color: 'neon-cyan',
  },
  {
    href: '/assessment/lightning',
    title: 'Lightning Round',
    description: 'Quick-fire questions to test your instincts',
    emoji: '⚡',
    color: 'neon-cyan',
  },
  {
    href: '/assessment/absurdist',
    title: 'Absurdist Questions',
    description: 'Weird hypotheticals that reveal your true nature',
    emoji: '🎪',
    color: 'neon-purple',
  },
];

export default async function FunPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile for admin check
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_role, name')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-neon-purple/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="font-mono text-2xl font-bold glitch-hover">
            <span className="neon-purple">GOOD_HANG</span>
          </Link>
          <div className="flex gap-6 items-center">
            <Link href="/members" className="text-foreground hover:text-neon-cyan transition-colors font-mono">
              Dashboard
            </Link>
            <Link href="/events" className="text-foreground hover:text-neon-cyan transition-colors font-mono">
              Events
            </Link>
            <Link href="/fun" className="text-neon-cyan hover:text-neon-magenta transition-colors font-mono">
              Fun Stuff
            </Link>
            {profile?.user_role === 'admin' && (
              <Link href="/admin" className="text-neon-purple hover:text-neon-magenta transition-colors font-mono">
                Admin
              </Link>
            )}
            <form action="/logout" method="POST">
              <button className="text-foreground-dim hover:text-neon-cyan transition-colors font-mono text-sm">
                Logout
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold font-mono neon-cyan mb-4">
              FUN STUFF
            </h1>
            <p className="text-xl text-foreground-dim font-mono max-w-2xl mx-auto">
              Games, assessments, and ways to connect with members
            </p>
          </div>

          {/* Fun Links Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {FUN_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative border-2 border-${link.color}/30 hover:border-${link.color} bg-background-lighter p-6 transition-all duration-300 hover:scale-[1.02]`}
              >
                {link.badge && (
                  <span className="absolute top-4 right-4 px-2 py-0.5 bg-neon-magenta/20 border border-neon-magenta text-neon-magenta font-mono text-xs uppercase">
                    {link.badge}
                  </span>
                )}
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{link.emoji}</span>
                  <div>
                    <h3 className={`text-xl font-bold font-mono text-${link.color} mb-2 group-hover:text-foreground transition-colors`}>
                      {link.title}
                    </h3>
                    <p className="text-foreground-dim font-mono text-sm">
                      {link.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Coming Soon Section */}
          <div className="mt-12 border-2 border-foreground-dim/30 bg-background-lighter/50 p-8 text-center">
            <h2 className="text-xl font-bold font-mono text-foreground-dim mb-2">
              MORE COMING SOON
            </h2>
            <p className="text-foreground-dim/70 font-mono text-sm">
              Leaderboards, achievements, and more ways to have fun
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
