import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function update() {
  // Update Scott's sculptor session to completed
  const { data, error } = await supabase
    .from('sculptor_sessions')
    .update({ status: 'completed' })
    .eq('access_code', 'sc_scottleese')
    .select('id, entity_name, status, access_code');

  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Updated session:', data);
  }
}

update().catch(console.error);
