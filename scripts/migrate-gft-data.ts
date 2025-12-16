/**
 * GFT Data Migration Script
 *
 * Migrates data from old GuyForThat Supabase to Human OS gft schema.
 *
 * Usage:
 *   npx ts-node scripts/migrate-gft-data.ts
 *
 * Required env vars:
 *   OLD_GFT_SUPABASE_URL=https://assxvqtqjinoagwcpxpo.supabase.co
 *   OLD_GFT_SUPABASE_KEY=<service_role_key>
 *   SUPABASE_URL=https://zulowgscotdrqlccomht.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
 *   OWNER_ID=c553726a-aebe-48ac-a789-2c6a11b8dd0e
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration
const OLD_GFT_URL = process.env.OLD_GFT_SUPABASE_URL || 'https://assxvqtqjinoagwcpxpo.supabase.co';
const OLD_GFT_KEY = process.env.OLD_GFT_SUPABASE_KEY || '';
const NEW_SUPABASE_URL = process.env.SUPABASE_URL || 'https://zulowgscotdrqlccomht.supabase.co';
const NEW_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const OWNER_ID = process.env.OWNER_ID || 'c553726a-aebe-48ac-a789-2c6a11b8dd0e';

interface MigrationResult {
  table: string;
  exported: number;
  imported: number;
  errors: string[];
}

interface OldContact {
  id: string;
  name: string;
  linkedin_url: string | null;
  company: string | null;
  linkedin_company_id: string | null;
  current_job_title: string | null;
  headline: string | null;
  location: string | null;
  mutual_connections: number | null;
  followers: number | null;
  connection_degree: string | null;
  connection_status: string | null;
  connection_requested_at: string | null;
  labels: unknown;
  notes: string | null;
  source: string | null;
  extracted_at: string | null;
  created_at: string;
  updated_at: string;
  last_job_update: string | null;
  last_company_update: string | null;
}

interface OldCompany {
  id: string;
  linkedin_company_id: string | null;
  linkedin_url: string | null;
  name: string;
  website: string | null;
  company_type: string | null;
  industry: string | null;
  description: string | null;
  employee_count: number | null;
  headquarters: string | null;
  company_size: string | null;
  revenue: string | null;
  enrichment_status: string | null;
  extracted_from: string | null;
  profile_data: unknown;
  last_outreach_date: string | null;
  created_at: string;
  updated_at: string;
}

interface OldActivity {
  id: string;
  contact_id: string;
  company_id: string | null;
  activity_type: string;
  activity_date: string;
  result: string | null;
  notes: string | null;
  created_at: string;
}

interface OldPost {
  id: string;
  post_id: string;
  li_url: string;
  post_content: string | null;
  post_type: string | null;
  date_posted: string;
  created_at: string;
}

interface OldEngagement {
  id: string;
  post_id: string;
  contact_id: string;
  engagement_type: string;
  comment_text: string | null;
  engagement_date: string | null;
  created_at: string;
}

// ID mapping for foreign keys
const contactIdMap = new Map<string, string>();
const companyIdMap = new Map<string, string>();
const postIdMap = new Map<string, string>();

async function migrateCompanies(oldDb: SupabaseClient, newDb: SupabaseClient): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'companies', exported: 0, imported: 0, errors: [] };

  console.log('\n📦 Migrating companies...');

  const { data: companies, error: fetchError } = await oldDb
    .from('companies')
    .select('*')
    .order('created_at', { ascending: true });

  if (fetchError) {
    result.errors.push(`Fetch error: ${fetchError.message}`);
    return result;
  }

  result.exported = companies?.length || 0;
  console.log(`   Found ${result.exported} companies`);

  if (!companies || companies.length === 0) return result;

  for (const company of companies as OldCompany[]) {
    const newCompany = {
      owner_id: OWNER_ID,
      linkedin_company_id: company.linkedin_company_id,
      linkedin_url: company.linkedin_url,
      name: company.name,
      website: company.website,
      company_type: company.company_type,
      industry: company.industry,
      description: company.description,
      employee_count: company.employee_count,
      headquarters: company.headquarters,
      company_size: company.company_size,
      revenue: company.revenue,
      enrichment_status: company.enrichment_status || 'basic',
      extracted_from: company.extracted_from,
      profile_data: company.profile_data,
      last_outreach_date: company.last_outreach_date,
      created_at: company.created_at,
      updated_at: company.updated_at,
    };

    const { data, error } = await newDb
      .schema('gft')
      .from('companies')
      .insert(newCompany)
      .select('id')
      .single();

    if (error) {
      result.errors.push(`Company "${company.name}": ${error.message}`);
    } else {
      companyIdMap.set(company.id, data.id);
      result.imported++;
    }
  }

  console.log(`   ✓ Imported ${result.imported}/${result.exported} companies`);
  return result;
}

async function migrateContacts(oldDb: SupabaseClient, newDb: SupabaseClient): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'contacts', exported: 0, imported: 0, errors: [] };

  console.log('\n👤 Migrating contacts...');

  const { data: contacts, error: fetchError } = await oldDb
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: true });

  if (fetchError) {
    result.errors.push(`Fetch error: ${fetchError.message}`);
    return result;
  }

  result.exported = contacts?.length || 0;
  console.log(`   Found ${result.exported} contacts`);

  if (!contacts || contacts.length === 0) return result;

  for (const contact of contacts as OldContact[]) {
    // Map old company_id to new if exists
    let newCompanyId: string | null = null;
    if (contact.linkedin_company_id) {
      // Try to find by linkedin_company_id
      const { data: companyMatch } = await newDb
        .schema('gft')
        .from('companies')
        .select('id')
        .eq('linkedin_company_id', contact.linkedin_company_id)
        .single();

      if (companyMatch) newCompanyId = companyMatch.id;
    }

    const newContact = {
      owner_id: OWNER_ID,
      name: contact.name,
      linkedin_url: contact.linkedin_url,
      company: contact.company,
      company_id: newCompanyId,
      linkedin_company_id: contact.linkedin_company_id,
      current_job_title: contact.current_job_title,
      headline: contact.headline,
      location: contact.location,
      mutual_connections: contact.mutual_connections,
      followers: contact.followers,
      connection_degree: contact.connection_degree,
      connection_status: contact.connection_status || 'none',
      connection_requested_at: contact.connection_requested_at,
      last_job_update: contact.last_job_update,
      last_company_update: contact.last_company_update,
      labels: contact.labels || [],
      notes: contact.notes,
      source: contact.source || 'linkedin_chrome_extension',
      extracted_at: contact.extracted_at,
      created_at: contact.created_at,
      updated_at: contact.updated_at,
    };

    const { data, error } = await newDb
      .schema('gft')
      .from('contacts')
      .insert(newContact)
      .select('id')
      .single();

    if (error) {
      // Handle duplicate linkedin_url
      if (error.code === '23505') {
        result.errors.push(`Contact "${contact.name}": Duplicate linkedin_url`);
      } else {
        result.errors.push(`Contact "${contact.name}": ${error.message}`);
      }
    } else {
      contactIdMap.set(contact.id, data.id);
      result.imported++;
    }
  }

  console.log(`   ✓ Imported ${result.imported}/${result.exported} contacts`);
  return result;
}

async function migrateActivities(oldDb: SupabaseClient, newDb: SupabaseClient): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'activities', exported: 0, imported: 0, errors: [] };

  console.log('\n📋 Migrating activities...');

  const { data: activities, error: fetchError } = await oldDb
    .from('activities')
    .select('*')
    .order('created_at', { ascending: true });

  if (fetchError) {
    result.errors.push(`Fetch error: ${fetchError.message}`);
    return result;
  }

  result.exported = activities?.length || 0;
  console.log(`   Found ${result.exported} activities`);

  if (!activities || activities.length === 0) return result;

  for (const activity of activities as OldActivity[]) {
    const newContactId = contactIdMap.get(activity.contact_id);
    if (!newContactId) {
      result.errors.push(`Activity: Contact not found (old ID: ${activity.contact_id})`);
      continue;
    }

    const newCompanyId = activity.company_id ? companyIdMap.get(activity.company_id) : null;

    const newActivity = {
      owner_id: OWNER_ID,
      contact_id: newContactId,
      company_id: newCompanyId,
      activity_type: activity.activity_type,
      activity_date: activity.activity_date,
      result: activity.result || 'pending',
      notes: activity.notes,
      created_at: activity.created_at,
    };

    const { error } = await newDb
      .schema('gft')
      .from('activities')
      .insert(newActivity);

    if (error) {
      result.errors.push(`Activity: ${error.message}`);
    } else {
      result.imported++;
    }
  }

  console.log(`   ✓ Imported ${result.imported}/${result.exported} activities`);
  return result;
}

async function migratePosts(oldDb: SupabaseClient, newDb: SupabaseClient): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'li_posts', exported: 0, imported: 0, errors: [] };

  console.log('\n📝 Migrating LinkedIn posts...');

  const { data: posts, error: fetchError } = await oldDb
    .from('li_posts')
    .select('*')
    .order('created_at', { ascending: true });

  if (fetchError) {
    result.errors.push(`Fetch error: ${fetchError.message}`);
    return result;
  }

  result.exported = posts?.length || 0;
  console.log(`   Found ${result.exported} posts`);

  if (!posts || posts.length === 0) return result;

  for (const post of posts as OldPost[]) {
    const newPost = {
      owner_id: OWNER_ID,
      post_id: post.post_id,
      li_url: post.li_url,
      post_content: post.post_content,
      post_type: post.post_type,
      date_posted: post.date_posted,
      created_at: post.created_at,
    };

    const { data, error } = await newDb
      .schema('gft')
      .from('li_posts')
      .insert(newPost)
      .select('id')
      .single();

    if (error) {
      result.errors.push(`Post "${post.post_id}": ${error.message}`);
    } else {
      postIdMap.set(post.id, data.id);
      result.imported++;
    }
  }

  console.log(`   ✓ Imported ${result.imported}/${result.exported} posts`);
  return result;
}

async function migrateEngagements(oldDb: SupabaseClient, newDb: SupabaseClient): Promise<MigrationResult> {
  const result: MigrationResult = { table: 'li_post_engagements', exported: 0, imported: 0, errors: [] };

  console.log('\n💬 Migrating post engagements...');

  const { data: engagements, error: fetchError } = await oldDb
    .from('li_post_engagements')
    .select('*')
    .order('created_at', { ascending: true });

  if (fetchError) {
    result.errors.push(`Fetch error: ${fetchError.message}`);
    return result;
  }

  result.exported = engagements?.length || 0;
  console.log(`   Found ${result.exported} engagements`);

  if (!engagements || engagements.length === 0) return result;

  for (const engagement of engagements as OldEngagement[]) {
    const newPostId = postIdMap.get(engagement.post_id);
    const newContactId = contactIdMap.get(engagement.contact_id);

    if (!newPostId || !newContactId) {
      result.errors.push(`Engagement: Missing post or contact mapping`);
      continue;
    }

    const newEngagement = {
      post_id: newPostId,
      contact_id: newContactId,
      engagement_type: engagement.engagement_type,
      comment_text: engagement.comment_text,
      engagement_date: engagement.engagement_date,
      created_at: engagement.created_at,
    };

    const { error } = await newDb
      .schema('gft')
      .from('li_post_engagements')
      .insert(newEngagement);

    if (error) {
      // Skip duplicates silently
      if (error.code !== '23505') {
        result.errors.push(`Engagement: ${error.message}`);
      }
    } else {
      result.imported++;
    }
  }

  console.log(`   ✓ Imported ${result.imported}/${result.exported} engagements`);
  return result;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  GFT Data Migration: Old GuyForThat → Human OS gft schema');
  console.log('═══════════════════════════════════════════════════════════');

  if (!OLD_GFT_KEY) {
    console.error('\n❌ Error: OLD_GFT_SUPABASE_KEY not set');
    console.error('   Export with: export OLD_GFT_SUPABASE_KEY=your_service_role_key');
    process.exit(1);
  }

  if (!NEW_SUPABASE_KEY) {
    console.error('\n❌ Error: SUPABASE_SERVICE_ROLE_KEY not set');
    process.exit(1);
  }

  console.log(`\nSource: ${OLD_GFT_URL}`);
  console.log(`Target: ${NEW_SUPABASE_URL}`);
  console.log(`Owner:  ${OWNER_ID}`);

  const oldDb = createClient(OLD_GFT_URL, OLD_GFT_KEY);
  const newDb = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);

  const results: MigrationResult[] = [];

  // Migrate in order (companies first for FK references)
  results.push(await migrateCompanies(oldDb, newDb));
  results.push(await migrateContacts(oldDb, newDb));
  results.push(await migrateActivities(oldDb, newDb));
  results.push(await migratePosts(oldDb, newDb));
  results.push(await migrateEngagements(oldDb, newDb));

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Migration Summary');
  console.log('═══════════════════════════════════════════════════════════');

  let totalExported = 0;
  let totalImported = 0;
  let totalErrors = 0;

  for (const r of results) {
    console.log(`\n${r.table}:`);
    console.log(`   Exported: ${r.exported}`);
    console.log(`   Imported: ${r.imported}`);
    if (r.errors.length > 0) {
      console.log(`   Errors:   ${r.errors.length}`);
      r.errors.slice(0, 5).forEach(e => console.log(`     - ${e}`));
      if (r.errors.length > 5) {
        console.log(`     ... and ${r.errors.length - 5} more`);
      }
    }
    totalExported += r.exported;
    totalImported += r.imported;
    totalErrors += r.errors.length;
  }

  console.log('\n───────────────────────────────────────────────────────────');
  console.log(`Total: ${totalImported}/${totalExported} records migrated`);
  if (totalErrors > 0) {
    console.log(`Errors: ${totalErrors}`);
  }
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
