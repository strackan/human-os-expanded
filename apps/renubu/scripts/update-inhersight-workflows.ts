import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Use environment variables for flexibility between environments
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://amugmkrihnjsxlpwdzcy.supabase.co';
const supabaseKey = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('Connecting to:', supabaseUrl);

async function updateWorkflows() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // ============================================================================
  // IMPORTANT: PostgreSQL UNIQUE constraints don't work properly with NULL values
  // NULL != NULL in SQL, so upsert creates new rows instead of updating
  // We must DELETE then INSERT for stock workflows (company_id = NULL)
  // ============================================================================

  // First, delete existing InHerSight workflows (stock workflows only)
  console.log('Deleting existing InHerSight stock workflows...');
  const { error: deleteError } = await supabase
    .from('workflow_definitions')
    .delete()
    .is('company_id', null)
    .in('workflow_id', ['inhersight-90day-renewal', 'inhersight-120day-atrisk']);

  if (deleteError) {
    console.error('Error deleting existing workflows:', deleteError);
    // Continue anyway - maybe they don't exist yet
  } else {
    console.log('Deleted existing InHerSight stock workflows');
  }

  // Insert 90-Day Renewal Workflow
  // Phase 1: 90-day renewal preparation workflow
  // Slides: greeting, account-review-tabbed (5 tabs), align-strategy, prepare-meeting-deck, schedule-call, workflow-summary
  const { data: data90, error: error90 } = await supabase
    .from('workflow_definitions')
    .insert({
      workflow_id: 'inhersight-90day-renewal',
      name: 'InHerSight 90-Day Renewal',
      workflow_type: 'renewal',
      description: "Grace's 90-day renewal workflow with performance review and strategy alignment",
      company_id: null, // Stock workflow
      module_id: 'customer-success',
      is_active: true,
      is_demo: false,
      is_stock_workflow: true,
      priority_weight: 800,
      version: 1,
      slide_sequence: [
        'greeting',                  // 1. Confirm Plan - Planning Checklist
        'account-review-tabbed',     // 2. Performance Review - Tabbed: Usage | Contract | Contacts | Expansion | Risk
        'pricing-strategy',          // 3. Pricing Strategy - Develop renewal pricing approach
        'renewal-presentation',      // 4. Renewal Presentation (interactive deck with export)
        'schedule-call',             // 5. Schedule Meeting
        'workflow-summary'           // 6. Summary
      ],
      slide_contexts: {
        greeting: {
          purpose: 'renewal_preparation',
          urgency: 'high',
          variables: {
            showPlanningChecklist: true,
            checklistItems: [
              "Review account performance and usage metrics",
              "Check contract terms and stakeholder contacts",
              "Identify expansion opportunities and risks",
              "Align on renewal strategy",
              "Prepare meeting deck for customer call",
              "Schedule renewal conversation"
            ],
            checklistTitle: "Here's what we'll accomplish together:",
          }
        },
        'account-review-tabbed': {
          variables: {
            tabs: [
              { id: 'usage', label: 'Usage', icon: 'chart-bar' },
              { id: 'contract', label: 'Contract', icon: 'document-text' },
              { id: 'contacts', label: 'Contacts', icon: 'users' },
              { id: 'expansion', label: 'Expansion', icon: 'trending-up' },
              { id: 'risk', label: 'Risk', icon: 'exclamation-triangle' }
            ],
            defaultTab: 'usage',
            metricsToShow: ['brand_impressions', 'profile_views', 'apply_clicks', 'yoy_growth'],
            showContacts: true,
            showContractDetails: true,
            expansionFocus: ['expansion', 'upsell', 'feature_adoption'],
          }
        },
        'pricing-strategy': {
          variables: {
            priceChangeStrategy: 'flat', // Default to flat renewal
            includeExpansion: false,
            multiYearOption: false,
          }
        },
        'renewal-presentation': {
          variables: {
            templateType: 'annual-review',
            includeSections: ['title', 'metrics', 'highlights', 'recommendations', 'next-steps'],
            editable: true,
          }
        }
      },
      settings: {
        layout: {
          modalDimensions: { width: 90, height: 90, top: 5, left: 5 },
          dividerPosition: 50,
          chatWidth: 50,
          splitModeDefault: true
        },
        chat: {
          placeholder: 'Ask me anything about this renewal...',
        }
      },
      trigger_conditions: {
        days_to_renewal: { operator: '<=', value: 90 },
        workflow_type: 'renewal',
      },
    })
    .select();

  if (error90) {
    console.error('Error inserting 90-day:', error90);
  } else {
    console.log('Inserted 90-day renewal:', data90);
  }

  // Insert 120-Day At-Risk Workflow
  const { data: data120, error: error120 } = await supabase
    .from('workflow_definitions')
    .insert({
      workflow_id: 'inhersight-120day-atrisk',
      name: 'InHerSight 120-Day At-Risk Recovery',
      workflow_type: 'risk',
      description: "Grace's at-risk customer recovery workflow with freebie strategy",
      company_id: null, // Stock workflow
      module_id: 'customer-success',
      is_active: true,
      is_demo: false,
      is_stock_workflow: true,
      priority_weight: 900, // Higher priority for at-risk
      version: 1,
      slide_sequence: [
        'greeting',
        'identify-concerns',
        'review-brand-performance',
        'prepare-freebie',
        'draft-email',
        'deliver-freebie',
        'measure-freebie-impact',
        'draft-email',
        'create-recommendation',
        'draft-email',
        'negotiation-guide',
        'workflow-summary'
      ],
      slide_contexts: {
        greeting: {
          purpose: 'at_risk_recovery',
          urgency: 'critical',
          variables: {
            showPlanningChecklist: true,
            checklistItems: [
              "Identify customer concerns and risk factors",
              "Review brand performance metrics",
              "Prepare value-add offer (freebie)",
              "Deliver freebie and measure impact",
              "Create renewal recommendation",
              "Guide negotiation strategy"
            ],
            checklistTitle: "Recovery plan for at-risk customer:",
          }
        },
        'identify-concerns': {
          variables: {
            riskFactors: ['usage_decline', 'support_issues', 'competitive_threat', 'budget_constraints'],
          }
        },
        'prepare-freebie': {
          variables: {
            freebieOptions: ['featured-article', 'profile-optimization', 'social-campaign', 'job-credits'],
          }
        }
      },
      settings: {
        layout: {
          modalDimensions: { width: 90, height: 90, top: 5, left: 5 },
          dividerPosition: 50,
          chatWidth: 50,
          splitModeDefault: true
        },
        chat: {
          placeholder: 'Ask me anything about this at-risk recovery...',
        }
      },
      trigger_conditions: {
        days_to_renewal: { operator: '<=', value: 120 },
        health_score: { operator: '<', value: 70 },
        workflow_type: 'risk',
      },
    })
    .select();

  if (error120) {
    console.error('Error inserting 120-day:', error120);
  } else {
    console.log('Inserted 120-day at-risk:', data120);
  }

  console.log('\nWorkflow definitions seeded/updated successfully!');
}

updateWorkflows();
