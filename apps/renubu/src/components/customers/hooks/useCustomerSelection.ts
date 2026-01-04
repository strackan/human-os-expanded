import { useState, useCallback } from 'react';
import { CustomerWithContact } from '../../../types/customer';

/**
 * useCustomerSelection Hook
 *
 * Manages customer selection state for bulk operations:
 * - Individual customer selection
 * - Select all / deselect all
 * - Clear selection
 * - Export selected customers to CSV
 */
export function useCustomerSelection() {
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());

  const selectCustomer = useCallback((customerId: string, selected: boolean) => {
    setSelectedCustomers(prev => {
      const newSelection = new Set(prev);
      if (selected) {
        newSelection.add(customerId);
      } else {
        newSelection.delete(customerId);
      }
      return newSelection;
    });
  }, []);

  const selectAll = useCallback((customers: CustomerWithContact[]) => {
    setSelectedCustomers(new Set(customers.map(c => c.id)));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedCustomers(new Set());
  }, []);

  const toggleSelectAll = useCallback((selected: boolean, customers: CustomerWithContact[]) => {
    if (selected) {
      selectAll(customers);
    } else {
      deselectAll();
    }
  }, [selectAll, deselectAll]);

  const exportToCSV = useCallback((customers: CustomerWithContact[]) => {
    const customersToExport = selectedCustomers.size > 0
      ? customers.filter(c => selectedCustomers.has(c.id))
      : customers;

    const csvContent = [
      // CSV headers
      ['Name', 'Industry', 'Health Score', 'Current ARR', 'Renewal Date', 'Primary Contact'].join(','),
      // CSV data
      ...customersToExport.map(customer => [
        `"${customer.name}"`,
        `"${customer.industry || ''}"`,
        customer.health_score,
        customer.current_arr || 0,
        customer.renewal_date || '',
        customer.primary_contact
          ? `"${customer.primary_contact.first_name} ${customer.primary_contact.last_name}"`
          : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [selectedCustomers]);

  return {
    selectedCustomers,
    selectCustomer,
    selectAll,
    deselectAll,
    toggleSelectAll,
    exportToCSV
  };
}
