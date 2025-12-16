/**
 * Link GFT Contacts to Public Entities
 *
 * Creates entity records in public.entities for each gft.contact
 * and links them via entity_id.
 *
 * Usage:
 *   npx ts-node scripts/link-gft-entities.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zulowgscotdrqlccomht.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const OWNER_ID = process.env.OWNER_ID || 'c553726a-aebe-48ac-a789-2c6a11b8dd0e';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Linking GFT Contacts to Public Entities');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (!SUPABASE_KEY) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY not set');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Get all contacts without entity_id
  const { data: contacts, error: fetchError } = await supabase
    .schema('gft')
    .from('contacts')
    .select('id, name, linkedin_url, company, current_job_title, headline, location, owner_id')
    .is('entity_id', null);

  if (fetchError) {
    console.error('Error fetching contacts:', fetchError.message);
    process.exit(1);
  }

  console.log(`Found ${contacts?.length || 0} contacts without entity_id\n`);

  if (!contacts || contacts.length === 0) {
    console.log('All contacts already linked!');
    return;
  }

  let linked = 0;
  let errors = 0;

  for (const contact of contacts) {
    const slug = slugify(contact.name);

    // Check if entity already exists
    const { data: existing } = await supabase
      .from('entities')
      .select('id')
      .eq('slug', slug)
      .single();

    let entityId: string;

    if (existing) {
      // Use existing entity
      entityId = existing.id;
      console.log(`  [EXISTS] ${contact.name} → ${slug}`);
    } else {
      // Create new entity
      const metadata: Record<string, unknown> = {
        name: contact.name,
        type: 'person',
        source: 'gft',
      };

      if (contact.linkedin_url) metadata.linkedin_url = contact.linkedin_url;
      if (contact.company) metadata.company = contact.company;
      if (contact.current_job_title) metadata.title = contact.current_job_title;
      if (contact.headline) metadata.headline = contact.headline;
      if (contact.location) metadata.location = contact.location;

      const { data: newEntity, error: createError } = await supabase
        .from('entities')
        .insert({
          slug,
          entity_type: 'person',
          name: contact.name,
          metadata,
          owner_id: contact.owner_id,
          privacy_scope: 'private',
          source_system: 'guyforthat',
          source_id: contact.id,
        })
        .select('id')
        .single();

      if (createError) {
        // Try with unique slug
        const uniqueSlug = `${slug}-${contact.id.slice(0, 8)}`;
        const { data: retryEntity, error: retryError } = await supabase
          .from('entities')
          .insert({
            slug: uniqueSlug,
            entity_type: 'person',
            name: contact.name,
            metadata,
            owner_id: contact.owner_id,
            privacy_scope: 'private',
            source_system: 'guyforthat',
            source_id: contact.id,
          })
          .select('id')
          .single();

        if (retryError) {
          console.log(`  [ERROR] ${contact.name}: ${retryError.message}`);
          errors++;
          continue;
        }
        entityId = retryEntity.id;
        console.log(`  [CREATE] ${contact.name} → ${uniqueSlug}`);
      } else {
        entityId = newEntity.id;
        console.log(`  [CREATE] ${contact.name} → ${slug}`);
      }
    }

    // Link contact to entity
    const { error: linkError } = await supabase
      .schema('gft')
      .from('contacts')
      .update({ entity_id: entityId })
      .eq('id', contact.id);

    if (linkError) {
      console.log(`  [LINK ERROR] ${contact.name}: ${linkError.message}`);
      errors++;
    } else {
      linked++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  Linked: ${linked}/${contacts.length} contacts`);
  if (errors > 0) console.log(`  Errors: ${errors}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Now do the same for companies
  console.log('Linking companies...\n');

  const { data: companies, error: companyFetchError } = await supabase
    .schema('gft')
    .from('companies')
    .select('id, name, linkedin_url, industry, headquarters, owner_id')
    .is('entity_id', null);

  if (companyFetchError) {
    console.error('Error fetching companies:', companyFetchError.message);
    return;
  }

  console.log(`Found ${companies?.length || 0} companies without entity_id\n`);

  let companyLinked = 0;
  let companyErrors = 0;

  for (const company of companies || []) {
    const slug = slugify(company.name);

    const { data: existing } = await supabase
      .from('entities')
      .select('id')
      .eq('slug', slug)
      .eq('entity_type', 'company')
      .single();

    let entityId: string;

    if (existing) {
      entityId = existing.id;
      console.log(`  [EXISTS] ${company.name} → ${slug}`);
    } else {
      const metadata: Record<string, unknown> = {
        name: company.name,
        type: 'company',
        source: 'gft',
      };

      if (company.linkedin_url) metadata.linkedin_url = company.linkedin_url;
      if (company.industry) metadata.industry = company.industry;
      if (company.headquarters) metadata.headquarters = company.headquarters;

      const { data: newEntity, error: createError } = await supabase
        .from('entities')
        .insert({
          slug,
          entity_type: 'company',
          name: company.name,
          metadata,
          owner_id: company.owner_id,
          privacy_scope: 'private',
          source_system: 'guyforthat',
          source_id: company.id,
        })
        .select('id')
        .single();

      if (createError) {
        const uniqueSlug = `${slug}-company-${company.id.slice(0, 8)}`;
        const { data: retryEntity, error: retryError } = await supabase
          .from('entities')
          .insert({
            slug: uniqueSlug,
            entity_type: 'company',
            name: company.name,
            metadata,
            owner_id: company.owner_id,
            privacy_scope: 'private',
            source_system: 'guyforthat',
            source_id: company.id,
          })
          .select('id')
          .single();

        if (retryError) {
          console.log(`  [ERROR] ${company.name}: ${retryError.message}`);
          companyErrors++;
          continue;
        }
        entityId = retryEntity.id;
        console.log(`  [CREATE] ${company.name} → ${uniqueSlug}`);
      } else {
        entityId = newEntity.id;
        console.log(`  [CREATE] ${company.name} → ${slug}`);
      }
    }

    const { error: linkError } = await supabase
      .schema('gft')
      .from('companies')
      .update({ entity_id: entityId })
      .eq('id', company.id);

    if (linkError) {
      console.log(`  [LINK ERROR] ${company.name}: ${linkError.message}`);
      companyErrors++;
    } else {
      companyLinked++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  Companies Linked: ${companyLinked}/${companies?.length || 0}`);
  if (companyErrors > 0) console.log(`  Errors: ${companyErrors}`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
