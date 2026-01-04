/**
 * Create admin user for GoodHang
 * Usage: npx tsx scripts/create-admin.ts justin@renubu.com "YourPassword"
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function createAdmin(email: string, password: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('\n🔐 Creating admin user...\n');

  // Try to create user (or get existing)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    // User might already exist, try to get them
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error:', listError);
      process.exit(1);
    }

    const existingUser = users?.find(u => u.email === email);

    if (!existingUser) {
      console.error('❌ Error creating user:', authError);
      process.exit(1);
    }

    console.log('ℹ️  User already exists');

    // Update/create profile for existing user
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: existingUser.id,
        email,
        name: 'Justin',
        user_role: 'admin',
        membership_tier: 'core',
      });

    if (profileError) {
      console.error('❌ Error updating profile:', profileError);
      process.exit(1);
    }

    console.log('\n✅ Admin privileges granted!\n');
    console.log('User Details:');
    console.log('─────────────────────────────────────────');
    console.log(`Email:       ${email}`);
    console.log(`User ID:     ${existingUser.id}`);
    console.log(`Role:        admin`);
    console.log(`Tier:        core`);
    console.log('─────────────────────────────────────────\n');

  } else {
    // New user created, create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        name: 'Justin',
        user_role: 'admin',
        membership_tier: 'core',
      });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      process.exit(1);
    }

    console.log('\n✅ Admin user created successfully!\n');
    console.log('User Details:');
    console.log('─────────────────────────────────────────');
    console.log(`Email:       ${email}`);
    console.log(`Password:    ${password}`);
    console.log(`User ID:     ${authData.user.id}`);
    console.log(`Role:        admin`);
    console.log(`Tier:        core`);
    console.log('─────────────────────────────────────────\n');
  }

  console.log('🌐 You can now log in at: http://localhost:3200/login\n');
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: npx tsx scripts/create-admin.ts <email> <password>');
  process.exit(1);
}

createAdmin(email, password);
