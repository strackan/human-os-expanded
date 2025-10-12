"use client";

import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Mail, Building2, Users, Activity, DollarSign } from 'lucide-react';

export default function PricingRecommendation() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Customer Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">TechFlow Solutions</h2>
            <p className="text-sm text-gray-500">Current ARR: $84,000 newal: Feb 15, 2025</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          Critical Support Issue
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Usage Score</div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">87</div>
          <div className="text-xs text-green-600">+12% from last quarter</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Engagement</div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">92</div>
          <div className="text-xs text-green-600">+8% from last quarter</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Team Growth</div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">156%</div>
          <div className="text-xs text-green-600">+23 new seats</div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Support Health</div>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 mt-1">34</div>
          <div className="text-xs text-red-600">Critical issue open 12 days</div>
        </div>
      </div>

      {/* AI Recommendation Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#2b136c'}}>
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">AI Pricing Recommendation</h3>
            <p className="text-gray-700 mb-4">
              Based on my analysis, I recommend a <strong>6% price increase</strong> for this customer:
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Opportunities */}
              <div>
                <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Opportunities
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Recent usage patterns show 87% increase in feature adoption</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Similar customer profiles pay 12% more per seat on average</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Recent acquisitions and IT budget increase suggest low price sensitivity</span>
                  </li>
                </ul>
                <button className="text-xs text-blue-600 hover:text-blue-800 mt-2">See More</button>
              </div>
              
              {/* Risks */}
              <div>
                <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Risks
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Critical support issue open for 12 days</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Confidence Score and Next Steps */}
            <div className="grid grid-cols-2 gap-6 mt-4">
              {/* Left Side - Confidence Score + Context */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 text-center">Confidence Threshold</h4>
                <div className="flex items-center justify-end mb-2">
                  <span className="text-lg font-bold text-amber-600">71%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4 relative">
                  <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full"></div>
                  <div 
                    className="absolute transform -translate-x-1/2"
                    style={{
                      top: '-20px',
                      left: '71%',
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
                  Engage with customer to resolve support risk to improve expansion confidence.
                </p>
              </div>

              {/* Right Side - Action Request */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 text-center">Next Steps</h4>
                <p className="text-sm font-normal text-gray-700 mb-4">
                  Shall I draft an outreach email to schedule a meeting with some windows of availability?
                </p>
                <div className="flex justify-between items-center mb-2">
                  <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors">
                    No
                  </button>
                  <div className="flex flex-col items-center">
                    <button 
                      className="px-6 py-3 rounded-lg font-medium text-white transition-colors mb-1" 
                      style={{backgroundColor: '#2b136c'}} 
                      onMouseOver={(e) => e.target.style.backgroundColor = '#1f0d4d'} 
                      onMouseOut={(e) => e.target.style.backgroundColor = '#2b136c'}
                    >
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
              <span>TechFlow Current:</span>
              <span className="font-medium">$1.8/seat/month</span>
            </div>
            <div className="flex justify-between">
              <span>Recommended:</span>
              <span className="font-medium text-blue-600">$1.9/seat/month</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Risk Assessment</h4>
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between">
              <span>Churn Risk:</span>
              <span className="font-medium text-amber-600">Medium</span>
            </div>
            <div className="flex justify-between">
              <span>Expansion Potential:</span>
              <span className="font-medium text-green-600">High</span>
            </div>
            <div className="flex justify-between">
              <span>Price Sensitivity:</span>
              <span className="font-medium text-green-600">Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
