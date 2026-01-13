import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function compareProfiles() {
  console.log('='.repeat(70));
  console.log('PROFILE COMPARISON: Founder OS vs Good Hang Assessment');
  console.log('='.repeat(70));

  // 1. Get Justin's Founder OS identity profile
  console.log('\n📋 FOUNDER OS IDENTITY PROFILE (from The Sculptor):\n');

  const { data: identity, error: identityError } = await supabase
    .schema('human_os')
    .from('identity_profiles')
    .select('*')
    .eq('user_id', 'justin')
    .single();

  if (identityError) {
    console.log('Error fetching identity profile:', identityError.message);

    // Try without schema
    const { data: identity2, error: error2 } = await supabase
      .from('identity_profiles')
      .select('*')
      .limit(5);

    if (error2) {
      console.log('Also tried public schema:', error2.message);
    } else {
      console.log('Found in public schema:', identity2);
    }
  } else if (identity) {
    console.log('Core Values:', identity.core_values?.join(', ') || 'N/A');
    console.log('Energy Patterns:', identity.energy_patterns || 'N/A');
    console.log('Communication Style:', identity.communication_style || 'N/A');
    console.log('Interest Vectors:', identity.interest_vectors?.join(', ') || 'N/A');
    console.log('Relationship Orientation:', identity.relationship_orientation || 'N/A');
    console.log('Work Style:', identity.work_style || 'N/A');
    console.log('Cognitive Profile:', identity.cognitive_profile || 'N/A');
    console.log('Annual Theme:', identity.annual_theme || 'N/A');
  }

  // 2. Get Good Hang assessment results
  console.log('\n🎭 GOOD HANG ASSESSMENT RESULTS:\n');

  const { data: session, error: sessionError } = await supabase
    .from('cs_assessment_sessions')
    .select('*')
    .eq('id', 'ccb0da34-1056-44a7-9fd8-f5ebd7e1f1de')
    .single();

  if (sessionError) {
    console.log('Error fetching session:', sessionError.message);
  } else if (session) {
    console.log('Character:', session.character_profile?.race, session.character_profile?.class);
    console.log('Alignment:', session.character_profile?.alignment);
    console.log('Tagline:', session.character_profile?.tagline);
    console.log('');
    console.log('Attributes:');
    console.log('  INT:', session.attributes?.INT, '| WIS:', session.attributes?.WIS, '| CHA:', session.attributes?.CHA);
    console.log('  CON:', session.attributes?.CON, '| STR:', session.attributes?.STR, '| DEX:', session.attributes?.DEX);
    console.log('');
    console.log('Social Energy:', session.signals?.social_energy);
    console.log('Relationship Style:', session.signals?.relationship_style);
    console.log('Interests:', session.signals?.interest_vectors?.join(', '));
    console.log('Enneagram:', session.signals?.enneagram_hint);
    console.log('');
    console.log('Good Match With:', session.matching?.good_match_with?.join(', '));
    console.log('Avoid Match With:', session.matching?.avoid_match_with?.join(', '));
  }

  // 3. Get the actual transcript to see what answers were given
  console.log('\n📝 ASSESSMENT TRANSCRIPT (what you answered):\n');

  if (session?.interview_transcript) {
    const transcript = session.interview_transcript as Array<{role: string, content: string}>;
    for (let i = 0; i < transcript.length; i += 2) {
      const question = transcript[i];
      const answer = transcript[i + 1];
      if (question && answer) {
        console.log(`Q: ${question.content?.substring(0, 80)}...`);
        console.log(`A: ${answer.content?.substring(0, 150)}...`);
        console.log('');
      }
    }
  }

  console.log('='.repeat(70));
  console.log('ANALYSIS:');
  console.log('='.repeat(70));
  console.log(`
Compare the Founder OS profile (from The Sculptor) with the Good Hang results.
If they don't match, check:
1. Were the assessment questions answered authentically?
2. Is the scoring prompt interpreting responses correctly?
3. Are the attribute mappings aligned with the spec?
`);
}

compareProfiles().catch(console.error);
