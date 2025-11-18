/**
 * Create obsidian-black-renewal-v2 workflow
 *
 * Exact copy of obsidian-black-renewal for iterative migration testing
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

async function createWorkflowV2() {
  console.log('Fetching obsidian-black-renewal workflow...');

  // Get the stock workflow (company_id IS NULL)
  const { data: originals, error: fetchError } = await supabase
    .from('workflow_definitions')
    .select('*')
    .eq('workflow_id', 'obsidian-black-renewal')
    .is('company_id', null);

  if (fetchError) {
    console.error('Error fetching workflows:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${originals?.length || 0} workflows with ID 'obsidian-black-renewal' and company_id IS NULL`);

  if (!originals || originals.length === 0) {
    console.error('No stock workflow found');
    process.exit(1);
  }

  // Use the first one (or you can select based on created_at)
  const original = originals[0];

  console.log('Original workflow found:', original.workflow_id);
  console.log('Slide sequence:', original.slide_sequence);

  // Check if v2 already exists
  const { data: existing } = await supabase
    .from('workflow_definitions')
    .select('workflow_id')
    .eq('workflow_id', 'obsidian-black-renewal-v2')
    .single();

  if (existing) {
    console.log('obsidian-black-renewal-v2 already exists, deleting...');
    await supabase
      .from('workflow_definitions')
      .delete()
      .eq('workflow_id', 'obsidian-black-renewal-v2');
  }

  // Create v2 copy
  const v2Workflow = {
    workflow_id: 'obsidian-black-renewal-v2',
    name: original.name + ' (v2 Migration)',
    workflow_type: original.workflow_type,
    slide_sequence: original.slide_sequence,
    slide_contexts: original.slide_contexts,
    is_template: original.is_template,
    company_id: original.company_id,
    created_at: new Date().toISOString(),
  };

  const { data: created, error: createError } = await supabase
    .from('workflow_definitions')
    .insert(v2Workflow)
    .select()
    .single();

  if (createError) {
    console.error('Error creating v2 workflow:', createError);
    process.exit(1);
  }

  console.log('✅ Successfully created obsidian-black-renewal-v2');
  console.log('Workflow ID:', created.workflow_id);
  console.log('Slides:', created.slide_sequence);
}

createWorkflowV2();
