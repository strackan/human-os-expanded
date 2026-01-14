/**
 * Reset Activation Key
 *
 * Resets an activation key so it can be used again for testing.
 * Clears redeemed_at but preserves user linkage.
 *
 * Usage:
 *   npx tsx scripts/reset-activation-key.ts <code>
 *   npx tsx scripts/reset-activation-key.ts B744-DD4D-6D47
 *   npx tsx scripts/reset-activation-key.ts B744-DD4D-6D47 --full   # Also clears user linkage
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function resetKey(code: string, fullReset: boolean) {
  const normalizedCode = code.toUpperCase().trim();

  // Get current state
  const { data: before, error: fetchError } = await supabase
    .from('activation_keys')
    .select('code, product, redeemed_at, human_os_user_id, user_id, expires_at')
    .eq('code', normalizedCode)
    .single();

  if (fetchError || !before) {
    console.error(`Activation key "${normalizedCode}" not found`);
    process.exit(1);
  }

  console.log('Current state:');
  console.log(`  Code: ${before.code}`);
  console.log(`  Product: ${before.product}`);
  console.log(`  Redeemed: ${before.redeemed_at || 'no'}`);
  console.log(`  human_os_user_id: ${before.human_os_user_id || 'none'}`);
  console.log(`  user_id (legacy): ${before.user_id || 'none'}`);
  console.log(`  Expires: ${before.expires_at}`);

  // Build update
  const update: Record<string, unknown> = { redeemed_at: null };

  if (fullReset) {
    update.human_os_user_id = null;
    update.user_id = null;
  }

  // Apply reset
  const { data: after, error: updateError } = await supabase
    .from('activation_keys')
    .update(update)
    .eq('code', normalizedCode)
    .select('code, redeemed_at, human_os_user_id, user_id')
    .single();

  if (updateError) {
    console.error('Reset failed:', updateError.message);
    process.exit(1);
  }

  console.log('\nReset complete:');
  console.log(`  Redeemed: ${after.redeemed_at || 'no'}`);
  console.log(`  human_os_user_id: ${after.human_os_user_id || 'none'}`);
  console.log(`  user_id (legacy): ${after.user_id || 'none'}`);

  if (!fullReset && after.human_os_user_id) {
    console.log('\nNote: User linkage preserved. Use --full to clear it.');
  }
}

async function listKeys() {
  const { data: keys } = await supabase
    .from('activation_keys')
    .select('code, product, redeemed_at, human_os_user_id')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('Recent activation keys:');
  keys?.forEach(k => {
    const status = k.redeemed_at ? 'USED' : 'available';
    const user = k.human_os_user_id ? `(user: ${k.human_os_user_id.slice(0, 8)}...)` : '';
    console.log(`  ${k.code} [${k.product}] - ${status} ${user}`);
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--list') {
    await listKeys();
    console.log('\nUsage: npx tsx scripts/reset-activation-key.ts <code> [--full]');
    process.exit(0);
  }

  const code = args[0];
  const fullReset = args.includes('--full');

  await resetKey(code, fullReset);
}

main().catch(console.error);
