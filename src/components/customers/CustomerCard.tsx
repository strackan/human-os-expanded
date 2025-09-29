"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  PencilIcon,
  WrenchIcon,
  EyeIcon,
  PlayIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { CustomerWithContact } from "../../types/customer";
import { URL_PATTERNS } from "../../lib/constants";

interface CustomerCardProps {
  customer: CustomerWithContact;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onEdit?: (customer: CustomerWithContact) => void;
  onView?: (customer: CustomerWithContact) => void;
  onManage?: (customer: CustomerWithContact) => void;
  onLaunchWorkflow?: (customer: CustomerWithContact) => void;
  className?: string;
}

export default function CustomerCard({
  customer,
  variant = 'default',
  showActions = true,
  onEdit,
  onView,
  onManage,
  onLaunchWorkflow,
  className = ''
}: CustomerCardProps) {
  const router = useRouter();

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDefaultView = () => {
    // Use Salesforce-style URL pattern with customer ID
    router.push(URL_PATTERNS.VIEW_CUSTOMER(customer.id));
  };

  const handleDefaultEdit = () => {
    router.push(`/customers/${customer.id}/edit`);
  };

  const handleDefaultManage = () => {
    router.push(`/customers/${customer.id}/manage`);
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilRenewal = (renewalDate?: string) => {
    if (!renewalDate) return null;
    const days = Math.ceil((new Date(renewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (variant === 'compact') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <button
              onClick={onView || handleDefaultView}
              className="text-lg font-semibold text-gray-900 hover:text-blue-600 hover:underline transition-colors truncate block"
            >
              {customer.name}
            </button>
            <p className="text-sm text-gray-500 truncate">{customer.industry}</p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getHealthColor(customer.health_score)}`}>
              {customer.health_score}/100
            </span>
            {showActions && (
              <div className="flex space-x-1">
                <button
                  onClick={() => onView ? onView(customer) : handleDefaultView()}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="View details"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
                {onEdit && (
                  <button
                    onClick={() => onEdit(customer)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="Edit customer"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${className}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <button
                onClick={onView || handleDefaultView}
                className="text-xl font-bold text-gray-900 hover:text-blue-600 hover:underline transition-colors block"
              >
                {customer.name}
              </button>
              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                {customer.domain && (
                  <span className="flex items-center">
                    <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                    {customer.domain}
                  </span>
                )}
                <span>{customer.industry}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getHealthColor(customer.health_score)}`}>
                Health: {customer.health_score}/100
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Financial Info */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Financial</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-500">ARR:</span>
                  <span className="ml-2 font-medium">{formatCurrency(customer.current_arr)}</span>
                </div>
                {customer.renewal_date && (
                  <div className="flex items-center text-sm">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-500">Renewal:</span>
                    <span className="ml-2 font-medium">{formatDate(customer.renewal_date)}</span>
                    {(() => {
                      const days = getDaysUntilRenewal(customer.renewal_date);
                      if (days !== null) {
                        return (
                          <span className={`ml-2 text-xs px-2 py-1 rounded ${
                            days <= 30 ? 'bg-red-100 text-red-800' : days <= 90 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {days}d
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info */}
            {customer.primary_contact && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Primary Contact</h4>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">
                      {customer.primary_contact.first_name} {customer.primary_contact.last_name}
                    </span>
                    {customer.primary_contact.title && (
                      <div className="text-gray-500">{customer.primary_contact.title}</div>
                    )}
                  </div>
                  {customer.primary_contact.email && (
                    <div className="flex items-center text-sm">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <a
                        href={`mailto:${customer.primary_contact.email}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {customer.primary_contact.email}
                      </a>
                    </div>
                  )}
                  {customer.primary_contact.phone && (
                    <div className="flex items-center text-sm">
                      <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <a
                        href={`tel:${customer.primary_contact.phone}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {customer.primary_contact.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status & Metrics */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Status</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Assigned to:</span>
                  <span className="ml-2 text-sm font-medium">
                    {customer.assigned_to || 'Unassigned'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">Last updated:</span>
                  <span className="ml-2 text-sm font-medium">
                    {formatDate(customer.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex space-x-3">
                <button
                  onClick={() => onView ? onView(customer) : handleDefaultView()}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View Details
                </button>
                {onEdit && (
                  <button
                    onClick={() => onEdit(customer)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                )}
                {onManage && (
                  <button
                    onClick={() => onManage(customer)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <WrenchIcon className="h-4 w-4 mr-2" />
                    Manage
                  </button>
                )}
              </div>
              {onLaunchWorkflow && (
                <button
                  onClick={() => onLaunchWorkflow(customer)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Launch Workflow
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <button
            onClick={onView || handleDefaultView}
            className="text-lg font-semibold text-gray-900 hover:text-blue-600 hover:underline transition-colors block truncate"
          >
            {customer.name}
          </button>
          <p className="text-sm text-gray-500 mt-1">{customer.industry}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getHealthColor(customer.health_score)}`}>
          {customer.health_score}/100
        </span>
      </div>

      <div className="space-y-3">
        {customer.current_arr && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Current ARR:</span>
            <span className="font-medium">{formatCurrency(customer.current_arr)}</span>
          </div>
        )}

        {customer.renewal_date && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Renewal Date:</span>
            <span className="font-medium">{formatDate(customer.renewal_date)}</span>
          </div>
        )}

        {customer.primary_contact && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Primary Contact:</span>
            <span className="font-medium">
              {customer.primary_contact.first_name} {customer.primary_contact.last_name}
            </span>
          </div>
        )}

        {customer.assigned_to && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Assigned to:</span>
            <span className="font-medium">{customer.assigned_to}</span>
          </div>
        )}
      </div>

      {showActions && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={() => onView ? onView(customer) : handleDefaultView()}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              View
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(customer)}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
            )}
            {onManage && (
              <button
                onClick={() => onManage(customer)}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <WrenchIcon className="h-4 w-4 mr-2" />
                Manage
              </button>
            )}
          </div>
          {onLaunchWorkflow && (
            <button
              onClick={() => onLaunchWorkflow(customer)}
              className="w-full mt-2 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <PlayIcon className="h-4 w-4 mr-2" />
              Launch Workflow
            </button>
          )}
        </div>
      )}
    </div>
  );
}
