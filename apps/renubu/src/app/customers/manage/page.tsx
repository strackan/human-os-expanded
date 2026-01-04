"use client";
import React, { useState, useEffect } from "react";
import { PlusIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { useRouter } from 'next/navigation';
import CustomerGrid from "@/components/customers/CustomerGrid";
import { CustomerWithContact } from "@/types/customer";

interface CustomerWithRenewal extends CustomerWithContact {
  days_until_renewal: number;
  renewal_priority: 'critical' | 'high' | 'medium' | 'low';
}

export default function CustomerManagePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerWithRenewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchDate, setSearchDate] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithRenewal[]>([]);
  
  // Form state and validation
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    tier: 'standard',
    health_score: 50,
    primary_contact: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      title: ''
    },
    renewal_date: '',
    current_arr: '',
    risk_level: 'medium'
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter customers when search date changes
  useEffect(() => {
    if (searchDate) {
      const targetDate = new Date(searchDate);
      const sorted = [...customers]
        .filter(customer => customer.renewal_date)
        .sort((a, b) => {
          const aDate = new Date(a.renewal_date!);
          const bDate = new Date(b.renewal_date!);
          const aDiff = Math.abs(aDate.getTime() - targetDate.getTime());
          const bDiff = Math.abs(bDate.getTime() - targetDate.getTime());
          return aDiff - bDiff;
        });
      setFilteredCustomers(sorted);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchDate, customers]);

  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        const customersWithRenewal = data.customers.map((customer: CustomerWithContact) => ({
          ...customer,
          days_until_renewal: customer.renewal_date 
            ? Math.ceil((new Date(customer.renewal_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : 999,
          renewal_priority: getRenewalPriority(customer.renewal_date)
        }));
        setCustomers(customersWithRenewal);
        setFilteredCustomers(customersWithRenewal);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRenewalPriority = (renewalDate?: string): 'critical' | 'high' | 'medium' | 'low' => {
    if (!renewalDate) return 'low';
    const daysUntil = Math.ceil((new Date(renewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 7) return 'critical';
    if (daysUntil <= 30) return 'high';
    if (daysUntil <= 90) return 'medium';
    return 'low';
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) {
      errors.name = 'Company name is required';
    }

    // Health score validation
    if (formData.health_score < 0 || formData.health_score > 100) {
      errors.health_score = 'Health score must be between 0 and 100';
    }

    // Current ARR validation
    if (formData.current_arr && isNaN(Number(formData.current_arr))) {
      errors.current_arr = 'Current ARR must be a valid number';
    }

    // Email validation
    if (formData.primary_contact.email && !/\S+@\S+\.\S+/.test(formData.primary_contact.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation (basic)
    if (formData.primary_contact.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.primary_contact.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFormMessages = () => {
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      industry: '',
      tier: 'standard',
      health_score: 50,
      primary_contact: {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        title: ''
      },
      renewal_date: '',
      current_arr: '',
      risk_level: 'medium'
    });
    setFormErrors({});
    clearFormMessages();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous messages
    clearFormMessages();
    
    // Validate form
    if (!validateForm()) {
      setSubmitError('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess('Customer added successfully!');
        resetForm();
        setShowAddForm(false);
        loadCustomers(); // Reload the list
      } else {
        setSubmitError(data.error || 'Failed to add customer');
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const launchWorkflow = (customer: CustomerWithContact) => {
    // Navigate to the task management page with this customer
    router.push(`/tasks/do?customer=${customer.id}&launch=true`);
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
          <p className="text-gray-600">Manage customers and their renewal dates</p>
        </div>

        {/* Search and Add Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Date Search */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <label htmlFor="search-date" className="text-sm font-medium text-gray-700">
                  Find customers near renewal date:
                </label>
              </div>
              <input
                type="date"
                id="search-date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Add Customer Button */}
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Customer
            </button>
          </div>
        </div>

        {/* Add Customer Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Add New Customer</h2>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Success Message */}
            {submitSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">{submitSuccess}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {submitError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{submitError}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({...formData, name: e.target.value});
                      if (formErrors.name) {
                        setFormErrors({...formErrors, name: ''});
                      }
                    }}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      formErrors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter company name"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Industry</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tier</label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({...formData, tier: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Health Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.health_score}
                    onChange={(e) => {
                      setFormData({...formData, health_score: parseInt(e.target.value) || 0});
                      if (formErrors.health_score) {
                        setFormErrors({...formErrors, health_score: ''});
                      }
                    }}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      formErrors.health_score ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.health_score && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.health_score}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Primary Contact First Name</label>
                  <input
                    type="text"
                    value={formData.primary_contact.first_name}
                    onChange={(e) => setFormData({
                      ...formData, 
                      primary_contact: { ...formData.primary_contact, first_name: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Primary Contact Last Name</label>
                  <input
                    type="text"
                    value={formData.primary_contact.last_name}
                    onChange={(e) => setFormData({
                      ...formData, 
                      primary_contact: { ...formData.primary_contact, last_name: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Primary Contact Email</label>
                  <input
                    type="email"
                    value={formData.primary_contact.email}
                    onChange={(e) => {
                      setFormData({
                        ...formData, 
                        primary_contact: { ...formData.primary_contact, email: e.target.value }
                      });
                      if (formErrors.email) {
                        setFormErrors({...formErrors, email: ''});
                      }
                    }}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      formErrors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="john.doe@company.com"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Renewal Date</label>
                  <input
                    type="date"
                    value={formData.renewal_date}
                    onChange={(e) => setFormData({...formData, renewal_date: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current ARR ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.current_arr}
                    onChange={(e) => {
                      setFormData({...formData, current_arr: e.target.value});
                      if (formErrors.current_arr) {
                        setFormErrors({...formErrors, current_arr: ''});
                      }
                    }}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      formErrors.current_arr ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {formErrors.current_arr && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.current_arr}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Risk Level</label>
                  <select
                    value={formData.risk_level}
                    onChange={(e) => setFormData({...formData, risk_level: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    'Add Customer'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Customers Grid */}
        <CustomerGrid
          customers={filteredCustomers}
          loading={loading}
          variant="default"
          columns={3}
          onLaunchWorkflow={launchWorkflow}
          emptyMessage="No customers found"
          emptyDescription={searchDate ? 'Try adjusting your search date.' : 'Get started by adding a new customer.'}
        />
      </div>
    </div>
  );
} 