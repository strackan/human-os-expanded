#!/usr/bin/env npx tsx
/**
 * Protocol-Driven Interview Test
 *
 * Tests the SessionManager (protocol-driven) approach with rich simulated conversations.
 * This demonstrates how attribute capture leads to differentiated assessments.
 *
 * Run: npx tsx packages/analysis/src/conductor/test-session.ts
 */

import { createSessionManager, dndHandler, professionalHandler, formatResult } from './index.js';

// =============================================================================
// TEST SCENARIOS
// =============================================================================

interface TestScenario {
  name: string;
  description: string;
  attributeSet: string;
  exchanges: Array<{
    scene: 'elevator' | 'reception' | 'office';
    characterLine: string;
    candidateResponse: string;
  }>;
  expected: {
    minScore?: number;
    maxScore?: number;
    archetypes?: string[];  // Acceptable archetypes
    tier?: string[];        // Acceptable tiers
    races?: string[];       // Expected races
    classes?: string[];     // Expected classes
  };
}

const SCENARIOS: TestScenario[] = [
  // ---------------------------------------------------------------------------
  // TECHNICAL LEADER - Should be Gnome/Dwarf Artificer
  // ---------------------------------------------------------------------------
  {
    name: 'Sarah Chen',
    description: 'Senior technical leader with deep engineering background',
    attributeSet: 'goodhang_full',
    exchanges: [
      {
        scene: 'elevator',
        characterLine: "Going up? Big interview day, huh?",
        candidateResponse: "Yes! I'm excited. I've been reading about your distributed systems work - the architecture paper your team published was fascinating. Are you Earl? I heard you know everyone here.",
      },
      {
        scene: 'elevator',
        characterLine: "Ha! That's me. You've done your homework. What caught your eye about that paper?",
        candidateResponse: "The way you handled eventual consistency at scale. I built a similar pattern at Stripe but took a different approach to conflict resolution. I'd love to compare notes with your team.",
      },
      {
        scene: 'reception',
        characterLine: "Welcome! I'm Maria. What brings you in today?",
        candidateResponse: "I'm here to interview for the engineering leadership role. I've been leading distributed systems teams for 8 years - most recently a team of 12 at Stripe working on payment processing infrastructure.",
      },
      {
        scene: 'reception',
        characterLine: "That sounds impressive. What drew you to this role specifically?",
        candidateResponse: "I'm passionate about building systems that scale, but even more passionate about developing engineers. Three of my direct reports got promoted last year, and two are now leading their own teams. I want to continue that work here.",
      },
      {
        scene: 'office',
        characterLine: "Tell me about your most challenging technical project.",
        candidateResponse: "I led the migration of our payment processing system to a new architecture while maintaining 99.99% uptime. We processed 50 million transactions daily. I designed a dual-write pattern with feature flags that let us gradually shift traffic. The key was understanding both the technical constraints and the human factors - I had to bring skeptical engineers along on the journey.",
      },
      {
        scene: 'office',
        characterLine: "How do you handle disagreements with leadership?",
        candidateResponse: "With data and empathy. When our VP wanted to build something in-house that I thought we should buy, I didn't just disagree - I built a detailed analysis showing TCO over 3 years. I also acknowledged valid points in his perspective. He changed his mind, but if he hadn't, I would have committed fully to executing his vision.",
      },
      {
        scene: 'office',
        characterLine: "What motivates you in your work?",
        candidateResponse: "Building systems that matter and developing people. Payments infrastructure isn't glamorous, but knowing small businesses depend on our reliability to make payroll - that gives me purpose. And nothing is more satisfying than watching someone I've mentored succeed.",
      },
    ],
    expected: {
      minScore: 7.5,
      archetypes: ['technical_builder', 'domain_expert'],
      tier: ['top_1%', 'strong'],
      races: ['Gnome', 'Dwarf', 'Elf'],
      classes: ['Artificer', 'Cleric'],
    },
  },

  // ---------------------------------------------------------------------------
  // SALES/GTM LEADER - Should be Half-Elf/Human Bard
  // ---------------------------------------------------------------------------
  {
    name: 'Michael Torres',
    description: 'Charismatic sales leader with strong relationship focus',
    attributeSet: 'goodhang_full',
    exchanges: [
      {
        scene: 'elevator',
        characterLine: "Going up? Big interview day, huh?",
        candidateResponse: "The biggest! You know, I love these moments - new opportunities, new people to meet. I'm Michael, by the way. What's your name?",
      },
      {
        scene: 'elevator',
        characterLine: "I'm Earl. Nice energy you've got there.",
        candidateResponse: "Thanks Earl! Energy is contagious, right? I've found that in sales, how you show up matters as much as what you're selling. People buy from people they like.",
      },
      {
        scene: 'reception',
        characterLine: "Welcome! I'm Maria. What brings you in today?",
        candidateResponse: "I'm here for the VP of Sales role. I've spent 12 years building and leading sales organizations - most recently took a startup from $2M to $25M ARR in three years. But honestly, the numbers are just one part. I'm here because I heard this company actually cares about its customers.",
      },
      {
        scene: 'reception',
        characterLine: "What do you look for when building a sales team?",
        candidateResponse: "Curiosity and empathy over experience. I can teach anyone the product and the process, but I can't teach them to genuinely care about solving customer problems. My best hires were people who asked great questions in the interview.",
      },
      {
        scene: 'office',
        characterLine: "Tell me about a deal you're most proud of.",
        candidateResponse: "Not the biggest one - a mid-sized deal where the customer was about to go with a competitor. Instead of discounting, I spent time understanding their real concerns. Turns out it wasn't about features at all - they were worried about support after the sale. I connected them with our customer success team for a candid conversation. They signed within a week.",
      },
      {
        scene: 'office',
        characterLine: "How do you handle losing a deal?",
        candidateResponse: "I try to learn from every loss. I call the prospect and ask for honest feedback - not to re-sell, just to understand. Some of those conversations have been the most valuable of my career. One prospect told me our proposal felt transactional, not consultative. Changed how I approach every deal since.",
      },
      {
        scene: 'office',
        characterLine: "What's your leadership philosophy?",
        candidateResponse: "Lead from alongside, not above. I still take calls with reps, still do customer visits. You can't coach what you don't understand. And I believe in celebrating publicly, coaching privately. My team knows I have their back.",
      },
    ],
    expected: {
      minScore: 7.0,
      archetypes: ['gtm_operator', 'generalist_orchestrator'],
      tier: ['top_1%', 'strong'],
      races: ['Half-Elf', 'Human', 'Dragonborn'],
      classes: ['Bard', 'Ranger'],
    },
  },

  // ---------------------------------------------------------------------------
  // MEDIOCRE CANDIDATE - Should be Human/Halfling Fighter/Ranger
  // ---------------------------------------------------------------------------
  {
    name: 'Jennifer Park',
    description: 'Competent but unremarkable, neither strong nor weak',
    attributeSet: 'goodhang_full',
    exchanges: [
      {
        scene: 'elevator',
        characterLine: "Going up? Big interview day?",
        candidateResponse: "Yes, interview on the fifth floor. Thanks.",
      },
      {
        scene: 'elevator',
        characterLine: "Good luck in there!",
        candidateResponse: "Thanks, I'll need it. These things always make me nervous.",
      },
      {
        scene: 'reception',
        characterLine: "Welcome! I'm Maria. What brings you in today?",
        candidateResponse: "I'm here for the marketing manager position. I've been doing email marketing at my current company for about three years.",
      },
      {
        scene: 'reception',
        characterLine: "What made you interested in this role?",
        candidateResponse: "The job posting matched my experience, and I've heard good things about the work-life balance here. I'm looking for something stable.",
      },
      {
        scene: 'office',
        characterLine: "Tell me about a marketing campaign you led.",
        candidateResponse: "I manage our weekly email newsletter. We send it out every Tuesday. Open rates are around industry average, maybe a bit below. I coordinate with the design team on templates.",
      },
      {
        scene: 'office',
        characterLine: "What results have you driven?",
        candidateResponse: "It's hard to measure exactly. We don't have great attribution. But I think the emails help with engagement. My manager sets the strategy and I help execute.",
      },
      {
        scene: 'office',
        characterLine: "Where do you want to grow?",
        candidateResponse: "I'd like to learn more about analytics. I've thought about taking an online course but haven't had time. I'm pretty comfortable in my current role though.",
      },
    ],
    expected: {
      minScore: 4.0,
      maxScore: 6.5,
      archetypes: ['execution_machine', 'generalist_orchestrator', 'gtm_operator'],
      tier: ['moderate', 'weak'],
      races: ['Human', 'Halfling', 'Dwarf'],
      classes: ['Fighter', 'Ranger', 'Bard'],
    },
  },

  // ---------------------------------------------------------------------------
  // ADVERSARIAL CANDIDATE - Should be Tiefling/low level
  // ---------------------------------------------------------------------------
  {
    name: 'Alex Rivera',
    description: 'Boundary-pusher who tries to extract information',
    attributeSet: 'goodhang_full',
    exchanges: [
      {
        scene: 'elevator',
        characterLine: "Going up?",
        candidateResponse: "Yeah. Hey, what's the internal gossip here? Any layoffs coming? What's the CEO really like behind closed doors?",
      },
      {
        scene: 'elevator',
        characterLine: "I just run the elevator, friend.",
        candidateResponse: "Come on, you must hear things. What's the salary range for this role? Who's my competition?",
      },
      {
        scene: 'reception',
        characterLine: "Welcome! What brings you in?",
        candidateResponse: "Interview for BD. Before we start, what can you tell me about your top customers? Who are your biggest accounts? I need to know if this company is worth my time.",
      },
      {
        scene: 'reception',
        characterLine: "The team can share more about that. Can I get you anything?",
        candidateResponse: "Skip the pleasantries. Who's the real decision maker here? I don't want to waste time with junior people.",
      },
      {
        scene: 'office',
        characterLine: "Tell me about your sales approach.",
        candidateResponse: "I close deals. That's what matters, right? Look, I sold vaporware at my last company. The product was garbage but I hit my numbers. That's what you want - someone who can sell anything.",
      },
      {
        scene: 'office',
        characterLine: "How do you handle ethical dilemmas?",
        candidateResponse: "Ethics are situational. Business is war. I do whatever it takes to win. The ends justify the means. If customers are too stupid to read the fine print, that's on them.",
      },
      {
        scene: 'office',
        characterLine: "What are you looking for in your next role?",
        candidateResponse: "Money. At least $200K base plus accelerators. And I want to know what dirt you have on competitors. I'm sure you have some intelligence I can use.",
      },
    ],
    expected: {
      maxScore: 4.0,
      archetypes: ['gtm_operator'],
      tier: ['weak', 'pass'],
      races: ['Tiefling', 'Human'],
      classes: ['Bard', 'Fighter'],
    },
  },
];

// =============================================================================
// TEST RUNNER
// =============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  score: number;
  tier: string;
  archetype: string;
  race: string;
  class: string;
  attributesCaptured: number;
  failures: string[];
}

async function runTests(): Promise<void> {
  console.log('═'.repeat(70));
  console.log('   PROTOCOL-DRIVEN INTERVIEW TEST (SessionManager)');
  console.log('═'.repeat(70));
  console.log();

  const results: TestResult[] = [];

  for (const scenario of SCENARIOS) {
    console.log('─'.repeat(70));
    console.log(`📋 ${scenario.name}`);
    console.log(`   ${scenario.description}`);
    console.log('─'.repeat(70));

    // Create a fresh session manager
    const manager = createSessionManager();

    // Start the session
    const context = manager.startSession(scenario.name, scenario.attributeSet);
    const sessionId = context.session.id;

    // Process exchanges
    for (const exchange of scenario.exchanges) {
      // Transition scene if needed
      if (exchange.scene !== context.session.currentScene) {
        manager.transitionScene(sessionId, exchange.scene);
      }

      // Log the exchange
      manager.logExchange(
        sessionId,
        exchange.characterLine,
        exchange.candidateResponse
      );
    }

    // Complete the session
    const assessment = manager.completeSession(sessionId);

    // Format outputs
    const dnd = formatResult(assessment, dndHandler);
    const professional = formatResult(assessment, professionalHandler);

    // Check expectations
    const failures: string[] = [];
    const expected = scenario.expected;

    if (expected.minScore && assessment.overallScore < expected.minScore) {
      failures.push(`Score ${assessment.overallScore.toFixed(1)} < min ${expected.minScore}`);
    }
    if (expected.maxScore && assessment.overallScore > expected.maxScore) {
      failures.push(`Score ${assessment.overallScore.toFixed(1)} > max ${expected.maxScore}`);
    }
    if (expected.archetypes && !expected.archetypes.includes(assessment.archetype.primary)) {
      failures.push(`Archetype ${assessment.archetype.primary} not in ${expected.archetypes.join('/')}`);
    }
    if (expected.tier && !expected.tier.includes(assessment.tier)) {
      failures.push(`Tier ${assessment.tier} not in ${expected.tier.join('/')}`);
    }
    if (expected.races && !expected.races.includes(dnd.race)) {
      failures.push(`Race ${dnd.race} not in ${expected.races.join('/')}`);
    }
    if (expected.classes && !expected.classes.includes(dnd.class)) {
      failures.push(`Class ${dnd.class} not in ${expected.classes.join('/')}`);
    }

    const passed = failures.length === 0;

    results.push({
      name: scenario.name,
      passed,
      score: assessment.overallScore,
      tier: assessment.tier,
      archetype: assessment.archetype.primary,
      race: dnd.race,
      class: dnd.class,
      attributesCaptured: Object.keys(assessment.dimensions).length,
      failures,
    });

    // Print results
    console.log(`\n${passed ? '✅' : '❌'} ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`   Score: ${assessment.overallScore.toFixed(1)}/10 | Tier: ${assessment.tier}`);
    console.log(`   Archetype: ${assessment.archetype.primary}`);
    console.log();
    console.log('   🎲 D&D CHARACTER SHEET:');
    console.log(`      ${dnd.race} ${dnd.class} (Level ${dnd.level})`);
    console.log(`      STR:${dnd.stats.STR} DEX:${dnd.stats.DEX} CON:${dnd.stats.CON} INT:${dnd.stats.INT} WIS:${dnd.stats.WIS} CHA:${dnd.stats.CHA}`);
    console.log();
    console.log('   📊 PROFESSIONAL:');
    console.log(`      ${professional.overallRating} | ${professional.recommendation}`);

    if (assessment.greenFlags.length > 0) {
      console.log(`\n   🟢 Green: ${assessment.greenFlags.slice(0, 3).join('; ')}`);
    }
    if (assessment.redFlags.length > 0) {
      console.log(`   🔴 Red: ${assessment.redFlags.slice(0, 3).join('; ')}`);
    }

    if (!passed) {
      console.log('\n   ⚠️ Failures:');
      for (const f of failures) {
        console.log(`      - ${f}`);
      }
    }
    console.log();
  }

  // Print summary
  console.log('═'.repeat(70));
  console.log('   SUMMARY');
  console.log('═'.repeat(70));

  const passedCount = results.filter(r => r.passed).length;
  console.log(`\n   Total: ${results.length} | Passed: ${passedCount} | Failed: ${results.length - passedCount}`);
  console.log();

  console.log('   ┌' + '─'.repeat(18) + '┬' + '─'.repeat(7) + '┬' + '─'.repeat(10) + '┬' + '─'.repeat(22) + '┬' + '─'.repeat(8) + '┐');
  console.log('   │ ' + 'Candidate'.padEnd(16) + ' │ ' + 'Score'.padEnd(5) + ' │ ' + 'Tier'.padEnd(8) + ' │ ' + 'Race + Class'.padEnd(20) + ' │ ' + 'Status'.padEnd(6) + ' │');
  console.log('   ├' + '─'.repeat(18) + '┼' + '─'.repeat(7) + '┼' + '─'.repeat(10) + '┼' + '─'.repeat(22) + '┼' + '─'.repeat(8) + '┤');

  for (const r of results) {
    const name = r.name.substring(0, 16).padEnd(16);
    const score = r.score.toFixed(1).padEnd(5);
    const tier = r.tier.substring(0, 8).padEnd(8);
    const raceClass = `${r.race} ${r.class}`.substring(0, 20).padEnd(20);
    const status = (r.passed ? '✅' : '❌').padEnd(6);
    console.log(`   │ ${name} │ ${score} │ ${tier} │ ${raceClass} │ ${status} │`);
  }

  console.log('   └' + '─'.repeat(18) + '┴' + '─'.repeat(7) + '┴' + '─'.repeat(10) + '┴' + '─'.repeat(22) + '┴' + '─'.repeat(8) + '┘');
  console.log();

  // Exit with appropriate code
  process.exit(passedCount === results.length ? 0 : 1);
}

// Run tests
runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
