import React from 'react';
import { Zap, Users, TrendingUp, Target, Mail, Bell, BarChart3, Layers, Clock, DollarSign } from 'lucide-react';

const AutomatedScaleCampaigns = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-600">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Automated Customer Success at Scale</h2>
            <p className="text-sm text-gray-500">Digital B2C Campaigns • 47,382 active customers • Updated: Real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
          <Zap className="w-4 h-4" />
          Automation Active
        </div>
      </div>

      {/* Scale Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Customers Under Management</div>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">47,382</div>
          <div className="text-xs text-indigo-600">B2C digital subscriptions</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">AI Actions Today</div>
            <Zap className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600 mt-1">2,847</div>
          <div className="text-xs text-green-600">Automated interventions</div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Revenue Protected</div>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">$94K</div>
          <div className="text-xs text-blue-600">This week</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Campaign Success Rate</div>
            <Target className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-1">73.2%</div>
          <div className="text-xs text-purple-600">Avg across all campaigns</div>
        </div>
      </div>

      {/* Active Campaigns */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Active Automated Campaigns</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <h4 className="font-medium text-gray-900">Usage Spike to Upgrade Campaign</h4>
                </div>
                <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Running</div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-gray-600">Targeted:</div>
                  <div className="font-medium">3,247 users</div>
                </div>
                <div>
                  <div className="text-gray-600">Conversion:</div>
                  <div className="font-medium text-green-600">28.4%</div>
                </div>
                <div>
                  <div className="text-gray-600">Revenue:</div>
                  <div className="font-medium">+$47K/mo</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Auto-trigger: Usage &gt;150% of plan limit for 3+ days → Email + in-app upgrade prompt
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-red-500" />
                  <h4 className="font-medium text-gray-900">Churn Prevention Blitz</h4>
                </div>
                <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Running</div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-gray-600">Targeted:</div>
                  <div className="font-medium">1,892 users</div>
                </div>
                <div>
                  <div className="text-gray-600">Saved:</div>
                  <div className="font-medium text-green-600">67.3%</div>
                </div>
                <div>
                  <div className="text-gray-600">Retention:</div>
                  <div className="font-medium">+$31K/mo</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Auto-trigger: No activity 7+ days + billing in 5 days → Multi-channel re-engagement
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <h4 className="font-medium text-gray-900">Feature Adoption Push</h4>
                </div>
                <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Running</div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-gray-600">Targeted:</div>
                  <div className="font-medium">8,234 users</div>
                </div>
                <div>
                  <div className="text-gray-600">Adoption:</div>
                  <div className="font-medium text-blue-600">41.2%</div>
                </div>
                <div>
                  <div className="text-gray-600">Stickiness:</div>
                  <div className="font-medium">+18% retention</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Auto-trigger: 30+ days without using key features → Educational email sequence
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <h4 className="font-medium text-gray-900">Win-Back Campaign</h4>
                </div>
                <div className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">Running</div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-gray-600">Targeted:</div>
                  <div className="font-medium">956 churned</div>
                </div>
                <div>
                  <div className="text-gray-600">Reactivated:</div>
                  <div className="font-medium text-purple-600">12.8%</div>
                </div>
                <div>
                  <div className="text-gray-600">Recovery:</div>
                  <div className="font-medium">+$8K/mo</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Auto-trigger: Churned 30-90 days ago → Special pricing offer + product updates
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-amber-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <h4 className="font-medium text-gray-900">Cross-Sell Automation</h4>
                </div>
                <div className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">Running</div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-gray-600">Targeted:</div>
                  <div className="font-medium">12,847 users</div>
                </div>
                <div>
                  <div className="text-gray-600">Add-on Rate:</div>
                  <div className="font-medium text-amber-600">15.6%</div>
                </div>
                <div>
                  <div className="text-gray-600">Revenue:</div>
                  <div className="font-medium">+$23K/mo</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Auto-trigger: High engagement + specific feature usage → Personalized add-on offers
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-teal-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-500" />
                  <h4 className="font-medium text-gray-900">Annual Plan Conversion</h4>
                </div>
                <div className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded">Running</div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-gray-600">Targeted:</div>
                  <div className="font-medium">5,673 monthly</div>
                </div>
                <div>
                  <div className="text-gray-600">Conversion:</div>
                  <div className="font-medium text-teal-600">22.1%</div>
                </div>
                <div>
                  <div className="text-gray-600">LTV Boost:</div>
                  <div className="font-medium">+$156K</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Auto-trigger: 6+ months tenure + high usage → Annual discount offer (2 months free)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Segmentation */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">AI-Powered Customer Segmentation</h3>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">🟢 Expansion Ready</span>
                <span className="text-lg font-bold text-green-600">8,247</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>High usage, good payment history</span>
                <span>Avg LTV: $840</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">🟡 Stable Users</span>
                <span className="text-lg font-bold text-blue-600">32,156</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Regular usage, consistent payments</span>
                <span>Avg LTV: $520</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">🟠 At Risk</span>
                <span className="text-lg font-bold text-amber-600">4,892</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Declining usage, payment delays</span>
                <span>Churn probability: 34%</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">🔴 High Churn Risk</span>
                <span className="text-lg font-bold text-red-600">2,087</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Minimal usage, recent complaints</span>
                <span>Churn probability: 78%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">Segmentation Refresh:</span>
              <span className="text-sm text-blue-600">Every 6 hours</span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Campaign Performance This Month</h3>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">Total Customers Reached</span>
                <span className="text-lg font-bold text-blue-600">23,847</span>
              </div>
              <div className="text-xs text-gray-600">50.3% of customer base engaged</div>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">Revenue Impact</span>
                <span className="text-lg font-bold text-green-600">+$347K</span>
              </div>
              <div className="text-xs text-gray-600">New MRR from automated campaigns</div>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">Churn Prevention</span>
                <span className="text-lg font-bold text-purple-600">1,456</span>
              </div>
              <div className="text-xs text-gray-600">Customers saved from churning</div>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">Efficiency Gain</span>
                <span className="text-lg font-bold text-indigo-600">97%</span>
              </div>
              <div className="text-xs text-gray-600">Reduction in manual intervention needed</div>
            </div>
          </div>
        </div>
      </div>

      {/* ROI and Scale Benefits */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Scale Advantages and ROI</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-indigo-900 mb-3">Cost Efficiency</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cost per customer:</span>
                <span className="font-medium">$0.43/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">vs Manual CSM:</span>
                <span className="font-medium text-red-600">$47/month</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium text-gray-900">Cost Savings:</span>
                <span className="font-bold text-green-600">109x</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-indigo-900 mb-3">Speed and Scale</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Response time:</span>
                <span className="font-medium">&lt; 2 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Daily capacity:</span>
                <span className="font-medium">Unlimited</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium text-gray-900">Scalability:</span>
                <span className="font-bold text-blue-600">Infinite</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-indigo-900 mb-3">Performance Impact</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Churn reduction:</span>
                <span className="font-medium text-green-600">-23%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expansion rate:</span>
                <span className="font-medium text-green-600">+34%</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium text-gray-900">Net Revenue Retention:</span>
                <span className="font-bold text-green-600">118%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Total Monthly ROI from Automation</h4>
              <p className="text-sm text-gray-600">Revenue impact vs operational costs</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">847%</div>
              <div className="text-sm text-green-600">$347K revenue / $41K costs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Items */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Success Factors</h4>
          <ul className="space-y-1 text-gray-600">
            <li>• Real-time behavioral triggers</li>
            <li>• Multi-channel orchestration</li>
            <li>• Personalized messaging at scale</li>
            <li>• Continuous A/B optimization</li>
          </ul>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Next Optimizations</h4>
          <ul className="space-y-1 text-gray-600">
            <li>• Predictive churn scoring v2.0</li>
            <li>• Dynamic pricing experiments</li>
            <li>• Video engagement triggers</li>
            <li>• Social proof automation</li>
          </ul>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Scale Metrics</h4>
          <ul className="space-y-1 text-gray-600">
            <li>• 47K+ customers managed</li>
            <li>• 2.8K daily AI actions</li>
            <li>• 73% campaign success rate</li>
            <li>• 97% automation efficiency</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AutomatedScaleCampaigns;