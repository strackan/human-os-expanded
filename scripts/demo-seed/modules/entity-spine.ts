/**
 * Entity spine seeder — seeds human_os.entities.
 * Runs FIRST so per-app modules can reference entity IDs.
 *
 * Schema: id, entity_type (enum: person|company|project), slug (unique),
 *         canonical_name, linkedin_url, metadata, created_at, updated_at
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { COMPANIES, CONTACTS, ENTITY_IDS, DEMO_USER_ID } from '../constants.js';

interface SeedOptions {
  dryRun: boolean;
}

export async function seedEntitySpine(supabase: SupabaseClient, opts: SeedOptions) {
  const now = new Date().toISOString();

  const entities = [
    // Company entities
    ...Object.entries(COMPANIES).map(([key, c]) => ({
      id: c.id,
      slug: c.domain.replace('.com', ''),
      entity_type: 'company',
      canonical_name: c.name,
      metadata: {
        domain: c.domain,
        industry: c.industry,
        ari_tier: c.ariTier,
        owner_id: DEMO_USER_ID,
        source_system: 'demo_seed',
        demo: true,
      },
      created_at: now,
      updated_at: now,
    })),
    // Person entities (the 5 that appear in GoodHang)
    ...Object.entries(CONTACTS)
      .filter(([, c]) => c.inGoodHang)
      .map(([key, c]) => ({
        id: ENTITY_IDS[`person_${key}` as keyof typeof ENTITY_IDS] ?? c.id,
        slug: `${c.firstName}-${c.lastName}`.toLowerCase(),
        entity_type: 'person',
        canonical_name: `${c.firstName} ${c.lastName}`,
        metadata: {
          email: c.email,
          title: c.title,
          company: COMPANIES[c.companyKey].name,
          owner_id: DEMO_USER_ID,
          source_system: 'demo_seed',
          demo: true,
        },
        created_at: now,
        updated_at: now,
      })),
  ];

  if (opts.dryRun) {
    console.log(`  [dry-run] Would upsert ${entities.length} entities into human_os.entities`);
    return { count: entities.length };
  }

  // Upsert into human_os schema
  const { error } = await supabase
    .schema('human_os')
    .from('entities')
    .upsert(entities, { onConflict: 'id' });

  if (error) {
    throw new Error(`Entity spine seed failed: ${error.message}`);
  }

  console.log(`  Upserted ${entities.length} entities into human_os.entities`);
  return { count: entities.length };
}
