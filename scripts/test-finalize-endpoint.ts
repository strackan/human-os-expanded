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
  console.log('=== Testing Finalize Endpoint Response ===\n');

  // Simulate what the finalize GET endpoint would return
  const { data: session, error } = await supabase
    .from('sculptor_sessions')
    .select('id, status, entity_slug, entity_name, metadata')
    .eq('id', SCOTT_SESSION_ID)
    .single();

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  const isFinalized = !!session.metadata?.gap_analysis_generated;

  const response = {
    session_id: session.id,
    status: session.status,
    entity_slug: session.entity_slug,
    finalized: isFinalized,
    finalized_at: session.metadata?.gap_analysis_generated || null,
    persona_fingerprint: session.metadata?.persona_fingerprint || null,
    outstanding_questions: session.metadata?.outstanding_questions || [],
    gap_analysis_path: isFinalized ? `${session.entity_slug}/GAP_ANALYSIS_FINAL.md` : null,
  };

  console.log('Finalize GET response:');
  console.log(JSON.stringify(response, null, 2));

  console.log('\n\n=== Onboarding Page Expectations ===\n');
  console.log('Stage should be: renubu (sculptor completed, finalized)');
  console.log('Renubu chat should have:');
  console.log(`  - ${response.outstanding_questions?.length || 0} outstanding questions to cover`);
  console.log('  - Persona fingerprint for NPC adaptation');
}

test().catch(console.error);
