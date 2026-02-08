import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function find() {
  const { data: sessions, error: sessErr } = await db
    .from('sculptor_sessions')
    .select('id, entity_name, entity_slug, status, user_id, created_at')
    .order('created_at', { ascending: false });

  console.log('=== ALL SCULPTOR SESSIONS ===');
  if (sessErr) console.log('Error:', sessErr.message);
  if (sessions?.length) {
    sessions.forEach(s => console.log(`  ${(s.entity_name || s.entity_slug || '??').padEnd(20)} | status: ${s.status.padEnd(10)} | user_id: ${s.user_id || 'NONE'.padEnd(36)} | id: ${s.id}`));
  } else {
    console.log('  No sessions found');
  }

  const { data: users, error: userErr } = await db
    .schema('human_os')
    .from('users')
    .select('id, display_name, email, slug, auth_id');

  console.log('\n=== ALL HUMAN_OS USERS ===');
  if (userErr) console.log('Error:', userErr.message);
  if (users?.length) {
    users.forEach(u => console.log(`  ${(u.display_name || '??').padEnd(20)} | email: ${(u.email || '').padEnd(30)} | auth_id: ${u.auth_id ? 'YES' : 'NO '.padEnd(3)} | id: ${u.id}`));
  } else {
    console.log('  No users found');
  }

  const { data: keys } = await db
    .from('activation_keys')
    .select('code, product, human_os_user_id, redeemed_at, expires_at');

  console.log('\n=== ALL ACTIVATION KEYS ===');
  if (keys?.length) {
    keys.forEach(k => console.log(`  ${k.code.padEnd(16)} | product: ${(k.product || '').padEnd(12)} | user: ${k.human_os_user_id || 'NONE'.padEnd(36)} | redeemed: ${k.redeemed_at ? 'YES' : 'NO '} | expires: ${k.expires_at}`));
  } else {
    console.log('  None');
  }
}
find().catch(console.error);
