import React from 'react';
import { TrendingUp, Award, Target, Users, DollarSign, Star, Trophy, BarChart3 } from 'lucide-react';

const ExpansionPerformanceDashboard = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-600">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Q1 2025 Expansion Performance</h2>
            <p className="text-sm text-gray-500">YTD Results • Team & Individual Metrics • Updated: Feb 13, 2025</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
          <Trophy className="w-4 h-4" />
          Ahead of Target
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Expansion Revenue</div>
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600 mt-1">$847K</div>
          <div className="text-xs text-green-600">118% of Q1 target</div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Net Revenue Retention</div>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">124%</div>
          <div className="text-xs text-blue-600">+6% vs Q4 2024</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Expansion Rate</div>
            <Target className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-1">31.4%</div>
          <div className="text-xs text-purple-600">of customer base expanded</div>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Avg Expansion Size</div>
            <BarChart3 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">$18.7K</div>
          <div className="text-xs text-amber-600">+12% vs last quarter</div>
        </div>
      </div>

      {/* Team Rankings */}
      <div className="bg-blue-50 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">CSM Team Rankings - Q1 2025</h3>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {/* Individual Performance */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Individual Performance</h4>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-gray-900">Sarah Chen</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">$247K</div>
                    <div className="text-xs text-gray-600">156% of target</div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>12 expansions • $20.6K avg</span>
                  <span className="text-green-600">↑ #1 this quarter</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-gray-900">Michael Rodriguez</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600">$189K</div>
                    <div className="text-xs text-gray-600">119% of target</div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>8 expansions • $23.6K avg</span>
                  <span className="text-blue-600">↑ #2 this quarter</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    <span className="font-medium text-gray-900">Emma Thompson</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-purple-600">$156K</div>
                    <div className="text-xs text-gray-600">104% of target</div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>9 expansions • $17.3K avg</span>
                  <span className="text-purple-600">↑ #3 this quarter</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border-l-4 border-gray-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900">Alex Park</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-600">$142K</div>
                    <div className="text-xs text-gray-600">89% of target</div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>7 expansions • $20.3K avg</span>
                  <span className="text-amber-600">→ #4 this quarter</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Categories */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Performance Categories</h4>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">🏆 Top Performer</span>
                  <span className="text-sm text-green-600">Sarah Chen</span>
                </div>
                <p className="text-xs text-gray-600">Highest total expansion revenue</p>
              </div>

              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">💰 Largest Deal</span>
                  <span className="text-sm text-blue-600">Michael Rodriguez</span>
                </div>
                <p className="text-xs text-gray-600">Single expansion: $47K (DataFlow Corp)</p>
              </div>

              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">📈 Most Improved</span>
                  <span className="text-sm text-purple-600">Emma Thompson</span>
                </div>
                <p className="text-xs text-gray-600">+67% vs Q4 performance</p>
              </div>

              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">🎯 Highest Win Rate</span>
                  <span className="text-sm text-green-600">Sarah Chen</span>
                </div>
                <p className="text-xs text-gray-600">86% expansion proposal success rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expansion Categories Analysis */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Expansion by Category</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Seat Expansion</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">$342K</div>
                <div className="text-xs text-gray-600">40% of total</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Feature Upgrades</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">$298K</div>
                <div className="text-xs text-gray-600">35% of total</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Usage Overages</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">$127K</div>
                <div className="text-xs text-gray-600">15% of total</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Multi-year Commits</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">$80K</div>
                <div className="text-xs text-gray-600">10% of total</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-900">Top Growth Driver:</span>
              <span className="text-sm font-bold text-blue-600">Seat Expansion</span>
            </div>
            <p className="text-xs text-gray-600">Average 2.3x seat growth per expansion event</p>
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Customer Segment Performance</h3>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">Enterprise (500+ employees)</span>
                <span className="text-lg font-bold text-green-600">$389K</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>14 customers expanded</span>
                <span>$27.8K avg expansion</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">Mid-Market (50-500)</span>
                <span className="text-lg font-bold text-blue-600">$298K</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>23 customers expanded</span>
                <span>$13.0K avg expansion</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">SMB (&lt;50 employees)</span>
                <span className="text-lg font-bold text-purple-600">$160K</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>31 customers expanded</span>
                <span>$5.2K avg expansion</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-green-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-900">Highest Success Rate:</span>
              <span className="text-sm font-bold text-green-600">Enterprise (78%)</span>
            </div>
            <p className="text-xs text-gray-600">Enterprise customers 2.1x more likely to expand</p>
          </div>
        </div>
      </div>

      {/* Goals and Targets */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Q1 Goals vs Performance</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900">Expansion Revenue Target</span>
              <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Exceeded</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Target:</span>
                <span className="font-medium">$720K</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Actual:</span>
                <span className="font-medium text-green-600">$847K</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Achievement:</span>
                <span className="font-bold text-green-600">118%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900">Customer Expansion Rate</span>
              <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">On Track</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Target:</span>
                <span className="font-medium">30%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Actual:</span>
                <span className="font-medium text-green-600">31.4%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Achievement:</span>
                <span className="font-bold text-green-600">105%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900">Net Revenue Retention</span>
              <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Exceeded</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Target:</span>
                <span className="font-medium">120%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Actual:</span>
                <span className="font-medium text-blue-600">124%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Achievement:</span>
                <span className="font-bold text-blue-600">103%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Insights */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Key Success Factors</h4>
          <ul className="space-y-1 text-gray-600">
            <li>• Proactive usage monitoring</li>
            <li>• Executive relationship building</li>
            <li>• Value demonstration sessions</li>
            <li>• Strategic timing on renewals</li>
          </ul>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Q2 Focus Areas</h4>
          <ul className="space-y-1 text-gray-600">
            <li>• Increase SMB expansion rate</li>
            <li>• Multi-year commitment push</li>
            <li>• AI feature adoption drive</li>
            <li>• Cross-selling new products</li>
          </ul>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Team Development</h4>
          <ul className="space-y-1 text-gray-600">
            <li>• Alex Park mentoring program</li>
            <li>• Advanced negotiation training</li>
            <li>• Best practices knowledge share</li>
            <li>• Competitive analysis deep dive</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExpansionPerformanceDashboard;