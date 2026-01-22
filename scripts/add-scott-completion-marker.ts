import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SCOTT_SESSION_ID = '408c50a8-748d-4ba2-9852-c49b95c26345';

async function addMarker() {
  console.log('=== Adding SESSION_COMPLETE marker to Scott ===\n');

  const { data: session } = await supabase
    .from('sculptor_sessions')
    .select('metadata')
    .eq('id', SCOTT_SESSION_ID)
    .single();

  if (!session) {
    console.log('Session not found');
    return;
  }

  const history = session.metadata?.conversation_history || [];

  // Add completion marker to a final assistant message
  const completionMessage = {
    role: 'assistant',
    content: '*The Sculptor slowly fades into the morning mist, his tackle box tucked under one arm.*\n\n"You\'ve given me everything I need, Scott. The picture is complete."\n\n*He tips an invisible hat and walks toward the lake, each step making him more translucent until he\'s gone.*\n\n<!-- SESSION_COMPLETE -->'
  };

  const updatedHistory = [...history, completionMessage];

  const { error } = await supabase
    .from('sculptor_sessions')
    .update({
      metadata: {
        ...session.metadata,
        conversation_history: updatedHistory,
      }
    })
    .eq('id', SCOTT_SESSION_ID);

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('Added SESSION_COMPLETE marker');
  console.log('New conversation length:', updatedHistory.length);
}

addMarker().catch(console.error);
