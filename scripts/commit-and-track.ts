#!/usr/bin/env tsx
/**
 * Commit and Track Script
 * Commits code AND updates database tracking simultaneously
 *
 * Usage:
 *   npm run commit -- -m "feat: add feature"              # Standard commit
 *   npm run commit -- -m "feat: complete X" --phase       # Mark phase complete
 *   npm run commit -- -m "release: 0.2" --release 0.2     # Create release
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================================
// TYPES
// ============================================================================

interface CommitMetadata {
  type: string; // feat, fix, docs, refactor, etc.
  scope?: string;
  message: string;
  body?: string;
  breaking: boolean;
  featureSlugs: string[]; // Extracted from commit message
}

interface ScriptOptions {
  message: string;
  phase?: boolean;
  release?: string;
  dryRun?: boolean;
}

// ============================================================================
// ARGUMENT PARSING
// ============================================================================

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    message: '',
    phase: false,
    release: undefined,
    dryRun: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-m' || arg === '--message') {
      options.message = args[++i];
    } else if (arg === '--phase') {
      options.phase = true;
    } else if (arg === '--release') {
      options.release = args[++i];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  }

  if (!options.message) {
    console.error('❌ Commit message required: -m "message"');
    process.exit(1);
  }

  return options;
}

// ============================================================================
// GIT OPERATIONS
// ============================================================================

function gitCommit(message: string): string {
  try {
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      stdio: 'inherit',
      encoding: 'utf-8'
    });

    // Get the commit hash
    const hash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    return hash;
  } catch (error) {
    console.error('❌ Git commit failed');
    throw error;
  }
}

function getCurrentBranch(): string {
  return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
}

function getGitStats(): { filesChanged: number; insertions: number; deletions: number } {
  const stats = execSync('git diff --cached --stat', { encoding: 'utf-8' });
  const match = stats.match(/(\d+) files? changed(?:, (\d+) insertions?)?(?:, (\d+) deletions?)?/);

  return {
    filesChanged: parseInt(match?.[1] || '0'),
    insertions: parseInt(match?.[2] || '0'),
    deletions: parseInt(match?.[3] || '0')
  };
}

// ============================================================================
// COMMIT PARSING
// ============================================================================

function parseCommitMessage(message: string): CommitMetadata {
  // Parse conventional commit format: type(scope): message
  const conventionalRegex = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;
  const match = message.match(conventionalRegex);

  let type = 'feat';
  let scope: string | undefined;
  let breaking = false;
  let commitMessage = message;

  if (match) {
    type = match[1];
    scope = match[2];
    breaking = !!match[3];
    commitMessage = match[4];
  }

  // Extract feature slugs from message (e.g., "feat: workflow-snoozing implementation")
  // Look for kebab-case words that might be feature slugs
  const slugPattern = /\b([a-z]+-[a-z-]+)\b/g;
  const slugMatches = [...message.matchAll(slugPattern)];
  const featureSlugs = slugMatches.map(m => m[1]);

  return {
    type,
    scope,
    message: commitMessage,
    breaking,
    featureSlugs
  };
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

async function logCommitToDatabase(
  commitHash: string,
  metadata: CommitMetadata,
  stats: { filesChanged: number; insertions: number; deletions: number },
  branch: string
): Promise<void> {
  // Create commits table if it doesn't exist (we'll add this to migrations)
  const { error } = await supabase.from('commits').insert({
    hash: commitHash,
    message: metadata.message,
    type: metadata.type,
    scope: metadata.scope,
    breaking: metadata.breaking,
    files_changed: stats.filesChanged,
    insertions: stats.insertions,
    deletions: stats.deletions,
    branch,
    feature_slugs: metadata.featureSlugs,
    committed_at: new Date().toISOString()
  });

  if (error && error.code !== '42P01') { // Ignore "table doesn't exist" error
    console.warn('⚠️  Could not log commit to database:', error.message);
  } else if (!error) {
    console.log('✅ Commit logged to database');
  }
}

async function getCurrentRelease(): Promise<{ id: string; version: string } | null> {
  const { data, error } = await supabase
    .from('releases')
    .select('id, version, status_id, release_statuses!inner(slug)')
    .eq('release_statuses.slug', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return { id: data.id, version: data.version };
}

async function markPhaseComplete(commitHash: string): Promise<void> {
  console.log('\n📦 Marking phase complete...');

  const currentRelease = await getCurrentRelease();
  if (!currentRelease) {
    console.error('❌ No in-progress release found');
    return;
  }

  console.log(`   Current release: ${currentRelease.version}`);

  // Get complete status ID
  const { data: completeStatus } = await supabase
    .from('release_statuses')
    .select('id')
    .eq('slug', 'complete')
    .single();

  if (!completeStatus) {
    console.error('❌ Could not find complete status');
    return;
  }

  // Update release to complete
  const { error: releaseError } = await supabase
    .from('releases')
    .update({
      status_id: completeStatus.id,
      actual_shipped: new Date().toISOString()
    })
    .eq('id', currentRelease.id);

  if (releaseError) {
    console.error('❌ Failed to update release:', releaseError.message);
    return;
  }

  // Get all features in this release with status 'underway' or 'planned'
  const { data: features } = await supabase
    .from('features')
    .select('id, slug, status_id, feature_statuses!inner(slug)')
    .eq('release_id', currentRelease.id)
    .in('feature_statuses.slug', ['underway', 'planned']);

  if (features && features.length > 0) {
    console.log(`   Updating ${features.length} features to complete...`);

    // Get complete status for features
    const { data: featureCompleteStatus } = await supabase
      .from('feature_statuses')
      .select('id')
      .eq('slug', 'complete')
      .single();

    if (featureCompleteStatus) {
      for (const feature of features) {
        await supabase
          .from('features')
          .update({
            status_id: featureCompleteStatus.id,
            shipped_at: new Date().toISOString()
          })
          .eq('id', feature.id);

        console.log(`   ✓ ${feature.slug}`);
      }
    }
  }

  console.log(`✅ Phase ${currentRelease.version} marked complete`);
}

async function createRelease(version: string, commitHash: string): Promise<void> {
  console.log(`\n🚀 Creating release ${version}...`);

  // Get planning status ID
  const { data: planningStatus } = await supabase
    .from('release_statuses')
    .select('id')
    .eq('slug', 'planning')
    .single();

  if (!planningStatus) {
    console.error('❌ Could not find planning status');
    return;
  }

  // Extract phase number from version (e.g., "0.2" -> 0, "1.0" -> 1)
  const phaseNumber = parseInt(version.split('.')[0]);

  // Create release
  const { error } = await supabase.from('releases').insert({
    version,
    name: `Release ${version}`,
    status_id: planningStatus.id,
    phase_number: phaseNumber,
    created_at: new Date().toISOString()
  });

  if (error) {
    console.error('❌ Failed to create release:', error.message);
    return;
  }

  console.log(`✅ Release ${version} created`);
  console.log('   Remember to:');
  console.log('   1. Update release name and description');
  console.log('   2. Assign features to this release');
  console.log('   3. Set planned_start and planned_end dates');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const options = parseArgs();

  console.log('\n🤖 Commit and Track\n');
  console.log(`Message: ${options.message}`);
  if (options.phase) console.log('Mode: Phase completion');
  if (options.release) console.log(`Mode: Release ${options.release}`);
  if (options.dryRun) console.log('🔍 DRY RUN - No changes will be made\n');

  // Parse commit message
  const metadata = parseCommitMessage(options.message);
  console.log(`Type: ${metadata.type}${metadata.scope ? `(${metadata.scope})` : ''}`);
  if (metadata.featureSlugs.length > 0) {
    console.log(`Features: ${metadata.featureSlugs.join(', ')}`);
  }

  // Get git stats
  const stats = getGitStats();
  console.log(`\nChanges: ${stats.filesChanged} files, +${stats.insertions}/-${stats.deletions}`);

  if (options.dryRun) {
    console.log('\n✅ Dry run complete - no changes made');
    return;
  }

  // Perform git commit
  console.log('\n📝 Committing to git...');
  const commitHash = gitCommit(options.message);
  const branch = getCurrentBranch();
  console.log(`   ${commitHash.substring(0, 8)} on ${branch}`);

  // Log to database
  await logCommitToDatabase(commitHash, metadata, stats, branch);

  // Handle phase completion
  if (options.phase) {
    await markPhaseComplete(commitHash);
  }

  // Handle release creation
  if (options.release) {
    await createRelease(options.release, commitHash);
  }

  console.log('\n✅ Done!\n');
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
