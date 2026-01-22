import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SCOTT_SESSION_ID = '408c50a8-748d-4ba2-9852-c49b95c26345';

async function refresh() {
  console.log('=== Refreshing Scott Outstanding Questions ===\n');

  // 1. Get current session
  const { data: session } = await supabase
    .from('sculptor_sessions')
    .select('metadata')
    .eq('id', SCOTT_SESSION_ID)
    .single();

  // 2. Clear the gap_analysis_generated flag to force re-run
  console.log('Clearing gap_analysis_generated flag...');
  await supabase
    .from('sculptor_sessions')
    .update({
      metadata: {
        ...session?.metadata,
        gap_analysis_generated: null,
        outstanding_questions: null,
      },
    })
    .eq('id', SCOTT_SESSION_ID);

  // 3. Call gap_final again
  console.log('Calling gap_final edge function...');
  const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sculptor-gap-final`;

  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ session_id: SCOTT_SESSION_ID }),
  });

  if (!response.ok) {
    console.error('Gap final error:', await response.text());
    return;
  }

  const result = await response.json();
  console.log('Gap final completed:', result.status);
  console.log('Total questions:', result.questions_total);
  console.log('Answered:', result.questions_answered);
  console.log('Outstanding:', result.outstanding_questions?.length);

  // 4. Update session metadata with the new outstanding questions
  console.log('\nUpdating session metadata with outstanding questions...');
  const { error: updateError } = await supabase
    .from('sculptor_sessions')
    .update({
      metadata: {
        ...session?.metadata,
        gap_analysis_generated: new Date().toISOString(),
        outstanding_questions: result.outstanding_questions,
        persona_fingerprint: result.persona_fingerprint,
      },
    })
    .eq('id', SCOTT_SESSION_ID);

  if (updateError) {
    console.error('Update error:', updateError.message);
    return;
  }

  console.log('Metadata updated successfully!');

  // 5. Verify
  const { data: updated } = await supabase
    .from('sculptor_sessions')
    .select('metadata')
    .eq('id', SCOTT_SESSION_ID)
    .single();

  const cached = updated?.metadata?.outstanding_questions || [];
  console.log('\n=== Now Cached ===');
  console.log('Outstanding questions:', cached.length);

  // Check for E25-E28
  const newOnes = cached.filter((q: any) =>
    ['E25', 'E26', 'E27', 'E28'].includes(q.slug)
  );

  if (newOnes.length > 0) {
    console.log('\n=== E25-E28 Now in Cache ===');
    newOnes.forEach((q: any) => console.log(`[${q.slug}] ${q.text}`));
  }

  // Show by category
  const byCategory: Record<string, number> = {};
  cached.forEach((q: any) => {
    const cat = q.category || 'uncategorized';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });

  console.log('\n=== Outstanding by Category ===');
  Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });
}

refresh().catch(console.error);
