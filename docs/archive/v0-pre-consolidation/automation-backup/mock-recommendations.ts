/**
 * Mock Recommendations for UI Development & Testing
 *
 * This file provides hardcoded recommendations to develop and test the
 * task/snooze UI before LLM integration is complete.
 *
 * Once LLM integration is done (future milestone), this will be replaced
 * by dynamic recommendation-engine.js generation.
 */

import type { Recommendation, RecommendationCategory, RecommendationSubcategory } from './recommendation-types';

/**
 * Mock recommendations by workflow stage
 */
export const MOCK_RECOMMENDATIONS: Record<string, Recommendation[]> = {
  /**
   * MONITOR WORKFLOW (180+ days)
   * Focus: Feature adoption, relationship building, early value documentation
   */
  'monitor': [
    {
      id: 'rec_analytics_adoption',
      workflowId: 'monitor-renewal',
      customerId: 'customer_acme',
      category: 'FEATURE_ADOPTION' as RecommendationCategory,
      subcategory: 'underutilized_feature' as RecommendationSubcategory,
      title: 'Highlight Advanced Analytics Module',
      description: 'Customer is paying for Advanced Analytics but only using basic reporting features. Significant opportunity to demonstrate value and increase engagement.',
      rationale: 'Usage data shows the team spends 12 hours per month creating manual reports. Advanced Analytics could automate 80% of this work, saving ~10 hours monthly.',
      dataPoints: [
        {
          label: 'Manual Reporting Time',
          value: '12 hrs/month',
          context: 'Time spent on manual report creation',
          source: 'data.usage.reportingTime'
        },
        {
          label: 'Advanced Analytics Adoption',
          value: '5%',
          context: 'Only basic features being used',
          source: 'data.usage.featureAdoption.advancedAnalytics'
        },
        {
          label: 'Potential Time Savings',
          value: '10 hrs/month',
          context: 'Based on similar customer usage patterns',
          source: 'intelligence.benchmarks.timeSavings'
        }
      ],
      priorityScore: 75,
      impact: 'high',
      urgency: 'medium',
      suggestedActions: ['send_email', 'schedule_meeting', 'skip', 'snooze'],
      createdAt: new Date(),
      status: 'pending'
    },

    {
      id: 'rec_ceo_promotion',
      workflowId: 'monitor-renewal',
      customerId: 'customer_acme',
      category: 'EXECUTIVE_ENGAGEMENT' as RecommendationCategory,
      subcategory: 'personal_touchpoint' as RecommendationSubcategory,
      title: 'Congratulate CEO on Recent Promotion',
      description: 'CEO was recently promoted to Chief Operating Officer. Personal touchpoint opportunity to strengthen executive relationship.',
      rationale: 'LinkedIn shows promotion happened 2 weeks ago. Personal congratulations can strengthen relationship before renewal discussions begin.',
      dataPoints: [
        {
          label: 'Promotion Date',
          value: '2 weeks ago',
          context: 'Recent change in leadership',
          source: 'data.engagement.linkedinUpdates'
        },
        {
          label: 'Last Executive Contact',
          value: '45 days ago',
          context: 'Overdue for executive touch-base',
          source: 'data.engagement.lastExecutiveContact'
        }
      ],
      priorityScore: 55,
      impact: 'medium',
      urgency: 'low',
      suggestedActions: ['send_email', 'skip', 'snooze'],
      createdAt: new Date(),
      status: 'pending'
    },

    {
      id: 'rec_usage_increase_doc',
      workflowId: 'monitor-renewal',
      customerId: 'customer_acme',
      category: 'PRICING_STRATEGY' as RecommendationCategory,
      subcategory: 'usage_increase_justification' as RecommendationSubcategory,
      title: 'Document 40% Usage Increase',
      description: 'Platform usage has increased 40% over the past quarter. Document this growth to support potential pricing discussions during renewal.',
      rationale: 'Significant usage growth provides strong justification for pricing adjustments. Documenting now (6 months before renewal) gives time to build case.',
      dataPoints: [
        {
          label: 'Usage Growth',
          value: '+40%',
          context: 'Quarter-over-quarter increase',
          source: 'data.usage.quarterlyGrowth'
        },
        {
          label: 'Active Users',
          value: '127 → 178',
          context: '51 new active users added',
          source: 'data.usage.activeUsers'
        },
        {
          label: 'Data Volume',
          value: '+65%',
          context: 'Storage and processing increased',
          source: 'data.usage.dataVolume'
        }
      ],
      priorityScore: 60,
      impact: 'high',
      urgency: 'low',
      suggestedActions: ['update_crm', 'review_data', 'skip', 'snooze'],
      createdAt: new Date(),
      status: 'pending'
    }
  ],

  /**
   * PREPARE WORKFLOW (120-179 days)
   * Focus: Strategic planning, value documentation, QBR prep
   */
  'prepare': [
    {
      id: 'rec_qbr_planning',
      workflowId: 'prepare-renewal',
      customerId: 'customer_acme',
      category: 'EXECUTIVE_ENGAGEMENT' as RecommendationCategory,
      subcategory: 'qbr_preparation' as RecommendationSubcategory,
      title: 'Schedule Quarterly Business Review',
      description: 'QBR is overdue by 3 weeks. Schedule now to review progress and align on renewal goals.',
      rationale: 'Last QBR was 4 months ago. Regular QBRs improve renewal success rate by 35% according to internal data.',
      dataPoints: [
        {
          label: 'Last QBR',
          value: '4 months ago',
          context: 'Overdue by 3 weeks',
          source: 'data.engagement.lastQBR'
        },
        {
          label: 'QBR Impact',
          value: '+35% renewal rate',
          context: 'Accounts with regular QBRs renew at higher rates',
          source: 'intelligence.benchmarks.qbrImpact'
        }
      ],
      priorityScore: 70,
      impact: 'high',
      urgency: 'medium',
      suggestedActions: ['schedule_meeting', 'send_email', 'skip', 'snooze'],
      createdAt: new Date(),
      status: 'pending'
    },

    {
      id: 'rec_roi_calculation',
      workflowId: 'prepare-renewal',
      customerId: 'customer_acme',
      category: 'PRICING_STRATEGY' as RecommendationCategory,
      subcategory: 'value_realization_documentation' as RecommendationSubcategory,
      title: 'Calculate and Document ROI',
      description: 'Build comprehensive ROI analysis showing time savings and productivity gains for renewal discussion.',
      rationale: 'Strong ROI documentation makes renewal conversations easier and justifies pricing. Current data shows 15% productivity improvement.',
      dataPoints: [
        {
          label: 'Time Savings',
          value: '120 hrs/month',
          context: 'Across all users',
          source: 'data.usage.timeSavings'
        },
        {
          label: 'Productivity Gain',
          value: '+15%',
          context: 'Measured via task completion rates',
          source: 'data.usage.productivityMetrics'
        },
        {
          label: 'Cost Savings',
          value: '$18,000/year',
          context: 'Based on avg hourly rate',
          source: 'intelligence.roiCalculations'
        }
      ],
      priorityScore: 80,
      impact: 'high',
      urgency: 'medium',
      suggestedActions: ['review_data', 'update_crm', 'send_email', 'skip', 'snooze'],
      createdAt: new Date(),
      status: 'pending'
    }
  ],

  /**
   * ENGAGE WORKFLOW (90-119 days)
   * Focus: Renewal kickoff, stakeholder alignment
   */
  'engage': [
    {
      id: 'rec_renewal_kickoff',
      workflowId: 'engage-renewal',
      customerId: 'customer_acme',
      category: 'PROCEDURAL' as RecommendationCategory,
      subcategory: 'renewal_timeline_awareness' as RecommendationSubcategory,
      title: 'Send Renewal Kickoff Email',
      description: 'Initiate renewal conversation with stakeholders. Outline timeline and next steps.',
      rationale: 'Starting renewal conversations 3-4 months out leads to smoother process and higher success rates.',
      dataPoints: [
        {
          label: 'Days Until Renewal',
          value: '95 days',
          context: 'Optimal time to start conversation',
          source: 'workflow.daysUntilRenewal'
        },
        {
          label: 'Renewal Value',
          value: '$125,000 ARR',
          context: 'Contract value at stake',
          source: 'customer.arr'
        }
      ],
      priorityScore: 85,
      impact: 'high',
      urgency: 'high',
      suggestedActions: ['send_email', 'schedule_meeting', 'skip', 'snooze'],
      createdAt: new Date(),
      status: 'pending'
    }
  ],

  /**
   * NEGOTIATE WORKFLOW (60-89 days)
   * Focus: Active negotiation, pricing discussions
   */
  'negotiate': [
    {
      id: 'rec_pricing_proposal',
      workflowId: 'negotiate-renewal',
      customerId: 'customer_acme',
      category: 'PRICING_STRATEGY' as RecommendationCategory,
      subcategory: 'usage_increase_justification' as RecommendationSubcategory,
      title: 'Present Pricing Proposal with Usage Justification',
      description: 'Usage has increased 40% - present pricing adjustment with clear ROI justification.',
      rationale: 'Strong usage growth supports pricing discussion. Data-driven approach increases acceptance rate.',
      dataPoints: [
        {
          label: 'Usage Increase',
          value: '+40%',
          context: 'Significant growth over contract period',
          source: 'data.usage.growth'
        },
        {
          label: 'Recommended Increase',
          value: '12%',
          context: 'Below usage growth rate, fair value',
          source: 'intelligence.pricingRecommendation'
        }
      ],
      priorityScore: 90,
      impact: 'high',
      urgency: 'high',
      suggestedActions: ['send_email', 'schedule_meeting', 'review_data', 'skip', 'snooze'],
      createdAt: new Date(),
      status: 'pending'
    }
  ]
};

/**
 * Helper: Get mock recommendations for a workflow stage
 */
export function getMockRecommendations(workflowId: string): Recommendation[] {
  return MOCK_RECOMMENDATIONS[workflowId] || [];
}

/**
 * Helper: Get a single mock recommendation by ID
 */
export function getMockRecommendation(recommendationId: string): Recommendation | undefined {
  for (const recommendations of Object.values(MOCK_RECOMMENDATIONS)) {
    const found = recommendations.find(r => r.id === recommendationId);
    if (found) return found;
  }
  return undefined;
}

/**
 * Helper: Simulate "skipped" recommendations resurfacing in next workflow
 */
export function getResurfacedRecommendations(
  customerId: string,
  previousWorkflowId: string,
  currentWorkflowId: string
): Recommendation[] {
  // In real implementation, this would check database for skipped recommendations
  // For now, return empty array (no resurfacing in mock mode)
  return [];
}
