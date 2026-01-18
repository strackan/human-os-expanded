/**
 * Good Hang Network Demo Script
 *
 * Showcases the 4 search modes with realistic scenarios.
 *
 * Usage:
 *   npx tsx scripts/demo/run-demo.ts
 *   npx tsx scripts/demo/run-demo.ts --scenario 1
 *   npx tsx scripts/demo/run-demo.ts --interactive
 */

import { createSearchEngine, SearchMode, SearchResponse } from '@/lib/demo/search';
import { createActionEngine } from '@/lib/demo/actions';
import * as readline from 'readline';

// =============================================================================
// DEMO SCENARIOS
// =============================================================================

interface DemoScenario {
  id: number;
  name: string;
  description: string;
  mode: SearchMode;
  query: string;
  filters?: Record<string, unknown>;
  followUpAction?: {
    type: string;
    description: string;
  };
}

const SCENARIOS: DemoScenario[] = [
  {
    id: 1,
    name: 'Find a Thought Leader',
    description: 'User is preparing a podcast episode on AI Agents in B2B SaaS',
    mode: 'thought_leadership',
    query: 'Who in my network has interesting takes on AI agents in B2B?',
    followUpAction: {
      type: 'draft_intro',
      description: 'Draft intro request to top match',
    },
  },
  {
    id: 2,
    name: 'Find a Hiking Buddy',
    description: 'User is new to Denver and wants to find compatible hiking partners',
    mode: 'social',
    query: 'Find people in Denver who like hiking and have good vibes',
    filters: { location: 'Denver' },
    followUpAction: {
      type: 'schedule_meeting',
      description: 'Suggest a group hike',
    },
  },
  {
    id: 3,
    name: 'GuyForThat Need',
    description: 'User needs help with a specific business problem',
    mode: 'guy_for_that',
    query: 'Someone who can help me think through pricing strategy for my B2B SaaS',
    followUpAction: {
      type: 'request_intro',
      description: 'Request intro to top match',
    },
  },
  {
    id: 4,
    name: 'Professional Networking',
    description: 'User looking for a VP of Engineering with scaling experience',
    mode: 'professional',
    query: 'VP of Engineering in fintech with experience scaling teams',
    followUpAction: {
      type: 'save_to_list',
      description: 'Save to "Potential Hires" list',
    },
  },
];

// =============================================================================
// OUTPUT FORMATTING
// =============================================================================

function formatResult(result: SearchResponse['results'][0], index: number): string {
  const lines = [
    `\n${index + 1}. ${result.name}`,
    `   ${result.title} at ${result.company}`,
    `   📍 ${result.location}`,
    `   🎭 ${result.race} ${result.characterClass} (${result.alignment})`,
    `   📊 Relevance: ${(result.relevanceScore * 100).toFixed(1)}%`,
  ];

  if (result.explanation) {
    lines.push(`   💡 ${result.explanation}`);
  }

  if (result.matchReasons.length > 0) {
    lines.push(`   ✨ ${result.matchReasons.join(', ')}`);
  }

  if (result.sharedInterests && result.sharedInterests.length > 0) {
    lines.push(`   🎯 Interests: ${result.sharedInterests.slice(0, 4).join(', ')}`);
  }

  if (result.connectionPath && result.connectionPath.length > 2) {
    lines.push(`   🔗 Connection: ${result.connectionPath.join(' → ')}`);
  }

  if (result.actions.length > 0) {
    lines.push(`   ⚡ Actions: ${result.actions.map(a => a.label).join(' | ')}`);
  }

  return lines.join('\n');
}

function printHeader(text: string): void {
  const border = '═'.repeat(60);
  console.log(`\n╔${border}╗`);
  console.log(`║ ${text.padEnd(58)} ║`);
  console.log(`╚${border}╝`);
}

function printSubheader(text: string): void {
  console.log(`\n--- ${text} ---`);
}

// =============================================================================
// DEMO RUNNER
// =============================================================================

class DemoRunner {
  private searchEngine: ReturnType<typeof createSearchEngine>;
  private actionEngine: ReturnType<typeof createActionEngine>;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const openaiKey = process.env.OPENAI_API_KEY!;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    this.searchEngine = createSearchEngine(supabaseUrl, supabaseKey, openaiKey, anthropicKey);
    this.actionEngine = createActionEngine(supabaseUrl, supabaseKey, anthropicKey || '');
  }

  async runScenario(scenario: DemoScenario): Promise<void> {
    printHeader(`Scenario ${scenario.id}: ${scenario.name}`);
    console.log(`\n📖 ${scenario.description}`);
    console.log(`\n🔍 Search Mode: ${scenario.mode}`);
    console.log(`📝 Query: "${scenario.query}"`);

    if (scenario.filters) {
      console.log(`🔧 Filters: ${JSON.stringify(scenario.filters)}`);
    }

    printSubheader('Searching...');

    try {
      const _startTime = Date.now();
      const results = await this.searchEngine.search({
        query: scenario.query,
        mode: scenario.mode,
        filters: scenario.filters as Record<string, unknown> | undefined,
        limit: 5,
      });

      console.log(`\n✅ Found ${results.totalMatches} matches in ${results.executionTimeMs}ms`);
      console.log(`   Showing top ${results.results.length} results:`);

      for (let i = 0; i < results.results.length; i++) {
        console.log(formatResult(results.results[i]!, i));
      }

      // Demonstrate follow-up action
      if (scenario.followUpAction && results.results.length > 0) {
        await this.demonstrateAction(scenario.followUpAction, results.results[0]!);
      }

    } catch (error) {
      console.error(`\n❌ Search failed:`, error);
    }
  }

  async demonstrateAction(
    action: DemoScenario['followUpAction'],
    topResult: SearchResponse['results'][0]
  ): Promise<void> {
    if (!action) return;

    printSubheader(`Action: ${action.description}`);

    const context = {
      userId: 'demo-user-001',
      userName: 'Demo User',
      userCompany: 'Demo Company',
    };

    try {
      switch (action.type) {
        case 'draft_intro': {
          const intro = await this.actionEngine.draftIntro(
            {
              targetId: topResult.entityId,
              targetName: topResult.name,
              targetTitle: topResult.title,
              targetCompany: topResult.company,
              introducerName: 'Sarah (mutual connection)',
            },
            context
          );
          console.log(`\n📧 Generated Intro Request:`);
          console.log(`   To: Sarah (mutual connection)`);
          console.log(`   Subject: ${intro.subject}`);
          console.log(`\n   "${intro.message}"`);
          break;
        }

        case 'schedule_meeting': {
          const meeting = await this.actionEngine.scheduleMeeting(
            {
              targetId: topResult.entityId,
              targetName: topResult.name,
              sharedInterests: topResult.sharedInterests,
            },
            context
          );
          console.log(`\n📅 Meeting Suggestion:`);
          console.log(`   Activity: ${meeting.activity}`);
          console.log(`   Timeframe: ${meeting.timeframe}`);
          console.log(`   Suggestion: ${meeting.suggestion}`);
          console.log(`\n   Message: "${meeting.message}"`);
          break;
        }

        case 'save_to_list': {
          console.log(`\n💾 Saving to list...`);
          console.log(`   Added ${topResult.name} to "Potential Hires" list`);
          break;
        }

        case 'request_intro': {
          console.log(`\n🤝 Requesting introduction...`);
          console.log(`   Target: ${topResult.name}`);
          console.log(`   Status: Request sent`);
          console.log(`   Potential introducers: Sarah Kim, Mike Chen, Alex Rivera`);
          break;
        }
      }
    } catch (error) {
      console.error(`\n⚠️ Action failed:`, error);
    }
  }

  async runAllScenarios(): Promise<void> {
    printHeader('Good Hang Network Demo');
    console.log('\nDemonstrating semantic search across a 100-person trusted network.');
    console.log('Showcasing the power vs LinkedIn, Google, or Claude.');

    for (const scenario of SCENARIOS) {
      await this.runScenario(scenario);
      console.log('\n' + '─'.repeat(60));
    }

    printHeader('Demo Complete');
    console.log(`
Key Differentiators Demonstrated:
  ✅ Multi-mode semantic search (4 modes)
  ✅ D&D personality-based matching
  ✅ Trust-weighted network graph
  ✅ Actionable follow-ups (not just search results)
  ✅ Connection path finding
  ✅ Context-aware explanations

Why this beats LinkedIn/Google/Claude:
  • LinkedIn: Only keyword search, no personality matching
  • Google: No network context, no trust weighting
  • Claude: No persistent network, no action execution
  • Good Hang: All of the above + trusted network boundaries
`);
  }

  async runInteractive(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = (prompt: string): Promise<string> =>
      new Promise(resolve => rl.question(prompt, resolve));

    printHeader('Good Hang Interactive Demo');
    console.log('\nEnter natural language queries to search your network.');
    console.log('Type "quit" to exit.\n');

    const modeMap: Record<string, SearchMode> = {
      '1': 'thought_leadership',
      '2': 'social',
      '3': 'professional',
      '4': 'guy_for_that',
    };

    while (true) {
      console.log('\nSearch modes:');
      console.log('  1. Thought Leadership (ideas/expertise)');
      console.log('  2. Social (hangouts/compatibility)');
      console.log('  3. Professional (career/business)');
      console.log('  4. GuyForThat (specific help)');

      const modeChoice = await question('\nSelect mode (1-4): ');
      if (modeChoice.toLowerCase() === 'quit') break;

      const mode = modeMap[modeChoice];
      if (!mode) {
        console.log('Invalid mode. Please enter 1-4.');
        continue;
      }

      const query = await question('Enter your search query: ');
      if (query.toLowerCase() === 'quit') break;

      printSubheader('Searching...');

      try {
        const results = await this.searchEngine.search({
          query,
          mode,
          limit: 5,
        });

        console.log(`\n✅ Found ${results.totalMatches} matches in ${results.executionTimeMs}ms`);

        for (let i = 0; i < results.results.length; i++) {
          console.log(formatResult(results.results[i]!, i));
        }
      } catch (error) {
        console.error('Search failed:', error);
      }
    }

    rl.close();
    console.log('\nThanks for trying Good Hang Network Search!');
  }
}

// =============================================================================
// CLI RUNNER
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  // Check environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    console.error('Set these environment variables or create a .env file');
    process.exit(1);
  }

  if (!openaiKey) {
    console.error('Missing OPENAI_API_KEY - required for semantic search');
    process.exit(1);
  }

  const runner = new DemoRunner();

  // Parse args
  if (args.includes('--interactive')) {
    await runner.runInteractive();
  } else if (args.includes('--scenario')) {
    const scenarioIndex = args.indexOf('--scenario');
    const scenarioId = parseInt(args[scenarioIndex + 1] || '1', 10);
    const scenario = SCENARIOS.find(s => s.id === scenarioId);

    if (scenario) {
      await runner.runScenario(scenario);
    } else {
      console.error(`Invalid scenario ID. Valid: 1-${SCENARIOS.length}`);
      process.exit(1);
    }
  } else {
    await runner.runAllScenarios();
  }
}

main().catch(console.error);
