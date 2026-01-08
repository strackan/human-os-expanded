import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSession(sessionId: string) {
  console.log(`\nFetching session: ${sessionId}\n`);

  const { data, error } = await supabase
    .from('cs_assessment_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('='.repeat(60));
  console.log('SESSION DATA');
  console.log('='.repeat(60));

  console.log('\n📊 Status:', data.status);
  console.log('📅 Started:', data.started_at);
  console.log('📅 Completed:', data.completed_at);
  console.log('📈 Overall Score:', data.overall_score);

  if (data.character_profile) {
    console.log('\n🎭 CHARACTER PROFILE:');
    console.log('   Tagline:', data.character_profile.tagline);
    console.log('   Alignment:', data.character_profile.alignment);
    console.log('   Race:', data.character_profile.race);
    console.log('   Class:', data.character_profile.class);
  }

  if (data.attributes) {
    console.log('\n📈 ATTRIBUTES:');
    console.log('   INT:', data.attributes.INT);
    console.log('   WIS:', data.attributes.WIS);
    console.log('   CHA:', data.attributes.CHA);
    console.log('   CON:', data.attributes.CON);
    console.log('   STR:', data.attributes.STR);
    console.log('   DEX:', data.attributes.DEX);
  }

  if (data.signals) {
    console.log('\n🔮 SIGNALS:');
    console.log('   Social Energy:', data.signals.social_energy);
    console.log('   Relationship Style:', data.signals.relationship_style);
    console.log('   Interests:', data.signals.interest_vectors?.join(', '));
    if (data.signals.enneagram_hint) {
      console.log('   Enneagram:', data.signals.enneagram_hint);
    }
  }

  if (data.matching) {
    console.log('\n🤝 MATCHING:');
    console.log('   Ideal Group Size:', data.matching.ideal_group_size);
    console.log('   Connection Style:', data.matching.connection_style);
    console.log('   Energy Pattern:', data.matching.energy_pattern);
    console.log('   Good Match With:', data.matching.good_match_with?.join(', '));
    console.log('   Avoid Match With:', data.matching.avoid_match_with?.join(', '));
  }

  console.log('\n📝 Tier:', data.tier);
  console.log('🏷️ Archetype:', data.archetype);

  // Check transcript length
  const transcript = data.interview_transcript || [];
  const userAnswers = transcript.filter((t: any) => t.role === 'user');
  console.log('\n📋 Transcript entries:', transcript.length);
  console.log('📋 User answers:', userAnswers.length);

  console.log('\n' + '='.repeat(60));
}

const sessionId = process.argv[2] || 'ccb0da34-1056-44a7-9fd8-f5ebd7e1f1de';
checkSession(sessionId).catch(console.error);
