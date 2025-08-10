"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  WrenchIcon, 
  ChartBarIcon, 
  CalendarIcon, 
  CurrencyDollarIcon, 
  HeartIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { CustomerService } from '../../../lib/services/CustomerService';
import { CustomerWithContact } from '../../../types/customer';
import EditableCell from '../../../components/common/EditableCell';

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

  const getRiskLevel = (healthScore: number, daysUntilRenewal: number) => {
    if (healthScore < 50 || daysUntilRenewal < 30) return 'high';
    if (healthScore < 70 || daysUntilRenewal < 60) return 'medium';
    return 'low';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
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
          company_id: customer.id,
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
          company_id: customer.id,
          is_primary: false,
          created_at: '',
          updated_at: ''
        }
      ].filter(Boolean)
    };
  };

  const handleUpdateCustomer = async (field: keyof CustomerWithContact, value: string | number) => {
    if (!customer) return;
    
    try {
      await CustomerService.updateCustomer(customer.id, { [field]: value });
      // Update local state
      setCustomer(prev => prev ? { ...prev, [field]: value } : null);
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

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Current ARR</p>
                <p className="text-2xl font-semibold text-gray-900">${customer.current_arr.toLocaleString()}</p>
                {sampleData && (
                  <p className="text-xs text-gray-500">+${sampleData.financials.expansion.toLocaleString()} expansion opportunity</p>
                )}
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
                <div className="flex items-center">
                  <p className="text-2xl font-semibold text-gray-900">{customer.health_score}/100</p>
                  {sampleData && (
                    <span className="ml-2 text-green-500">
                      ^
                    </span>
                  )}
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getHealthColor(customer.health_score)}`}>
                  {customer.health_score >= 80 ? 'Excellent' : customer.health_score >= 60 ? 'Good' : 'At Risk'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Usage</p>
                {sampleData && (
                  <>
                    <div className="flex items-center">
                      <p className="text-2xl font-semibold text-gray-900">{sampleData.usage.current}%</p>
                      <span className="ml-2 text-green-500">
                        ^
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">+{sampleData.usage.current - sampleData.usage.lastMonth}% from last month</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Renewal</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {sampleData?.daysUntilRenewal || 0} days
                </p>
                <EditableCell
                  value={customer.renewal_date}
                  onSave={(newValue) => handleUpdateCustomer('renewal_date', newValue)}
                  type="date"
                  placeholder="Select date"
                  displayFormat={(value) => new Date(value).toLocaleDateString()}
                  className="text-xs text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                Company Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Industry</p>
                    <EditableCell
                      value={customer.industry}
                      onSave={(newValue) => handleUpdateCustomer('industry', newValue)}
                      type="text"
                      placeholder="Enter industry"
                      className="text-sm text-gray-900"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Domain</p>
                    <EditableCell
                      value={customer.domain || ''}
                      onSave={(newValue) => handleUpdateCustomer('domain', newValue)}
                      type="text"
                      placeholder="Enter domain"
                      className="text-sm text-gray-900"
                      displayFormat={(value) => value || 'N/A'}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Customer Since</p>
                    <p className="text-sm text-gray-900">{new Date(customer.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {sampleData && (
                    <>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Active Users</p>
                        <p className="text-sm text-gray-900">{sampleData.engagement.activeUsers}/{sampleData.engagement.totalUsers}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Feature Adoption</p>
                        <p className="text-sm text-gray-900">{sampleData.engagement.featureAdoption}%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Last Login</p>
                        <p className="text-sm text-gray-900">{sampleData.engagement.lastLogin}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Financial & Usage Metrics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                Financial & Usage Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <EditableCell
                    value={customer.current_arr}
                    onSave={(newValue) => handleUpdateCustomer('current_arr', newValue)}
                    type="number"
                    placeholder="Enter ARR"
                    validateValue={validateARR}
                    displayFormat={(value) => `$${Number(value).toLocaleString()}`}
                    className="text-2xl font-bold text-gray-900"
                    cellClassName="text-center"
                  />
                  <p className="text-sm text-gray-500">Annual Recurring Revenue</p>
                </div>
                {sampleData && (
                  <>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">${Math.round(sampleData.financials.monthlyUsage).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Monthly Usage</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{sampleData.financials.churnRisk}%</p>
                      <p className="text-sm text-gray-500">Churn Risk</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* All Contacts */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Contacts
              </h3>
              <div className="space-y-4">
                {sampleData?.contacts && sampleData.contacts.length > 0 ? (
                  sampleData.contacts.map((contact, index) => (
                    contact && (contact.first_name || contact.last_name || contact.email) && (
                      <div key={contact.id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || '') || '?'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown Contact'}
                              {contact.is_primary && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Primary</span>}
                            </p>
                            <p className="text-sm text-gray-500">{contact.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className="text-gray-400 hover:text-gray-500">
                              <EnvelopeIcon className="h-4 w-4" />
                            </a>
                          )}
                          {contact.phone && (
                            <a href={`tel:${contact.phone}`} className="text-gray-400 hover:text-gray-500">
                              <PhoneIcon className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No contacts found for this customer.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                Recent Activity Timeline
              </h3>
              {sampleData && (
                <div className="space-y-4">
                  {sampleData.timeline.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`h-2 w-2 mt-2 rounded-full ${
                          item.type === 'success' ? 'bg-green-400' : 
                          item.type === 'warning' ? 'bg-yellow-400' : 
                          'bg-blue-400'
                        }`}></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{item.event}</p>
                        <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Health Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <HeartIcon className="h-5 w-5 mr-2" />
                Health Status
              </h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(customer.health_score)}`}>
                    {customer.health_score}/100
                  </div>
                </div>
                {sampleData && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">NPS Score</span>
                        <span className="font-medium">{sampleData.nps.score}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Support Satisfaction</span>
                        <span className="font-medium">{sampleData.support.satisfaction}/5</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Open Tickets</span>
                        <span className="font-medium">{sampleData.support.openTickets}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  <WrenchIcon className="h-4 w-4 mr-2" />
                  Launch Renewal Workflow
                </button>
                <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Schedule Check-in
                </button>
                <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  View Support History
                </button>
              </div>
            </div>

            {/* Risk Indicators */}
            {sampleData && sampleData.riskLevel !== 'low' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-500" />
                  Risk Indicators
                </h3>
                <div className="space-y-3">
                  {sampleData.daysUntilRenewal < 60 && (
                    <div className="flex items-center text-sm text-yellow-600">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Renewal in {sampleData.daysUntilRenewal} days
                    </div>
                  )}
                  {customer.health_score < 70 && (
                    <div className="flex items-center text-sm text-red-600">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                      Low health score
                    </div>
                  )}
                  {sampleData.support.openTickets > 0 && (
                    <div className="flex items-center text-sm text-orange-600">
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      {sampleData.support.openTickets} open support tickets
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Success Indicators */}
            {sampleData && sampleData.riskLevel === 'low' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />
                  Success Indicators
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    High health score ({customer.health_score}/100)
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <span className="mr-2">^</span>
                    Usage trending up
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Low churn risk ({sampleData.financials.churnRisk}%)
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