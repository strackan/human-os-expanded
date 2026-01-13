import { useState, useCallback } from 'react';

/**
 * useCustomerFilters Hook
 *
 * Manages customer filtering state and operations:
 * - Search term
 * - Industry filter
 * - Health score range
 * - ARR minimum
 * - Filter panel visibility
 * - Clear all filters
 */
export function useCustomerFilters(initialSearchTerm: string = '') {
  const [localSearchTerm, setLocalSearchTerm] = useState(initialSearchTerm);
  const [industryFilter, setIndustryFilter] = useState('');
  const [healthScoreMin, setHealthScoreMin] = useState<number | ''>('');
  const [healthScoreMax, setHealthScoreMax] = useState<number | ''>('');
  const [minARR, setMinARR] = useState<number | ''>('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const clearFilters = useCallback(() => {
    setLocalSearchTerm('');
    setIndustryFilter('');
    setHealthScoreMin('');
    setHealthScoreMax('');
    setMinARR('');
  }, []);

  const hasActiveFilters = useCallback(() => {
    return !!(industryFilter || healthScoreMin !== '' || healthScoreMax !== '' || minARR !== '');
  }, [industryFilter, healthScoreMin, healthScoreMax, minARR]);

  return {
    localSearchTerm,
    setLocalSearchTerm,
    industryFilter,
    setIndustryFilter,
    healthScoreMin,
    setHealthScoreMin,
    healthScoreMax,
    setHealthScoreMax,
    minARR,
    setMinARR,
    showFiltersPanel,
    setShowFiltersPanel,
    clearFilters,
    hasActiveFilters
  };
}
