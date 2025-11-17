import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function setPassword() {
  const { error } = await supabase.auth.admin.updateUserById(
    '20a5304a-84b7-499a-ae88-520e09661969',
    { password: 'Demo123!@#' }
  );

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log('✅ Password set to: Demo123!@#');
  console.log('✅ Grace can now login at http://localhost:3000/login');
  console.log('   Email: grace@inhersight.com');
  console.log('   Password: Demo123!@#');
}

setPassword();
