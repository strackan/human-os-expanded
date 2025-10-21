import React from 'react';
import { Customer } from '../../types/customer';

interface CustomerTableHeaderProps {
  sortField: keyof Customer;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Customer) => void;
  selectedCount: number;
  totalCount: number;
  onSelectAll: (selected: boolean) => void;
}

/**
 * CustomerTableHeader Component
 *
 * Table header with sortable columns and select-all checkbox.
 * Displays sort indicators for active sort field.
 */
export const CustomerTableHeader: React.FC<CustomerTableHeaderProps> = ({
  sortField,
  sortDirection,
  onSort,
  selectedCount,
  totalCount,
  onSelectAll
}) => {
  const renderSortableHeader = (field: keyof Customer, label: string) => (
    <th
      scope="col"
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center">
        {label}
        {sortField === field && (
          <span className="ml-1">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <thead className="bg-gray-50">
      <tr>
        <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
          <input
            type="checkbox"
            className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 sm:left-6"
            checked={selectedCount === totalCount && totalCount > 0}
            onChange={(e) => onSelectAll(e.target.checked)}
          />
        </th>
        {renderSortableHeader('name', 'Customer Name')}
        {renderSortableHeader('industry', 'Industry')}
        {renderSortableHeader('health_score', 'Health Score')}
        {renderSortableHeader('current_arr', 'ARR')}
        {renderSortableHeader('renewal_date', 'Renewal Date')}
        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Primary Contact
        </th>
        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
  );
};
