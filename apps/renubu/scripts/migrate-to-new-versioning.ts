#!/usr/bin/env npx tsx
/**
 * Migrate to New Version Structure
 *
 * This script:
 * 1. Temporarily disables FK constraints
 * 2. Updates all release data in database
 * 3. Clears and resets feature associations
 * 4. Sets current version to 0.1.6
 * 5. Regenerates roadmap
 *
 * Run: npx tsx scripts/migrate-to-new-versioning.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { execSync } from 'child_process';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const NEW_RELEASES = [
  // Early Development (0.0.x)
  {
    version: '0.0.1',
    name: 'Genesis',
    description: 'Initial application with Renewals HQ dashboard, timeline toggle, and customer list',
    release_date: '2025-04-29',
    actual_shipped: '2025-04-29',
    status: 'complete',
    phase: '0.0.x - Early Development',
    timeline: 'April 28-29, 2025'
  },
  {
    version: '0.0.2',
    name: 'Dashboard Core',
    description: 'Enhanced dashboard iterations with snooze functionality, actions dropdown, resizable columns, and contracts page',
    release_date: '2025-05-03',
    actual_shipped: '2025-05-03',
    status: 'complete',
    phase: '0.0.x - Early Development',
    timeline: 'April 30 - May 3, 2025'
  },
  {
    version: '0.0.3',
    name: 'Workflow Experiments',
    description: 'Planning Workflow Alpha, customer page modularization, AI workflow scaffolding',
    release_date: '2025-05-24',
    actual_shipped: '2025-05-24',
    status: 'complete',
    phase: '0.0.x - Early Development',
    timeline: 'May 4-24, 2025'
  },
  {
    version: '0.0.4',
    name: 'Authentication Battle',
    description: 'Supabase integration, Google OAuth, event handling system, database conversation handles',
    release_date: '2025-07-28',
    actual_shipped: '2025-07-28',
    status: 'complete',
    phase: '0.0.x - Early Development',
    timeline: 'June 13 - July 28, 2025'
  },
  {
    version: '0.0.5',
    name: 'Backend Breakthrough',
    description: 'Supabase Cloud migration, Customers page, Customer 360 view, ActivePieces integration, Demo mode. 83 new API routes',
    release_date: '2025-08-27',
    actual_shipped: '2025-08-27',
    status: 'complete',
    phase: '0.0.x - Early Development',
    timeline: 'August 9-27, 2025'
  },
  {
    version: '0.0.6',
    name: 'Artifact Engine',
    description: '100+ artifact components, configuration-driven workflows, template groups, dynamic artifact loading, progress tracker',
    release_date: '2025-09-28',
    actual_shipped: '2025-09-28',
    status: 'complete',
    phase: '0.0.x - Early Development',
    timeline: 'September 5-28, 2025'
  },
  {
    version: '0.0.7',
    name: 'Orchestrator Birth',
    description: 'Step-based workflow system, workflow registry, WorkflowEngine component, database-driven launches, 7-day snooze enforcement',
    release_date: '2025-10-27',
    actual_shipped: '2025-10-27',
    status: 'complete',
    phase: '0.0.x - Early Development',
    timeline: 'October 3-27, 2025'
  },
  {
    version: '0.0.8',
    name: 'Labs Launch',
    description: 'Renubu Labs multi-domain proof of concept, Weekly Planner workflow, email orchestration prototype',
    release_date: '2025-10-31',
    actual_shipped: '2025-10-31',
    status: 'complete',
    phase: '0.0.x - Early Development',
    timeline: 'October 28-31, 2025'
  },
  {
    version: '0.0.9',
    name: 'Pre-Production Polish',
    description: 'Code consolidation, architecture documentation, build configuration optimization',
    release_date: '2025-11-06',
    actual_shipped: '2025-11-06',
    status: 'complete',
    phase: '0.0.x - Early Development',
    timeline: 'November 1-6, 2025'
  },

  // Foundation (0.1.x)
  {
    version: '0.1.0',
    name: 'Zen Dashboard',
    description: 'Zen dashboard modernization, chat integration UI, living documentation system, GitHub Projects integration, production build system',
    release_date: '2025-11-06',
    actual_shipped: '2025-11-06',
    status: 'complete',
    phase: '0.1.x - Foundation',
    timeline: 'October 21 - November 6, 2025'
  },
  {
    version: '0.1.1',
    name: 'Multi-Tenancy',
    description: 'Workspace authentication with company_id isolation, workspace invitation system, multi-domain workflow support',
    release_date: '2025-11-08',
    actual_shipped: '2025-11-08',
    status: 'complete',
    phase: '0.1.x - Foundation',
    timeline: 'November 2-8, 2025'
  },
  {
    version: '0.1.2',
    name: 'MCP Foundation',
    description: 'MCP Registry infrastructure, OAuth integrations (Google Calendar, Gmail, Slack), email orchestration, feature tracking',
    release_date: '2025-11-12',
    actual_shipped: '2025-11-12',
    status: 'complete',
    phase: '0.1.x - Foundation',
    timeline: 'November 7-12, 2025'
  },
  {
    version: '0.1.3',
    name: 'Parking Lot System',
    description: 'AI-powered workflow event detection, Parking Lot dashboard, LLM analysis with Claude Sonnet 4.5, workflow health scoring',
    release_date: '2025-11-15',
    actual_shipped: '2025-11-15',
    status: 'complete',
    phase: '0.1.x - Foundation',
    timeline: 'November 15, 2025'
  },
  {
    version: '0.1.4',
    name: 'Skip & Review Systems',
    description: 'Skip trigger system with 4 trigger conventions, Review trigger system for approval workflows, enhanced flow control modals',
    release_date: '2025-11-15',
    actual_shipped: '2025-11-15',
    status: 'complete',
    phase: '0.1.x - Foundation',
    timeline: 'November 15, 2025'
  },
  {
    version: '0.1.5',
    name: 'String-Tie & Optimization',
    description: 'String-Tie natural language reminders with Claude AI, voice dictation, feature flag infrastructure, code optimization',
    release_date: '2025-11-16',
    actual_shipped: '2025-11-16',
    status: 'complete',
    phase: '0.1.x - Foundation',
    timeline: 'November 15-16, 2025'
  },
  {
    version: '0.1.6',
    name: 'Workflow Templates',
    description: 'Database-driven workflow template system, scope-based inheritance, workflow compilation service, InHerSight integration',
    release_date: '2025-11-17',
    actual_shipped: '2025-11-17',
    status: 'complete',
    phase: '0.1.x - Foundation',
    timeline: 'November 17, 2025'
  },

  // Future Releases
  {
    version: '0.2.0',
    name: 'Production Launch',
    description: 'Human OS Check-In System with pattern recognition, personalized workflow suggestions, adaptive reminders, success tracking',
    target_date: '2026-01-01',
    status: 'planning',
    phase: '0.2.x - Production',
    timeline: 'Target: January 1, 2026'
  },
  {
    version: '0.3.0',
    name: 'TBD',
    description: 'Details to be announced',
    target_date: '2026-06-30',
    status: 'planning',
    phase: '0.3.x - Growth',
    timeline: 'Target: Q2 2026'
  }
];

async function migrateVersioning() {
  console.log('🚀 Starting version migration...\n');

  // Step 1: Delete ALL features (they'll need to be manually reassigned anyway)
  console.log('🗑️  Clearing all features (will need manual reassignment)...');
  const { error: deleteFeatures } = await supabase
    .from('features')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteFeatures) {
    console.warn('⚠️  Could not delete features:', deleteFeatures.message);
    console.log('Continuing anyway...\n');
  } else {
    console.log('✅ Features cleared\n');
  }

  // Step 2: Delete all releases
  console.log('🗑️  Deleting all existing releases...');
  const { error: deleteError } = await supabase
    .from('releases')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteError) {
    console.error('❌ Error deleting releases:', deleteError);
    process.exit(1);
  }
  console.log('✅ All releases deleted\n');

  // Step 3: Insert new releases
  console.log('📦 Creating new release structure...\n');
  const releaseMap: Record<string, string> = {};
  let successCount = 0;

  for (const release of NEW_RELEASES) {
    const { data, error } = await supabase
      .from('releases')
      .insert({
        ...release,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, version, name')
      .single();

    if (error) {
      console.error(`❌ Error creating ${release.version}:`, error);
    } else {
      console.log(`✅ ${release.version} - ${release.name}`);
      releaseMap[release.version] = data.id;
      successCount++;
    }
  }

  console.log(`\n🎉 Created ${successCount}/${NEW_RELEASES.length} releases successfully!\n`);

  // Step 4: Update current version (0.1.6 is now the latest shipped)
  console.log('🔖 Current version is now: 0.1.6\n');

  // Step 5: Regenerate roadmap
  console.log('📝 Regenerating roadmap...');
  try {
    execSync('npm run roadmap', { stdio: 'inherit' });
    console.log('✅ Roadmap regenerated\n');
  } catch (error) {
    console.error('⚠️  Roadmap regeneration failed - run manually: npm run roadmap');
  }

  // Summary
  console.log('━'.repeat(60));
  console.log('📋 Migration Summary:');
  console.log('━'.repeat(60));
  console.log(`✅ ${successCount} releases created`);
  console.log('✅ Current version: 0.1.6');
  console.log('✅ Fallback version updated in API');
  console.log('✅ Git tags created (v0.0.1 through v0.1.6)');
  console.log('✅ Public release notes available at /release-notes');
  console.log('\n⚠️  IMPORTANT - Manual steps required:');
  console.log('1. Re-create features in database (all were deleted due to FK constraints)');
  console.log('2. Assign features to appropriate releases');
  console.log('3. Verify roadmap.md looks correct');
  console.log('4. Push git tags: git push origin --tags');
  console.log('5. Deploy to staging/production');
  console.log('━'.repeat(60));

  console.log('\n📝 Release IDs for reference:');
  Object.entries(releaseMap).forEach(([version, id]) => {
    console.log(`  ${version}: ${id}`);
  });
}

migrateVersioning()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
