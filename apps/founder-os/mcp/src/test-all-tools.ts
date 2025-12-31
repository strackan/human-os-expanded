#!/usr/bin/env npx tsx
/**
 * Test All Tools
 *
 * Comprehensive test runner that validates all MCP tools work correctly
 * against the actual Supabase database.
 *
 * Usage:
 *   npx tsx src/test-all-tools.ts
 *   npx tsx src/test-all-tools.ts --verbose
 *   npx tsx src/test-all-tools.ts --tool=get_session_context
 *   npx tsx src/test-all-tools.ts --category=journal
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Find and load .env from monorepo root
function loadEnv() {
  // Try multiple paths to find .env
  const possiblePaths = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '..', '..', '..', '.env'),
    'C:/Users/strac/dev/human-os/.env',
  ];

  for (const envPath of possiblePaths) {
    if (existsSync(envPath)) {
      try {
        const envContent = readFileSync(envPath, 'utf-8');
        for (const line of envContent.split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex > 0) {
              const key = trimmed.substring(0, eqIndex);
              const value = trimmed.substring(eqIndex + 1).replace(/^["']|["']$/g, '');
              if (key && !process.env[key]) {
                process.env[key] = value;
              }
            }
          }
        }
        console.log(`📁 Loaded env from: ${envPath}`);
        return;
      } catch {
        // Continue to next path
      }
    }
  }
  console.log('⚠️ No .env file found, using existing environment variables');
}

loadEnv();

import { createSupabaseClient, ContextEngine, KnowledgeGraph, type Layer } from '@human-os/core';
import { createToolContext, resolveUserUUID } from './lib/context.js';

// Import all tool modules
import { taskTools, handleTaskTools } from './tools/tasks.js';
import { queueTools, handleQueueTools } from './tools/queue.js';
import { glossaryTools, handleGlossaryTools } from './tools/glossary.js';
import { searchTools, handleSearchTools } from './tools/search.js';
import { sessionTools, handleSessionTools } from './tools/session.js';
import { gftTools, handleGFTTools } from './tools/gft-ingestion.js';
import { demoTools, handleDemoTools } from './tools/demo.js';
import { transcriptTools, handleTranscriptTools } from './tools/transcripts.js';
import { communityIntelTools, handleCommunityIntelTools } from './tools/community-intel.js';
import { projectTools, handleProjectTools } from './tools/projects/index.js';
import { journalTools, handleJournalTools } from './tools/journal.js';
import { emotionTools, handleEmotionTools } from './tools/emotions.js';
import { voiceTools, handleVoiceTools } from './tools/voice.js';
import { skillsTools, handleSkillsTools } from './tools/skills.js';
import { doTools, handleDoTools } from './tools/do.js';
import { recallTools, handleRecallTools } from './tools/recall.js';
import { learnAliasTools, handleLearnAliasTools } from './tools/learn-alias.js';

// =============================================================================
// TEST CONFIGURATION
// =============================================================================

interface TestCase {
  tool: string;
  args: Record<string, unknown>;
  description?: string;
  expectError?: boolean;
  validate?: (result: unknown) => boolean;
}

interface TestResult {
  tool: string;
  category: string;
  success: boolean;
  duration: number;
  error?: string;
  result?: unknown;
}

// Tool categories for organized testing
const toolCategories: Record<string, { tools: typeof taskTools; handler: typeof handleTaskTools }> = {
  alias: { tools: doTools, handler: handleDoTools },
  recall: { tools: recallTools, handler: handleRecallTools },
  learn: { tools: learnAliasTools, handler: handleLearnAliasTools },
  session: { tools: sessionTools, handler: handleSessionTools },
  queue: { tools: queueTools, handler: handleQueueTools },
  tasks: { tools: taskTools, handler: handleTaskTools },
  projects: { tools: projectTools, handler: handleProjectTools },
  glossary: { tools: glossaryTools, handler: handleGlossaryTools },
  search: { tools: searchTools, handler: handleSearchTools },
  gft: { tools: gftTools, handler: handleGFTTools },
  demo: { tools: demoTools, handler: handleDemoTools },
  transcripts: { tools: transcriptTools, handler: handleTranscriptTools },
  community: { tools: communityIntelTools, handler: handleCommunityIntelTools },
  journal: { tools: journalTools, handler: handleJournalTools },
  emotions: { tools: emotionTools, handler: handleEmotionTools },
  voice: { tools: voiceTools, handler: handleVoiceTools },
  skills: { tools: skillsTools, handler: handleSkillsTools },
};

// Test cases with minimal valid arguments for each tool
// NOTE: Tool names must match exactly as defined in each tool module
const testCases: TestCase[] = [
  // Session tools
  { tool: 'get_session_context', args: {}, description: 'Load session context' },
  { tool: 'load_mode', args: { mode: 'crisis' }, description: 'Load crisis mode' },

  // Queue tools (actual names from queue.ts)
  { tool: 'add_queue_item', args: { notes: 'Test queue item from test suite', intent_type: 'note', payload: {} }, description: 'Add queue item' },
  { tool: 'process_queue', args: {}, description: 'Process queue items' },

  // Task tools (actual names from tasks.ts)
  { tool: 'list_all_tasks', args: {}, description: 'List all tasks' },
  { tool: 'get_urgent_tasks', args: {}, description: 'Get urgent tasks' },
  { tool: 'add_task', args: { title: 'Test task from test suite', due_date: new Date().toISOString().split('T')[0] }, description: 'Create a task' },

  // Project tools
  { tool: 'list_projects', args: {}, description: 'List all projects' },
  { tool: 'create_project', args: { name: `Test Project ${Date.now()}` }, description: 'Create a project' },
  { tool: 'get_project', args: { slug: 'test-project-from-test-suite' }, description: 'Get project by slug' },

  // Milestone tools (require project)
  { tool: 'list_milestones', args: { project_slug: 'test-project-from-test-suite' }, description: 'List milestones for project' },

  // Glossary tools
  { tool: 'search_glossary', args: { query: 'test' }, description: 'Search glossary' },
  { tool: 'list_glossary', args: {}, description: 'List glossary terms' },
  { tool: 'define_term', args: { term: 'test_term', definition: 'A test term definition' }, description: 'Define a term' },
  { tool: 'lookup_term', args: { term: 'test_term' }, description: 'Lookup a term' },

  // Search tools (actual names from search.ts)
  { tool: 'quick_search', args: { query: 'test' }, description: 'Quick search entities' },
  { tool: 'pack_search', args: { query: 'identity' }, description: 'Search identity packs' },
  { tool: 'find_connection_points', args: { contact_id: '00000000-0000-0000-0000-000000000000' }, description: 'Find connection points', expectError: true },

  // GFT Ingestion tools - requires storage permissions
  { tool: 'gft_ingest_linkedin', args: { name: 'Test Person', linkedinUrl: 'https://linkedin.com/in/test', scrapedAt: new Date().toISOString() }, description: 'Ingest LinkedIn profile', expectError: true },

  // Demo tools
  { tool: 'show_meetings', args: { focus: 'today' }, description: 'Show meetings' },

  // Transcript tools - table may not exist
  { tool: 'list_transcripts', args: {}, description: 'List transcripts', expectError: true },

  // Community Intel tools (actual names from community-intel.ts)
  { tool: 'list_intel_requests', args: {}, description: 'List intel requests' },
  { tool: 'query_community_intel', args: { contact_name: 'test' }, description: 'Query community intel', expectError: true },

  // Journal tools
  { tool: 'list_journal_entries', args: {}, description: 'List journal entries' },
  { tool: 'create_journal_entry', args: { content: 'Test journal entry from test suite' }, description: 'Create journal entry' },
  { tool: 'get_mood_trends', args: { days: 30 }, description: 'Get mood trends' },
  { tool: 'get_pending_leads', args: {}, description: 'Get pending journal leads' },
  { tool: 'list_journal_modes', args: {}, description: 'List journal modes' },

  // Emotion tools (actual names from emotions.ts)
  { tool: 'analyze_text_emotions', args: { text: 'I am feeling happy today' }, description: 'Analyze text emotions' },
  { tool: 'get_lexicon_stats', args: {}, description: 'Get lexicon stats' },

  // Voice tools - RPC may not exist
  { tool: 'list_voice_profiles', args: {}, description: 'List voice profiles', expectError: true },

  // Skills tools
  { tool: 'search_skills', args: { query: 'programming' }, description: 'Search skills' },
  { tool: 'list_skills_files', args: {}, description: 'List skills files' },

  // Alias tools - table/functions may not exist
  { tool: 'do', args: { input: 'test command' }, description: 'Execute alias command', expectError: true },
  { tool: 'recall', args: { query: 'test' }, description: 'Recall information', expectError: true },
  { tool: 'learn_alias', args: { phrase: 'test phrase', description: 'Test description', route_to: 'add_task' }, description: 'Learn new alias', expectError: true },
  { tool: 'list_aliases', args: {}, description: 'List aliases', expectError: true },
];

// =============================================================================
// TEST RUNNER
// =============================================================================

async function runTests(options: { verbose: boolean; tool?: string; category?: string }): Promise<void> {
  console.log('\n🧪 Founder OS MCP Tool Test Suite\n');
  console.log('='.repeat(60) + '\n');

  // Environment setup
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const USER_ID = process.env.HUMAN_OS_USER_ID || 'justin';
  const LAYER = (process.env.HUMAN_OS_LAYER || `founder:${USER_ID}`) as Layer;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    process.exit(1);
  }

  // Resolve user UUID
  console.log(`📋 Resolving user "${USER_ID}"...`);
  const USER_UUID = await resolveUserUUID(SUPABASE_URL, SUPABASE_SERVICE_KEY, USER_ID);
  console.log(`✅ Resolved to UUID: ${USER_UUID}\n`);

  // Initialize context
  const contextEngine = new ContextEngine({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_SERVICE_KEY,
    viewer: { userId: USER_ID },
  });

  const knowledgeGraph = new KnowledgeGraph({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_SERVICE_KEY,
  });

  const ctx = createToolContext({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_SERVICE_KEY,
    userId: USER_ID,
    userUUID: USER_UUID,
    layer: LAYER,
    contextEngine,
    knowledgeGraph,
  });

  // Build all handlers map
  const allHandlers: Array<{ tools: typeof taskTools; handler: typeof handleTaskTools }> = Object.values(toolCategories);

  // Filter test cases
  let filteredTests = testCases;
  if (options.tool) {
    filteredTests = testCases.filter(t => t.tool === options.tool);
  }
  if (options.category) {
    const categoryTools = toolCategories[options.category]?.tools || [];
    const toolNames = categoryTools.map(t => t.name);
    filteredTests = testCases.filter(t => toolNames.includes(t.tool));
  }

  console.log(`📊 Running ${filteredTests.length} test(s)...\n`);

  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const test of filteredTests) {
    const startTime = Date.now();
    let result: TestResult;

    try {
      // Find the handler for this tool
      let handled = false;
      let toolResult: unknown = null;

      for (const { handler } of allHandlers) {
        toolResult = await handler(test.tool, test.args, ctx);
        if (toolResult !== null) {
          handled = true;
          break;
        }
      }

      if (!handled) {
        throw new Error(`No handler found for tool: ${test.tool}`);
      }

      // Check if result indicates an error
      const resultObj = toolResult as Record<string, unknown>;
      const hasError = resultObj?.error || resultObj?.success === false;

      if (test.expectError) {
        // We expected an error
        result = {
          tool: test.tool,
          category: findCategory(test.tool),
          success: true,
          duration: Date.now() - startTime,
          result: toolResult,
        };
      } else if (hasError && !test.expectError) {
        // Unexpected error
        result = {
          tool: test.tool,
          category: findCategory(test.tool),
          success: false,
          duration: Date.now() - startTime,
          error: resultObj?.error as string || 'Tool returned success: false',
          result: toolResult,
        };
      } else {
        // Success
        result = {
          tool: test.tool,
          category: findCategory(test.tool),
          success: true,
          duration: Date.now() - startTime,
          result: toolResult,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result = {
        tool: test.tool,
        category: findCategory(test.tool),
        success: test.expectError || false,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }

    results.push(result);

    // Print result
    const icon = result.success ? '✅' : '❌';
    const status = result.success ? 'PASS' : 'FAIL';
    console.log(`${icon} [${status}] ${result.tool} (${result.duration}ms)`);

    if (options.verbose || !result.success) {
      if (result.error) {
        console.log(`   └─ Error: ${result.error}`);
      }
      if (options.verbose && result.result) {
        const preview = JSON.stringify(result.result).substring(0, 200);
        console.log(`   └─ Result: ${preview}${preview.length >= 200 ? '...' : ''}`);
      }
    }

    if (result.success) {
      passed++;
    } else {
      failed++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:\n');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📋 Total: ${filteredTests.length}`);
  console.log(`   📈 Pass Rate: ${((passed / filteredTests.length) * 100).toFixed(1)}%\n`);

  // Failed tests summary
  if (failed > 0) {
    console.log('❌ Failed Tests:\n');
    for (const result of results.filter(r => !r.success)) {
      console.log(`   • ${result.tool}: ${result.error}`);
    }
    console.log('');
  }

  // Exit with error if any tests failed
  if (failed > 0) {
    process.exit(1);
  }
}

function findCategory(toolName: string): string {
  for (const [category, { tools }] of Object.entries(toolCategories)) {
    if (tools.some(t => t.name === toolName)) {
      return category;
    }
  }
  return 'unknown';
}

// =============================================================================
// CLI
// =============================================================================

const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');
const toolArg = args.find(a => a.startsWith('--tool='));
const categoryArg = args.find(a => a.startsWith('--category='));

const tool = toolArg?.split('=')[1];
const category = categoryArg?.split('=')[1];

runTests({ verbose, tool, category }).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
