import React from 'react';
import { TestTube, Users, DollarSign, Target, BarChart3, AlertCircle } from 'lucide-react';

const PriceTestingDashboard = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-600">
            <TestTube className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">PLG Price Increase Testing</h2>
            <p className="text-sm text-gray-500">A/B Testing: 8% vs 12% increase • Started: Jan 15, 2025 • 14 days remaining</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
          <TestTube className="w-4 h-4" />
          Test In Progress
        </div>
      </div>

      {/* Test Overview Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Total Customers</div>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">2,840</div>
          <div className="text-xs text-blue-600">1,420 per cohort</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Responses So Far</div>
            <BarChart3 className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600 mt-1">1,892</div>
          <div className="text-xs text-green-600">66.6% response rate</div>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Revenue Impact</div>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">$47K</div>
          <div className="text-xs text-amber-600">Monthly lift (early data)</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Statistical Power</div>
            <Target className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-1">73%</div>
          <div className="text-xs text-purple-600">Need 85% for significance</div>
        </div>
      </div>

      {/* A/B Test Results Comparison */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Group A: 8% Increase */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Group A: 8% Increase</h3>
              <p className="text-sm text-gray-600">Conservative approach - Pro plan: $19.99 → $21.59</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3">
              <div className="text-sm text-gray-600">Acceptance Rate</div>
              <div className="text-2xl font-bold text-green-600">84.2%</div>
              <div className="text-xs text-green-600">798 of 948 accepted</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-sm text-gray-600">Churn Rate</div>
              <div className="text-2xl font-bold text-green-600">3.1%</div>
              <div className="text-xs text-green-600">29 customers churned</div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Revenue Lift:</span>
              <span className="font-medium text-green-600">+$22,400/month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer Feedback:</span>
              <span className="font-medium text-green-600">Mostly positive</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Support Tickets:</span>
              <span className="font-medium text-green-600">+12% (manageable)</span>
            </div>
          </div>

          <div className="mt-4 bg-green-100 rounded-lg p-3">
            <h4 className="font-medium text-green-900 mb-2">Key Insights</h4>
            <ul className="text-xs text-green-800 space-y-1">
              <li>• High acceptance rate with minimal pushback</li>
              <li>• Customers cite &quot;reasonable adjustment&quot;</li>
              <li>• Low churn risk, stable customer base</li>
            </ul>
          </div>
        </div>

        {/* Group B: 12% Increase */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Group B: 12% Increase</h3>
              <p className="text-sm text-gray-600">Aggressive approach - Pro plan: $19.99 → $22.39</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3">
              <div className="text-sm text-gray-600">Acceptance Rate</div>
              <div className="text-2xl font-bold text-amber-600">71.8%</div>
              <div className="text-xs text-amber-600">678 of 944 accepted</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-sm text-gray-600">Churn Rate</div>
              <div className="text-2xl font-bold text-red-600">8.7%</div>
              <div className="text-xs text-red-600">82 customers churned</div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Revenue Lift:</span>
              <span className="font-medium text-amber-600">+$24,600/month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer Feedback:</span>
              <span className="font-medium text-red-600">Mixed/negative</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Support Tickets:</span>
              <span className="font-medium text-red-600">+47% (concerning)</span>
            </div>
          </div>

          <div className="mt-4 bg-amber-100 rounded-lg p-3">
            <h4 className="font-medium text-amber-900 mb-2">Key Insights</h4>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>• Higher revenue but significant churn risk</li>
              <li>• Complaints about &quot;steep price jump&quot;</li>
              <li>• Support burden increased substantially</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Early Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Early Test Analysis</h3>
            <p className="text-gray-700 mb-4">
              Based on current data trends, <strong>Group A (8% increase)</strong> is showing stronger performance:
            </p>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Net Revenue Impact</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Group A (8%):</span>
                    <span className="font-medium text-green-600">+$22,400</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Group B (12%):</span>
                    <span className="font-medium text-amber-600">+$24,600</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Difference:</span>
                      <span className="font-medium text-gray-900">+$2,200 (9%)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Customer Impact</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">A Churn Rate:</span>
                    <span className="font-medium text-green-600">3.1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">B Churn Rate:</span>
                    <span className="font-medium text-red-600">8.7%</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Difference:</span>
                      <span className="font-medium text-red-600">+5.6 pts</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Long-term Value</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">A - 12mo LTV:</span>
                    <span className="font-medium text-green-600">$268K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">B - 12mo LTV:</span>
                    <span className="font-medium text-amber-600">$295K</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Net LTV Impact:</span>
                      <span className="font-medium text-green-600">A wins</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <strong>Recommendation:</strong> Group A&apos;s lower churn rate and better customer sentiment outweigh Group B&apos;s marginal revenue advantage. The 2.8x higher churn risk in Group B threatens long-term value.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 text-center">Test Status</h4>
            <div className="flex items-center justify-end mb-2">
              <span className="text-lg font-bold text-blue-600">73%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4 relative">
              <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full"></div>
              <div className="absolute top-[-20px] left-[73%] transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[9px] border-l-transparent border-r-transparent border-t-black"></div>
            </div>
            
            <p className="text-sm text-gray-700 mb-4">
              Need 12% more responses for statistical significance. Current trend strongly favors Group A.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 text-center">Actions</h4>
            <div className="space-y-2">
              <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm">
                📊 Export Interim Results
              </button>
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm">
                ⚡ Early Stop (Implement 8%)
              </button>
              <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors text-sm">
                ⏳ Continue Test (14 days)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Supporting Metrics */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Customer Segments</h4>
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between">
              <span>Startups (&lt;50 employees):</span>
              <span className="font-medium">47%</span>
            </div>
            <div className="flex justify-between">
              <span>SMBs (50-500 employees):</span>
              <span className="font-medium">38%</span>
            </div>
            <div className="flex justify-between">
              <span>Mid-market (500+):</span>
              <span className="font-medium">15%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Response Timing</h4>
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between">
              <span>Day 1-3:</span>
              <span className="font-medium">34%</span>
            </div>
            <div className="flex justify-between">
              <span>Day 4-7:</span>
              <span className="font-medium">28%</span>
            </div>
            <div className="flex justify-between">
              <span>Day 8-14:</span>
              <span className="font-medium">24%</span>
            </div>
            <div className="flex justify-between">
              <span>No response:</span>
              <span className="font-medium text-amber-600">14%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Next Actions</h4>
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between">
              <span>Continue monitoring:</span>
              <span className="font-medium text-blue-600">Daily</span>
            </div>
            <div className="flex justify-between">
              <span>Decision deadline:</span>
              <span className="font-medium">Jan 29</span>
            </div>
            <div className="flex justify-between">
              <span>Implementation:</span>
              <span className="font-medium">Feb 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceTestingDashboard;