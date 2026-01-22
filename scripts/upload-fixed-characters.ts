/**
 * Upload fixed CHARACTER.md files to Supabase Storage
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
  'https://zulowgscotdrqlccomht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bG93Z3Njb3RkcnFsY2NvbWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUwNjg2OSwiZXhwIjoyMDgxMDgyODY5fQ.1TaHY99JRt7ABGRZMMg5n_F7qwQc5H1UHkcOuUfdt8o'
);

const BUCKET = 'contexts';
const CONTEXTS_DIR = path.join(__dirname, '..', 'contexts');

const FILES_TO_UPLOAD = [
  'chris-szalaj/CHARACTER.md',
  'hippie-bill/CHARACTER.md',
  'ryan-owens/CHARACTER.md',
  'amir-feizpour/CHARACTER.md',
  'amir-feizpour/CORPUS_SUMMARY.md',
  'amir-feizpour/GAP_ANALYSIS.md',
  '_shared/NPC_GROUND_RULES.md',
];

async function uploadFile(relativePath: string): Promise<void> {
  const localPath = path.join(CONTEXTS_DIR, relativePath);
  const content = fs.readFileSync(localPath, 'utf-8');
  const blob = new Blob([content], { type: 'text/markdown' });

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(relativePath, blob, {
      contentType: 'text/markdown',
      upsert: true,
    });

  if (error) {
    console.error(`✗ ${relativePath}: ${error.message}`);
  } else {
    console.log(`✓ ${relativePath}`);
  }
}

async function main() {
  console.log('Uploading fixed CHARACTER.md files...\n');

  for (const file of FILES_TO_UPLOAD) {
    await uploadFile(file);
  }

  console.log('\nDone!');
}

main().catch(console.error);
