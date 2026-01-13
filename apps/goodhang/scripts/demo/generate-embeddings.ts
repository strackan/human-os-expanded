/**
 * Demo Embedding Generator
 *
 * Generates 5 embedding types per profile for semantic search:
 * - profile: Full profile synthesis
 * - thought_leadership: LinkedIn posts + frameworks + hot takes
 * - interests: Hobbies and activities
 * - professional: Work experience and skills
 * - personality: D&D attributes + alignment narrative
 *
 * Usage:
 *   npx tsx scripts/demo/generate-embeddings.ts --all
 *   npx tsx scripts/demo/generate-embeddings.ts --type profile
 *   npx tsx scripts/demo/generate-embeddings.ts --profile-id <uuid>
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ALIGNMENT_DEFINITIONS,
  CLASS_DISPLAY_NAMES,
  RACE_DEFINITIONS,
} from '@/lib/character/types';
import type {
  CharacterAlignment,
  CharacterClass,
  CharacterRace,
} from '@/lib/types/database';

// =============================================================================
// CONFIGURATION
// =============================================================================

const EMBEDDING_MODEL = 'text-embedding-3-small'; // OpenAI
const EMBEDDING_DIMENSIONS = 1536;

// Embedding types to generate
const EMBEDDING_TYPES = [
  'profile',
  'thought_leadership',
  'interests',
  'professional',
  'personality',
] as const;

type EmbeddingType = typeof EMBEDDING_TYPES[number];

interface EmbeddingConfig {
  all: boolean;
  types: EmbeddingType[];
  profileIds: string[];
  batchSize: number;
}

const DEFAULT_CONFIG: EmbeddingConfig = {
  all: false,
  types: [],
  profileIds: [],
  batchSize: 20,
};

// =============================================================================
// PROFILE DATA TYPES
// =============================================================================

interface ProfileData {
  entityId: string;
  name: string;
  headline: string;
  company: string;
  title: string;
  location: string;
  race: CharacterRace;
  characterClass: CharacterClass;
  alignment: CharacterAlignment;
  enneagram: string | null;
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  packs: {
    professional?: { headline: string; summary: string; tags: string[] };
    interests?: { headline: string; summary: string; tags: string[] };
    social?: { headline: string; summary: string; tags: string[] };
    expertise?: { headline: string; summary: string; tags: string[] };
  };
  linkedinPosts: string[];
  frameworks: string[];
  hotTakes: string[];
}

// =============================================================================
// EMBEDDING TEXT TEMPLATES
// =============================================================================

function buildProfileText(profile: ProfileData): string {
  const parts = [
    `${profile.name} is a ${profile.title} at ${profile.company} based in ${profile.location}.`,
  ];

  if (profile.packs.professional?.summary) {
    parts.push(`Professional focus: ${profile.packs.professional.summary}`);
  }
  if (profile.packs.expertise?.tags?.length) {
    parts.push(`Key expertise: ${profile.packs.expertise.tags.join(', ')}`);
  }
  if (profile.packs.interests?.summary) {
    parts.push(`Personal interests: ${profile.packs.interests.summary}`);
  }
  if (profile.packs.social?.summary) {
    parts.push(`Social style: ${profile.packs.social.summary}`);
  }

  return parts.join('\n');
}

function buildThoughtLeadershipText(profile: ProfileData): string {
  const parts = [`Ideas and perspectives from ${profile.name}:`];

  if (profile.linkedinPosts?.length) {
    parts.push('\nRecent posts:');
    parts.push(...profile.linkedinPosts.map(p => `- ${p}`));
  }

  if (profile.frameworks?.length) {
    parts.push('\nKey frameworks:');
    parts.push(...profile.frameworks.map(f => `- ${f}`));
  }

  if (profile.hotTakes?.length) {
    parts.push('\nStrong opinions:');
    parts.push(...profile.hotTakes.map(t => `- ${t}`));
  }

  // If no content, fall back to expertise
  if (parts.length === 1 && profile.packs.expertise?.summary) {
    parts.push(profile.packs.expertise.summary);
    if (profile.packs.expertise.tags?.length) {
      parts.push(`Areas of expertise: ${profile.packs.expertise.tags.join(', ')}`);
    }
  }

  return parts.join('\n');
}

function buildInterestsText(profile: ProfileData): string {
  const parts = [`${profile.name}'s interests and hobbies:`];

  if (profile.packs.interests?.summary) {
    parts.push(profile.packs.interests.summary);
  }

  if (profile.packs.interests?.tags?.length) {
    parts.push(`Enjoys: ${profile.packs.interests.tags.join(', ')}`);
  }

  if (profile.packs.social?.summary) {
    parts.push(`Social style: ${profile.packs.social.summary}`);
  }

  return parts.join('\n');
}

function buildProfessionalText(profile: ProfileData): string {
  const parts = [
    `${profile.name} - ${profile.title} at ${profile.company}`,
    `Location: ${profile.location}`,
  ];

  if (profile.packs.professional?.summary) {
    parts.push(profile.packs.professional.summary);
  }

  if (profile.packs.professional?.tags?.length) {
    parts.push(`Skills: ${profile.packs.professional.tags.join(', ')}`);
  }

  if (profile.packs.expertise?.tags?.length) {
    parts.push(`Expertise: ${profile.packs.expertise.tags.join(', ')}`);
  }

  return parts.join('\n');
}

function buildPersonalityText(profile: ProfileData): string {
  const race = RACE_DEFINITIONS[profile.race];
  const alignment = ALIGNMENT_DEFINITIONS[profile.alignment];
  const className = CLASS_DISPLAY_NAMES[profile.characterClass];

  const parts = [
    `${profile.name}'s personality profile:`,
    `Character archetype: ${race.name} ${className} (${alignment.name})`,
    '',
    `${race.description}`,
    '',
    `Alignment approach: ${alignment.description}`,
  ];

  // Describe attributes
  const attrs = profile.attributes;
  const attrDescriptions: string[] = [];

  if (attrs.strength >= 14) attrDescriptions.push('Direct and action-oriented');
  if (attrs.dexterity >= 14) attrDescriptions.push('Adaptable and quick-thinking');
  if (attrs.constitution >= 14) attrDescriptions.push('Steady and resilient');
  if (attrs.intelligence >= 14) attrDescriptions.push('Analytical and strategic');
  if (attrs.wisdom >= 14) attrDescriptions.push('Insightful and emotionally intelligent');
  if (attrs.charisma >= 14) attrDescriptions.push('Charismatic and persuasive');

  if (attrDescriptions.length) {
    parts.push(`\nKey traits: ${attrDescriptions.join(', ')}`);
  }

  if (profile.enneagram) {
    const baseType = parseInt(profile.enneagram[0]!);
    const enneagramDescs: Record<number, string> = {
      1: 'Principled perfectionist who values integrity',
      2: 'Generous helper who builds deep relationships',
      3: 'Achievement-driven performer who gets results',
      4: 'Creative individualist with unique perspective',
      5: 'Analytical investigator who seeks understanding',
      6: 'Loyal skeptic who values security and preparation',
      7: 'Enthusiastic adventurer who embraces possibilities',
      8: 'Bold challenger who takes charge',
      9: 'Peaceful mediator who creates harmony',
    };
    parts.push(`\nEnneagram ${profile.enneagram}: ${enneagramDescs[baseType] || 'Unique personality type'}`);
  }

  return parts.join('\n');
}

// =============================================================================
// EMBEDDING GENERATOR
// =============================================================================

class EmbeddingGenerator {
  private supabase: SupabaseClient;
  private openaiKey: string;

  constructor(supabaseUrl: string, supabaseKey: string, openaiKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.openaiKey = openaiKey;
  }

  async loadProfiles(profileIds?: string[]): Promise<ProfileData[]> {
    console.log('Loading profile data...');

    // Load global entities
    let entityQuery = this.supabase
      .schema('global')
      .from('entities')
      .select('id, name, headline, current_company, current_title, location, linkedin_url');

    if (profileIds?.length) {
      entityQuery = entityQuery.in('id', profileIds);
    }

    const { data: entities, error: entityError } = await entityQuery;
    if (entityError) throw new Error(`Failed to load entities: ${entityError.message}`);

    const profiles: ProfileData[] = [];

    for (const entity of entities || []) {
      // Load identity packs
      const { data: packs } = await this.supabase
        .from('identity_packs')
        .select('pack_type, headline, summary, tags')
        .eq('entity_id', entity.id);

      // Load character data
      const { data: characters } = await this.supabase
        .from('member_characters')
        .select('race, class, alignment, enneagram_type, attr_strength, attr_dexterity, attr_constitution, attr_intelligence, attr_wisdom, attr_charisma, profile_summary, key_strengths')
        .limit(1);

      const character = characters?.[0];
      const packMap: ProfileData['packs'] = {};
      for (const pack of packs || []) {
        packMap[pack.pack_type as keyof ProfileData['packs']] = {
          headline: pack.headline,
          summary: pack.summary,
          tags: pack.tags || [],
        };
      }

      profiles.push({
        entityId: entity.id,
        name: entity.name,
        headline: entity.headline || '',
        company: entity.current_company || '',
        title: entity.current_title || '',
        location: entity.location || '',
        race: character?.race || 'human',
        characterClass: character?.class || 'sage',
        alignment: character?.alignment || 'TN',
        enneagram: character?.enneagram_type,
        attributes: {
          strength: character?.attr_strength || 10,
          dexterity: character?.attr_dexterity || 10,
          constitution: character?.attr_constitution || 10,
          intelligence: character?.attr_intelligence || 10,
          wisdom: character?.attr_wisdom || 10,
          charisma: character?.attr_charisma || 10,
        },
        packs: packMap,
        linkedinPosts: [],  // Would load from context_files if available
        frameworks: [],
        hotTakes: [],
      });
    }

    console.log(`  Loaded ${profiles.length} profiles`);
    return profiles;
  }

  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!text.trim()) return null;

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiKey}`,
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: text.slice(0, 8000), // Truncate to avoid token limits
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Embedding API failed');
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (err) {
      console.warn(`  Embedding generation failed:`, err);
      return null;
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
    if (texts.length === 0) return [];

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiKey}`,
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: texts.map(t => t.slice(0, 8000)),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Batch embedding API failed');
      }

      const data = await response.json();
      return data.data.map((d: { embedding: number[] }) => d.embedding);
    } catch (err) {
      console.warn(`  Batch embedding generation failed:`, err);
      return texts.map(() => null);
    }
  }

  buildEmbeddingText(profile: ProfileData, type: EmbeddingType): string {
    switch (type) {
      case 'profile':
        return buildProfileText(profile);
      case 'thought_leadership':
        return buildThoughtLeadershipText(profile);
      case 'interests':
        return buildInterestsText(profile);
      case 'professional':
        return buildProfessionalText(profile);
      case 'personality':
        return buildPersonalityText(profile);
      default:
        return buildProfileText(profile);
    }
  }

  async generateAllEmbeddings(
    profiles: ProfileData[],
    types: EmbeddingType[],
    batchSize: number
  ): Promise<void> {
    console.log(`\nGenerating embeddings for ${profiles.length} profiles...`);
    console.log(`Types: ${types.join(', ')}`);

    for (const type of types) {
      console.log(`\n--- Generating ${type} embeddings ---`);

      for (let i = 0; i < profiles.length; i += batchSize) {
        const batch = profiles.slice(i, i + batchSize);
        const texts = batch.map(p => this.buildEmbeddingText(p, type));

        // Generate embeddings in batch
        const embeddings = await this.generateBatchEmbeddings(texts);

        // Save to database
        for (let j = 0; j < batch.length; j++) {
          const profile = batch[j]!;
          const embedding = embeddings[j];

          if (embedding) {
            await this.saveEmbedding(profile.entityId, type, embedding, texts[j]!);
          }
        }

        console.log(`  ${type}: ${Math.min(i + batchSize, profiles.length)}/${profiles.length}`);

        // Rate limiting
        await this.sleep(100);
      }
    }
  }

  async saveEmbedding(
    entityId: string,
    type: EmbeddingType,
    embedding: number[],
    sourceText: string
  ): Promise<void> {
    // Note: Need to extend global.entity_embeddings CHECK constraint if new types
    // For now, map to existing types or use profile as fallback
    const dbType = this.mapEmbeddingType(type);

    const { error } = await this.supabase
      .schema('global')
      .from('entity_embeddings')
      .upsert({
        entity_id: entityId,
        embedding_type: dbType,
        embedding: `[${embedding.join(',')}]`, // pgvector format
        source_text: sourceText.slice(0, 5000), // Truncate source text
        generated_at: new Date().toISOString(),
      }, { onConflict: 'entity_id,embedding_type' });

    if (error) {
      console.warn(`  Failed to save embedding for ${entityId}/${type}:`, error.message);
    }
  }

  private mapEmbeddingType(type: EmbeddingType): string {
    // Map our expanded types to database constraint
    // If the constraint doesn't include our types, we'd need a migration
    const typeMap: Record<EmbeddingType, string> = {
      profile: 'profile',
      thought_leadership: 'conversation', // Map to existing type
      interests: 'interests',
      professional: 'skills', // Map to existing type
      personality: 'profile', // Fallback - would need migration for full support
    };
    return typeMap[type];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// MIGRATION HELPER
// =============================================================================

async function extendEmbeddingTypes(supabaseUrl: string, supabaseKey: string): Promise<void> {
  console.log('\n--- Extending embedding types in database ---');
  console.log('Note: Run this SQL to add support for new embedding types:');
  console.log(`
ALTER TABLE global.entity_embeddings
DROP CONSTRAINT IF EXISTS entity_embeddings_embedding_type_check;

ALTER TABLE global.entity_embeddings
ADD CONSTRAINT entity_embeddings_embedding_type_check
CHECK (embedding_type IN (
  'profile',
  'interests',
  'skills',
  'conversation',
  'thought_leadership',
  'professional',
  'personality'
));
  `);
}

// =============================================================================
// CLI RUNNER
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const config: EmbeddingConfig = { ...DEFAULT_CONFIG };

  // Parse CLI args
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--all') {
      config.all = true;
      config.types = [...EMBEDDING_TYPES];
    } else if (args[i] === '--type' && args[i + 1]) {
      const type = args[i + 1] as EmbeddingType;
      if (EMBEDDING_TYPES.includes(type)) {
        config.types.push(type);
      }
      i++;
    } else if (args[i] === '--profile-id' && args[i + 1]) {
      config.profileIds.push(args[i + 1]!);
      i++;
    } else if (args[i] === '--batch-size' && args[i + 1]) {
      config.batchSize = parseInt(args[i + 1]!, 10);
      i++;
    } else if (args[i] === '--extend-types') {
      await extendEmbeddingTypes(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      return;
    }
  }

  // Default to all types if none specified
  if (config.types.length === 0) {
    config.types = [...EMBEDDING_TYPES];
  }

  // Check environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  if (!openaiKey) {
    console.error('Missing OPENAI_API_KEY - required for embedding generation');
    process.exit(1);
  }

  console.log(`\n=== Good Hang Demo Embedding Generator ===`);
  console.log(`Config: types=${config.types.join(',')}, batch=${config.batchSize}`);
  if (config.profileIds.length) {
    console.log(`Profile IDs: ${config.profileIds.join(', ')}`);
  }
  console.log('');

  const generator = new EmbeddingGenerator(supabaseUrl, supabaseKey, openaiKey);

  // Load profiles
  const profiles = await generator.loadProfiles(
    config.profileIds.length ? config.profileIds : undefined
  );

  if (profiles.length === 0) {
    console.error('No profiles found. Run generate-profiles.ts first.');
    process.exit(1);
  }

  // Generate embeddings
  await generator.generateAllEmbeddings(profiles, config.types, config.batchSize);

  console.log('\n=== Embedding Generation Complete ===');
  console.log(`Generated ${profiles.length * config.types.length} embeddings`);
}

main().catch(console.error);
