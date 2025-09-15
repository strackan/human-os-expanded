import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Mail, Building2, Users, Activity, DollarSign } from 'lucide-react';

const PricingRecommendationFlat = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Customer Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{backgroundColor: '#2b136c'}}>
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">DataSync Industries</h2>
            <p className="text-sm text-gray-500">Current ARR: $52,000 newal: Mar 20, 2025</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          At-Risk Customer
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Usage Score</div>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 mt-1">42</div>
          <div className="text-xs text-red-600">-28% from last quarter</div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Engagement</div>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 mt-1">31</div>
          <div className="text-xs text-red-600">-45% from last quarter</div>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Team Growth</div>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">-12%</div>
          <div className="text-xs text-amber-600">-3 seats removed</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Support Health</div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">89</div>
          <div className="text-xs text-green-600">No open tickets</div>
        </div>
      </div>

      {/* AI Recommendation Card */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">AI Pricing Recommendation</h3>
            <p className="text-gray-700 mb-4">
              Based on my analysis, I recommend <strong>postponing any price increase</strong> for this customer:
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Risks */}
              <div>
                <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Critical Risks
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Usage dropped 28% with limited feature adoption</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Team size reduction indicates budget constraints</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Low engagement suggests poor product-market fit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Recent downgrades in competitor comparisons</span>
                  </li>
                </ul>
              </div>
              
              {/* Limited Opportunities */}
              <div>
                <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Limited Opportunities
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Support satisfaction remains high (89 score)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Contract renewal still 5 months away</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Historical loyalty as 3-year customer</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Confidence Score and Next Steps */}
        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Left Side - Confidence Score + Context */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 text-center">Price Increase Risk</h4>
            <div className="flex items-center justify-end mb-2">
              <span className="text-lg font-bold text-red-600">89%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4 relative">
              <div className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded-full"></div>
              <div 
                className="absolute transform -translate-x-1/2"
                style={{
                  top: '-20px',
                  left: '89%',
                  width: '0',
                  height: '0',
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '9px solid black'
                }}
              ></div>
            </div>
            
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommended Next Step:</h4>
            <p className="text-sm text-gray-700 mb-4">
              Focus on customer success and value demonstration. Schedule a strategy session to understand their challenges and improve adoption before considering any pricing changes.
            </p>
          </div>

          {/* Right Side - Action Request */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 text-center">Next Steps</h4>
            <p className="text-sm font-normal text-gray-700 mb-4">
              Shall I draft a customer success outreach email to schedule a strategy session and usage review?
            </p>
            <div className="flex justify-between items-center mb-2">
              <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors">
                No
              </button>
              <div className="flex flex-col items-center">
                <button className="px-6 py-3 rounded-lg font-medium text-white transition-colors mb-1" style={{backgroundColor: '#2b136c'}} onMouseOver={(e) => e.target.style.backgroundColor = '#1f0d4d'} onMouseOut={(e) => e.target.style.backgroundColor = '#2b136c'}>
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

      {/* Supporting Data Row */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Market Benchmarks</h4>
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between">
              <span>Industry Average:</span>
              <span className="font-medium">$2.1/seat/month</span>
            </div>
            <div className="flex justify-between">
              <span>DataSync Current:</span>
              <span className="font-medium">$2.0/seat/month</span>
            </div>
            <div className="flex justify-between">
              <span>Recommended:</span>
              <span className="font-medium text-red-600">Hold Current Price</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Risk Assessment</h4>
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between">
              <span>Churn Risk:</span>
              <span className="font-medium text-red-600">High</span>
            </div>
            <div className="flex justify-between">
              <span>Expansion Potential:</span>
              <span className="font-medium text-red-600">Low</span>
            </div>
            <div className="flex justify-between">
              <span>Price Sensitivity:</span>
              <span className="font-medium text-red-600">High</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingRecommendationFlat;
