/**
 * Phase 3 Integration Test Script
 *
 * Tests the database-driven workflow system end-to-end:
 * 1. Database schema (tables exist, columns correct)
 * 2. Seeded workflows (3 workflows in database)
 * 3. Slide library registry (all slides accessible)
 * 4. Database composer (fetch + compose workflows)
 * 5. Multi-tenant support (stock vs company workflows)
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { SLIDE_LIBRARY, validateSlideSequence } from '@/lib/workflows/slides';
import { composeFromDatabase, fetchWorkflowDefinition, listAvailableWorkflows } from '@/lib/workflows/db-composer';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test results tracker
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function logTest(name: string, passed: boolean, details?: string) {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
  } else {
    failedTests++;
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

function logSection(title: string) {
  console.log('\n' + '═'.repeat(60));
  console.log(`  ${title}`);
  console.log('═'.repeat(60) + '\n');
}

async function testDatabaseSchema() {
  logSection('TEST SECTION 1: Database Schema');

  // Test workflow_definitions columns
  try {
    const { data, error } = await supabase
      .from('workflow_definitions')
      .select('workflow_id, company_id, slide_sequence, slide_contexts, is_stock_workflow')
      .limit(1);

    logTest(
      'workflow_definitions table has Phase 3 columns',
      !error && data !== null,
      error ? `Error: ${error.message}` : 'All columns present'
    );
  } catch (err: any) {
    logTest('workflow_definitions table has Phase 3 columns', false, err.message);
  }

  // Test chat system tables
  const chatTables = [
    'workflow_chat_branches',
    'workflow_chat_threads',
    'workflow_chat_messages',
    'workflow_llm_context',
    'workflow_llm_tool_calls'
  ];

  for (const tableName of chatTables) {
    try {
      const { error } = await supabase.from(tableName).select('id').limit(1);
      logTest(
        `Table ${tableName} exists`,
        !error,
        error ? `Error: ${error.message}` : 'Accessible'
      );
    } catch (err: any) {
      logTest(`Table ${tableName} exists`, false, err.message);
    }
  }

  // Test saved_actions table
  try {
    const { data, error } = await supabase
      .from('saved_actions')
      .select('action_id')
      .eq('available_globally', true);

    logTest(
      'saved_actions table exists and has global actions',
      !error && data && data.length >= 5,
      `Found ${data?.length || 0} global actions`
    );
  } catch (err: any) {
    logTest('saved_actions table exists', false, err.message);
  }
}

async function testSeededWorkflows() {
  logSection('TEST SECTION 2: Seeded Workflows');

  const expectedWorkflows = [
    'standard-renewal',
    'executive-contact-lost',
    'obsidian-black-renewal'
  ];

  for (const workflowId of expectedWorkflows) {
    try {
      const { data, error } = await supabase
        .from('workflow_definitions')
        .select('*')
        .eq('workflow_id', workflowId)
        .eq('is_stock_workflow', true)
        .single();

      if (!error && data) {
        const slideCount = data.slide_sequence?.length || 0;
        logTest(
          `Workflow '${workflowId}' seeded`,
          true,
          `${slideCount} slides: ${data.slide_sequence?.slice(0, 3).join(', ')}...`
        );
      } else {
        logTest(
          `Workflow '${workflowId}' seeded`,
          false,
          error?.message || 'Not found'
        );
      }
    } catch (err: any) {
      logTest(`Workflow '${workflowId}' seeded`, false, err.message);
    }
  }

  // Test all seeded workflows have valid slide sequences
  try {
    const { data: workflows, error } = await supabase
      .from('workflow_definitions')
      .select('workflow_id, slide_sequence')
      .eq('is_stock_workflow', true);

    if (!error && workflows) {
      for (const workflow of workflows) {
        const validation = validateSlideSequence(workflow.slide_sequence || []);
        logTest(
          `Workflow '${workflow.workflow_id}' slides valid`,
          validation.valid,
          validation.valid ? 'All slides found in library' : `Missing: ${validation.missing.join(', ')}`
        );
      }
    }
  } catch (err: any) {
    logTest('Validate workflow slide sequences', false, err.message);
  }
}

async function testSlideLibrary() {
  logSection('TEST SECTION 3: Slide Library Registry');

  const expectedSlides = [
    'greeting',
    'review-account',
    'prepare-quote',
    'draft-email',
    'schedule-call',
    'update-crm',
    'workflow-summary',
    'assess-departure',
    'identify-replacement',
    'review-contract-terms',
    'pricing-strategy'
  ];

  for (const slideId of expectedSlides) {
    const slideExists = !!SLIDE_LIBRARY[slideId];
    logTest(
      `Slide '${slideId}' in registry`,
      slideExists,
      slideExists ? 'Found' : 'Missing'
    );
  }

  // Test total slide count
  const totalSlides = Object.keys(SLIDE_LIBRARY).length;
  logTest(
    'Slide library populated',
    totalSlides >= 11,
    `${totalSlides} slides registered`
  );
}

async function testDatabaseComposer() {
  logSection('TEST SECTION 4: Database Composer');

  // Test fetchWorkflowDefinition
  try {
    const workflowDef = await fetchWorkflowDefinition('standard-renewal', null, supabase);
    logTest(
      'fetchWorkflowDefinition() works',
      !!workflowDef && workflowDef.workflow_id === 'standard-renewal',
      `Fetched: ${workflowDef?.name}`
    );
  } catch (err: any) {
    logTest('fetchWorkflowDefinition() works', false, err.message);
  }

  // Test composeFromDatabase
  try {
    const config = await composeFromDatabase(
      'standard-renewal',
      null,
      { name: 'Test Customer', current_arr: 100000 },
      supabase
    );

    const hasSlides = config.slides && config.slides.length > 0;
    logTest(
      'composeFromDatabase() builds workflow',
      hasSlides,
      hasSlides ? `Composed ${config.slides?.length} slides` : 'No slides generated'
    );

    if (hasSlides) {
      // Test that slides have required structure
      const firstSlide = config.slides![0];
      const hasStructure = firstSlide.id && firstSlide.title;
      logTest(
        'Composed slides have correct structure',
        hasStructure,
        `First slide: ${firstSlide.id} - ${firstSlide.title}`
      );
    }
  } catch (err: any) {
    logTest('composeFromDatabase() builds workflow', false, err.message);
  }

  // Test listAvailableWorkflows
  try {
    const workflows = await listAvailableWorkflows(null, supabase);
    logTest(
      'listAvailableWorkflows() returns results',
      workflows.length >= 3,
      `Found ${workflows.length} workflows`
    );
  } catch (err: any) {
    logTest('listAvailableWorkflows() returns results', false, err.message);
  }
}

async function testMultiTenant() {
  logSection('TEST SECTION 5: Multi-Tenant Support');

  // Test that stock workflows have company_id = null
  try {
    const { data, error } = await supabase
      .from('workflow_definitions')
      .select('workflow_id, company_id, is_stock_workflow')
      .eq('is_stock_workflow', true);

    const allNull = data?.every(w => w.company_id === null);
    logTest(
      'Stock workflows have company_id = null',
      !error && allNull === true,
      `${data?.length || 0} stock workflows`
    );
  } catch (err: any) {
    logTest('Stock workflows have company_id = null', false, err.message);
  }

  // Test unique constraint (company_id, workflow_id)
  try {
    // Try to insert duplicate stock workflow (should fail)
    const { error } = await supabase
      .from('workflow_definitions')
      .insert({
        workflow_id: 'standard-renewal',
        name: 'Duplicate Test',
        workflow_type: 'renewal',
        company_id: null,
        is_stock_workflow: true,
        slide_sequence: ['greeting'],
        slide_contexts: {}
      });

    logTest(
      'Unique constraint prevents duplicate workflows',
      !!error && error.message.includes('unique'),
      error ? 'Constraint working' : 'WARNING: No constraint!'
    );
  } catch (err: any) {
    logTest('Unique constraint prevents duplicate workflows', false, err.message);
  }
}

async function testEndToEnd() {
  logSection('TEST SECTION 6: End-to-End Integration');

  try {
    console.log('Testing complete workflow composition flow:\n');

    // 1. List available workflows
    console.log('1️⃣  Listing available workflows...');
    const workflows = await listAvailableWorkflows(null, supabase);
    console.log(`   Found ${workflows.length} workflows`);

    // 2. Fetch a specific workflow
    console.log('\n2️⃣  Fetching workflow definition...');
    const workflowDef = await fetchWorkflowDefinition('executive-contact-lost', null, supabase);
    console.log(`   Loaded: ${workflowDef.name}`);
    console.log(`   Slides: ${workflowDef.slide_sequence.length}`);

    // 3. Validate slides exist in library
    console.log('\n3️⃣  Validating slides...');
    const validation = validateSlideSequence(workflowDef.slide_sequence);
    console.log(`   Valid: ${validation.valid}`);
    if (!validation.valid) {
      console.log(`   Missing: ${validation.missing.join(', ')}`);
    }

    // 4. Compose workflow
    console.log('\n4️⃣  Composing workflow...');
    const config = await composeFromDatabase(
      'executive-contact-lost',
      null,
      {
        name: 'Acme Corporation',
        current_arr: 250000,
        departed_contact: { name: 'Jane Smith' }
      },
      supabase
    );
    console.log(`   Composed ${config.slides?.length} slides`);

    // 5. Display composed slides
    console.log('\n5️⃣  Composed slide sequence:');
    config.slides?.forEach((slide, i) => {
      console.log(`   ${i + 1}. ${slide.id} - ${slide.title}`);
    });

    logTest(
      'End-to-end workflow composition',
      config.slides && config.slides.length === workflowDef.slide_sequence.length,
      'Complete flow working'
    );

  } catch (err: any) {
    logTest('End-to-end workflow composition', false, err.message);
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(10) + 'PHASE 3 INTEGRATION TEST SUITE' + ' '.repeat(17) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');

  await testDatabaseSchema();
  await testSeededWorkflows();
  await testSlideLibrary();
  await testDatabaseComposer();
  await testMultiTenant();
  await testEndToEnd();

  // Summary
  console.log('\n');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(22) + 'TEST SUMMARY' + ' '.repeat(23) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');
  console.log('');
  console.log(`  Total Tests:  ${totalTests}`);
  console.log(`  ✅ Passed:     ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`  ❌ Failed:     ${failedTests}`);
  console.log('');

  if (failedTests === 0) {
    console.log('  🎉 ALL TESTS PASSED! Phase 3 infrastructure is working! 🎉');
    console.log('');
    process.exit(0);
  } else {
    console.log('  ⚠️  Some tests failed. Please review errors above.');
    console.log('');
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('\n❌ Test suite crashed:', error);
    process.exit(1);
  });
}

export { runAllTests };
