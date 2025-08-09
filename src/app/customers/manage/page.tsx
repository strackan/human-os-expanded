"use client";
import React, { useState, useEffect } from "react";
import { PlusIcon, MagnifyingGlassIcon, CalendarIcon, PlayIcon } from "@heroicons/react/24/outline";
import { useRouter } from 'next/navigation';

interface Customer {
  id: string;
  name: string;
  industry: string;
  tier: string;
  health_score: number;
  primary_contact_name?: string;
  primary_contact_email?: string;
  renewal_date?: string;
  current_arr?: number;
  risk_level?: string;
}

interface CustomerWithRenewal extends Customer {
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
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    tier: 'standard',
    health_score: 50,
    primary_contact_name: '',
    primary_contact_email: '',
    renewal_date: '',
    current_arr: '',
    risk_level: 'medium'
  });

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
        const customersWithRenewal = data.customers.map((customer: Customer) => ({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowAddForm(false);
        setFormData({
          name: '',
          industry: '',
          tier: 'standard',
          health_score: 50,
          primary_contact_name: '',
          primary_contact_email: '',
          renewal_date: '',
          current_arr: '',
          risk_level: 'medium'
        });
        loadCustomers(); // Reload the list
      }
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  const launchWorkflow = (customer: CustomerWithRenewal) => {
    // Navigate to the task management page with this customer
    router.push(`/tasks/do?customer=${customer.id}&launch=true`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
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
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Customer</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
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
                    onChange={(e) => setFormData({...formData, health_score: parseInt(e.target.value)})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Primary Contact Name</label>
                  <input
                    type="text"
                    value={formData.primary_contact_name}
                    onChange={(e) => setFormData({...formData, primary_contact_name: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Primary Contact Email</label>
                  <input
                    type="email"
                    value={formData.primary_contact_email}
                    onChange={(e) => setFormData({...formData, primary_contact_email: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
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
                    onChange={(e) => setFormData({...formData, current_arr: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
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
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                  <p className="text-sm text-gray-500">{customer.industry}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(customer.renewal_priority)}`}>
                  {customer.renewal_priority}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Health Score:</span>
                  <span className={`font-medium ${getHealthColor(customer.health_score)}`}>
                    {customer.health_score}/100
                  </span>
                </div>

                {customer.renewal_date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Renewal Date:</span>
                    <span className="font-medium">
                      {new Date(customer.renewal_date).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {customer.days_until_renewal !== 999 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Days Until:</span>
                    <span className={`font-medium ${customer.days_until_renewal <= 30 ? 'text-red-600' : 'text-gray-900'}`}>
                      {customer.days_until_renewal} days
                    </span>
                  </div>
                )}

                {customer.current_arr && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Current ARR:</span>
                    <span className="font-medium">${customer.current_arr.toLocaleString()}</span>
                  </div>
                )}

                {customer.primary_contact_name && (
                  <div className="text-sm text-gray-500">
                    Contact: {customer.primary_contact_name}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => launchWorkflow(customer)}
                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Launch Workflow
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchDate ? 'Try adjusting your search date.' : 'Get started by adding a new customer.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 