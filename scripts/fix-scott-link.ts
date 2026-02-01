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
  
  if (humanOsUser) {
    // Re-link the activation key (keep redeemed_at null so he can re-activate)
    const { data, error } = await supabase
      .from('activation_keys')
      .update({ 
        user_id: authId,
        human_os_user_id: humanOsUser.id 
      })
      .eq('code', 'B744-DD4D-6D47')
      .select('code, user_id, human_os_user_id, redeemed_at');
    
    console.log('Updated key:', data);
    if (error) console.error('Update error:', error.message);
  } else {
    console.log('No human_os user found - just linking auth user');
    const { data, error } = await supabase
      .from('activation_keys')
      .update({ user_id: authId })
      .eq('code', 'B744-DD4D-6D47')
      .select('code, user_id, human_os_user_id, redeemed_at');
    
    console.log('Updated key:', data);
    if (error) console.error('Update error:', error.message);
  }
}

fix();
