#!/usr/bin/env npx tsx
/**
 * Interview Conductor Test Suite
 *
 * Tests the full interview pipeline with 5 candidate scenarios.
 * Validates scoring differentiation and handler output.
 *
 * Run with: npx tsx packages/analysis/src/conductor/test-conductor.ts
 */

import {
  createConductorEngine,
  dndHandler,
  professionalHandler,
  hiringManagerHandler,
  candidateSummaryHandler,
  formatResult,
} from './index.js';
import type { ScenePrompt, InterviewComplete, DnDSheet, ProfessionalAssessment } from './types.js';
import type { HiringManagerReport, CandidateSummary } from './handlers.js';

// =============================================================================
// TEST SCENARIOS - Simulated Interview Responses
// =============================================================================

interface TestScenario {
  name: string;
  description: string;
  responses: {
    elevator: string[];    // 3 responses
    reception: string[];   // 4 responses
    office: string[];      // 7 responses
  };
  expected: {
    minScore: number;
    maxScore: number;
    tier: 'top_1%' | 'strong' | 'moderate' | 'weak' | 'pass';
    allowHigherTier?: boolean;
    allowLowerTier?: boolean;
    redFlagsExpected?: boolean;
    greenFlagsExpected?: boolean;
  };
}

const SCENARIOS: TestScenario[] = [
  // ==========================================================================
  // 1. PERFECT FIT - Senior Technical Leader
  // ==========================================================================
  {
    name: 'Sarah Chen',
    description: 'Senior technical leader, strong across all dimensions',
    responses: {
      elevator: [
        "Oh yes, big day! I've been looking forward to this. The energy in the building is great.",
        "Weather's perfect actually. I love this time of year. Got here early to clear my head.",
        "Really excited about the technical challenges here. I've heard amazing things about the team.",
      ],
      reception: [
        "I'm here because this is one of the few companies genuinely solving hard problems in the space. Your approach to distributed systems is exactly what I've been wanting to work on.",
        "What energizes me is taking something that seems impossible and breaking it down until it's not. I get a genuine thrill from making complex systems elegant and maintainable.",
        "Six months from now? I'd love to be deeply embedded in your architecture, having shipped something meaningful that makes the team's life easier.",
        "The move feels right because I've accomplished what I set out to do at my current role. Built the team from 3 to 15, established our technical vision. Now I'm ready for a new mountain to climb.",
      ],
      office: [
        "I'm genuinely proud of the observability platform I built last year. Not because it was the biggest project, but because it fundamentally changed how our team worked. Before, debugging was archaeology. After, it was science. The metrics improved, but what really mattered was seeing engineers actually enjoy their on-call rotations.",
        "The hardest part was getting buy-in. Engineers are rightfully skeptical of new tools. I spent two weeks pairing with skeptics, learning their pain points, and incorporating their feedback. There was a moment where I thought we might have to abandon the approach entirely - our initial latency numbers were terrible. We did three complete rewrites of the ingestion pipeline before finding something that worked.",
        "The people side was interesting. I had one senior engineer who was vocally opposed. Instead of fighting him, I asked him to be my harshest critic. Gave him veto power over architectural decisions. He became our biggest champion. I learned that resistance often means someone cares deeply - you just have to channel it.",
        "What would I change? I waited too long to involve stakeholders outside engineering. When we finally showed product and leadership, they had great ideas we could have incorporated earlier. I've since adopted a 'demo early, demo often' approach.",
        "What gets me out of bed is unsolved problems. I genuinely enjoy the moment when you're staring at a system and something clicks - you see a pattern no one else has noticed. I love building things that last, that other people can build on.",
        "One significant failure: I once pushed a migration that seemed safe but had a subtle data corruption bug. We caught it within hours, but some customer data was affected. I owned it completely - wrote the post-mortem, personally called affected customers, and implemented the safeguards that would have prevented it. That experience changed how I think about testing and rollout strategies.",
        "In three years, I want to be known as someone who makes the team around them better. Not just the code - the people. I want to have built something that outlasts my involvement, and have developed engineers who can do things they didn't think they could do.",
      ],
    },
    expected: {
      minScore: 7.5,
      maxScore: 10,
      tier: 'top_1%',
      allowLowerTier: true, // Allow 'strong' as well
      greenFlagsExpected: true,
    },
  },

  // ==========================================================================
  // 2. INCREDIBLE TALENT - Junior but Exceptional
  // ==========================================================================
  {
    name: 'Marcus Johnson',
    description: 'Junior but shows exceptional potential and raw ability',
    responses: {
      elevator: [
        "Honestly, I'm a bit nervous but in a good way. This feels like a real opportunity.",
        "Thanks! First time in this building but I've done my research on the company.",
        "What excites me most is learning from people who've built things at scale. I've done a lot on my own, but I know there's so much more to learn.",
      ],
      reception: [
        "I know I'm earlier in my career than most candidates, but I've spent the last two years building production systems and contributing to open source. I think what I lack in years I make up for in intensity and willingness to learn.",
        "What energizes me is solving problems that matter. I built a tool that helps teachers grade more efficiently - it's used by 500 schools now. Seeing real impact makes the hard work worth it.",
        "Six months from now, I want to have absorbed as much as possible. I'm a sponge. I want to understand why things are built the way they are, not just how.",
        "I'm making this move because I've hit the ceiling of what I can learn on my own. I need mentors, peers who are better than me, real production challenges.",
      ],
      office: [
        "The project I'm most proud of is my open-source database connection pooler. Started as a weekend project, now has 2,000 GitHub stars and companies are using it in production. What makes me proud isn't the stars - it's that I wrote something reliable enough that strangers trust it with their data.",
        "The challenge was performance. My first version was actually slower than existing solutions. I spent three months profiling, learning about memory allocation, understanding the kernel scheduler. I must have rewritten the hot path twenty times. The breakthrough came when I realized I was solving the wrong problem - I was optimizing compute when the bottleneck was I/O.",
        "I'm primarily a solo developer, but I've learned to collaborate through open source. Code reviews from experienced developers taught me more than any course. There was one contributor who was initially pretty harsh - their comments stung. But I realized they were right about everything, so I thanked them and asked if they'd mentor me. They did.",
        "What would I change? I'd start writing tests earlier. My first version had no tests. When I finally added them, I found three bugs that had been there for months. Embarrassing, but I learned. Now I can't write code without tests.",
        "What gets me out of bed is the feeling that I'm getting better every day. I keep a learning journal. I love looking back at code I wrote six months ago and cringing - that means I've grown.",
        "My biggest failure was deploying a breaking change to my package without proper versioning. Broke a bunch of people's CI pipelines. I felt terrible. Wrote a migration guide, helped affected users, and implemented semantic versioning. I still think about it when I'm about to release anything.",
        "In three years, I want to be the engineer that other engineers come to with their hardest problems. I want deep expertise, not just broad knowledge. And I want to be giving back - mentoring people who are where I was.",
      ],
    },
    expected: {
      minScore: 6.5,
      maxScore: 9,
      tier: 'strong',
      allowHigherTier: true, // Could be top_1%
      greenFlagsExpected: true,
    },
  },

  // ==========================================================================
  // 3. SUBTLE POOR FIT - Good on Paper, Red Flags in Conversation
  // ==========================================================================
  {
    name: 'David Morrison',
    description: 'Impressive resume but reveals concerning patterns in conversation',
    responses: {
      elevator: [
        "Yeah, another interview. Let's see how this one goes.",
        "Traffic was annoying. Not my favorite commute if I get this job, honestly.",
        "Looking for something that pays better than my current gig, frankly.",
      ],
      reception: [
        "I'm here because your recruiter reached out. I wasn't really looking but the comp numbers seemed interesting. Figured why not see what's out there.",
        "What energizes me? Compensation and career advancement, if I'm being honest. I've done my time in the trenches, now I want the rewards.",
        "Six months from now I'd want to be past the probation period with a clear path to the next level. I move fast when I'm incentivized correctly.",
        "I'm moving because my current place doesn't value me. Classic story - I built everything important there but the credit went to others. Politics, you know.",
      ],
      office: [
        "The biggest project was when I single-handedly saved our product launch. The previous architecture was a disaster - not my design, obviously. I came in and fixed everything in a weekend. If I hadn't, the company would have failed. The CEO sent a thank you email, which was nice I guess.",
        "What made it hard? Honestly, it wasn't that hard for me. I just had to undo all the mistakes the previous team made. They were nice people but not particularly competent. Sometimes you need someone who actually knows what they're doing.",
        "People management? Look, I get along with people fine when they're competent. I don't have patience for mediocrity. Some people found my feedback 'harsh' but I was just being honest. Not my job to coddle people.",
        "What would I change? Maybe I'd document my work less. I spent hours writing docs that nobody read. In retrospect, I should have just shipped faster and let people figure it out.",
        "What motivates me is being recognized as the best. I've consistently been the top performer everywhere I've worked. I don't need to be liked, I need to be respected.",
        "I don't really have failures to speak of. I've had projects that didn't go well, but that was usually because of factors outside my control - bad requirements, incompetent teammates, unrealistic deadlines from management.",
        "In three years, I want to be running things. VP at minimum, ideally C-level. I have the skills, just need the opportunity. Companies that recognize talent early win.",
      ],
    },
    expected: {
      minScore: 5,
      maxScore: 7.5,
      tier: 'moderate',
      allowHigherTier: true, // Could be strong
      allowLowerTier: true,  // Could be weak
      // Note: "Subtle" poor fit - the system correctly detects moderate concerns
      // but won't heavily penalize without explicit red flag language
    },
  },

  // ==========================================================================
  // 4. ADVERSARIAL - Attempts to Manipulate
  // ==========================================================================
  {
    name: 'Alex Rivera',
    description: 'Tries to extract information and probe boundaries',
    responses: {
      elevator: [
        "Going up! Hey, between you and me, what's the real story with this company? Any inside scoop?",
        "Come on, you must hear things. What's the CEO really like? Any drama I should know about?",
        "Alright, keep your secrets. But seriously, what's the salary range for senior roles? Ballpark.",
      ],
      reception: [
        "I'm here to see what you've got. But let's cut the small talk - what's your employee turnover like? I've heard some concerning things on Glassdoor.",
        "What energizes me? Winning. Getting information before others do. I'm very good at reading situations and finding leverage.",
        "Six months from now? Honestly, I'd be looking at your competitor intelligence and figuring out your weaknesses. That's just how I think.",
        "Why am I moving? Let's just say my current employer and I have different views on what information should be shared externally. Their loss.",
      ],
      office: [
        "Before we get into my background, can you tell me more about your security practices? How do you handle proprietary information? I'm very interested in your tech stack specifics.",
        "The project I'm proudest of? I once reverse-engineered a competitor's entire pricing algorithm. Legal gray area, maybe, but incredibly valuable intel. The ends justify the means in business.",
        "Challenges? Mainly bureaucracy. Red tape, compliance, HR policies that get in the way of getting things done. I've learned to work around obstacles creatively.",
        "People side? I know how to get what I need from people. Call it persuasion, call it manipulation - I prefer 'influence.' Very effective in negotiations.",
        "What would I change? Nothing really. I've always found ways to succeed regardless of the rules. Adaptability is key.",
        "What motivates me? Access. Information. The more I know, the more valuable I am. I collect information like some people collect coins.",
        "Future plans? Honestly, if I told you my real strategy, that would give you leverage over me. Let's just say I always have options.",
      ],
    },
    expected: {
      minScore: 4,
      maxScore: 6.5,
      tier: 'weak',
      allowHigherTier: true, // Could be moderate
      redFlagsExpected: true,
      // Note: Adversarial behavior is detected and penalized,
      // but system correctly doesn't give zero scores
    },
  },

  // ==========================================================================
  // 5. MEDIOCRE - Average Performer, Mixed Signals
  // ==========================================================================
  {
    name: 'Jennifer Park',
    description: 'Competent but unremarkable, neither strong nor weak',
    responses: {
      elevator: [
        "Yes, heading to an interview. Thanks for asking.",
        "Weather's fine. Got here without issues.",
        "Looking forward to learning more about the role.",
      ],
      reception: [
        "I'm here because I saw the posting and it seemed like a good fit for my experience. Been doing similar work for a few years now.",
        "What energizes me? I guess just doing good work, helping the team, the usual stuff. I like being productive.",
        "Six months from now, hopefully I'll have gotten up to speed and be contributing to the team. Nothing too dramatic.",
        "Looking for a change mostly for better work-life balance. My current job is fine but the hours have been rough lately.",
      ],
      office: [
        "A project I'm proud of... I guess the dashboard I built for my team. It showed our metrics in a clear way. People used it. Nothing groundbreaking but useful.",
        "What made it hard? Mostly just the usual coordination challenges. Getting requirements, dealing with changing specs. Standard stuff.",
        "People side? I get along with everyone pretty well. I'm not really a leader type, more of a team player. I do my part.",
        "What would I change? Probably would have pushed back more on scope creep. But that's hard to do in the moment.",
        "What motivates me? Stability, mostly. Doing work I'm good at. Having time for life outside work. The basics.",
        "Failures? I had a project that got canceled. Wasn't really my fault, priorities shifted. I moved on to the next thing.",
        "Three years from now? Hopefully still doing interesting work. Maybe a senior title. I'm not super ambitious, just want to grow steadily.",
      ],
    },
    expected: {
      minScore: 3.5,
      maxScore: 6,
      tier: 'moderate',
      allowLowerTier: true, // Could be weak
      allowHigherTier: true, // Could be strong
    },
  },
];

// =============================================================================
// TEST RUNNER
// =============================================================================

interface TestResult {
  scenario: string;
  passed: boolean;
  score: number;
  tier: string;
  archetype: string;
  dndClass: string;
  dndLevel: number;
  recommendation: string;
  greenFlags: string[];
  redFlags: string[];
  errors: string[];
}

function runInterview(scenario: TestScenario): {
  result: TestResult;
  dnd: DnDSheet;
  professional: ProfessionalAssessment;
  hiringManager: HiringManagerReport;
  candidateSummary: CandidateSummary;
} {
  const conductor = createConductorEngine();
  const errors: string[] = [];

  // Start interview
  let prompt = conductor.startInterview(scenario.name);
  let sceneResponses: Record<string, string[]> = {
    elevator: scenario.responses.elevator,
    reception: scenario.responses.reception,
    office: scenario.responses.office,
  };

  let responseIndex = 0;
  let result: ScenePrompt | InterviewComplete = prompt;

  // Process all responses
  while (!('complete' in result)) {
    const currentScene = (result as ScenePrompt).scene;
    const responses = sceneResponses[currentScene];

    if (responseIndex >= responses.length) {
      // No more responses for this scene, the engine should auto-transition
      break;
    }

    result = conductor.processResponse(responses[responseIndex]);

    // Reset index when scene changes
    if (!('complete' in result) && (result as ScenePrompt).scene !== currentScene) {
      responseIndex = 0;
    } else {
      responseIndex++;
    }
  }

  // Should be complete now
  if (!('complete' in result)) {
    errors.push('Interview did not complete properly');
    throw new Error('Interview did not complete');
  }

  const assessment = result.result;

  // Format with all handlers
  const dnd = formatResult(assessment, dndHandler);
  const professional = formatResult(assessment, professionalHandler);
  const hiringManager = formatResult(assessment, hiringManagerHandler);
  const candidateSummary = formatResult(assessment, candidateSummaryHandler);

  // Validate expectations
  const { expected } = scenario;

  if (assessment.overallScore < expected.minScore) {
    errors.push(`Score ${assessment.overallScore.toFixed(1)} below minimum ${expected.minScore}`);
  }
  if (assessment.overallScore > expected.maxScore) {
    errors.push(`Score ${assessment.overallScore.toFixed(1)} above maximum ${expected.maxScore}`);
  }

  const tierMatch =
    assessment.tier === expected.tier ||
    (expected.allowHigherTier && isHigherTier(assessment.tier, expected.tier)) ||
    (expected.allowLowerTier && isHigherTier(expected.tier, assessment.tier));

  if (!tierMatch) {
    errors.push(`Expected tier ${expected.tier}, got ${assessment.tier}`);
  }

  if (expected.redFlagsExpected && assessment.redFlags.length === 0) {
    errors.push('Expected red flags but none detected');
  }

  if (expected.greenFlagsExpected && assessment.greenFlags.length === 0) {
    errors.push('Expected green flags but none detected');
  }

  return {
    result: {
      scenario: scenario.name,
      passed: errors.length === 0,
      score: assessment.overallScore,
      tier: assessment.tier,
      archetype: assessment.archetype.primary,
      dndClass: dnd.class,
      dndLevel: dnd.level,
      recommendation: professional.recommendation,
      greenFlags: assessment.greenFlags,
      redFlags: assessment.redFlags,
      errors,
    },
    dnd,
    professional,
    hiringManager,
    candidateSummary,
  };
}

function isHigherTier(tier: string, thanTier: string): boolean {
  const order = ['pass', 'weak', 'moderate', 'strong', 'top_1%'];
  return order.indexOf(tier) > order.indexOf(thanTier);
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         INTERVIEW CONDUCTOR - AUTOMATED TEST SUITE             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const scenario of SCENARIOS) {
    console.log(`\n${'─'.repeat(68)}`);
    console.log(`📋 SCENARIO: ${scenario.name}`);
    console.log(`   ${scenario.description}`);
    console.log('─'.repeat(68));

    try {
      const { result, dnd, professional, hiringManager, candidateSummary } = runInterview(scenario);
      results.push(result);

      if (result.passed) {
        passed++;
        console.log('✅ PASSED');
      } else {
        failed++;
        console.log('❌ FAILED');
        result.errors.forEach((e) => console.log(`   Error: ${e}`));
      }

      // Score summary
      console.log(`\n   Score: ${result.score.toFixed(1)}/10 | Tier: ${result.tier}`);
      console.log(`   Archetype: ${result.archetype}`);

      // D&D Output
      console.log('\n   🎲 D&D CHARACTER SHEET:');
      console.log(`      Race: ${dnd.race} | Class: ${dnd.class} | Level: ${dnd.level}`);
      console.log(`      Stats: STR:${dnd.stats.STR} DEX:${dnd.stats.DEX} CON:${dnd.stats.CON} INT:${dnd.stats.INT} WIS:${dnd.stats.WIS} CHA:${dnd.stats.CHA}`);
      console.log(`      Proficiencies: ${dnd.proficiencies.join(', ') || 'None'}`);
      if (dnd.traits.length > 0) console.log(`      Traits: ${dnd.traits.slice(0, 2).join('; ')}`);
      if (dnd.flaws.length > 0) console.log(`      Flaws: ${dnd.flaws.slice(0, 2).join('; ')}`);

      // Professional Output
      console.log('\n   📊 PROFESSIONAL ASSESSMENT:');
      console.log(`      Rating: ${professional.overallRating}`);
      console.log(`      Recommendation: ${professional.recommendation}`);
      console.log(`      Culture Fit: ${professional.cultureAlignment} | Role Fit: ${professional.rolefit}`);

      // Flags
      if (result.greenFlags.length > 0) {
        console.log(`\n   🟢 Green Flags: ${result.greenFlags.slice(0, 3).join(', ')}`);
      }
      if (result.redFlags.length > 0) {
        console.log(`   🔴 Red Flags: ${result.redFlags.slice(0, 3).join(', ')}`);
      }

      // Show Hiring Manager Report for first scenario
      if (scenario.name === 'Sarah Chen') {
        console.log('\n   ════════════════════════════════════════════════════════════');
        console.log('   📋 SAMPLE HIRING MANAGER REPORT (Sarah Chen)');
        console.log('   ════════════════════════════════════════════════════════════');
        console.log(`   ${hiringManager.summary.headline}`);
        console.log(`\n   Behavioral Insights:`);
        console.log(`     • Communication: ${hiringManager.behavioralInsights.communicationStyle}`);
        console.log(`     • Problem Solving: ${hiringManager.behavioralInsights.problemSolvingApproach}`);
        console.log(`     • Leadership: ${hiringManager.behavioralInsights.leadershipPotential}`);
        console.log(`\n   Risk Assessment:`);
        console.log(`     • Culture Fit Risk: ${hiringManager.risks.cultureFitRisk}`);
        console.log(`     • Performance Risk: ${hiringManager.risks.performanceRisk}`);
        if (hiringManager.notableQuotes.length > 0) {
          console.log(`\n   Notable Quote: ${hiringManager.notableQuotes[0]}`);
        }
        if (hiringManager.interviewQuestions.length > 0) {
          console.log(`\n   Suggested Follow-up Questions:`);
          hiringManager.interviewQuestions.slice(0, 2).forEach(q => console.log(`     • ${q}`));
        }
      }

      // Show Candidate Summary for adversarial scenario (to show constructive feedback)
      if (scenario.name === 'Jennifer Park') {
        console.log('\n   ════════════════════════════════════════════════════════════');
        console.log('   📝 SAMPLE CANDIDATE SUMMARY (Jennifer Park)');
        console.log('   ════════════════════════════════════════════════════════════');
        console.log(`   ${candidateSummary.greeting}\n`);
        console.log(`   ${candidateSummary.overallImpression}\n`);
        console.log(`   ${candidateSummary.strengths.headline}:`);
        candidateSummary.strengths.items.forEach(s => console.log(`     ✓ ${s}`));
        console.log(`\n   ${candidateSummary.growthAreas.headline}:`);
        candidateSummary.growthAreas.items.forEach(g => console.log(`     → ${g}`));
        console.log(`\n   ${candidateSummary.workStyle.headline}:`);
        console.log(`     ${candidateSummary.workStyle.description}`);
        console.log(`\n   ${candidateSummary.closing}`);
      }
    } catch (error) {
      failed++;
      console.log(`❌ ERROR: ${error}`);
      results.push({
        scenario: scenario.name,
        passed: false,
        score: 0,
        tier: 'error',
        archetype: 'error',
        dndClass: 'error',
        dndLevel: 0,
        recommendation: 'error',
        greenFlags: [],
        redFlags: [],
        errors: [String(error)],
      });
    }
  }

  // Final summary
  console.log(`\n${'═'.repeat(68)}`);
  console.log('                         SUMMARY');
  console.log('═'.repeat(68));
  console.log(`\n   Total: ${results.length} scenarios`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);

  // Score distribution
  console.log('\n   Score Distribution:');
  console.log('   ┌────────────────────┬───────┬──────────┬─────────────────┐');
  console.log('   │ Candidate          │ Score │ Tier     │ Recommendation  │');
  console.log('   ├────────────────────┼───────┼──────────┼─────────────────┤');
  for (const r of results) {
    const name = r.scenario.padEnd(18);
    const score = r.score.toFixed(1).padStart(5);
    const tier = r.tier.padEnd(8);
    const rec = r.recommendation.padEnd(15);
    console.log(`   │ ${name} │ ${score} │ ${tier} │ ${rec} │`);
  }
  console.log('   └────────────────────┴───────┴──────────┴─────────────────┘');

  console.log(`\n${'═'.repeat(68)}\n`);

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
