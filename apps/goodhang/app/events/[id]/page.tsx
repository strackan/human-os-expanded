import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { RSVPForm } from '@/components/RSVPForm';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  // Get event details
  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      rsvps (id, user_id, guest_name, guest_email, plus_ones)
    `)
    .eq('id', id)
    .single();

  if (error || !event) {
    notFound();
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user has already RSVPed
  const userRsvp = event.rsvps?.find((rsvp: { user_id?: string; guest_email?: string }) =>
    rsvp.user_id === user?.id || rsvp.guest_email === user?.email
  );

  // Calculate total attendees
  const totalAttendees = event.rsvps?.reduce((acc: number, rsvp: { plus_ones?: number }) =>
    acc + 1 + (rsvp.plus_ones || 0), 0
  ) || 0;

  // Format date
  const eventDate = new Date(event.event_datetime);
  const dateStr = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const isPast = new Date(event.event_datetime) < new Date();
  const isFull = event.capacity && totalAttendees >= event.capacity;

  return (
    <div className="min-h-screen scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-neon-purple/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="font-mono text-2xl font-bold">
            <span className="neon-purple">GOOD_HANG</span>
          </Link>
          <div className="flex gap-6 items-center">
            <Link href="/events" className="text-foreground hover:text-neon-cyan transition-colors font-mono">
              ← Back to Events
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Event Header */}
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-bold font-mono neon-cyan mb-6">
              {event.title}
            </h1>

            {/* Event Meta */}
            <div className="space-y-3 font-mono text-lg">
              <div className="flex items-center gap-3">
                <span className="text-neon-magenta">📅</span>
                <span className="text-foreground">{dateStr}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-neon-magenta">🕐</span>
                <span className="text-foreground">{timeStr}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-neon-magenta">📍</span>
                <span className="text-foreground">{event.location}</span>
              </div>
              {totalAttendees > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-neon-purple">👥</span>
                  <span className="text-foreground">
                    {totalAttendees} attending
                    {event.capacity && ` (${event.capacity - totalAttendees} spots left)`}
                  </span>
                </div>
              )}
            </div>

            {/* RSVP Button - Only show if not past and not full and not already RSVPed */}
            {!isPast && !isFull && !userRsvp && (
              <div className="mt-6">
                <a
                  href="#rsvp-section"
                  className="inline-block px-8 py-3 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-background font-mono uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,204,221,0.5)]"
                >
                  RSVP Now
                </a>
              </div>
            )}
          </div>

          {/* Event Description */}
          {event.description && (
            <div className="border-2 border-neon-cyan/30 bg-background-lighter p-8 mb-8">
              <h2 className="text-2xl font-bold font-mono neon-cyan mb-4">About This Event</h2>
              <p className="text-foreground-dim font-mono text-lg leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* RSVP Section */}
          <div id="rsvp-section" className="border-2 border-neon-purple/30 bg-background-lighter p-8 scroll-mt-24">
            {isPast ? (
              <div className="text-center">
                <p className="text-foreground-dim font-mono text-lg mb-4">
                  This event has already happened
                </p>
                <p className="text-foreground-dim font-mono text-sm">
                  Check out <Link href="/events" className="text-neon-cyan hover:text-neon-magenta transition-colors">upcoming events</Link>
                </p>
              </div>
            ) : userRsvp ? (
              <div className="text-center">
                <div className="text-6xl mb-4">✓</div>
                <h2 className="text-3xl font-bold font-mono neon-cyan mb-4">
                  YOU&apos;RE ON THE LIST!
                </h2>
                <p className="text-foreground-dim font-mono mb-6">
                  We&apos;ll see you there!
                  {userRsvp.plus_ones > 0 && ` (You + ${userRsvp.plus_ones})`}
                </p>
                <p className="text-foreground-dim font-mono text-sm">
                  Need to cancel? Email{' '}
                  <a href="mailto:hello@goodhang.club" className="text-neon-cyan hover:text-neon-magenta transition-colors">
                    hello@goodhang.club
                  </a>
                </p>
              </div>
            ) : isFull ? (
              <div className="text-center">
                <p className="text-neon-magenta font-mono text-xl mb-4">
                  Event is Full
                </p>
                <p className="text-foreground-dim font-mono text-sm">
                  Check out <Link href="/events" className="text-neon-cyan hover:text-neon-magenta transition-colors">other events</Link>
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-bold font-mono neon-purple mb-4">
                  RSVP NOW
                </h2>
                <p className="text-foreground-dim font-mono mb-8">
                  Reserve your spot. We&apos;ll send you event reminders.
                </p>
                <RSVPForm eventId={event.id} currentUser={user} />
              </>
            )}
          </div>

          {/* Attendee List (optional - simple count for now) */}
          {event.rsvps && event.rsvps.length > 0 && (
            <div className="mt-8 border-2 border-foreground-dim/20 bg-background-lighter p-6">
              <h3 className="text-xl font-bold font-mono neon-magenta mb-4">
                Who&apos;s Coming
              </h3>
              <p className="text-foreground-dim font-mono text-sm">
                {totalAttendees} {totalAttendees === 1 ? 'person is' : 'people are'} attending this event
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
