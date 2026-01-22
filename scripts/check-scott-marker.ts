import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data: session } = await supabase
    .from('sculptor_sessions')
    .select('id, status, user_id, entity_slug, metadata')
    .eq('id', '408c50a8-748d-4ba2-9852-c49b95c26345')
    .single();

  console.log('=== Scott Session Check ===\n');
  console.log('Session status:', session?.status);
  console.log('Session user_id:', session?.user_id);
  console.log('Session entity_slug:', session?.entity_slug);

  // Check for SESSION_COMPLETE marker in conversation_history
  const history = session?.metadata?.conversation_history || [];
  const hasMarker = history.some((msg: any) =>
    msg.content?.includes('SESSION_COMPLETE')
  );
  console.log('Has SESSION_COMPLETE marker:', hasMarker);
  console.log('Conversation history length:', history.length);

  // Check last few messages for the marker
  console.log('\n=== Last 5 messages ===');
  history.slice(-5).forEach((msg: any, i: number) => {
    const content = msg.content || '';
    const preview = content.substring(0, 150).replace(/\n/g, ' ');
    console.log(`[${msg.role}]: ${preview}...`);
    if (content.includes('SESSION_COMPLETE')) {
      console.log('  ^ FOUND SESSION_COMPLETE MARKER');
    }
  });

  // Check all metadata keys
  console.log('\n=== Metadata keys ===');
  console.log(Object.keys(session?.metadata || {}));
}

check().catch(console.error);
