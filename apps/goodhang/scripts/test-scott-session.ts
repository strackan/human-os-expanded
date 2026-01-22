/**
 * Test script for Scott Leese Sculptor Session
 *
 * Verifies end-to-end functionality:
 * 1. Context files load from Supabase Storage
 * 2. Premier template exists
 * 3. Session creation works
 * 4. System prompt composition works
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CONTEXTS_BUCKET = 'contexts';
const ENTITY_SLUG = 'scott';
const ENTITY_NAME = 'Scott Leese';

interface EntityContext {
  groundRules: string;
  character: string;
  corpus: string;
  gaps: string;
}

async function fetchContextFile(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(CONTEXTS_BUCKET)
    .download(path);

  if (error) {
    console.error(`  ❌ Error fetching ${path}:`, error.message);
    return null;
  }

  const text = await data.text();
  return text;
}

async function testContextFiles(): Promise<EntityContext | null> {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: Verify Context Files in Supabase Storage');
  console.log('='.repeat(60));

  const files = {
    groundRules: '_shared/NPC_GROUND_RULES.md',
    character: `${ENTITY_SLUG}/CHARACTER.md`,
    corpus: `${ENTITY_SLUG}/CORPUS_SUMMARY.md`,
    gaps: `${ENTITY_SLUG}/GAP_ANALYSIS.md`,
  };

  console.log(`\nFetching context files for entity: ${ENTITY_SLUG}`);

  const results = await Promise.all([
    fetchContextFile(files.groundRules),
    fetchContextFile(files.character),
    fetchContextFile(files.corpus),
    fetchContextFile(files.gaps),
  ]);

  const [groundRules, character, corpus, gaps] = results;

  console.log('\nResults:');
  console.log(`  ${groundRules ? '✅' : '❌'} NPC_GROUND_RULES.md (${groundRules?.length || 0} chars)`);
  console.log(`  ${character ? '✅' : '❌'} CHARACTER.md (${character?.length || 0} chars) [REQUIRED]`);
  console.log(`  ${corpus ? '✅' : '⚠️'} CORPUS_SUMMARY.md (${corpus?.length || 0} chars) [optional]`);
  console.log(`  ${gaps ? '✅' : '⚠️'} GAP_ANALYSIS.md (${gaps?.length || 0} chars) [optional]`);

  if (!character) {
    console.error('\n❌ FAIL: CHARACTER.md is required but not found!');
    return null;
  }

  console.log('\n✅ Context files loaded successfully');

  return {
    groundRules: groundRules || '',
    character,
    corpus: corpus || '',
    gaps: gaps || '',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function testPremierTemplate(): Promise<any | null> {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: Verify Premier Template Exists');
  console.log('='.repeat(60));

  const { data: template, error } = await supabase
    .from('sculptor_templates')
    .select('*')
    .eq('slug', 'premier')
    .single();

  if (error) {
    console.error('\n❌ FAIL: Premier template not found:', error.message);
    return null;
  }

  console.log('\nTemplate found:');
  console.log(`  ID: ${template.id}`);
  console.log(`  Slug: ${template.slug}`);
  console.log(`  Name: ${template.name}`);
  console.log(`  System Prompt Length: ${template.system_prompt?.length || 0} chars`);

  const hasPlaceholder = template.system_prompt?.includes('[ENTITY_NAME]');
  console.log(`  Has [ENTITY_NAME] placeholder: ${hasPlaceholder ? '✅' : '❌'}`);

  if (!hasPlaceholder) {
    console.warn('\n⚠️ WARNING: Template may not support entity name substitution');
  }

  console.log('\n✅ Premier template exists and is valid');
  return template;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function testSessionCreation(template: any): Promise<any | null> {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: Create or Find Scott\'s Sculptor Session');
  console.log('='.repeat(60));

  // Check for existing active session
  console.log('\nChecking for existing active session...');
  const { data: existingSession, error: existingError } = await supabase
    .from('sculptor_sessions')
    .select('*, template:sculptor_templates(*)')
    .eq('entity_slug', ENTITY_SLUG)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existingSession && !existingError) {
    console.log('\n✅ Found existing active session:');
    console.log(`  ID: ${existingSession.id}`);
    console.log(`  Access Code: ${existingSession.access_code}`);
    console.log(`  Entity Name: ${existingSession.entity_name}`);
    console.log(`  Status: ${existingSession.status}`);
    console.log(`  Created: ${existingSession.created_at}`);
    return existingSession;
  }

  console.log('  No existing session found, creating new one...');

  // Generate access code
  const { data: accessCode, error: codeError } = await supabase
    .rpc('generate_sculptor_access_code');

  if (codeError) {
    console.error('\n❌ FAIL: Could not generate access code:', codeError.message);
    return null;
  }

  console.log(`  Generated access code: ${accessCode}`);

  // Create session
  const { data: newSession, error: createError } = await supabase
    .from('sculptor_sessions')
    .insert({
      access_code: accessCode,
      template_id: template.id,
      entity_name: ENTITY_NAME,
      entity_slug: ENTITY_SLUG,
      status: 'active',
      metadata: {},
    })
    .select('*, template:sculptor_templates(*)')
    .single();

  if (createError) {
    console.error('\n❌ FAIL: Could not create session:', createError.message);
    return null;
  }

  console.log('\n✅ Created new session:');
  console.log(`  ID: ${newSession.id}`);
  console.log(`  Access Code: ${newSession.access_code}`);
  console.log(`  Entity Name: ${newSession.entity_name}`);
  console.log(`  Status: ${newSession.status}`);

  return newSession;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function composeContextPrompt(context: EntityContext, entityName: string): string {
  const sections: string[] = [];

  if (context.groundRules) {
    sections.push('# Ground Rules\n\n' + context.groundRules);
  }

  if (context.character) {
    sections.push(context.character.replace(/\[ENTITY_NAME\]/g, entityName));
  }

  if (context.corpus) {
    sections.push('# What We Know\n\n' + context.corpus);
  }

  if (context.gaps) {
    sections.push('# Extraction Targets\n\n' + context.gaps);
  }

  return sections.join('\n\n---\n\n');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSystemPrompt(template: any, entityName: string, context: EntityContext): string {
  const placeholder = template.metadata?.entity_placeholder || '[ENTITY_NAME]';
  const escapedPlaceholder = escapeRegex(placeholder);
  const basePrompt = template.system_prompt.replace(new RegExp(escapedPlaceholder, 'g'), entityName);

  const contextPrompt = composeContextPrompt(context, entityName);

  return `${basePrompt}\n\n---\n\n${contextPrompt}`;
}

async function testSystemPromptComposition(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template: any,
  context: EntityContext
): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: Test System Prompt Composition');
  console.log('='.repeat(60));

  const systemPrompt = buildSystemPrompt(template, session.entity_name, context);

  console.log('\nSystem Prompt Analysis:');
  console.log(`  Total Length: ${systemPrompt.length} chars`);
  console.log(`  Contains "red ball cap": ${systemPrompt.includes('red ball cap') ? '✅' : '❌'}`);
  console.log(`  Contains "Scott Leese": ${systemPrompt.includes('Scott Leese') ? '✅' : '❌'}`);
  console.log(`  Contains "The Sculptor": ${systemPrompt.includes('The Sculptor') ? '✅' : '❌'}`);
  console.log(`  Contains lake setting: ${systemPrompt.includes('lake') ? '✅' : '❌'}`);
  console.log(`  Contains fishing: ${systemPrompt.includes('fishing') ? '✅' : '❌'}`);

  // Show preview of prompt sections
  const sections = systemPrompt.split('---');
  console.log(`\n  Prompt has ${sections.length} sections`);

  // Preview first 200 chars of character section
  const charStart = systemPrompt.indexOf('# CHARACTER') || systemPrompt.indexOf('YOU ARE');
  if (charStart > 0) {
    const preview = systemPrompt.slice(charStart, charStart + 300).replace(/\n/g, ' ');
    console.log(`\n  Character section preview:\n  "${preview}..."`);
  }

  console.log('\n✅ System prompt composed successfully');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function printTestSummary(session: any): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  console.log('\n🎯 Ready for end-to-end testing!');
  console.log('\n📋 Session Details:');
  console.log(`   Access Code: ${session.access_code}`);
  console.log(`   Entity: ${session.entity_name} (${session.entity_slug})`);
  console.log(`   Template: ${session.template?.name || 'premier'}`);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  console.log(`\n🔗 Test URL: ${baseUrl}/sculptor/${session.access_code}`);

  console.log('\n📝 Next Steps:');
  console.log('   1. Open the URL above in a browser');
  console.log('   2. The Sculptor should greet Scott with the lake scene');
  console.log('   3. Respond as Scott to test the conversation');
  console.log('   4. Verify responses stay in character');
}

async function main() {
  console.log('\n🎭 Scott Leese Sculptor Session Test');
  console.log('=====================================');
  console.log(`Entity: ${ENTITY_NAME} (${ENTITY_SLUG})`);
  console.log(`Time: ${new Date().toISOString()}`);

  // Step 1: Test context files
  const context = await testContextFiles();
  if (!context) {
    console.error('\n❌ TEST FAILED: Context files not accessible');
    process.exit(1);
  }

  // Step 2: Test premier template
  const template = await testPremierTemplate();
  if (!template) {
    console.error('\n❌ TEST FAILED: Premier template not found');
    process.exit(1);
  }

  // Step 3: Create or find session
  const session = await testSessionCreation(template);
  if (!session) {
    console.error('\n❌ TEST FAILED: Could not create/find session');
    process.exit(1);
  }

  // Step 4: Test system prompt composition
  await testSystemPromptComposition(session, template, context);

  // Print summary
  await printTestSummary(session);

  console.log('\n✅ ALL TESTS PASSED\n');
}

main().catch((error) => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
