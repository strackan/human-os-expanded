'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { BeaconWithDetails } from '@/lib/types/database';

interface BeaconCardProps {
  beacon: BeaconWithDetails;
  isOwner?: boolean;
  isNew?: boolean;
  onRespond?: (beaconId: string, type: 'on_my_way' | 'next_time') => void;
  onPing?: (beaconId: string) => void;
  onClose?: (beaconId: string) => void;
}

/**
 * Format relative time (e.g., "5 min ago", "2 hours ago")
 */
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/**
 * Format duration hint
 */
function formatDuration(hint: string | null): string | null {
  switch (hint) {
    case 'quick_drink':
      return 'Quick drink';
    case 'few_hours':
      return 'Few hours';
    case 'all_night':
      return 'All night';
    default:
      return null;
  }
}

/**
 * Format distance
 */
function formatDistance(miles: number | undefined): string | null {
  if (miles === undefined) return null;
  if (miles < 0.1) return 'Nearby';
  if (miles < 1) return `${(miles * 5280).toFixed(0)} ft`;
  return `${miles.toFixed(1)} mi`;
}

export function BeaconCard({
  beacon,
  isOwner = false,
  isNew = false,
  onRespond,
  onPing,
  onClose,
}: BeaconCardProps) {
  const isActive = beacon.status === 'active';
  const duration = formatDuration(beacon.duration_hint);
  const distance = formatDistance(beacon.distance_miles);
  const timeAgo = formatTimeAgo(beacon.created_at);
  const responseCounts = beacon.response_counts || { on_my_way: 0, next_time: 0 };

  return (
    <div
      className={`
        relative border-2 bg-background-lighter p-4 transition-all duration-300
        ${isActive ? 'border-neon-cyan/30 hover:border-neon-cyan' : 'border-foreground-dim/20'}
        ${isNew ? 'border-l-4 border-l-neon-magenta' : ''}
        ${isActive && !isOwner ? 'hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,204,221,0.2)]' : ''}
      `}
    >
      {/* Header: Avatar + Name + Time */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-neon-purple/20 border border-neon-purple/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {beacon.creator?.avatar_url ? (
            <Image
              src={beacon.creator.avatar_url}
              alt={beacon.creator.name || 'User avatar'}
              width={40}
              height={40}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-neon-purple font-mono font-bold text-sm">
              {beacon.creator?.name?.charAt(0).toUpperCase() || '?'}
            </span>
          )}
        </div>

        {/* Name + Company */}
        <div className="flex-1 min-w-0">
          <div className="font-mono font-bold text-foreground truncate">
            {beacon.creator?.name || 'Anonymous'}
          </div>
          {beacon.creator?.company && (
            <div className="font-mono text-xs text-foreground-dim truncate">
              {beacon.creator.company}
            </div>
          )}
        </div>

        {/* Time + Distance */}
        <div className="text-right flex-shrink-0">
          <div className="font-mono text-xs text-foreground-dim">{timeAgo}</div>
          {distance && (
            <div className="font-mono text-xs text-neon-purple">{distance}</div>
          )}
        </div>
      </div>

      {/* Venue */}
      <div className="mb-2">
        <div className={`font-mono font-bold ${isActive ? 'text-neon-cyan' : 'text-foreground-dim'}`}>
          {beacon.venue_name || beacon.venue_address || 'Unknown location'}
        </div>
        {beacon.venue_name && beacon.venue_address && (
          <div className="font-mono text-xs text-foreground-dim">
            📍 {beacon.venue_address}
          </div>
        )}
      </div>

      {/* Vibe Text */}
      {beacon.vibe_text && (
        <p className="font-mono text-sm text-foreground-dim mb-3 line-clamp-2">
          &ldquo;{beacon.vibe_text}&rdquo;
        </p>
      )}

      {/* Duration + Status */}
      <div className="flex items-center gap-2 mb-3">
        {isActive && (
          <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/50 text-green-400 font-mono text-xs rounded">
            Active
          </span>
        )}
        {duration && (
          <span className="px-2 py-0.5 bg-neon-purple/20 border border-neon-purple/50 text-neon-purple font-mono text-xs rounded">
            {duration}
          </span>
        )}
      </div>

      {/* Response Counts */}
      {(responseCounts.on_my_way > 0 || responseCounts.next_time > 0) && (
        <div className="flex items-center gap-4 mb-3 font-mono text-sm">
          {responseCounts.on_my_way > 0 && (
            <span className="text-neon-cyan">
              <span className="font-bold">{responseCounts.on_my_way}</span> on the way
            </span>
          )}
          {responseCounts.next_time > 0 && (
            <span className="text-foreground-dim">
              <span className="font-bold">{responseCounts.next_time}</span> next time
            </span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {isActive && (
        <div className="flex gap-2 pt-3 border-t border-neon-cyan/20">
          {isOwner ? (
            // Owner actions
            <>
              <Link
                href={`/beacons/${beacon.id}`}
                className="flex-1 py-2 text-center border-2 border-neon-cyan/30 text-neon-cyan font-mono text-sm rounded hover:border-neon-cyan transition-all"
              >
                View Details
              </Link>
              <button
                onClick={() => onClose?.(beacon.id)}
                className="flex-1 py-2 border-2 border-neon-magenta/30 text-neon-magenta font-mono text-sm rounded hover:border-neon-magenta transition-all"
              >
                Close Beacon
              </button>
            </>
          ) : (
            // Viewer actions
            <>
              <button
                onClick={() => onRespond?.(beacon.id, 'on_my_way')}
                className="flex-1 py-2 bg-neon-cyan/20 border-2 border-neon-cyan text-neon-cyan font-mono text-sm rounded hover:bg-neon-cyan hover:text-background transition-all"
              >
                On My Way
              </button>
              <button
                onClick={() => onRespond?.(beacon.id, 'next_time')}
                className="flex-1 py-2 border-2 border-foreground-dim/30 text-foreground-dim font-mono text-sm rounded hover:border-foreground-dim transition-all"
              >
                Next Time
              </button>
              <button
                onClick={() => onPing?.(beacon.id)}
                className="py-2 px-3 border-2 border-neon-purple/30 text-neon-purple font-mono text-sm rounded hover:border-neon-purple transition-all"
                title="Still there?"
              >
                ?
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
