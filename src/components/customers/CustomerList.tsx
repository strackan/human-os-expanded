"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PencilIcon,
  WrenchIcon,
} from "@heroicons/react/24/outline";
import { CustomerService } from "../../lib/services/CustomerService";
import { Customer, CustomerWithContact, CustomerFilters, CustomerSortOptions } from "../../types/customer";

interface CustomerListProps {
  searchTerm?: string;
  onCustomerSelect?: (customer: CustomerWithContact) => void;
}

export default function CustomerList({ searchTerm = "", onCustomerSelect }: CustomerListProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerWithContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [sortField, setSortField] = useState<keyof Customer>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const customersPerPage = 10;

  useEffect(() => {
    loadCustomers();
  }, [searchTerm, currentPage, sortField, sortDirection]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: CustomerFilters = {};
      if (searchTerm) {
        filters.search = searchTerm;
      }

      const sort: CustomerSortOptions = {
        field: sortField,
        direction: sortDirection
      };

      const result = await CustomerService.getCustomers(
        filters,
        sort,
        currentPage,
        customersPerPage
      );

      setCustomers(result.customers);
      setTotalCustomers(result.total);
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

  const totalPages = Math.ceil(totalCustomers / customersPerPage);

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
              <tr key={c.id} className="hover:bg-gray-50">
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
                  {c.industry}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthColor(c.health_score)}`}>
                    {c.health_score}/100
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  ${c.current_arr ? c.current_arr.toLocaleString() : '0'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  {c.renewal_date ? new Date(c.renewal_date).toLocaleDateString() : 'Not set'}
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
                      onClick={() => router.push(`/customers/${c.id}/edit`)}
                      className="text-indigo-600 hover:text-indigo-900"
                      aria-label={`Edit ${c.name}`}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
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
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * customersPerPage + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * customersPerPage, totalCustomers)}
                </span>{" "}
                of <span className="font-medium">{totalCustomers}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === page
                        ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 