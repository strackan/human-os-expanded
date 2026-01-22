import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data, error } = await supabase
    .from('sculptor_sessions')
    .select('id, entity_slug, status, metadata')
    .eq('id', '408c50a8-748d-4ba2-9852-c49b95c26345')
    .single();

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('Session ID:', data.id);
  console.log('Entity Slug:', data.entity_slug);
  console.log('Status:', data.status);
  console.log('Metadata keys:', Object.keys(data.metadata || {}));
  console.log('Has conversation_history:', !!data.metadata?.conversation_history);
  console.log('Conversation length:', data.metadata?.conversation_history?.length || 0);
  console.log('Has gap_analysis_generated:', !!data.metadata?.gap_analysis_generated);
  console.log('Has persona_fingerprint:', !!data.metadata?.persona_fingerprint);

  if (data.metadata?.conversation_history?.length > 0) {
    console.log('\nFirst message role:', data.metadata.conversation_history[0]?.role);
    console.log('Last message role:', data.metadata.conversation_history[data.metadata.conversation_history.length - 1]?.role);
  }
}

check().catch(console.error);
