import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SCOTT_SESSION_ID = '408c50a8-748d-4ba2-9852-c49b95c26345';

const consolidatedPrompts = [
  {
    id: 'peak-performance',
    title: 'Peak Performance',
    prompt: "Tell me about when you're at your best. Time of day, environment, conditions - what does that look like? And the flip side - when are you at your worst?",
    covers: ['fos-cond-3', 'fos-cond-5', 'E05', 'E09'],
    maps_to: ['cognitive-profile', 'current-state'],
  },
  {
    id: 'struggle-signals',
    title: 'Struggle Signals',
    prompt: "What does it look like when you're overwhelmed, stuck, or avoiding something? How does that spiral usually start for you?",
    covers: ['E01', 'E07', 'E08', 'E15', 'E06'],
    maps_to: ['crisis-protocols', 'cognitive-profile'],
  },
  {
    id: 'recovery-support',
    title: 'Recovery & Support',
    prompt: "When things get hard, what actually helps? What makes it worse? What kind of support do you want from the people around you?",
    covers: ['E16', 'E17', 'E19', 'fos-crisis-5', 'd01'],
    maps_to: ['crisis-protocols', 'conversation-protocols'],
  },
  {
    id: 'decisions-priorities',
    title: 'Decisions & Priorities',
    prompt: "How do you like decisions and priorities presented to you? Do you want options, a recommendation, or just the call made? What kinds of decisions drain you versus energize you?",
    covers: ['E03', 'E04', 'E21'],
    maps_to: ['conversation-protocols', 'cognitive-profile'],
  },
  {
    id: 'feedback-leadership',
    title: 'Feedback & Leadership',
    prompt: "How do you prefer to give and receive feedback? As a leader, do you share everything with your team or filter to protect focus?",
    covers: ['d09', 'core-connect-3', 'd07'],
    maps_to: ['communication', 'conversation-protocols'],
  },
];

async function update() {
  console.log('=== Updating Scott with Consolidated Prompts ===\n');

  // Get current session
  const { data: session } = await supabase
    .from('sculptor_sessions')
    .select('metadata')
    .eq('id', SCOTT_SESSION_ID)
    .single();

  if (!session) {
    console.log('Session not found');
    return;
  }

  // Update with consolidated prompts
  const { error } = await supabase
    .from('sculptor_sessions')
    .update({
      metadata: {
        ...session.metadata,
        outstanding_questions: consolidatedPrompts,
        questions_format: 'consolidated_prompts',
        questions_version: '2.0',
      },
    })
    .eq('id', SCOTT_SESSION_ID);

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('Updated Scott with 5 consolidated prompts:\n');
  for (const p of consolidatedPrompts) {
    console.log(`[${p.id}] ${p.title}`);
    console.log(`  "${p.prompt.substring(0, 60)}..."`);
    console.log(`  Covers: ${p.covers.join(', ')}`);
    console.log();
  }
}

update().catch(console.error);
