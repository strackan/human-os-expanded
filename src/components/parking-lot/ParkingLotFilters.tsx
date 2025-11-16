'use client';

/**
 * Parking Lot Filters Component
 * Filter by mode, categories, readiness, and status
 */

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import type { CaptureMode, ParkingLotStatus } from '@/types/parking-lot';
import { MODE_LABELS, MODE_ICONS, STATUS_LABELS } from '@/types/parking-lot';

interface FilterState {
  modes: CaptureMode[];
  categories: string[];
  minReadiness: number | null;
  status: ParkingLotStatus | null;
  sortBy: 'readiness' | 'created' | 'updated';
}

interface ParkingLotFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  availableCategories: string[];
}

export default function ParkingLotFilters({
  filters,
  onChange,
  availableCategories
}: ParkingLotFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const toggleMode = (mode: CaptureMode) => {
    const newModes = filters.modes.includes(mode)
      ? filters.modes.filter(m => m !== mode)
      : [...filters.modes, mode];

    onChange({ ...filters, modes: newModes });
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];

    onChange({ ...filters, categories: newCategories });
  };

  const clearFilters = () => {
    onChange({
      modes: [],
      categories: [],
      minReadiness: null,
      status: null,
      sortBy: 'readiness'
    });
  };

  const activeFilterCount =
    filters.modes.length +
    filters.categories.length +
    (filters.minReadiness !== null ? 1 : 0) +
    (filters.status !== null ? 1 : 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Filter Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-blue-600 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => onChange({ ...filters, sortBy: e.target.value as any })}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="readiness">Readiness</option>
            <option value="created">Recently Added</option>
            <option value="updated">Recently Updated</option>
          </select>
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 space-y-4">
          {/* Modes Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode
            </label>
            <div className="flex flex-wrap gap-2">
              {(['project', 'expand', 'brainstorm', 'passive'] as CaptureMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => toggleMode(mode)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    filters.modes.includes(mode)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{MODE_ICONS[mode]}</span>
                  <span>{MODE_LABELS[mode]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Categories Filter */}
          {availableCategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      filters.categories.includes(category)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Readiness Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Readiness
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={filters.minReadiness ?? 0}
                onChange={(e) => onChange({ ...filters, minReadiness: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 min-w-[3rem] text-right">
                  {filters.minReadiness ?? 0}
                </span>
                {filters.minReadiness !== null && filters.minReadiness > 0 && (
                  <button
                    onClick={() => onChange({ ...filters, minReadiness: null })}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Any</span>
              <span>Ready (70+)</span>
              <span>Highly Ready (90+)</span>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {(['active', 'expanded', 'brainstorming', 'converted', 'archived'] as ParkingLotStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => onChange({ ...filters, status: filters.status === status ? null : status })}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    filters.status === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
