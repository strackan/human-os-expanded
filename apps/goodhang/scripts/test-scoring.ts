/**
 * Test script for D&D Personality Assessment Scoring
 *
 * Tests the AssessmentScoringService with different personality profiles
 * to verify character generation works correctly.
 *
 * Run with: npx tsx scripts/test-scoring.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local BEFORE importing modules that use env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Verify API key loaded
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not found in .env.local');
  process.exit(1);
}
console.log('✓ ANTHROPIC_API_KEY loaded');

import { AssessmentScoringService } from '../lib/services/AssessmentScoringService';

// Mock transcript entries simulating different personality types
const mockTranscripts = {
  // Chaotic creative type - should get high DEX, CHA
  chaoticCreative: [
    { role: 'assistant' as const, content: "What's something you believe that most people disagree with?", question_id: 'a1-contrarian-belief' },
    { role: 'user' as const, content: "I genuinely believe that most productivity advice is counterproductive. The whole hustle culture thing is a trap - I've found that my best ideas come when I'm doing absolutely nothing, staring at the ceiling, or wandering aimlessly. Everyone's obsessed with optimization but creativity needs slack in the system." },

    { role: 'assistant' as const, content: "Describe a time you broke a rule and were glad you did.", question_id: 'a2-broke-rule' },
    { role: 'user' as const, content: "I once crashed a private art gallery opening by walking in confidently like I belonged. Ended up having a 2-hour conversation with the artist about consciousness and perception. We're still friends. No regrets - the best experiences come from ignoring arbitrary social barriers." },

    { role: 'assistant' as const, content: "What do people misunderstand about you?", question_id: 'a3-misunderstood' },
    { role: 'user' as const, content: "People think I'm scattered or unfocused because I jump between interests. But I see connections everywhere - my 'random' knowledge actually forms a web. Last month my knowledge of mycology helped me debug a distributed systems problem because I saw the pattern." },

    { role: 'assistant' as const, content: "What's the dumbest hill you'd die on?", question_id: 'a4-dumb-hill' },
    { role: 'user' as const, content: "Pineapple absolutely belongs on pizza. It's not even about the taste - it's about the principle. Sweet and savory is a legitimate culinary tradition across dozens of cultures. The anti-pineapple crowd is just performing conformity." },

    { role: 'assistant' as const, content: "If I gave you $10K right now that you HAD to spend on yourself in 48 hours, what would you do?", question_id: 'a5-10k-spend' },
    { role: 'user' as const, content: "I'd book a last-minute flight somewhere I've never been - probably Iceland or Japan - and just wander for 48 hours with no itinerary. Maybe pick up a local instrument or art supplies. The constraint would force spontaneity which is when magic happens." },

    { role: 'assistant' as const, content: "What could you talk about for hours without getting bored?", question_id: 'b1-talk-for-hours' },
    { role: 'user' as const, content: "The philosophy of consciousness and AI. Like, what even IS experience? Are LLMs having something like experience? I've read Dennett, Chalmers, the whole debate. But also weird niche stuff like the history of color names across languages, or why certain music gives us chills." },

    { role: 'assistant' as const, content: "Describe your ideal Saturday -- from waking up to going to bed.", question_id: 'b2-ideal-saturday' },
    { role: 'user' as const, content: "Wake up whenever, no alarm. Coffee while reading something random. Then follow my energy - maybe a long walk, maybe dive into a project, maybe meet a friend spontaneously. Evening would be cooking something experimental while listening to music, then maybe a late-night conversation or creative session. No plan is the plan." },

    { role: 'assistant' as const, content: "When a friend is going through something hard, what's your instinct -- fix it, feel it with them, or distract them?", question_id: 'b3-friend-crisis' },
    { role: 'user' as const, content: "Feel it with them first, always. People need to be witnessed before they can move forward. I'll sit in the darkness with them. But then I'm also the person who'll spontaneously suggest a 2am diner run or something absurd to break the heaviness when the moment's right." },

    { role: 'assistant' as const, content: "You're at a party where you only know one person. What do you do?", question_id: 'b4-party-dynamics' },
    { role: 'user' as const, content: "Find the most interesting-looking person or conversation and just join. I'm genuinely curious about strangers. I'll ask weird questions, find the people who light up when talking about their thing. Kitchen conversations are usually the best. I leave with 3 new friends or I leave early - no middle ground." },

    { role: 'assistant' as const, content: "What's the last rabbit hole you fell into?", question_id: 'b5-rabbit-hole' },
    { role: 'user' as const, content: "The history of the QWERTY keyboard and alternative layouts. Started wondering why we still use this 150-year-old design, ended up learning about Dvorak, Colemak, the whole ergonomics debate, and the economics of path dependency. Now I'm considering switching layouts which would tank my productivity for months but I'm weirdly excited about it." },
  ],

  // Lawful analytical type - should get high INT, CON
  lawfulAnalytical: [
    { role: 'assistant' as const, content: "What's something you believe that most people disagree with?", question_id: 'a1-contrarian-belief' },
    { role: 'user' as const, content: "I believe most intuition is actually pattern recognition from data we've unconsciously processed. When people say 'trust your gut,' they're really trusting accumulated experience. I think we should be more systematic about understanding WHY our intuitions form rather than just following them blindly." },

    { role: 'assistant' as const, content: "Describe a time you broke a rule and were glad you did.", question_id: 'a2-broke-rule' },
    { role: 'user' as const, content: "I violated our company's documentation standards to ship a critical fix faster. The rule existed for good reasons, but in this case following it would have cost us $50K per hour of downtime. I documented everything afterward and proposed a fast-track exception process. Rules should serve outcomes, not the reverse." },

    { role: 'assistant' as const, content: "What do people misunderstand about you?", question_id: 'a3-misunderstood' },
    { role: 'user' as const, content: "People think I'm cold or overly logical because I don't emote obviously. But I care deeply - I just show it through actions and problem-solving rather than words. When someone I love is struggling, I'm researching solutions at 2am. That's my love language." },

    { role: 'assistant' as const, content: "What's the dumbest hill you'd die on?", question_id: 'a4-dumb-hill' },
    { role: 'user' as const, content: "Proper version control commit messages. I will reject PRs over 'fixed stuff' as a commit message. Future you, debugging at 3am, deserves to know what past you was thinking. It's basic professional courtesy across time." },

    { role: 'assistant' as const, content: "If I gave you $10K right now that you HAD to spend on yourself in 48 hours, what would you do?", question_id: 'a5-10k-spend' },
    { role: 'user' as const, content: "Upgrade my home office setup - standing desk, proper monitor arms, ergonomic keyboard, good lighting. Then a year of access to research papers and online courses I've been wanting. Investments in my ability to think and work effectively compound forever." },

    { role: 'assistant' as const, content: "What could you talk about for hours without getting bored?", question_id: 'b1-talk-for-hours' },
    { role: 'user' as const, content: "Systems design and architecture patterns. How do you build things that scale? What makes some codebases a joy to work in and others nightmares? I love the meta-level: not just solving problems but designing systems that make problems easier to solve." },

    { role: 'assistant' as const, content: "Describe your ideal Saturday -- from waking up to going to bed.", question_id: 'b2-ideal-saturday' },
    { role: 'user' as const, content: "6am wake up, morning routine (exercise, coffee, journal). 8am-12pm deep work on a personal project. Lunch break with a podcast. Afternoon for errands and life admin. Evening: dinner with close friends, board games or deep conversation. 10pm wind down with reading. I like structure - it creates freedom within boundaries." },

    { role: 'assistant' as const, content: "When a friend is going through something hard, what's your instinct -- fix it, feel it with them, or distract them?", question_id: 'b3-friend-crisis' },
    { role: 'user' as const, content: "My instinct is to fix it - I immediately start mapping the problem and identifying solutions. I've learned to ask first: 'Do you want advice or do you want me to listen?' But honestly, even when listening, part of my brain is building a solution tree. I try to balance both." },

    { role: 'assistant' as const, content: "You're at a party where you only know one person. What do you do?", question_id: 'b4-party-dynamics' },
    { role: 'user' as const, content: "I stay close to my friend initially, get introduced to their connections. I'm not great at cold approaches but I can hold good conversations once introduced. I look for the smaller groups having substantive discussions rather than the loud center. Quality over quantity." },

    { role: 'assistant' as const, content: "What's the last rabbit hole you fell into?", question_id: 'b5-rabbit-hole' },
    { role: 'user' as const, content: "Database internals - specifically how B-trees work and why certain query patterns are slow. Started with a performance issue at work, ended up reading academic papers about storage engines. Built a toy key-value store to understand it properly. Took 3 weekends but now I actually understand what's happening under the hood." },
  ],

  // Social connector type - should get high CHA, WIS
  socialConnector: [
    { role: 'assistant' as const, content: "What's something you believe that most people disagree with?", question_id: 'a1-contrarian-belief' },
    { role: 'user' as const, content: "I believe networking events are actually terrible for building real relationships. The best connections happen in contexts where you're doing something together, not explicitly trying to connect. My closest professional relationships started from random encounters, shared projects, or helping someone without expecting anything back." },

    { role: 'assistant' as const, content: "Describe a time you broke a rule and were glad you did.", question_id: 'a2-broke-rule' },
    { role: 'user' as const, content: "I introduced two people from competing companies at a conference when there was an unspoken rule about keeping networks separate. They ended up collaborating on an open-source project that benefited the whole industry. Sometimes the right thing means ignoring tribal boundaries." },

    { role: 'assistant' as const, content: "What do people misunderstand about you?", question_id: 'a3-misunderstood' },
    { role: 'user' as const, content: "People think I'm an extrovert because I'm good at social situations. But I actually recharge alone and carefully choose where to spend my social energy. I just believe deeply in people and find genuine connection energizing. It's not that I love parties - I love understanding what makes people tick." },

    { role: 'assistant' as const, content: "What's the dumbest hill you'd die on?", question_id: 'a4-dumb-hill' },
    { role: 'user' as const, content: "Remembering people's names is a basic act of respect. I've trained myself to remember hundreds of names because I've seen how it changes interactions. When someone remembers your name, you exist to them. It's such a small thing but it matters so much." },

    { role: 'assistant' as const, content: "If I gave you $10K right now that you HAD to spend on yourself in 48 hours, what would you do?", question_id: 'a5-10k-spend' },
    { role: 'user' as const, content: "I'd host an amazing dinner party - rent a beautiful space, hire a chef, invite 20 people from different parts of my life who should know each other. The real value would be the connections made. Maybe with the rest, a trip to visit an old friend I haven't seen in years." },

    { role: 'assistant' as const, content: "What could you talk about for hours without getting bored?", question_id: 'b1-talk-for-hours' },
    { role: 'user' as const, content: "What makes relationships work - friendships, partnerships, teams. Why do some groups become more than the sum of their parts? I'm fascinated by the dynamics of trust, how it builds and breaks. Also people's origin stories - everyone has one and they're all interesting if you ask the right questions." },

    { role: 'assistant' as const, content: "Describe your ideal Saturday -- from waking up to going to bed.", question_id: 'b2-ideal-saturday' },
    { role: 'user' as const, content: "Late morning start, brunch with a friend where we actually talk about what's going on in our lives. Afternoon might be a group activity - hiking, cooking together, or working on something collaborative. Evening is flexible - maybe a small gathering or a one-on-one dinner. I like my weekends people-full but intimate." },

    { role: 'assistant' as const, content: "When a friend is going through something hard, what's your instinct -- fix it, feel it with them, or distract them?", question_id: 'b3-friend-crisis' },
    { role: 'user' as const, content: "Feel it with them, completely. I've learned that presence is the gift - not advice, not silver linings, just being there. I'll drop everything to sit with someone who's struggling. Sometimes I'll ask 'what do you need right now?' but often just being a witness to their pain is what heals." },

    { role: 'assistant' as const, content: "You're at a party where you only know one person. What do you do?", question_id: 'b4-party-dynamics' },
    { role: 'user' as const, content: "I work the room but authentically - I'm genuinely curious about people. I'll find someone standing alone and start there, ask real questions, find what lights them up. By the end of the night I'll have made introductions between people I just met because I can see who should know each other." },

    { role: 'assistant' as const, content: "What's the last rabbit hole you fell into?", question_id: 'b5-rabbit-hole' },
    { role: 'user' as const, content: "The science of loneliness and social connection. Started after noticing how many people seem isolated despite being 'connected.' Read about Dunbar's number, attachment theory, the neuroscience of belonging. Now I'm thinking about how to design communities and gatherings that create real connection, not just proximity." },
  ],
};

async function testScoring(name: string, transcript: typeof mockTranscripts.chaoticCreative) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log('='.repeat(60));

  try {
    const results = await AssessmentScoringService.scoreAssessment({
      session_id: `test-${name}-${Date.now()}`,
      user_id: 'test-user',
      transcript,
    });

    console.log('\n📊 RESULTS:');
    console.log('\n🎭 Character Profile:');
    console.log(`   Tagline: ${results.profile.tagline}`);
    console.log(`   Alignment: ${results.profile.alignment}`);
    console.log(`   Race: ${results.profile.race}`);
    console.log(`   Class: ${results.profile.class}`);

    console.log('\n📈 Attributes:');
    console.log(`   INT: ${results.attributes.INT} | WIS: ${results.attributes.WIS} | CHA: ${results.attributes.CHA}`);
    console.log(`   CON: ${results.attributes.CON} | STR: ${results.attributes.STR} | DEX: ${results.attributes.DEX}`);

    console.log('\n🔮 Signals:');
    console.log(`   Social Energy: ${results.signals.social_energy}`);
    console.log(`   Relationship Style: ${results.signals.relationship_style}`);
    console.log(`   Interests: ${results.signals.interest_vectors.join(', ')}`);
    if (results.signals.enneagram_hint) {
      console.log(`   Enneagram Hint: ${results.signals.enneagram_hint}`);
    }

    console.log('\n🤝 Matching Profile:');
    console.log(`   Ideal Group Size: ${results.matching.ideal_group_size}`);
    console.log(`   Connection Style: ${results.matching.connection_style}`);
    console.log(`   Energy Pattern: ${results.matching.energy_pattern}`);
    console.log(`   Good Match With: ${results.matching.good_match_with.join(', ')}`);
    console.log(`   Avoid Match With: ${results.matching.avoid_match_with.join(', ')}`);

    console.log('\n📊 Overall Score:', results.overall_score);

    return results;
  } catch (error) {
    console.error(`\n❌ Error testing ${name}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🎲 D&D Personality Assessment - Scoring Test\n');
  console.log('Testing with 3 different personality profiles...\n');

  const results: Record<string, Awaited<ReturnType<typeof testScoring>>> = {};

  // Test each profile
  for (const [name, transcript] of Object.entries(mockTranscripts)) {
    results[name] = await testScoring(name, transcript);
    // Small delay between API calls
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary comparison
  console.log('\n\n' + '='.repeat(60));
  console.log('📋 SUMMARY COMPARISON');
  console.log('='.repeat(60));

  console.log('\n| Profile           | Class      | Race     | Alignment        | Top Attrs |');
  console.log('|-------------------|------------|----------|------------------|-----------|');

  for (const [name, result] of Object.entries(results)) {
    const attrs = result.attributes;
    const topTwo = Object.entries(attrs)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([k]) => k)
      .join(', ');

    console.log(
      `| ${name.padEnd(17)} | ${result.profile.class.padEnd(10)} | ${result.profile.race.padEnd(8)} | ${result.profile.alignment.padEnd(16)} | ${topTwo.padEnd(9)} |`
    );
  }

  console.log('\n✅ All tests completed!');
}

main().catch(console.error);
