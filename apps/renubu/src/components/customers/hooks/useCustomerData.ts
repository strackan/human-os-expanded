import { useState, useEffect, useCallback } from 'react';
import { CustomerWithContact, Customer } from '../../../types/customer';

interface UseCustomerDataProps {
  searchTerm?: string;
  localSearchTerm?: string;
  industryFilter?: string;
  healthScoreMin?: number | '';
  healthScoreMax?: number | '';
  minARR?: number | '';
  sortField: keyof Customer;
  sortDirection: 'asc' | 'desc';
  currentPage: number;
  customersPerPage: number;
}

/**
 * useCustomerData Hook
 *
 * Manages customer data fetching with filtering, sorting, and pagination.
 * Builds query parameters and handles API communication.
 */
export function useCustomerData({
  searchTerm,
  localSearchTerm,
  industryFilter,
  healthScoreMin,
  healthScoreMax,
  minARR,
  sortField,
  sortDirection,
  currentPage,
  customersPerPage
}: UseCustomerDataProps) {
  const [customers, setCustomers] = useState<CustomerWithContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCustomers, setTotalCustomers] = useState(0);

  const loadCustomers = useCallback(async () => {
    try {
      console.log('🔍 useCustomerData.loadCustomers called');
      setLoading(true);
      setError(null);

      // Build query parameters for API call
      const params = new URLSearchParams();

      // Use either external searchTerm or local search term
      const effectiveSearchTerm = searchTerm || localSearchTerm;
      if (effectiveSearchTerm) {
        params.append('search', effectiveSearchTerm);
      }

      if (industryFilter) {
        params.append('industry', industryFilter);
      }

      if (healthScoreMin !== '') {
        params.append('healthScoreMin', String(healthScoreMin));
      }

      if (healthScoreMax !== '') {
        params.append('healthScoreMax', String(healthScoreMax));
      }

      if (minARR !== '') {
        params.append('minARR', String(minARR));
      }

      params.append('sort', sortField);
      params.append('order', sortDirection);
      params.append('page', currentPage.toString());
      params.append('pageSize', customersPerPage.toString());

      console.log('🔍 useCustomerData calling /api/customers');
      const response = await fetch(`/api/customers?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      console.log('🔍 useCustomerData received result:', { customers: data.customers?.length || 0, count: data.count });
      setCustomers(data.customers || []);
      setTotalCustomers(data.count || 0);
    } catch (err) {
      console.error('Error loading customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, localSearchTerm, industryFilter, healthScoreMin, healthScoreMax, minARR, sortField, sortDirection, currentPage, customersPerPage]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return {
    customers,
    loading,
    error,
    totalCustomers,
    refetch: loadCustomers
  };
}
