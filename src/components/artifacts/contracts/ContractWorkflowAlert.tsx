import React from 'react';
import { FileText, AlertTriangle, Clock, Shield, CheckCircle, XCircle, Calendar, DollarSign } from 'lucide-react';

const ContractWorkflow = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Contract Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-800">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">MegaCorp Enterprise Agreement</h2>
            <p className="text-sm text-gray-500">Current Value: $180,000 • Renewal: Jan 30, 2025</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          Contract Risk Detected
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Contract Health</div>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 mt-1">32%</div>
          <div className="text-xs text-red-600">4 critical issues found</div>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Days to Renewal</div>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">18</div>
          <div className="text-xs text-amber-600">Urgent action needed</div>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Legal Review</div>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">Pending</div>
          <div className="text-xs text-amber-600">Scheduled for tomorrow</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Revenue at Risk</div>
            <DollarSign className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">$180K</div>
          <div className="text-xs text-gray-600">Full contract value</div>
        </div>
      </div>

      {/* AI Warning Card */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Critical Contract Issues Detected</h3>
            <p className="text-gray-700 mb-4">
              I've identified <strong>4 high-risk clauses</strong> that could impact renewal. Immediate action recommended:
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Critical Issues */}
              <div>
                <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  Critical Issues
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Unlimited liability exposure in Section 8</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Automatic price increase clause (15% annually)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>90-day termination notice requirement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Exclusive dealing provision conflicts with other vendors</span>
                  </li>
                </ul>
              </div>
              
              {/* Recommended Actions */}
              <div>
                <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Recommended Actions
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Request liability cap of $500K maximum</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Negotiate 3% price increase ceiling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Reduce termination notice to 30 days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Add carve-outs for existing vendor relationships</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Level and Next Steps */}
        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Left Side - Risk Assessment */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 text-center">Contract Risk Level</h4>
            <div className="flex items-center justify-end mb-2">
              <span className="text-lg font-bold text-red-600">High</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4 relative">
              <div className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded-full"></div>
              <div className="absolute top-[-20px] left-[85%] transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[9px] border-l-transparent border-r-transparent border-t-black"></div>
            </div>
            
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommended Strategy:</h4>
            <p className="text-sm text-gray-700 mb-4">
              Initiate immediate renegotiation with legal review. Consider alternative suppliers as backup leverage for negotiations.
            </p>
          </div>

          {/* Right Side - Action Options */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 text-center">Choose Action Path</h4>
            <div className="space-y-2">
              <button className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm">
                🚨 Emergency Contract Review
              </button>
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm">
                📝 Draft Counter-Proposal
              </button>
              <button className="w-full bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors text-sm">
                🔍 Get Alternative Quotes
              </button>
              <button className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors text-sm">
                ⏸️ Delay Renewal (High Risk)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Timeline */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recommended Timeline</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Immediate: Schedule legal review meeting</p>
              <p className="text-sm text-gray-600">Within 24 hours - Review critical clauses with legal team</p>
            </div>
            <div className="text-sm text-red-600 font-medium">Today</div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Draft amendment proposals</p>
              <p className="text-sm text-gray-600">Prepare counter-terms for the 4 critical issues</p>
            </div>
            <div className="text-sm text-amber-600 font-medium">Day 2-3</div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Present proposals to MegaCorp</p>
              <p className="text-sm text-gray-600">Initiate formal renegotiation process</p>
            </div>
            <div className="text-sm text-blue-600 font-medium">Day 5-7</div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Finalize renewed contract</p>
              <p className="text-sm text-gray-600">Execute amended agreement before deadline</p>
            </div>
            <div className="text-sm text-green-600 font-medium">Day 14-18</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractWorkflow;