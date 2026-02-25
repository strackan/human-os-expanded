/**
 * Setup Demo Mode Password
 *
 * Sets a password for justin@renubu.com so demo mode can establish a real Supabase session
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(__dirname, '../.env.local') });

const STAGING_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const DEMO_EMAIL = 'justin@renubu.com';
const DEMO_PASSWORD = 'demo_renubu_2024!';

async function setupDemoPassword() {
  console.log('🔧 Setting up demo mode password...');
  console.log('📧 User:', DEMO_EMAIL);

  if (!STAGING_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY environment variables');
    process.exit(1);
  }

  const supabase = createClient(STAGING_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Get the user
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error listing users:', listError);
      process.exit(1);
    }

    const demoUser = users.users.find(u => u.email === DEMO_EMAIL);

    if (!demoUser) {
      console.error(`❌ User ${DEMO_EMAIL} not found in database`);
      console.log('📋 Available users:');
      users.users.forEach(u => console.log(`  - ${u.email} (${u.id})`));
      process.exit(1);
    }

    console.log('✅ Found user:', demoUser.email, '(', demoUser.id, ')');

    // Update the user's password
    console.log('🔐 Setting password...');
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      demoUser.id,
      { password: DEMO_PASSWORD }
    );

    if (updateError) {
      console.error('❌ Error updating password:', updateError);
      process.exit(1);
    }

    console.log('✅ Password set successfully!');
    console.log('🎮 Demo mode auto-authentication is now enabled');
    console.log('');
    console.log('📝 Configuration:');
    console.log('  Email:', DEMO_EMAIL);
    console.log('  Password:', DEMO_PASSWORD);
    console.log('  User ID:', demoUser.id);
    console.log('');
    console.log('✅ You can now restart the dev server and demo mode will auto-authenticate with a real session');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

setupDemoPassword();
