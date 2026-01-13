import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function debugWorkflows() {
  console.log('\n📊 QUERYING WORKFLOW_DEFINITIONS TABLE\n');

  const { data, error } = await supabase
    .from('workflow_definitions')
    .select('id, workflow_id, name, company_id, is_stock_workflow')
    .order('workflow_id');

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`Found ${data.length} total workflows:\n`);

  data.forEach((w, i) => {
    console.log(`${i + 1}. ${w.workflow_id}`);
    console.log(`   Name: ${w.name}`);
    console.log(`   Company ID: ${w.company_id || 'null (stock)'}`);
    console.log(`   Is Stock: ${w.is_stock_workflow}`);
    console.log('');
  });

  // Check for duplicates
  const idCounts = data.reduce((acc, w) => {
    const key = `${w.workflow_id}|${w.company_id}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const duplicates = Object.entries(idCounts).filter(([_, count]) => count > 1);

  if (duplicates.length > 0) {
    console.log('⚠️  DUPLICATES FOUND:');
    duplicates.forEach(([key, count]) => {
      console.log(`   ${key}: ${count} rows`);
    });
  }
}

debugWorkflows();
