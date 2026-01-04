/**
 * Session Timeline Component
 *
 * Visual timeline showing candidate's session history
 * Part of Release 1.6: Return Visit System
 */

'use client';

import React from 'react';
import type { SessionSummary, RelationshipStrength } from '@/types/talent';

interface SessionTimelineProps {
  sessions: SessionSummary[];
  relationshipStrength: RelationshipStrength;
  candidateName: string;
}

/**
 * Format date for display
 */
function formatSessionDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Get session type badge styling
 */
function getSessionTypeBadge(type: string) {
  switch (type) {
    case 'initial':
      return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Initial' };
    case 'check_in':
      return { bg: 'bg-green-100', text: 'text-green-800', label: 'Check-in' };
    case 'deep_dive':
      return { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Deep Dive' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800', label: type };
  }
}

/**
 * Get sentiment icon
 */
function getSentimentIcon(sentiment: string) {
  switch (sentiment) {
    case 'excited':
      return '🚀';
    case 'exploring':
      return '🔍';
    case 'frustrated':
      return '😤';
    case 'content':
      return '😊';
    default:
      return '💬';
  }
}

/**
 * Get relationship strength badge
 */
function getRelationshipBadge(strength: RelationshipStrength) {
  switch (strength) {
    case 'hot':
      return { bg: 'bg-red-100', text: 'text-red-800', icon: '🔥', label: 'Hot' };
    case 'warm':
      return { bg: 'bg-orange-100', text: 'text-orange-800', icon: '☀️', label: 'Warm' };
    case 'cold':
      return { bg: 'bg-blue-100', text: 'text-blue-800', icon: '❄️', label: 'Cold' };
  }
}

export function SessionTimeline({ sessions, relationshipStrength, candidateName }: SessionTimelineProps) {
  const relationshipBadge = getRelationshipBadge(relationshipStrength);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Session History
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} with {candidateName}
          </p>
        </div>

        {/* Relationship Strength Badge */}
        <div className={`${relationshipBadge.bg} ${relationshipBadge.text} px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1`}>
          <span>{relationshipBadge.icon}</span>
          <span>{relationshipBadge.label}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {sessions.map((session, index) => {
          const typeBadge = getSessionTypeBadge(session.type);
          const sentimentIcon = getSentimentIcon(session.sentiment);
          const isLatest = index === sessions.length - 1;

          return (
            <div key={session.session_id} className="relative">
              {/* Timeline line */}
              {index < sessions.length - 1 && (
                <div className="absolute left-3 top-10 bottom-0 w-0.5 bg-gray-200" />
              )}

              {/* Session card */}
              <div className={`flex gap-4 ${isLatest ? 'opacity-100' : 'opacity-75'}`}>
                {/* Timeline dot */}
                <div className={`flex-shrink-0 w-6 h-6 rounded-full ${isLatest ? 'bg-blue-500' : 'bg-gray-300'} border-4 border-white shadow-sm`} />

                {/* Content */}
                <div className="flex-1 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`${typeBadge.bg} ${typeBadge.text} text-xs px-2 py-1 rounded font-medium`}>
                        {typeBadge.label}
                      </span>
                      {isLatest && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium">
                          Latest
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatSessionDate(session.date)}
                    </span>
                  </div>

                  {/* Key Updates */}
                  <div className="space-y-1">
                    {session.key_updates.map((update, i) => (
                      <p key={i} className="text-sm text-gray-700">
                        <span className="mr-1">{sentimentIcon}</span>
                        {update}
                      </p>
                    ))}
                  </div>

                  {/* Sentiment */}
                  <div className="mt-2 text-xs text-gray-500">
                    Sentiment: <span className="capitalize">{session.sentiment}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {sessions.length === 0 && (
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">No sessions yet</p>
        </div>
      )}
    </div>
  );
}
