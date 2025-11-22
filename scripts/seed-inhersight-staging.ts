/**
 * Seed InHerSight Workflows to Staging
 * Quick script to seed both 90-day and 120-day workflows
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://amugmkrihnjsxlpwdzcy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtdWdta3JpaG5qc3hscHdkemN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODE0MzExMiwiZXhwIjoyMDQzNzE5MTEyfQ.GBqzPNuZHbjpjcJkCu1W2Jnmm-5VHELXTqXx_KrAW_I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🚀 Seeding InHerSight workflows to staging...\n');

  // Import seed data
  const { inhersight90DayRenewalTemplate } = await import('./seed-inhersight-90day-template.js');

  console.log('1️⃣ Seeding 90-day renewal template...');

  // Delete existing
  await supabase
    .from('workflow_templates')
    .delete()
    .eq('name', 'inhersight_90day_renewal');

  // Insert new
  const { data, error } = await supabase
    .from('workflow_templates')
    .insert(inhersight90DayRenewalTemplate)
    .select()
    .single();

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log('✅ 90-day template seeded!');
  console.log(`   ID: ${data.id}`);
  console.log(`   Steps: ${data.base_steps.length}`);
  console.log(`   Artifacts: ${data.base_artifacts.length}`);

  console.log('\n🎉 InHerSight workflows seeded successfully!');
}

main();
