import React from 'react';
import { Calendar, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Target, CheckCircle, Clock } from 'lucide-react';

const MonthlyRenewalsForecast = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-600">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">February 2025 Renewals Forecast</h2>
            <p className="text-sm text-gray-500">28 accounts up for renewal • $847K total ARR at risk • 18 days remaining</p>
          </div>
        </div>
      </div>

      {/* MRR Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Current MRR</div>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">$2.8M</div>
          <div className="text-xs text-blue-600">Jan 2025 confirmed</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Projected MRR</div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600 mt-1">$2.97M</div>
          <div className="text-xs text-green-600">+6.1% growth target</div>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">At Risk MRR</div>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">$147K</div>
          <div className="text-xs text-amber-600">17% of renewals</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Forecast Confidence</div>
            <Target className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-1">84%</div>
          <div className="text-xs text-purple-600">Based on current pipeline</div>
        </div>
      </div>

      {/* Renewals Pipeline */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">February Renewal Pipeline</h3>
        <div className="space-y-3">
          {/* High Value Accounts */}
          <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <h4 className="font-medium text-gray-900">Enterprise Dynamics</h4>
                  <p className="text-sm text-gray-600">Renewal Date: Feb 5 • Contract Value: $180K</p>
                </div>
              </div>
              <div className="text-right">
                <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded mb-1">Likely Renewal</div>
                <div className="text-sm font-medium text-green-600">95% confidence</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Next Step: Contract signature scheduled Feb 3</span>
              <span className="font-medium text-green-600">+15% expansion opportunity</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <div>
                  <h4 className="font-medium text-gray-900">CloudScale Technologies</h4>
                  <p className="text-sm text-gray-600">Renewal Date: Feb 12 • Contract Value: $96K</p>
                </div>
              </div>
              <div className="text-right">
                <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded mb-1">In Negotiation</div>
                <div className="text-sm font-medium text-blue-600">78% confidence</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Next Step: Pricing discussion scheduled Feb 8</span>
              <span className="font-medium text-blue-600">Flat renewal expected</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-amber-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <h4 className="font-medium text-gray-900">DataFlow Corp</h4>
                  <p className="text-sm text-gray-600">Renewal Date: Feb 18 • Contract Value: $72K</p>
                </div>
              </div>
              <div className="text-right">
                <div className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded mb-1">At Risk</div>
                <div className="text-sm font-medium text-amber-600">45% confidence</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Next Step: Executive escalation call Feb 10</span>
              <span className="font-medium text-red-600">Budget concerns cited</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-red-500" />
                <div>
                  <h4 className="font-medium text-gray-900">InnovateNow Systems</h4>
                  <p className="text-sm text-gray-600">Renewal Date: Feb 22 • Contract Value: $45K</p>
                </div>
              </div>
              <div className="text-right">
                <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded mb-1">High Risk</div>
                <div className="text-sm font-medium text-red-600">25% confidence</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Next Step: Retention offer preparation</span>
              <span className="font-medium text-red-600">Evaluating alternatives</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Analysis */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Renewal Breakdown by Risk</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Likely Renewals (80%+ confidence)</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">18 accounts</div>
                <div className="text-sm text-gray-600">$567K ARR</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">In Negotiation (50-79%)</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">6 accounts</div>
                <div className="text-sm text-gray-600">$195K ARR</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-sm text-gray-700">At Risk (25-49%)</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">3 accounts</div>
                <div className="text-sm text-gray-600">$63K ARR</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-700">High Risk (&lt;25%)</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">1 account</div>
                <div className="text-sm text-gray-600">$22K ARR</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Expected Renewal Rate:</span>
              <span className="text-lg font-bold text-blue-600">82.7%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Expected MRR Impact:</span>
              <span className="font-medium text-green-600">+$700K retained</span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Expansion Opportunities</h3>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">Enterprise Dynamics</span>
                <span className="text-sm font-medium text-green-600">+$27K</span>
              </div>
              <p className="text-xs text-gray-600">Additional users + Enterprise features upgrade</p>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">TechFlow Solutions</span>
                <span className="text-sm font-medium text-green-600">+$18K</span>
              </div>
              <p className="text-xs text-gray-600">Multi-year commitment discount offset by volume growth</p>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">GlobalTech Corp</span>
                <span className="text-sm font-medium text-green-600">+$12K</span>
              </div>
              <p className="text-xs text-gray-600">API usage increase + premium support tier</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-green-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Total Expansion Potential:</span>
              <span className="text-lg font-bold text-green-600">+$57K MRR</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Success Rate (Historical):</span>
              <span className="font-medium text-green-600">73%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Priority Actions This Week</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">High Priority</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>InnovateNow: Schedule retention call by Feb 8</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span>DataFlow: Executive escalation meeting Feb 10</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>CloudScale: Pricing proposal review Feb 8</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">This Week</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Enterprise Dynamics: Finalize contract details</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>TechFlow: Present expansion proposal</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>GlobalTech: Usage analysis meeting</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Summary */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Historical Performance</h4>
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between">
              <span>Jan 2025 Renewal Rate:</span>
              <span className="font-medium text-green-600">89.2%</span>
            </div>
            <div className="flex justify-between">
              <span>Q4 2024 Average:</span>
              <span className="font-medium">86.5%</span>
            </div>
            <div className="flex justify-between">
              <span>YoY Retention:</span>
              <span className="font-medium text-green-600">91.4%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Key Metrics</h4>
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between">
              <span>Avg Days to Close:</span>
              <span className="font-medium">12.4</span>
            </div>
            <div className="flex justify-between">
              <span>Expansion Rate:</span>
              <span className="font-medium text-green-600">23%</span>
            </div>
            <div className="flex justify-between">
              <span>Contraction Risk:</span>
              <span className="font-medium text-amber-600">4.2%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">March Preview</h4>
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between">
              <span>Accounts Renewing:</span>
              <span className="font-medium">34</span>
            </div>
            <div className="flex justify-between">
              <span>Total ARR at Risk:</span>
              <span className="font-medium">$1.2M</span>
            </div>
            <div className="flex justify-between">
              <span>Early Forecast:</span>
              <span className="font-medium text-blue-600">85% confident</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyRenewalsForecast;