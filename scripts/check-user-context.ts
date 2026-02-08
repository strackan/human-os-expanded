/**
 * Check a user's sculptor session data and storage context files.
 *
 * Usage:
 *   npx tsx scripts/check-user-context.ts <session-id-or-entity-slug>
 *   npx tsx scripts/check-user-context.ts 93eaac99-8647-4a29-9da0-08e3f0102930
 *   npx tsx scripts/check-user-context.ts chris-szalaj
 *   npx tsx scripts/check-user-context.ts --all
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSession(sessionId: string) {
  const { data: session } = await db.from('sculptor_sessions')
    .select('id, entity_name, entity_slug, status, metadata, user_id')
    .eq('id', sessionId)
    .single();

  if (!session) {
    console.log(`Session ${sessionId} not found`);
    return;
  }

  console.log(`\n=== ${session.entity_name} ===`);
  console.log(`  Session ID:    ${session.id}`);
  console.log(`  Entity slug:   ${session.entity_slug || 'NONE'}`);
  console.log(`  Status:        ${session.status}`);
  console.log(`  User ID:       ${session.user_id || 'NONE'}`);

  const meta = session.metadata || {};
  console.log(`  Metadata:`);
  console.log(`    conversation_history: ${meta.conversation_history ? meta.conversation_history.length + ' messages' : 'NONE'}`);
  console.log(`    persona_fingerprint:  ${meta.persona_fingerprint ? 'YES' : 'NONE'}`);
  console.log(`    outstanding_questions: ${meta.outstanding_questions ? meta.outstanding_questions.length + ' questions' : 'NONE'}`);
  console.log(`    executive_report:     ${meta.executive_report ? 'YES' : 'NONE'}`);

  // Check storage
  const slug = session.entity_slug;
  if (slug) {
    console.log(`\n  Storage (contexts/${slug}/):`);
    const { data: files } = await db.storage.from('human-os').list(`contexts/${slug}`);
    if (files?.length) {
      for (const f of files) {
        if (f.id) console.log(`    ${f.name}`);
      }
    } else {
      console.log(`    (empty or not found)`);
    }

    const { data: voiceFiles } = await db.storage.from('human-os').list(`contexts/${slug}/voice`);
    if (voiceFiles?.length) {
      console.log(`  Storage (contexts/${slug}/voice/):`);
      for (const f of voiceFiles) {
        if (f.id) console.log(`    ${f.name}`);
      }
    }
  } else {
    console.log(`\n  Storage: No entity_slug - no context files`);
  }

  // Readiness check
  console.log(`\n  Tutorial readiness:`);
  const issues: string[] = [];
  if (session.status !== 'completed') issues.push(`Sculptor not completed (status: ${session.status})`);
  if (!session.user_id) issues.push('No user_id linked');
  if (!slug) issues.push('No entity_slug - gap_final cannot run');
  if (!meta.conversation_history) issues.push('No conversation_history in metadata');

  if (slug) {
    const { data: gapFile } = await db.storage.from('human-os')
      .download(`contexts/${slug}/E_QUESTIONS_OUTSTANDING.json`);
    if (!gapFile) {
      issues.push('No E_QUESTIONS_OUTSTANDING.json - gap_final not run (tutorial will fallback to all 24 questions)');
    } else {
      const text = await gapFile.text();
      const parsed = JSON.parse(text);
      console.log(`    Gap final: ${parsed.questions_outstanding} outstanding of ${parsed.total_questions}`);
    }
  }

  if (issues.length === 0) {
    console.log('    All clear!');
  } else {
    issues.forEach(i => console.log(`    - ${i}`));
  }
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.log('Usage: npx tsx scripts/check-user-context.ts <session-id-or-slug> | --all');
    return;
  }

  if (arg === '--all') {
    const { data: sessions } = await db.from('sculptor_sessions')
      .select('id')
      .order('created_at', { ascending: false });

    for (const s of sessions || []) {
      await checkSession(s.id);
    }
  } else if (arg.includes('-') && arg.length === 36) {
    // UUID
    await checkSession(arg);
  } else {
    // Entity slug - find session
    const { data: session } = await db.from('sculptor_sessions')
      .select('id')
      .eq('entity_slug', arg)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (session) {
      await checkSession(session.id);
    } else {
      console.log(`No session found with entity_slug: ${arg}`);
    }
  }
}

main().catch(console.error);
