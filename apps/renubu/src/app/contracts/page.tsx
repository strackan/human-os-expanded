'use client';

import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import type { ForwardRefExoticComponent, SVGProps, RefAttributes } from 'react';

import { useChat } from '@/context/ChatContext';

type IconType = ForwardRefExoticComponent<Omit<SVGProps<SVGSVGElement>, "ref"> & { title?: string | undefined; titleId?: string | undefined; } & RefAttributes<SVGSVGElement>>;

type ContractStatus = 'active' | 'pending' | 'expired' | 'cancelled';
type ContractLabel = 'Unsigned' | 'Non-Standard Pricing' | 'Unlimited Liability' | 'Price Cap' | 'Custom SLA' | 'Enterprise Terms' | 'Multi-Year';

interface Contract {
  id: string;
  customer_id: string;
  contract_number: string | null;
  start_date: string;
  end_date: string;
  arr: number;
  seats: number | null;
  contract_type: string;
  status: ContractStatus;
  auto_renewal: boolean;
  terms_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customers: {
    id: string;
    name: string;
    industry: string | null;
    health_score: number | null;
    current_arr: number | null;
  } | null;
}

const ContractsPage = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedTab, setSelectedTab] = useState<'details' | 'ai' | 'history'>('details');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const { openChat, setSelectedContract: setGlobalSelectedContract } = useChat();

  useEffect(() => {
    fetchContracts();
  }, []);

  async function fetchContracts() {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch('/api/contracts', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to fetch contracts (${res.status})`);
      const data = await res.json();
      setContracts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching contracts:', e);
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }


  const statusStyles: Record<ContractStatus, { bg: string; text: string; icon: IconType; display: string }> = {
    'active': {
      bg: 'bg-green-50',
      text: 'text-green-700',
      icon: DocumentCheckIcon,
      display: 'Active'
    },
    'pending': {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      icon: ExclamationTriangleIcon,
      display: 'Pending'
    },
    'expired': {
      bg: 'bg-red-50',
      text: 'text-red-700',
      icon: DocumentArrowDownIcon,
      display: 'Expired'
    },
    'cancelled': {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      icon: ExclamationTriangleIcon,
      display: 'Cancelled'
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const customerName = contract.customers?.name || 'Unknown';
    const matchesSearch =
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.contract_number || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || contract.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const getRiskColor = (score: number | null | undefined) => {
    if (!score) return 'bg-gray-500';
    if (score < 30) return 'bg-red-500';
    if (score < 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const ContractStatusIcon = ({ status }: { status: ContractStatus }) => {
    const Icon = statusStyles[status].icon;
    return <Icon className="mr-2 h-5 w-5" />;
  };

  const handleContractSelect = (contract: Contract) => {
    setSelectedContract(contract);
    setGlobalSelectedContract({
      id: contract.id,
      customerName: contract.customers?.name || 'Unknown Customer'
    });
  };

  const fmtMoney = (v: number | null | undefined) =>
    typeof v === 'number' ? `$${v.toLocaleString()}` : '—';

  const fmtDate = (s: string | null | undefined) =>
    s ? new Date(s).toLocaleDateString() : '—';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
              <p className="text-gray-600">Loading contracts...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="text-center">
              <div className="text-red-600 mb-2">Error loading contracts</div>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={fetchContracts}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
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

        {contracts.length === 0 ? (
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center">
              <DocumentCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No contracts found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new contract.</p>
              <button
                type="button"
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Add Contract
              </button>
            </div>
          </div>
        ) : (
          /* Main Content */
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
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
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
                      onClick={() => handleContractSelect(contract)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{contract.customers?.name || 'Unknown Customer'}</h3>
                          <p className="text-xs text-gray-500">{contract.contract_number || contract.id.substring(0, 8)}</p>
                        </div>
                        <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          statusStyles[contract.status].bg
                        } ${statusStyles[contract.status].text}`}>
                          <Icon className="mr-1 h-4 w-4" />
                          {statusStyles[contract.status].display}
                        </div>
                      </div>

                      <div className="mt-2 flex justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Ends {fmtDate(contract.end_date)}
                        </div>
                        <div className="font-medium">{fmtMoney(contract.arr)}</div>
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
                            {selectedContract.customers?.name || 'Unknown Customer'}
                          </h2>
                          <p className="text-sm text-gray-500">{selectedContract.contract_number || selectedContract.id}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={openChat}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                          >
                            <SparklesIcon className="h-4 w-4 mr-1" />
                            Ask AI Assistant
                          </button>
                          <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                            statusStyles[selectedContract.status].bg
                          } ${statusStyles[selectedContract.status].text}`}>
                            <ContractStatusIcon status={selectedContract.status} />
                            {statusStyles[selectedContract.status].display}
                          </div>
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
                                <p className="text-xs text-gray-500">ARR</p>
                                <p className="text-sm font-medium mt-1">{fmtMoney(selectedContract.arr)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Start Date</p>
                                <p className="text-sm font-medium mt-1">{fmtDate(selectedContract.start_date)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">End Date</p>
                                <p className="text-sm font-medium mt-1">{fmtDate(selectedContract.end_date)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Type</p>
                                <p className="text-sm font-medium mt-1 capitalize">{selectedContract.contract_type}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Seats</p>
                                <p className="text-sm font-medium mt-1">{selectedContract.seats || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Auto Renewal</p>
                                <p className="text-sm font-medium mt-1">{selectedContract.auto_renewal ? 'Yes' : 'No'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {selectedContract.customers && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-gray-500">Industry</p>
                                  <p className="text-sm font-medium mt-1">{selectedContract.customers.industry || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Health Score</p>
                                  <div className="flex items-center mt-1">
                                    <div className={`h-2.5 w-2.5 rounded-full ${getRiskColor(selectedContract.customers.health_score)} mr-2`}></div>
                                    <span className="text-sm font-medium">{selectedContract.customers.health_score || '—'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedContract.notes && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-3">Notes</h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-sm text-gray-600">{selectedContract.notes}</p>
                            </div>
                          </div>
                        )}
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

                        <div className="text-center py-12 text-gray-500">
                          AI analysis coming soon...
                        </div>
                      </div>
                    )}

                    {selectedTab === 'history' && (
                      <div className="space-y-6">
                        <div className="flow-root">
                          <ul role="list" className="space-y-4">
                            <li>
                              <div className="relative flex space-x-3">
                                <div>
                                  <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                    <ClockIcon className="h-5 w-5 text-gray-500" />
                                  </span>
                                </div>
                                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                  <div>
                                    <p className="text-sm text-gray-500">
                                      Contract created
                                    </p>
                                  </div>
                                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                    {fmtDate(selectedContract.created_at)}
                                  </div>
                                </div>
                              </div>
                            </li>
                            {selectedContract.updated_at !== selectedContract.created_at && (
                              <li>
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                      <ClockIcon className="h-5 w-5 text-gray-500" />
                                    </span>
                                  </div>
                                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        Contract updated
                                      </p>
                                    </div>
                                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                      {fmtDate(selectedContract.updated_at)}
                                    </div>
                                  </div>
                                </div>
                              </li>
                            )}
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
        )}
      </div>
    </div>
  );
};

export default ContractsPage;
