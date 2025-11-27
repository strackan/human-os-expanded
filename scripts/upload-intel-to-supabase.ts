/**
 * Upload INTEL files to Supabase Storage
 *
 * This script uploads all files from the local skills/ folder to the
 * Supabase Storage 'intel' bucket.
 *
 * Usage:
 *   npx tsx scripts/upload-intel-to-supabase.ts
 *
 * Prerequisites:
 *   - Create 'intel' bucket in Supabase Storage (private)
 *   - Have SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const INTEL_BUCKET = 'intel';

// Use INTEL-specific credentials
// Set INTEL_SUPABASE_URL and INTEL_SUPABASE_SERVICE_ROLE_KEY for the target environment
const supabaseUrl = process.env.INTEL_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.INTEL_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables:');
  if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

/**
 * Get all files recursively from a directory
 */
function getAllFiles(dirPath: string, basePath: string = ''): { localPath: string; storagePath: string }[] {
  const files: { localPath: string; storagePath: string }[] = [];

  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const localPath = path.join(dirPath, item);
    const relativePath = basePath ? `${basePath}/${item}` : item;
    const stat = fs.statSync(localPath);

    if (stat.isDirectory()) {
      files.push(...getAllFiles(localPath, relativePath));
    } else if (item.endsWith('.md')) {
      files.push({
        localPath,
        storagePath: relativePath
      });
    }
  }

  return files;
}

/**
 * Upload a single file to Supabase Storage
 */
async function uploadFile(localPath: string, storagePath: string): Promise<boolean> {
  try {
    const content = fs.readFileSync(localPath, 'utf-8');
    const blob = new Blob([content], { type: 'text/markdown' });

    const { data, error } = await supabase.storage
      .from(INTEL_BUCKET)
      .upload(storagePath, blob, {
        contentType: 'text/markdown',
        upsert: true // Overwrite if exists
      });

    if (error) {
      console.error(`❌ Failed to upload ${storagePath}:`, error.message);
      return false;
    }

    console.log(`✅ Uploaded: ${storagePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error uploading ${storagePath}:`, error);
    return false;
  }
}

/**
 * Main upload function
 */
async function main() {
  console.log('🚀 Starting INTEL upload to Supabase Storage\n');
  console.log(`   Bucket: ${INTEL_BUCKET}`);
  console.log(`   Supabase URL: ${supabaseUrl}\n`);

  // Check if skills directory exists
  const skillsDir = path.join(process.cwd(), 'skills');
  if (!fs.existsSync(skillsDir)) {
    console.error(`❌ Skills directory not found: ${skillsDir}`);
    process.exit(1);
  }

  // Get all markdown files
  const files = getAllFiles(skillsDir);
  console.log(`📁 Found ${files.length} INTEL files to upload\n`);

  if (files.length === 0) {
    console.log('No files to upload.');
    return;
  }

  // Upload all files
  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    const success = await uploadFile(file.localPath, file.storagePath);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Upload Summary');
  console.log('='.repeat(50));
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📁 Total: ${files.length}`);

  if (failCount > 0) {
    console.log('\n⚠️  Some files failed to upload. Check errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All INTEL files uploaded successfully!');
  }
}

// Run
main().catch(console.error);
