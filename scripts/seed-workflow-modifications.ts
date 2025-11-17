/**
 * Seed Workflow Modifications
 *
 * Seeds the database with workflow modifications (global, company, customer)
 *
 * Part of InHerSight 0.1.9 Release - Workflow Template System
 *
 * Usage: npx tsx scripts/seed-workflow-modifications.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

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
 * Global Modification: At-Risk Freebie Intervention
 *
 * When risk_score > 60, add 3 steps for freebie intervention
 * Inserted after position 2 (after review-data step)
 */
async function createAtRiskFreebieModification(templateId: string) {
  const modifications = [
    // Step 1: Prepare Freebie
    {
      workflow_template_id: templateId,
      scope_type: 'global',
      scope_criteria: {
        risk_score: { $gt: 60 }
      },
      modification_type: 'add_step',
      target_position: 3, // Insert after review-data (index 2)
      modification_data: {
        step_id: 'prepare-freebie',
        step_name: 'Prepare Freebie Intervention',
        step_type: 'intervention',
        description: 'Design value-add offering to demonstrate commitment',
        shows_artifacts: ['freebie-proposal'],
        creates_tasks: ['design-freebie-offering'],
        metadata: {
          estimated_minutes: 20,
          requires_ai: true,
          intervention_type: 'at-risk'
        }
      },
      priority: 100,
      reason: 'At-risk accounts (risk_score > 60) need proactive intervention with value demonstration',
      is_active: true
    },
    // Step 2: Deliver Freebie
    {
      workflow_template_id: templateId,
      scope_type: 'global',
      scope_criteria: {
        risk_score: { $gt: 60 }
      },
      modification_type: 'add_step',
      target_position: 4, // After prepare-freebie
      modification_data: {
        step_id: 'deliver-freebie',
        step_name: 'Deliver Freebie',
        step_type: 'intervention',
        description: 'Present and deliver the value-add offering',
        shows_artifacts: ['freebie-delivery-email'],
        creates_tasks: ['send-freebie-proposal'],
        metadata: {
          estimated_minutes: 15,
          requires_ai: true,
          intervention_type: 'at-risk'
        }
      },
      priority: 100,
      reason: 'Delivery of freebie intervention for at-risk accounts',
      is_active: true
    },
    // Step 3: Measure Impact
    {
      workflow_template_id: templateId,
      scope_type: 'global',
      scope_criteria: {
        risk_score: { $gt: 60 }
      },
      modification_type: 'add_step',
      target_position: 5, // After deliver-freebie
      modification_data: {
        step_id: 'measure-freebie-impact',
        step_name: 'Measure Freebie Impact',
        step_type: 'analysis',
        description: 'Track engagement and sentiment after freebie delivery',
        shows_artifacts: ['impact-dashboard'],
        creates_tasks: ['monitor-engagement'],
        metadata: {
          estimated_minutes: 10,
          requires_ai: false,
          intervention_type: 'at-risk'
        }
      },
      priority: 100,
      reason: 'Measure effectiveness of freebie intervention for at-risk accounts',
      is_active: true
    }
  ];

  console.log('🎁 Creating Global At-Risk Freebie Modifications...\n');

  for (const mod of modifications) {
    const { data, error } = await supabase
      .from('workflow_modifications')
      .insert(mod)
      .select('id')
      .single();

    if (error) {
      console.error(`   ❌ Error creating modification: ${error.message}`);
    } else {
      console.log(`   ✅ Created: ${mod.modification_data.step_name} (ID: ${data.id})`);
    }
  }

  console.log('\n');
}

/**
 * Company Modification: InHerSight Brand Exposure Analysis
 *
 * For all InHerSight customers, add brand exposure deep dive step
 * Inserted after position 1 (after identify-concerns)
 */
async function createInHerSightBrandModification(templateId: string, companyId: string) {
  const modifications = [
    // Brand Exposure Deep Dive Step
    {
      workflow_template_id: templateId,
      scope_type: 'company',
      scope_id: companyId,
      modification_type: 'add_step',
      target_position: 2, // Insert after identify-concerns (index 1)
      modification_data: {
        step_id: 'brand-exposure-analysis',
        step_name: 'Brand Exposure Deep Dive',
        step_type: 'analysis',
        description: 'Analyze InHerSight-specific brand metrics and employer branding performance',
        shows_artifacts: ['brand-exposure-report'],
        creates_tasks: [],
        metadata: {
          estimated_minutes: 15,
          requires_ai: true,
          company_specific: true
        }
      },
      priority: 200,
      reason: 'InHerSight customers need detailed brand exposure analysis',
      is_active: true
    },
    // Add brand exposure artifact to the template
    {
      workflow_template_id: templateId,
      scope_type: 'company',
      scope_id: companyId,
      modification_type: 'add_artifact',
      target_step_id: 'brand-exposure-analysis',
      modification_data: {
        artifact_id: 'brand-exposure-report',
        artifact_definition: {
          artifact_id: 'brand-exposure-report',
          artifact_type: 'document',
          artifact_name: 'Brand Exposure Report - {{customer.name}}',
          template_content: `# Brand Exposure Analysis

**Customer**: {{customer.name}}
**Report Period**: Last 90 days
**Generated**: {{trigger.report_date}}

## Executive Summary

{{customer.name}}'s employer brand is reaching **{{engagement_metrics.brand_impressions}}** job seekers per month through the InHerSight platform.

## Key Performance Indicators

### Brand Impressions
- **Current**: {{engagement_metrics.brand_impressions}}
- **Trend**: {{engagement_metrics.impressions_trend}}
- **Benchmark**: Industry average

### Profile Engagement
- **Profile Views**: {{engagement_metrics.profile_views}}
- **Apply Clicks**: {{engagement_metrics.apply_clicks}}
- **Conversion Rate**: {{engagement_metrics.conversion_rate}}%

### Content Performance
- **Article Inclusions**: {{engagement_metrics.article_inclusions}}
- **User Reviews**: {{engagement_metrics.user_reviews_count}}
- **Average Rating**: {{engagement_metrics.average_rating}}/5

### Profile Optimization
- **Completion**: {{engagement_metrics.profile_completion_pct}}%
- **Photo Quality**: {{engagement_metrics.photo_quality_score}}/100
- **Content Freshness**: {{engagement_metrics.content_age_days}} days

## Opportunities for Growth

_AI-generated recommendations based on performance data and industry benchmarks_

## Recommended Actions

1. **Short-term** (Next 30 days)
2. **Medium-term** (30-90 days)
3. **Strategic** (90+ days)

---
*Generated by InHerSight Workflow Engine*`,
          config: {
            requires_ai: true,
            company_specific: true,
            data_sources: ['customer_engagement_metrics']
          }
        }
      },
      priority: 200,
      reason: 'InHerSight-specific brand exposure reporting',
      is_active: true
    }
  ];

  console.log('🏢 Creating InHerSight Company Modifications...\n');

  for (const mod of modifications) {
    const { data, error } = await supabase
      .from('workflow_modifications')
      .insert(mod)
      .select('id')
      .single();

    if (error) {
      console.error(`   ❌ Error creating modification: ${error.message}`);
    } else {
      const stepName = mod.modification_data.step_name || `Artifact: ${mod.modification_data.artifact_id}`;
      console.log(`   ✅ Created: ${stepName} (ID: ${data.id})`);
    }
  }

  console.log('\n');
}

/**
 * Global Modification: Skip Concerns Step for Healthy Accounts
 *
 * When health_score > 80 and risk_score < 30, skip the identify-concerns step
 */
async function createHealthyAccountSkipModification(templateId: string) {
  const modification = {
    workflow_template_id: templateId,
    scope_type: 'global',
    scope_criteria: {
      health_score: { $gt: 80 },
      risk_score: { $lt: 30 }
    },
    modification_type: 'remove_step',
    target_step_id: 'identify-concerns',
    modification_data: {
      skip_reason: 'Healthy account with low risk - no concerns to identify'
    },
    priority: 100,
    reason: 'Healthy accounts (health > 80, risk < 30) can skip concern identification',
    is_active: true
  };

  console.log('💚 Creating Healthy Account Skip Modification...\n');

  const { data, error } = await supabase
    .from('workflow_modifications')
    .insert(modification)
    .select('id')
    .single();

  if (error) {
    console.error(`   ❌ Error creating modification: ${error.message}`);
  } else {
    console.log(`   ✅ Created: Skip concerns for healthy accounts (ID: ${data.id})\n`);
  }
}

/**
 * Seed all modifications
 */
async function seedModifications() {
  console.log('🌱 Seeding workflow modifications...\n');

  // Get renewal_base template ID
  const { data: renewalTemplate, error: renewalError } = await supabase
    .from('workflow_templates')
    .select('id')
    .eq('name', 'renewal_base')
    .single();

  if (renewalError || !renewalTemplate) {
    console.error('❌ Could not find renewal_base template. Please run seed-workflow-templates.ts first.');
    process.exit(1);
  }

  console.log(`📋 Found renewal_base template (ID: ${renewalTemplate.id})\n`);

  // Get InHerSight company ID
  const { data: inhersightCompany, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('name', 'InHerSight')
    .single();

  if (companyError || !inhersightCompany) {
    console.warn('⚠️  Could not find InHerSight company. Skipping company-specific modifications.');
  } else {
    console.log(`🏢 Found InHerSight company (ID: ${inhersightCompany.id})\n`);
  }

  // Create modifications
  await createAtRiskFreebieModification(renewalTemplate.id);
  await createHealthyAccountSkipModification(renewalTemplate.id);

  if (inhersightCompany) {
    await createInHerSightBrandModification(renewalTemplate.id, inhersightCompany.id);
  }

  console.log('✨ Modification seeding complete!\n');
}

// Run seeding
seedModifications()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
