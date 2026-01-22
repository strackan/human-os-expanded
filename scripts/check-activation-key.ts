import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data, error } = await supabase
    .from('activation_keys')
    .select('code, product, session_id, user_id, human_os_user_id, redeemed_at, metadata')
    .eq('code', 'B744-DD4D-6D47')
    .single();

  console.log('Activation key data:');
  console.log(JSON.stringify(data, null, 2));
  if (error) console.error('Error:', error);
}

check().catch(console.error);
