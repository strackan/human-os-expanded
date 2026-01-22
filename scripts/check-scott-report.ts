import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  console.log('=== SCOTT REPORT CHECK ===\n');

  // Check sculptor session for executive report
  const { data: sculptor } = await supabase
    .from('sculptor_sessions')
    .select('id, metadata')
    .eq('id', '408c50a8-748d-4ba2-9852-c49b95c26345')
    .single();

  console.log('Sculptor session found:', !!sculptor);
  console.log('Has executive_report:', !!sculptor?.metadata?.executive_report);
  console.log('Has outstanding_questions:', !!sculptor?.metadata?.outstanding_questions);
  console.log('Question count:', sculptor?.metadata?.outstanding_questions?.length || 0);
  console.log('Has persona_fingerprint:', !!sculptor?.metadata?.persona_fingerprint);

  if (sculptor?.metadata?.executive_report) {
    const report = sculptor.metadata.executive_report;
    console.log('\nReport preview:');
    console.log('  summary:', report.summary?.substring(0, 100) + '...');
    console.log('  personality count:', report.personality?.length);
    console.log('  has voice:', !!report.voice);
  }

  // Check GoodHang assessment
  const { data: assessment } = await supabase
    .from('cs_assessment_sessions')
    .select('id, status, character_profile, overall_score')
    .eq('user_id', '083591d4-7008-4538-a929-c1e7d0c9bfb0')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  console.log('\n=== GOODHANG ASSESSMENT ===');
  console.log('Found:', !!assessment);
  if (assessment) {
    console.log('Status:', assessment.status);
    console.log('Score:', assessment.overall_score);
    console.log('Character:', JSON.stringify(assessment.character_profile, null, 2));
  }
}

check().catch(console.error);
