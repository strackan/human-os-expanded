import Link from 'next/link';
import type { Event } from '@/lib/types/database';

interface EventCardProps {
  event: Event & {
    rsvps?: Array<{ plus_ones?: number }>;
  };
  userRsvp?: { user_id?: string; guest_email?: string };
  isPast?: boolean;
}

export function EventCard({ event, userRsvp, isPast = false }: EventCardProps) {
  // Calculate total attendees
  const totalAttendees = event.rsvps?.reduce((acc, rsvp) => acc + 1 + (rsvp.plus_ones || 0), 0) || 0;

  // Format date
  const eventDate = new Date(event.event_datetime);
  const dateStr = eventDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const cardColor = isPast ? 'border-foreground-dim/20' : 'border-neon-cyan/30 hover:border-neon-cyan';
  const titleColor = isPast ? 'text-foreground-dim' : 'neon-cyan';

  return (
    <Link href={`/events/${event.id}`}>
      <div className={`border-2 ${cardColor} bg-background-lighter p-6 transition-all duration-300 ${!isPast && 'hover:scale-105 hover:shadow-[0_0_20px_rgba(0,204,221,0.2)]'} h-full flex flex-col`}>
        {/* Event Title */}
        <h3 className={`text-xl font-bold font-mono ${titleColor} mb-3`}>
          {event.title}
        </h3>

        {/* Date & Time */}
        <div className="mb-4 font-mono text-sm">
          <div className="text-neon-magenta mb-1">
            📅 {dateStr}
          </div>
          <div className="text-foreground-dim">
            🕐 {timeStr}
          </div>
          <div className="text-foreground-dim mt-1">
            📍 {event.location}
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-foreground-dim font-mono text-sm mb-4 line-clamp-3 flex-grow">
            {event.description}
          </p>
        )}

        {/* RSVP Status */}
        <div className="mt-auto pt-4 border-t border-neon-cyan/20">
          <div className="flex items-center justify-between">
            <div className="text-foreground-dim font-mono text-sm">
              {totalAttendees > 0 ? (
                <span>
                  <span className="text-neon-purple font-bold">{totalAttendees}</span> attending
                </span>
              ) : (
                <span>Be the first to RSVP!</span>
              )}
            </div>

            {userRsvp && !isPast && (
              <span className="px-3 py-1 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan font-mono text-xs uppercase">
                You&apos;re in!
              </span>
            )}
          </div>

          {!isPast && event.capacity && totalAttendees >= event.capacity && (
            <div className="mt-2 text-neon-magenta font-mono text-xs">
              Event is full
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
