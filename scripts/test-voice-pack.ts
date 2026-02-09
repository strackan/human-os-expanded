/**
 * Test script: verify loadVoicePack works for a given slug.
 *
 * Usage: npx tsx scripts/test-voice-pack.ts [slug]
 *   Default slug: justin
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Inline the core logic from voice-pack.ts (since it uses @/ alias which tsx can't resolve)
const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---/;

function parseFrontmatter(content: string) {
  const match = content.match(FRONTMATTER_RE);
  if (!match) return { frontmatter: {} as Record<string, unknown>, body: content };
  const raw = match[1]!;
  const frontmatter: Record<string, unknown> = {};
  for (const line of raw.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value: string | unknown = line.slice(colonIdx + 1).trim();
    if (typeof value === 'string' && value.length >= 2) {
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
    }
    if (key) frontmatter[key] = value;
  }
  return { frontmatter, body: content.slice(match[0].length).trimStart() };
}

const FILENAME_ROLE_MAP: Record<string, string> = {
  '00_START_HERE.md': 'start_here',
  '01_WRITING_ENGINE.md': 'writing_engine',
  '02_THEMES.md': 'themes',
  '03_GUARDRAILS.md': 'guardrails',
  '04_STORIES.md': 'stories',
  '05_ANECDOTES.md': 'anecdotes',
  '06_OPENINGS.md': 'openings',
  '07_MIDDLES.md': 'middles',
  '08_ENDINGS.md': 'endings',
  '09_BLENDS.md': 'blends',
  '10_EXAMPLES.md': 'examples',
  'CONTEXT.md': 'context',
};

async function loadStorageFile(filePath: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage.from('human-os').download(filePath);
    if (error || !data) return null;
    return await data.text();
  } catch { return null; }
}

async function main() {
  const slug = process.argv[2] || 'justin';
  console.log(`\n=== Testing loadVoicePack for "${slug}" ===\n`);

  // 1. Load DIGEST
  const digestPath = `contexts/${slug}/DIGEST.md`;
  const digest = await loadStorageFile(digestPath);
  console.log(`DIGEST (${digestPath}): ${digest ? `${digest.length} chars` : 'NOT FOUND'}`);

  // 2. List voice directory
  const voiceDir = `contexts/${slug}/voice`;
  console.log(`\nListing ${voiceDir}...`);
  const { data: listing, error: listError } = await supabase.storage.from('human-os').list(voiceDir);

  if (listError) {
    console.error(`  ERROR listing: ${listError.message}`);
    return;
  }

  if (!listing || listing.length === 0) {
    console.log('  NO FILES FOUND in voice directory');
    return;
  }

  console.log(`  Found ${listing.length} entries:`);
  for (const f of listing.sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`    ${f.name} (${f.metadata?.size ?? '?'} bytes)`);
  }

  // 3. Download all .md files and parse frontmatter
  const mdFiles = listing.filter(f => f.name.endsWith('.md'));
  console.log(`\n  ${mdFiles.length} .md files to download\n`);

  const byRole: Record<string, string> = {};
  const supplementary: string[] = [];

  for (const f of mdFiles) {
    const filePath = `${voiceDir}/${f.name}`;
    const content = await loadStorageFile(filePath);

    if (!content) {
      console.log(`  ${f.name}: DOWNLOAD FAILED`);
      continue;
    }

    const { frontmatter } = parseFrontmatter(content);
    const fmRole = frontmatter.role as string | undefined;
    const inferredRole = FILENAME_ROLE_MAP[f.name];
    const role = fmRole ?? inferredRole;

    const status = frontmatter.status as string | undefined;
    const roleSource = fmRole ? 'frontmatter' : (inferredRole ? 'filename-infer' : 'none');

    console.log(`  ${f.name}:`);
    console.log(`    content: ${content.length} chars`);
    console.log(`    status: ${status ?? '(none)'}`);
    console.log(`    role: ${role ?? '(none)'} (via ${roleSource})`);
    console.log(`    frontmatter keys: ${Object.keys(frontmatter).join(', ') || '(none)'}`);

    if (role) {
      byRole[role] = f.name;
    } else {
      supplementary.push(f.name);
    }
  }

  // 4. Summary
  console.log('\n=== VOICE PACK SUMMARY ===');
  console.log(`  Entity slug: ${slug}`);
  console.log(`  DIGEST: ${digest ? 'YES' : 'NO'}`);
  console.log(`  Total voice files: ${mdFiles.length}`);
  console.log(`  Files by role:`);
  for (const [role, filename] of Object.entries(byRole).sort()) {
    console.log(`    ${role}: ${filename}`);
  }
  if (supplementary.length > 0) {
    console.log(`  Supplementary (no role): ${supplementary.join(', ')}`);
  }

  // 5. Check critical roles
  const criticalRoles = ['writing_engine', 'openings', 'middles', 'endings'];
  const missing = criticalRoles.filter(r => !byRole[r]);
  if (missing.length > 0) {
    console.log(`\n  WARNING: Missing critical roles: ${missing.join(', ')}`);
  } else {
    console.log(`\n  All critical roles present`);
  }

  console.log('\n=== TEST COMPLETE ===\n');
}

main().catch(console.error);
