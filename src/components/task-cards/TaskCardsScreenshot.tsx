"use client";

import React from 'react';
import { CurrencyDollarIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const TaskCardsScreenshot: React.FC = () => {
  // Sample task data for the screenshot
  const sampleTask = {
    customerName: 'Acme Corporation',
    renewalDate: 'Dec 15, 2024',
    daysUntilRenewal: 45,
    currentARR: '$450,000',
    healthScore: 92,
    healthStatus: 'excellent' as const,
    riskLevel: 'low' as const,
    stage: 'Planning',
    pricingRecommendation: {
      currentPrice: '$450,000',
      recommendedPrice: '$472,500',
      priceChange: 'increase' as const,
      priceChangePercent: 5,
      confidence: 'high' as const,
      confidenceScore: 85,
      rationale: 'Strong usage growth and executive engagement support 5% increase'
    },
    keyInsights: [
      'Usage increased 15% in Q3',
      'Executive sponsor attended last QBR',
      'No open support tickets',
      'Likely to accept 5-7% price increase'
    ],
    recommendedSteps: [
      'Schedule QBR with executive sponsor',
      'Prepare renewal proposal with price increase',
      'Review expansion opportunities',
      'Draft renewal email template'
    ],
    nextAction: {
      title: 'Schedule Executive QBR',
      description: 'Book quarterly business review with Michael Chen (CTO) to discuss renewal and expansion opportunities.',
      buttonText: 'Schedule Meeting',
      urgency: 'medium' as const
    },
    rationale: 'Customer shows strong engagement and growth potential. Early QBR will help secure renewal and identify expansion opportunities.'
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'bg-gray-500 hover:bg-gray-600';
      case 'medium': return 'bg-blue-500 hover:bg-blue-600';
      case 'high': return 'bg-orange-500 hover:bg-orange-600';
      case 'critical': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getPriceChangeColor = (change: string) => {
    switch (change) {
      case 'increase': return 'text-green-600';
      case 'decrease': return 'text-red-600';
      case 'flat': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getPriceChangeIcon = (change: string) => {
    switch (change) {
      case 'increase': return '↗';
      case 'decrease': return '↘';
      case 'flat': return '→';
      default: return '→';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="py-16 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Renewal Management
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Proactive task cards that automatically identify opportunities, assess risk, 
            and recommend the next best actions to maximize customer retention and growth.
          </p>
        </div>

        {/* Screenshot Container */}
        <div className="max-w-6xl mx-auto">
          {/* Browser Frame */}
          <div className="bg-white rounded-t-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Browser Header */}
            <div className="bg-gray-100 px-6 py-3 flex items-center space-x-3 border-b border-gray-200">
              {/* Browser Controls */}
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              {/* Address Bar */}
              <div className="flex-1 bg-white rounded-lg px-4 py-1 mx-4 text-sm text-gray-600">
                app.renubu.ai/dashboard
              </div>
              {/* Browser Icons */}
              <div className="flex space-x-2 text-gray-400">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
              </div>
            </div>

            {/* App Content - Top Half Only */}
            <div className="bg-white">
              {/* App Header with Pricing Recommendation */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{sampleTask.customerName}</h3>
                    <p className="text-sm text-gray-600">AI-Generated Renewal Task</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getHealthColor(sampleTask.healthStatus)}`}>
                      Health: {sampleTask.healthScore}/100
                    </span>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getRiskColor(sampleTask.riskLevel)}`}>
                      Risk: {sampleTask.riskLevel}
                    </span>
                  </div>
                </div>
                
                {/* Pricing Recommendation in Header */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Recommended price increase</span>
                      <span className={`text-lg font-bold ${getPriceChangeColor(sampleTask.pricingRecommendation.priceChange)}`}>
                        {sampleTask.pricingRecommendation.priceChangePercent}%
                      </span>
                      <div className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceColor(sampleTask.pricingRecommendation.confidence)}`}>
                        {sampleTask.pricingRecommendation.confidenceScore}% confidence
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 italic">Strong usage growth in Q3</p>
                        <p className="text-xs text-gray-600 italic">Executive sponsor engaged</p>
                        <p className="text-xs text-gray-600 italic">No open support tickets</p>
                        <button className="text-xs text-blue-600 hover:text-blue-800 underline">
                          see two more
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended Action - Prominent Row */}
              <div className="bg-green-50 px-8 py-6 border-b border-green-200">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-green-800 mb-4">Recommended Action:</h4>
                  <button 
                    className={`inline-flex items-center ${getUrgencyColor(sampleTask.nextAction.urgency)} text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200`}
                    tabIndex={0}
                    aria-label={`${sampleTask.nextAction.buttonText} for ${sampleTask.customerName}`}
                  >
                    <EnvelopeIcon className="h-5 w-5 mr-2" />
                    Deliver Renewal Notice
                  </button>
                </div>
              </div>

              {/* Content Grid - Wider Layout for Landing Page */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-6">
                {/* Left Column - Key Metrics */}
                <div className="space-y-4">
                  {/* Key Metrics */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Key Metrics</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">{sampleTask.renewalDate}</div>
                        <div className="text-xs text-gray-600">{sampleTask.daysUntilRenewal} days until renewal</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">{sampleTask.currentARR}</div>
                        <div className="text-xs text-gray-600">Current ARR</div>
                      </div>
                    </div>
                  </div>

                  {/* Key Insights - Compact */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Key Insights</h4>
                    <div className="space-y-2">
                      {sampleTask.keyInsights.slice(0, 2).map((insight, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                          <p className="text-sm text-gray-700">{insight}</p>
                        </div>
                      ))}
                      <div className="text-gray-500 text-xs italic">+2 more insights...</div>
                    </div>
                  </div>
                </div>

                {/* Middle Column - Chat Interface */}
                <div className="xl:col-span-2">
                  <div className="bg-white rounded-xl border border-gray-200 p-4 h-full">
                    <p className="text-sm text-gray-700 mb-3">
                      Please review the information to the left and feel free to ask any questions about this account.
                    </p>
                    
                    {/* Chat Messages Area */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3 min-h-[100px] flex items-center justify-center">
                      <p className="text-gray-500 text-sm">No questions yet. Ask anything about this account!</p>
                    </div>
                    
                    {/* Chat Input */}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Type your question..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        tabIndex={0}
                        aria-label="Type your question about this account"
                      />
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        tabIndex={0}
                        aria-label="Send question"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fade Out Effect */}
              <div className="h-12 bg-gradient-to-b from-white to-transparent"></div>
            </div>
          </div>

          {/* Bottom Shadow Effect */}
          <div className="h-6 bg-gradient-to-b from-gray-200 to-transparent rounded-b-xl mx-4"></div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-200">
            See Full Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCardsScreenshot;
