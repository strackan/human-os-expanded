import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SCOTT_SESSION_ID = '408c50a8-748d-4ba2-9852-c49b95c26345';

async function cache() {
  console.log('=== Caching Outstanding Questions ===\n');

  // Call the finalize endpoint to get and cache outstanding questions
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/sculptor-gap-final`;

  // First get current session
  const { data: session } = await supabase
    .from('sculptor_sessions')
    .select('metadata')
    .eq('id', SCOTT_SESSION_ID)
    .single();

  console.log('Calling edge function to get outstanding questions...');

  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ session_id: SCOTT_SESSION_ID }),
  });

  if (!response.ok) {
    console.log('Error:', await response.text());
    return;
  }

  const result = await response.json();
  console.log('Outstanding questions count:', result.outstanding_questions?.length);

  // Cache outstanding questions in session metadata
  const { error } = await supabase
    .from('sculptor_sessions')
    .update({
      metadata: {
        ...session?.metadata,
        outstanding_questions: result.outstanding_questions,
      },
    })
    .eq('id', SCOTT_SESSION_ID);

  if (error) {
    console.log('Update error:', error.message);
  } else {
    console.log('Cached', result.outstanding_questions?.length, 'outstanding questions in session metadata');
  }
}

cache().catch(console.error);
