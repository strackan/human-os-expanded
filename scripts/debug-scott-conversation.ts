import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debug() {
  console.log('=== Debug Scott Conversation History ===\n');

  const { data, error } = await supabase
    .from('sculptor_sessions')
    .select('id, entity_slug, status, metadata')
    .eq('id', '408c50a8-748d-4ba2-9852-c49b95c26345')
    .single();

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  const history = data.metadata?.conversation_history || [];
  console.log('Total messages:', history.length);
  console.log('\n--- First 3 messages ---\n');

  for (let i = 0; i < Math.min(3, history.length); i++) {
    const msg = history[i];
    console.log(`[${i}] Role: ${msg.role}`);
    console.log(`    Content (first 200 chars): ${msg.content?.substring(0, 200)}...`);
    console.log();
  }

  console.log('\n--- Last 3 messages ---\n');

  for (let i = Math.max(0, history.length - 3); i < history.length; i++) {
    const msg = history[i];
    console.log(`[${i}] Role: ${msg.role}`);
    console.log(`    Content (first 200 chars): ${msg.content?.substring(0, 200)}...`);
    console.log();
  }

  // Check total content length
  const totalContent = history.map((m: any) => `${m.role}: ${m.content}`).join('\n\n');
  console.log('\n--- Content Stats ---');
  console.log('Total content length:', totalContent.length, 'chars');
  console.log('Approximate tokens:', Math.round(totalContent.length / 4));

  // Check for key Scott-specific content
  const keywords = ['health', 'hospital', 'surgery', 'opioid', 'pain', 'tequila', 'weed', 'pipeline', 'CS', 'SDR'];
  console.log('\n--- Keyword Check ---');
  for (const kw of keywords) {
    const found = totalContent.toLowerCase().includes(kw.toLowerCase());
    console.log(`  "${kw}": ${found ? 'FOUND' : 'not found'}`);
  }
}

debug().catch(console.error);
