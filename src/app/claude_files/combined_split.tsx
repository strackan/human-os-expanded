import React, { useState } from 'react';
import { 
  FileDown, 
  AlertTriangle, 
  FileCheck, 
  Scale, 
  DollarSign, 
  Search, 
  FileText
} from 'lucide-react';

const SimpleView = () => {
  const [selectedContract, setSelectedContract] = useState(null);
  const [showAmendmentPanel, setShowAmendmentPanel] = useState(false);
  
  // Sample contract data
  const contracts = [
    {
      id: 'CNT-001',
      customerName: 'Acme Corporation',
      status: 'Unsigned',
      value: '$450,000',
      renewalDate: 'Aug 15, 2024'
    },
    {
      id: 'CNT-002',
      customerName: 'Globex Inc.',
      status: 'In Review',
      value: '$320,000',
      renewalDate: 'Sep 10, 2024'
    },
    {
      id: 'CNT-003',
      customerName: 'TechCorp Solutions',
      status: 'Signed',
      value: '$780,000',
      renewalDate: 'Jul 22, 2024'
    }
  ];

  // Status styling
  const statusStyles = {
    'Unsigned': { 
      bg: 'bg-red-50', 
      text: 'text-red-700',
      icon: FileDown
    },
    'In Review': { 
      bg: 'bg-yellow-50', 
      text: 'text-yellow-700',
      icon: AlertTriangle
    },
    'Signed': { 
      bg: 'bg-green-50', 
      text: 'text-green-700',
      icon: FileCheck
    },
    'Pending Approval': { 
      bg: 'bg-blue-50', 
      text: 'text-blue-700',
      icon: Scale
    },
    'Negotiation': { 
      bg: 'bg-purple-50', 
      text: 'text-purple-700',
      icon: DollarSign
    }
  };
  
  const toggleAmendmentPanel = () => {
    setShowAmendmentPanel(!showAmendmentPanel);
  };

  return (
    <div className="w-full h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Contracts</h1>
      
      <div className="flex h-[calc(100vh-100px)]">
        {/* Left Panel - Contract List */}
        <div className="w-1/3 bg-white rounded-lg shadow-sm overflow-hidden mr-4">
          <div className="p-4 border-b">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="search"
                placeholder="Search contracts..."
                className="block w-full rounded-lg border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300"
              />
            </div>
          </div>
          
          <div className="overflow-y-auto h-full">
            {contracts.map((contract) => {
              const StatusIcon = statusStyles[contract.status].icon;
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
                      <StatusIcon className="mr-1 h-4 w-4" />
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
                <div>
                  <button 
                    className="px-3 py-1 bg-blue-600 rounded-lg text-sm text-white"
                    onClick={toggleAmendmentPanel}
                  >
                    Draft Amendment
                  </button>
                </div>
              </div>
              
              <div className="p-6 flex-grow">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="col-span-2 bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Contract Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <div className={`text-sm font-medium flex items-center ${statusStyles[selectedContract.status].text}`}>
                          {React.createElement(statusStyles[selectedContract.status].icon, {className: "h-4 w-4 mr-1"})}
                          {selectedContract.status}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Value</p>
                        <p className="text-sm font-medium">{selectedContract.value}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Renewal Date</p>
                        <p className="text-sm font-medium">{selectedContract.renewalDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center p-10 text-gray-500 bg-gray-50 rounded-lg">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Contract Terms</h3>
                  <p>Contract details would be displayed here</p>
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
      
      {/* Amendment Panel (Slide-in from right) */}
      {showAmendmentPanel && (
        <div className="fixed top-0 right-0 bottom-0 w-96 bg-white shadow-lg z-10 flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-medium">Draft Amendment</h2>
            <button onClick={toggleAmendmentPanel} className="p-1 rounded-full hover:bg-gray-100">
              <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-4 flex-grow overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amendment Type</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option>Term Extension</option>
                  <option>Price Adjustment</option>
                  <option>Liability Cap</option>
                  <option>Custom Amendment</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amendment Text</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-64"
                  defaultValue="This Amendment extends the Term of the Agreement for an additional period of [X] months, beginning on [START DATE] and ending on [END DATE], unless terminated earlier in accordance with the Agreement."
                ></textarea>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t">
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
                Save Amendment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleView;