/**
 * Test the new fixed 10 prompts flow for Scott
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SCOTT_SESSION_ID = '408c50a8-748d-4ba2-9852-c49b95c26345';

async function test() {
  console.log('=== Testing Fixed 10 Prompts Flow ===\n');

  // 1. Clear old metadata to test fresh
  console.log('1. Clearing old metadata...');
  const { data: session } = await supabase
    .from('sculptor_sessions')
    .select('metadata')
    .eq('id', SCOTT_SESSION_ID)
    .single();

  await supabase
    .from('sculptor_sessions')
    .update({
      metadata: {
        ...session?.metadata,
        onboarding_initialized: null,
        outstanding_questions: null,
        gap_analysis_generated: null,
        prompts_format: null,
      },
    })
    .eq('id', SCOTT_SESSION_ID);

  console.log('   Done\n');

  // 2. Import and test the prompts
  console.log('2. Loading fixed prompts...');
  const { ONBOARDING_PROMPTS } = await import('../apps/goodhang/lib/onboarding/prompts');

  console.log(`   Loaded ${ONBOARDING_PROMPTS.length} prompts:\n`);

  for (let i = 0; i < ONBOARDING_PROMPTS.length; i++) {
    const p = ONBOARDING_PROMPTS[i];
    console.log(`   ${i + 1}. [${p.id}] ${p.title}`);
    console.log(`      "${p.prompt.substring(0, 60)}..."`);
    if (p.options) {
      console.log(`      Options: ${p.options.join(', ')}`);
    }
    console.log();
  }

  // 3. Show what the UI would receive
  console.log('\n3. Sample API response format:');
  const sampleResponse = {
    status: 'initialized',
    entity_slug: 'scott',
    session_id: SCOTT_SESSION_ID,
    outstanding_questions: ONBOARDING_PROMPTS.slice(0, 3).map(p => ({
      id: p.id,
      title: p.title,
      prompt: p.prompt,
      question_type: p.question_type,
      options: p.options,
    })),
    prompts_format: 'fixed_10',
    prompts_count: 10,
  };

  console.log(JSON.stringify(sampleResponse, null, 2));

  console.log('\n=== Test Complete ===');
  console.log('The finalize endpoint will now return these 10 fixed prompts');
  console.log('instead of running gap_final analysis.');
}

test().catch(console.error);
