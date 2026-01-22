import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  console.log('=== Checking GAP_ANALYSIS_FINAL.md in Storage ===\n');

  const { data, error } = await supabase
    .storage
    .from('contexts')
    .download('scott/GAP_ANALYSIS_FINAL.md');

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  const text = await data.text();
  console.log('File size:', text.length, 'chars');
  console.log('\n--- First 2000 chars ---\n');
  console.log(text.substring(0, 2000));
}

check().catch(console.error);
