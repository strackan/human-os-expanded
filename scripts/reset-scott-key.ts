import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
