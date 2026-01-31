import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang-desktop/.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function check() {
  // First, list all activation keys to see what exists
  const { data: allKeys, error: listError } = await supabase
    .from('activation_keys')
    .select('code, redeemed_at, human_os_user_id')
    .limit(10);

  if (listError) {
    console.log('Error listing keys:', listError.message);
    return;
  }

  console.log('All activation keys:');
  if (!allKeys || allKeys.length === 0) {
    console.log('  (none found - RLS may be blocking access)');
  } else {
    allKeys.forEach(k => {
      console.log(`  ${k.code} - ${k.redeemed_at ? 'USED' : 'available'} - user: ${k.human_os_user_id || 'none'}`);
    });
  }
}

check().catch(console.error);
