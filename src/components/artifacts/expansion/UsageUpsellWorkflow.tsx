import React from 'react';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';

const UsageSpikeWorkflow = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Customer Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-600">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">InnovateTech Solutions</h2>
            <p className="text-sm text-gray-500">Current Plan: Pro • ARR: $24,000 • Next Billing: Feb 28, 2025</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
          <TrendingUp className="w-4 h-4" />
          Expansion Opportunity
        </div>
      </div>

      {/* Usage Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Usage vs Plan</div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600 mt-1">247%</div>
          <div className="text-xs text-green-600">Well above Pro limit</div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Monthly Usage</div>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">12.4K</div>
          <div className="text-xs text-blue-600">API calls (limit: 5K)</div>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Overage Costs</div>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">$3,720</div>
          <div className="text-xs text-amber-600">This month alone</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Growth Rate</div>
            <Target className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-1">+156%</div>
          <div className="text-xs text-purple-600">vs last quarter</div>
        </div>
      </div>

      {/* AI Recommendation Card */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">High-Value Expansion Opportunity</h3>
            <p className="text-gray-700 mb-4">
              Customer usage has exceeded plan limits by <strong>247%</strong>. Perfect timing for proactive expansion outreach:
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Current Situation */}
              <div>
                <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Growth Indicators
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>API usage grew 156% in 90 days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Overage charges: $3,720 this month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Team added 8 new users in December</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>High engagement across all features</span>
                  </li>
                </ul>
              </div>
              
              {/* Recommended Approach */}
              <div>
                <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  Strategic Approach
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Position as cost-saving opportunity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Offer 1-year plan with 20% discount</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Present 3-year option with even deeper savings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Include exclusive Enterprise features</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Recommendations */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-3">Recommended Pricing Options</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-900 mb-1">Current Trajectory</div>
              <div className="text-lg font-bold text-red-600">$68,640</div>
              <div className="text-xs text-gray-600">Pro + overages (12 months)</div>
            </div>
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
              <div className="text-sm font-medium text-blue-900 mb-1">1-Year Enterprise</div>
              <div className="text-lg font-bold text-blue-600">$48,000</div>
              <div className="text-xs text-blue-600">Save $20,640 (30% savings)</div>
            </div>
            <div className="border border-green-200 bg-green-50 rounded-lg p-3">
              <div className="text-sm font-medium text-green-900 mb-1">3-Year Enterprise</div>
              <div className="text-lg font-bold text-green-600">$42,000/yr</div>
              <div className="text-xs text-green-600">Save $26,640/yr (39% savings)</div>
            </div>
          </div>
        </div>

        {/* Action Options */}
        <div className="grid grid-cols-2 gap-6 mt-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 text-center">Expansion Confidence</h4>
            <div className="flex items-center justify-end mb-2">
              <span className="text-lg font-bold text-green-600">92%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4 relative">
              <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full"></div>
              <div className="absolute top-[-20px] left-[92%] transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[9px] border-l-transparent border-r-transparent border-t-black"></div>
            </div>
            
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommended Timeline:</h4>
            <p className="text-sm text-gray-700 mb-4">
              Reach out within 48 hours while overage costs are fresh. Lead with cost savings message and growth congratulations.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 text-center">Next Steps</h4>
            <p className="text-sm font-normal text-gray-700 mb-4">
              Shall I draft a value-focused expansion email highlighting their cost savings opportunity?
            </p>
            <div className="space-y-2">
              <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm">
                📧 Draft Expansion Email
              </button>
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm">
                📊 Prepare Usage Analysis
              </button>
              <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm">
                📅 Schedule Strategy Call
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Supporting Analysis */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Usage Analysis</h4>
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between">
              <span>Dec 2024 Usage:</span>
              <span className="font-medium">12,400 API calls</span>
            </div>
            <div className="flex justify-between">
              <span>Plan Limit:</span>
              <span className="font-medium">5,000</span>
            </div>
            <div className="flex justify-between">
              <span>Overage Rate:</span>
              <span className="font-medium">$0.50/call</span>
            </div>
            <div className="flex justify-between">
              <span>Growth Trend:</span>
              <span className="font-medium text-green-600">Accelerating</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Customer Profile</h4>
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between">
              <span>Customer Health:</span>
              <span className="font-medium text-green-600">Excellent</span>
            </div>
            <div className="flex justify-between">
              <span>Payment History:</span>
              <span className="font-medium text-green-600">Perfect</span>
            </div>
            <div className="flex justify-between">
              <span>Support Satisfaction:</span>
              <span className="font-medium text-green-600">4.8/5</span>
            </div>
            <div className="flex justify-between">
              <span>Churn Risk:</span>
              <span className="font-medium text-green-600">Very Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageSpikeWorkflow;