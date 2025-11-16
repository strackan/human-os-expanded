'use client';

/**
 * Parking Lot Card Component
 * Displays a single parking lot item with mode badge, readiness score, and actions
 */

import { useState } from 'react';
import {
  ChevronRight,
  Sparkles,
  MessageSquare,
  Workflow,
  Archive,
  Clock,
  Shield
} from 'lucide-react';
import type { ParkingLotItem } from '@/types/parking-lot';
import { MODE_LABELS, MODE_ICONS, MODE_COLORS, STATUS_LABELS } from '@/types/parking-lot';

interface ParkingLotCardProps {
  item: ParkingLotItem;
  onBrainstorm?: (item: ParkingLotItem) => void;
  onConvert?: (item: ParkingLotItem) => void;
  onArchive?: (item: ParkingLotItem) => void;
  onDelete?: (item: ParkingLotItem) => void;
  onClick?: (item: ParkingLotItem) => void;
}

export default function ParkingLotCard({
  item,
  onBrainstorm,
  onConvert,
  onArchive,
  onClick
}: ParkingLotCardProps) {
  const [showActions, setShowActions] = useState(false);

  const modeColor = MODE_COLORS[item.capture_mode];
  const modeIcon = MODE_ICONS[item.capture_mode];
  const modeLabel = MODE_LABELS[item.capture_mode];

  // Readiness color
  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-gray-600 bg-gray-50';
  };

  // Has wake trigger?
  const hasWakeTrigger = item.wake_triggers && item.wake_triggers.length > 0;
  const triggerFired = item.trigger_fired_at !== null;

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow relative group cursor-pointer"
      onClick={() => onClick?.(item)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header: Mode badge + Readiness */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: modeColor + '20',
              color: modeColor
            }}
          >
            <span>{modeIcon}</span>
            <span>{modeLabel}</span>
          </span>

          {item.status !== 'active' && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              {STATUS_LABELS[item.status]}
            </span>
          )}
        </div>

        {/* Readiness Score */}
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold ${getReadinessColor(item.readiness_score)}`}>
          <span>{item.readiness_score}</span>
          <span className="text-xs opacity-60">/100</span>
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {item.cleaned_text}
      </h3>

      {/* Categories */}
      {item.user_categories && item.user_categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {item.user_categories.slice(0, 3).map((category) => (
            <span
              key={category}
              className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
            >
              {category}
            </span>
          ))}
          {item.user_categories.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
              +{item.user_categories.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Metadata Row */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{new Date(item.created_at).toLocaleDateString()}</span>
        </div>

        {hasWakeTrigger && (
          <div className="flex items-center gap-1 text-orange-600">
            <Shield className="w-3.5 h-3.5" />
            <span>Wake trigger set</span>
          </div>
        )}

        {triggerFired && (
          <div className="flex items-center gap-1 text-green-600 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready!</span>
          </div>
        )}
      </div>

      {/* Extracted Entities */}
      {item.extracted_entities.customers && item.extracted_entities.customers.length > 0 && (
        <div className="text-sm text-gray-600 mb-3">
          <span className="font-medium">Customers:</span>{' '}
          {item.extracted_entities.customers.join(', ')}
        </div>
      )}

      {/* Actions (on hover) */}
      {showActions && item.status === 'active' && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          {item.capture_mode === 'brainstorm' && !item.brainstorm_completed_at && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBrainstorm?.(item);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 text-sm font-medium rounded hover:bg-purple-100 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Start Brainstorm</span>
            </button>
          )}

          {(item.capture_mode === 'project' || item.readiness_score >= 70) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConvert?.(item);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded hover:bg-green-100 transition-colors"
            >
              <Workflow className="w-4 h-4" />
              <span>Convert to Workflow</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive?.(item);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 text-sm font-medium rounded hover:bg-gray-100 transition-colors ml-auto"
          >
            <Archive className="w-4 h-4" />
            <span>Archive</span>
          </button>
        </div>
      )}

      {/* Click indicator */}
      <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
}
