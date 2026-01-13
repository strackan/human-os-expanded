/**
 * Fix Obsidian Black Renewal - Delete and Reseed
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { obsidianBlackRenewalComposition } from '@/lib/workflows/compositions/obsidianBlackRenewalComposition';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixObsidianBlackWorkflow() {
  console.log('🔧 Fixing Obsidian Black Renewal workflow...\n');

  // 1. Delete ALL existing records for this workflow
  console.log('1️⃣  Deleting existing records...');
  const { error: deleteError } = await supabase
    .from('workflow_definitions')
    .delete()
    .eq('workflow_id', 'obsidian-black-renewal');

  if (deleteError) {
    console.error('❌ Delete error:', deleteError);
    process.exit(1);
  }
  console.log('✅ Deleted all existing records\n');

  // 2. Insert fresh record with updated composition
  console.log('2️⃣  Inserting updated workflow...');

  const slideSequence = obsidianBlackRenewalComposition.slideSequence || [];
  const slideContexts = obsidianBlackRenewalComposition.slideContexts || {};

  console.log('   - Slide sequence:', slideSequence.join(', '));
  console.log('   - Total slides:', slideSequence.length);
  console.log('   - Has pricing-analysis override?', slideContexts['pricing-analysis']?.overrideStructure ? 'YES' : 'NO');

  const { data, error: insertError } = await supabase
    .from('workflow_definitions')
    .insert({
      workflow_id: 'obsidian-black-renewal',
      name: 'Obsidian Black Renewal',
      workflow_type: 'renewal',
      description: 'Custom renewal workflow for Obsidian Black (demo customer)',
      company_id: null,
      is_stock_workflow: true,
      slide_sequence: slideSequence,
      slide_contexts: slideContexts,
      trigger_conditions: {
        customer_id: '550e8400-e29b-41d4-a716-446655440001'
      },
      priority_weight: 600,
      version: 1
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Insert error:', insertError);
    process.exit(1);
  }

  console.log('✅ Inserted successfully (ID:', data.id, ')\n');

  // 3. Verify
  console.log('3️⃣  Verifying...');
  const { data: verify, error: verifyError } = await supabase
    .from('workflow_definitions')
    .select('workflow_id, slide_sequence, slide_contexts')
    .eq('workflow_id', 'obsidian-black-renewal')
    .single();

  if (verifyError) {
    console.error('❌ Verify error:', verifyError);
    process.exit(1);
  }

  console.log('✅ Verification successful');
  console.log('   - Slides:', verify.slide_sequence.length);
  console.log('   - Pricing override present?', verify.slide_contexts['pricing-analysis']?.overrideStructure ? 'YES ✅' : 'NO ❌');

  console.log('\n✅ Fix complete! Restart your dev server.');
}

fixObsidianBlackWorkflow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
