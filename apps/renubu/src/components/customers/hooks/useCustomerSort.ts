import { useState, useCallback } from 'react';
import { Customer } from '../../../types/customer';

/**
 * useCustomerSort Hook
 *
 * Manages table sorting state and operations:
 * - Current sort field
 * - Sort direction (asc/desc)
 * - Toggle sort on column click
 */
export function useCustomerSort(initialField: keyof Customer = 'name', initialDirection: 'asc' | 'desc' = 'asc') {
  const [sortField, setSortField] = useState<keyof Customer>(initialField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialDirection);

  const handleSort = useCallback((field: keyof Customer, onPageReset?: () => void) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    // Reset to first page when sorting changes
    if (onPageReset) {
      onPageReset();
    }
  }, [sortField]);

  return {
    sortField,
    sortDirection,
    handleSort
  };
}
