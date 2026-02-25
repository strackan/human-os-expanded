#!/usr/bin/env npx tsx
/**
 * Apply Version Migration - Simple Direct Approach
 * This script executes the migration SQL directly
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 Applying Version Restructure Migration...\n');

  try {
    // Step 1: Get status IDs
    console.log('📊 Getting release statuses...');
    const { data: statuses, error: statusError } = await supabase
      .from('release_statuses')
      .select('id, slug');

    if (statusError) throw statusError;

    const completeStatus = statuses?.find(s => s.slug === 'complete');
    const planningStatus = statuses?.find(s => s.slug === 'planning');

    if (!completeStatus || !planningStatus) {
      console.error('❌ Required statuses not found');
      process.exit(1);
    }

    console.log(`✅ Complete status: ${completeStatus.id}`);
    console.log(`✅ Planning status: ${planningStatus.id}\n`);

    // Step 2: Delete features first
    console.log('🗑️  Deleting features...');
    const { error: featuresError } = await supabase
      .from('features')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (featuresError) console.warn('⚠️  Features delete warning:', featuresError.message);
    else console.log('✅ Features deleted\n');

    // Step 3: Delete releases
    console.log('🗑️  Deleting releases...');
    const { error: releasesError } = await supabase
      .from('releases')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (releasesError) throw releasesError;
    console.log('✅ Releases deleted\n');

    // Step 4: Insert new releases
    console.log('📦 Creating new releases...\n');

    const releases = [
      // Early Development (0.0.x)
      { version: '0.0.1', name: 'Genesis', description: 'Initial application with Renewals HQ dashboard, timeline toggle, and customer list', planned_start: '2025-04-28', planned_end: '2025-04-29', actual_shipped: '2025-04-29T00:00:00Z', status_id: completeStatus.id },
      { version: '0.0.2', name: 'Dashboard Core', description: 'Enhanced dashboard iterations with snooze functionality, actions dropdown, resizable columns, and contracts page', planned_start: '2025-04-30', planned_end: '2025-05-03', actual_shipped: '2025-05-03T00:00:00Z', status_id: completeStatus.id },
      { version: '0.0.3', name: 'Workflow Experiments', description: 'Planning Workflow Alpha, customer page modularization, AI workflow scaffolding', planned_start: '2025-05-04', planned_end: '2025-05-24', actual_shipped: '2025-05-24T00:00:00Z', status_id: completeStatus.id },
      { version: '0.0.4', name: 'Authentication Battle', description: 'Supabase integration, Google OAuth, event handling system, database conversation handles', planned_start: '2025-06-13', planned_end: '2025-07-28', actual_shipped: '2025-07-28T00:00:00Z', status_id: completeStatus.id },
      { version: '0.0.5', name: 'Backend Breakthrough', description: 'Supabase Cloud migration, Customers page, Customer 360 view, ActivePieces integration, Demo mode. 83 new API routes', planned_start: '2025-08-09', planned_end: '2025-08-27', actual_shipped: '2025-08-27T00:00:00Z', status_id: completeStatus.id },
      { version: '0.0.6', name: 'Artifact Engine', description: '100+ artifact components, configuration-driven workflows, template groups, dynamic artifact loading, progress tracker', planned_start: '2025-09-05', planned_end: '2025-09-28', actual_shipped: '2025-09-28T00:00:00Z', status_id: completeStatus.id },
      { version: '0.0.7', name: 'Orchestrator Birth', description: 'Step-based workflow system, workflow registry, WorkflowEngine component, database-driven launches, 7-day snooze enforcement', planned_start: '2025-10-03', planned_end: '2025-10-27', actual_shipped: '2025-10-27T00:00:00Z', status_id: completeStatus.id },
      { version: '0.0.8', name: 'Labs Launch', description: 'Renubu Labs multi-domain proof of concept, Weekly Planner workflow, email orchestration prototype', planned_start: '2025-10-28', planned_end: '2025-10-31', actual_shipped: '2025-10-31T00:00:00Z', status_id: completeStatus.id },
      { version: '0.0.9', name: 'Pre-Production Polish', description: 'Code consolidation, architecture documentation, build configuration optimization', planned_start: '2025-11-01', planned_end: '2025-11-06', actual_shipped: '2025-11-06T00:00:00Z', status_id: completeStatus.id },

      // Foundation (0.1.x)
      { version: '0.1.0', name: 'Zen Dashboard', description: 'Zen dashboard modernization, chat integration UI, living documentation system, GitHub Projects integration, production build system', planned_start: '2025-10-21', planned_end: '2025-11-06', actual_shipped: '2025-11-06T00:00:00Z', status_id: completeStatus.id },
      { version: '0.1.1', name: 'Multi-Tenancy', description: 'Workspace authentication with company_id isolation, workspace invitation system, multi-domain workflow support', planned_start: '2025-11-02', planned_end: '2025-11-08', actual_shipped: '2025-11-08T00:00:00Z', status_id: completeStatus.id },
      { version: '0.1.2', name: 'MCP Foundation', description: 'MCP Registry infrastructure, OAuth integrations (Google Calendar, Gmail, Slack), email orchestration, feature tracking', planned_start: '2025-11-07', planned_end: '2025-11-12', actual_shipped: '2025-11-12T00:00:00Z', status_id: completeStatus.id },
      { version: '0.1.3', name: 'Parking Lot System', description: 'AI-powered workflow event detection, Parking Lot dashboard, LLM analysis with Claude Sonnet 4.5, workflow health scoring', planned_start: '2025-11-15', planned_end: '2025-11-15', actual_shipped: '2025-11-15T00:00:00Z', status_id: completeStatus.id },
      { version: '0.1.4', name: 'Skip & Review Systems', description: 'Skip trigger system with 4 trigger conventions, Review trigger system for approval workflows, enhanced flow control modals', planned_start: '2025-11-15', planned_end: '2025-11-15', actual_shipped: '2025-11-15T00:00:00Z', status_id: completeStatus.id },
      { version: '0.1.5', name: 'String-Tie & Optimization', description: 'String-Tie natural language reminders with Claude AI, voice dictation, feature flag infrastructure, code optimization', planned_start: '2025-11-15', planned_end: '2025-11-16', actual_shipped: '2025-11-16T00:00:00Z', status_id: completeStatus.id },
      { version: '0.1.6', name: 'Workflow Templates', description: 'Database-driven workflow template system, scope-based inheritance, workflow compilation service, InHerSight integration', planned_start: '2025-11-17', planned_end: '2025-11-17', actual_shipped: '2025-11-17T00:00:00Z', status_id: completeStatus.id },

      // Future Releases
      { version: '0.2.0', name: 'Production Launch', description: 'Human OS Check-In System with pattern recognition, personalized workflow suggestions, adaptive reminders, success tracking', planned_start: '2025-12-01', planned_end: '2026-01-01', status_id: planningStatus.id },
      { version: '0.3.0', name: 'TBD', description: 'Details to be announced', planned_start: '2026-04-01', planned_end: '2026-06-30', status_id: planningStatus.id },
    ];

    let successCount = 0;
    for (const release of releases) {
      const { error } = await supabase
        .from('releases')
        .insert(release);

      if (error) {
        console.error(`❌ ${release.version}:`, error.message);
      } else {
        console.log(`✅ ${release.version} - ${release.name}`);
        successCount++;
      }
    }

    console.log(`\n🎉 Created ${successCount}/${releases.length} releases!\n`);

    // Step 5: Verify
    console.log('🔍 Verifying...');
    const { data: allReleases, error: verifyError } = await supabase
      .from('releases')
      .select('version, name')
      .order('version');

    if (verifyError) throw verifyError;

    console.log(`✅ Total releases in database: ${allReleases?.length}\n`);

    // Summary
    console.log('━'.repeat(60));
    console.log('📋 Migration Summary');
    console.log('━'.repeat(60));
    console.log(`✅ ${successCount} releases created`);
    console.log('✅ Current version: 0.1.6');
    console.log('✅ Versions: 0.0.1-0.0.9 (Early Dev), 0.1.0-0.1.6 (Foundation)');
    console.log('⚠️  Features table cleared - recreate as needed');
    console.log('\n📝 Next steps:');
    console.log('1. Run: npm run roadmap');
    console.log('2. Push git tags: git push origin --tags');
    console.log('3. Commit and deploy');
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
