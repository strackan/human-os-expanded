/**
 * Account Overview with Contract Q&A Example
 *
 * Demonstrates how to add pattern matching for contract questions
 * and handle the Q&A flow with recommendations about metrics-tied clauses.
 */

import { WorkflowConfig } from '../WorkflowConfig';

export const accountOverviewWithQAConfig: WorkflowConfig = {
  customer: {
    name: 'Bluesoft Industries',
    nextCustomer: 'Next Corp'
  },
  layout: {
    modalDimensions: { width: 80, height: 80, top: 10, left: 10 },
    dividerPosition: 50,
    chatWidth: 50,
    splitModeDefault: false,
    statsHeight: 45.3
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: '$485,000',
        trend: 'up',
        trendValue: '+15%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$7.24',
        sublabel: '(65% value)',
        status: 'green',
        trend: 'Below market average'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Mar 15, 2026',
        sublabel: '120 days',
        status: 'green'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'David Park',
        role: 'VP of Engineering'
      },
      riskScore: {
        label: 'Risk Score',
        value: '3.5/10',
        status: 'green',
        sublabel: 'Low risk'
      },
      growthScore: {
        label: 'Growth Score',
        value: '8.5/10',
        status: 'green',
        sublabel: 'High expansion potential'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+45%',
        status: 'green',
        sparkData: [4, 5, 6, 7, 8, 9, 10],
        sublabel: 'Annual'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+18%',
        status: 'green',
        sparkData: [6, 7, 8, 9, 10, 11, 12],
        sublabel: 'Growing'
      }
    }
  },
  analytics: {
    usageTrend: '{{chart.usageTrend.rising}}',
    userLicenses: '{{chart.userLicenses.rising}}',
    renewalInsights: {
      renewalStage: 'Planning',
      confidence: 85,
      recommendedAction: 'Strategic Renewal',
      keyReasons: [
        { category: 'Usage', detail: 'Usage increased 45% year-over-year' },
        { category: 'Adoption', detail: 'Active users up 30%' },
        { category: 'Contract', detail: 'Metrics-tied pricing creates renewal uncertainty' }
      ]
    }
  },
  sidePanel: {
    enabled: true,
    title: {
      text: "Strategic Plan",
      subtitle: "Account Overview & Planning",
      icon: "📋"
    },
    steps: [
      {
        id: "account-overview",
        title: "Account Overview",
        description: "Review account details and ask questions",
        status: 'pending' as const,
        workflowBranch: "account-overview-start",
        icon: "📊"
      },
      {
        id: "strategic-plan",
        title: "Strategic Plan",
        description: "Build comprehensive renewal plan",
        status: 'pending' as const,
        workflowBranch: "strategic-plan",
        icon: "🎯"
      }
    ],
    progressMeter: {
      currentStep: 1,
      totalSteps: 2,
      progressPercentage: 0,
      showPercentage: true,
      showStepNumbers: true
    },
    showSteps: true,
    showProgressMeter: false
  },
  chat: {
    placeholder: 'Ask me anything about the account...',
    aiGreeting: "Hi! Let's review the account overview.",
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
      defaultMessage: "I understand you'd like to discuss something else. How can I help?",
      initialMessage: {
        text: "Hi! I've prepared an account overview for Bluesoft Industries. Would you like to review the contract, contacts, or pricing details? Feel free to ask me any questions.",
        buttons: [
          { label: "Review Account", value: "review", "label-background": "#3b82f6", "label-text": "#ffffff" }
        ],
        nextBranches: {
          'review': 'account-overview-start'
        }
      },
      branches: {
        // ============================================
        // STEP 1: ACCOUNT OVERVIEW
        // ============================================
        'account-overview-start': {
          response: "Perfect! I've loaded the Account Overview on the right. It includes:<br><br>• <b>Contract</b> - Current terms, auto-renewal status, pricing caps<br>• <b>Contacts</b> - Key stakeholders (you can edit them)<br>• <b>Pricing</b> - ARR, seats, market position<br><br>Feel free to explore the tabs and ask me any questions!",
          delay: 1,
          actions: ['showArtifact', 'enterStep'],
          artifactId: 'account-overview',
          stepNumber: 1,
          // No buttons - free-form Q&A mode
        },

        // ============================================
        // CONTRACT Q&A BRANCH
        // ============================================
        'contract-question': {
          response: "I've reviewed the contract for Bluesoft Industries. Here are the key details:<br><br>• <b>Term:</b> 12 months (Auto-renewal enabled)<br>• <b>Notice Period:</b> 60 days<br>• <b>Pricing Cap:</b> 5% annual increase maximum<br><br>One thing I noticed: <b>The contract ties specific usage metrics to renewal terms</b>, which puts uncertainty and effort into the renewal process. This can create challenges because:<br><br>✗ Unpredictable pricing based on usage fluctuations<br>✗ Additional administrative overhead to track metrics<br>✗ Potential for customer confusion<br><br><b>Would you like me to add removing that clause to our renewal goals?</b>",
          buttons: [
            { label: "Yes, add to goals", value: "add-contract-goal", "label-background": "#10b981", "label-text": "#ffffff" },
            { label: "No, keep as is", value: "skip-contract-goal", "label-background": "#6b7280", "label-text": "#ffffff" },
            { label: "Tell me more", value: "contract-details", "label-background": "#3b82f6", "label-text": "#ffffff" }
          ],
          nextBranches: {
            'add-contract-goal': 'contract-goal-confirmed',
            'skip-contract-goal': 'account-overview-start',
            'contract-details': 'contract-details-expanded'
          }
        },

        'contract-goal-confirmed': {
          response: "Got it! I'll remind you to address the metrics-tied clause when we build the strategic plan. This will be included as one of your renewal goals to simplify the contract and reduce renewal friction.<br><br>Is there anything else you'd like to know about the contract, contacts, or pricing?",
          // No buttons - free-form Q&A continues
        },

        'contract-details-expanded': {
          response: "The current contract has a clause that ties pricing to monthly usage metrics (tokens consumed). While this seemed fair at signing, it creates these challenges:<br><br>1. <b>Unpredictability:</b> Customer budget planning becomes difficult<br>2. <b>Tracking burden:</b> Both sides must monitor usage constantly<br>3. <b>Renewal complexity:</b> Harder to forecast and negotiate renewals<br><br>Removing this clause and moving to a fixed, predictable pricing model would:<br><br>✓ Make budgeting easier for the customer<br>✓ Reduce administrative overhead<br>✓ Simplify renewal discussions<br>✓ Increase customer satisfaction<br><br>Should I add this to your renewal goals?",
          buttons: [
            { label: "Yes, add to goals", value: "add-contract-goal", "label-background": "#10b981", "label-text": "#ffffff" },
            { label: "No thanks", value: "skip-contract-goal", "label-background": "#6b7280", "label-text": "#ffffff" }
          ],
          nextBranches: {
            'add-contract-goal': 'contract-goal-confirmed',
            'skip-contract-goal': 'account-overview-start'
          }
        },

        // ============================================
        // CONTACTS Q&A BRANCH
        // ============================================
        'contacts-question': {
          response: "I see you have questions about the contacts. The Account Overview shows three key stakeholders:<br><br>• <b>David Park</b> - VP of Engineering (Champion)<br>• <b>Sarah Chen</b> - CTO (Executive Stakeholder)<br>• <b>Alex Martinez</b> - Engineering Manager (Business User)<br><br>You can click the pencil icon next to any contact to update them with autocomplete. Would you like to edit any contacts?",
          buttons: [
            { label: "Continue", value: "account-overview-start", "label-background": "#3b82f6", "label-text": "#ffffff" }
          ],
          nextBranches: {
            'account-overview-start': 'account-overview-start'
          }
        },

        // ============================================
        // PRICING Q&A BRANCH
        // ============================================
        'pricing-question': {
          response: "Looking at the pricing tab:<br><br>• <b>Current ARR:</b> $485,000 (up from $420,000 last year)<br>• <b>Seats:</b> 67 seats at $7,238/seat<br>• <b>Market Position:</b> 45th percentile (below market average)<br>• <b>Usage Score:</b> 82% (high engagement)<br><br>The high usage score with below-market pricing suggests a <b>strong pricing opportunity</b> for the renewal. Would you like to proceed to the strategic plan?",
          buttons: [
            { label: "Yes, build plan", value: "strategic-plan", "label-background": "#10b981", "label-text": "#ffffff" },
            { label: "Ask more questions", value: "account-overview-start", "label-background": "#6b7280", "label-text": "#ffffff" }
          ],
          nextBranches: {
            'strategic-plan': 'strategic-plan',
            'account-overview-start': 'account-overview-start'
          }
        },

        // ============================================
        // STEP 2: STRATEGIC PLAN
        // ============================================
        'strategic-plan': {
          response: "Excellent! I'm now building a comprehensive strategic plan that includes:<br><br>✓ Account overview insights<br>✓ Contract recommendations (including removing metrics-tied clause)<br>✓ Contact strategy<br>✓ Pricing analysis and recommendations<br><br>This will take just a moment...",
          delay: 2,
          actions: ['showArtifact', 'completeStep', 'enterStep'],
          artifactId: 'strategic-plan-artifact',
          stepNumber: 2,
          buttons: [
            { label: "Review Plan", value: "review-plan", "label-background": "#3b82f6", "label-text": "#ffffff" }
          ],
          nextBranches: {
            'review-plan': 'plan-complete'
          }
        },

        'plan-complete': {
          response: "Your strategic plan is ready! It consolidates all the insights from the account overview, including your goal to remove the metrics-tied pricing clause. Review it on the right and let me know if you'd like to make any changes.",
          // No buttons - end of workflow
        }
      },

      // ============================================
      // PATTERN MATCHING (User Triggers)
      // ============================================
      userTriggers: {
        // Contract-related keywords
        ".*contract.*": "contract-question",
        ".*terms.*": "contract-question",
        ".*clause.*": "contract-question",
        ".*renewal.*terms.*": "contract-question",
        ".*pricing.*cap.*": "contract-question",
        ".*auto.?renew.*": "contract-question",

        // Contacts-related keywords
        ".*contact.*": "contacts-question",
        ".*stakeholder.*": "contacts-question",
        ".*david.*park.*": "contacts-question",
        ".*who.*involved.*": "contacts-question",

        // Pricing-related keywords
        ".*pricing.*": "pricing-question",
        ".*price.*": "pricing-question",
        ".*arr.*": "pricing-question",
        ".*seats.*": "pricing-question",
        ".*cost.*": "pricing-question",

        // General help
        ".*help.*": "account-overview-start",
        ".*what.*can.*": "account-overview-start"
      }
    }
  },
  artifacts: {
    sections: [
      {
        id: 'account-overview',
        type: 'custom',
        title: 'Account Overview',
        visible: false,
        props: {
          customerName: 'Bluesoft Industries',
          contractInfo: {
            startDate: '2024-03-15',
            endDate: '2026-03-15',
            term: '24 months',
            autoRenew: true,
            autoRenewLanguage: 'Contract will automatically renew for successive 12-month periods unless 60-day notice is provided',
            noticePeriod: '60 days',
            terminationClause: 'Either party may terminate with 60 days written notice',
            pricingCaps: [
              'Annual price increases capped at 5% maximum',
              'Usage-based pricing tied to monthly token consumption (creates renewal uncertainty)'
            ],
            nonStandardTerms: [
              'Metrics-based pricing adjustment clause',
              'Quarterly usage reporting requirement'
            ],
            riskLevel: 'medium' as const
          },
          contacts: [
            {
              name: 'David Park',
              role: 'VP of Engineering',
              email: 'david.park@bluesoft.com',
              type: 'champion' as const,
              confirmed: false
            },
            {
              name: 'Sarah Chen',
              role: 'CTO',
              email: 'sarah.chen@bluesoft.com',
              type: 'executive' as const,
              confirmed: false
            },
            {
              name: 'Alex Martinez',
              role: 'Engineering Manager',
              email: 'alex.martinez@bluesoft.com',
              type: 'business' as const,
              confirmed: false
            }
          ],
          pricingInfo: {
            currentARR: '$485,000',
            lastYearARR: '$420,000',
            seats: 67,
            pricePerSeat: '$7,238',
            marketPercentile: 45,
            usageScore: 82,
            adoptionRate: 68,
            satisfactionScore: 85,
            pricingOpportunity: 'high' as const,
            addOns: ['API Access', 'Priority Support', 'Advanced Analytics'],
            discounts: '10% multi-year discount applied'
          },
          showSkipSnooze: true,
          onSkip: () => {
            console.log('Skip workflow clicked');
            // This would trigger exitTaskMode action
          },
          onSnooze: () => {
            console.log('Snooze workflow clicked');
            // This would trigger exitTaskMode action with snooze metadata
          }
        }
      },
      {
        id: 'strategic-plan-artifact',
        type: 'planning-checklist',
        title: 'Strategic Renewal Plan',
        visible: false,
        props: {
          title: 'Strategic Renewal Plan',
          description: 'Comprehensive plan for Bluesoft Industries renewal, incorporating all account insights:',
          items: [
            { id: 'contract', label: 'Remove metrics-tied pricing clause to reduce renewal friction', completed: false },
            { id: 'contacts', label: 'Confirm David Park as primary champion, engage Sarah Chen for exec buy-in', completed: false },
            { id: 'pricing', label: 'Propose 15% price increase based on high usage (82%) and below-market position (45th percentile)', completed: false },
            { id: 'value', label: 'Present value metrics showing 15% YoY growth and strong adoption', completed: false },
            { id: 'terms', label: 'Negotiate simplified, fixed pricing model for predictability', completed: false },
            { id: 'timeline', label: 'Begin outreach 90 days before renewal (Dec 15)', completed: false }
          ],
          showActions: true
        }
      }
    ]
  }
};
