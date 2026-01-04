/**
 * Phase 3B: Seed Workflow Definitions
 *
 * Migrates existing code-based workflow compositions to database
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { standardRenewalComposition } from '@/lib/workflows/compositions/standardRenewalComposition';
import { executiveContactLostComposition } from '@/lib/workflows/compositions/executiveContactLostComposition';
import { obsidianBlackRenewalComposition } from '@/lib/workflows/compositions/obsidianBlackRenewalComposition';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set in .env.local');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Workflow compositions to seed
const workflowSeeds = [
  {
    workflow_id: 'standard-renewal',
    name: 'Standard Renewal Workflow',
    workflow_type: 'renewal',
    description: 'Standard renewal planning workflow for mid-stage renewals',
    composition: standardRenewalComposition,
    trigger_conditions: {
      days_until_renewal_min: 30,
      days_until_renewal_max: 180
    },
    priority_weight: 500
  },
  {
    workflow_id: 'executive-contact-lost',
    name: 'Executive Contact Lost',
    workflow_type: 'risk',
    description: 'Risk mitigation workflow when executive contact departs',
    composition: executiveContactLostComposition,
    trigger_conditions: {
      event_type: 'executive_departure'
    },
    priority_weight: 800
  },
  {
    workflow_id: 'obsidian-black-renewal',
    name: 'Obsidian Black Renewal',
    workflow_type: 'renewal',
    description: 'Custom renewal workflow for Obsidian Black (demo customer)',
    composition: obsidianBlackRenewalComposition,
    trigger_conditions: {
      customer_id: '550e8400-e29b-41d4-a716-446655440001'
    },
    priority_weight: 600
  }
];

async function seedWorkflowDefinitions() {
  console.log('🌱 Seeding workflow definitions...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const seed of workflowSeeds) {
    try {
      console.log(`📝 Processing: ${seed.name} (${seed.workflow_id})`);

      // Get composition object
      const config = seed.composition;

      // Extract slide sequence and contexts
      const slideSequence = config.slideSequence || [];
      const slideContexts = config.slideContexts || {};

      console.log(`   - Slides: ${slideSequence.join(', ')}`);
      console.log(`   - Total slides: ${slideSequence.length}`);

      // Upsert workflow definition
      const { data, error } = await supabase
        .from('workflow_definitions')
        .upsert({
          workflow_id: seed.workflow_id,
          name: seed.name,
          workflow_type: seed.workflow_type,
          description: seed.description,
          company_id: null, // Stock workflow
          is_stock_workflow: true,
          slide_sequence: slideSequence,
          slide_contexts: slideContexts,
          trigger_conditions: seed.trigger_conditions || {},
          priority_weight: seed.priority_weight || 500,
          version: 1
        }, {
          onConflict: 'workflow_id,company_id'
        })
        .select();

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Seeded successfully (ID: ${data[0]?.id})`);
        successCount++;
      }

      console.log('');
    } catch (err) {
      console.error(`   ❌ Exception: ${err}`);
      errorCount++;
      console.log('');
    }
  }

  console.log('═══════════════════════════════════════');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total: ${workflowSeeds.length}`);
  console.log('═══════════════════════════════════════\n');

  if (errorCount > 0) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedWorkflowDefinitions()
    .then(() => {
      console.log('✅ Workflow definitions seeded successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to seed workflow definitions:', error);
      process.exit(1);
    });
}

export { seedWorkflowDefinitions };
