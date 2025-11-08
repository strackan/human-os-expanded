#!/usr/bin/env tsx
/**
 * Release Documentation Snapshot
 * Creates historical snapshot of all living docs at release boundary
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DOCS_DIR = path.join(process.cwd(), 'docs');
const LIVING_DOCS = [
  'ARTIFACTS.md',
  'WORKFLOWS.md',
  'ARCHITECTURE.md',
  'SCHEMA.md',
  'API.md',
  'MCP.md',
  'LLM.md',
  'DEV-GUIDE.md',
  'DEPLOYMENT.md',
  'ONBOARDING.md',
  'CUSTOMERS.md'
];

async function createSnapshot(version: string, releaseDate: string) {
  console.log(`\n📸 Creating snapshot for release ${version}\n`);

  const slugs: string[] = [];
  const docInserts: any[] = [];

  // Read and prepare all living docs
  for (const filename of LIVING_DOCS) {
    const filepath = path.join(DOCS_DIR, filename);

    if (!fs.existsSync(filepath)) {
      console.warn(`⚠️  Skipping ${filename} - file not found`);
      continue;
    }

    const content = fs.readFileSync(filepath, 'utf-8');
    const slug = filename.replace('.md', '').toLowerCase();

    // Extract title from first # heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : filename.replace('.md', '');

    // Determine category from content
    let category = 'technical';
    if (filename.includes('CUSTOMER') || filename.includes('ONBOARDING')) {
      category = 'customer_success';
    } else if (filename.includes('DEPLOYMENT')) {
      category = 'operations';
    }

    slugs.push(slug);
    docInserts.push({
      slug,
      title,
      content,
      category,
      audience: ['internal'],
      publish_status: 'published',
      version,
      release_date: releaseDate
    });

    console.log(`✓ Prepared ${filename} (${content.length} chars)`);
  }

  console.log(`\n💾 Inserting ${docInserts.length} documents to database...\n`);

  // Insert/upsert all documents
  for (const doc of docInserts) {
    const { data, error } = await supabase
      .from('documentation')
      .upsert(doc, { onConflict: 'slug' })
      .select('id, slug');

    if (error) {
      console.error(`❌ Failed to insert ${doc.slug}:`, error.message);
    } else {
      console.log(`✓ Inserted ${doc.slug}`);
    }
  }

  console.log(`\n📦 Creating release snapshot...\n`);

  // Call create_release_snapshot function
  const { data, error } = await supabase.rpc('create_release_snapshot', {
    p_version: version,
    p_release_date: releaseDate,
    p_doc_slugs: slugs
  });

  if (error) {
    console.error('❌ Failed to create snapshot:', error.message);
    process.exit(1);
  }

  console.log(`✅ Snapshot created for release ${version}`);
  console.log(`   Snapshot ID: ${data}`);
  console.log(`   Documents: ${slugs.length}`);
  console.log(`   Date: ${releaseDate}\n`);
}

// Run snapshot for Phase 0.1
const version = process.argv[2] || '0.1';
const releaseDate = process.argv[3] || new Date().toISOString().split('T')[0];

createSnapshot(version, releaseDate).catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
