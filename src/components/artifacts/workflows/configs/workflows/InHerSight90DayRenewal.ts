/**
 * InHerSight 90-Day Renewal Workflow
 *
 * Tailored for InHerSight customer success workflows with brand exposure metrics
 * and employer branding KPIs
 *
 * Based on Grace's 90-day renewal workflow:
 * - Pull performance data
 * - Review contract terms
 * - Identify expansion opportunities
 * - Prepare meeting slide deck
 * - Email team to get meeting on the books
 * - Meet with team
 * - Put together recommendation based on feedback
 * - Send follow-up email
 * - Negotiate
 */

import { WorkflowConfig } from '../../config/WorkflowConfig';
import {
  createEmailArtifact,
  createContractArtifact,
  createPlanningChecklistArtifact,
  createWorkflowSummaryArtifact,
  createPricingAnalysisArtifact,
  createDocumentArtifact
} from '../../config/artifactTemplates';
import {
  createSnoozeSkipBranches,
  createNotReadyConcernBranches,
  createNextCustomerBranch,
  createExitTaskModeBranch,
} from '../../config/branchTemplates';

export const inhersight90DayRenewalWorkflow: WorkflowConfig = {
  customer: {
    name: '{{customer.name}}',
    nextCustomer: '{{nextCustomer.name}}'
  },
  layout: {
    modalDimensions: { width: 85, height: 85, top: 7, left: 7 },
    dividerPosition: 50,
    chatWidth: 50,
    splitModeDefault: false
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: '{{customer.current_arr}}',
        trend: '{{customer.arr_trend}}',
        trendValue: '{{customer.arr_trend_value}}',
        status: '{{customer.arr_status}}'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: '{{customer.renewal_date}}',
        sublabel: '{{customer.days_to_renewal}} days',
        status: '{{customer.renewal_status}}'
      },
      healthScore: {
        label: 'IHS Score',
        value: '{{customer.health_score}}/100',
        status: '{{customer.health_status}}',
        sublabel: 'Platform health'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: '{{customer.primary_contact_name}}',
        role: '{{customer.primary_contact_title}}'
      },
      brandImpressions: {
        label: 'Brand Impressions',
        value: '{{customer.brand_impressions}}',
        trend: '{{customer.impressions_trend}}',
        sublabel: 'Last 30 days',
        status: '{{customer.impressions_status}}'
      },
      profileViews: {
        label: 'Profile Views',
        value: '{{customer.profile_views}}',
        trend: '{{customer.views_trend}}',
        sublabel: 'Last 30 days',
        status: '{{customer.views_status}}'
      },
      applyClicks: {
        label: 'Apply Clicks',
        value: '{{customer.apply_clicks}}',
        trend: '{{customer.clicks_trend}}',
        sublabel: 'Conversion rate',
        status: '{{customer.clicks_status}}'
      },
      profileCompletion: {
        label: 'Profile Complete',
        value: '{{customer.profile_completion_pct}}%',
        status: '{{customer.profile_status}}',
        sublabel: 'Optimization score'
      }
    }
  },
  analytics: {
    engagementTrend: '{{chart.engagement.trend}}',
    brandExposure: '{{chart.brandExposure.monthly}}',
    renewalInsights: {
      renewalStage: '{{renewal.current_stage}}',
      confidence: '{{renewal.probability}}',
      recommendedAction: '{{renewal.recommended_action}}',
      keyReasons: '{{renewal.key_factors}}'
    }
  },
  sidePanel: {
    enabled: true,
    title: {
      text: "90-Day Renewal Planning",
      subtitle: "{{customer.name}} - InHerSight Workflow",
      icon: "📋"
    },
    steps: [
      {
        id: "review-performance",
        title: "Review Performance Data",
        description: "Pull and analyze InHerSight metrics",
        status: 'pending' as const,
        workflowBranch: "performance-review",
        icon: "📊"
      },
      {
        id: "review-contract",
        title: "Review Contract Terms",
        description: "Analyze current package and terms",
        status: 'pending' as const,
        workflowBranch: "contract-review",
        icon: "📋"
      },
      {
        id: "identify-opportunities",
        title: "Identify Opportunities",
        description: "Spot expansion and optimization potential",
        status: 'pending' as const,
        workflowBranch: "opportunity-analysis",
        icon: "💡"
      },
      {
        id: "prepare-meeting",
        title: "Prepare Meeting Deck",
        description: "Create performance review presentation",
        status: 'pending' as const,
        workflowBranch: "meeting-prep",
        icon: "📑"
      },
      {
        id: "schedule-meeting",
        title: "Schedule Meeting",
        description: "Email team to get meeting on the books",
        status: 'pending' as const,
        workflowBranch: "schedule-meeting",
        icon: "📅"
      },
      {
        id: "conduct-meeting",
        title: "Conduct Meeting",
        description: "Meet with team, gather feedback",
        status: 'pending' as const,
        workflowBranch: "meeting-notes",
        icon: "🤝"
      },
      {
        id: "create-recommendation",
        title: "Create Recommendation",
        description: "Put together renewal recommendation",
        status: 'pending' as const,
        workflowBranch: "recommendation",
        icon: "✍️"
      },
      {
        id: "send-followup",
        title: "Send Follow-up",
        description: "Email recommendation and next steps",
        status: 'pending' as const,
        workflowBranch: "followup-email",
        icon: "📧"
      },
      {
        id: "negotiate",
        title: "Negotiate",
        description: "Work through terms and finalize",
        status: 'pending' as const,
        workflowBranch: "negotiation",
        icon: "🤝"
      }
    ],
    progressMeter: {
      currentStep: 1,
      totalSteps: 9,
      progressPercentage: 0,
      showPercentage: true,
      showStepNumbers: true
    },
    showSteps: true,
    showProgressMeter: true
  },
  chat: {
    placeholder: 'Ask about performance metrics, contract terms, or next steps...',
    aiGreeting: "Hi! Let's plan the renewal for {{customer.name}}.",
    mode: 'dynamic',
    features: {
      attachments: false,
      voiceRecording: false,
      designMode: false,
      editMode: false,
      artifactsToggle: true
    },
    dynamicFlow: {
      startsWith: 'ai',
      defaultMessage: "I understand you'd like to discuss something else. How can I help with this renewal?",
      initialMessage: {
        text: "Hi {{user.first}}! **{{customer.name}}**'s renewal is **{{customer.days_to_renewal}} days away** ({{customer.renewal_date}}). Time to start the 90-day renewal planning process. This should take about **15-20 minutes**. Ready to begin?",
        buttons: [
          { label: "Start Planning", value: "start", "label-background": "#3b82f6", "label-text": "#ffffff" },
          { label: "Snooze", value: "snooze", "label-background": "#f3f4f6", "label-text": "#374151" },
          { label: "Skip", value: "skip", "label-background": "#f3f4f6", "label-text": "#374151" }
        ],
        nextBranches: {
          'start': 'show-checklist',
          'snooze': 'snooze',
          'skip': 'skip'
        }
      },
      branches: {
        // ============================================
        // STEP 1: REVIEW PERFORMANCE DATA
        // ============================================
        'show-checklist': {
          response: "Perfect! Here's what we'll accomplish in this renewal planning session. Take a look at the checklist.",
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'renewal-checklist',
          stepNumber: 1
        },

        'performance-review': {
          response: "Great! Let me pull up {{customer.name}}'s performance data from InHerSight...",
          delay: 2,
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'brand-exposure-report',
          stepNumber: 1,
          buttons: [
            {
              label: 'Performance looks good',
              value: 'performance-good',
              'label-background': 'bg-green-100',
              'label-text': 'text-green-800'
            },
            {
              label: 'See concerning trends',
              value: 'performance-concerns',
              'label-background': 'bg-yellow-100',
              'label-text': 'text-yellow-800'
            },
            {
              label: 'Review contract next',
              value: 'contract-review',
              'label-background': 'bg-blue-100',
              'label-text': 'text-blue-800'
            }
          ],
          nextBranches: {
            'performance-good': 'performance-positive',
            'performance-concerns': 'performance-negative',
            'contract-review': 'contract-review'
          }
        },

        'performance-positive': {
          response: "Excellent! Their metrics show strong engagement:\n\n• **Brand Impressions**: {{customer.brand_impressions}} ({{customer.impressions_trend}})\n• **Profile Views**: {{customer.profile_views}} ({{customer.views_trend}})\n• **Apply Clicks**: {{customer.apply_clicks}} ({{customer.clicks_trend}})\n\nThis gives us a strong foundation for renewal and potential expansion. Ready to review the contract?",
          buttons: [
            { label: 'Review contract', value: 'contract-review' },
            { label: 'Identify expansion opportunities', value: 'opportunity-analysis' }
          ],
          nextBranches: {
            'contract-review': 'contract-review',
            'opportunity-analysis': 'opportunity-analysis'
          }
        },

        'performance-negative': {
          response: "I see some areas of concern:\n\n{{customer.performance_concerns}}\n\nWe'll need to address these in our renewal strategy. Let's review the contract terms to understand our options.",
          buttons: [
            { label: 'Review contract', value: 'contract-review' },
            { label: 'Draft improvement plan', value: 'improvement-plan' }
          ],
          nextBranches: {
            'contract-review': 'contract-review',
            'improvement-plan': 'create-improvement-plan'
          }
        },

        // ============================================
        // STEP 2: REVIEW CONTRACT TERMS
        // ============================================
        'contract-review': {
          response: "Let me pull up the contract details for {{customer.name}}...",
          delay: 1,
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'contract-details',
          stepNumber: 2,
          buttons: [
            {
              label: 'Contract looks standard',
              value: 'contract-standard',
              'label-background': 'bg-gray-100',
              'label-text': 'text-gray-800'
            },
            {
              label: 'See expansion opportunity',
              value: 'opportunity-analysis',
              'label-background': 'bg-green-100',
              'label-text': 'text-green-800'
            },
            {
              label: 'Continue to meeting prep',
              value: 'meeting-prep',
              'label-background': 'bg-blue-100',
              'label-text': 'text-blue-800'
            }
          ],
          nextBranches: {
            'contract-standard': 'contract-standard-response',
            'opportunity-analysis': 'opportunity-analysis',
            'meeting-prep': 'meeting-prep'
          }
        },

        'contract-standard-response': {
          response: "Good to know the contract terms are straightforward. Current package:\n\n• **Products**: {{customer.product_mix}}\n• **Annual Cost**: {{customer.current_arr}}\n• **Term**: {{customer.contract_term_months}} months\n• **Auto-renewal**: {{customer.auto_renewal}}\n\nShall we identify any expansion opportunities?",
          buttons: [
            { label: 'Yes, look for opportunities', value: 'opportunity-analysis' },
            { label: 'Skip to meeting prep', value: 'meeting-prep' }
          ]
        },

        // ============================================
        // STEP 3: IDENTIFY OPPORTUNITIES
        // ============================================
        'opportunity-analysis': {
          response: "Let me analyze potential expansion opportunities based on their usage patterns and performance...",
          delay: 2,
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'opportunity-analysis',
          stepNumber: 3,
          buttons: [
            {
              label: 'Strong expansion case',
              value: 'expansion-yes',
              'label-background': 'bg-green-100',
              'label-text': 'text-green-800'
            },
            {
              label: 'Focus on retention',
              value: 'retention-focus',
              'label-background': 'bg-yellow-100',
              'label-text': 'text-yellow-800'
            },
            {
              label: 'Prepare meeting materials',
              value: 'meeting-prep',
              'label-background': 'bg-blue-100',
              'label-text': 'text-blue-800'
            }
          ],
          nextBranches: {
            'expansion-yes': 'expansion-strategy',
            'retention-focus': 'retention-strategy',
            'meeting-prep': 'meeting-prep'
          }
        },

        'expansion-strategy': {
          response: "Great! I've identified several expansion opportunities:\n\n{{customer.expansion_opportunities}}\n\nI recommend proposing a {{customer.recommended_expansion_pct}}% increase in investment. Ready to prepare the meeting deck?",
          buttons: [
            { label: 'Prepare meeting deck', value: 'meeting-prep' },
            { label: 'Adjust expansion strategy', value: 'opportunity-analysis' }
          ]
        },

        'retention-strategy': {
          response: "Given the current performance, let's focus on retention and value demonstration:\n\n{{customer.retention_focus_areas}}\n\nReady to prepare meeting materials that highlight ROI and address concerns?",
          buttons: [
            { label: 'Prepare meeting deck', value: 'meeting-prep' }
          ]
        },

        // ============================================
        // STEP 4: PREPARE MEETING DECK
        // ============================================
        'meeting-prep': {
          response: "Let me prepare a performance review deck for your meeting with {{customer.name}}...",
          delay: 3,
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'meeting-deck',
          stepNumber: 4,
          buttons: [
            {
              label: 'Deck looks good',
              value: 'deck-approved',
              'label-background': 'bg-green-100',
              'label-text': 'text-green-800'
            },
            {
              label: 'Need revisions',
              value: 'deck-revise',
              'label-background': 'bg-yellow-100',
              'label-text': 'text-yellow-800'
            }
          ],
          nextBranches: {
            'deck-approved': 'schedule-meeting',
            'deck-revise': 'deck-revision'
          }
        },

        'deck-revision': {
          response: "No problem! What would you like to adjust in the deck?",
          buttons: [
            { label: 'Add more metrics', value: 'add-metrics' },
            { label: 'Emphasize expansion', value: 'emphasize-expansion' },
            { label: 'Focus on concerns', value: 'focus-concerns' },
            { label: 'Deck is good now', value: 'deck-approved' }
          ]
        },

        'deck-approved': {
          response: "Perfect! The meeting deck is ready. Now let's draft an email to schedule the meeting with the team.",
          buttons: [
            { label: 'Draft email', value: 'schedule-meeting' }
          ]
        },

        // ============================================
        // STEP 5: SCHEDULE MEETING
        // ============================================
        'schedule-meeting': {
          response: "Let me draft a meeting request email for you...",
          delay: 2,
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'meeting-email',
          stepNumber: 5,
          buttons: [
            {
              label: 'Send email',
              value: 'email-send',
              'label-background': 'bg-blue-100',
              'label-text': 'text-blue-800'
            },
            {
              label: 'Edit email',
              value: 'email-edit',
              'label-background': 'bg-gray-100',
              'label-text': 'text-gray-800'
            }
          ],
          nextBranches: {
            'email-send': 'email-sent',
            'email-edit': 'email-editing'
          }
        },

        'email-sent': {
          response: "✅ Email sent to {{customer.primary_contact_name}}!\n\nOnce you've held the meeting and gathered feedback, return here to create your renewal recommendation.\n\nWhat would you like to do next?",
          actions: ['completeStep'],
          stepNumber: 5,
          buttons: [
            { label: 'Mark meeting as complete', value: 'meeting-complete' },
            { label: 'Set reminder for follow-up', value: 'set-reminder' },
            { label: 'Next customer', value: 'next-customer-action' }
          ],
          nextBranches: {
            'meeting-complete': 'meeting-notes',
            'set-reminder': 'create-reminder',
            'next-customer-action': 'next-customer-action'
          }
        },

        // ============================================
        // STEP 6: CONDUCT MEETING (Manual step)
        // ============================================
        'meeting-notes': {
          response: "Great! Let's capture the key takeaways from your meeting with {{customer.name}}.\n\nWhat was the overall sentiment?",
          actions: ['enterStep'],
          stepNumber: 6,
          buttons: [
            {
              label: 'Very positive',
              value: 'sentiment-positive',
              'label-background': 'bg-green-100',
              'label-text': 'text-green-800'
            },
            {
              label: 'Neutral/Mixed',
              value: 'sentiment-neutral',
              'label-background': 'bg-yellow-100',
              'label-text': 'text-yellow-800'
            },
            {
              label: 'Concerns raised',
              value: 'sentiment-negative',
              'label-background': 'bg-red-100',
              'label-text': 'text-red-800'
            }
          ],
          nextBranches: {
            'sentiment-positive': 'recommendation',
            'sentiment-neutral': 'recommendation',
            'sentiment-negative': 'address-concerns'
          }
        },

        'address-concerns': {
          response: "I see. What were their main concerns?",
          // This would capture free-form input, then proceed to recommendation
          buttons: [
            { label: 'Continue to recommendation', value: 'recommendation' }
          ]
        },

        // ============================================
        // STEP 7: CREATE RECOMMENDATION
        // ============================================
        'recommendation': {
          response: "Based on the meeting feedback, let me draft a renewal recommendation one-sheeter...",
          delay: 3,
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'renewal-recommendation',
          stepNumber: 7,
          buttons: [
            {
              label: 'Approve recommendation',
              value: 'recommendation-approved',
              'label-background': 'bg-green-100',
              'label-text': 'text-green-800'
            },
            {
              label: 'Revise recommendation',
              value: 'recommendation-revise',
              'label-background': 'bg-yellow-100',
              'label-text': 'text-yellow-800'
            }
          ],
          nextBranches: {
            'recommendation-approved': 'followup-email',
            'recommendation-revise': 'recommendation-revision'
          }
        },

        'recommendation-approved': {
          response: "Excellent! Your recommendation is ready. Now let's draft the follow-up email to send to the team.",
          buttons: [
            { label: 'Draft follow-up email', value: 'followup-email' }
          ]
        },

        // ============================================
        // STEP 8: SEND FOLLOW-UP
        // ============================================
        'followup-email': {
          response: "Let me draft a professional follow-up email with your recommendation...",
          delay: 2,
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'followup-email',
          stepNumber: 8,
          buttons: [
            {
              label: 'Send follow-up',
              value: 'followup-sent',
              'label-background': 'bg-blue-100',
              'label-text': 'text-blue-800'
            },
            {
              label: 'Edit email',
              value: 'followup-edit',
              'label-background': 'bg-gray-100',
              'label-text': 'text-gray-800'
            }
          ],
          nextBranches: {
            'followup-sent': 'negotiation-prep',
            'followup-edit': 'followup-editing'
          }
        },

        'followup-sent': {
          response: "✅ Follow-up sent!\n\nNow we wait for their response and move into negotiation. I'll prepare negotiation talking points for you.",
          actions: ['completeStep'],
          stepNumber: 8,
          buttons: [
            { label: 'Prepare for negotiation', value: 'negotiation' },
            { label: 'Mark as complete', value: 'workflow-complete' }
          ]
        },

        // ============================================
        // STEP 9: NEGOTIATE
        // ============================================
        'negotiation': {
          response: "Here are your negotiation talking points and pricing flexibility guidelines...",
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'negotiation-guide',
          stepNumber: 9,
          buttons: [
            {
              label: 'Renewal closed',
              value: 'renewal-won',
              'label-background': 'bg-green-100',
              'label-text': 'text-green-800'
            },
            {
              label: 'Still negotiating',
              value: 'negotiating',
              'label-background': 'bg-yellow-100',
              'label-text': 'text-yellow-800'
            },
            {
              label: 'At risk',
              value: 'at-risk',
              'label-background': 'bg-red-100',
              'label-text': 'text-red-800'
            }
          ],
          nextBranches: {
            'renewal-won': 'workflow-complete',
            'negotiating': 'negotiation-support',
            'at-risk': 'escalation'
          }
        },

        'renewal-won': {
          response: "🎉 Congratulations! Renewal successfully closed for {{customer.name}}!\n\nWould you like to see a summary of this workflow?",
          buttons: [
            { label: 'Show summary', value: 'workflow-summary' },
            { label: 'Next customer', value: 'next-customer-action' }
          ]
        },

        'workflow-complete': {
          response: "Great work on {{customer.name}}'s renewal planning! Here's a summary of what we accomplished.",
          actions: ['showArtifact', 'completeStep'],
          artifactId: 'workflow-summary',
          stepNumber: 9,
          buttons: [
            { label: 'Next customer', value: 'next-customer-action' },
            { label: 'Exit', value: 'exit-task-mode' }
          ]
        },

        // Supporting branches
        ...createSnoozeSkipBranches(),
        'exit-task-mode': createExitTaskModeBranch(),
        'next-customer-action': createNextCustomerBranch(),
        ...createNotReadyConcernBranches({
          nextCustomerBranch: 'next-customer-action',
          continueBranch: 'performance-review'
        })
      },
      userTriggers: {
        ".*help.*": "help-flow",
        ".*performance.*|.*metrics.*": "performance-review",
        ".*contract.*": "contract-review",
        ".*opportunity.*|.*expansion.*": "opportunity-analysis",
        ".*meeting.*": "meeting-prep",
        ".*email.*": "schedule-meeting"
      }
    }
  },
  artifacts: {
    sections: [
      // Renewal Checklist
      {
        ...createPlanningChecklistArtifact({
          id: 'renewal-checklist',
          title: '90-Day Renewal Checklist',
          description: "Let's systematically prepare for {{customer.name}}'s renewal:",
          items: [
            { id: 'review-performance', label: 'Review performance data', completed: false },
            { id: 'review-contract', label: 'Review contract terms', completed: false },
            { id: 'identify-opportunities', label: 'Identify expansion opportunities', completed: false },
            { id: 'prepare-meeting', label: 'Prepare meeting deck', completed: false },
            { id: 'schedule-meeting', label: 'Schedule meeting', completed: false },
            { id: 'conduct-meeting', label: 'Conduct meeting', completed: false },
            { id: 'create-recommendation', label: 'Create recommendation', completed: false },
            { id: 'send-followup', label: 'Send follow-up email', completed: false },
            { id: 'negotiate', label: 'Negotiate & close', completed: false }
          ],
          showActions: true,
          visible: false
        })
      },
      // Brand Exposure Report (InHerSight-specific)
      {
        id: 'brand-exposure-report',
        type: 'document' as const,
        title: 'Brand Exposure Report',
        content: `# {{customer.name}} - Brand Performance Report

## Overview
**Reporting Period**: Last 30 days
**Platform Health Score**: {{customer.health_score}}/100

---

## Key Metrics

### Brand Visibility
- **Brand Impressions**: {{customer.brand_impressions}} ({{customer.impressions_trend}})
- **Profile Views**: {{customer.profile_views}} ({{customer.views_trend}})
- **Profile Completion**: {{customer.profile_completion_pct}}%

### Job Posting Performance
- **Job Matches**: {{customer.job_matches}}
- **Apply Clicks**: {{customer.apply_clicks}} ({{customer.clicks_trend}})
- **Click-Through Rate**: {{customer.apply_click_rate}}%

### Content & Engagement
- **Article Inclusions**: {{customer.article_inclusions}}
- **Social Mentions**: {{customer.social_mentions}}
- **New Ratings Received**: {{customer.new_ratings}}
- **Follower Growth**: {{customer.follower_growth}}

---

## Performance Analysis

{{customer.performance_analysis}}

### Strengths
{{customer.performance_strengths}}

### Areas for Improvement
{{customer.performance_improvements}}

---

## Recommendations

{{customer.performance_recommendations}}
`,
        editable: false,
        visible: false
      },
      // Contract Details
      {
        ...createContractArtifact({
          id: 'contract-details',
          title: 'Contract Review',
          contractId: '{{contract.contract_number}}',
          customerName: '{{customer.name}}',
          contractValue: '{{contract.arr}}',
          renewalDate: '{{contract.end_date}}',
          signerBaseAmount: '{{contract.arr}}',
          pricingCalculation: {
            basePrice: '{{contract.base_price}}',
            volumeDiscount: 0,
            additionalServices: 0,
            totalPrice: '{{contract.arr}}'
          },
          businessTerms: {
            unsigned: [],
            nonStandardRenewal: '{{contract.renewal_terms}}',
            nonStandardPricing: '{{contract.pricing_terms}}',
            pricingCaps: [],
            otherTerms: '{{contract.other_terms}}'
          },
          riskLevel: '{{contract.risk_level}}',
          lastUpdated: '{{contract.updated_at}}',
          visible: false
        })
      },
      // Opportunity Analysis
      {
        ...createPricingAnalysisArtifact({
          id: 'opportunity-analysis',
          title: 'Expansion Opportunity Analysis',
          currentPrice: '{{customer.current_arr}}',
          recommendedPrice: '{{customer.recommended_arr}}',
          reasoning: '{{customer.expansion_reasoning}}',
          visible: false
        })
      },
      // Meeting Deck
      {
        ...createDocumentArtifact({
          id: 'meeting-deck',
          title: 'Performance Review Deck',
          content: '{{customer.meeting_deck_content}}',
          editable: true,
          visible: false
        })
      },
      // Meeting Request Email
      {
        ...createEmailArtifact({
          id: 'meeting-email',
          title: 'Meeting Request',
          to: '{{customer.primary_contact_email}}',
          subject: '{{customer.name}} - Quarterly Performance Review',
          body: `Hi {{customer.primary_contact_name}},

I hope you're doing well! I wanted to reach out to schedule our quarterly performance review for {{customer.name}}.

I've been analyzing your InHerSight metrics, and I'm excited to share some insights about your brand's performance on the platform:

• Brand impressions have {{customer.impressions_summary}}
• Profile engagement is {{customer.engagement_summary}}
• Job application activity shows {{customer.application_summary}}

I'd love to walk through these results with you and discuss how we can optimize your strategy for the upcoming quarter.

Would you be available for a 30-minute call sometime next week? I'm flexible on timing and happy to work around your schedule.

Looking forward to connecting!

Best regards,
{{user.first}}`,
          editable: true,
          visible: false
        })
      },
      // Renewal Recommendation
      {
        ...createDocumentArtifact({
          id: 'renewal-recommendation',
          title: 'Renewal Recommendation',
          content: '{{customer.renewal_recommendation_content}}',
          editable: true,
          visible: false
        })
      },
      // Follow-up Email
      {
        ...createEmailArtifact({
          id: 'followup-email',
          title: 'Follow-up Email',
          to: '{{customer.primary_contact_email}}',
          subject: '{{customer.name}} - Renewal Recommendation & Next Steps',
          body: '{{customer.followup_email_content}}',
          editable: true,
          visible: false
        })
      },
      // Negotiation Guide
      {
        ...createDocumentArtifact({
          id: 'negotiation-guide',
          title: 'Negotiation Guide',
          content: '{{customer.negotiation_guide_content}}',
          editable: false,
          visible: false
        })
      },
      // Workflow Summary
      {
        ...createWorkflowSummaryArtifact({
          id: 'workflow-summary',
          title: 'Renewal Workflow Summary',
          customerName: '{{customer.name}}',
          currentStage: '{{renewal.current_stage}}',
          progressPercentage: 100,
          completedActions: '{{workflow.completed_actions}}',
          pendingActions: '{{workflow.pending_actions}}',
          nextSteps: '{{workflow.next_steps}}',
          keyMetrics: {
            currentARR: '{{customer.current_arr}}',
            projectedARR: '{{customer.projected_arr}}',
            healthScore: '{{customer.health_score}}/100',
            renewalDate: '{{customer.renewal_date}}'
          },
          recommendations: '{{workflow.recommendations}}',
          visible: false
        })
      }
    ]
  }
};
