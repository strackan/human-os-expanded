/**
 * Provision a new Founder OS user for desktop app onboarding.
 *
 * Creates all necessary database records so the user can:
 *   1. Enter their activation code in the desktop exe
 *   2. Sign up with email/password
 *   3. Be automatically routed to the tutorial
 *
 * Prerequisites:
 *   - The user must have a completed sculptor session already
 *     (sculptor_sessions.status = 'completed')
 *   - OR pass --skip-sculptor-check to provision without one
 *
 * Usage:
 *   npx tsx scripts/provision-user.ts --name "Scott Leese" --email scott@example.com
 *   npx tsx scripts/provision-user.ts --name "Scott Leese" --email scott@example.com --sculptor-session <uuid>
 *   npx tsx scripts/provision-user.ts --name "Scott Leese" --email scott@example.com --expires 30
 *   npx tsx scripts/provision-user.ts --check <activation-code>
 *   npx tsx scripts/provision-user.ts --reset <activation-code>
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Ensure apps/goodhang/.env.local is configured.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        parsed[key] = next;
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function provisionUser(opts: {
  name: string;
  email: string;
  sculptorSessionId?: string;
  expiresInDays: number;
  skipSculptorCheck: boolean;
}) {
  const { name, email, expiresInDays, skipSculptorCheck } = opts;
  const slug = slugify(name);

  console.log('\n=== PROVISIONING FOUNDER OS USER ===');
  console.log(`Name:  ${name}`);
  console.log(`Email: ${email}`);
  console.log(`Slug:  ${slug}`);
  console.log('');

  // ---- Step 1: Find or create human_os.users record ----
  console.log('1. Finding/creating human_os.users record...');

  let humanOsUserId: string;

  const { data: existingUser } = await supabase
    .schema('human_os')
    .from('users')
    .select('id, display_name, email, slug, auth_id')
    .or(`email.eq.${email},slug.eq.${slug}`)
    .limit(1)
    .single();

  if (existingUser) {
    humanOsUserId = existingUser.id;
    console.log(`   Found existing: ${humanOsUserId}`);
    console.log(`   display_name: ${existingUser.display_name}`);
    console.log(`   auth_id: ${existingUser.auth_id || '(not linked yet - will link on claim)'}`);
  } else {
    const { data: newUser, error: createErr } = await supabase
      .schema('human_os')
      .from('users')
      .insert({
        display_name: name,
        email,
        slug,
      })
      .select('id')
      .single();

    if (createErr || !newUser) {
      console.error('   Failed to create user:', createErr?.message);
      process.exit(1);
    }
    humanOsUserId = newUser.id;
    console.log(`   Created: ${humanOsUserId}`);
  }

  // ---- Step 2: Ensure user_products entry for founder_os ----
  console.log('\n2. Ensuring founder_os product entry...');

  const { error: productErr } = await supabase
    .schema('human_os')
    .from('user_products')
    .upsert(
      {
        user_id: humanOsUserId,
        product: 'founder_os',
        tier: 'founder',
        metadata: { provisioned_at: new Date().toISOString() },
      },
      { onConflict: 'user_id,product' }
    );

  if (productErr) {
    console.error('   Failed:', productErr.message);
  } else {
    console.log('   founder_os product entry ready');
  }

  // ---- Step 3: Check sculptor session ----
  console.log('\n3. Checking sculptor session...');

  let sculptorSessionId = opts.sculptorSessionId || null;

  if (sculptorSessionId) {
    // Verify the provided session exists
    const { data: session } = await supabase
      .from('sculptor_sessions')
      .select('id, status, entity_name, user_id')
      .eq('id', sculptorSessionId)
      .single();

    if (!session) {
      console.error(`   Sculptor session ${sculptorSessionId} not found!`);
      process.exit(1);
    }

    console.log(`   Found session: ${session.id} (status: ${session.status}, entity: ${session.entity_name})`);

    // Link to user if not already linked
    if (session.user_id !== humanOsUserId) {
      const { error: linkErr } = await supabase
        .from('sculptor_sessions')
        .update({ user_id: humanOsUserId })
        .eq('id', sculptorSessionId);

      if (linkErr) {
        console.error('   Failed to link sculptor session to user:', linkErr.message);
      } else {
        console.log(`   Linked sculptor session to user ${humanOsUserId}`);
      }
    }
  } else {
    // Search for existing session by user_id or entity name
    const { data: sessions } = await supabase
      .from('sculptor_sessions')
      .select('id, status, entity_name, entity_slug, user_id, metadata')
      .or(`user_id.eq.${humanOsUserId},entity_slug.eq.${slug}`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessions && sessions.length > 0) {
      const session = sessions[0];
      sculptorSessionId = session.id;
      console.log(`   Found session: ${session.id} (status: ${session.status}, entity: ${session.entity_name})`);

      // Link to user if not already linked
      if (session.user_id !== humanOsUserId) {
        await supabase
          .from('sculptor_sessions')
          .update({ user_id: humanOsUserId })
          .eq('id', sculptorSessionId);
        console.log(`   Linked sculptor session to user`);
      }

      if (session.status !== 'completed') {
        console.warn(`   WARNING: Sculptor session status is '${session.status}', not 'completed'`);
        console.warn('   The tutorial requires a completed sculptor session.');
        if (!skipSculptorCheck) {
          console.error('   Pass --skip-sculptor-check to proceed anyway.');
          process.exit(1);
        }
      }
    } else {
      console.warn('   No sculptor session found for this user.');
      if (!skipSculptorCheck) {
        console.error('   The user needs a completed sculptor session for the tutorial.');
        console.error('   Either:');
        console.error('     --sculptor-session <uuid>  to link an existing session');
        console.error('     --skip-sculptor-check      to provision without one');
        process.exit(1);
      }
      console.warn('   Proceeding without sculptor session (--skip-sculptor-check)');
    }
  }

  // ---- Step 4: Generate activation key ----
  console.log('\n4. Generating activation key...');

  // Check if there's already an unredeemed key for this user
  const { data: existingKey } = await supabase
    .from('activation_keys')
    .select('code, product, expires_at, redeemed_at')
    .eq('human_os_user_id', humanOsUserId)
    .is('redeemed_at', null)
    .single();

  let activationCode: string;

  if (existingKey) {
    activationCode = existingKey.code;
    console.log(`   Found existing unredeemed key: ${activationCode}`);
    console.log(`   Product: ${existingKey.product}, Expires: ${existingKey.expires_at}`);
  } else {
    // Generate via RPC
    const { data: keyData, error: keyErr } = await supabase.rpc('create_activation_key', {
      p_product: 'founder_os',
      p_session_id: null,
      p_expires_in_days: expiresInDays,
      p_metadata: {
        provisioned_for: name,
        provisioned_email: email,
      },
    });

    if (keyErr || !keyData || keyData.length === 0) {
      console.error('   Failed to generate key:', keyErr?.message);
      // Fallback: try direct insert
      console.log('   Trying direct insert fallback...');
      const code = `FO-${randomChars(4)}-${randomChars(4)}`;
      const expiresAt = new Date(Date.now() + expiresInDays * 86400000).toISOString();

      const { error: insertErr } = await supabase
        .from('activation_keys')
        .insert({
          code,
          product: 'founder_os',
          human_os_user_id: humanOsUserId,
          expires_at: expiresAt,
          metadata: { provisioned_for: name, provisioned_email: email },
        });

      if (insertErr) {
        console.error('   Direct insert also failed:', insertErr.message);
        console.error('   You may need to run the migration first:');
        console.error('   supabase db push (to add founder_os to x_human.product_type)');
        process.exit(1);
      }
      activationCode = code;
    } else {
      activationCode = keyData[0].code;
    }

    // Link human_os_user_id to the key
    await supabase
      .from('activation_keys')
      .update({ human_os_user_id: humanOsUserId })
      .eq('code', activationCode);

    console.log(`   Generated: ${activationCode}`);
  }

  // ---- Summary ----
  console.log('\n' + '='.repeat(60));
  console.log('PROVISIONING COMPLETE');
  console.log('='.repeat(60));
  console.log('');
  console.log(`  User:              ${name} <${email}>`);
  console.log(`  human_os.users.id: ${humanOsUserId}`);
  console.log(`  Sculptor session:  ${sculptorSessionId || 'none'}`);
  console.log(`  Activation code:   ${activationCode}`);
  console.log('');
  console.log('Next steps for the user:');
  console.log(`  1. Download and install the desktop app`);
  console.log(`  2. Enter activation code: ${activationCode}`);
  console.log(`  3. Create account with email: ${email}`);
  console.log(`  4. App will auto-route to the tutorial`);
  console.log('');
  console.log('The claim endpoint will automatically:');
  console.log('  - Link auth.users.id to human_os.users.auth_id');
  console.log('  - Create user_products entry');
  console.log('  - Enable the tutorial flow');
}

async function checkUser(code: string) {
  console.log(`\n=== CHECKING ACTIVATION CODE: ${code} ===\n`);

  const normalizedCode = code.toUpperCase().trim();

  // 1. Activation key
  const { data: key, error: keyErr } = await supabase
    .from('activation_keys')
    .select('*')
    .eq('code', normalizedCode)
    .single();

  if (keyErr || !key) {
    console.log('Activation key: NOT FOUND');
    return;
  }

  console.log('1. Activation key:');
  console.log(`   Code:             ${key.code}`);
  console.log(`   Product:          ${key.product}`);
  console.log(`   user_id:          ${key.user_id || '(not claimed)'}`);
  console.log(`   human_os_user_id: ${key.human_os_user_id || '(none)'}`);
  console.log(`   redeemed_at:      ${key.redeemed_at || '(not redeemed)'}`);
  console.log(`   expires_at:       ${key.expires_at}`);

  // 2. human_os.users
  if (key.human_os_user_id) {
    const { data: user } = await supabase
      .schema('human_os')
      .from('users')
      .select('id, display_name, email, slug, auth_id')
      .eq('id', key.human_os_user_id)
      .single();

    console.log('\n2. human_os.users:');
    if (user) {
      console.log(`   display_name: ${user.display_name}`);
      console.log(`   email:        ${user.email}`);
      console.log(`   slug:         ${user.slug}`);
      console.log(`   auth_id:      ${user.auth_id || '(NOT LINKED - will link on claim)'}`);
    } else {
      console.log('   NOT FOUND');
    }

    // 3. user_products
    const { data: products } = await supabase
      .schema('human_os')
      .from('user_products')
      .select('product, tier, activated_at')
      .eq('user_id', key.human_os_user_id);

    console.log('\n3. user_products:');
    if (products && products.length > 0) {
      products.forEach((p) => console.log(`   ${p.product} (tier: ${p.tier})`));
    } else {
      console.log('   No products found');
    }

    // 4. sculptor_sessions
    const { data: sessions } = await supabase
      .from('sculptor_sessions')
      .select('id, status, entity_name, entity_slug')
      .eq('user_id', key.human_os_user_id)
      .order('created_at', { ascending: false })
      .limit(3);

    console.log('\n4. sculptor_sessions:');
    if (sessions && sessions.length > 0) {
      sessions.forEach((s) =>
        console.log(`   ${s.id} | status: ${s.status} | entity: ${s.entity_name || s.entity_slug}`)
      );
    } else {
      console.log('   No sessions found');
    }
  }

  // 5. Diagnosis
  console.log('\n=== DIAGNOSIS ===');
  const issues: string[] = [];

  if (!key.human_os_user_id) issues.push('No human_os_user_id on activation key');
  if (key.redeemed_at) issues.push('Key already redeemed - user should be able to re-auth');
  if (new Date(key.expires_at) < new Date()) issues.push('Key has EXPIRED');

  if (key.human_os_user_id) {
    const { data: user } = await supabase
      .schema('human_os')
      .from('users')
      .select('auth_id')
      .eq('id', key.human_os_user_id)
      .single();

    if (!user?.auth_id && key.redeemed_at) {
      issues.push('human_os.users.auth_id not set despite key being redeemed - status endpoint will fail');
    }

    const { data: products } = await supabase
      .schema('human_os')
      .from('user_products')
      .select('product')
      .eq('user_id', key.human_os_user_id)
      .eq('product', 'founder_os');

    if (!products || products.length === 0) {
      issues.push('No founder_os user_products entry');
    }

    const { data: sessions } = await supabase
      .from('sculptor_sessions')
      .select('status')
      .eq('user_id', key.human_os_user_id)
      .eq('status', 'completed')
      .limit(1);

    if (!sessions || sessions.length === 0) {
      issues.push('No completed sculptor session - tutorial will not be accessible');
    }
  }

  if (issues.length === 0) {
    console.log('All clear - user is ready to go!');
  } else {
    issues.forEach((i) => console.log(`- ${i}`));
  }
}

async function resetKey(code: string) {
  const normalizedCode = code.toUpperCase().trim();

  console.log(`\nResetting activation key: ${normalizedCode}`);

  const { data, error } = await supabase
    .from('activation_keys')
    .update({ redeemed_at: null, user_id: null })
    .eq('code', normalizedCode)
    .select('code, human_os_user_id, redeemed_at');

  if (error) {
    console.error('Error:', error.message);
  } else if (!data || data.length === 0) {
    console.error('Key not found');
  } else {
    console.log('Reset complete:', data[0]);
    console.log('human_os_user_id preserved (key is still linked to user).');
    console.log('The user can now re-enter this code to re-authenticate.');

    // Also clear auth_id on human_os.users so it can be re-linked
    if (data[0].human_os_user_id) {
      const { error: clearErr } = await supabase
        .schema('human_os')
        .from('users')
        .update({ auth_id: null })
        .eq('id', data[0].human_os_user_id);

      if (!clearErr) {
        console.log('Cleared auth_id on human_os.users (will re-link on next claim).');
      }
    }
  }
}

function randomChars(n: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < n; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function printUsage() {
  console.log(`
Usage:
  Provision a new user:
    npx tsx scripts/provision-user.ts --name "Full Name" --email user@example.com [options]

  Options:
    --sculptor-session <uuid>   Link to a specific sculptor session
    --expires <days>            Activation key expiry (default: 30)
    --skip-sculptor-check       Provision even without a completed sculptor session

  Check an existing activation code:
    npx tsx scripts/provision-user.ts --check <activation-code>

  Reset an activation code (allow re-use):
    npx tsx scripts/provision-user.ts --reset <activation-code>

Examples:
  npx tsx scripts/provision-user.ts --name "Scott Leese" --email scott@example.com
  npx tsx scripts/provision-user.ts --check FO-XXXX-XXXX
  npx tsx scripts/provision-user.ts --reset FO-XXXX-XXXX
`);
}

async function main() {
  const args = parseArgs();

  if (args.check && typeof args.check === 'string') {
    await checkUser(args.check);
  } else if (args.reset && typeof args.reset === 'string') {
    await resetKey(args.reset);
  } else if (args.name && args.email) {
    await provisionUser({
      name: args.name as string,
      email: args.email as string,
      sculptorSessionId: typeof args['sculptor-session'] === 'string' ? args['sculptor-session'] : undefined,
      expiresInDays: typeof args.expires === 'string' ? parseInt(args.expires, 10) : 30,
      skipSculptorCheck: !!args['skip-sculptor-check'],
    });
  } else {
    printUsage();
  }
}

main().catch(console.error);
