/**
 * Reset Sculptor Session
 *
 * Clears responses and resets session state for a fresh interview.
 *
 * Usage:
 *   npx tsx scripts/reset-sculptor-session.ts <access_code> [--update <new_code>]
 *
 * Examples:
 *   npx tsx scripts/reset-sculptor-session.ts sc_scottleese
 *   npx tsx scripts/reset-sculptor-session.ts sc_scottleese --update sc_sc0ttl33se
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetSession(accessCode: string, newAccessCode?: string) {
  console.log(`Resetting session: ${accessCode}\n`);

  // 1. Get session
  const { data: session, error: fetchError } = await supabase
    .from('sculptor_sessions')
    .select('id, status, entity_name')
    .eq('access_code', accessCode)
    .single();

  if (fetchError || !session) {
    console.error('Session not found:', accessCode);
    process.exit(1);
  }

  console.log(`Found session for: ${session.entity_name}`);
  console.log(`Current status: ${session.status}\n`);

  // 2. Delete captured responses
  const { count, error: deleteError } = await supabase
    .from('sculptor_responses')
    .delete({ count: 'exact' })
    .eq('session_id', session.id);

  if (deleteError) {
    console.error('Error deleting responses:', deleteError);
  } else {
    console.log(`✓ Deleted ${count || 0} captured responses`);
  }

  // 3. Reset session state (and optionally update access code)
  const finalAccessCode = newAccessCode || accessCode;
  const updatePayload: Record<string, unknown> = {
    status: 'active',
    thread_id: null,
    last_accessed_at: null,
    metadata: { conversation_history: [] }, // Clear conversation history
  };

  if (newAccessCode) {
    updatePayload.access_code = newAccessCode;
  }

  const { error: updateError } = await supabase
    .from('sculptor_sessions')
    .update(updatePayload)
    .eq('id', session.id);

  if (updateError) {
    console.error('Error resetting session:', updateError);
    process.exit(1);
  }

  console.log('✓ Reset status to: active');
  console.log('✓ Cleared thread_id');
  console.log('✓ Cleared last_accessed_at');
  console.log('✓ Cleared conversation history');
  if (newAccessCode) {
    console.log(`✓ Updated access code: ${accessCode} → ${newAccessCode}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('SESSION RESET COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\nReady for a fresh interview at:`);
  console.log(`  http://localhost:3000/sculptor/${finalAccessCode}`);
}

// Parse command line args
const args = process.argv.slice(2);
const accessCode = args[0] || 'sc_scottleese';
const updateIndex = args.indexOf('--update');
const newAccessCode = updateIndex !== -1 ? args[updateIndex + 1] : undefined;

if (updateIndex !== -1 && !newAccessCode) {
  console.error('Error: --update requires a new access code');
  console.error('Usage: npx tsx scripts/reset-sculptor-session.ts sc_old --update sc_new');
  process.exit(1);
}

resetSession(accessCode, newAccessCode).catch(console.error);
