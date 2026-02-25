/**
 * Cleanup Duplicate Workflow Modifications
 *
 * Removes duplicate modifications that were created by running seed script multiple times
 *
 * Usage: npx tsx scripts/cleanup-duplicate-mods.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupDuplicates() {
  console.log('🧹 Cleaning up duplicate workflow modifications...\n');

  // Get all modifications
  const { data: allMods, error } = await supabase
    .from('workflow_modifications')
    .select('*')
    .eq('is_active', true)
    .order('created_at');

  if (error) {
    console.error('❌ Error fetching modifications:', error);
    return;
  }

  console.log(`Found ${allMods?.length} total modifications\n`);

  // Group by unique signature (scope_type + modification_type + step_name + position + criteria)
  const groups = new Map<string, any[]>();

  allMods?.forEach(mod => {
    const signature = JSON.stringify({
      scope_type: mod.scope_type,
      scope_id: mod.scope_id,
      modification_type: mod.modification_type,
      target_step_id: mod.target_step_id,
      target_position: mod.target_position,
      step_name: mod.modification_data?.step_name,
      artifact_id: mod.modification_data?.artifact_id,
      scope_criteria: mod.scope_criteria
    });

    if (!groups.has(signature)) {
      groups.set(signature, []);
    }
    groups.get(signature)!.push(mod);
  });

  console.log(`Found ${groups.size} unique modifications\n`);

  let duplicatesRemoved = 0;

  // For each group, keep the earliest one and delete the rest
  for (const [signature, mods] of groups.entries()) {
    if (mods.length > 1) {
      const parsed = JSON.parse(signature);
      console.log(`\n🔍 Found ${mods.length} duplicates:`);
      console.log(`   Type: ${parsed.scope_type} - ${parsed.modification_type}`);
      console.log(`   Step: ${parsed.step_name || parsed.artifact_id || 'N/A'}`);
      console.log(`   Position: ${parsed.target_position || 'N/A'}`);

      // Keep the first one (oldest), delete the rest
      const toKeep = mods[0];
      const toDelete = mods.slice(1);

      console.log(`   ✅ Keeping: ${toKeep.id} (created ${toKeep.created_at})`);

      for (const mod of toDelete) {
        console.log(`   ❌ Deleting: ${mod.id} (created ${mod.created_at})`);

        const { error: deleteError } = await supabase
          .from('workflow_modifications')
          .delete()
          .eq('id', mod.id);

        if (deleteError) {
          console.error(`      Error deleting: ${deleteError.message}`);
        } else {
          duplicatesRemoved++;
        }
      }
    }
  }

  console.log(`\n✨ Cleanup complete!`);
  console.log(`   Removed ${duplicatesRemoved} duplicate modifications`);
  console.log(`   Remaining: ${allMods!.length - duplicatesRemoved} unique modifications\n`);
}

cleanupDuplicates()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });
