'use client';

import { useState, useMemo } from 'react';
import type { Profile } from '@/lib/types/database';
import Image from 'next/image';

interface MemberGridProps {
  initialProfiles: Profile[];
}

export function MemberGrid({ initialProfiles }: MemberGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'free' | 'core'>('all');

  // Filter and search members
  const filteredProfiles = useMemo(() => {
    return initialProfiles.filter((profile) => {
      // Tier filter
      if (filterTier !== 'all' && profile.membership_tier !== filterTier) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = profile.name.toLowerCase().includes(query);
        const matchesRole = profile.role?.toLowerCase().includes(query);
        const matchesCompany = profile.company?.toLowerCase().includes(query);
        const matchesBio = profile.bio?.toLowerCase().includes(query);
        const matchesInterests = profile.interests?.some(interest =>
          interest.toLowerCase().includes(query)
        );

        return matchesName || matchesRole || matchesCompany || matchesBio || matchesInterests;
      }

      return true;
    });
  }, [initialProfiles, searchQuery, filterTier]);

  return (
    <>
      {/* Search and Filter */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search members by name, role, company, or interests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-background border-2 border-neon-cyan/30 text-foreground font-mono focus:border-neon-cyan focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-dim hover:text-neon-cyan transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => setFilterTier('all')}
            className={`px-6 py-2 font-mono uppercase text-sm transition-all ${
              filterTier === 'all'
                ? 'border-2 border-neon-cyan text-neon-cyan'
                : 'border border-foreground-dim/30 text-foreground-dim hover:text-neon-cyan hover:border-neon-cyan/50'
            }`}
          >
            All Members
          </button>
          <button
            onClick={() => setFilterTier('free')}
            className={`px-6 py-2 font-mono uppercase text-sm transition-all ${
              filterTier === 'free'
                ? 'border-2 border-neon-magenta text-neon-magenta'
                : 'border border-foreground-dim/30 text-foreground-dim hover:text-neon-magenta hover:border-neon-magenta/50'
            }`}
          >
            Founding
          </button>
          <button
            onClick={() => setFilterTier('core')}
            className={`px-6 py-2 font-mono uppercase text-sm transition-all ${
              filterTier === 'core'
                ? 'border-2 border-neon-purple text-neon-purple'
                : 'border border-foreground-dim/30 text-foreground-dim hover:text-neon-purple hover:border-neon-purple/50'
            }`}
          >
            Core
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 text-center">
        <p className="text-foreground-dim font-mono text-sm">
          Showing <span className="text-neon-cyan">{filteredProfiles.length}</span> of {initialProfiles.length} members
        </p>
      </div>

      {/* Member Grid */}
      {filteredProfiles.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-foreground-dim font-mono text-lg mb-2">No members found</p>
          <p className="text-foreground-dim font-mono text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <MemberCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </>
  );
}

function MemberCard({ profile }: { profile: Profile }) {
  const tierColor = profile.membership_tier === 'core' ? 'neon-purple' : 'neon-magenta';
  const tierBorder = profile.membership_tier === 'core' ? 'border-neon-purple/30' : 'border-neon-magenta/30';

  return (
    <div className={`border-2 ${tierBorder} bg-background-lighter p-6 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(119,0,204,0.3)]`}>
      {/* Avatar & Name */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-background border-2 border-neon-cyan/30 flex-shrink-0">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.name}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neon-cyan font-mono text-2xl">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold font-mono neon-cyan truncate">
            {profile.name}
          </h3>
          {profile.role && (
            <p className="text-foreground-dim font-mono text-sm truncate">
              {profile.role}
            </p>
          )}
          {profile.company && (
            <p className="text-foreground-dim font-mono text-xs truncate">
              @ {profile.company}
            </p>
          )}
        </div>
      </div>

      {/* Membership Badge */}
      <div className="mb-3">
        <span className={`inline-block px-3 py-1 text-xs font-mono uppercase tracking-wider ${tierColor} border border-current`}>
          {profile.membership_tier === 'core' ? 'Core Member' : 'Founding Member'}
        </span>
        {profile.user_role === 'ambassador' && (
          <span className="inline-block px-3 py-1 text-xs font-mono uppercase tracking-wider neon-cyan border border-current ml-2">
            Ambassador
          </span>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-foreground-dim font-mono text-sm mb-4 line-clamp-3">
          {profile.bio}
        </p>
      )}

      {/* Interests */}
      {profile.interests && profile.interests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {profile.interests.slice(0, 3).map((interest, idx) => (
            <span
              key={idx}
              className="px-2 py-1 text-xs font-mono bg-background border border-neon-cyan/20 text-foreground-dim"
            >
              {interest}
            </span>
          ))}
          {profile.interests.length > 3 && (
            <span className="px-2 py-1 text-xs font-mono text-foreground-dim">
              +{profile.interests.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* LinkedIn Link */}
      {profile.linkedin_url && (
        <div className="mt-4 pt-4 border-t border-neon-cyan/20">
          <a
            href={profile.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-cyan hover:text-neon-magenta transition-colors font-mono text-sm"
          >
            LinkedIn →
          </a>
        </div>
      )}
    </div>
  );
}
