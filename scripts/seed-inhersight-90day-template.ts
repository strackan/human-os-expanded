/**
 * Seed InHerSight 90-Day Renewal Template
 *
 * Creates a template for InHerSight's standard 90-day renewal workflow
 * with brand exposure analysis and employer branding metrics
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

const inhersight90DayRenewalTemplate = {
  name: 'inhersight_90day_renewal',
  display_name: 'InHerSight 90-Day Renewal',
  description: 'Standard renewal workflow for InHerSight customers with brand exposure analysis',
  category: 'renewal',
  base_steps: [
    {
      step_id: 'review-performance',
      step_name: 'Review Performance Data',
      step_type: 'analysis',
      description: `Great! Let me pull up {{customer.name}}'s performance data from InHerSight...

Review the brand exposure report to the right. How do the metrics look?`,
      shows_artifacts: ['brand-exposure-report'],
      creates_tasks: [],
      metadata: {
        estimated_minutes: 15,
        requires_ai: false,
        buttons: [
          { label: 'Performance looks good', value: 'continue', 'label-background': 'bg-green-600', 'label-text': 'text-white' },
          { label: 'See concerning trends', value: 'concerns', 'label-background': 'bg-yellow-600', 'label-text': 'text-white' }
        ]
      }
    },
    {
      step_id: 'review-contract',
      step_name: 'Review Contract Terms',
      step_type: 'analysis',
      description: `Let me pull up the contract details for {{customer.name}}...

Review the current package, pricing, and terms. Ready to identify expansion opportunities?`,
      shows_artifacts: ['contract-details'],
      creates_tasks: [],
      metadata: {
        estimated_minutes: 10,
        requires_ai: false,
        buttons: [
          { label: 'Continue to Opportunities', value: 'continue', 'label-background': 'bg-blue-600', 'label-text': 'text-white' }
        ]
      }
    },
    {
      step_id: 'identify-opportunities',
      step_name: 'Identify Opportunities',
      step_type: 'analysis',
      description: `Let me analyze potential expansion opportunities based on their usage patterns and performance...

Review the opportunity analysis and decide on the best approach.`,
      shows_artifacts: ['opportunity-analysis'],
      creates_tasks: [],
      metadata: {
        estimated_minutes: 10,
        requires_ai: true,
        buttons: [
          { label: 'Prepare Meeting Deck', value: 'continue', 'label-background': 'bg-blue-600', 'label-text': 'text-white' }
        ]
      }
    },
    {
      step_id: 'prepare-meeting',
      step_name: 'Prepare Meeting Deck',
      step_type: 'creation',
      description: `Let me prepare a performance review deck for your meeting with {{customer.name}}...

Review the deck and let me know if you need any revisions.`,
      shows_artifacts: ['meeting-deck'],
      creates_tasks: [],
      metadata: {
        estimated_minutes: 20,
        requires_ai: true,
        buttons: [
          { label: 'Deck looks good', value: 'continue', 'label-background': 'bg-green-600', 'label-text': 'text-white' },
          { label: 'Need revisions', value: 'revise', 'label-background': 'bg-yellow-600', 'label-text': 'text-white' }
        ]
      }
    },
    {
      step_id: 'schedule-meeting',
      step_name: 'Schedule Meeting',
      step_type: 'communication',
      description: `Let me draft a meeting request email for you...

Review the email and send it when ready.`,
      shows_artifacts: ['meeting-email'],
      creates_tasks: [],
      metadata: {
        estimated_minutes: 5,
        requires_ai: true,
        buttons: [
          { label: 'Send Email', value: 'continue', 'label-background': 'bg-blue-600', 'label-text': 'text-white' }
        ]
      }
    },
    {
      step_id: 'conduct-meeting',
      step_name: 'Conduct Meeting',
      step_type: 'meeting',
      description: `Great! Email sent to {{customer.primary_contact_name}}.

Once you've held the meeting and gathered feedback, return here to create your renewal recommendation.`,
      shows_artifacts: [],
      creates_tasks: [],
      metadata: {
        estimated_minutes: 60,
        requires_ai: false,
        manual_step: true,
        buttons: [
          { label: 'Meeting Complete', value: 'continue', 'label-background': 'bg-green-600', 'label-text': 'text-white' }
        ]
      }
    },
    {
      step_id: 'create-recommendation',
      step_name: 'Create Recommendation',
      step_type: 'creation',
      description: `Based on the meeting feedback, let me draft a renewal recommendation one-sheeter...

Review the recommendation and approve when ready.`,
      shows_artifacts: ['renewal-recommendation'],
      creates_tasks: [],
      metadata: {
        estimated_minutes: 15,
        requires_ai: true,
        buttons: [
          { label: 'Approve Recommendation', value: 'continue', 'label-background': 'bg-green-600', 'label-text': 'text-white' }
        ]
      }
    },
    {
      step_id: 'send-followup',
      step_name: 'Send Follow-up',
      step_type: 'communication',
      description: `Let me draft a professional follow-up email with your recommendation...

Review and send when ready.`,
      shows_artifacts: ['followup-email'],
      creates_tasks: [],
      metadata: {
        estimated_minutes: 5,
        requires_ai: true,
        buttons: [
          { label: 'Send Follow-up', value: 'continue', 'label-background': 'bg-blue-600', 'label-text': 'text-white' }
        ]
      }
    },
    {
      step_id: 'negotiate',
      step_name: 'Negotiate & Close',
      step_type: 'negotiation',
      description: `Here are your negotiation talking points and pricing flexibility guidelines...

How did the negotiation go?`,
      shows_artifacts: ['negotiation-guide'],
      creates_tasks: [],
      metadata: {
        estimated_minutes: 30,
        requires_ai: false,
        buttons: [
          { label: 'Renewal Closed', value: 'complete', 'label-background': 'bg-green-600', 'label-text': 'text-white' },
          { label: 'Still Negotiating', value: 'continue', 'label-background': 'bg-yellow-600', 'label-text': 'text-white' }
        ]
      }
    }
  ],
  base_artifacts: [
    {
      artifact_id: 'brand-exposure-report',
      artifact_name: 'Brand Exposure Report',
      artifact_type: 'brand-exposure-report',
      component_id: 'artifact.brand-exposure',
      config: {
        // Config will be populated dynamically from customer data
        title: '{{customer.name}} - Brand Performance Report',
        period: 'Last 30 days',
        health_score: '{{customer.health_score}}',
        metrics: {
          brand_impressions: '{{customer.brand_impressions}}',
          impressions_trend: '{{customer.impressions_trend}}',
          profile_views: '{{customer.profile_views}}',
          views_trend: '{{customer.views_trend}}',
          profile_completion: '{{customer.profile_completion_pct}}',
          job_matches: '{{customer.job_matches}}',
          apply_clicks: '{{customer.apply_clicks}}',
          clicks_trend: '{{customer.clicks_trend}}',
          click_rate: '{{customer.apply_click_rate}}',
          article_inclusions: '{{customer.article_inclusions}}',
          social_mentions: '{{customer.social_mentions}}',
          new_ratings: '{{customer.new_ratings}}',
          follower_growth: '{{customer.follower_growth}}'
        }
      }
    },
    {
      artifact_id: 'contract-details',
      artifact_name: 'Contract Review',
      artifact_type: 'contract',
      component_id: 'artifact.contract',
      config: {
        contractId: '{{contract.contract_number}}',
        customerName: '{{customer.name}}',
        contractValue: '{{contract.arr}}',
        renewalDate: '{{contract.end_date}}',
        productMix: '{{contract.product_mix}}',
        terms: {
          renewal: '{{contract.renewal_terms}}',
          pricing: '{{contract.pricing_terms}}',
          other: '{{contract.other_terms}}'
        }
      }
    },
    {
      artifact_id: 'opportunity-analysis',
      artifact_name: 'Expansion Opportunity Analysis',
      artifact_type: 'pricing-analysis',
      component_id: 'artifact.pricing-analysis',
      config: {
        currentARR: '{{customer.current_arr}}',
        currentPricePerSeat: '{{customer.price_per_seat}}',
        proposedARR: '{{customer.recommended_arr}}',
        proposedPricePerSeat: '{{customer.recommended_price_per_seat}}',
        increasePercentage: '{{customer.expansion_pct}}',
        increaseAmount: '{{customer.expansion_amount}}',
        justification: [
          '{{customer.expansion_reason_1}}',
          '{{customer.expansion_reason_2}}',
          '{{customer.expansion_reason_3}}'
        ],
        marketPercentile: {
          current: '{{customer.current_market_percentile}}',
          proposed: '{{customer.proposed_market_percentile}}'
        }
      }
    },
    {
      artifact_id: 'meeting-deck',
      artifact_name: 'Performance Review Deck',
      artifact_type: 'document',
      config: {
        title: '{{customer.name}} - Quarterly Performance Review',
        content: '{{customer.meeting_deck_content}}',
        editable: true
      }
    },
    {
      artifact_id: 'meeting-email',
      artifact_name: 'Meeting Request Email',
      artifact_type: 'email',
      component_id: 'artifact.email',
      config: {
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
{{user.first}}`
      }
    },
    {
      artifact_id: 'renewal-recommendation',
      artifact_name: 'Renewal Recommendation',
      artifact_type: 'document',
      config: {
        title: '{{customer.name}} - Renewal Recommendation',
        content: '{{customer.renewal_recommendation_content}}',
        editable: true
      }
    },
    {
      artifact_id: 'followup-email',
      artifact_name: 'Follow-up Email',
      artifact_type: 'email',
      component_id: 'artifact.email',
      config: {
        to: '{{customer.primary_contact_email}}',
        subject: '{{customer.name}} - Renewal Recommendation & Next Steps',
        body: '{{customer.followup_email_content}}'
      }
    },
    {
      artifact_id: 'negotiation-guide',
      artifact_name: 'Negotiation Guide',
      artifact_type: 'document',
      config: {
        title: 'Negotiation Talking Points',
        content: '{{customer.negotiation_guide_content}}',
        editable: false
      }
    },
    {
      artifact_id: 'workflow-summary',
      artifact_name: 'Renewal Workflow Summary',
      artifact_type: 'workflow-summary',
      component_id: 'artifact.summary',
      config: {
        tasksInitiated: [
          { id: '1', title: 'Performance data analyzed', completed: true, timestamp: 'Just now', assignee: 'AI' },
          { id: '2', title: 'Contract terms reviewed', completed: true, timestamp: 'Just now', assignee: 'AI' },
          { id: '3', title: 'Expansion opportunities identified', completed: true, timestamp: 'Just now', assignee: 'AI' },
          { id: '4', title: 'Meeting materials prepared', completed: true, timestamp: 'Just now', assignee: 'AI' },
          { id: '5', title: 'Meeting request sent', completed: true, timestamp: 'Just now', assignee: 'AI' }
        ],
        accomplishments: [
          'Completed performance analysis for {{customer.name}}',
          'Identified expansion opportunities worth {{customer.expansion_amount}}',
          'Prepared professional meeting deck and materials',
          'Drafted personalized outreach and follow-up emails',
          'Created negotiation strategy and talking points'
        ],
        nextSteps: [
          { id: '1', title: 'Conduct renewal meeting', description: '30-min performance review call', dueDate: 'This week', type: 'user' },
          { id: '2', title: 'Send follow-up email', description: 'Share recommendation after meeting', dueDate: 'After meeting', type: 'user' },
          { id: '3', title: 'Negotiate terms', description: 'Work through pricing and contract details', dueDate: 'Within 2 weeks', type: 'user' }
        ],
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        salesforceUpdated: true,
        trackingEnabled: true
      }
    }
  ]
};

async function seedTemplate() {
  console.log('Seeding inhersight_90day_renewal template...');

  // Check if template already exists
  const { data: existing } = await supabase
    .from('workflow_templates')
    .select('id')
    .eq('name', 'inhersight_90day_renewal')
    .single();

  if (existing) {
    console.log('Template already exists, deleting...');
    await supabase
      .from('workflow_templates')
      .delete()
      .eq('name', 'inhersight_90day_renewal');
  }

  // Insert template
  const { data, error } = await supabase
    .from('workflow_templates')
    .insert(inhersight90DayRenewalTemplate)
    .select()
    .single();

  if (error) {
    console.error('Error seeding template:', error);
    process.exit(1);
  }

  console.log('✅ Successfully seeded inhersight_90day_renewal template');
  console.log('Template ID:', data.id);
  console.log('Steps:', data.base_steps.length);
  console.log('Artifacts:', data.base_artifacts.length);
}

seedTemplate();
