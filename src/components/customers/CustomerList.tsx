"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PencilIcon,
  WrenchIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { CustomerService } from "../../lib/services/CustomerService";
import { Customer, CustomerWithContact, CustomerFilters, CustomerSortOptions } from "../../types/customer";
import EditableCell from "../common/EditableCell";

interface CustomerListProps {
  searchTerm?: string;
  onCustomerSelect?: (customer: CustomerWithContact) => void;
  onAddCustomer?: () => void;
  showAddButton?: boolean;
  showFilters?: boolean;
  showExportButton?: boolean;
  highlightedCustomerId?: string | null;
}

export default function CustomerList({ 
  searchTerm = "", 
  onCustomerSelect, 
  onAddCustomer,
  showAddButton = true, 
  showFilters = true, 
  showExportButton = true,
  highlightedCustomerId = null
}: CustomerListProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerWithContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [sortField, setSortField] = useState<keyof Customer>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Enhanced search and filter states
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [industryFilter, setIndustryFilter] = useState('');
  const [healthScoreMin, setHealthScoreMin] = useState<number | ''>('');
  const [healthScoreMax, setHealthScoreMax] = useState<number | ''>('');
  const [minARR, setMinARR] = useState<number | ''>('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [customersPerPage, setCustomersPerPage] = useState(25);

  useEffect(() => {
    loadCustomers();
  }, [searchTerm, localSearchTerm, industryFilter, healthScoreMin, healthScoreMax, minARR, currentPage, sortField, sortDirection, customersPerPage]);

  const loadCustomers = async () => {
    try {
      console.log('🔍 CustomerList.loadCustomers called');
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
        params.append('healthScoreMin', healthScoreMin.toString());
      }
      
      if (healthScoreMax !== '') {
        params.append('healthScoreMax', healthScoreMax.toString());
      }
      
      if (minARR !== '') {
        params.append('minARR', minARR.toString());
      }

      params.append('sort', sortField);
      params.append('order', sortDirection);
      params.append('page', currentPage.toString());
      params.append('pageSize', customersPerPage.toString());

      console.log('🔍 CustomerList calling /api/customers');
      const response = await fetch(`/api/customers?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('🔍 CustomerList received result:', { customers: data.customers?.length || 0, count: data.count });
      setCustomers(data.customers || []);
      setTotalCustomers(data.count || 0);
    } catch (err) {
      console.error('Error loading customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (customer: CustomerWithContact) => {
    // Convert customer name to URL-friendly format
    const customerKey = customer.name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
    router.push(`/customers/${customerKey}`);
  };

  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const handleSelectCustomer = (customerId: string, selected: boolean) => {
    const newSelection = new Set(selectedCustomers);
    if (selected) {
      newSelection.add(customerId);
    } else {
      newSelection.delete(customerId);
    }
    setSelectedCustomers(newSelection);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedCustomers(new Set(customers.map(c => c.id)));
    } else {
      setSelectedCustomers(new Set());
    }
  };

  const handleExportCustomers = () => {
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
  };

  const clearFilters = () => {
    setLocalSearchTerm('');
    setIndustryFilter('');
    setHealthScoreMin('');
    setHealthScoreMax('');
    setMinARR('');
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setCustomersPerPage(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleUpdateCustomer = async (customerId: string, field: keyof Customer, value: string | number) => {
    try {
      await CustomerService.updateCustomer(customerId, { [field]: value });
      // Refresh the list to show updated data
      loadCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
      // You could add a toast notification here
    }
  };

  const validateHealthScore = (value: string | number): boolean => {
    const numValue = Number(value);
    return numValue >= 0 && numValue <= 100;
  };

  const validateARR = (value: string | number): boolean => {
    const numValue = Number(value);
    return numValue >= 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading customers</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadCustomers}
                className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No customers found.</p>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(totalCustomers / customersPerPage));



  return (
    <div className="space-y-4">
      {/* Enhanced Header with Search, Filters, and Actions */}
      <div className="bg-white shadow-sm rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search Bar with Advanced Filters Link */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {showFilters && (
              <div className="mt-2">
                <button
                  onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                  className={`text-sm font-medium transition-colors ${
                    showFiltersPanel ? 'text-blue-700' : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  Advanced Filters
                  {(industryFilter || healthScoreMin !== '' || healthScoreMax !== '' || minARR !== '') && (
                    <span className="ml-1 inline-flex items-center justify-center w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">

            {showExportButton && (
              <button
                onClick={handleExportCustomers}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export {selectedCustomers.size > 0 ? `(${selectedCustomers.size})` : ''}
              </button>
            )}

            {showAddButton && (
              <button
                onClick={onAddCustomer || (() => router.push('/customers/manage'))}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Customer
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFiltersPanel && showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <input
                  type="text"
                  placeholder="Filter by industry..."
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
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
                  onChange={(e) => setHealthScoreMin(e.target.value === '' ? '' : Number(e.target.value))}
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
                  onChange={(e) => setHealthScoreMax(e.target.value === '' ? '' : Number(e.target.value))}
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
                  onChange={(e) => setMinARR(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Selection Summary */}
        {selectedCustomers.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedCustomers.size} customer{selectedCustomers.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedCustomers(new Set())}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                <input
                  type="checkbox"
                  className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 sm:left-6"
                  checked={selectedCustomers.size === customers.length && customers.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Customer Name
                  {sortField === 'name' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('industry')}
              >
                <div className="flex items-center">
                  Industry
                  {sortField === 'industry' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('health_score')}
              >
                <div className="flex items-center">
                  Health Score
                  {sortField === 'health_score' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('current_arr')}
              >
                <div className="flex items-center">
                  ARR
                  {sortField === 'current_arr' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('renewal_date')}
              >
                <div className="flex items-center">
                  Renewal Date
                  {sortField === 'renewal_date' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Primary Contact
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((c) => (
              <tr key={c.id} className={`hover:bg-gray-50 transition-colors duration-300 ${
                selectedCustomers.has(c.id) ? 'bg-blue-50' : 
                highlightedCustomerId === c.id ? 'bg-green-100 animate-pulse' : ''
              }`}>
                <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                  <input
                    type="checkbox"
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 sm:left-6"
                    checked={selectedCustomers.has(c.id)}
                    onChange={(e) => handleSelectCustomer(c.id, e.target.checked)}
                  />
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <button
                    onClick={() => handleView(c)}
                    className="text-blue-600 hover:text-blue-800 hover:underline transition-all duration-200 font-medium"
                    aria-label={`View ${c.name} details`}
                  >
                    {c.name}
                  </button>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  <EditableCell
                    value={c.industry}
                    onSave={(newValue) => handleUpdateCustomer(c.id, 'industry', newValue)}
                    type="text"
                    placeholder="Enter industry"
                  />
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex justify-center">
                    <EditableCell
                      value={c.health_score}
                      onSave={(newValue) => handleUpdateCustomer(c.id, 'health_score', newValue)}
                      type="number"
                      placeholder="0-100"
                      validateValue={validateHealthScore}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthColor(c.health_score)}`}
                      displayFormat={(value) => `${value}/100`}
                    />
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  <EditableCell
                    value={c.current_arr || 0}
                    onSave={(newValue) => handleUpdateCustomer(c.id, 'current_arr', newValue)}
                    type="number"
                    placeholder="Enter ARR"
                    validateValue={validateARR}
                    displayFormat={(value) => `$${Number(value).toLocaleString()}`}
                  />
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  <EditableCell
                    value={c.renewal_date || ''}
                    onSave={(newValue) => handleUpdateCustomer(c.id, 'renewal_date', newValue)}
                    type="date"
                    placeholder="Select date"
                    displayFormat={(value) => value ? new Date(value).toLocaleDateString() : 'Not set'}
                  />
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  {c.primary_contact 
                    ? `${c.primary_contact.first_name} ${c.primary_contact.last_name}`
                    : 'No contact'
                  }
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/customers/${c.id}/manage`)}
                      className="text-gray-600 hover:text-gray-900"
                      aria-label={`Manage ${c.name}`}
                    >
                      <WrenchIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination - Always show when there are customers */}
        <div className="bg-white border-t border-gray-200 px-4 py-3 sm:px-6">
          {/* Mobile view */}
          <div className="flex flex-col space-y-3 sm:hidden">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{totalCustomers > 0 ? currentPage : 0}</span> of <span className="font-medium">{totalCustomers > 0 ? totalPages : 0}</span>
              </p>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700">Rows:</label>
                <select
                  value={customersPerPage}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>

          {/* Desktop view */}
          <div className="hidden sm:flex sm:items-center sm:justify-between">
            {/* Left side - Results info */}
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-700">
                {totalCustomers > 0 ? (
                  <>
                    Showing <span className="font-medium">{(currentPage - 1) * customersPerPage + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * customersPerPage, totalCustomers)}
                    </span>{" "}
                    of <span className="font-medium">{totalCustomers}</span> results
                  </>
                ) : (
                  <span>No results found</span>
                )}
              </p>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700">Rows per page:</label>
                <select
                  value={customersPerPage}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Right side - Pagination controls */}
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{totalCustomers > 0 ? currentPage : 0}</span> of <span className="font-medium">{totalCustomers > 0 ? totalPages : 0}</span>
              </p>
              {totalPages > 1 && (
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* No customers message - only show when search/filter produces no results */}
      {customers.length === 0 && !loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {localSearchTerm || industryFilter || healthScoreMin !== '' || healthScoreMax !== '' || minARR !== '' 
                ? 'Try adjusting your search or filters.' 
                : 'Get started by adding your first customer.'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 