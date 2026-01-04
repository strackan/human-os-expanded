import React from 'react';

interface CustomerFiltersPanelProps {
  industryFilter: string;
  onIndustryFilterChange: (value: string) => void;
  healthScoreMin: number | '';
  onHealthScoreMinChange: (value: number | '') => void;
  healthScoreMax: number | '';
  onHealthScoreMaxChange: (value: number | '') => void;
  minARR: number | '';
  onMinARRChange: (value: number | '') => void;
  onClearFilters: () => void;
}

/**
 * CustomerFiltersPanel Component
 *
 * Advanced filters panel for customer list filtering.
 * Includes industry, health score range, and minimum ARR filters.
 */
export const CustomerFiltersPanel: React.FC<CustomerFiltersPanelProps> = ({
  industryFilter,
  onIndustryFilterChange,
  healthScoreMin,
  onHealthScoreMinChange,
  healthScoreMax,
  onHealthScoreMaxChange,
  minARR,
  onMinARRChange,
  onClearFilters
}) => {
  return (
    <div id="customer-filters-panel" className="mt-4 pt-4 border-t border-gray-200">
      <div className="filters-grid">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
          <input
            type="text"
            placeholder="Filter by industry..."
            value={industryFilter}
            onChange={(e) => onIndustryFilterChange(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Health Score</label>
          <input
            type="number"
            min="0"
            max="100"
            placeholder="0"
            value={healthScoreMin}
            onChange={(e) => onHealthScoreMinChange(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Health Score</label>
          <input
            type="number"
            min="0"
            max="100"
            placeholder="100"
            value={healthScoreMax}
            onChange={(e) => onHealthScoreMaxChange(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min ARR ($)</label>
          <input
            type="number"
            min="0"
            step="1000"
            placeholder="0"
            value={minARR}
            onChange={(e) => onMinARRChange(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClearFilters}
          className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};
