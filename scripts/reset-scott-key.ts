import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in apps/goodhang-desktop/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function reset() {
  // Reset the activation key so it can be used again
  const { data, error } = await supabase
    .from('activation_keys')
    .update({ redeemed_at: null })
    .eq('code', 'B744-DD4D-6D47')
    .select('code, redeemed_at, user_id');

  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Reset activation key:', data);
    console.log('\nYou can now re-enter the code B744-DD4D-6D47 in the app');
  }
}

reset().catch(console.error);
