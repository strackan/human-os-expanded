import React from 'react';
import { FileText, AlertTriangle, CheckCircle, Clock, Shield, DollarSign, Calendar, Users } from 'lucide-react';

const ContractAnalysisCard = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Contract Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-800">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Enterprise Service Agreement</h2>
            <p className="text-sm text-gray-500">GlobalTech Corp • Executed: Jan 15, 2023 • Value: $240,000</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          Renewal Due Soon
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Compliance Score</div>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600 mt-1">94%</div>
          <div className="text-xs text-green-600">All terms met</div>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Days to Renewal</div>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">45</div>
          <div className="text-xs text-amber-600">Mar 1, 2025</div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Auto-Renewal</div>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">Yes</div>
          <div className="text-xs text-blue-600">30-day notice required</div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Risk Level</div>
            <Shield className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 mt-1">Medium</div>
          <div className="text-xs text-red-600">2 flagged clauses</div>
        </div>
      </div>

      {/* AI Analysis Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">AI Contract Analysis</h3>
            <p className="text-gray-700 mb-4">
              Contract analysis complete. <strong>2 critical items</strong> require attention before renewal:
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Key Findings */}
              <div>
                <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Key Findings
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Payment terms consistently met (Net 30)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Service level agreements exceeded (99.7% uptime)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Data security requirements fully compliant</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Renewal value opportunity: +15% ($276,000)</span>
                  </li>
                </ul>
              </div>
              
              {/* Action Required */}
              <div>
                <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Action Required
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Liability cap clause needs updating (outdated limits)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Intellectual property terms require clarification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Data retention policy may conflict with new regulations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Price escalation clause missing for multi-year terms</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Assessment and Next Steps */}
        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Left Side - Risk Assessment */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 text-center">Contract Risk Score</h4>
            <div className="flex items-center justify-end mb-2">
              <span className="text-lg font-bold text-amber-600">Medium</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4 relative">
              <div className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded-full"></div>
              <div className="absolute top-[-20px] left-[60%] transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[9px] border-l-transparent border-r-transparent border-t-black"></div>
            </div>
            
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommended Timeline:</h4>
            <p className="text-sm text-gray-700 mb-4">
              Begin renewal negotiations within 2 weeks. Address liability and IP clauses before finalizing terms to ensure smooth transition.
            </p>
          </div>

          {/* Right Side - Action Request */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 text-center">Next Steps</h4>
            <p className="text-sm font-normal text-gray-700 mb-4">
              Shall I generate amendment drafts for the flagged clauses and schedule a legal review?
            </p>
            <div className="flex justify-between items-center mb-2">
              <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors">
                No
              </button>
              <div className="flex flex-col items-center">
                <button className="px-6 py-3 rounded-lg font-medium text-white transition-colors mb-1 bg-purple-800 hover:bg-purple-900">
                  Yes
                </button>
                <button className="text-sm text-gray-500 hover:text-gray-700 underline">
                  snooze
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supporting Details */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Financial Terms</h4>
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between">
              <span>Annual Value:</span>
              <span className="font-medium">$240,000</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Terms:</span>
              <span className="font-medium">Net 30</span>
            </div>
            <div className="flex justify-between">
              <span>Renewal Increase:</span>
              <span className="font-medium text-green-600">+15%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Service Levels</h4>
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between">
              <span>Uptime SLA:</span>
              <span className="font-medium text-green-600">99.5%</span>
            </div>
            <div className="flex justify-between">
              <span>Actual Uptime:</span>
              <span className="font-medium text-green-600">99.7%</span>
            </div>
            <div className="flex justify-between">
              <span>Response Time:</span>
              <span className="font-medium text-green-600">&lt; 4hrs</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Key Dates</h4>
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between">
              <span>Start Date:</span>
              <span className="font-medium">Jan 15, 2023</span>
            </div>
            <div className="flex justify-between">
              <span>Current Term:</span>
              <span className="font-medium">24 months</span>
            </div>
            <div className="flex justify-between">
              <span>Notice Period:</span>
              <span className="font-medium text-amber-600">30 days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractAnalysisCard;