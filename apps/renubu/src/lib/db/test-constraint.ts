import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testConstraint() {
  console.log('\n🔍 TESTING UNIQUE CONSTRAINT\n');

  // Step 1: Try to insert a duplicate stock workflow
  console.log('1️⃣  Attempting to insert duplicate standard-renewal...');

  const { error } = await supabase
    .from('workflow_definitions')
    .insert({
      workflow_id: 'standard-renewal',
      name: 'Duplicate Test',
      workflow_type: 'renewal',
      company_id: null,
      is_stock_workflow: true,
      slide_sequence: ['greeting'],
      slide_contexts: {}
    });

  if (error) {
    if (error.message.includes('unique') || error.code === '23505') {
      console.log('   ✅ Constraint working! Got unique violation error:');
      console.log(`      ${error.message}\n`);
    } else {
      console.log('   ❌ Different error (not unique constraint):');
      console.log(`      ${error.message}\n`);
    }
  } else {
    console.log('   ⚠️  WARNING: Insert succeeded - constraint NOT working!\n');

    // Clean up the duplicate we just created
    console.log('   🧹 Cleaning up duplicate...');
    await supabase
      .from('workflow_definitions')
      .delete()
      .eq('name', 'Duplicate Test');
    console.log('   ✅ Cleaned up\n');
  }

  console.log('✅ Constraint test complete!');
}

testConstraint()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
