"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ArrowLeftIcon,
  PencilIcon,
  WrenchIcon,
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { CustomerService } from '../../../../lib/services/CustomerService';
import { CustomerWithContact } from '../../../../types/customer';
import EditableCell from '../../../../components/common/EditableCell';

export default function CustomerViewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerWithContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;

        setLoading(true);
        setError(null);
        
        // Call the API endpoint instead of the service directly
        const response = await fetch(`/api/customers/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Customer not found');
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } else {
          const data = await response.json();
          setCustomer(data.customer);
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


  const getRiskLevel = (healthScore: number, daysUntilRenewal: number) => {
    if (healthScore < 50 || daysUntilRenewal < 30) return 'high';
    if (healthScore < 70 || daysUntilRenewal < 90) return 'medium';
    return 'low';
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Sample data for Customer 360 view
  const getSampleData = (customer: CustomerWithContact) => {
    const daysUntilRenewal = Math.ceil((new Date(customer.renewal_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const riskLevel = getRiskLevel(customer.health_score, daysUntilRenewal);
    
    return {
      daysUntilRenewal,
      riskLevel,
      usage: {
        current: 87,
        trend: 'up',
        lastMonth: 82
      },
      nps: {
        score: 42,
        trend: 'up',
        lastQuarter: 38
      },
      support: {
        openTickets: 2,
        avgResolutionTime: '4.2 hours',
        satisfaction: 4.6
      },
      engagement: {
        lastLogin: '2 days ago',
        activeUsers: 24,
        totalUsers: 28,
        featureAdoption: 76
      },
      financials: {
        monthlyUsage: customer.current_arr / 12,
        expansion: 15000,
        churnRisk: riskLevel === 'high' ? 25 : riskLevel === 'medium' ? 10 : 3
      },
      timeline: [
        { date: '2024-01-15', event: 'Contract signed', type: 'success' },
        { date: '2024-02-01', event: 'Onboarding completed', type: 'success' },
        { date: '2024-03-15', event: 'First support ticket', type: 'info' },
        { date: '2024-04-20', event: 'Usage spike detected', type: 'warning' },
        { date: '2024-05-10', event: 'Renewal discussion started', type: 'info' }
      ],
      contacts: [
        ...(customer.primary_contact ? [customer.primary_contact] : []),
        {
          id: '2',
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah.johnson@company.com',
          phone: '(555) 123-4567',
          title: 'IT Director',
          customer_id: customer.id,
          is_primary: false,
          created_at: '',
          updated_at: ''
        },
        {
          id: '3',
          first_name: 'Mike',
          last_name: 'Chen',
          email: 'mike.chen@company.com',
          phone: '(555) 987-6543',
          title: 'Operations Manager',
          customer_id: customer.id,
          is_primary: false,
          created_at: '',
          updated_at: ''
        }
      ].filter(Boolean)
    };
  };

  const handleUpdateCustomer = async <K extends keyof CustomerWithContact>(field: K, value: CustomerWithContact[K]) => {
    if (!customer) return;

    try {
      const updates = { [field]: value } as Partial<CustomerWithContact>;
      const updatedCustomer = await CustomerService.updateCustomer(customer.id, updates);
      setCustomer(updatedCustomer);
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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

  const sampleData = customer ? getSampleData(customer) : null;

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
              <div className="flex items-center space-x-4">
                <p className="text-lg text-gray-600">{customer.industry}</p>
                {sampleData && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(sampleData.riskLevel)}`}>
                    {sampleData.riskLevel.charAt(0).toUpperCase() + sampleData.riskLevel.slice(1)} Risk
                  </span>
                )}
              </div>
              {customer.domain && (
                <p className="text-sm text-gray-500 mt-1">Domain: {customer.domain}</p>
              )}
            </div>
            <div className="flex space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <WrenchIcon className="h-4 w-4 mr-2" />
                Manage
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Customer Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Metrics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">${(customer.current_arr / 1000).toFixed(0)}k</p>
                  <p className="text-sm text-gray-500">ARR</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{customer.health_score}%</p>
                  <p className="text-sm text-gray-500">Health Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{sampleData?.daysUntilRenewal || 0}</p>
                  <p className="text-sm text-gray-500">Days to Renewal</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{sampleData?.usage.current || 0}%</p>
                  <p className="text-sm text-gray-500">Usage</p>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <EditableCell
                    value={customer.name}
                    onSave={(value) => handleUpdateCustomer('name', value as string)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Industry</label>
                  <EditableCell
                    value={customer.industry}
                    onSave={(value) => handleUpdateCustomer('industry', value as string)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Domain</label>
                  <EditableCell
                    value={customer.domain || ''}
                    onSave={(value) => handleUpdateCustomer('domain', value as string)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Renewal Date</label>
                  <EditableCell
                    value={customer.renewal_date}
                    onSave={(value) => handleUpdateCustomer('renewal_date', value as string)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current ARR</label>
                  <EditableCell
                    value={customer.current_arr.toString()}
                    onSave={(value) => handleUpdateCustomer('current_arr', parseFloat(value as string))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Health Score</label>
                  <EditableCell
                    value={customer.health_score.toString()}
                    onSave={(value) => handleUpdateCustomer('health_score', parseInt(value as string))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {sampleData?.timeline.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      item.type === 'success' ? 'bg-green-400' :
                      item.type === 'warning' ? 'bg-yellow-400' :
                      'bg-blue-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{item.event}</p>
                      <p className="text-sm text-gray-500">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Primary Contact */}
            {customer.primary_contact && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Contact</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserGroupIcon className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {customer.primary_contact.first_name} {customer.primary_contact.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{customer.primary_contact.title}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${customer.primary_contact.email}`} className="text-sm text-blue-600 hover:text-blue-800">
                        {customer.primary_contact.email}
                      </a>
                    </div>
                    {customer.primary_contact.phone && (
                      <div className="flex items-center space-x-2">
                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${customer.primary_contact.phone}`} className="text-sm text-blue-600 hover:text-blue-800">
                          {customer.primary_contact.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <ChartBarIcon className="w-4 h-4 mr-2" />
                  View Analytics
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <DocumentTextIcon className="w-4 h-4 mr-2" />
                  Generate Report
                </button>
              </div>
            </div>

            {/* Risk Assessment */}
            {sampleData && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Churn Risk</span>
                    <span className="text-sm font-medium text-gray-900">{sampleData.financials.churnRisk}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Expansion Potential</span>
                    <span className="text-sm font-medium text-green-600">${sampleData.financials.expansion.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Engagement</span>
                    <span className="text-sm font-medium text-gray-900">{sampleData.engagement.lastLogin}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
