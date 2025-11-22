#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://amugmkrihnjsxlpwdzcy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtdWdta3JpaG5qc3hscHdkemN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNjg5MiwiZXhwIjoyMDc3MDgyODkyfQ.gnUWQYmviaKUcm3haH672v-VK-G1p-Bqyq-EfBNXYfo'
);

async function main() {
  // Get the template
  const { data: template } = await supabase
    .from('workflow_templates')
    .select('base_artifacts')
    .eq('name', 'inhersight_90day_renewal')
    .single();

  console.log('=== INHERSIGHT 90-DAY RENEWAL ARTIFACTS ===\n');

  const converted = [];
  const unconverted = [];

  template.base_artifacts.forEach((artifact: any) => {
    const hasComponent = !!artifact.component_id;
    const status = hasComponent ? '✅' : '⚠️ ';

    console.log(`${status} ${artifact.artifact_id}`);
    console.log(`   Type: ${artifact.artifact_type}`);
    console.log(`   Component: ${artifact.component_id || 'NONE - Generic document rendering'}`);
    console.log('');

    if (hasComponent) {
      converted.push(artifact.artifact_id);
    } else {
      unconverted.push(artifact.artifact_id);
    }
  });

  console.log('=== SUMMARY ===');
  console.log(`✅ Converted (with component): ${converted.length}`);
  console.log(`⚠️  Unconverted (generic): ${unconverted.length}\n`);

  if (unconverted.length > 0) {
    console.log('Unconverted artifacts (using generic document rendering):');
    unconverted.forEach(id => console.log(`  - ${id}`));
  }
}

main();
