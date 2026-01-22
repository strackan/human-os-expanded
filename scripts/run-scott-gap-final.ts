import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SCOTT_SESSION_ID = '408c50a8-748d-4ba2-9852-c49b95c26345';

async function runGapFinal() {
  console.log('=== Running Gap Final Analysis for Scott ===\n');
  console.log('Session ID:', SCOTT_SESSION_ID);
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('\nCalling sculptor-gap-final edge function...\n');

  const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/sculptor-gap-final`;

  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ session_id: SCOTT_SESSION_ID }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error:', response.status, errorText);
      return;
    }

    const result = await response.json();

    console.log('=== Gap Final Results ===\n');
    console.log('Status:', result.status);
    console.log('Entity Slug:', result.entity_slug);
    console.log('Questions Answered:', result.questions_answered, '/', result.questions_total);
    console.log('Outstanding Questions:', result.outstanding_questions?.length || 0);
    console.log('Gap Analysis Path:', result.gap_analysis_path);

    console.log('\n=== Persona Fingerprint ===\n');
    if (result.persona_fingerprint) {
      for (const [key, value] of Object.entries(result.persona_fingerprint)) {
        console.log(`  ${key}: ${value}`);
      }
    }

    console.log('\n=== Outstanding Questions ===\n');
    if (result.outstanding_questions && result.outstanding_questions.length > 0) {
      for (const q of result.outstanding_questions.slice(0, 10)) {
        console.log(`  [${q.slug}] ${q.text?.substring(0, 60)}...`);
      }
      if (result.outstanding_questions.length > 10) {
        console.log(`  ... and ${result.outstanding_questions.length - 10} more`);
      }
    } else {
      console.log('  None! All questions were covered.');
    }

  } catch (error) {
    console.error('Fetch error:', error);
  }
}

runGapFinal().catch(console.error);
