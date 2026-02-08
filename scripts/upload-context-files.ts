/**
 * Upload context files to Supabase Storage
 *
 * This script:
 * 1. Creates the 'contexts' bucket if it doesn't exist
 * 2. Uploads all markdown files from contexts/justin/
 * 3. Registers them in the context_files table with metadata
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'contexts';
const LOCAL_CONTEXTS_PATH = path.join(__dirname, '..', 'contexts');
const LAYER = 'founder:justin';

interface ContextFile {
  localPath: string;
  storagePath: string;
  content: string;
  contentHash: string;
}

async function ensureBucketExists(): Promise<void> {
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('Error listing buckets:', error);
    throw error;
  }

  const bucketExists = buckets.some(b => b.name === BUCKET_NAME);

  if (!bucketExists) {
    console.log(`Creating bucket: ${BUCKET_NAME}`);
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: 10485760, // 10MB
    });

    if (createError) {
      console.error('Error creating bucket:', createError);
      throw createError;
    }
    console.log(`Bucket ${BUCKET_NAME} created`);
  } else {
    console.log(`Bucket ${BUCKET_NAME} already exists`);
  }
}

function findMarkdownFiles(dir: string, baseDir: string = dir): ContextFile[] {
  const files: ContextFile[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const contentHash = crypto.createHash('sha256').update(content).digest('hex');

      files.push({
        localPath: fullPath,
        storagePath: relativePath,
        content,
        contentHash,
      });
    }
  }

  return files;
}

async function uploadFile(file: ContextFile): Promise<void> {
  const storagePath = `justin/${file.storagePath}`;

  console.log(`Uploading: ${storagePath}`);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file.content, {
      contentType: 'text/markdown',
      upsert: true,
    });

  if (uploadError) {
    console.error(`Error uploading ${storagePath}:`, uploadError);
    throw uploadError;
  }

  // Register in context_files table
  const { error: dbError } = await supabase
    .from('context_files')
    .upsert({
      layer: LAYER,
      file_path: storagePath,
      storage_bucket: BUCKET_NAME,
      content_hash: file.contentHash,
      last_synced_at: new Date().toISOString(),
    }, {
      onConflict: 'layer,file_path',
    });

  if (dbError) {
    console.error(`Error registering ${storagePath} in DB:`, dbError);
    throw dbError;
  }

  console.log(`  Registered in context_files`);
}

async function main(): Promise<void> {
  console.log('Starting context file upload...\n');

  // Ensure bucket exists
  await ensureBucketExists();

  // Find all markdown files
  const justinPath = path.join(LOCAL_CONTEXTS_PATH, 'justin');

  if (!fs.existsSync(justinPath)) {
    console.error(`Directory not found: ${justinPath}`);
    process.exit(1);
  }

  const files = findMarkdownFiles(justinPath, justinPath);
  console.log(`\nFound ${files.length} markdown files\n`);

  // Upload each file
  for (const file of files) {
    await uploadFile(file);
  }

  console.log(`\nDone! Uploaded ${files.length} files to Supabase Storage`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
