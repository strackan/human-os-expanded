#!/usr/bin/env npx tsx
/**
 * Update releases table with new version structure
 * Run: npx tsx scripts/update-release-versions.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateReleases() {
  console.log('🚀 Starting release version update...\n');

  // Step 1: Set all features to 'backlog' to bypass release_id constraint
  console.log('📋 Temporarily setting features to backlog status...');
  const { error: backlogError } = await supabase
    .from('features')
    .update({ status: 'backlog' })
    .in('status', ['planned', 'underway', 'complete']);

  if (backlogError) {
    console.error('❌ Error updating feature status:', backlogError);
    process.exit(1);
  }
  console.log('✅ Features set to backlog\n');

  // Step 2: Clear release_id from features
  console.log('🔗 Clearing feature associations...');
  const { error: clearError } = await supabase
    .from('features')
    .update({ release_id: null })
    .not('release_id', 'is', null);

  if (clearError) {
    console.error('❌ Error clearing feature associations:', clearError);
    process.exit(1);
  }
  console.log('✅ Feature associations cleared\n');

  // Step 3: Delete existing releases
  console.log('🗑️  Deleting existing releases...');
  const { error: deleteError } = await supabase
    .from('releases')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteError) {
    console.error('❌ Error deleting releases:', deleteError);
    process.exit(1);
  }
  console.log('✅ Existing releases deleted\n');

  // Step 4: Define new release structure
  const releases = [
    {
      version: '0.0.1',
      name: 'Genesis',
      description: 'Initial application with Renewals HQ dashboard, timeline toggle, and customer list',
      release_date: '2025-04-29',
      status: 'complete',
      phase: '0.0.x - Early Development'
    },
    {
      version: '0.0.2',
      name: 'Dashboard Core',
      description: 'Enhanced dashboard iterations with snooze functionality, actions dropdown, resizable columns, and contracts page',
      release_date: '2025-05-03',
      status: 'complete',
      phase: '0.0.x - Early Development'
    },
    {
      version: '0.0.3',
      name: 'Workflow Experiments',
      description: 'Planning Workflow Alpha, customer page modularization, AI workflow scaffolding',
      release_date: '2025-05-24',
      status: 'complete',
      phase: '0.0.x - Early Development'
    },
    {
      version: '0.0.4',
      name: 'Authentication Battle',
      description: 'Supabase integration, Google OAuth, event handling system, database conversation handles',
      release_date: '2025-07-28',
      status: 'complete',
      phase: '0.0.x - Early Development'
    },
    {
      version: '0.0.5',
      name: 'Backend Breakthrough',
      description: 'Supabase Cloud migration, Customers page, Customer 360 view, ActivePieces integration, Demo mode. 83 new API routes',
      release_date: '2025-08-27',
      status: 'complete',
      phase: '0.0.x - Early Development'
    },
    {
      version: '0.0.6',
      name: 'Artifact Engine',
      description: '100+ artifact components, configuration-driven workflows, template groups, dynamic artifact loading, progress tracker',
      release_date: '2025-09-28',
      status: 'complete',
      phase: '0.0.x - Early Development'
    },
    {
      version: '0.0.7',
      name: 'Orchestrator Birth',
      description: 'Step-based workflow system, workflow registry, WorkflowEngine component, database-driven launches, 7-day snooze enforcement',
      release_date: '2025-10-27',
      status: 'complete',
      phase: '0.0.x - Early Development'
    },
    {
      version: '0.0.8',
      name: 'Labs Launch',
      description: 'Renubu Labs multi-domain proof of concept, Weekly Planner workflow, email orchestration prototype',
      release_date: '2025-10-31',
      status: 'complete',
      phase: '0.0.x - Early Development'
    },
    {
      version: '0.0.9',
      name: 'Pre-Production Polish',
      description: 'Code consolidation, architecture documentation, build configuration optimization',
      release_date: '2025-11-06',
      status: 'complete',
      phase: '0.0.x - Early Development'
    },
    {
      version: '0.1.0',
      name: 'Zen Dashboard',
      description: 'Zen dashboard modernization, chat integration UI, living documentation system, GitHub Projects integration, production build system',
      release_date: '2025-11-06',
      status: 'complete',
      phase: '0.1.x - Foundation'
    },
    {
      version: '0.1.1',
      name: 'Multi-Tenancy',
      description: 'Workspace authentication with company_id isolation, workspace invitation system, multi-domain workflow support',
      release_date: '2025-11-08',
      status: 'complete',
      phase: '0.1.x - Foundation'
    },
    {
      version: '0.1.2',
      name: 'MCP Foundation',
      description: 'MCP Registry infrastructure, OAuth integrations (Google Calendar, Gmail, Slack), email orchestration, feature tracking',
      release_date: '2025-11-12',
      status: 'complete',
      phase: '0.1.x - Foundation'
    },
    {
      version: '0.1.3',
      name: 'Parking Lot System',
      description: 'AI-powered workflow event detection, Parking Lot dashboard, LLM analysis with Claude Sonnet 4.5, workflow health scoring',
      release_date: '2025-11-15',
      status: 'complete',
      phase: '0.1.x - Foundation'
    },
    {
      version: '0.1.4',
      name: 'Skip & Review Systems',
      description: 'Skip trigger system with 4 trigger conventions, Review trigger system for approval workflows, enhanced flow control modals',
      release_date: '2025-11-15',
      status: 'complete',
      phase: '0.1.x - Foundation'
    },
    {
      version: '0.1.5',
      name: 'String-Tie & Optimization',
      description: 'String-Tie natural language reminders with Claude AI, voice dictation, feature flag infrastructure, code optimization',
      release_date: '2025-11-16',
      status: 'complete',
      phase: '0.1.x - Foundation'
    },
    {
      version: '0.1.6',
      name: 'Workflow Templates',
      description: 'Database-driven workflow template system, scope-based inheritance, workflow compilation service, InHerSight integration',
      release_date: '2025-11-17',
      status: 'testing',
      phase: '0.1.x - Foundation'
    },
    {
      version: '0.2.0',
      name: 'Production Launch',
      description: 'Human OS Check-In System with pattern recognition, personalized workflow suggestions, adaptive reminders, success tracking',
      target_date: '2026-01-01',
      status: 'planning',
      phase: '0.2.x - Production'
    },
    {
      version: '0.3.0',
      name: 'TBD',
      description: 'Details to be announced',
      target_date: '2026-06-30',
      status: 'planning',
      phase: '0.3.x - Growth'
    }
  ];

  // Step 5: Insert new releases and track IDs
  console.log('📦 Creating new releases...\n');
  const releaseMap: Record<string, string> = {};

  for (const release of releases) {
    const { data, error } = await supabase
      .from('releases')
      .insert({
        ...release,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, version')
      .single();

    if (error) {
      console.error(`❌ Error creating ${release.version}:`, error);
    } else {
      console.log(`✅ ${release.version} - ${release.name}`);
      releaseMap[release.version] = data.id;
    }
  }

  console.log('\n🎉 Release version update complete!');
  console.log('\n📝 Release IDs:');
  Object.entries(releaseMap).forEach(([version, id]) => {
    console.log(`  ${version}: ${id}`);
  });

  console.log('\n⚠️  Note: All features are currently set to "backlog" status');
  console.log('Next steps:');
  console.log('1. Manually reassign features to appropriate releases');
  console.log('2. Update feature statuses back to planned/underway/complete');
  console.log('3. Run: npm run roadmap');

  return releaseMap;
}

updateReleases()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
