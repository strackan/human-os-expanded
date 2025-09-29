"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CurrencyDollarIcon, HandRaisedIcon } from '@heroicons/react/24/outline';
import SampleTaskCards from './SampleTaskCards';

const RotatingTaskCards: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Sample tasks data (same as in SampleTaskCards)
  const sampleTasks = [
    {
      id: '1',
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
    },
    {
      id: '2',
      customerName: 'TechStart Solutions',
      renewalDate: 'Jan 8, 2025',
      daysUntilRenewal: 22,
      currentARR: '$180,000',
      healthScore: 65,
      healthStatus: 'warning' as const,
      riskLevel: 'high' as const,
      stage: 'Outreach',
      pricingRecommendation: {
        currentPrice: '$180,000',
        recommendedPrice: '$180,000',
        priceChange: 'flat' as const,
        priceChangePercent: 0,
        confidence: 'medium' as const,
        confidenceScore: 65,
        rationale: 'Maintain current pricing due to usage decline and budget constraints'
      },
      keyInsights: [
        'Usage declined 25% in last quarter',
        'New executive sponsor (previous left company)',
        '5 unresolved support tickets',
        'Budget constraints mentioned in last call'
      ],
      recommendedSteps: [
        'Schedule urgent meeting with new sponsor',
        'Address pending support tickets',
        'Prepare value demonstration materials',
        'Develop risk mitigation plan'
      ],
      nextAction: {
        title: 'Urgent: Executive Sponsor Meeting',
        description: 'Critical meeting needed with Sarah Williams (new CTO) to address concerns and demonstrate value.',
        buttonText: 'Schedule Urgent Meeting',
        urgency: 'critical' as const
      },
      rationale: 'Customer at high risk due to usage decline, new sponsor, and budget concerns. Immediate executive engagement required.'
    },
    {
      id: '3',
      customerName: 'Global Manufacturing Inc.',
      renewalDate: 'Feb 28, 2025',
      daysUntilRenewal: 85,
      currentARR: '$750,000',
      healthScore: 88,
      healthStatus: 'good' as const,
      riskLevel: 'medium' as const,
      stage: 'Planning',
      pricingRecommendation: {
        currentPrice: '$750,000',
        recommendedPrice: '$787,500',
        priceChange: 'increase' as const,
        priceChangePercent: 5,
        confidence: 'medium' as const,
        confidenceScore: 70,
        rationale: 'Moderate increase recommended despite competitor activity'
      },
      keyInsights: [
        'Consistent usage at 85%',
        'Executive sponsor engaged but cautious',
        '2 minor support tickets resolved',
        'Competitor activity detected'
      ],
      recommendedSteps: [
        'Conduct competitive analysis',
        'Prepare value proposition refresh',
        'Schedule strategic planning session',
        'Develop retention strategy'
      ],
      nextAction: {
        title: 'Competitive Analysis & Strategy',
        description: 'Research competitor activity and prepare enhanced value proposition to secure renewal.',
        buttonText: 'Start Analysis',
        urgency: 'high' as const
      },
      rationale: 'Competitor activity detected requires proactive strategy to maintain customer loyalty and secure renewal.'
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % sampleTasks.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, sampleTasks.length]);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? sampleTasks.length - 1 : prevIndex - 1
    );
    setIsAutoPlaying(false);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % sampleTasks.length);
    setIsAutoPlaying(false);
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
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

  const currentTask = sampleTasks[currentIndex];

  return (
    <div className="py-16 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-200"
            tabIndex={0}
            aria-label="Previous task card"
          >
            <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-200"
            tabIndex={0}
            aria-label="Next task card"
          >
            <ChevronRightIcon className="h-6 w-6 text-gray-600" />
          </button>

          {/* Card Container */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{currentTask.customerName}</h3>
                    <p className="text-sm text-gray-600">AI-Generated Renewal Task</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getHealthColor(currentTask.healthStatus)}`}>
                      Health: {currentTask.healthScore}/100
                    </span>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getRiskColor(currentTask.riskLevel)}`}>
                      Risk: {currentTask.riskLevel}
                    </span>
                  </div>
                </div>
              </div>

                             {/* Content Grid */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                 {/* Left Column - Metrics, Pricing, and Insights */}
                 <div className="space-y-6">
                   {/* Key Metrics */}
                   <div className="bg-gray-50 rounded-xl p-6">
                     <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h4>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="text-center">
                         <div className="text-2xl font-bold text-gray-900">{currentTask.renewalDate}</div>
                         <div className="text-sm text-gray-600">{currentTask.daysUntilRenewal} days until renewal</div>
                       </div>
                       <div className="text-center">
                         <div className="text-2xl font-bold text-gray-900">{currentTask.currentARR}</div>
                         <div className="text-sm text-gray-600">Current ARR</div>
                       </div>
                     </div>
                   </div>

                   {/* Pricing Recommendation */}
                   <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                     <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                       <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                       Pricing Recommendation
                     </h4>
                     <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center space-x-3">
                         <div className="text-center">
                           <div className="text-xs text-gray-500">Current</div>
                           <div className="text-sm font-semibold text-gray-900">{currentTask.pricingRecommendation.currentPrice}</div>
                         </div>
                         <div className="text-gray-400">→</div>
                         <div className="text-center">
                           <div className="text-xs text-gray-500">Recommended</div>
                           <div className="text-sm font-semibold text-gray-900">{currentTask.pricingRecommendation.recommendedPrice}</div>
                         </div>
                       </div>
                       <div className="text-right">
                         <div className={`text-lg font-bold ${getPriceChangeColor(currentTask.pricingRecommendation.priceChange)}`}>
                           {getPriceChangeIcon(currentTask.pricingRecommendation.priceChange)} {currentTask.pricingRecommendation.priceChangePercent}%
                         </div>
                         <div className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceColor(currentTask.pricingRecommendation.confidence)}`}>
                           {currentTask.pricingRecommendation.confidenceScore}% confidence
                         </div>
                       </div>
                     </div>
                     <p className="text-xs text-gray-600 italic">{currentTask.pricingRecommendation.rationale}</p>
                   </div>

                   {/* Key Insights */}
                   <div>
                     <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h4>
                     <div className="space-y-3">
                       {currentTask.keyInsights.map((insight, index) => (
                         <div key={index} className="flex items-start">
                           <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                           <p className="text-gray-700">{insight}</p>
                         </div>
                       ))}
                     </div>
                   </div>

                   {/* Recommended Steps */}
                   <div className="bg-green-50 rounded-xl p-6">
                     <h4 className="text-lg font-semibold text-gray-900 mb-4">Recommended Steps</h4>
                     <div className="space-y-3">
                       {currentTask.recommendedSteps.map((step, index) => (
                         <div key={index} className="flex items-start">
                           <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                           <p className="text-gray-700">{step}</p>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>

                 {/* Right Column - Recommended Action and Chat */}
                 <div className="space-y-6">
                   {/* Recommended Action */}
                   <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                     <h4 className="text-lg font-semibold text-green-800 mb-4">Recommended Action:</h4>
                     <button 
                       className={`w-full ${getUrgencyColor(currentTask.nextAction.urgency)} text-white px-6 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 flex items-center justify-center`}
                       tabIndex={0}
                       aria-label={`${currentTask.nextAction.buttonText} for ${currentTask.customerName}`}
                     >
                       <HandRaisedIcon className="h-5 w-5 mr-2" />
                       {currentTask.nextAction.buttonText}
                     </button>
                   </div>

                   {/* Chat Interface */}
                   <div className="bg-white rounded-xl border border-gray-200 p-6">
                     <p className="text-sm text-gray-700 mb-4">
                       Please review the information to the left and feel free to ask any questions about this account.
                     </p>
                     
                     {/* Chat Messages Area */}
                     <div className="bg-gray-50 rounded-lg p-4 mb-4 min-h-[120px] flex items-center justify-center">
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

                   {/* Rationale */}
                   <div className="bg-gray-50 rounded-xl p-6">
                     <h4 className="text-lg font-semibold text-gray-900 mb-4">Why This Alert Was Generated</h4>
                     <p className="text-gray-700 italic">{currentTask.rationale}</p>
                   </div>
                 </div>
               </div>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 space-x-2">
            {sampleTasks.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                }`}
                tabIndex={0}
                aria-label={`Go to task card ${index + 1}`}
              />
            ))}
          </div>

          {/* Auto-play indicator */}
          <div className="text-center mt-4">
            <span className="text-sm text-gray-500">
              {isAutoPlaying ? 'Auto-playing' : 'Paused'} • {currentIndex + 1} of {sampleTasks.length}
            </span>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-200">
            See All Task Cards
          </button>
        </div>
      </div>
    </div>
  );
};

export default RotatingTaskCards;
