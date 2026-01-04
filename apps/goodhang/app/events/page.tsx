import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { EventCard } from '@/components/EventCard';
import { MobileNav, DesktopNav } from '@/components/MobileNav';

export default async function EventsPage() {
  const supabase = await createClient();

  // Get current user (optional, to show if they've RSVPed)
  const { data: { user } } = await supabase.auth.getUser();

  // Build navigation links based on auth state
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/launch', label: 'Launch Party' },
    { href: '/members/directory', label: 'Members' },
    ...(user ? [{ href: '/fun', label: 'Fun Stuff' }] : []),
    user
      ? { href: '/members', label: 'Dashboard' }
      : { href: '/login', label: 'Login' }
  ];

  // Get all upcoming events
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select(`
      *,
      rsvps (id, user_id, guest_email, plus_ones)
    `)
    .gte('event_datetime', new Date().toISOString())
    .eq('is_public', true)
    .order('event_datetime', { ascending: true });

  // Get past events
  const { data: pastEvents } = await supabase
    .from('events')
    .select(`
      *,
      rsvps (id, user_id, guest_email, plus_ones)
    `)
    .lt('event_datetime', new Date().toISOString())
    .eq('is_public', true)
    .order('event_datetime', { ascending: false })
    .limit(6);

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
              EVENTS
            </h1>
            <p className="text-xl text-foreground-dim font-mono max-w-2xl mx-auto">
              From happy hours to road trips —
              <span className="text-neon-purple"> experiences you&apos;ll actually remember</span>
            </p>
          </div>

          {/* Upcoming Events */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold font-mono neon-purple mb-8">
              Upcoming Events
            </h2>

            {!upcomingEvents || upcomingEvents.length === 0 ? (
              <div className="border-2 border-neon-cyan/30 bg-background-lighter p-12 text-center">
                <p className="text-foreground-dim font-mono text-lg mb-4">
                  No upcoming events yet
                </p>
                <p className="text-foreground-dim font-mono text-sm mb-6">
                  Check back soon or RSVP for the launch party!
                </p>
                <Link
                  href="/launch"
                  className="inline-block px-8 py-3 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-background font-mono uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,204,221,0.5)]"
                >
                  Launch Party
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {upcomingEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    userRsvp={event.rsvps?.find((rsvp: { user_id?: string; guest_email?: string }) =>
                      rsvp.user_id === user?.id || rsvp.guest_email === user?.email
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Past Events */}
          {pastEvents && pastEvents.length > 0 && (
            <div>
              <h2 className="text-2xl md:text-3xl font-bold font-mono neon-magenta mb-8">
                Past Events
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {pastEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isPast={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* CTA for Members */}
          <div className="mt-16 border-2 border-neon-purple/30 bg-background-lighter p-8 text-center">
            <h2 className="text-2xl font-bold font-mono neon-purple mb-4">
              WANT TO HOST AN EVENT?
            </h2>
            <p className="text-foreground-dim font-mono mb-6">
              Members can propose events and ambassadors can host official Good Hang experiences.
            </p>
            {user ? (
              <Link
                href="/members"
                className="inline-block px-8 py-3 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-background font-mono uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,204,221,0.5)]"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/apply"
                className="inline-block px-8 py-3 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-background font-mono uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,204,221,0.5)]"
              >
                Apply for Membership
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
