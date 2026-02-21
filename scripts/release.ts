#!/usr/bin/env tsx
/**
 * Unified Release Script
 *
 * Single command to manage the full release lifecycle:
 *   npm run release -- rc              # Create or bump RC (e.g. 0.2.5-rc.0 → 0.2.5-rc.1)
 *   npm run release -- ga              # Promote current RC to GA (0.2.5-rc.1 → 0.2.5)
 *   npm run release -- new 0.2.6       # Start a new version (creates 0.2.6-rc.0)
 *   npm run release -- status          # Show current release state
 *
 * What it does:
 *   1. Updates package.json version
 *   2. Updates /api/version route constants
 *   3. Updates releases table in database (status + actual_shipped)
 *   4. Creates git commit + tag
 *   5. Pushes to remote
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ROOT = process.cwd();
const PKG_PATH = path.join(ROOT, 'package.json');
const VERSION_ROUTE = path.join(ROOT, 'src/app/api/version/route.ts');

// ============================================================================
// HELPERS
// ============================================================================

function readPkg(): { version: string; [key: string]: unknown } {
  return JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
}

function writePkg(pkg: Record<string, unknown>) {
  fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');
}

function readVersionRoute(): string {
  return fs.readFileSync(VERSION_ROUTE, 'utf8');
}

function writeVersionRoute(content: string) {
  fs.writeFileSync(VERSION_ROUTE, content);
}

function git(cmd: string): string {
  return execSync(`git ${cmd}`, { cwd: ROOT, encoding: 'utf8' }).trim();
}

/** Parse "0.2.5-rc.1" → { base: "0.2.5", tag: "rc.1", rcNum: 1 } */
function parseVersion(v: string): { base: string; tag: string; rcNum: number } {
  const match = v.match(/^(\d+\.\d+\.\d+)(?:-(.+))?$/);
  if (!match) throw new Error(`Invalid version: ${v}`);
  const base = match[1];
  const tag = match[2] || '';
  const rcMatch = tag.match(/^rc\.(\d+)$/);
  const rcNum = rcMatch ? parseInt(rcMatch[1], 10) : -1;
  return { base, tag, rcNum };
}

/** Get current version state from package.json + version route */
function getCurrentState() {
  const pkg = readPkg();
  const routeContent = readVersionRoute();

  const versionMatch = routeContent.match(/const CURRENT_VERSION = '([^']+)'/);
  const nameMatch = routeContent.match(/const CURRENT_VERSION_NAME = '([^']+)'/);
  const tagMatch = routeContent.match(/const CURRENT_VERSION_TAG = '([^']*)'/);

  return {
    pkgVersion: pkg.version as string,
    routeVersion: versionMatch?.[1] || '',
    routeName: nameMatch?.[1] || '',
    routeTag: tagMatch?.[1] || '',
  };
}

/** Update the version route constants */
function updateVersionRoute(version: string, name: string, tag: string) {
  let content = readVersionRoute();
  content = content.replace(
    /const CURRENT_VERSION = '[^']+'/,
    `const CURRENT_VERSION = '${version}'`
  );
  content = content.replace(
    /const CURRENT_VERSION_NAME = '[^']+'/,
    `const CURRENT_VERSION_NAME = '${name}'`
  );
  content = content.replace(
    /const CURRENT_VERSION_TAG = '[^']*'/,
    `const CURRENT_VERSION_TAG = '${tag}'`
  );
  writeVersionRoute(content);
}

// ============================================================================
// DB OPERATIONS
// ============================================================================

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE credentials in .env.local');
    process.exit(1);
  }
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

async function getStatusId(slug: string): Promise<string> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('release_statuses')
    .select('id')
    .eq('slug', slug)
    .single();
  if (error || !data) throw new Error(`release_status '${slug}' not found: ${error?.message}`);
  return data.id;
}

async function upsertRelease(version: string, name: string, statusSlug: string) {
  const sb = getSupabase();
  const statusId = await getStatusId(statusSlug);
  const today = new Date().toISOString().split('T')[0];

  const { error } = await sb
    .from('releases')
    .upsert(
      {
        version,
        name,
        status_id: statusId,
        actual_shipped: today,
        release_date: today,
      },
      { onConflict: 'version' }
    );

  if (error) throw new Error(`DB upsert failed: ${error.message}`);
}

async function getDbRelease(version: string) {
  const sb = getSupabase();
  const { data } = await sb
    .from('releases')
    .select('version, name, actual_shipped, release_statuses(slug)')
    .eq('version', version)
    .single();
  return data;
}

// ============================================================================
// COMMANDS
// ============================================================================

async function cmdStatus() {
  const state = getCurrentState();
  const fullVersion = state.routeTag
    ? `${state.routeVersion}-${state.routeTag}`
    : state.routeVersion;

  console.log('Current release state:');
  console.log(`  package.json:  ${state.pkgVersion}`);
  console.log(`  version route: ${fullVersion}`);
  console.log(`  name:          ${state.routeName}`);
  console.log(`  tag:           ${state.routeTag || '(none — GA)'}`);

  const dbRelease = await getDbRelease(state.routeVersion);
  if (dbRelease) {
    const dbStatus = (dbRelease.release_statuses as { slug: string } | null)?.slug || 'unknown';
    console.log(`  database:      ${dbRelease.version} (${dbStatus}) — ${dbRelease.name}`);
  } else {
    console.log(`  database:      not found`);
  }

  // Show recent tags
  const tags = git('tag -l "v0.2*" --sort=-v:refname').split('\n').slice(0, 5);
  console.log(`\n  Recent tags:`);
  tags.forEach(t => console.log(`    ${t}`));
}

async function cmdRc() {
  const state = getCurrentState();
  const parsed = parseVersion(
    state.routeTag ? `${state.routeVersion}-${state.routeTag}` : state.routeVersion
  );

  let newRcNum: number;
  if (parsed.rcNum >= 0) {
    newRcNum = parsed.rcNum + 1;
  } else {
    console.error('Current version is GA — use `npm run release -- new X.Y.Z` to start a new version.');
    process.exit(1);
  }

  const newTag = `rc.${newRcNum}`;
  const fullVersion = `${parsed.base}-${newTag}`;
  const gitTag = `v${fullVersion}`;

  console.log(`Bumping RC: ${state.routeTag} → ${newTag}`);
  console.log(`  Version:  ${fullVersion}`);
  console.log(`  Git tag:  ${gitTag}`);
  console.log(`  Name:     ${state.routeName}`);

  // 1. Update package.json
  const pkg = readPkg();
  pkg.version = parsed.base;
  writePkg(pkg);

  // 2. Update version route
  updateVersionRoute(parsed.base, state.routeName, newTag);

  // 3. Update database
  await upsertRelease(parsed.base, state.routeName, 'rc');
  console.log('  DB updated (status: rc)');

  // 4. Git commit + tag
  git('add package.json src/app/api/version/route.ts');
  git(`commit -m "release: ${gitTag} — ${state.routeName}"`);
  git(`tag -a ${gitTag} -m "${gitTag} - ${state.routeName}"`);

  // 5. Push
  git('push');
  git('push --tags');

  console.log(`\nDone! Tagged ${gitTag} and pushed.`);
}

async function cmdGa() {
  const state = getCurrentState();
  const parsed = parseVersion(
    state.routeTag ? `${state.routeVersion}-${state.routeTag}` : state.routeVersion
  );

  if (parsed.rcNum < 0) {
    console.error('Current version is already GA.');
    process.exit(1);
  }

  const gaVersion = parsed.base;
  const gitTag = `v${gaVersion}`;

  console.log(`Promoting to GA: ${parsed.base}-${parsed.tag} → ${gaVersion}`);
  console.log(`  Git tag:  ${gitTag}`);
  console.log(`  Name:     ${state.routeName}`);

  // 1. Update package.json
  const pkg = readPkg();
  pkg.version = gaVersion;
  writePkg(pkg);

  // 2. Update version route (clear RC tag)
  updateVersionRoute(gaVersion, state.routeName, '');

  // 3. Update database
  await upsertRelease(gaVersion, state.routeName, 'complete');
  console.log('  DB updated (status: complete)');

  // 4. Git commit + tag
  git('add package.json src/app/api/version/route.ts');
  git(`commit -m "release: ${gitTag} — ${state.routeName}"`);
  git(`tag -a ${gitTag} -m "${gitTag} - ${state.routeName}"`);

  // 5. Push
  git('push');
  git('push --tags');

  console.log(`\nDone! Tagged ${gitTag} as GA and pushed.`);
}

async function cmdNew(version: string) {
  // Validate version format
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    console.error(`Invalid version format: ${version} (expected X.Y.Z)`);
    process.exit(1);
  }

  const state = getCurrentState();
  if (state.routeTag) {
    console.error(`Current version ${state.routeVersion}-${state.routeTag} is still an RC.`);
    console.error('Promote to GA first with: npm run release -- ga');
    process.exit(1);
  }

  const rcTag = 'rc.0';
  const fullVersion = `${version}-${rcTag}`;
  const gitTag = `v${fullVersion}`;

  // Prompt for name
  const name = process.argv[4] || 'Untitled Release';

  console.log(`Starting new version: ${fullVersion}`);
  console.log(`  Git tag:  ${gitTag}`);
  console.log(`  Name:     ${name}`);

  // 1. Update package.json
  const pkg = readPkg();
  pkg.version = version;
  writePkg(pkg);

  // 2. Update version route
  updateVersionRoute(version, name, rcTag);

  // 3. Update database
  await upsertRelease(version, name, 'rc');
  console.log('  DB created (status: rc)');

  // 4. Git commit + tag
  git('add package.json src/app/api/version/route.ts');
  git(`commit -m "release: ${gitTag} — ${name}"`);
  git(`tag -a ${gitTag} -m "${gitTag} - ${name}"`);

  // 5. Push
  git('push');
  git('push --tags');

  console.log(`\nDone! Tagged ${gitTag} and pushed.`);
  console.log(`\nNext: Add release notes to RELEASE_NOTES.md, then run \`npm run release -- rc\` after changes.`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'status':
      await cmdStatus();
      break;
    case 'rc':
      await cmdRc();
      break;
    case 'ga':
      await cmdGa();
      break;
    case 'new':
      if (!process.argv[3]) {
        console.error('Usage: npm run release -- new <version> [name]');
        console.error('Example: npm run release -- new 0.2.6 "Human-OS Enrichment"');
        process.exit(1);
      }
      await cmdNew(process.argv[3]);
      break;
    default:
      console.log(`
Renubu Release Manager

Usage:
  npm run release -- status              Show current release state
  npm run release -- rc                  Bump RC number (rc.0 → rc.1 → rc.2)
  npm run release -- ga                  Promote current RC to GA release
  npm run release -- new 0.2.6 "Name"   Start a new version as rc.0

Lifecycle:
  new 0.2.6 → v0.2.6-rc.0 → rc → v0.2.6-rc.1 → ga → v0.2.6

Each command updates:
  - package.json version
  - /api/version route constants
  - releases table in database
  - Creates git commit + annotated tag
  - Pushes to remote
`);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
