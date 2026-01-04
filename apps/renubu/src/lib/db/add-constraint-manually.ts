import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function addConstraint() {
  console.log('\n🔧 MANUALLY ADDING UNIQUE CONSTRAINT\n');

  // First, check current constraints
  console.log('1️⃣  Checking current constraints...');

  const { data: currentConstraints, error: checkError } = await supabase
    .from('workflow_definitions')
    .select('*')
    .limit(0); // Just to check table structure

  console.log('   Table accessible:', !checkError);

  // Execute SQL to add constraint
  console.log('\n2️⃣  Adding constraint via raw SQL...');

  try {
    // Try using the SQL editor via REST API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        query: `
          ALTER TABLE workflow_definitions
          DROP CONSTRAINT IF EXISTS unique_workflow_per_company;

          ALTER TABLE workflow_definitions
          ADD CONSTRAINT unique_workflow_per_company
          UNIQUE (company_id, workflow_id);
        `
      })
    });

    console.log('   Response status:', response.status);
    const result = await response.text();
    console.log('   Result:', result);

  } catch (error: any) {
    console.log('   ℹ️  Direct SQL execution not available via API');
    console.log('   Please run this SQL manually in Supabase dashboard:');
    console.log('\n   ----------------------------------------');
    console.log('   ALTER TABLE workflow_definitions');
    console.log('   DROP CONSTRAINT IF EXISTS unique_workflow_per_company;');
    console.log('');
    console.log('   ALTER TABLE workflow_definitions');
    console.log('   ADD CONSTRAINT unique_workflow_per_company');
    console.log('   UNIQUE (company_id, workflow_id);');
    console.log('   ----------------------------------------\n');
  }
}

addConstraint()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
