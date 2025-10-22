import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function cleanupWorkflows() {
  console.log('\n🧹 CLEANING UP WORKFLOW_DEFINITIONS TABLE\n');

  // Step 1: Delete duplicate "Duplicate Test" rows
  console.log('1️⃣  Deleting duplicate test rows...');
  const { data: duplicates, error: deleteError } = await supabase
    .from('workflow_definitions')
    .delete()
    .eq('name', 'Duplicate Test')
    .select();

  if (deleteError) {
    console.error('❌ Error deleting duplicates:', deleteError.message);
  } else {
    console.log(`   ✅ Deleted ${duplicates?.length || 0} duplicate rows\n`);
  }

  // Step 2: Update old workflows - mark obsidian-black workflows as stock
  console.log('2️⃣  Updating old Obsidian Black workflows...');

  const obsidianWorkflows = [
    'complete-strategic-account-plan-for-obsidian-black',
    'executive-engagement-with-obsidian-black',
    'expansion-opportunity-for-obsidian-black'
  ];

  for (const workflowId of obsidianWorkflows) {
    const { error: updateError } = await supabase
      .from('workflow_definitions')
      .update({ is_stock_workflow: true })
      .eq('workflow_id', workflowId)
      .is('company_id', null);

    if (updateError) {
      console.error(`   ❌ Error updating ${workflowId}:`, updateError.message);
    } else {
      console.log(`   ✅ Updated ${workflowId}`);
    }
  }

  // Step 3: Verify final state
  console.log('\n3️⃣  Verifying final state...\n');
  const { data: finalData, error: finalError } = await supabase
    .from('workflow_definitions')
    .select('workflow_id, name, company_id, is_stock_workflow')
    .order('workflow_id');

  if (finalError) {
    console.error('❌ Error:', finalError.message);
    return;
  }

  console.log(`Found ${finalData.length} workflows after cleanup:\n`);
  finalData.forEach((w, i) => {
    console.log(`${i + 1}. ${w.workflow_id} - ${w.name}`);
    console.log(`   Stock: ${w.is_stock_workflow}, Company: ${w.company_id || 'null'}\n`);
  });

  // Check for duplicates again
  const idCounts = finalData.reduce((acc, w) => {
    const key = `${w.workflow_id}|${w.company_id}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stillDuplicates = Object.entries(idCounts).filter(([_, count]) => count > 1);

  if (stillDuplicates.length > 0) {
    console.log('⚠️  DUPLICATES STILL EXIST:');
    stillDuplicates.forEach(([key, count]) => {
      console.log(`   ${key}: ${count} rows`);
    });
  } else {
    console.log('✅ No duplicates found!\n');
  }
}

cleanupWorkflows()
  .then(() => {
    console.log('✅ Cleanup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
