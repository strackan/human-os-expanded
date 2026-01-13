"use client";

import React from "react";
import CustomerCard from "./CustomerCard";
import { CustomerWithContact } from "../../types/customer";

interface CustomerGridProps {
  customers: CustomerWithContact[];
  variant?: 'default' | 'compact' | 'detailed';
  columns?: 1 | 2 | 3 | 4;
  showActions?: boolean;
  onEdit?: (customer: CustomerWithContact) => void;
  onView?: (customer: CustomerWithContact) => void;
  onManage?: (customer: CustomerWithContact) => void;
  onLaunchWorkflow?: (customer: CustomerWithContact) => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  className?: string;
}

export default function CustomerGrid({
  customers,
  variant = 'default',
  columns = 3,
  showActions = true,
  onEdit,
  onView,
  onManage,
  onLaunchWorkflow,
  loading = false,
  emptyMessage = "No customers found",
  emptyDescription = "Get started by adding your first customer.",
  className = ''
}: CustomerGridProps) {
  const getGridClasses = () => {
    const baseClasses = "grid gap-6";
    switch (columns) {
      case 1:
        return `${baseClasses} grid-cols-1`;
      case 2:
        return `${baseClasses} grid-cols-1 md:grid-cols-2`;
      case 3:
        return `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-3`;
      case 4:
        return `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`;
      default:
        return `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-3`;
    }
  };

  if (loading) {
    return (
      <div className={`${getGridClasses()} ${className}`}>
        {Array.from({ length: columns * 2 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
            {showActions && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                  <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                </div>
                <div className="w-full h-8 bg-gray-200 rounded mt-2"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">{emptyMessage}</h3>
        <p className="mt-1 text-sm text-gray-500">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className={`${getGridClasses()} ${className}`}>
      {customers.map((customer) => (
        <CustomerCard
          key={customer.id}
          customer={customer}
          variant={variant}
          showActions={showActions}
          onEdit={onEdit}
          onView={onView}
          onManage={onManage}
          onLaunchWorkflow={onLaunchWorkflow}
        />
      ))}
    </div>
  );
}
