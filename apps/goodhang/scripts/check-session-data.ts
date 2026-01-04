/**
 * Quick script to check if assessment session data is safely stored
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSessions() {
  console.log('🔍 Checking assessment sessions in database...\n');

  const { data: sessions, error } = await supabase
    .from('cs_assessment_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!sessions || sessions.length === 0) {
    console.log('⚠️ No sessions found in database');
    return;
  }

  console.log(`✅ Found ${sessions.length} recent session(s):\n`);

  sessions.forEach((session, idx) => {
    console.log(`Session ${idx + 1}:`);
    console.log(`  ID: ${session.id}`);
    console.log(`  User ID: ${session.user_id}`);
    console.log(`  Status: ${session.status}`);
    console.log(`  Progress: Section ${session.current_section_index}, Question ${session.current_question_index}`);

    const transcript = session.interview_transcript || [];
    const answerCount = transcript.filter((m: any) => m.role === 'user').length;

    console.log(`  Questions Answered: ${answerCount} / 26`);
    console.log(`  Transcript Length: ${transcript.length} messages`);
    console.log(`  Last Activity: ${new Date(session.last_activity_at).toLocaleString()}`);
    console.log(`  Created: ${new Date(session.created_at).toLocaleString()}`);

    if (session.completed_at) {
      console.log(`  ✅ Completed: ${new Date(session.completed_at).toLocaleString()}`);
      console.log(`  Score: ${session.overall_score}/100`);
      console.log(`  Tier: ${session.tier}`);
    }

    console.log('');
  });

  console.log('✅ Your data is safely stored in the database!');
  console.log('   Restarting the dev server will NOT lose your progress.');
}

checkSessions().catch(console.error);
