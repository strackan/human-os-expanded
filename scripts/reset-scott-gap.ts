import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function reset() {
  console.log('Resetting Scott session metadata...');

  // First get current metadata
  const { data: session } = await supabase
    .from('sculptor_sessions')
    .select('metadata')
    .eq('id', '408c50a8-748d-4ba2-9852-c49b95c26345')
    .single();

  if (!session) {
    console.log('Session not found');
    return;
  }

  // Keep conversation_history but remove gap analysis results
  const { conversation_history } = session.metadata || {};

  const { error } = await supabase
    .from('sculptor_sessions')
    .update({
      metadata: { conversation_history }  // Only keep conversation
    })
    .eq('id', '408c50a8-748d-4ba2-9852-c49b95c26345');

  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Reset complete - gap_analysis_generated and persona_fingerprint removed');
  }
}

reset().catch(console.error);
