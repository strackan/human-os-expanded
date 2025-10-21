/**
 * Obsidian Black Pricing Optimization Workflow Configuration
 *
 * Demo workflow for 1-minute product demonstration.
 * Showcases "ONE critical task" value proposition with pricing optimization focus.
 *
 * Flow: Greeting → Account Overview → Pricing Analysis (HERO) → Quote → Email → Summary
 * Key Feature: Editable QuoteArtifact with inline text editing and color customization
 */

import { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';
import { getTimeBasedGreeting } from '@/lib/constants';

// Dynamic config that includes time-based greeting
const createConfig = (): WorkflowConfig => {
  const greeting = getTimeBasedGreeting();

  return {
  customer: {
    name: 'Obsidian Black',
  },

  layout: {
    modalDimensions: {
      width: 90,
      height: 90,
      top: 5,
      left: 5
    },
    dividerPosition: 50,
    chatWidth: 50,
    splitModeDefault: true,
  },

  customerOverview: {
    metrics: {
      arr: { label: 'ARR', value: '$185K', status: 'orange' },
      licenseUnitPrice: { label: 'Price/Seat', value: '$3,700', status: 'red', sublabel: '35th percentile' },
      renewalDate: { label: 'Renewal', value: 'Apr 15, 2025', sublabel: '4 months out', status: 'orange' },
      primaryContact: { label: 'Primary Contact', value: 'Marcus Chen', role: 'VP Engineering' },
      riskScore: { label: 'Risk Score', value: 'Low', status: 'green' },
      growthScore: { label: 'Growth Score', value: 'High', status: 'green' },
      yoyGrowth: { label: 'YoY Growth', value: '+23%', status: 'green' },
      lastMonth: { label: 'Last Month', value: 'Active' }
    }
  },

  analytics: {
    usageTrend: {
      title: 'Usage Trend',
      showReferenceLine: true,
      referenceLineLabel: 'License Capacity',
      referenceLineHeight: 100,
      data: [65, 68, 70, 73, 75, 78, 80, 82, 85, 87, 87, 87, 87, 87, 87, 87, 87, 87],
      chartContextLabel: '↗ Stable at 87% capacity',
      chartContextColor: 'text-green-600',
      dataColors: { threshold: 100, belowColor: 'bg-blue-500', aboveColor: 'bg-red-500' }
    },
    userLicenses: {
      title: 'User Licenses',
      showReferenceLine: false,
      referenceLineLabel: '',
      data: [50],
      chartContextLabel: '50 of 50 licenses',
      chartContextColor: 'text-green-600',
      dataColors: { threshold: 100, belowColor: 'bg-blue-500', aboveColor: 'bg-red-500' }
    },
    renewalInsights: {
      renewalStage: 'negotiation',
      confidence: 85,
      recommendedAction: 'Proceed with pricing increase',
      keyReasons: []
    }
  },

  chat: {
    placeholder: 'Ask me anything about this pricing opportunity...',
    aiGreeting: "Good morning! Your ONE critical task today: Optimize pricing for {{customerName}}'s upcoming renewal. They're significantly underpriced and now is the perfect time to act.",
    features: {
      attachments: false,
      voiceRecording: false,
      designMode: false,
      editMode: false,
      artifactsToggle: true
    }
  },

  artifacts: {
    sections: []
  },

  slides: [
    {
      id: 'greeting',
      slideNumber: 1,
      title: 'Today\'s Critical Task',
      description: 'Pricing optimization for Obsidian Black',
      label: 'Start',
      stepMapping: 'greeting',
      chat: {
        initialMessage: {
          text: `${greeting}, Justin. You've got one critical task for today:\n\n**Renewal Planning for {{customerName}}.**\n\nWe need to review contract terms, make sure we've got the right contacts, and put our initial forecast in.\n\nThe full plan is on the right. Ready to get started?`,
          buttons: [
            { label: 'Review Later', value: 'snooze', 'label-background': 'bg-gray-500', 'label-text': 'text-white' },
            { label: "Let's Begin!", value: 'start', 'label-background': 'bg-blue-600', 'label-text': 'text-white' }
          ]
        },
        branches: {
          'start': {
            response: "Perfect! Let's start by reviewing {{customerName}}'s current state.",
            delay: 1,
            actions: ['nextSlide']
          },
          'snooze': {
            response: "No problem. I'll remind you tomorrow about this pricing opportunity.",
            actions: ['closeWorkflow']
          }
        }
      },
      artifacts: {
        sections: [
          {
            id: 'planning-checklist',
            title: 'Pricing Optimization Plan',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'PlanningChecklistArtifact',
              props: {
                title: "Here's what we'll accomplish together:",
                items: [
                  { id: '1', label: 'Review account health and contract details', completed: false },
                  { id: '2', label: 'Analyze current pricing vs. market benchmarks', completed: false },
                  { id: '3', label: 'Generate optimized renewal quote', completed: false },
                  { id: '4', label: 'Draft personalized outreach email', completed: false },
                  { id: '5', label: 'Create action plan and next steps', completed: false }
                ],
                showActions: false
              }
            }
          }
        ]
      }
    },
    {
      id: 'account-overview',
      slideNumber: 2,
      title: 'Account Overview',
      description: 'Current metrics and positioning',
      label: 'Account Overview',
      stepMapping: 'account-overview',
      chat: {
        initialMessage: {
          text: "Please review {{customerName}}'s current status to the right:\n\n**Key Insights:**\n• 20% usage increase over prior month\n• 4 months to renewal - time to engage\n• Paying less per unit than 65% of customers - Room for expansion\n• Recent negative comments in support - May need to investigate\n• Key contract items - 5% limit on price increases. Consider amendment.\n\nMake sure you've reviewed the contract and stakeholder. When you're ready, click to move onto pricing.",
          buttons: [
            { label: 'Analyze Pricing Strategy', value: 'continue', 'label-background': 'bg-blue-600', 'label-text': 'text-white' }
          ],
          nextBranches: {
            'continue': 'continue'
          }
        },
        branches: {
          'continue': {
            response: "Great! Let me analyze the optimal pricing strategy...",
            delay: 2,
            actions: ['nextSlide']
          }
        }
      },
      artifacts: {
        sections: [
          {
            id: 'account-metrics',
            title: 'Account Metrics',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'AccountOverviewArtifact',
              props: {
                customerName: 'Obsidian Black',
                metrics: {
                  arr: { label: 'ARR', value: '$185K', status: 'yellow' },
                  licenseUnitPrice: { label: 'Price/Seat', value: '$3,700', status: 'red', sublabel: '35th percentile' },
                  renewalDate: { label: 'Renewal', value: 'Apr 15, 2025', sublabel: '4 months out', status: 'yellow' },
                  primaryContact: { label: 'Primary Contact', value: 'Marcus Chen', role: 'VP Engineering' },
                  healthScore: { label: 'Health Score', value: '87%', status: 'green' },
                  utilization: { label: 'Utilization', value: '87%', status: 'green' },
                  yoyGrowth: { label: 'YoY Growth', value: '+23%', status: 'green' }
                }
              }
            }
          }
        ]
      }
    },
    {
      id: 'pricing-analysis',
      slideNumber: 3,
      title: 'Pricing Analysis',
      description: 'Recommended pricing strategy',
      label: 'Pricing Analysis',
      stepMapping: 'pricing-analysis',
      chat: {
        initialMessage: {
          text: "**Pricing Analysis Complete!**\n\n**My Recommendation: +8% increase to $199,800 ARR**\n\n**Why this works:**\n• Brings them to 50th percentile (market average)\n• Justifiable by strong usage (87% utilization)\n• Well within healthy relationship tolerance\n• Perfectly timed at 4 months before renewal\n\n**The math:**\n• Current: $185,000 ARR ($3,700/seat × 50 seats)\n• Proposed: $199,800 ARR ($3,996/seat × 50 seats)\n• Increase: $14,800 annually ($296/seat)\n\nReview the detailed analysis on the right, then we'll draft the quote.",
          buttons: [
            { label: 'Draft The Quote', value: 'continue', 'label-background': 'bg-blue-600', 'label-text': 'text-white' },
            { label: 'Adjust Strategy', value: 'adjust', 'label-background': 'bg-gray-500', 'label-text': 'text-white' }
          ],
          nextBranches: {
            'continue': 'continue',
            'adjust': 'adjust'
          }
        },
        branches: {
          'continue': {
            response: "Perfect! Let me generate the renewal quote...",
            delay: 1,
            actions: ['nextSlide']
          },
          'adjust': {
            response: "Sure! What would you like to adjust? I can help you model different scenarios.",
            nextBranchOnText: 'handle-adjustment'
          },
          'handle-adjustment': {
            response: "Got it. Let me update the analysis with your input.",
            storeAs: 'pricing.adjustmentNotes',
            delay: 1,
            actions: ['nextSlide']
          }
        }
      },
      artifacts: {
        sections: [
          {
            id: 'pricing-analysis',
            title: 'Pricing Analysis',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'PricingAnalysisArtifact',
              props: {
                currentARR: 185000,
                currentPricePerSeat: 3700,
                proposedARR: 199800,
                proposedPricePerSeat: 3996,
                increasePercentage: 8,
                increaseAmount: 14800,
                marketPercentile: {
                  current: 35,
                  proposed: 50
                },
                justification: [
                  'Strong product utilization (87% capacity)',
                  'Healthy customer relationship (87% health score)',
                  'Market-aligned pricing (moving to 50th percentile)',
                  'Optimal timing (4 months before renewal)'
                ],
                risks: [
                  { level: 'low', description: 'Price sensitivity - strong relationship mitigates risk' },
                  { level: 'low', description: 'Competitive alternatives - high switching costs' }
                ]
              }
            }
          }
        ]
      }
    },
    {
      id: 'renewal-quote',
      slideNumber: 4,
      title: 'Renewal Quote',
      description: 'Generate renewal quote document',
      label: 'Quote',
      stepMapping: 'renewal-quote',
      chat: {
        initialMessage: {
          text: "**Quote Generated!**\n\nI've prepared a renewal quote for {{customerName}} on the right.\n\n**Here's the magic:** This isn't a static PDF. You can:\n• **Double-click any text** to edit it inline\n• **Click the table rows** to change background colors\n• Customize it for your customer's brand\n\nTry editing the product description or changing the header color. When you're ready, we'll draft the email to Marcus.",
          buttons: [
            { label: 'Draft Email To Marcus', value: 'continue', 'label-background': 'bg-blue-600', 'label-text': 'text-white' }
          ],
          nextBranches: {
            'continue': 'continue'
          }
        },
        branches: {
          'continue': {
            response: "Perfect! Let me draft a personalized email to Marcus Chen...",
            delay: 1,
            actions: ['nextSlide']
          }
        }
      },
      artifacts: {
        sections: [
          {
            id: 'renewal-quote',
            title: 'Renewal Quote',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'QuoteArtifact',
              props: {
                quoteNumber: 'Q-2025-OB-001',
                quoteDate: new Date().toLocaleDateString(),
                customerName: 'Obsidian Black',
                customerContact: {
                  name: 'Marcus Chen',
                  title: 'VP Engineering',
                  email: 'marcus.chen@obsidianblack.com'
                },
                customerAddress: {
                  company: 'Obsidian Black',
                  street: '450 Market Street, Suite 2000',
                  city: 'San Francisco',
                  state: 'CA',
                  zip: '94111'
                },
                companyInfo: {
                  name: 'Renubu',
                  tagline: 'AI-Powered Customer Success Platform',
                  address: {
                    street: '1247 Innovation Drive, Suite 400',
                    city: 'San Francisco',
                    state: 'CA',
                    zip: '94105'
                  },
                  email: 'quotes@renubu.com'
                },
                lineItems: [
                  {
                    product: 'Renubu Platform License',
                    description: 'Enterprise AI-powered customer success automation with predictive analytics',
                    period: '12 months',
                    rate: 3996,
                    quantity: 50
                  }
                ],
                summary: {
                  subtotal: 199800,
                  increase: {
                    percentage: 8,
                    amount: 14800
                  },
                  total: 199800
                },
                terms: [
                  'Net 30 payment terms',
                  'Annual contract commitment',
                  'Includes premium support and quarterly business reviews'
                ],
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                readOnly: false
              }
            }
          }
        ]
      }
    },
    {
      id: 'compose-email',
      slideNumber: 5,
      title: 'Email Draft',
      description: 'Draft renewal discussion email',
      label: 'Email',
      stepMapping: 'compose-email',
      chat: {
        initialMessage: {
          text: "**Email Draft Ready!**\n\nI've drafted a personalized email to Marcus Chen about the renewal discussion. It:\n• References their strong usage and growth\n• Positions the pricing as market-aligned\n• Suggests a call to discuss their roadmap\n• Attaches the quote for transparency\n\nReview it on the right, edit if needed, then we'll wrap up.",
          buttons: [
            { label: 'Looks Good - Finish Up', value: 'continue', 'label-background': 'bg-blue-600', 'label-text': 'text-white' }
          ],
          nextBranches: {
            'continue': 'continue'
          }
        },
        branches: {
          'continue': {
            response: "Great! Let me summarize what we've accomplished...",
            delay: 1,
            actions: ['nextSlide']
          }
        }
      },
      artifacts: {
        sections: [
          {
            id: 'email-draft',
            title: 'Email to Marcus Chen',
            type: 'custom',
            visible: true,
            data: {
              componentType: 'EmailArtifact',
              props: {
                to: 'marcus.chen@obsidianblack.com',
                cc: '',
                subject: 'Obsidian Black Renewal - April 2025',
                body: `Hi Marcus,

I hope you're doing well! I wanted to reach out proactively about Obsidian Black's upcoming renewal in April.

First, congratulations on the strong adoption - you're at 87% platform utilization with consistent growth. The team is clearly getting value from Renubu.

**Looking Ahead:**
As we approach renewal, I've prepared a quote that reflects market-standard pricing for your usage level. This brings Obsidian Black to the 50th percentile - right at the industry average for companies with your profile.

The proposed renewal is $199,800 annually ($3,996/seat for 50 seats), which represents an 8% adjustment from your current rate.

**Next Steps:**
I'd love to schedule a 30-minute call to:
• Discuss your roadmap for 2025
• Review the pricing and answer any questions
• Explore additional features that could support your growth

I've attached the formal quote for your review. Let me know what works for your calendar!

Best,
<User.First>

---
*Quote attached: Q-2025-OB-001*`,
                attachments: ['Q-2025-OB-001.pdf']
              }
            }
          }
        ]
      }
    },
    {
      id: 'plan-summary',
      slideNumber: 6,
      title: 'Summary',
      description: 'Plan summary and next steps',
      label: 'Summary',
      stepMapping: 'plan-summary',
      chat: {
        initialMessage: {
          text: "**Pricing Optimization Complete!**\n\nYour renewal strategy for {{customerName}} is ready. Review the summary on the right to see:\n• What we accomplished together\n• What I'll handle automatically (CRM updates, reminders)\n• What you need to do (schedule the call with Marcus)\n\nThis is how Renubu works - **ONE critical task, done in under 2 minutes**. No dashboards, no busywork, just the work that matters.",
          buttons: [
            { label: 'Complete', value: 'complete', 'label-background': 'bg-green-600', 'label-text': 'text-white' }
          ],
          nextBranches: {
            'complete': 'complete'
          }
        },
        branches: {
          'complete': {
            response: "Perfect! I'll handle the follow-up and check back in 3 days. Great work!",
            delay: 1,
            actions: ['nextCustomer']
          }
        }
      },
      artifacts: {
        sections: [
          {
            id: 'plan-summary',
            title: 'Pricing Optimization Summary',
            type: 'plan-summary',
            visible: true,
            data: {
              componentType: 'PlanSummaryArtifact',
              tasksInitiated: [
                { id: '1', title: 'Market pricing analysis completed', completed: true, timestamp: 'Just now', assignee: 'AI' },
                { id: '2', title: 'Renewal quote generated (Q-2025-OB-001)', completed: true, timestamp: 'Just now', assignee: 'AI' },
                { id: '3', title: 'Email draft prepared for Marcus', completed: true, timestamp: 'Just now', assignee: 'AI' },
                { id: '4', title: 'CRM updated with renewal strategy', completed: true, timestamp: 'Just now', assignee: 'AI' }
              ],
              accomplishments: [
                'Identified 8% pricing optimization opportunity ($14,800 ARR increase)',
                'Generated market-aligned quote bringing pricing to 50th percentile',
                'Drafted personalized renewal email to Marcus Chen',
                'Established clear justification based on usage and market data'
              ],
              nextSteps: [
                {
                  id: '1',
                  title: 'Send renewal quote email to Marcus',
                  description: 'Automated email with quote attachment and meeting request',
                  dueDate: 'Tomorrow',
                  type: 'ai'
                },
                {
                  id: '2',
                  title: 'Update CRM with pricing strategy',
                  description: 'All analysis and quote data synced to Salesforce automatically',
                  dueDate: 'Today',
                  type: 'ai'
                },
                {
                  id: '3',
                  title: 'Set 3-day follow-up reminder',
                  description: "I'll remind you to check on Marcus's response",
                  dueDate: 'In 3 days',
                  type: 'ai'
                },
                {
                  id: '4',
                  title: 'Schedule renewal discussion with Marcus',
                  description: '30-min call to present pricing strategy and discuss 2025 roadmap',
                  dueDate: 'This week',
                  type: 'user'
                },
                {
                  id: '5',
                  title: 'Review pricing justification before call',
                  description: 'Refresh on key talking points: 87% utilization, market positioning',
                  dueDate: 'Before call',
                  type: 'user'
                }
              ],
              followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }),
              salesforceUpdated: true,
              trackingEnabled: true
            }
          }
        ]
      }
    }
  ],

  sidePanel: {
    enabled: false,
    title: {
      text: 'Pricing Optimization',
      subtitle: 'Obsidian Black Renewal'
    },
    steps: [],
    progressMeter: {
      currentStep: 1,
      totalSteps: 6,
      progressPercentage: 16
    }
  }
  };
};

// Export the config as a result of calling the function
export const obsidianBlackPricingConfig = createConfig();
