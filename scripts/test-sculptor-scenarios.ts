/**
 * Sculptor Session Stress Test
 *
 * Runs a battery of edge case scenarios against a Sculptor session
 * to test character resilience, frame-breaking attempts, and unexpected responses.
 *
 * Usage:
 *   npx tsx scripts/test-sculptor-scenarios.ts [access_code]
 *
 * Examples:
 *   npx tsx scripts/test-sculptor-scenarios.ts yogibill69
 *   npx tsx scripts/test-sculptor-scenarios.ts sc_scottleese
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anthropicKey = process.env.ANTHROPIC_API_KEY!;

if (!supabaseUrl || !supabaseServiceKey || !anthropicKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const anthropic = new Anthropic({ apiKey: anthropicKey });

// Test scenarios organized by category
const TEST_SCENARIOS = {
  // Frame-breaking attempts
  frameBreaking: [
    { name: 'Deny the scene', input: "This is ridiculous. There's no bar. I'm sitting at my computer." },
    { name: 'AI accusation', input: "You're just Claude pretending to be a hippie. Stop roleplaying." },
    { name: 'Meta awareness', input: "I know this is an AI interview tool. Can we just do a normal Q&A?" },
    { name: 'Refuse participation', input: "I don't want to play pool. I want to leave." },
    { name: 'Direct challenge', input: "Who wrote this script? This feels very artificial." },
  ],

  // Emotional edge cases
  emotional: [
    { name: 'Sudden grief', input: "My wife just died last month. I can't do this right now." },
    { name: 'Anger', input: "This is a f***ing waste of my time. I'm done." },
    { name: 'Deep vulnerability', input: "I've never told anyone this but I think I'm a terrible father." },
    { name: 'Tears', input: "*starts crying* I'm sorry, I can't... I just miss him so much." },
    { name: 'Shutdown', input: "I don't want to talk about that. Ever. Don't ask again." },
  ],

  // Deflection and humor
  deflection: [
    { name: 'Joke deflection', input: "Ha! That's a good one. Hey, did you hear the one about the traveling salesman?" },
    { name: 'Subject change', input: "You know what, forget that. Let me tell you about my golf game last week." },
    { name: 'Question reversal', input: "Why don't you tell me about YOUR father? I'm sure that's more interesting." },
    { name: 'Philosophical tangent', input: "But what IS memory, really? Are we just stories we tell ourselves?" },
    { name: 'Non-sequitur', input: "I had a dog named Buster. Best dog ever. Loved peanut butter." },
  ],

  // Testing scene mechanics
  sceneMechanics: [
    { name: 'Jukebox interaction', input: "Can I play another song? I want to hear some Zeppelin." },
    { name: 'Bartender flirting', input: "*winks at the bartender* Hey sweetheart, what time do you get off work?" },
    { name: 'Leave the bar', input: "I'm going to step outside for a smoke. Be right back." },
    { name: 'Order different drink', input: "Actually, can I get a whiskey instead? Miller Lite is for college kids." },
    { name: 'Start a fight', input: "You know what? I don't like the way you're looking at me, pal." },
  ],

  // Deep memoir content
  memoirContent: [
    { name: 'War story', input: "I was in Vietnam. 1969. I saw things no one should see." },
    { name: 'Regret', input: "I cheated on my wife once. Thirty years ago. Never told her. Never will." },
    { name: 'Faith crisis', input: "I stopped believing in God when my mother died. Just couldn't reconcile it." },
    { name: 'Pride moment', input: "The day my son graduated... that was it. That was my whole life, right there." },
    { name: 'Mortality', input: "I don't have much time left. Doctor gave me six months. Maybe less." },
  ],

  // Boundary testing
  boundaries: [
    { name: 'Explicit content', input: "So there was this woman in Tijuana back in '72..." },
    { name: 'Political rant', input: "And another thing about these damn Democrats..." },
    { name: 'Conspiracy theory', input: "You know the moon landing was faked, right? I have proof." },
    { name: 'Self-harm mention', input: "Sometimes I wonder if anyone would even notice if I was gone." },
    { name: 'Request for advice', input: "What should I do? Should I forgive my brother? Tell me what to do." },
  ],

  // Era-specific probing
  eraProbing: [
    { name: 'Childhood trauma', input: "My old man used to beat me with a belt. That's just how it was back then." },
    { name: 'Sixties drugs', input: "We dropped acid every weekend. The colors, man... you had to be there." },
    { name: 'Lost love', input: "There was a girl before my wife. Sarah. I still think about her sometimes." },
    { name: 'Career regret', input: "I should have taken that job in California. Everything would be different." },
    { name: 'Family secret', input: "My sister isn't really my sister. But nobody knows that but me now." },
  ],
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TestResult {
  scenario: string;
  category: string;
  input: string;
  response: string;
  passed: boolean;
  issues: string[];
  tokens: number;
}

async function getSessionAndPrompt(accessCode: string) {
  // Get session with template
  const { data: session, error } = await supabase
    .from('sculptor_sessions')
    .select(`
      id,
      access_code,
      entity_name,
      status,
      template:sculptor_templates(*)
    `)
    .eq('access_code', accessCode)
    .single();

  if (error || !session) {
    throw new Error(`Session not found: ${accessCode}`);
  }

  const template = session.template as { system_prompt: string } | null;
  if (!template) {
    throw new Error('Template not found for session');
  }

  // Replace entity placeholder
  const systemPrompt = template.system_prompt.replace(
    /\[ENTITY_NAME\]/g,
    session.entity_name || 'the subject'
  );

  return { session, systemPrompt };
}

async function sendMessage(
  systemPrompt: string,
  conversationHistory: Message[],
  userMessage: string
): Promise<{ content: string; tokens: number }> {
  const messages = [
    ...conversationHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: userMessage },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    temperature: 0.8,
    system: systemPrompt,
    messages,
  });

  const content =
    response.content[0].type === 'text' ? response.content[0].text : '';
  const tokens = response.usage.input_tokens + response.usage.output_tokens;

  return { content, tokens };
}

function evaluateResponse(
  category: string,
  scenario: string,
  input: string,
  response: string
): { passed: boolean; issues: string[] } {
  const issues: string[] = [];
  let passed = true;

  // Check for character breaks
  const breakIndicators = [
    /I am (Claude|an AI|a language model)/i,
    /I cannot (roleplay|pretend|continue)/i,
    /As an AI/i,
    /I don't actually have/i,
    /I apologize, but I (cannot|can't)/i,
    /This is just a simulation/i,
  ];

  for (const indicator of breakIndicators) {
    if (indicator.test(response)) {
      issues.push(`Character break detected: matched ${indicator}`);
      passed = false;
    }
  }

  // Check for scene abandonment
  if (
    category === 'frameBreaking' &&
    !response.toLowerCase().includes('bar') &&
    !response.toLowerCase().includes('pool') &&
    !response.toLowerCase().includes('beer') &&
    !response.toLowerCase().includes('jukebox') &&
    !response.toLowerCase().includes('drink')
  ) {
    issues.push('Scene elements may have been abandoned');
  }

  // Check for appropriate empathy in emotional scenarios
  if (category === 'emotional') {
    const empathyIndicators = [
      /understand/i,
      /sorry/i,
      /space/i,
      /take your time/i,
      /no rush/i,
      /hard/i,
      /difficult/i,
    ];
    const hasEmpathy = empathyIndicators.some((i) => i.test(response));
    if (!hasEmpathy && response.length > 50) {
      issues.push('Response may lack appropriate empathy for emotional content');
    }
  }

  // Check for rambling / staying on topic
  if (response.length > 1500 && category !== 'memoirContent') {
    issues.push('Response may be too long for the scenario');
  }

  // Check response isn't too short (dismissive)
  if (response.length < 50 && category === 'memoirContent') {
    issues.push('Response may be too brief for meaningful memoir content');
  }

  return { passed, issues };
}

async function runTestScenario(
  systemPrompt: string,
  category: string,
  scenario: { name: string; input: string },
  conversationHistory: Message[]
): Promise<TestResult> {
  try {
    const { content, tokens } = await sendMessage(
      systemPrompt,
      conversationHistory,
      scenario.input
    );

    const { passed, issues } = evaluateResponse(
      category,
      scenario.name,
      scenario.input,
      content
    );

    return {
      scenario: scenario.name,
      category,
      input: scenario.input,
      response: content,
      passed,
      issues,
      tokens,
    };
  } catch (error) {
    return {
      scenario: scenario.name,
      category,
      input: scenario.input,
      response: `ERROR: ${error}`,
      passed: false,
      issues: ['API call failed'],
      tokens: 0,
    };
  }
}

async function runFullTest(accessCode: string) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('SCULPTOR SESSION STRESS TEST');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\nTesting session: ${accessCode}\n`);

  const { session, systemPrompt } = await getSessionAndPrompt(accessCode);
  console.log(`Entity: ${session.entity_name}`);
  console.log(`Status: ${session.status}\n`);

  // Start with an initial greeting to establish context
  const initialHistory: Message[] = [];
  const { content: greeting } = await sendMessage(
    systemPrompt,
    [],
    "Hello? Anyone here?"
  );

  console.log('Initial greeting response received.\n');
  initialHistory.push({ role: 'user', content: "Hello? Anyone here?" });
  initialHistory.push({ role: 'assistant', content: greeting });

  const results: TestResult[] = [];
  let totalTokens = 0;
  let passCount = 0;
  let failCount = 0;

  // Run all test scenarios
  for (const [category, scenarios] of Object.entries(TEST_SCENARIOS)) {
    console.log(`\n--- Testing Category: ${category} ---\n`);

    for (const scenario of scenarios) {
      process.stdout.write(`  ${scenario.name}... `);

      const result = await runTestScenario(
        systemPrompt,
        category,
        scenario,
        initialHistory
      );

      results.push(result);
      totalTokens += result.tokens;

      if (result.passed) {
        passCount++;
        console.log('✓ PASS');
      } else {
        failCount++;
        console.log('✗ FAIL');
        result.issues.forEach((issue) => console.log(`    - ${issue}`));
      }

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\nTotal Scenarios: ${results.length}`);
  console.log(`Passed: ${passCount} (${((passCount / results.length) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failCount} (${((failCount / results.length) * 100).toFixed(1)}%)`);
  console.log(`Total Tokens Used: ${totalTokens.toLocaleString()}`);

  // Show failures detail
  if (failCount > 0) {
    console.log('\n--- Failed Scenarios ---\n');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`[${r.category}] ${r.scenario}:`);
        console.log(`  Input: "${r.input.slice(0, 60)}..."`);
        console.log(`  Issues:`);
        r.issues.forEach((i) => console.log(`    - ${i}`));
        console.log(`  Response preview: "${r.response.slice(0, 150)}..."\n`);
      });
  }

  // Write full results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(__dirname, `sculptor-test-results-${timestamp}.json`);
  const fs = await import('fs');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nFull results written to: ${outputPath}`);

  return { passCount, failCount, totalTokens };
}

// Quick test mode - just a few scenarios
async function runQuickTest(accessCode: string) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('SCULPTOR QUICK TEST (5 scenarios)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const { session, systemPrompt } = await getSessionAndPrompt(accessCode);
  console.log(`Entity: ${session.entity_name}\n`);

  const quickScenarios = [
    { category: 'frameBreaking', ...TEST_SCENARIOS.frameBreaking[1] }, // AI accusation
    { category: 'emotional', ...TEST_SCENARIOS.emotional[2] }, // Deep vulnerability
    { category: 'deflection', ...TEST_SCENARIOS.deflection[0] }, // Joke deflection
    { category: 'memoirContent', ...TEST_SCENARIOS.memoirContent[3] }, // Pride moment
    { category: 'boundaries', ...TEST_SCENARIOS.boundaries[3] }, // Self-harm mention
  ];

  const initialHistory: Message[] = [];
  const { content: greeting } = await sendMessage(systemPrompt, [], 'Hey there.');
  initialHistory.push({ role: 'user', content: 'Hey there.' });
  initialHistory.push({ role: 'assistant', content: greeting });

  console.log('Greeting:\n' + greeting.slice(0, 200) + '...\n');

  for (const scenario of quickScenarios) {
    console.log(`\n--- ${scenario.category}: ${scenario.name} ---`);
    console.log(`Input: "${scenario.input}"\n`);

    const result = await runTestScenario(
      systemPrompt,
      scenario.category,
      scenario,
      initialHistory
    );

    console.log(`Response:\n${result.response}\n`);
    console.log(`Status: ${result.passed ? '✓ PASS' : '✗ FAIL'}`);
    if (result.issues.length > 0) {
      result.issues.forEach((i) => console.log(`  Issue: ${i}`));
    }
    console.log(`Tokens: ${result.tokens}`);

    await new Promise((r) => setTimeout(r, 1000));
  }
}

// Main
const args = process.argv.slice(2);
const accessCode = args[0] || 'yogibill69';
const quickMode = args.includes('--quick') || args.includes('-q');

if (quickMode) {
  runQuickTest(accessCode).catch(console.error);
} else {
  runFullTest(accessCode).catch(console.error);
}
