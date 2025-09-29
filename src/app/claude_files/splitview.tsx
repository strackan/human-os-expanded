import React, { useState } from 'react';
import { 
  AlertTriangle, 
  FileCheck, 
  Scale, 
  Search, 
  User, 
  Calendar, 
  Tag, 
  Clock, 
  FileText, 
  Eye, 
  Mail,
  Sparkles,
  Triangle
} from 'lucide-react';
import '@/styles/progress-indicators.css';

interface Contract {
  id: string;
  customerName: string;
  status: string;
  value: string;
  renewalDate: string;
  lastModified: string;
  labels: string[];
  owner: string;
  riskScore: number;
  riskFactors: string[];
  usage: string;
  history: Array<{ date: string; action: string; user: string }>;
}

const ContractsSplitView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  
  // Define StatusIcon at component level
  const getStatusIcon = (status: string) => {
    const statusStyles: Record<string, { icon: React.ComponentType<{ className?: string }>; text: string }> = {
      'Unsigned': { icon: AlertTriangle, text: 'text-yellow-600' },
      'In Review': { icon: FileCheck, text: 'text-blue-600' },
      'Signed': { icon: FileCheck, text: 'text-green-600' },
      'Pending Approval': { icon: Clock, text: 'text-orange-600' }
    };
    return statusStyles[status] || statusStyles['Unsigned'];
  };

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
        { date: '2024-03-08', action: 'Revisions made', user: 'Alex Park' },
        { date: '2024-03-12', action: 'Sent for final review', user: 'Alex Park' }
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
        { date: '2024-02-25', action: 'Sent to customer', user: 'Michael Chen' },
        { date: '2024-03-05', action: 'Customer signed', user: 'Michael Chen' },
        { date: '2024-03-08', action: 'Internal countersign', user: 'Finance Team' }
      ]
    },
    {
      id: 'CNT-004',
      customerName: 'Initech Systems',
      status: 'Pending Approval',
      value: '$250,000',
      renewalDate: 'Oct 05, 2024',
      lastModified: '2024-03-15',
      labels: ['Non-Standard Pricing', 'Custom Terms'],
      owner: 'Emily Rodriguez',
      riskScore: 40,
      riskFactors: ['Non-standard terms'],
      usage: 'Low',
      history: [
        { date: '2024-03-01', action: 'Contract created', user: 'Emily Rodriguez' },
        { date: '2024-03-10', action: 'Negotiations', user: 'Emily Rodriguez' },
        { date: '2024-03-15', action: 'Pending approval', user: 'Legal Team' }
      ]
    }
  ];

  const statusStyles: Record<string, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
    'Unsigned': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertTriangle },
    'In Review': { bg: 'bg-blue-100', text: 'text-blue-800', icon: FileCheck },
    'Signed': { bg: 'bg-green-100', text: 'text-green-800', icon: FileCheck },
    'Pending Approval': { bg: 'bg-orange-100', text: 'text-orange-800', icon: Clock },
    'Negotiation': { bg: 'bg-purple-100', text: 'text-purple-800', icon: Scale }
  };

  const labelColors: Record<string, { bg: string; text: string }> = {
    'Unsigned': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'Non-Standard Pricing': { bg: 'bg-red-100', text: 'text-red-800' },
    'Price Cap': { bg: 'bg-blue-100', text: 'text-blue-800' },
    'Unlimited Liability': { bg: 'bg-red-100', text: 'text-red-800' },
    'Custom SLA': { bg: 'bg-purple-100', text: 'text-purple-800' },
    'Enterprise Terms': { bg: 'bg-green-100', text: 'text-green-800' },
    'Multi-Year': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    'Custom Terms': { bg: 'bg-orange-100', text: 'text-orange-800' }
  };

  const filteredContracts = contracts.filter(contract => {
    return contract.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           contract.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
           contract.owner.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getRiskColor = (score: number) => {
    if (score < 30) return 'bg-green-500';
    if (score < 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="sm:flex sm:items-center mb-4">
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
      
      <div className="flex-grow flex overflow-hidden w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Left Panel - Contract List */}
        <div className="w-1/3 bg-white rounded-lg shadow-sm overflow-hidden mr-4 flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="search"
                placeholder="Search contracts..."
                className="block w-full rounded-lg border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-grow">
            {filteredContracts.map((contract) => {
              const isSelected = selectedContract && selectedContract.id === contract.id;
              
              return (
                <div 
                  key={contract.id} 
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                  onClick={() => setSelectedContract(contract)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{contract.customerName}</h3>
                      <p className="text-xs text-gray-500">{contract.id}</p>
                    </div>
                    <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusStyles[contract.status].bg} ${statusStyles[contract.status].text}`}>
                      {React.createElement(getStatusIcon(contract.status).icon, { className: "mr-1 h-4 w-4" })}
                      {contract.status}
                    </div>
                  </div>
                  
                  <div className="mt-2 flex justify-between text-sm">
                    <div>
                      <span className="text-gray-500">Renewal:</span> {contract.renewalDate}
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
              <div className="border-b flex items-center justify-between p-4">
                <div>
                  <h2 className="text-xl font-semibold">{selectedContract.customerName}</h2>
                  <p className="text-sm text-gray-500">{selectedContract.id}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                  <button className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Contact
                  </button>
                  <button className="px-3 py-1 bg-blue-600 rounded-lg text-sm text-white flex items-center gap-1">
                    Edit
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto flex-grow">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    {/* Contract Overview */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Contract Overview</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <div className={`text-sm font-medium flex items-center ${statusStyles[selectedContract.status].text}`}>
                            {React.createElement(getStatusIcon(selectedContract.status).icon, { className: "h-4 w-4 mr-1" })}
                            {selectedContract.status}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Value</p>
                          <p className="text-sm font-medium">{selectedContract.value}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Renewal Date</p>
                          <p className="text-sm font-medium flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {selectedContract.renewalDate}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Owner</p>
                          <p className="text-sm font-medium flex items-center">
                            <User className="h-4 w-4 mr-1 text-gray-400" />
                            {selectedContract.owner}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Labels */}
                    <div className="bg-white rounded-lg border p-4 mb-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <Tag className="h-4 w-4 mr-1 text-gray-400" />
                        Labels
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedContract.labels.map((label) => (
                          <span
                            key={label}
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${labelColors[label].bg} ${labelColors[label].text}`}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Risk Assessment */}
                    <div className="bg-white rounded-lg border p-4 mb-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <Triangle className="h-4 w-4 mr-1 text-gray-400" />
                        Risk Assessment
                      </h3>
                      <div className="progress-bar-track bg-gray-200">
                        <div 
                          className={`progress-bar-fill ${getRiskColor(selectedContract.riskScore)} progress-bar`} 
                          style={{ width: `${selectedContract.riskScore}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-green-700">Low Risk</span>
                        <span className="text-red-700">High Risk</span>
                      </div>
                      
                      {selectedContract.riskFactors.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-700 mb-1">Risk factors:</p>
                          <ul className="text-xs text-gray-600 list-disc pl-4">
                            {selectedContract.riskFactors.map((factor, i) => (
                              <li key={i}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    {/* AI Insights */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-100">
                      <h3 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                        <Sparkles className="h-4 w-4 mr-1 text-blue-500" />
                        AI Insights
                      </h3>
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded-md shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">Non-standard terms detected</p>
                          <p className="text-sm text-gray-900">This contract includes unlimited liability provisions that differ from your standard terms.</p>
                        </div>
                        <div className="bg-white p-3 rounded-md shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">Renewal opportunity</p>
                          <p className="text-sm text-gray-900">Based on usage patterns, this account may be eligible for a 10-15% price increase.</p>
                        </div>
                        <div className="bg-white p-3 rounded-md shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">Similar contracts</p>
                          <p className="text-sm text-gray-900">Found 3 similar contracts with better terms. Consider aligning during renewal.</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Activity Timeline */}
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        Activity Timeline
                      </h3>
                      <div className="space-y-4">
                        {selectedContract.history.map((item, index) => (
                          <div key={index} className="relative pl-6">
                            <div className="absolute left-0 top-1 h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                            </div>
                            <p className="text-sm font-medium">{item.action}</p>
                            <p className="text-xs text-gray-500">
                              {item.date} • {item.user}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                  <FileText className="h-12 w-12" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">No Contract Selected</h3>
                <p className="mt-1 text-sm text-gray-500">Select a contract from the list to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractsSplitView;