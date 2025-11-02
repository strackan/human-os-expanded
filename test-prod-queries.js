/**
 * Test Production Database Queries
 *
 * This script tests the hanging queries against the production database
 */

const { createClient } = require('@supabase/supabase-js');

// Production database credentials from .env.local
const PROD_SUPABASE_URL = 'https://uuvdjjclwwulvyeboavk.supabase.co';
const PROD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dmRqamNsd3d1bHZ5ZWJvYXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NjIzNzQsImV4cCI6MjA2NTMzODM3NH0.VO30vhbEelllMrf6ok3ZqWqsq-LkRcmBD3lAysS6Kwo';

// Your user ID from staging
const USER_ID = '2d703ec3-a55e-4dd9-8921-ee6663858ff3';

async function testQueries() {
  console.log('🔍 Testing Production Database Queries...\n');

  const supabase = createClient(PROD_SUPABASE_URL, PROD_ANON_KEY);

  // Test Query 1: Get Active Workflows
  console.log('📊 Query 1: Get Active Workflows');
  console.time('Query 1 execution time');
  try {
    const { data, error } = await Promise.race([
      supabase
        .from('workflow_executions')
        .select(`*, customers!inner(name)`)
        .eq('assigned_csm_id', USER_ID)
        .in('status', ['not_started', 'in_progress'])
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: true }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT after 10 seconds')), 10000)
      )
    ]);

    console.timeEnd('Query 1 execution time');

    if (error) {
      console.error('❌ Query 1 Error:', error);
    } else {
      console.log(`✅ Query 1 Success: ${data?.length || 0} rows returned`);
      if (data && data.length > 0) {
        console.log('Sample row:', JSON.stringify(data[0], null, 2));
      }
    }
  } catch (err) {
    console.timeEnd('Query 1 execution time');
    console.error('❌ Query 1 Exception:', err.message);
  }

  console.log('\n---\n');

  // Test Query 2: Fetch Workflow Definition
  console.log('📊 Query 2: Fetch Workflow Definition');
  console.time('Query 2 execution time');
  try {
    const { data, error } = await Promise.race([
      supabase
        .from('workflow_definitions')
        .select('*')
        .eq('workflow_id', 'obsidian-black-renewal')
        .is('company_id', null)
        .order('company_id', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT after 10 seconds')), 10000)
      )
    ]);

    console.timeEnd('Query 2 execution time');

    if (error) {
      console.error('❌ Query 2 Error:', error);
    } else if (!data) {
      console.log('⚠️  Query 2: No workflow definition found');
    } else {
      console.log('✅ Query 2 Success: Workflow definition found');
      console.log('Workflow:', data.name);
    }
  } catch (err) {
    console.timeEnd('Query 2 execution time');
    console.error('❌ Query 2 Exception:', err.message);
  }

  console.log('\n---\n');

  // Test Query 3: Check table counts
  console.log('📊 Query 3: Check Table Counts');
  console.time('Query 3 execution time');
  try {
    const [executions, customers, definitions] = await Promise.all([
      supabase.from('workflow_executions').select('id', { count: 'exact', head: true }),
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('workflow_definitions').select('id', { count: 'exact', head: true }),
    ]);

    console.timeEnd('Query 3 execution time');

    console.log('✅ Table Counts:');
    console.log(`  - workflow_executions: ${executions.count}`);
    console.log(`  - customers: ${customers.count}`);
    console.log(`  - workflow_definitions: ${definitions.count}`);
  } catch (err) {
    console.timeEnd('Query 3 execution time');
    console.error('❌ Query 3 Exception:', err.message);
  }

  console.log('\n✅ Test complete!');
}

testQueries().catch(console.error);
