#!/usr/bin/env npx tsx

/**
 * Add completed releases 0.1.6, 0.1.7, 0.1.8 to database
 *
 * Run with: npx tsx scripts/add-completed-releases.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('📦 Adding completed releases to database...\n');

  // Get status IDs
  const { data: releaseStatuses } = await supabase.from('release_statuses').select('*');
  const shippedStatus = releaseStatuses?.find(s => s.slug === 'complete');

  const { data: featureStatuses } = await supabase.from('feature_statuses').select('*');
  const featureShippedStatus = featureStatuses?.find(s => s.slug === 'complete');

  if (!shippedStatus || !featureShippedStatus) {
    console.error('❌ Could not find required statuses');
    return;
  }

  // Release 0.1.6 - Parking Lot System
  console.log('Adding Release 0.1.6 - Parking Lot System...');
  const { data: r016, error: e016 } = await supabase
    .from('releases')
    .upsert({
      version: '0.1.6',
      name: 'Parking Lot System',
      description: 'Event detection and workflow health monitoring for proactive management',
      status_id: shippedStatus.id,
      phase_number: 1,
      planned_start: '2025-11-01',
      planned_end: '2025-11-13',
      actual_shipped: new Date('2025-11-13').toISOString()
    }, { onConflict: 'version' })
    .select()
    .single();

  if (e016) {
    console.error('❌ Error creating release 0.1.6:', e016.message);
  } else {
    console.log(`✅ Release 0.1.6 created (ID: ${r016.id})`);

    // Features for 0.1.6
    const features016 = [
      { slug: 'parking-lot-event-detection', title: 'Parking Lot Event Detection', effort_hrs: 32 },
      { slug: 'workflow-health-scoring', title: 'Workflow Health Scoring', effort_hrs: 24 },
      { slug: 'parking-lot-ui-dashboard', title: 'Parking Lot UI Dashboard', effort_hrs: 24 }
    ];

    for (const f of features016) {
      const { error } = await supabase.from('features').upsert({
        slug: f.slug,
        title: f.title,
        status_id: featureShippedStatus.id,
        release_id: r016.id,
        effort_hrs: f.effort_hrs,
        priority: 1
      }, { onConflict: 'slug' });

      if (error) {
        console.error(`  ❌ Error creating feature "${f.title}":`, error.message);
      } else {
        console.log(`  ✅ Feature: ${f.title}`);
      }
    }
  }

  console.log('');

  // Release 0.1.7 - Skip/Review Triggers
  console.log('Adding Release 0.1.7 - Skip/Review Triggers...');
  const { data: r017, error: e017 } = await supabase
    .from('releases')
    .upsert({
      version: '0.1.7',
      name: 'Skip and Review Triggers',
      description: 'Intelligent workflow skip and review trigger systems with automated evaluation',
      status_id: shippedStatus.id,
      phase_number: 1,
      planned_start: '2025-11-01',
      planned_end: '2025-11-13',
      actual_shipped: new Date('2025-11-13').toISOString()
    }, { onConflict: 'version' })
    .select()
    .single();

  if (e017) {
    console.error('❌ Error creating release 0.1.7:', e017.message);
  } else {
    console.log(`✅ Release 0.1.7 created (ID: ${r017.id})`);

    // Features for 0.1.7
    const features017 = [
      { slug: 'skip-trigger-system', title: 'Skip Trigger System', effort_hrs: 24 },
      { slug: 'review-trigger-system', title: 'Review Trigger System', effort_hrs: 24 },
      { slug: 'enhanced-flow-control-modals', title: 'Enhanced Flow Control Modals', effort_hrs: 12 }
    ];

    for (const f of features017) {
      const { error } = await supabase.from('features').upsert({
        slug: f.slug,
        title: f.title,
        status_id: featureShippedStatus.id,
        release_id: r017.id,
        effort_hrs: f.effort_hrs,
        priority: 1
      }, { onConflict: 'slug' });

      if (error) {
        console.error(`  ❌ Error creating feature "${f.title}":`, error.message);
      } else {
        console.log(`  ✅ Feature: ${f.title}`);
      }
    }
  }

  console.log('');

  // Release 0.1.8 - String-Tie Reminders
  console.log('Adding Release 0.1.8 - String-Tie Reminders...');
  const { data: r018, error: e018 } = await supabase
    .from('releases')
    .upsert({
      version: '0.1.8',
      name: 'String-Tie Reminders',
      description: 'Natural language reminder parsing with voice input and business day awareness',
      status_id: shippedStatus.id,
      phase_number: 1,
      planned_start: '2025-11-12',
      planned_end: '2025-11-15',
      actual_shipped: new Date('2025-11-15').toISOString()
    }, { onConflict: 'version' })
    .select()
    .single();

  if (e018) {
    console.error('❌ Error creating release 0.1.8:', e018.message);
  } else {
    console.log(`✅ Release 0.1.8 created (ID: ${r018.id})`);

    // Features for 0.1.8
    const features018 = [
      { slug: 'string-tie-llm-parser', title: 'String-Tie LLM Parser', effort_hrs: 20 },
      { slug: 'voice-dictation-support', title: 'Voice Dictation Support', effort_hrs: 12 },
      { slug: 'quick-capture-popover', title: 'Quick Capture Popover', effort_hrs: 8 },
      { slug: 'business-day-intelligence', title: 'Business Day Intelligence', effort_hrs: 5 }
    ];

    for (const f of features018) {
      const { error } = await supabase.from('features').upsert({
        slug: f.slug,
        title: f.title,
        status_id: featureShippedStatus.id,
        release_id: r018.id,
        effort_hrs: f.effort_hrs,
        priority: 1
      }, { onConflict: 'slug' });

      if (error) {
        console.error(`  ❌ Error creating feature "${f.title}":`, error.message);
      } else {
        console.log(`  ✅ Feature: ${f.title}`);
      }
    }
  }

  console.log('\n✨ All releases and features added!');
  console.log('\n💡 Run "npm run roadmap" to regenerate ROADMAP.md');
}

main().catch(console.error);
