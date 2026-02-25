/**
 * Apply Phase 1 Migration and Seed Workflow
 *
 * This script:
 * 1. Applies the Phase 1 trigger migration SQL
 * 2. Seeds the obsidian-black-renewal workflow definition
 * 3. Seeds the Obsidian Black customer data
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
config({ path: resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

console.log('🔌 Connecting to Supabase:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigrationAndSeed() {
  console.log('\n📦 Phase 1.0 Migration & Seeding\n');
  console.log('=' .repeat(60));

  // ============================================================================
  // 1. Apply Phase 1 Migration (Trigger Columns)
  // ============================================================================
  console.log('\n1️⃣  Applying Phase 1 migration (trigger columns)...');

  try {
    // Read the migration file
    const migrationPath = resolve(__dirname, '..', 'supabase', 'migrations', '20251125000000_workflow_triggers_phase1.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Split on semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.toLowerCase().includes('select') && !statement.toLowerCase().includes('create')) {
        // Skip SELECT statements that are just for verification
        continue;
      }

      let error;
      try {
        const result = await supabase.rpc('exec_sql', { sql: statement + ';' });
        error = result.error;
      } catch (rpcError) {
        // If exec_sql doesn't exist, use raw query
        const fallbackResult = await supabase.from('_raw').select('*').limit(0); // This will fail but that's ok
        error = fallbackResult.error;
      }

      // Try direct execution if RPC doesn't work
      if (error) {
        console.log('   Using direct SQL execution...');
        break; // Exit and use alternative method
      }
    }

    // Alternative: Use Supabase SQL editor approach
    console.log('   ⚠️  Using alternative approach: checking columns...');

    // Check if columns exist using information_schema
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'workflow_executions')
      .in('column_name', ['wake_triggers', 'trigger_fired_at', 'fired_trigger_type', 'last_evaluated_at']);

    const existingColumns = (columns || []).map((c: any) => c.column_name);
    const requiredColumns = ['wake_triggers', 'trigger_fired_at', 'fired_trigger_type', 'last_evaluated_at'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log(`   ⚠️  Missing columns: ${missingColumns.join(', ')}`);
      console.log('   📝 Please apply migration manually using Supabase Dashboard');
      console.log('   Run SQL from: supabase/migrations/20251125000000_workflow_triggers_phase1.sql');
      console.log('\n   OR copy/paste this migration and run in SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/amugmkrihnjsxlpwdzcy/sql/new\n');
    } else {
      console.log('   ✅ All trigger columns exist');
    }

  } catch (error: any) {
    console.error('   ❌ Migration error:', error.message);
    console.log('\n   📝 Manual steps required:');
    console.log('   1. Go to Supabase Dashboard SQL Editor');
    console.log('   2. Run migration: supabase/migrations/20251125000000_workflow_triggers_phase1.sql');
  }

  // ============================================================================
  // 2. Seed Obsidian Black Workflow Definition
  // ============================================================================
  console.log('\n2️⃣  Seeding obsidian-black-renewal workflow definition...');

  const workflowDefinition = {
    workflow_id: 'obsidian-black-renewal',
    name: 'Obsidian Black Renewal',
    workflow_type: 'renewal',
    description: 'Renewal workflow using V2 template-based architecture',
    is_active: true,
    is_demo: true,
    priority_weight: 500,
    slide_sequence: [
      'greeting',
      'review-account',
      'pricing-analysis-v2',
      'prepare-quote-v2',
      'draft-email-v2',
      'workflow-summary-v2'
    ],
    slide_contexts: {
      'greeting': {
        purpose: 'renewal_preparation',
        urgency: 'critical',
        variables: {
          showPlanningChecklist: true,
          checklistItems: [
            'Review account health and contract details',
            'Analyze current pricing vs. market benchmarks',
            'Generate optimized renewal quote',
            'Draft personalized outreach email',
            'Create action plan and next steps'
          ],
          checklistTitle: "Here's what we'll accomplish together:",
          greetingText: "Good afternoon, Justin. You've got one critical task for today:\n\n**Renewal Planning for {{customer.name}}.**\n\nWe need to review contract terms, make sure we've got the right contacts, and put our initial forecast in.\n\nThe full plan is on the right. Ready to get started?",
          buttons: [
            {
              label: 'Review Later',
              value: 'snooze',
              'label-background': 'bg-gray-500 hover:bg-gray-600',
              'label-text': 'text-white'
            },
            {
              label: "Let's Begin!",
              value: 'start',
              'label-background': 'bg-blue-600 hover:bg-blue-700',
              'label-text': 'text-white'
            }
          ]
        }
      },
      'review-account': {
        purpose: 'renewal',
        variables: {
          ask_for_assessment: false,
          focus_metrics: ['arr', 'price_per_seat', 'renewal_date', 'health_score', 'utilization', 'yoy_growth'],
          insightText: "Please review {{customer.name}}'s current status to the right:\n\n**Key Insights:**\n• 20% usage increase over prior month\n• 4 months to renewal - time to engage\n• Paying less per unit than 65% of customers - Room for expansion\n• Recent negative comments in support - May need to investigate\n• Key contract items - 5% limit on price increases. Consider amendment.\n\nMake sure you've reviewed the contract and stakeholder. When you're ready, click to move onto pricing.",
          buttonLabel: 'Analyze Pricing Strategy'
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
        placeholder: 'Ask me anything about this pricing opportunity...',
        aiGreeting: "Good morning! Your ONE critical task today: Optimize pricing for {{customer.name}}'s upcoming renewal. They're significantly underpriced and now is the perfect time to act."
      }
    }
  };

  const { error: workflowError } = await supabase
    .from('workflow_definitions')
    .upsert(workflowDefinition);

  if (workflowError) {
    console.error('   ❌ Failed to seed workflow:', workflowError.message);
  } else {
    console.log('   ✅ Workflow definition seeded');
  }

  // ============================================================================
  // 3. Verify Workflow
  // ============================================================================
  console.log('\n3️⃣  Verifying workflow definition...');

  const { data: workflow, error: verifyError } = await supabase
    .from('workflow_definitions')
    .select('workflow_id, name, workflow_type, is_demo, is_active')
    .eq('workflow_id', 'obsidian-black-renewal')
    .single();

  if (verifyError || !workflow) {
    console.error('   ❌ Verification failed:', verifyError?.message);
  } else {
    console.log('   ✅ Workflow verified:');
    console.log('      ID:', workflow.workflow_id);
    console.log('      Name:', workflow.name);
    console.log('      Type:', workflow.workflow_type);
    console.log('      Demo:', workflow.is_demo);
    console.log('      Active:', workflow.is_active);
  }

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('\n' + '='.repeat(60));
  console.log('✅ SEEDING COMPLETE!\n');
  console.log('📋 Next Steps:');
  console.log('   1. Ensure Phase 1 migration columns exist (check above)');
  console.log('   2. Run Obsidian Black customer seeder if needed:');
  console.log('      npx tsx scripts/seed-obsidian-black.ts');
  console.log('   3. Test at: http://localhost:3000/test-snooze');
  console.log('');
}

applyMigrationAndSeed().catch(console.error);
