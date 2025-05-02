'use client';

import { useState } from 'react';
import { 
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
  CurrencyDollarIcon,
  ShieldExclamationIcon,
  SparklesIcon,
  ChevronRightIcon,
  LinkIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import type { ForwardRefExoticComponent, SVGProps, RefAttributes } from 'react';

type IconType = ForwardRefExoticComponent<Omit<SVGProps<SVGSVGElement>, "ref"> & { title?: string | undefined; titleId?: string | undefined; } & RefAttributes<SVGSVGElement>>;

type ContractStatus = 'Unsigned' | 'In Review' | 'Signed';
type ContractLabel = 'Unsigned' | 'Non-Standard Pricing' | 'Unlimited Liability' | 'Price Cap' | 'Custom SLA' | 'Enterprise Terms' | 'Multi-Year';

interface Contract {
  id: string;
  customerName: string;
  status: ContractStatus;
  value: string;
  renewalDate: string;
  lastModified: string;
  labels: ContractLabel[];
  owner: string;
  riskScore: number;
  riskFactors: string[];
  usage: string;
  history: {
    date: string;
    action: string;
    user: string;
  }[];
}

const ContractsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedTab, setSelectedTab] = useState('details');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const contracts: Contract[] = [
    {
      id: 'CNT-001',
      customerName: 'Acme Corporation',
      status: 'Unsigned',
      value: '$450,000',
      renewalDate: 'Aug 15, 2024',
      lastModified: '2024-03-10',
      labels: ['Unsigned', 'Non-Standard Pricing', 'Price Cap'],
      owner: 'Sarah Johnson',
      riskScore: 75,
      riskFactors: ['Unsigned status', 'Non-standard terms', 'Pricing concerns'],
      usage: 'Medium',
      history: [
        { date: '2024-03-10', action: 'Contract created', user: 'Emily Rodriguez' },
        { date: '2024-03-12', action: 'Sent to customer', user: 'Sarah Johnson' },
        { date: '2024-03-15', action: 'Customer feedback received', user: 'Sarah Johnson' }
      ]
    },
    {
      id: 'CNT-002',
      customerName: 'Globex Inc.',
      status: 'In Review',
      value: '$320,000',
      renewalDate: 'Sep 10, 2024',
      lastModified: '2024-03-12',
      labels: ['Unlimited Liability', 'Custom SLA'],
      owner: 'Alex Park',
      riskScore: 55,
      riskFactors: ['Unlimited liability clause'],
      usage: 'High',
      history: [
        { date: '2024-03-01', action: 'Contract created', user: 'Alex Park' },
        { date: '2024-03-05', action: 'Internal review', user: 'Legal Team' },
        { date: '2024-03-08', action: 'Revisions made', user: 'Alex Park' }
      ]
    },
    {
      id: 'CNT-003',
      customerName: 'TechCorp Solutions',
      status: 'Signed',
      value: '$780,000',
      renewalDate: 'Jul 22, 2024',
      lastModified: '2024-03-08',
      labels: ['Enterprise Terms', 'Multi-Year'],
      owner: 'Michael Chen',
      riskScore: 15,
      riskFactors: [],
      usage: 'Very High',
      history: [
        { date: '2024-02-15', action: 'Contract created', user: 'Michael Chen' },
        { date: '2024-02-20', action: 'Internal review', user: 'Legal Team' },
        { date: '2024-02-25', action: 'Sent to customer', user: 'Michael Chen' }
      ]
    }
  ];

  const labelColors: Record<ContractLabel, { bg: string; text: string }> = {
    'Unsigned': { bg: 'bg-red-50', text: 'text-red-700' },
    'Non-Standard Pricing': { bg: 'bg-purple-50', text: 'text-purple-700' },
    'Unlimited Liability': { bg: 'bg-orange-50', text: 'text-orange-700' },
    'Price Cap': { bg: 'bg-blue-50', text: 'text-blue-700' },
    'Custom SLA': { bg: 'bg-teal-50', text: 'text-teal-700' },
    'Enterprise Terms': { bg: 'bg-indigo-50', text: 'text-indigo-700' },
    'Multi-Year': { bg: 'bg-green-50', text: 'text-green-700' }
  };

  const statusStyles: Record<ContractStatus, { bg: string; text: string; icon: IconType }> = {
    'Unsigned': { 
      bg: 'bg-red-50', 
      text: 'text-red-700',
      icon: DocumentArrowDownIcon
    },
    'In Review': { 
      bg: 'bg-yellow-50', 
      text: 'text-yellow-700',
      icon: ExclamationTriangleIcon
    },
    'Signed': { 
      bg: 'bg-green-50', 
      text: 'text-green-700',
      icon: DocumentCheckIcon
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.owner.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || contract.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getRiskColor = (score: number) => {
    if (score < 30) return 'bg-green-500';
    if (score < 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const ContractStatusIcon = ({ status }: { status: ContractStatus }) => {
    const Icon = statusStyles[status].icon;
    return <Icon className="mr-2 h-5 w-5" />;
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Contracts</h1>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Add Contract
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex overflow-hidden w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Left Panel - Contract List */}
        <div className="w-1/3 bg-white rounded-lg shadow-sm overflow-hidden mr-4 flex flex-col">
          <div className="p-4 border-b space-y-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="search"
                placeholder="Search contracts..."
                className="block w-full rounded-lg border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="block w-full rounded-lg border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="Unsigned">Unsigned</option>
              <option value="In Review">In Review</option>
              <option value="Signed">Signed</option>
            </select>
          </div>
          
          <div className="overflow-y-auto flex-grow">
            {filteredContracts.map((contract) => {
              const Icon = statusStyles[contract.status].icon;
              const isSelected = selectedContract && selectedContract.id === contract.id;
              
              return (
                <div 
                  key={contract.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => setSelectedContract(contract)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{contract.customerName}</h3>
                      <p className="text-xs text-gray-500">{contract.id}</p>
                    </div>
                    <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      statusStyles[contract.status].bg
                    } ${statusStyles[contract.status].text}`}>
                      <Icon className="mr-1 h-4 w-4" />
                      {contract.status}
                    </div>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-2">
                    {contract.labels.map((label) => (
                      <span
                        key={label}
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          labelColors[label].bg
                        } ${labelColors[label].text}`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-2 flex justify-between text-sm">
                    <div className="flex items-center text-gray-500">
                      <UserIcon className="h-4 w-4 mr-1" />
                      {contract.owner}
                    </div>
                    <div className="font-medium">{contract.value}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Right Panel - Contract Details */}
        <div className="w-2/3 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
          {selectedContract ? (
            <>
              <div className="border-b">
                <div className="border-b px-4 py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedContract.customerName}
                      </h2>
                      <p className="text-sm text-gray-500">{selectedContract.id}</p>
                    </div>
                    <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                      statusStyles[selectedContract.status].bg
                    } ${statusStyles[selectedContract.status].text}`}>
                      <ContractStatusIcon status={selectedContract.status} />
                      {selectedContract.status}
                    </div>
                  </div>
                </div>
                
                <div className="px-4 py-2 border-b">
                  <nav className="flex space-x-4" aria-label="Tabs">
                    <button
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        selectedTab === 'details'
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setSelectedTab('details')}
                    >
                      Details
                    </button>
                    <button
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        selectedTab === 'ai'
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setSelectedTab('ai')}
                    >
                      <div className="flex items-center">
                        <SparklesIcon className="h-4 w-4 mr-1" />
                        AI Analysis
                      </div>
                    </button>
                    <button
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        selectedTab === 'history'
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setSelectedTab('history')}
                    >
                      History
                    </button>
                  </nav>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-6">
                {selectedTab === 'details' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2 bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Contract Overview</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Value</p>
                            <p className="text-sm font-medium mt-1">{selectedContract.value}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Renewal Date</p>
                            <p className="text-sm font-medium mt-1">{selectedContract.renewalDate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Last Modified</p>
                            <p className="text-sm font-medium mt-1">{selectedContract.lastModified}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Labels</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedContract.labels.map((label) => (
                          <span
                            key={label}
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                              labelColors[label].bg
                            } ${labelColors[label].text}`}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Risk Assessment</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-medium">Risk Score</span>
                          <div className="flex items-center">
                            <div className={`h-2.5 w-2.5 rounded-full ${getRiskColor(selectedContract.riskScore)} mr-2`}></div>
                            <span className="text-sm font-medium">{selectedContract.riskScore}%</span>
                          </div>
                        </div>
                        {selectedContract.riskFactors.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 mb-2">Risk Factors</h4>
                            <ul className="space-y-2">
                              {selectedContract.riskFactors.map((factor, index) => (
                                <li key={index} className="flex items-center text-sm text-gray-600">
                                  <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-2" />
                                  {factor}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedTab === 'ai' && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <SparklesIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <h2 className="text-lg font-medium text-blue-900">AI Contract Analysis</h2>
                          <p className="mt-1 text-sm text-blue-700">
                            Analysis of key terms, pricing optimization opportunities, and compliance requirements.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b">
                          <h3 className="text-sm font-medium text-gray-900">Key Terms Analysis</h3>
                        </div>
                        <div className="p-4">
                          <div className="space-y-4">
                            {selectedContract.labels.includes('Unlimited Liability') && (
                              <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
                                <div className="flex items-start">
                                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mt-0.5" />
                                  <div className="ml-3">
                                    <h4 className="text-sm font-medium text-orange-900">Unlimited Liability Clause</h4>
                                    <p className="mt-1 text-sm text-orange-700">
                                      This contract contains unlimited liability provisions that expose your company to significant financial risk.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {selectedContract.labels.includes('Non-Standard Pricing') && (
                              <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg">
                                <div className="flex items-start">
                                  <CurrencyDollarIcon className="h-5 w-5 text-purple-600 mt-0.5" />
                                  <div className="ml-3">
                                    <h4 className="text-sm font-medium text-purple-900">Non-Standard Pricing</h4>
                                    <p className="mt-1 text-sm text-purple-700">
                                      Current pricing structure deviates from standard terms. Consider reviewing for optimization opportunities.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTab === 'history' && (
                  <div className="space-y-6">
                    <div className="flow-root">
                      <ul role="list" className="-mb-8">
                        {selectedContract.history.map((event, eventIdx) => (
                          <li key={eventIdx}>
                            <div className="relative pb-8">
                              {eventIdx !== selectedContract.history.length - 1 ? (
                                <span
                                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                                  aria-hidden="true"
                                />
                              ) : null}
                              <div className="relative flex space-x-3">
                                <div>
                                  <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                    <ClockIcon className="h-5 w-5 text-gray-500" />
                                  </span>
                                </div>
                                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                  <div>
                                    <p className="text-sm text-gray-500">
                                      {event.action} by <span className="font-medium text-gray-900">{event.user}</span>
                                    </p>
                                  </div>
                                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                    {event.date}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <DocumentCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Contract Selected</h3>
                <p className="mt-1 text-sm text-gray-500">Select a contract from the list to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractsPage; 