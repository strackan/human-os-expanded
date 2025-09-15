import React from 'react';
import { Users, TrendingUp, AlertTriangle, Target, DollarSign, Calendar, BarChart3, Award } from 'lucide-react';

const Q4ManagerForecast = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-600">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Q4 2025 Team Forecast</h2>
            <p className="text-sm text-gray-500">Customer Success Team • 73 days remaining • Updated: Sep 18, 2025</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
          <Target className="w-4 h-4" />
          Manager View
        </div>
      </div>

      {/* Key Forecast Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Q4 Target</div>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">$12.8M</div>
          <div className="text-xs text-blue-600">ARR renewal target</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Likely Forecast</div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600 mt-1">$11.6M</div>
          <div className="text-xs text-green-600">91% of target</div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">At Risk ARR</div>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 mt-1">$2.4M</div>
          <div className="text-xs text-red-600">19% of pipeline</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Team Confidence</div>
            <BarChart3 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-1">78%</div>
          <div className="text-xs text-purple-600">Weighted average</div>
        </div>
      </div>

      {/* Forecast Range */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Forecast Range Analysis</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-red-900">Low Scenario</span>
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Pessimistic</span>
            </div>
            <div className="text-2xl font-bold text-red-600 mb-2">$10.1M</div>
            <div className="text-sm text-gray-600 mb-3">79% of target • Major churn events</div>
            <div className="space-y-1 text-xs text-gray-600">
              <div>• 3 enterprise customers churn</div>
              <div>• Price resistance in mid-market</div>
              <div>• Economic downturn impact</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-green-900">Likely Scenario</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Expected</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-2">$11.6M</div>
            <div className="text-sm text-gray-600 mb-3">91% of target • Current trajectory</div>
            <div className="space-y-1 text-xs text-gray-600">
              <div>• Most renewals successful</div>
              <div>• Moderate expansion success</div>
              <div>• Standard churn rates</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-blue-900">High Scenario</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Optimistic</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-2">$13.2M</div>
            <div className="text-sm text-gray-600 mb-3">103% of target • Strong execution</div>
            <div className="space-y-1 text-xs text-gray-600">
              <div>• Major expansion wins</div>
              <div>• Enterprise upsells succeed</div>
              <div>• New product adoption</div>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-blue-100 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900">Gap to Target: $1.2M</span>
          </div>
          <p className="text-sm text-blue-800">
            Need to convert $1.2M from at-risk to committed, or secure major expansion wins to hit Q4 target.
          </p>
        </div>
      </div>

      {/* Team Performance & At-Risk Accounts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Team Performance Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Sarah Chen</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-600">$3.2M</div>
                <div className="text-xs text-gray-600">108% to target</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Michael Rodriguez</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-blue-600">$2.8M</div>
                <div className="text-xs text-gray-600">97% to target</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Emma Thompson</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-amber-600">$2.4M</div>
                <div className="text-xs text-gray-600">82% to target</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Alex Park</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-red-600">$1.8M</div>
                <div className="text-xs text-gray-600">67% to target</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Jessica Liu</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-purple-600">$1.4M</div>
                <div className="text-xs text-gray-600">73% to target</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">Team Total Progress:</span>
              <span className="text-lg font-bold text-blue-600">85% to Q4 Target</span>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Critical At-Risk Accounts</h3>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 border-l-4 border-red-500">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">GlobalTech Enterprises</h4>
                  <p className="text-xs text-gray-600">Owner: Michael Rodriguez • Due: Oct 15</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-red-600">$450K</div>
                  <div className="text-xs text-red-600">High churn risk</div>
                </div>
              </div>
              <p className="text-xs text-gray-700">Budget cuts, evaluating competitors</p>
            </div>

            <div className="bg-white rounded-lg p-3 border-l-4 border-amber-500">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">DataFlow Systems</h4>
                  <p className="text-xs text-gray-600">Owner: Emma Thompson • Due: Nov 8</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-amber-600">$280K</div>
                  <div className="text-xs text-amber-600">Price sensitive</div>
                </div>
              </div>
              <p className="text-xs text-gray-700">Negotiating on 15% increase proposal</p>
            </div>

            <div className="bg-white rounded-lg p-3 border-l-4 border-orange-500">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">InnovateCorp</h4>
                  <p className="text-xs text-gray-600">Owner: Alex Park • Due: Dec 2</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-orange-600">$195K</div>
                  <div className="text-xs text-orange-600">Usage declining</div>
                </div>
              </div>
              <p className="text-xs text-gray-700">Team turnover, lower engagement</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-red-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">Total At-Risk:</span>
              <span className="text-lg font-bold text-red-600">$925K</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">7.2% of total Q4 pipeline</p>
          </div>
        </div>
      </div>

      {/* Most Impactful Initiatives */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Most Impactful Next Steps & Initiatives</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-900 mb-3">High-Impact Actions (Next 30 Days)</h4>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">GlobalTech Retention Blitz</span>
                  <span className="text-sm font-bold text-green-600">+$450K</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">Executive engagement, value demonstration, competitive analysis</p>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600">Owner: Michael + Leadership</span>
                  <span className="text-gray-500">Due: Oct 10</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Enterprise Expansion Push</span>
                  <span className="text-sm font-bold text-green-600">+$340K</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">Target 8 enterprise accounts for seat/feature expansion</p>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600">Owner: Sarah + Emma</span>
                  <span className="text-gray-500">Due: Oct 31</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Alex Park Support Initiative</span>
                  <span className="text-sm font-bold text-blue-600">+$180K</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">Dedicated coaching, account review, deal support</p>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600">Owner: Sarah (mentor)</span>
                  <span className="text-gray-500">Ongoing</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-blue-900 mb-3">Strategic Initiatives (Q4 Focus)</h4>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Multi-Year Deal Campaign</span>
                  <span className="text-sm font-bold text-purple-600">+$280K</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">Convert 12 renewals to 2-3 year commitments with discounts</p>
                <div className="text-xs text-purple-600">🎯 Target: 70% success rate</div>
              </div>

              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">New Product Cross-Sell</span>
                  <span className="text-sm font-bold text-purple-600">+$150K</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">AI Analytics module launch to existing customers</p>
                <div className="text-xs text-purple-600">🎯 Target: 25% attach rate</div>
              </div>

              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Customer Health Optimization</span>
                  <span className="text-sm font-bold text-green-600">+$95K</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">Proactive outreach to at-risk accounts before renewal</p>
                <div className="text-xs text-green-600">🎯 Target: Reduce churn by 2%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Total Initiative Impact</h4>
              <p className="text-sm text-gray-600">If executed successfully</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">+$1.5M</div>
              <div className="text-sm text-green-600">Would exceed Q4 target by 10%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Key Risk Factors</h4>
          <ul className="space-y-1 text-gray-600">
            <li>• Economic uncertainty impact</li>
            <li>• Competitor pricing pressure</li>
            <li>• Team capacity constraints</li>
            <li>• Holiday season timing</li>
          </ul>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Success Dependencies</h4>
          <ul className="space-y-1 text-gray-600">
            <li>• Executive support for at-risk accounts</li>
            <li>• Product roadmap alignment</li>
            <li>• Competitive intelligence</li>
            <li>• Team skill development</li>
          </ul>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Monthly Milestones</h4>
          <ul className="space-y-1 text-gray-600">
            <li>• Oct: $3.8M in renewals</li>
            <li>• Nov: $4.2M in renewals</li>
            <li>• Dec: $4.8M in renewals</li>
            <li>• Total: $12.8M target</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Q4ManagerForecast;