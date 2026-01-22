import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
  console.log('Running E25-E28 migration...');
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

  const { error: insertError } = await supabase
    .from('questions')
    .upsert([
      {
        slug: 'E25',
        domain: 'fos',
        category: 'identity',
        subcategory: 'rapport',
        question_type: 'open',
        text: 'What makes you want to hang out with someone socially vs just working with them? Any particular senses of humor or personality types work better than others?',
        description: 'Maps social preferences, humor style, rapport markers',
        maps_to_output: 'communication',
        priority: 2
      },
      {
        slug: 'E26',
        domain: 'fos',
        category: 'identity',
        subcategory: 'challenge',
        question_type: 'open',
        text: 'How do you prefer to be disagreed with or challenged? When do you appreciate someone standing their ground vs it feeling confrontational?',
        description: 'Maps correction reception, pushback tolerance, conflict style',
        maps_to_output: 'conversation-protocols',
        priority: 1
      },
      {
        slug: 'E27',
        domain: 'fos',
        category: 'identity',
        subcategory: 'ai-preferences',
        question_type: 'open',
        text: 'If you could build an ideal AI assistant - what would be the 3-4 most important considerations?',
        description: 'Surfaces implicit preferences and frustrations through positive framing',
        maps_to_output: 'conversation-protocols',
        priority: 2
      },
      {
        slug: 'E28',
        domain: 'fos',
        category: 'identity',
        subcategory: 'ai-preferences',
        question_type: 'choice',
        text: 'Rank these AI assistant roles in order of most desirable to you:',
        description: 'Quick signal on preferred interaction mode',
        options: ['Strategic Thought Partner', 'Deferential Assistant', 'Coach & Accountability Partner', 'Friend & Confidante'],
        maps_to_output: 'conversation-protocols',
        priority: 1
      }
    ], { onConflict: 'slug' });

  if (insertError) {
    console.error('Insert error:', insertError.message);
    return;
  }

  console.log('Questions inserted successfully!');

  // Verify
  const { data: questions, error: selectError } = await supabase
    .from('questions')
    .select('slug, text')
    .in('slug', ['E25', 'E26', 'E27', 'E28']);

  if (selectError) {
    console.error('Select error:', selectError.message);
    return;
  }

  console.log('\nVerification - E25-E28 questions:');
  questions?.forEach(q => console.log(`  ${q.slug}: ${q.text?.substring(0, 60)}...`));

  // Now run gap_final for Scott
  console.log('\n\nNow running gap_final for Scott...');
  const SCOTT_SESSION_ID = '408c50a8-748d-4ba2-9852-c49b95c26345';

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
    const errorText = await response.text();
    console.error('Gap final error:', response.status, errorText);
    return;
  }

  const result = await response.json();

  console.log('\n=== Gap Final Results ===');
  console.log('Status:', result.status);
  console.log('Questions Answered:', result.questions_answered, '/', result.questions_total);
  console.log('Outstanding Questions:', result.outstanding_questions?.length || 0);

  console.log('\n=== Outstanding Questions (first 15) ===');
  if (result.outstanding_questions && result.outstanding_questions.length > 0) {
    for (const q of result.outstanding_questions.slice(0, 15)) {
      console.log(`  [${q.slug}] ${q.text?.substring(0, 70)}...`);
    }
    if (result.outstanding_questions.length > 15) {
      console.log(`  ... and ${result.outstanding_questions.length - 15} more`);
    }

    // Check for new E25-E28
    const newQuestions = result.outstanding_questions.filter((q: any) =>
      ['E25', 'E26', 'E27', 'E28'].includes(q.slug)
    );

    if (newQuestions.length > 0) {
      console.log('\n=== NEW E25-E28 Questions in Outstanding ===');
      newQuestions.forEach((q: any) => console.log(`  [${q.slug}] ${q.text}`));
    }
  }
}

runMigration().catch(console.error);
