"use client";

import React from 'react';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon,
  ArrowRightIcon,
  HandRaisedIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface SampleTaskCard {
  id: string;
  customerName: string;
  renewalDate: string;
  daysUntilRenewal: number;
  currentARR: string;
  healthScore: number;
  healthStatus: 'excellent' | 'good' | 'warning' | 'critical';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  stage: string;
  pricingRecommendation: {
    currentPrice: string;
    recommendedPrice: string;
    priceChange: 'increase' | 'decrease' | 'flat';
    priceChangePercent: number;
    confidence: 'high' | 'medium' | 'low';
    confidenceScore: number;
    rationale: string;
  };
  keyInsights: string[];
  recommendedSteps: string[];
  nextAction: {
    title: string;
    description: string;
    buttonText: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  };
  rationale: string;
  priority: number;
}

const sampleTasks: SampleTaskCard[] = [
  {
    id: '1',
    customerName: 'Acme Corporation',
    renewalDate: 'Dec 15, 2024',
    daysUntilRenewal: 45,
    currentARR: '$450,000',
    healthScore: 92,
    healthStatus: 'excellent',
    riskLevel: 'low',
    stage: 'Planning',
    pricingRecommendation: {
      currentPrice: '$450,000',
      recommendedPrice: '$472,500',
      priceChange: 'increase',
      priceChangePercent: 5,
      confidence: 'high',
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
      urgency: 'medium'
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
    healthStatus: 'warning',
    riskLevel: 'high',
    stage: 'Outreach',
    pricingRecommendation: {
      currentPrice: '$180,000',
      recommendedPrice: '$180,000',
      priceChange: 'flat',
      priceChangePercent: 0,
      confidence: 'medium',
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
      urgency: 'critical'
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
    healthStatus: 'good',
    riskLevel: 'medium',
    stage: 'Planning',
    pricingRecommendation: {
      currentPrice: '$750,000',
      recommendedPrice: '$787,500',
      priceChange: 'increase',
      priceChangePercent: 5,
      confidence: 'medium',
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
      urgency: 'high'
    },
    rationale: 'Competitor activity detected requires proactive strategy to maintain customer loyalty and secure renewal.'
  },
  {
    id: '4',
    customerName: 'CloudForce Systems',
    renewalDate: 'Dec 30, 2024',
    daysUntilRenewal: 12,
    currentARR: '$320,000',
    healthScore: 78,
    healthStatus: 'good',
    riskLevel: 'medium',
    stage: 'Negotiation',
    pricingRecommendation: {
      currentPrice: '$320,000',
      recommendedPrice: '$336,000',
      priceChange: 'increase',
      priceChangePercent: 5,
      confidence: 'low',
      confidenceScore: 45,
      rationale: 'Customer showing resistance to price increases in negotiations'
    },
    keyInsights: [
      'Usage stable at 78%',
      'Renewal discussions in progress',
      'Price increase resistance expected',
      'Feature X usage declined 10%'
    ],
    recommendedSteps: [
      'Finalize renewal terms',
      'Address feature usage concerns',
      'Prepare negotiation fallback options',
      'Schedule final approval call'
    ],
    nextAction: {
      title: 'Finalize Renewal Terms',
      description: 'Complete negotiation and prepare final renewal agreement for customer approval.',
      buttonText: 'Complete Negotiation',
      urgency: 'high'
    },
    rationale: 'Renewal deadline approaching with ongoing negotiations. Need to finalize terms and secure approval.'
  },
  {
    id: '5',
    customerName: 'Innovate Labs',
    renewalDate: 'Mar 15, 2025',
    daysUntilRenewal: 95,
    currentARR: '$95,000',
    healthScore: 95,
    healthStatus: 'excellent',
    riskLevel: 'low',
    stage: 'Planning',
    pricingRecommendation: {
      currentPrice: '$95,000',
      recommendedPrice: '$104,500',
      priceChange: 'increase',
      priceChangePercent: 10,
      confidence: 'high',
      confidenceScore: 90,
      rationale: 'Exceptional growth and strong engagement support aggressive 10% increase'
    },
    keyInsights: [
      'Usage increased 40% in Q4',
      'Strong executive sponsorship',
      'Expansion opportunities identified',
      'Likely to accept 8-10% price increase'
    ],
    recommendedSteps: [
      'Schedule expansion discussion',
      'Prepare growth proposal',
      'Identify upsell opportunities',
      'Plan early renewal strategy'
    ],
    nextAction: {
      title: 'Expansion Opportunity Discussion',
      description: 'Schedule meeting to discuss growth opportunities and early renewal with expansion.',
      buttonText: 'Schedule Growth Meeting',
      urgency: 'low'
    },
    rationale: 'Customer showing exceptional growth and engagement. Opportunity to secure early renewal with expansion.'
  }
];

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

const getUrgencyIcon = (urgency: string) => {
  switch (urgency) {
    case 'low': return ClockIcon;
    case 'medium': return HandRaisedIcon;
    case 'high': return ExclamationTriangleIcon;
    case 'critical': return ExclamationTriangleIcon;
    default: return ClockIcon;
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

const SampleTaskCard: React.FC<{ task: SampleTaskCard }> = ({ task }) => {
  const UrgencyIcon = getUrgencyIcon(task.nextAction.urgency);
  
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{task.customerName}</h3>
            <p className="text-sm text-gray-600">Renewal Management Task</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getHealthColor(task.healthStatus)}`}>
              Health: {task.healthScore}/100
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(task.riskLevel)}`}>
              Risk: {task.riskLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="px-6 py-4 bg-gray-50">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center text-gray-500 mb-1">
              <CalendarIcon className="h-4 w-4 mr-1" />
            </div>
            <div className="text-sm font-medium text-gray-900">{task.renewalDate}</div>
            <div className="text-xs text-gray-500">{task.daysUntilRenewal} days</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-gray-500 mb-1">
              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
            </div>
            <div className="text-sm font-medium text-gray-900">{task.currentARR}</div>
            <div className="text-xs text-gray-500">Current ARR</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-gray-500 mb-1">
              <ChartBarIcon className="h-4 w-4 mr-1" />
            </div>
            <div className="text-sm font-medium text-gray-900">{task.stage}</div>
            <div className="text-xs text-gray-500">Stage</div>
          </div>
        </div>
      </div>

      {/* Pricing Recommendation */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <CurrencyDollarIcon className="h-4 w-4 mr-2" />
          Pricing Recommendation
        </h4>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="text-center">
                <div className="text-xs text-gray-500">Current</div>
                <div className="text-sm font-semibold text-gray-900">{task.pricingRecommendation.currentPrice}</div>
              </div>
              <div className="text-gray-400">→</div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Recommended</div>
                <div className="text-sm font-semibold text-gray-900">{task.pricingRecommendation.recommendedPrice}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${getPriceChangeColor(task.pricingRecommendation.priceChange)}`}>
                {getPriceChangeIcon(task.pricingRecommendation.priceChange)} {task.pricingRecommendation.priceChangePercent}%
              </div>
              <div className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceColor(task.pricingRecommendation.confidence)}`}>
                {task.pricingRecommendation.confidenceScore}% confidence
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600 italic">{task.pricingRecommendation.rationale}</p>
        </div>
      </div>

      {/* Key Insights */}
      <div className="px-6 py-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <UserGroupIcon className="h-4 w-4 mr-2" />
          Key Insights
        </h4>
        <div className="space-y-2">
          {task.keyInsights.map((insight, index) => (
            <div key={index} className="flex items-start">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-700">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Steps */}
      <div className="px-6 py-4 bg-gray-50">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Recommended Steps</h4>
        <div className="space-y-2">
          {task.recommendedSteps.map((step, index) => (
            <div key={index} className="flex items-start">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-700">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Next Action */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <UrgencyIcon className={`h-5 w-5 mr-2 ${
                task.nextAction.urgency === 'critical' ? 'text-red-600' : 
                task.nextAction.urgency === 'high' ? 'text-orange-600' : 
                task.nextAction.urgency === 'medium' ? 'text-blue-600' : 'text-gray-600'
              }`} />
              <h4 className="text-sm font-semibold text-gray-900">{task.nextAction.title}</h4>
            </div>
          </div>
          <p className="text-sm text-gray-700 mb-4">{task.nextAction.description}</p>
          <button 
            className={`w-full ${getUrgencyColor(task.nextAction.urgency)} text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center justify-center`}
            tabIndex={0}
            aria-label={`${task.nextAction.buttonText} for ${task.customerName}`}
          >
            {task.nextAction.buttonText}
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </button>
        </div>
      </div>

      {/* Rationale */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-600 italic">
          <strong>Why this alert was generated:</strong> {task.rationale}
        </p>
      </div>
    </div>
  );
};

const SampleTaskCards: React.FC = () => {
  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Proactive Renewal Management
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            AI-powered task cards that automatically identify renewal opportunities, 
            assess customer health, and recommend the next best actions to maximize retention and growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sampleTasks.map((task) => (
            <SampleTaskCard key={task.id} task={task} />
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 cursor-pointer">
            <span className="text-sm font-medium">View All Tasks</span>
            <ArrowRightIcon className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleTaskCards;
