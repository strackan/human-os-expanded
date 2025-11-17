/**
 * Seed Workflow Templates
 *
 * Seeds the database with base workflow templates for the template system
 *
 * Part of InHerSight 0.1.9 Release - Workflow Template System
 *
 * Usage: npx tsx scripts/seed-workflow-templates.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Renewal Base Template
 *
 * Core renewal journey covering 90-day, 120-day, 60-day, 30-day variations
 * Modifications will add freebie interventions, skip steps, or expedite timelines
 */
const renewalBaseTemplate = {
  name: 'renewal_base',
  display_name: 'Renewal Planning',
  description: 'Core renewal journey with performance review, planning, and negotiation',
  category: 'renewal',
  base_steps: [
    {
      step_id: 'identify-concerns',
      step_name: 'Identify Concerns',
      step_type: 'analysis',
      description: 'Review customer health and identify potential concerns',
      shows_artifacts: ['health-dashboard'],
      creates_tasks: [],
      metadata: {
        estimated_minutes: 10,
        requires_ai: false
      }
    },
    {
      step_id: 'review-data',
      step_name: 'Review Performance Data',
      step_type: 'analysis',
      description: 'Pull and analyze customer performance metrics',
      shows_artifacts: ['performance-report'],
      creates_tasks: [],
      metadata: {
        estimated_minutes: 15,
        requires_ai: true
      }
    },
    {
      step_id: 'identify-opportunities',
      step_name: 'Identify Opportunities',
      step_type: 'analysis',
      description: 'Spot expansion and optimization potential',
      shows_artifacts: ['opportunity-analysis'],
      creates_tasks: [],
      metadata: {
        estimated_minutes: 10,
        requires_ai: true
      }
    },
    {
      step_id: 'prepare-meeting-deck',
      step_name: 'Prepare Meeting Deck',
      step_type: 'creation',
      description: 'Create performance review presentation',
      shows_artifacts: ['meeting-deck'],
      creates_tasks: ['prepare-presentation'],
      metadata: {
        estimated_minutes: 20,
        requires_ai: true
      }
    },
    {
      step_id: 'schedule-meeting',
      step_name: 'Schedule Meeting',
      step_type: 'communication',
      description: 'Email team to get meeting on the books',
      shows_artifacts: ['meeting-request-email'],
      creates_tasks: ['send-meeting-invite'],
      metadata: {
        estimated_minutes: 5,
        requires_ai: true
      }
    },
    {
      step_id: 'conduct-meeting',
      step_name: 'Conduct Meeting',
      step_type: 'meeting',
      description: 'Meet with team and gather feedback',
      shows_artifacts: ['meeting-notes'],
      creates_tasks: ['conduct-renewal-meeting'],
      metadata: {
        estimated_minutes: 60,
        requires_ai: false
      }
    },
    {
      step_id: 'create-recommendation',
      step_name: 'Create Recommendation',
      step_type: 'creation',
      description: 'Put together renewal recommendation based on feedback',
      shows_artifacts: ['renewal-recommendation'],
      creates_tasks: ['draft-recommendation'],
      metadata: {
        estimated_minutes: 15,
        requires_ai: true
      }
    },
    {
      step_id: 'send-followup',
      step_name: 'Send Follow-up',
      step_type: 'communication',
      description: 'Email recommendation and next steps',
      shows_artifacts: ['followup-email'],
      creates_tasks: ['send-followup-email'],
      metadata: {
        estimated_minutes: 5,
        requires_ai: true
      }
    },
    {
      step_id: 'negotiate',
      step_name: 'Negotiate & Close',
      step_type: 'negotiation',
      description: 'Work through terms and finalize renewal',
      shows_artifacts: ['contract-comparison'],
      creates_tasks: ['finalize-renewal'],
      metadata: {
        estimated_minutes: 30,
        requires_ai: false
      }
    }
  ],
  base_artifacts: [
    {
      artifact_id: 'health-dashboard',
      artifact_type: 'dashboard',
      artifact_name: 'Customer Health Dashboard',
      template_content: null,
      config: {
        shows_metrics: ['health_score', 'risk_score', 'engagement_trend']
      }
    },
    {
      artifact_id: 'performance-report',
      artifact_type: 'document',
      artifact_name: 'Performance Report - {{customer.name}}',
      template_content: '# Performance Analysis\n\n**Customer**: {{customer.name}}\n**Period**: Last 90 days\n\n## Key Metrics\n- ARR: {{customer.current_arr}}\n- Health Score: {{customer.health_score}}/100\n- Engagement Trend: {{engagement_metrics.trend}}',
      config: {}
    },
    {
      artifact_id: 'opportunity-analysis',
      artifact_type: 'document',
      artifact_name: 'Opportunity Analysis',
      template_content: '# Expansion Opportunities\n\n**Customer**: {{customer.name}}\n\n## Identified Opportunities\n_AI-generated based on usage patterns and customer profile_',
      config: {
        requires_ai: true
      }
    },
    {
      artifact_id: 'meeting-deck',
      artifact_type: 'presentation',
      artifact_name: 'Renewal Meeting Deck',
      template_content: null,
      config: {
        template: 'renewal-deck',
        slides: ['overview', 'performance', 'opportunities', 'next-steps']
      }
    },
    {
      artifact_id: 'meeting-request-email',
      artifact_type: 'email',
      artifact_name: 'Meeting Request',
      template_content: 'Subject: Let\'s Review Your Success with {{company.name}}\n\nHi {{contacts.0.first_name}},\n\nI hope this email finds you well! As we approach your renewal date ({{customer.renewal_date}}), I\'d love to schedule time to review your success with our platform and discuss how we can continue supporting your goals.\n\nWould you have 30 minutes in the next week?\n\nBest regards',
      config: {
        to: '{{contacts.0.email}}',
        requires_user_review: true
      }
    },
    {
      artifact_id: 'meeting-notes',
      artifact_type: 'document',
      artifact_name: 'Meeting Notes',
      template_content: '# Renewal Meeting Notes\n\n**Date**: {{trigger.meeting_date}}\n**Attendees**: {{contacts.0.name}}\n\n## Discussion Points\n\n## Action Items\n\n## Next Steps',
      config: {}
    },
    {
      artifact_id: 'renewal-recommendation',
      artifact_type: 'document',
      artifact_name: 'Renewal Recommendation',
      template_content: '# Renewal Recommendation - {{customer.name}}\n\n## Current Status\n- ARR: {{customer.current_arr}}\n- Contract End: {{customer.renewal_date}}\n\n## Recommendation\n_Based on meeting feedback and performance analysis_\n\n## Proposed Terms\n\n## Rationale',
      config: {
        requires_ai: true
      }
    },
    {
      artifact_id: 'followup-email',
      artifact_type: 'email',
      artifact_name: 'Follow-up Email',
      template_content: 'Subject: Next Steps - {{customer.name}} Renewal\n\nHi {{contacts.0.first_name}},\n\nThank you for taking the time to meet with me! I\'ve put together a recommendation based on our discussion.\n\n[Summary of recommendation]\n\nLet me know if you have any questions or would like to discuss further.\n\nBest regards',
      config: {
        to: '{{contacts.0.email}}',
        requires_user_review: true
      }
    },
    {
      artifact_id: 'contract-comparison',
      artifact_type: 'table',
      artifact_name: 'Contract Comparison',
      template_content: null,
      config: {
        columns: ['Feature', 'Current Plan', 'Proposed Plan', 'Change'],
        compares_contracts: true
      }
    }
  ],
  default_triggers: {
    days_to_renewal: { $lte: 90 },
    renewal_stage: { $in: ['approaching', 'at-risk'] }
  },
  estimated_time_minutes: 160,
  pain_score: 7,
  impact_score: 9,
  is_active: true
};

/**
 * Contact Recovery Template
 *
 * For lost or changed contacts
 */
const contactRecoveryTemplate = {
  name: 'contact_recovery',
  display_name: 'Contact Recovery',
  description: 'Workflow for recovering lost or changed contacts',
  category: 'contact',
  base_steps: [
    {
      step_id: 'identify-issue',
      step_name: 'Identify Issue',
      step_type: 'analysis',
      description: 'Understand what happened with the contact',
      shows_artifacts: ['contact-status'],
      creates_tasks: [],
      metadata: { estimated_minutes: 5 }
    },
    {
      step_id: 'search-contacts',
      step_name: 'Search for New Contact',
      step_type: 'research',
      description: 'Find replacement contact or updated information',
      shows_artifacts: ['linkedin-search'],
      creates_tasks: ['research-contacts'],
      metadata: { estimated_minutes: 15 }
    },
    {
      step_id: 'reconnect',
      step_name: 'Reconnect',
      step_type: 'communication',
      description: 'Reach out to new or updated contact',
      shows_artifacts: ['introduction-email'],
      creates_tasks: ['send-intro-email'],
      metadata: { estimated_minutes: 10 }
    },
    {
      step_id: 'establish-relationship',
      step_name: 'Establish Relationship',
      step_type: 'relationship',
      description: 'Build rapport and set up regular cadence',
      shows_artifacts: ['relationship-plan'],
      creates_tasks: ['schedule-kickoff-call'],
      metadata: { estimated_minutes: 30 }
    }
  ],
  base_artifacts: [],
  estimated_time_minutes: 60,
  pain_score: 8,
  impact_score: 7,
  is_active: true
};

/**
 * Contact Crisis Template
 *
 * For angry or frustrated contacts
 */
const contactCrisisTemplate = {
  name: 'contact_crisis',
  display_name: 'Contact Crisis Response',
  description: 'Workflow for addressing angry or frustrated contacts',
  category: 'contact',
  base_steps: [
    {
      step_id: 'assess-situation',
      step_name: 'Assess Situation',
      step_type: 'analysis',
      description: 'Understand the root cause of frustration',
      shows_artifacts: ['situation-analysis'],
      creates_tasks: [],
      metadata: { estimated_minutes: 10, priority: 'urgent' }
    },
    {
      step_id: 'acknowledge',
      step_name: 'Acknowledge & Apologize',
      step_type: 'communication',
      description: 'Respond with empathy and accountability',
      shows_artifacts: ['response-email'],
      creates_tasks: ['send-acknowledgment'],
      metadata: { estimated_minutes: 15, priority: 'urgent' }
    },
    {
      step_id: 'fix-issue',
      step_name: 'Fix the Issue',
      step_type: 'action',
      description: 'Take concrete steps to resolve the problem',
      shows_artifacts: ['action-plan'],
      creates_tasks: ['execute-fix'],
      metadata: { estimated_minutes: 60, priority: 'high' }
    },
    {
      step_id: 'rebuild-trust',
      step_name: 'Rebuild Trust',
      step_type: 'relationship',
      description: 'Follow up and ensure satisfaction',
      shows_artifacts: ['followup-plan'],
      creates_tasks: ['schedule-followup-call'],
      metadata: { estimated_minutes: 30 }
    }
  ],
  base_artifacts: [],
  estimated_time_minutes: 115,
  pain_score: 10,
  impact_score: 9,
  is_active: true
};

/**
 * Seed all templates
 */
async function seedTemplates() {
  console.log('🌱 Seeding workflow templates...\n');

  const templates = [
    renewalBaseTemplate,
    contactRecoveryTemplate,
    contactCrisisTemplate
  ];

  for (const template of templates) {
    console.log(`📝 Seeding template: ${template.display_name} (${template.name})`);

    // Check if template already exists
    const { data: existing } = await supabase
      .from('workflow_templates')
      .select('id, name')
      .eq('name', template.name)
      .single();

    if (existing) {
      console.log(`   ⚠️  Template already exists (ID: ${existing.id}). Updating...`);

      const { error } = await supabase
        .from('workflow_templates')
        .update({
          ...template,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) {
        console.error(`   ❌ Error updating template: ${error.message}`);
      } else {
        console.log(`   ✅ Template updated successfully`);
      }
    } else {
      const { data, error } = await supabase
        .from('workflow_templates')
        .insert(template)
        .select('id')
        .single();

      if (error) {
        console.error(`   ❌ Error creating template: ${error.message}`);
      } else {
        console.log(`   ✅ Template created (ID: ${data.id})`);
      }
    }

    console.log(`   📊 Steps: ${template.base_steps.length}`);
    console.log(`   🎨 Artifacts: ${template.base_artifacts?.length || 0}`);
    console.log(`   ⏱️  Estimated time: ${template.estimated_time_minutes} minutes\n`);
  }

  console.log('✨ Template seeding complete!\n');
}

// Run seeding
seedTemplates()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
