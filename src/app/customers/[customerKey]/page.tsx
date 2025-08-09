"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeftIcon, PencilIcon, WrenchIcon, ChartBarIcon, CalendarIcon, CurrencyDollarIcon, HeartIcon } from '@heroicons/react/24/outline';
import { CustomerService } from '../../../lib/services/CustomerService';
import { CustomerWithContact } from '../../../types/customer';

export default function CustomerPage({ params }: { params: Promise<{ customerKey: string }> }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerWithContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerKey, setCustomerKey] = useState<string>('');

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const resolvedParams = await params;
        const key = resolvedParams.customerKey;
        setCustomerKey(key);
        
        setLoading(true);
        setError(null);
        
        const customerData = await CustomerService.getCustomerByKey(key);
        
        if (!customerData) {
          setError('Customer not found');
        } else {
          setCustomer(customerData);
        }
      } catch (err) {
        console.error('Error loading customer:', err);
        setError(err instanceof Error ? err.message : 'Failed to load customer');
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [params]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error === 'Customer not found' ? 'Customer Not Found' : 'Error Loading Customer'}
            </h1>
            <p className="text-gray-600 mb-6">
              {error === 'Customer not found' 
                ? 'The customer you\'re looking for doesn\'t exist.'
                : error || 'An error occurred while loading the customer.'
              }
            </p>
            <button
              onClick={() => router.push('/customers')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Customers
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/customers')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Customers
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{customer.name}</h1>
              <p className="text-lg text-gray-600">{customer.industry}</p>
              {customer.domain && (
                <p className="text-sm text-gray-500">Domain: {customer.domain}</p>
              )}
            </div>
            <div className="flex space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <WrenchIcon className="h-4 w-4 mr-2" />
                Manage
              </button>
            </div>
          </div>
        </div>

        {/* Customer Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Current ARR</p>
                <p className="text-2xl font-semibold text-gray-900">${customer.current_arr.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HeartIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Health Score</p>
                <p className="text-2xl font-semibold text-gray-900">{customer.health_score}/100</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Health Score</p>
                <p className="text-2xl font-semibold text-gray-900">{customer.health_score}/100</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Renewal Date</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {new Date(customer.renewal_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Industry</p>
                  <p className="text-sm text-gray-900">{customer.industry}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Domain</p>
                  <p className="text-sm text-gray-900">{customer.domain || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Health Score</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthColor(customer.health_score)}`}>
                    {customer.health_score}/100
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Current ARR</p>
                  <p className="text-sm text-gray-900">${customer.current_arr?.toLocaleString() || '0'}</p>
                </div>
                {customer.domain && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Domain</p>
                    <p className="text-sm text-gray-900">{customer.domain}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Current ARR</p>
                  <p className="text-lg font-semibold text-gray-900">${customer.current_arr ? customer.current_arr.toLocaleString() : '0'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Health Score</p>
                  <p className="text-lg font-semibold text-gray-900">{customer.health_score}/100</p>
                </div>
                {customer.renewal_date && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Renewal Date</p>
                      <p className="text-sm text-gray-900">
                        {new Date(customer.renewal_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Days Until Renewal</p>
                      <p className="text-sm text-gray-900">
                        {Math.ceil((new Date(customer.renewal_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Primary Contact Information */}
            {customer.primary_contact && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Primary Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-sm text-gray-900">
                      {customer.primary_contact.first_name} {customer.primary_contact.last_name}
                    </p>
                  </div>
                  {customer.primary_contact.title && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Title</p>
                      <p className="text-sm text-gray-900">{customer.primary_contact.title}</p>
                    </div>
                  )}
                  {customer.primary_contact.email && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">{customer.primary_contact.email}</p>
                    </div>
                  )}
                  {customer.primary_contact.phone && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-sm text-gray-900">{customer.primary_contact.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  Launch Workflow
                </button>
                <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Schedule Meeting
                </button>
                <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Send Follow-up
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Last Contact</p>
                  <p>2 days ago</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Last Meeting</p>
                  <p>1 week ago</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Support Tickets</p>
                  <p>3 open</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 