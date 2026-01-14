/**
 * Setup Scott Leese's auth account and link activation key
 *
 * Usage:
 *   npx tsx scripts/setup-scott-account.ts <email>
 *   npx tsx scripts/setup-scott-account.ts --link-user <user_id>
 *
 * Option 1: Create new account
 *   npx tsx scripts/setup-scott-account.ts scott@scottleese.com
 *   This creates an auth user and links the activation key.
 *
 * Option 2: Link existing account
 *   npx tsx scripts/setup-scott-account.ts --link-user <user_id>
 *   Use this after Scott signs in via LinkedIn OAuth on the web.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment from goodhang app
dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Scott's data
const ACTIVATION_KEY_CODE = 'B744-DD4D-6D47';
const SCOTT_ENTITY_ID = '340263f1-3d46-4ad3-b691-9ff316d7767f';
const SCOTT_CONTACT_ID = '7e4994d7-5448-4b2e-9d7f-a529594a5bdb';
const TEMP_PASSWORD = 'ScottFounder2025!';

async function createAccountAndLink(email: string) {
  console.log(`\nCreating account for: ${email}`);

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  let userId: string;

  if (existingUser) {
    console.log(`Found existing user: ${existingUser.id}`);
    userId = existingUser.id;
  } else {
    console.log('Creating new auth user...');
    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password: TEMP_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: 'Scott Leese',
          name: 'Scott Leese',
        },
      });

    if (createError) {
      console.error('Error creating user:', createError.message);
      process.exit(1);
    }

    userId = newUser.user.id;
    console.log(`Created new user: ${userId}`);
    console.log(`Temporary password: ${TEMP_PASSWORD}`);
  }

  await linkActivationKey(userId);
}

async function linkActivationKey(userId: string) {
  console.log(`\nLinking activation key ${ACTIVATION_KEY_CODE} to user ${userId}...`);

  // Update activation key
  const { error: keyError } = await supabase
    .from('activation_keys')
    .update({ user_id: userId })
    .eq('code', ACTIVATION_KEY_CODE);

  if (keyError) {
    console.error('Error updating activation key:', keyError.message);
  } else {
    console.log('Activation key linked successfully');
  }

  // Create/update profile
  console.log('\nCreating/updating profile...');
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      name: 'Scott Leese',
      membership_tier: 'founder',
      user_role: 'member',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    console.error('Error with profile:', profileError.message);
  } else {
    console.log('Profile created/updated');
  }

  // Link entity to user
  console.log('\nLinking entity to user...');
  const { error: entityError } = await supabase
    .from('entities')
    .update({ claimed_by_user_id: userId })
    .eq('id', SCOTT_ENTITY_ID);

  if (entityError) {
    console.error('Entity link error:', entityError.message);
  } else {
    console.log('Entity linked to user');
  }

  // Verify the update
  const { data: updatedKey } = await supabase
    .from('activation_keys')
    .select('code, user_id')
    .eq('code', ACTIVATION_KEY_CODE)
    .single();

  console.log('\n' + '='.repeat(50));
  console.log('SETUP COMPLETE');
  console.log('='.repeat(50));
  console.log(`User ID: ${userId}`);
  console.log(`Activation Key: ${ACTIVATION_KEY_CODE}`);
  console.log(`Key user_id now: ${updatedKey?.user_id}`);
  console.log('\nScott can now:');
  console.log('1. Enter activation key in desktop app');
  console.log('2. App will route to SIGNIN (existing user)');
  console.log('3. Sign in with email/password or LinkedIn');
}

async function findRecentUsers() {
  console.log('\nRecent auth users:');
  const { data: users } = await supabase.auth.admin.listUsers();
  users?.users
    ?.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)
    .forEach((u) => {
      console.log(`  ${u.email}: ${u.id} (${u.created_at})`);
    });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log(
      '  npx tsx scripts/setup-scott-account.ts <email>           - Create account and link key'
    );
    console.log(
      '  npx tsx scripts/setup-scott-account.ts --link-user <id>  - Link key to existing user'
    );
    console.log(
      '  npx tsx scripts/setup-scott-account.ts --list-users      - Show recent users'
    );
    console.log('\nExample:');
    console.log('  npx tsx scripts/setup-scott-account.ts scott@scottleese.com');
    await findRecentUsers();
    process.exit(0);
  }

  if (args[0] === '--link-user') {
    if (!args[1]) {
      console.error('Missing user ID');
      process.exit(1);
    }
    await linkActivationKey(args[1]);
  } else if (args[0] === '--list-users') {
    await findRecentUsers();
  } else {
    // Assume first arg is email
    await createAccountAndLink(args[0]);
  }
}

main().catch(console.error);
