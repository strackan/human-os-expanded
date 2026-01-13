/**
 * Upload Context Files to Supabase Storage
 *
 * This script uploads all entity context files from the local filesystem
 * to Supabase Storage for runtime composition.
 *
 * Usage:
 *   npx tsx scripts/upload-contexts-to-storage.ts
 *
 * Prerequisites:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 *   - Storage bucket 'contexts' must exist (created by migration 078)
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CONTEXTS_DIR = path.join(__dirname, '..', 'contexts');
const BUCKET = 'contexts';

const CONTEXT_FILES = [
  'CHARACTER.md',
  'CORPUS_SUMMARY.md',
  'GAP_ANALYSIS.md',
];

const SHARED_FILES = [
  '_shared/NPC_GROUND_RULES.md',
];

interface UploadResult {
  path: string;
  success: boolean;
  error?: string;
}

async function uploadFile(localPath: string, storagePath: string): Promise<UploadResult> {
  try {
    const content = fs.readFileSync(localPath, 'utf-8');
    const blob = new Blob([content], { type: 'text/markdown' });

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, blob, {
        contentType: 'text/markdown',
        upsert: true,
      });

    if (error) {
      return { path: storagePath, success: false, error: error.message };
    }

    return { path: storagePath, success: true };
  } catch (err) {
    return { path: storagePath, success: false, error: String(err) };
  }
}

async function uploadEntityContext(entitySlug: string): Promise<UploadResult[]> {
  const entityDir = path.join(CONTEXTS_DIR, entitySlug);
  const results: UploadResult[] = [];

  if (!fs.existsSync(entityDir)) {
    console.warn(`  Directory not found: ${entityDir}`);
    return results;
  }

  for (const filename of CONTEXT_FILES) {
    const localPath = path.join(entityDir, filename);
    const storagePath = `${entitySlug}/${filename}`;

    if (fs.existsSync(localPath)) {
      const result = await uploadFile(localPath, storagePath);
      results.push(result);
      console.log(`  ${result.success ? '✓' : '✗'} ${storagePath}`);
    } else {
      console.log(`  - ${storagePath} (not found, skipping)`);
    }
  }

  return results;
}

async function uploadSharedFiles(): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (const relativePath of SHARED_FILES) {
    const localPath = path.join(CONTEXTS_DIR, relativePath);
    const storagePath = relativePath;

    if (fs.existsSync(localPath)) {
      const result = await uploadFile(localPath, storagePath);
      results.push(result);
      console.log(`  ${result.success ? '✓' : '✗'} ${storagePath}`);
    } else {
      console.log(`  - ${storagePath} (not found, skipping)`);
    }
  }

  return results;
}

async function main() {
  console.log('=== Uploading Context Files to Supabase Storage ===\n');
  console.log(`Bucket: ${BUCKET}`);
  console.log(`Source: ${CONTEXTS_DIR}\n`);

  // Get all entity directories
  const entries = fs.readdirSync(CONTEXTS_DIR, { withFileTypes: true });
  const entityDirs = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('_') && !e.name.startsWith('.'))
    .map(e => e.name);

  console.log(`Found entities: ${entityDirs.join(', ')}\n`);

  const allResults: UploadResult[] = [];

  // Upload shared files
  console.log('Uploading shared files:');
  const sharedResults = await uploadSharedFiles();
  allResults.push(...sharedResults);

  // Upload entity contexts
  for (const entitySlug of entityDirs) {
    console.log(`\nUploading ${entitySlug}:`);
    const results = await uploadEntityContext(entitySlug);
    allResults.push(...results);
  }

  // Summary
  const successful = allResults.filter(r => r.success).length;
  const failed = allResults.filter(r => !r.success).length;

  console.log('\n=== Summary ===');
  console.log(`Uploaded: ${successful}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed uploads:');
    allResults.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.path}: ${r.error}`);
    });
  }

  console.log('\n✓ Done');
}

main().catch(console.error);
