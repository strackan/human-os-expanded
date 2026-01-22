import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SCOTT_SESSION_ID = '408c50a8-748d-4ba2-9852-c49b95c26345';

async function check() {
  console.log('=== Checking Scott Session Metadata ===\n');

  const { data: session, error } = await supabase
    .from('sculptor_sessions')
    .select('id, status, entity_slug, metadata')
    .eq('id', SCOTT_SESSION_ID)
    .single();

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('Session ID:', session.id);
  console.log('Status:', session.status);
  console.log('Entity:', session.entity_slug);
  console.log('Gap Analysis Generated:', session.metadata?.gap_analysis_generated || 'NOT SET');

  const cachedQuestions = session.metadata?.outstanding_questions || [];
  console.log('\nCached Outstanding Questions:', cachedQuestions.length);

  // Check if E25-E28 are in cached
  const newInCached = cachedQuestions.filter((q: any) =>
    ['E25', 'E26', 'E27', 'E28'].includes(q.slug)
  );

  if (newInCached.length > 0) {
    console.log('\nE25-E28 in CACHED data:');
    newInCached.forEach((q: any) => console.log(`  [${q.slug}] ${q.text?.substring(0, 50)}...`));
  } else {
    console.log('\nE25-E28 NOT in cached data (need to re-run finalize)');
  }

  // Show sample of cached questions
  console.log('\nSample cached questions (first 5):');
  cachedQuestions.slice(0, 5).forEach((q: any) => {
    console.log(`  [${q.slug}] ${q.text?.substring(0, 60)}...`);
  });
}

check().catch(console.error);
