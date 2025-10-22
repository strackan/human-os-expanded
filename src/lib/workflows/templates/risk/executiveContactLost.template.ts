/**
 * Executive Contact Lost - Risk Workflow Template
 *
 * Triggered when a key executive contact leaves the customer organization.
 * Helps CSM quickly assess impact and take action to maintain relationship.
 *
 * Category: Risk
 * Slides: 6
 * Estimated Time: 8 minutes
 *
 * Required Data:
 * - customer.name
 * - customer.current_arr
 * - departed_contact.name
 * - departed_contact.title
 * - departed_contact.departure_date
 */

import {
  WorkflowTemplate,
  DEFAULT_TEMPLATE_LAYOUT,
  DEFAULT_CHAT_FEATURES,
} from '../baseTemplate';

export const executiveContactLostTemplate: WorkflowTemplate = {
  id: 'exec-contact-lost',
  name: 'Executive Contact Lost',
  category: 'risk',
  description: 'Workflow for managing risk when a key executive contact departs the customer organization',
  slideCount: 6,
  estimatedMinutes: 8,
  version: '1.0.0',

  requiredFields: [
    'customer.name',
    'customer.id',
    'customer.current_arr',
    'departed_contact.name',
    'departed_contact.title',
  ],

  optionalFields: [
    'departed_contact.departure_date',
    'departed_contact.replacement_name',
    'customer.health_score',
    'customer.renewal_date',
  ],

  layout: DEFAULT_TEMPLATE_LAYOUT,

  chat: {
    placeholder: 'Ask me anything about this situation...',
    aiGreeting: "I noticed that {{departed_contact.name}} has left {{customer.name}}. Let's make sure we maintain our relationship strength.",
    features: DEFAULT_CHAT_FEATURES,
  },

  slides: [
    // SLIDE 1: Greeting & Assessment
    {
      id: 'greeting',
      slideNumber: 1,
      title: 'Executive Departure Alert',
      description: 'Assess the impact of contact departure',
      label: 'Assess Impact',
      stepMapping: 'greeting',
      chat: {
        initialMessage: {
          text: "I noticed that {{departed_contact.name}} ({{departed_contact.title}}) has left {{customer.name}}. This is a {{customer.current_arr}} account, so it's important we maintain continuity. Let's assess the situation.",
          buttons: [
            { label: 'Assess Impact', value: 'start', 'label-background': 'bg-red-600', 'label-text': 'text-white' },
            { label: 'Snooze', value: 'snooze', 'label-background': 'bg-gray-500', 'label-text': 'text-white' },
          ],
          nextBranches: {
            'start': 'assess-impact',
            'snooze': 'handle-snooze',
          }
        },
        branches: {
          'assess-impact': {
            response: "Let's start by understanding the impact. How critical was {{departed_contact.name}} to your relationship with {{customer.name}}?\n\nRate from 1 (minimal impact) to 10 (critical relationship at risk).",
            component: {
              type: 'slider',
              id: 'relationship-impact',
              min: 1,
              max: 10,
              defaultValue: 5,
              labels: {
                min: 'Minimal (1)',
                max: 'Critical (10)'
              },
              accentColor: 'red',
              showValue: true
            },
            storeAs: 'assessment.relationshipImpact',
            nextBranch: 'impact-received'
          },
          'impact-received': {
            response: "Thanks. Can you explain why you rated it that way? What made {{departed_contact.name}}'s role significant?",
            storeAs: 'assessment.impactScore',
            nextBranchOnText: 'ask-replacement',
            actions: ['nextSlide']
          },
          'handle-snooze': {
            response: "No problem, I'll remind you in a few days.",
            actions: ['closeWorkflow']
          }
        }
      },
      artifacts: {
        sections: [
          {
            id: 'risk-assessment',
            title: 'Impact Assessment for {{customer.name}}',
            type: 'planning-checklist',
            visible: true,
            data: {
              items: [
                { id: '1', label: 'Assess relationship impact', completed: false },
                { id: '2', label: 'Identify replacement contact', completed: false },
                { id: '3', label: 'Review account health', completed: false },
                { id: '4', label: 'Draft outreach email', completed: false },
                { id: '5', label: 'Schedule transition call', completed: false },
              ],
              showActions: false
            }
          }
        ]
      }
    },

    // SLIDE 2: Identify Replacement
    {
      id: 'identify-replacement',
      slideNumber: 2,
      title: 'Identify New Contact',
      description: 'Find the replacement decision-maker',
      label: 'Find Replacement',
      stepMapping: 'replacement',
      chat: {
        initialMessage: {
          text: "Do you know who's replacing {{departed_contact.name}} as {{departed_contact.title}}?",
          component: {
            type: 'radio',
            id: 'replacement-status',
            options: [
              {
                value: 'known',
                label: 'Yes, I know the replacement',
                description: 'I have their name and can reach out'
              },
              {
                value: 'partial',
                label: 'I have some leads',
                description: 'I have a few potential contacts'
              },
              {
                value: 'unknown',
                label: 'No, I need to find out',
                description: 'I don\'t know who took over'
              }
            ],
            required: true
          }
        },
        branches: {
          'initial': {
            response: "Got it. Let me help you with the next steps.",
            storeAs: 'replacement.status',
            nextBranch: 'replacement-action'
          },
          'replacement-action': {
            response: "Let's document what we know and create an action plan.",
            buttons: [
              { label: 'Continue', value: 'continue', 'label-background': 'bg-blue-600', 'label-text': 'text-white' }
            ],
            nextBranches: {
              'continue': 'proceed-to-health'
            }
          },
          'proceed-to-health': {
            response: "Now let's review {{customer.name}}'s overall account health.",
            actions: ['nextSlide']
          }
        }
      },
      artifacts: {
        sections: [
          {
            id: 'replacement-notes',
            title: 'Replacement Contact Search',
            type: 'document',
            visible: true,
            data: {
              sections: [
                {
                  heading: 'Departed Executive',
                  content: [
                    'Name: {{departed_contact.name}}',
                    'Title: {{departed_contact.title}}',
                    'Departure Date: {{departed_contact.departure_date}}'
                  ]
                },
                {
                  heading: 'Known Stakeholders',
                  content: [
                    'Review all contacts at {{customer.name}}',
                    'Check LinkedIn for org changes',
                    'Ask champion for introduction'
                  ]
                }
              ]
            }
          }
        ]
      }
    },

    // SLIDE 3: Account Health Review
    {
      id: 'account-health',
      slideNumber: 3,
      title: 'Account Health Review',
      description: 'Review overall account status',
      label: 'Review Health',
      stepMapping: 'health',
      chat: {
        initialMessage: {
          text: "Here's {{customer.name}}'s current account health. Review the metrics on the right and let me know if you see any additional concerns.",
          buttons: [
            { label: 'Looks Good', value: 'healthy', 'label-background': 'bg-green-600', 'label-text': 'text-white' },
            { label: 'Some Concerns', value: 'concerns', 'label-background': 'bg-orange-600', 'label-text': 'text-white' },
            { label: 'Critical Issues', value: 'critical', 'label-background': 'bg-red-600', 'label-text': 'text-white' },
          ],
          nextBranches: {
            'healthy': 'health-good',
            'concerns': 'health-concerns',
            'critical': 'health-critical',
          }
        },
        branches: {
          'health-good': {
            response: "Great! With healthy account metrics, we just need to ensure a smooth transition to the new contact.",
            actions: ['nextSlide']
          },
          'health-concerns': {
            response: "What concerns you most? This will help us prioritize our outreach.",
            storeAs: 'health.status',
            nextBranchOnText: 'concerns-documented',
          },
          'health-critical': {
            response: "This is serious. What critical issues are you seeing? We may need to escalate this.",
            storeAs: 'health.status',
            nextBranchOnText: 'critical-documented',
          },
          'concerns-documented': {
            response: "Thanks for the context. Let's draft a proactive email to address this.",
            storeAs: 'health.concerns',
            actions: ['nextSlide']
          },
          'critical-documented': {
            response: "Understood. We'll make this email a high-priority outreach with your manager CC'd.",
            storeAs: 'health.criticalIssues',
            actions: ['nextSlide']
          }
        }
      },
      artifacts: {
        sections: [
          {
            id: 'account-overview',
            title: '{{customer.name}} - Account Overview',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'AccountOverviewArtifact',
              props: {
                // Will be populated at runtime from customer data
              }
            }
          }
        ]
      }
    },

    // SLIDE 4: Draft Outreach Email
    {
      id: 'draft-email',
      slideNumber: 4,
      title: 'Draft Outreach Email',
      description: 'Compose email to new contact',
      label: 'Draft Email',
      stepMapping: 'email',
      chat: {
        initialMessage: {
          text: "I've drafted an email to help you connect with the new decision-maker at {{customer.name}}. Review it on the right and make any edits you'd like.",
          buttons: [
            { label: 'Looks Good', value: 'approve', 'label-background': 'bg-green-600', 'label-text': 'text-white' },
            { label: 'Need Changes', value: 'edit', 'label-background': 'bg-blue-600', 'label-text': 'text-white' },
          ],
          nextBranches: {
            'approve': 'email-approved',
            'edit': 'email-edit',
          }
        },
        branches: {
          'email-approved': {
            response: "Perfect! I've noted this is ready to send. Next, let's plan the follow-up call.",
            actions: ['nextSlide']
          },
          'email-edit': {
            response: "No problem. Make your edits directly in the email on the right, then click Continue when ready.",
            buttons: [
              { label: 'Continue', value: 'continue', 'label-background': 'bg-blue-600', 'label-text': 'text-white' }
            ],
            nextBranches: {
              'continue': 'email-approved'
            }
          }
        }
      },
      artifacts: {
        sections: [
          {
            id: 'email-draft',
            title: 'Outreach Email',
            type: 'email',
            visible: true,
            editable: true,
            data: {
              componentType: 'EmailArtifact',
              props: {
                to: '{{replacement_contact.email}}',
                subject: 'Continued Partnership with {{customer.name}}',
                body: `Hi {{replacement_contact.name}},

I hope this email finds you well! I wanted to reach out following {{departed_contact.name}}'s departure to ensure a smooth transition in our partnership with {{customer.name}}.

I've been working with your team for the past {{relationship.duration}}, and wanted to introduce myself and make sure you have everything you need from our side. We're currently supporting {{customer.name}} with {{product.description}}, and I'd love to schedule a brief call to:

• Review your current setup and usage
• Ensure you're getting maximum value from our partnership
• Answer any questions about our services
• Discuss any upcoming needs or initiatives

Would you have 20 minutes in the next week or two for a quick call?

Looking forward to connecting,
{{user.name}}`,
                editable: true
              }
            }
          }
        ]
      }
    },

    // SLIDE 5: Schedule Transition Call
    {
      id: 'schedule-call',
      slideNumber: 5,
      title: 'Schedule Transition Call',
      description: 'Plan the introduction call',
      label: 'Schedule Call',
      stepMapping: 'call',
      chat: {
        initialMessage: {
          text: "When do you want to schedule the intro call with {{replacement_contact.name}}?",
          component: {
            type: 'radio',
            id: 'call-timing',
            options: [
              { value: 'asap', label: 'ASAP (within 3 days)', description: 'Urgent - schedule immediately' },
              { value: 'soon', label: 'This week', description: 'Priority - schedule this week' },
              { value: 'next-week', label: 'Next week', description: 'Normal - schedule next week' },
              { value: 'later', label: 'Later', description: 'Will handle manually' },
            ],
            required: true
          }
        },
        branches: {
          'initial': {
            response: "Got it. I'll set a reminder and add this to your task list.",
            storeAs: 'call.timing',
            nextBranch: 'finalize'
          },
          'finalize': {
            response: "Almost done! Let's review everything we've accomplished.",
            actions: ['nextSlide']
          }
        }
      },
      artifacts: {
        sections: [
          {
            id: 'call-prep',
            title: 'Call Preparation Notes',
            type: 'document',
            visible: true,
            data: {
              sections: [
                {
                  heading: 'Call Objectives',
                  content: [
                    'Introduce yourself and your role',
                    'Learn about {{replacement_contact.name}}\'s priorities',
                    'Review current usage and value',
                    'Identify any immediate needs or concerns'
                  ]
                },
                {
                  heading: 'Key Talking Points',
                  content: [
                    '{{customer.name}} has been a valued partner for {{relationship.duration}}',
                    'Current ARR: {{customer.current_arr}}',
                    'Usage highlights: {{usage.highlights}}',
                    'Recent wins: {{customer.recent_wins}}'
                  ]
                }
              ]
            }
          }
        ]
      }
    },

    // SLIDE 6: Summary & Next Steps
    {
      id: 'summary',
      slideNumber: 6,
      title: 'Action Plan Summary',
      description: 'Review actions and next steps',
      label: 'Summary',
      stepMapping: 'summary',
      chat: {
        initialMessage: {
          text: "Great work! Here's everything we've accomplished and your next steps.",
          buttons: [
            { label: 'Complete Workflow', value: 'complete', 'label-background': 'bg-green-600', 'label-text': 'text-white' },
          ],
          nextBranches: {
            'complete': 'workflow-complete',
          }
        },
        branches: {
          'workflow-complete': {
            response: "Workflow completed! The tasks have been added to your queue. Good luck with {{customer.name}}!",
            actions: ['closeWorkflow']
          }
        }
      },
      artifacts: {
        sections: [
          {
            id: 'workflow-summary',
            title: 'Executive Transition Plan - {{customer.name}}',
            type: 'plan-summary',
            visible: true,
            data: {
              componentType: 'PlanSummaryArtifact',
              props: {
                customerName: '{{customer.name}}',
                currentStage: 'Executive Transition',
                progressPercentage: 100,
                completedActions: [
                  'Assessed impact of {{departed_contact.name}}\'s departure',
                  'Identified replacement contact strategy',
                  'Reviewed account health metrics',
                  'Drafted outreach email to new decision-maker',
                  'Planned transition call timing'
                ],
                nextSteps: [
                  {
                    type: 'user',
                    action: 'Send outreach email to {{replacement_contact.name}}',
                    dueDate: 'Today'
                  },
                  {
                    type: 'user',
                    action: 'Schedule intro call within {{call.timing}}',
                    dueDate: '{{call.deadline}}'
                  },
                  {
                    type: 'ai',
                    action: 'Monitor email response and send reminder if needed',
                    dueDate: '3 days'
                  },
                  {
                    type: 'user',
                    action: 'Update CRM with new contact information',
                    dueDate: 'After call'
                  }
                ],
                keyMetrics: {
                  accountARR: '{{customer.current_arr}}',
                  relationshipImpact: '{{assessment.relationshipImpact}}/10',
                  healthStatus: '{{health.status}}',
                  daysToRenewal: '{{customer.days_to_renewal}}'
                },
                recommendations: [
                  'Prioritize building relationship with {{replacement_contact.name}}',
                  'Monitor account health closely for next 30 days',
                  'Consider executive sponsor introduction if high-risk',
                  'Document all interactions in CRM for continuity'
                ]
              }
            }
          }
        ]
      }
    }
  ],

  // Customer overview template
  customerOverviewTemplate: {
    metrics: {
      arr: {
        label: 'ARR',
        valuePath: 'customer.current_arr',
        formatAs: 'currency',
        statusPath: 'customer.arr_status'
      },
      renewalDate: {
        label: 'Renewal',
        valuePath: 'customer.renewal_date',
        formatAs: 'date',
        sublabelPath: 'customer.days_to_renewal',
        statusPath: 'customer.renewal_status'
      },
      healthScore: {
        label: 'Health Score',
        valuePath: 'customer.health_score',
        formatAs: 'number',
        statusPath: 'customer.health_status'
      },
      primaryContact: {
        label: 'New Contact',
        valuePath: 'replacement_contact.name',
        rolePath: 'replacement_contact.title'
      },
      riskScore: {
        label: 'Risk Score',
        valuePath: 'customer.churn_risk_score',
        formatAs: 'number',
        statusPath: 'customer.risk_status'
      },
      relationshipImpact: {
        label: 'Transition Risk',
        valuePath: 'assessment.relationshipImpact',
        formatAs: 'number',
        sublabel: '/10',
        statusPath: 'assessment.impactColor'
      }
    }
  }
};
