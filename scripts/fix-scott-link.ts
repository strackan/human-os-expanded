import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fix() {
  const authId = '083591d4-7008-4538-a929-c1e7d0c9bfb0';
  
  // Find his human_os.users record
  const { data: humanOsUser, error: userError } = await supabase
    .schema('human_os')
    .from('users')
    .select('id, auth_id, email')
    .eq('auth_id', authId)
    .single();
  
  console.log('Found human_os user:', humanOsUser);
  if (userError) console.log('User lookup error:', userError.message);
  
  const scottSessionId = '408c50a8-748d-4ba2-9852-c49b95c26345';

  if (humanOsUser) {
    // Re-link the activation key with session_id
    const { data, error } = await supabase
      .from('activation_keys')
      .update({
        user_id: authId,
        human_os_user_id: humanOsUser.id,
        session_id: scottSessionId
      })
      .eq('code', 'B744-DD4D-6D47')
      .select('code, user_id, human_os_user_id, session_id, redeemed_at');
    
    console.log('Updated key:', data);
    if (error) console.error('Update error:', error.message);
  } else {
    console.log('No human_os user found - just linking auth user');
    const { data, error } = await supabase
      .from('activation_keys')
      .update({ user_id: authId, session_id: scottSessionId })
      .eq('code', 'B744-DD4D-6D47')
      .select('code, user_id, human_os_user_id, session_id, redeemed_at');
    
    console.log('Updated key:', data);
    if (error) console.error('Update error:', error.message);
  }
}

fix();
