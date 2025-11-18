/**
 * Seed InHerSight 120-Day At-Risk Modification
 *
 * Creates a workflow modification that adds "Freebie Intervention" steps
 * to convert the 90-day renewal workflow into a 120-day at-risk recovery workflow
 *
 * This tests the modification system: Base template (9 steps) + modification (3 steps) = 12 steps
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

async function seedAtRiskModification() {
  console.log('Seeding InHerSight 120-day at-risk modification...');

  // Get the 90-day template ID
  const { data: template, error: templateError } = await supabase
    .from('workflow_templates')
    .select('id')
    .eq('name', 'inhersight_90day_renewal')
    .single();

  if (templateError || !template) {
    console.error('Error finding 90-day template:', templateError);
    process.exit(1);
  }

  console.log('Found 90-day template:', template.id);

  // Delete existing modification if it exists
  const { error: deleteError } = await supabase
    .from('workflow_modifications')
    .delete()
    .eq('reason', 'Adds freebie intervention strategy for at-risk customers');

  if (deleteError) {
    console.log('Note: No existing modification to delete');
  }

  // For add_step, we need to add each step separately since it's singular
  // But we'll add them as a batch with a combined modification_data structure
  const modification = {
    workflow_template_id: template.id,
    modification_type: 'add_step',
    scope_type: 'global', // Apply to all InHerSight workflows
    scope_id: null,
    scope_criteria: {
      risk_score: { $gt: 60 }
    },
    priority: 100,
    target_step_id: 'identify-opportunities', // Insert after this step
    target_position: 3, // After step 2 (identify-opportunities is step 2, so position 3 for insertion)
    reason: 'Adds freebie intervention strategy for at-risk customers',
    modification_data: {
      steps: [
        {
          step_id: 'prepare-freebie',
          step_name: 'Prepare Freebie Offer',
          step_type: 'creation',
          description: `Let me recommend a freebie opportunity based on their concerns and profile...

Choose the best freebie to demonstrate value and rebuild trust.`,
          shows_artifacts: ['freebie-options'],
          creates_tasks: [],
          metadata: {
            estimated_minutes: 15,
            requires_ai: true,
            buttons: [
              { label: 'Featured article placement', value: 'article', 'label-background': 'bg-blue-600', 'label-text': 'text-white' },
              { label: 'Profile optimization session', value: 'profile', 'label-background': 'bg-purple-600', 'label-text': 'text-white' },
              { label: 'Social media campaign', value: 'social', 'label-background': 'bg-pink-600', 'label-text': 'text-white' },
              { label: 'Premium job posting credits', value: 'jobs', 'label-background': 'bg-green-600', 'label-text': 'text-white' }
            ]
          }
        },
        {
          step_id: 'deliver-freebie',
          step_name: 'Deliver Freebie',
          step_type: 'action',
          description: `Perfect! You've selected the freebie.

Now execute the delivery and track the results. Mark complete when delivered.`,
          shows_artifacts: ['freebie-delivery-plan'],
          creates_tasks: [],
          metadata: {
            estimated_minutes: 120,
            requires_ai: false,
            manual_step: true,
            buttons: [
              { label: 'Freebie Delivered', value: 'continue', 'label-background': 'bg-green-600', 'label-text': 'text-white' }
            ]
          }
        },
        {
          step_id: 'measure-impact',
          step_name: 'Measure Freebie Impact',
          step_type: 'analysis',
          description: `Great! Let me pull the performance data to measure the freebie's impact...

Review the impact metrics and prepare to use these results in your renewal pitch.`,
          shows_artifacts: ['freebie-impact-report'],
          creates_tasks: [],
          metadata: {
            estimated_minutes: 10,
            requires_ai: true,
            buttons: [
              { label: 'Continue to Renewal Meeting', value: 'continue', 'label-background': 'bg-blue-600', 'label-text': 'text-white' }
            ]
          }
        }
      ],
      artifacts: [
        {
          artifact_id: 'freebie-options',
          artifact_name: 'Freebie Opportunities',
          artifact_type: 'document',
          config: {
            title: 'Freebie Value-Add Options',
            content: `# At-Risk Recovery: Freebie Intervention

## Recommended Options

### Option 1: Featured Article Placement
**Value**: $1,500-2,000
**Timeline**: 2-3 weeks
**Expected Impact**: Brand impressions +50%, profile views +30%
**Best for**: Visibility concerns

### Option 2: Profile Optimization Session
**Value**: $500-800
**Timeline**: 1 week
**Expected Impact**: Profile completion +40%, engagement +25%
**Best for**: Low engagement

### Option 3: Social Media Campaign
**Value**: $1,000-1,500
**Timeline**: 2 weeks
**Expected Impact**: Follower growth +20%, social mentions +300%
**Best for**: Expanding reach

### Option 4: Premium Job Posting Credits
**Value**: $800-1,200
**Timeline**: Immediate
**Expected Impact**: Job matches +40%, apply clicks +35%
**Best for**: Hiring KPIs

Choose the option that best addresses {{customer.name}}'s primary concerns.`
          }
        },
        {
          artifact_id: 'freebie-delivery-plan',
          artifact_name: 'Freebie Delivery Plan',
          artifact_type: 'document',
          config: {
            title: 'Freebie Execution Plan',
            content: '{{customer.freebie_delivery_plan}}'
          }
        },
        {
          artifact_id: 'freebie-impact-report',
          artifact_name: 'Freebie Impact Report',
          artifact_type: 'brand-exposure-report',
          component_id: 'artifact.brand-exposure',
          config: {
            title: 'Freebie Impact Analysis',
            period: 'Before vs After Freebie',
            comparison_mode: true,
            before_metrics: {
              brand_impressions: '{{customer.brand_impressions_before}}',
              profile_views: '{{customer.profile_views_before}}',
              apply_clicks: '{{customer.apply_clicks_before}}'
            },
            after_metrics: {
              brand_impressions: '{{customer.brand_impressions_after}}',
              profile_views: '{{customer.profile_views_after}}',
              apply_clicks: '{{customer.apply_clicks_after}}'
            },
            impact_summary: '{{customer.freebie_impact_summary}}'
          }
        }
      ]
    }
  };

  // Insert the modification
  const { data, error } = await supabase
    .from('workflow_modifications')
    .insert(modification)
    .select()
    .single();

  if (error) {
    console.error('Error creating modification:', error);
    process.exit(1);
  }

  console.log('✅ Successfully created at-risk freebie intervention modification');
  console.log('Modification ID:', data.id);
  console.log('Adds 3 steps: prepare-freebie, deliver-freebie, measure-impact');
  console.log('Total workflow: 9 base steps + 3 freebie steps = 12 steps');
  console.log('\nActivates when: customer.risk_score > 60');
}

seedAtRiskModification();
