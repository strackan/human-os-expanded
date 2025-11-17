/**
 * InHerSight 120-Day At-Risk Renewal Workflow
 *
 * HIGH PRIORITY - Pain: 10/10, Impact: 10/10
 *
 * Grace's workflow for at-risk customers:
 * - Identify likely areas of concern (primary KPI not met, low engagement, etc.)
 * - Review contract terms
 * - Pull performance data
 * - Prepare a freebie opportunity to proactively share
 * - Prepare meeting slide deck
 * - Email team to get meeting on the books
 * - Meet with team
 * - Follow through with freebie
 * - Gather performance data from freebie
 * - Reach back out to team for renewal meeting
 * - Prepare renewal slide deck
 * - Meet with team
 * - Put together recommendation based on feedback
 * - Send follow-up email
 * - Negotiate
 *
 * Time: 5-6 hours per customer → Target: <2 hours
 */

import { WorkflowConfig } from '../../config/WorkflowConfig';
import {
  createEmailArtifact,
  createContractArtifact,
  createPlanningChecklistArtifact,
  createWorkflowSummaryArtifact,
  createDocumentArtifact,
  createBrandExposureReportArtifact
} from '../../config/artifactTemplates';
import {
  createSnoozeSkipBranches,
  createNotReadyConcernBranches,
  createNextCustomerBranch,
  createExitTaskModeBranch
} from '../../config/branchTemplates';

export const inhersight120DayAtRiskWorkflow: WorkflowConfig = {
  customer: {
    name: '{{customer.name}}',
    nextCustomer: '{{nextCustomer.name}}'
  },
  layout: {
    modalDimensions: { width: 90, height: 90, top: 5, left: 5 },
    dividerPosition: 50,
    chatWidth: 50,
    splitModeDefault: false
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: '{{customer.current_arr}}',
        trend: 'down',
        trendValue: '{{customer.arr_trend_value}}',
        status: 'red'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: '{{customer.renewal_date}}',
        sublabel: '{{customer.days_to_renewal}} days',
        status: 'orange'
      },
      riskScore: {
        label: 'Risk Score',
        value: '{{customer.risk_score}}/100',
        status: 'red',
        sublabel: 'HIGH RISK'
      },
      healthScore: {
        label: 'IHS Score',
        value: '{{customer.health_score}}/100',
        status: 'red',
        sublabel: 'Declining'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: '{{customer.primary_contact_name}}',
        role: '{{customer.primary_contact_title}}'
      },
      lastContact: {
        label: 'Last Contact',
        value: '{{customer.last_contact_date}}',
        sublabel: '{{customer.days_since_contact}} days ago',
        status: 'red'
      },
      profileCompletion: {
        label: 'Profile Complete',
        value: '{{customer.profile_completion_pct}}%',
        status: '{{customer.profile_status}}',
        sublabel: 'Low engagement'
      },
      keyIssue: {
        label: 'Key Issue',
        value: '{{customer.primary_concern}}',
        status: 'red',
        sublabel: 'Requires immediate attention'
      }
    }
  },
  sidePanel: {
    enabled: true,
    title: {
      text: "🚨 At-Risk Renewal Recovery",
      subtitle: "{{customer.name}} - High Priority",
      icon: "⚠️"
    },
    steps: [
      {
        id: "identify-concerns",
        title: "Identify Concerns",
        description: "Analyze areas of concern and root causes",
        status: 'pending' as const,
        workflowBranch: "identify-concerns",
        icon: "🔍"
      },
      {
        id: "review-data",
        title: "Review Performance Data",
        description: "Pull metrics and identify gaps",
        status: 'pending' as const,
        workflowBranch: "review-data",
        icon: "📊"
      },
      {
        id: "prepare-freebie",
        title: "Prepare Freebie Offer",
        description: "Create proactive value-add opportunity",
        status: 'pending' as const,
        workflowBranch: "prepare-freebie",
        icon: "🎁"
      },
      {
        id: "initial-meeting",
        title: "Schedule Initial Meeting",
        description: "Get on their calendar to discuss concerns",
        status: 'pending' as const,
        workflowBranch: "initial-meeting",
        icon: "📅"
      },
      {
        id: "deliver-freebie",
        title: "Deliver Freebie",
        description: "Execute and follow through on value-add",
        status: 'pending' as const,
        workflowBranch: "deliver-freebie",
        icon: "✨"
      },
      {
        id: "measure-impact",
        title: "Measure Freebie Impact",
        description: "Gather performance data and results",
        status: 'pending' as const,
        workflowBranch: "measure-impact",
        icon: "📈"
      },
      {
        id: "renewal-meeting",
        title: "Schedule Renewal Meeting",
        description: "Re-engage for renewal discussion",
        status: 'pending' as const,
        workflowBranch: "renewal-meeting",
        icon: "🤝"
      },
      {
        id: "renewal-deck",
        title: "Prepare Renewal Deck",
        description: "Create presentation with freebie results",
        status: 'pending' as const,
        workflowBranch: "renewal-deck",
        icon: "📑"
      },
      {
        id: "recommendation",
        title: "Create Recommendation",
        description: "Draft retention-focused proposal",
        status: 'pending' as const,
        workflowBranch: "recommendation",
        icon: "✍️"
      },
      {
        id: "followup",
        title: "Send Follow-up",
        description: "Email recommendation and address concerns",
        status: 'pending' as const,
        workflowBranch: "followup",
        icon: "📧"
      },
      {
        id: "negotiate",
        title: "Negotiate & Save",
        description: "Work through objections and close",
        status: 'pending' as const,
        workflowBranch: "negotiate",
        icon: "💪"
      }
    ],
    progressMeter: {
      currentStep: 1,
      totalSteps: 11,
      progressPercentage: 0,
      showPercentage: true,
      showStepNumbers: true
    },
    showSteps: true,
    showProgressMeter: true
  },
  chat: {
    placeholder: 'Discuss at-risk concerns, recovery strategies, or next steps...',
    aiGreeting: "⚠️ Let's save this at-risk renewal for {{customer.name}}.",
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
      defaultMessage: "I'm here to help save this renewal. What would you like to focus on?",
      initialMessage: {
        text: "🚨 **URGENT**: {{customer.name}} is at high risk of churning in {{customer.days_to_renewal}} days.\n\n**Key Issues Identified:**\n{{customer.risk_factors}}\n\n**Risk Score**: {{customer.risk_score}}/100\n\nThis is Grace's highest-pain workflow (10/10). Let's work together to turn this around. Ready to start the recovery plan?",
        buttons: [
          { label: "Start Recovery Plan", value: "start", "label-background": "#ef4444", "label-text": "#ffffff" },
          { label: "Snooze (not recommended)", value: "snooze", "label-background": "#f3f4f6", "label-text": "#6b7280" },
          { label: "Mark as lost", value: "mark-lost", "label-background": "#374151", "label-text": "#ffffff" }
        ],
        nextBranches: {
          'start': 'identify-concerns',
          'snooze': 'snooze',
          'mark-lost': 'confirm-lost'
        }
      },
      branches: {
        // ============================================
        // STEP 1: IDENTIFY CONCERNS
        // ============================================
        'identify-concerns': {
          response: "Let me analyze the data to identify the root causes of this at-risk situation...",
          delay: 2,
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'concern-analysis',
          stepNumber: 1,
          buttons: [
            {
              label: 'Primary KPI not met',
              value: 'concern-kpi',
              'label-background': 'bg-red-100',
              'label-text': 'text-red-800'
            },
            {
              label: 'Low engagement/usage',
              value: 'concern-engagement',
              'label-background': 'bg-orange-100',
              'label-text': 'text-orange-800'
            },
            {
              label: 'Support issues/frustration',
              value: 'concern-support',
              'label-background': 'bg-yellow-100',
              'label-text': 'text-yellow-800'
            },
            {
              label: 'Budget/pricing concerns',
              value: 'concern-budget',
              'label-background': 'bg-purple-100',
              'label-text': 'text-purple-800'
            },
            {
              label: 'Multiple issues',
              value: 'concern-multiple',
              'label-background': 'bg-gray-100',
              'label-text': 'text-gray-800'
            }
          ],
          nextBranches: {
            'concern-kpi': 'analyze-kpi-issue',
            'concern-engagement': 'analyze-engagement-issue',
            'concern-support': 'analyze-support-issue',
            'concern-budget': 'analyze-budget-issue',
            'concern-multiple': 'analyze-multiple-issues'
          }
        },

        'analyze-kpi-issue': {
          response: "**Primary KPI Not Met**: {{customer.primary_kpi}}\n\n**Target**: {{customer.kpi_target}}\n**Actual**: {{customer.kpi_actual}}\n**Gap**: {{customer.kpi_gap}}\n\nThis is their #1 concern. Let's review their performance data to understand why.",
          buttons: [
            { label: 'Review performance data', value: 'review-data' }
          ]
        },

        'analyze-engagement-issue': {
          response: "**Low Engagement Detected**:\n\n• Profile completion: {{customer.profile_completion_pct}}% (below 70% threshold)\n• Profile views: {{customer.profile_views}} ({{customer.views_trend}})\n• Last admin login: {{customer.last_admin_login}} days ago\n\nThey're not getting value because they're not using the platform. Let's diagnose why.",
          buttons: [
            { label: 'Review performance data', value: 'review-data' }
          ]
        },

        'analyze-support-issue': {
          response: "**Support Issues Identified**:\n\n{{customer.support_issues}}\n\n**Open Tickets**: {{customer.open_tickets}}\n**Avg Resolution Time**: {{customer.avg_resolution_time}} hours\n**Recent Sentiment**: {{customer.recent_sentiment}}\n\nFrustration is building. We need to address this immediately.",
          buttons: [
            { label: 'Review performance data', value: 'review-data' },
            { label: 'Escalate support issues first', value: 'escalate-support' }
          ]
        },

        'analyze-budget-issue': {
          response: "**Budget/Pricing Concerns**:\n\n{{customer.budget_concerns}}\n\nROI is unclear to them. Let's pull performance data to build a strong value case.",
          buttons: [
            { label: 'Review performance data', value: 'review-data' }
          ]
        },

        // ============================================
        // STEP 2: REVIEW PERFORMANCE DATA
        // ============================================
        'review-data': {
          response: "Pulling {{customer.name}}'s complete performance history...",
          delay: 2,
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'performance-review',
          stepNumber: 2,
          buttons: [
            {
              label: 'Performance shows some bright spots',
              value: 'data-positive',
              'label-background': 'bg-green-100',
              'label-text': 'text-green-800'
            },
            {
              label: 'Performance confirms concerns',
              value: 'data-negative',
              'label-background': 'bg-red-100',
              'label-text': 'text-red-800'
            },
            {
              label: 'Mixed results',
              value: 'data-mixed',
              'label-background': 'bg-yellow-100',
              'label-text': 'text-yellow-800'
            }
          ],
          nextBranches: {
            'data-positive': 'leverage-positives',
            'data-negative': 'address-negatives',
            'data-mixed': 'prepare-freebie'
          }
        },

        'leverage-positives': {
          response: "Great! I found some positive metrics we can highlight:\n\n{{customer.positive_metrics}}\n\nThese show value is there - we just need to amplify it. Let's prepare a freebie to demonstrate even more value.",
          buttons: [
            { label: 'Prepare freebie offer', value: 'prepare-freebie' }
          ]
        },

        'address-negatives': {
          response: "The data confirms their concerns. Here's what I'm seeing:\n\n{{customer.negative_metrics}}\n\nWe need to turn this around fast. A well-executed freebie can rebuild trust and demonstrate value. Let's prepare something impactful.",
          buttons: [
            { label: 'Prepare freebie offer', value: 'prepare-freebie' }
          ]
        },

        // ============================================
        // STEP 3: PREPARE FREEBIE OFFER
        // ============================================
        'prepare-freebie': {
          response: "Let me recommend a freebie opportunity based on their concerns and profile...",
          delay: 2,
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'freebie-options',
          stepNumber: 3,
          buttons: [
            {
              label: 'Featured article placement',
              value: 'freebie-article',
              'label-background': 'bg-blue-100',
              'label-text': 'text-blue-800'
            },
            {
              label: 'Profile optimization session',
              value: 'freebie-profile',
              'label-background': 'bg-purple-100',
              'label-text': 'text-purple-800'
            },
            {
              label: 'Social media campaign',
              value: 'freebie-social',
              'label-background': 'bg-pink-100',
              'label-text': 'text-pink-800'
            },
            {
              label: 'Premium job posting credits',
              value: 'freebie-jobs',
              'label-background': 'bg-green-100',
              'label-text': 'text-green-800'
            },
            {
              label: 'Custom package',
              value: 'freebie-custom',
              'label-background': 'bg-gray-100',
              'label-text': 'text-gray-800'
            }
          ],
          nextBranches: {
            'freebie-article': 'freebie-selected-article',
            'freebie-profile': 'freebie-selected-profile',
            'freebie-social': 'freebie-selected-social',
            'freebie-jobs': 'freebie-selected-jobs',
            'freebie-custom': 'freebie-custom-input'
          }
        },

        'freebie-selected-article': {
          response: "**Freebie Selected**: Featured Article Placement\n\n**Value**: $1,500-2,000\n**Timeline**: 2-3 weeks\n**Expected Impact**: Brand impressions +50%, profile views +30%\n\nPerfect for addressing visibility concerns. Ready to schedule the initial meeting to present this?",
          actions: ['updateArtifact'],
          artifactId: 'freebie-options',
          buttons: [
            { label: 'Schedule initial meeting', value: 'initial-meeting' },
            { label: 'Choose different freebie', value: 'prepare-freebie' }
          ]
        },

        'freebie-selected-profile': {
          response: "**Freebie Selected**: Profile Optimization Session\n\n**Value**: $500-800\n**Timeline**: 1 week\n**Expected Impact**: Profile completion +40%, engagement +25%\n\nPerfect for fixing low engagement. Ready to schedule the meeting?",
          buttons: [
            { label: 'Schedule initial meeting', value: 'initial-meeting' }
          ]
        },

        'freebie-selected-social': {
          response: "**Freebie Selected**: Social Media Campaign\n\n**Value**: $1,000-1,500\n**Timeline**: 2 weeks\n**Expected Impact**: Follower growth +20%, social mentions +300%\n\nPerfect for expanding reach. Ready to present this?",
          buttons: [
            { label: 'Schedule initial meeting', value: 'initial-meeting' }
          ]
        },

        'freebie-selected-jobs': {
          response: "**Freebie Selected**: Premium Job Posting Credits\n\n**Value**: $800-1,200\n**Timeline**: Immediate\n**Expected Impact**: Job matches +40%, apply clicks +35%\n\nPerfect if their KPI is hires. Ready to schedule?",
          buttons: [
            { label: 'Schedule initial meeting', value: 'initial-meeting' }
          ]
        },

        // ============================================
        // STEP 4: SCHEDULE INITIAL MEETING
        // ============================================
        'initial-meeting': {
          response: "Let me draft a meeting request that positions the freebie as a proactive value-add, not a desperate save attempt...",
          delay: 2,
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'initial-meeting-email',
          stepNumber: 4,
          buttons: [
            {
              label: 'Send meeting request',
              value: 'meeting-sent',
              'label-background': 'bg-blue-100',
              'label-text': 'text-blue-800'
            },
            {
              label: 'Edit email first',
              value: 'edit-meeting-email',
              'label-background': 'bg-gray-100',
              'label-text': 'text-gray-800'
            }
          ],
          nextBranches: {
            'meeting-sent': 'meeting-sent-response',
            'edit-meeting-email': 'initial-meeting'
          }
        },

        'meeting-sent-response': {
          response: "✅ Meeting request sent!\n\nOnce you've held the meeting and discussed the freebie, come back here to track delivery.\n\nWhat's the meeting outcome?",
          actions: ['completeStep'],
          stepNumber: 4,
          buttons: [
            {
              label: 'They accepted - deliver freebie',
              value: 'deliver-freebie',
              'label-background': 'bg-green-100',
              'label-text': 'text-green-800'
            },
            {
              label: 'They declined/ghosted',
              value: 'meeting-declined',
              'label-background': 'bg-red-100',
              'label-text': 'text-red-800'
            },
            {
              label: 'Need to follow up',
              value: 'meeting-followup',
              'label-background': 'bg-yellow-100',
              'label-text': 'text-yellow-800'
            }
          ],
          nextBranches: {
            'deliver-freebie': 'deliver-freebie',
            'meeting-declined': 'handle-decline',
            'meeting-followup': 'create-followup'
          }
        },

        'handle-decline': {
          response: "This is concerning. They're not engaging even with a free offer. This suggests deeper issues.\n\nRecommended escalation:\n\n1. Loop in your manager\n2. Attempt executive-level outreach\n3. Prepare save offer (discount/extended trial)\n\nWhat would you like to do?",
          buttons: [
            { label: 'Escalate to leadership', value: 'escalate-leadership' },
            { label: 'Try different freebie', value: 'prepare-freebie' },
            { label: 'Continue recovery attempt', value: 'deliver-freebie' }
          ]
        },

        // ============================================
        // STEP 5: DELIVER FREEBIE
        // ============================================
        'deliver-freebie': {
          response: "Great! You're delivering the freebie. This is critical - execution quality will determine if we can save this renewal.\n\n**Freebie**: {{customer.freebie_type}}\n**Timeline**: {{customer.freebie_timeline}}\n\nI'll help you track the impact. Mark this complete once the freebie is delivered.",
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'freebie-tracker',
          stepNumber: 5,
          buttons: [
            {
              label: 'Freebie delivered',
              value: 'freebie-delivered',
              'label-background': 'bg-green-100',
              'label-text': 'text-green-800'
            },
            {
              label: 'In progress',
              value: 'freebie-progress',
              'label-background': 'bg-yellow-100',
              'label-text': 'text-yellow-800'
            }
          ],
          nextBranches: {
            'freebie-delivered': 'measure-impact',
            'freebie-progress': 'freebie-checkin'
          }
        },

        // ============================================
        // STEP 6: MEASURE FREEBIE IMPACT
        // ============================================
        'measure-impact': {
          response: "Excellent! Now let's gather performance data from the freebie to demonstrate value...",
          delay: 2,
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'freebie-results',
          stepNumber: 6,
          buttons: [
            {
              label: 'Freebie showed strong results',
              value: 'results-strong',
              'label-background': 'bg-green-100',
              'label-text': 'text-green-800'
            },
            {
              label: 'Results were okay',
              value: 'results-okay',
              'label-background': 'bg-yellow-100',
              'label-text': 'text-yellow-800'
            },
            {
              label: 'Results disappointing',
              value: 'results-weak',
              'label-background': 'bg-red-100',
              'label-text': 'text-red-800'
            }
          ],
          nextBranches: {
            'results-strong': 'leverage-results',
            'results-okay': 'temper-expectations',
            'results-weak': 'pivot-strategy'
          }
        },

        'leverage-results': {
          response: "🎉 Perfect! Strong results give us momentum. The freebie demonstrated value - now we capitalize on it.\n\n**Results Summary**:\n{{customer.freebie_results}}\n\nReady to schedule the renewal meeting while sentiment is positive?",
          buttons: [
            { label: 'Schedule renewal meeting', value: 'renewal-meeting' }
          ]
        },

        'temper-expectations': {
          response: "Results were mixed. We'll need to spin this carefully - focus on learnings and potential, not just raw numbers.\n\nRecommendation: Position freebie as \"proof of concept\" that with proper implementation (i.e., renewal), they can achieve even better results.",
          buttons: [
            { label: 'Schedule renewal meeting', value: 'renewal-meeting' }
          ]
        },

        'pivot-strategy': {
          response: "⚠️ Weak results complicate the save attempt. We need to pivot our strategy.\n\nOptions:\n1. **Honest conversation**: Acknowledge results, diagnose why, offer different approach\n2. **Double down**: Offer additional freebie to prove value\n3. **Discount play**: Move to pricing/terms negotiation\n\nWhat's your approach?",
          buttons: [
            { label: 'Honest conversation', value: 'honest-approach' },
            { label: 'Offer second freebie', value: 'prepare-freebie' },
            { label: 'Move to discount negotiation', value: 'renewal-meeting' }
          ]
        },

        // ============================================
        // STEP 7: SCHEDULE RENEWAL MEETING
        // ============================================
        'renewal-meeting': {
          response: "Let me draft the renewal meeting request. This email needs to leverage freebie results and re-engage them on renewal...",
          delay: 2,
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'renewal-meeting-email',
          stepNumber: 7,
          buttons: [
            { label: 'Send renewal meeting request', value: 'renewal-meeting-sent' },
            { label: 'Edit email', value: 'renewal-meeting' }
          ]
        },

        'renewal-meeting-sent': {
          response: "✅ Renewal meeting request sent!\n\nWhile you wait for their response, let me prepare your renewal presentation deck with the freebie results.",
          buttons: [
            { label: 'Prepare renewal deck', value: 'renewal-deck' }
          ]
        },

        // ============================================
        // STEP 8: PREPARE RENEWAL DECK
        // ============================================
        'renewal-deck': {
          response: "Creating your renewal presentation deck with freebie results and value demonstration...",
          delay: 3,
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'renewal-presentation',
          stepNumber: 8,
          buttons: [
            { label: 'Deck looks good', value: 'deck-approved' },
            { label: 'Needs revisions', value: 'deck-revise' }
          ]
        },

        'deck-approved': {
          response: "Perfect! Your renewal deck is ready. Once you've held the meeting, come back to create the formal recommendation.\n\nMeeting held?",
          actions: ['completeStep'],
          stepNumber: 8,
          buttons: [
            { label: 'Yes - create recommendation', value: 'recommendation' },
            { label: 'Not yet', value: 'set-reminder' }
          ]
        },

        // ============================================
        // STEP 9: CREATE RECOMMENDATION
        // ============================================
        'recommendation': {
          response: "Based on the meeting and freebie results, let me draft your retention-focused renewal recommendation...",
          delay: 3,
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'renewal-recommendation',
          stepNumber: 9,
          buttons: [
            { label: 'Standard renewal (same terms)', value: 'rec-standard' },
            { label: 'Discount to save account', value: 'rec-discount' },
            { label: 'Downsell to lower tier', value: 'rec-downsell' },
            { label: 'Custom save package', value: 'rec-custom' }
          ],
          nextBranches: {
            'rec-standard': 'recommendation-standard',
            'rec-discount': 'recommendation-discount',
            'rec-downsell': 'recommendation-downsell',
            'rec-custom': 'recommendation-custom'
          }
        },

        'recommendation-standard': {
          response: "**Recommendation**: Standard Renewal (Same Terms)\n\nBased on freebie results and meeting feedback, you believe value is clear and they'll renew at current pricing.\n\nReady to send the follow-up email?",
          buttons: [
            { label: 'Send follow-up', value: 'followup' }
          ]
        },

        'recommendation-discount': {
          response: "**Recommendation**: Discounted Renewal\n\n**Discount**: {{customer.recommended_discount}}%\n**Justification**: {{customer.discount_justification}}\n\nThis is a save play. Ready to present this?",
          buttons: [
            { label: 'Send follow-up', value: 'followup' }
          ]
        },

        'recommendation-downsell': {
          response: "**Recommendation**: Downsell to Lower Tier\n\n**New ARR**: {{customer.downsell_arr}} (from {{customer.current_arr}})\n**Rationale**: Retain relationship, right-size for usage\n\nKeeping them as a customer at lower value is better than churn. Agree?",
          buttons: [
            { label: 'Send follow-up', value: 'followup' }
          ]
        },

        // ============================================
        // STEP 10: SEND FOLLOW-UP
        // ============================================
        'followup': {
          response: "Drafting your renewal recommendation follow-up email...",
          delay: 2,
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'followup-email',
          stepNumber: 10,
          buttons: [
            { label: 'Send follow-up', value: 'followup-sent' }
          ]
        },

        'followup-sent': {
          response: "✅ Follow-up sent with renewal recommendation!\n\nNow we wait for their response and move into negotiation. What happened?",
          actions: ['completeStep'],
          stepNumber: 10,
          buttons: [
            { label: 'They accepted!', value: 'renewal-won' },
            { label: 'Negotiating terms', value: 'negotiate' },
            { label: 'Still at risk', value: 'negotiate' },
            { label: 'They\'re churning', value: 'renewal-lost' }
          ]
        },

        // ============================================
        // STEP 11: NEGOTIATE & SAVE
        // ============================================
        'negotiate': {
          response: "Here's your negotiation guide and objection handling playbook...",
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'negotiation-guide',
          stepNumber: 11,
          buttons: [
            {
              label: 'Renewal saved!',
              value: 'renewal-won',
              'label-background': 'bg-green-100',
              'label-text': 'text-green-800'
            },
            {
              label: 'Still working it',
              value: 'negotiating',
              'label-background': 'bg-yellow-100',
              'label-text': 'text-yellow-800'
            },
            {
              label: 'Lost the account',
              value: 'renewal-lost',
              'label-background': 'bg-red-100',
              'label-text': 'text-red-800'
            }
          ]
        },

        'renewal-won': {
          response: "🎉🎉🎉 RENEWAL SAVED! Incredible work, {{user.first}}!\n\nYou turned around an at-risk account through:\n• Proactive value delivery (freebie)\n• Data-driven engagement\n• Strategic positioning\n\nThis is why you're great at what you do. Want to see a summary?",
          buttons: [
            { label: 'Show summary', value: 'workflow-complete' },
            { label: 'Next at-risk customer', value: 'next-customer-action' }
          ]
        },

        'renewal-lost': {
          response: "I'm sorry, {{user.first}}. You did everything right - sometimes accounts can't be saved.\n\nLet's document what happened for the post-mortem:\n\n**Churn Reason**: {{customer.churn_reason}}\n**Lessons Learned**: {{customer.lessons_learned}}\n\nWould you like to see a summary of the recovery attempt?",
          buttons: [
            { label: 'Show summary', value: 'workflow-complete' },
            { label: 'Next customer', value: 'next-customer-action' }
          ]
        },

        'workflow-complete': {
          response: "Here's a summary of your at-risk recovery workflow for {{customer.name}}.",
          actions: ['showArtifact', 'completeStep'],
          artifactId: 'workflow-summary',
          stepNumber: 11,
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
          continueBranch: 'identify-concerns'
        }),

        'confirm-lost': {
          response: "Are you sure you want to mark {{customer.name}} as lost? This should only be done if you've exhausted all recovery options.\n\nThis will close the renewal as churned.",
          buttons: [
            { label: 'Yes, mark as lost', value: 'renewal-lost' },
            { label: 'No, start recovery', value: 'identify-concerns' }
          ]
        }
      },
      userTriggers: {
        ".*help.*": "help-flow",
        ".*concern.*|.*issue.*|.*problem.*": "identify-concerns",
        ".*freebie.*|.*free.*|.*offer.*": "prepare-freebie",
        ".*meeting.*": "initial-meeting",
        ".*negotiate.*|.*discount.*": "negotiate"
      }
    }
  },
  artifacts: {
    sections: [
      // Concern Analysis
      {
        ...createDocumentArtifact({
          id: 'concern-analysis',
          title: 'At-Risk Analysis',
          content: '{{customer.concern_analysis}}',
          editable: false,
          visible: false
        })
      },
      // Performance Review
      {
        ...createBrandExposureReportArtifact({
          id: 'performance-review',
          title: 'Performance Review - At-Risk Customer',
          customerName: '{{customer.name}}',
          reportingPeriod: 'Last 90 days',
          healthScore: '{{customer.health_score}}',
          metrics: {
            brandImpressions: '{{customer.brand_impressions}}',
            brandImpressionsTrend: '{{customer.impressions_trend}}',
            profileViews: '{{customer.profile_views}}',
            profileViewsTrend: '{{customer.views_trend}}',
            profileCompletionPct: '{{customer.profile_completion_pct}}',
            jobMatches: '{{customer.job_matches}}',
            applyClicks: '{{customer.apply_clicks}}',
            applyClicksTrend: '{{customer.clicks_trend}}',
            clickThroughRate: '{{customer.click_through_rate}}',
            articleInclusions: '{{customer.article_inclusions}}',
            socialMentions: '{{customer.social_mentions}}',
            newRatings: '{{customer.new_ratings}}',
            followerGrowth: '{{customer.follower_growth}}'
          },
          performanceAnalysis: '{{customer.performance_analysis}}',
          strengths: '{{customer.performance_strengths}}',
          improvements: '{{customer.performance_improvements}}',
          recommendations: '{{customer.performance_recommendations}}',
          visible: false
        })
      },
      // Freebie Options
      {
        ...createDocumentArtifact({
          id: 'freebie-options',
          title: 'Freebie Strategy',
          content: '{{customer.freebie_options}}',
          editable: true,
          visible: false
        })
      },
      // Initial Meeting Email
      {
        ...createEmailArtifact({
          id: 'initial-meeting-email',
          title: 'Initial Meeting Request',
          to: '{{customer.primary_contact_email}}',
          subject: '{{customer.name}} - Exciting Opportunity to Boost Your Results',
          body: '{{customer.initial_meeting_email}}',
          editable: true,
          visible: false
        })
      },
      // Freebie Tracker
      {
        ...createDocumentArtifact({
          id: 'freebie-tracker',
          title: 'Freebie Delivery Tracker',
          content: '{{customer.freebie_tracker}}',
          editable: true,
          visible: false
        })
      },
      // Freebie Results
      {
        ...createDocumentArtifact({
          id: 'freebie-results',
          title: 'Freebie Impact Report',
          content: '{{customer.freebie_results_report}}',
          editable: false,
          visible: false
        })
      },
      // Renewal Meeting Email
      {
        ...createEmailArtifact({
          id: 'renewal-meeting-email',
          title: 'Renewal Meeting Request',
          to: '{{customer.primary_contact_email}}',
          subject: '{{customer.name}} - Renewal Discussion & Results Review',
          body: '{{customer.renewal_meeting_email}}',
          editable: true,
          visible: false
        })
      },
      // Renewal Presentation
      {
        ...createDocumentArtifact({
          id: 'renewal-presentation',
          title: 'Renewal Presentation Deck',
          content: '{{customer.renewal_presentation}}',
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
          title: 'Renewal Follow-up',
          to: '{{customer.primary_contact_email}}',
          subject: '{{customer.name}} - Renewal Proposal & Next Steps',
          body: '{{customer.followup_email_content}}',
          editable: true,
          visible: false
        })
      },
      // Negotiation Guide
      {
        ...createDocumentArtifact({
          id: 'negotiation-guide',
          title: 'Negotiation Playbook',
          content: '{{customer.negotiation_guide}}',
          editable: false,
          visible: false
        })
      },
      // Workflow Summary
      {
        ...createWorkflowSummaryArtifact({
          id: 'workflow-summary',
          title: 'At-Risk Recovery Summary',
          customerName: '{{customer.name}}',
          currentStage: '{{renewal.outcome}}',
          progressPercentage: 100,
          completedActions: '{{workflow.completed_actions}}',
          pendingActions: '{{workflow.pending_actions}}',
          nextSteps: '{{workflow.next_steps}}',
          keyMetrics: {
            initialRisk: '{{customer.initial_risk_score}}/100',
            finalRisk: '{{customer.final_risk_score}}/100',
            freebieValue: '{{customer.freebie_value}}',
            outcome: '{{customer.renewal_outcome}}'
          },
          recommendations: '{{workflow.recommendations}}',
          visible: false
        })
      }
    ]
  }
};
