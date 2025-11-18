/**
 * Seed Obsidian Black Renewal Template
 *
 * Creates a template that matches the 6-step Obsidian Black renewal workflow
 * for incremental migration from v1.8 to v1.9
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const obsidianBlackRenewalTemplate = {
  name: 'obsidian_black_renewal',
  display_name: 'Obsidian Black Renewal',
  description: 'Premium renewal workflow matching Obsidian Black v1.8 structure',
  category: 'renewal',
  base_steps: [
    {
      step_id: 'greeting',
      step_name: 'Start',
      step_type: 'intro',
      description: `Good afternoon, Justin. You've got one critical task for today:

**Renewal Planning for {{customer.name}}.**

We need to review contract terms, make sure we've got the right contacts, and put our initial forecast in.

The full plan is on the right. Ready to get started?`,
      shows_artifacts: ['planning-checklist'],
      creates_tasks: [],
      metadata: {
        estimated_minutes: 1,
        requires_ai: false,
        purpose: 'renewal_preparation',
        urgency: 'critical',
        buttons: [
          { label: 'Review Later', value: 'snooze', 'label-background': 'bg-gray-500', 'label-text': 'text-white' },
          { label: "Let's Begin!", value: 'start', 'label-background': 'bg-blue-600', 'label-text': 'text-white' }
        ],
        checklist_items: [
          'Review account health and contract details',
          'Analyze current pricing vs. market benchmarks',
          'Generate optimized renewal quote',
          'Draft personalized outreach email',
          'Create action plan and next steps'
        ]
      }
    },
    {
      step_id: 'review-account',
      step_name: 'Account Overview',
      step_type: 'analysis',
      description: `Please review {{customer.name}}'s current status to the right:

**Key Insights:**
• 20% usage increase over prior month
• 4 months to renewal - time to engage
• Paying less per unit than 65% of customers - Room for expansion
• Recent negative comments in support - May need to investigate
• Key contract items - 5% limit on price increases. Consider amendment.

Make sure you've reviewed the contract and stakeholder. When you're ready, click to move onto pricing.`,
      shows_artifacts: ['account-overview'],
      creates_tasks: [],
      metadata: {
        estimated_minutes: 5,
        requires_ai: false,
        ask_for_assessment: false,
        focus_metrics: ['arr', 'price_per_seat', 'renewal_date', 'health_score', 'utilization', 'yoy_growth'],
        buttons: [
          { label: 'Analyze Pricing Strategy', value: 'continue', 'label-background': 'bg-blue-600', 'label-text': 'text-white' }
        ]
      }
    },
    {
      step_id: 'pricing-analysis',
      step_name: 'Pricing Analysis',
      step_type: 'analysis',
      description: 'Review the pricing analysis below and confirm the strategy looks sound.',
      shows_artifacts: ['pricing-analysis'],
      creates_tasks: [],
      metadata: {
        estimated_minutes: 3,
        requires_ai: true,
        buttons: [
          { label: 'Draft The Quote', value: 'continue', 'label-background': 'bg-blue-600', 'label-text': 'text-white' },
          { label: 'Adjust Strategy', value: 'adjust', 'label-background': 'bg-gray-500', 'label-text': 'text-white' }
        ]
      }
    },
    {
      step_id: 'prepare-quote',
      step_name: 'Renewal Quote',
      step_type: 'creation',
      description: 'Review the quote below. When ready, proceed to draft the email.',
      shows_artifacts: ['quote'],
      creates_tasks: [],
      metadata: {
        estimated_minutes: 2,
        requires_ai: true,
        buttons: [
          { label: 'Draft Email To Marcus', value: 'continue', 'label-background': 'bg-blue-600', 'label-text': 'text-white' }
        ]
      }
    },
    {
      step_id: 'draft-email',
      step_name: 'Email Draft',
      step_type: 'communication',
      description: 'Review the email draft below. Make any edits you want, then proceed to finish up.',
      shows_artifacts: ['email-draft'],
      creates_tasks: [],
      metadata: {
        estimated_minutes: 2,
        requires_ai: true,
        buttons: [
          { label: 'Looks Good - Finish Up', value: 'continue', 'label-background': 'bg-blue-600', 'label-text': 'text-white' }
        ]
      }
    },
    {
      step_id: 'workflow-summary',
      step_name: 'Summary & Next Steps',
      step_type: 'summary',
      description: `Great work! Here's a summary of everything we accomplished together:\n\n• Reviewed account health and contract details\n• Analyzed pricing strategy and market positioning\n• Generated optimized renewal quote\n• Drafted personalized outreach email\n\nAll tasks are tracked in your CRM. Ready to send the email?`,
      shows_artifacts: ['workflow-summary'],
      creates_tasks: [],
      metadata: {
        estimated_minutes: 1,
        requires_ai: false,
        buttons: [
          { label: 'Complete', value: 'complete', 'label-background': 'bg-green-600', 'label-text': 'text-white' }
        ]
      }
    }
  ],
  base_artifacts: [
    {
      artifact_id: 'planning-checklist',
      artifact_name: 'Planning Checklist',
      artifact_type: 'planning-checklist',
      config: {
        title: "Here's what we'll accomplish together:",
        items: [] // Will be populated from step metadata
      }
    },
    {
      artifact_id: 'account-overview',
      artifact_name: 'Account Overview',
      artifact_type: 'account-overview',
      config: {
        focus_metrics: ['arr', 'price_per_seat', 'renewal_date', 'health_score', 'utilization', 'yoy_growth']
      }
    },
    {
      artifact_id: 'pricing-analysis',
      artifact_name: 'Pricing Analysis',
      artifact_type: 'pricing-analysis',
      component_id: 'artifact.pricing-analysis',
      config: {
        currentARR: 185000,
        currentPricePerSeat: 3700,
        proposedARR: 199800,
        proposedPricePerSeat: 3996,
        increasePercentage: 8,
        increaseAmount: 14800,
        marketPercentile: { current: 35, proposed: 50 },
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
    },
    {
      artifact_id: 'quote',
      artifact_name: 'Renewal Quote',
      artifact_type: 'quote',
      component_id: 'artifact.quote',
      config: {
        quoteNumber: 'Q-2025-OB-001',
        quoteDate: new Date().toLocaleDateString(),
        customerName: 'Obsidian Black',
        customerContact: {
          name: 'Marcus Chen',
          title: 'VP Engineering',
          email: 'marcus.chen@obsidianblack.com'
        },
        customerAddress: {
          street: '1234 Technology Drive',
          city: 'San Francisco',
          state: 'CA',
          zip: '94105'
        },
        lineItems: [
          {
            product: 'Renubu Platform License',
            description: 'Current annual subscription (50 seats)',
            period: '12 months',
            rate: 3700,
            quantity: 50
          },
          {
            product: 'Market Alignment Adjustment',
            description: 'Price adjustment to market average (+8%)',
            period: '12 months',
            rate: 296,
            quantity: 50
          }
        ],
        pricing: {
          subtotal: 199800,
          increase: { percentage: 8, amount: 14800 },
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
    },
    {
      artifact_id: 'email-draft',
      artifact_name: 'Email to Marcus Chen',
      artifact_type: 'email',
      component_id: 'artifact.email',
      config: {
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
    },
    {
      artifact_id: 'workflow-summary',
      artifact_name: 'Pricing Optimization Summary',
      artifact_type: 'workflow-summary',
      component_id: 'artifact.summary',
      config: {
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
          { id: '1', title: 'Send renewal quote email to Marcus', description: 'Automated email with quote attachment and meeting request', dueDate: 'Tomorrow', type: 'ai' },
          { id: '2', title: 'Update CRM with pricing strategy', description: 'All analysis and quote data synced to Salesforce automatically', dueDate: 'Today', type: 'ai' },
          { id: '3', title: 'Set 3-day follow-up reminder', description: "I'll remind you to check on Marcus's response", dueDate: 'In 3 days', type: 'ai' },
          { id: '4', title: 'Schedule renewal discussion with Marcus', description: '30-min call to present pricing strategy and discuss 2025 roadmap', dueDate: 'This week', type: 'user' },
          { id: '5', title: 'Review pricing justification before call', description: 'Refresh on key talking points: 87% utilization, market positioning', dueDate: 'Before call', type: 'user' }
        ],
        followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        salesforceUpdated: true,
        trackingEnabled: true
      }
    }
  ]
};

async function seedTemplate() {
  console.log('Seeding obsidian_black_renewal template...');

  // Check if template already exists
  const { data: existing } = await supabase
    .from('workflow_templates')
    .select('id')
    .eq('name', 'obsidian_black_renewal')
    .single();

  if (existing) {
    console.log('Template already exists, deleting...');
    await supabase
      .from('workflow_templates')
      .delete()
      .eq('name', 'obsidian_black_renewal');
  }

  // Insert template
  const { data, error } = await supabase
    .from('workflow_templates')
    .insert(obsidianBlackRenewalTemplate)
    .select()
    .single();

  if (error) {
    console.error('Error seeding template:', error);
    process.exit(1);
  }

  console.log('✅ Successfully seeded obsidian_black_renewal template');
  console.log('Template ID:', data.id);
  console.log('Steps:', data.base_steps.length);
  console.log('Artifacts:', data.base_artifacts.length);
}

seedTemplate();
