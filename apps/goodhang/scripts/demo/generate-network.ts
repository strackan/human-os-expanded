/**
 * Demo Network Generator
 *
 * Generates network connections (entity_links) between profiles.
 * Creates realistic clustering with varying density.
 *
 * Usage:
 *   npx tsx scripts/demo/generate-network.ts --seed 42
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// CONFIGURATION
// =============================================================================

interface NetworkConfig {
  seed: number;
  clearExisting: boolean;
}

const DEFAULT_CONFIG: NetworkConfig = {
  seed: 42,
  clearExisting: false,
};

// Cluster definitions (must match generate-profiles.ts)
const CLUSTERS = [
  { name: 'YC Mafia', tag: 'yc', density: 0.6 },
  { name: 'Ex-Stripe', tag: 'stripe', density: 0.5 },
  { name: 'NYC Tech', tag: 'nyc', density: 0.4 },
  { name: 'AI/ML Community', tag: 'ai', density: 0.5 },
  { name: 'Good Hang OGs', tag: 'og', density: 0.8 },
  { name: 'Climate Tech', tag: 'climate', density: 0.4 },
  { name: 'Indie Hackers', tag: 'indie', density: 0.3 },
  { name: 'Random', tag: 'random', density: 0.1 },
];

// Connection types for variety
const CONNECTION_TYPES = [
  { type: 'knows', weight: 0.4 },
  { type: 'worked_with', weight: 0.25 },
  { type: 'met_at_event', weight: 0.15 },
  { type: 'introduced_by', weight: 0.1 },
  { type: 'collaborated_on', weight: 0.1 },
];

// =============================================================================
// SEEDED RANDOM
// =============================================================================

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)]!;
  }

  weightedPick<T extends { weight: number }>(items: T[]): T {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let random = this.next() * total;
    for (const item of items) {
      random -= item.weight;
      if (random <= 0) return item;
    }
    return items[items.length - 1]!;
  }
}

// =============================================================================
// PROFILE DATA
// =============================================================================

interface ProfileWithCluster {
  id: string;
  slug: string;
  name: string;
  clusterTags: string[];
  globalEntityId: string;
}

// =============================================================================
// NETWORK GENERATOR
// =============================================================================

class NetworkGenerator {
  private rng: SeededRandom;
  private supabase: SupabaseClient;

  constructor(seed: number, supabaseUrl: string, supabaseKey: string) {
    this.rng = new SeededRandom(seed);
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async loadProfiles(): Promise<ProfileWithCluster[]> {
    console.log('Loading profiles from database...');

    // Load GFT contacts with their cluster labels
    const { data: contacts, error } = await this.supabase
      .schema('gft')
      .from('contacts')
      .select('id, name, linkedin_url, labels, global_entity_id')
      .not('global_entity_id', 'is', null);

    if (error) {
      throw new Error(`Failed to load contacts: ${error.message}`);
    }

    const profiles = (contacts || []).map(c => ({
      id: c.id,
      slug: c.linkedin_url?.split('/in/')[1] || c.id,
      name: c.name,
      clusterTags: c.labels || [],
      globalEntityId: c.global_entity_id,
    }));

    console.log(`  Loaded ${profiles.length} profiles`);
    return profiles;
  }

  groupByCluster(profiles: ProfileWithCluster[]): Map<string, ProfileWithCluster[]> {
    const clusters = new Map<string, ProfileWithCluster[]>();

    for (const cluster of CLUSTERS) {
      clusters.set(cluster.tag, []);
    }

    for (const profile of profiles) {
      for (const tag of profile.clusterTags) {
        const existing = clusters.get(tag) || [];
        existing.push(profile);
        clusters.set(tag, existing);
      }
    }

    return clusters;
  }

  generateConnections(profiles: ProfileWithCluster[]): Array<{
    sourceId: string;
    targetId: string;
    linkType: string;
    strength: number;
    context: string;
  }> {
    const connections: Array<{
      sourceId: string;
      targetId: string;
      linkType: string;
      strength: number;
      context: string;
    }> = [];

    const clusters = this.groupByCluster(profiles);
    const existingPairs = new Set<string>();

    // Generate intra-cluster connections
    console.log('\nGenerating intra-cluster connections...');
    for (const clusterConfig of CLUSTERS) {
      const clusterMembers = clusters.get(clusterConfig.tag) || [];
      if (clusterMembers.length < 2) continue;

      console.log(`  ${clusterConfig.name}: ${clusterMembers.length} members (density ${clusterConfig.density})`);

      // For each pair, probabilistically create connection based on density
      for (let i = 0; i < clusterMembers.length; i++) {
        for (let j = i + 1; j < clusterMembers.length; j++) {
          if (this.rng.next() < clusterConfig.density) {
            const source = clusterMembers[i]!;
            const target = clusterMembers[j]!;
            const pairKey = [source.globalEntityId, target.globalEntityId].sort().join(':');

            if (!existingPairs.has(pairKey)) {
              existingPairs.add(pairKey);
              const connectionType = this.rng.weightedPick(CONNECTION_TYPES);

              connections.push({
                sourceId: source.globalEntityId,
                targetId: target.globalEntityId,
                linkType: connectionType.type,
                strength: 0.5 + this.rng.next() * 0.5, // 0.5-1.0
                context: `${clusterConfig.name} connection`,
              });
            }
          }
        }
      }
    }

    // Generate cross-cluster connections (for bridges)
    console.log('\nGenerating cross-cluster connections...');
    const bridges = profiles.filter(p => p.clusterTags.length > 1);
    console.log(`  Found ${bridges.length} bridge profiles`);

    for (const bridge of bridges) {
      // Connect to random members of each cluster they belong to
      for (const tag of bridge.clusterTags) {
        const clusterMembers = clusters.get(tag) || [];
        const others = clusterMembers.filter(m => m.id !== bridge.id);

        // Connect to 2-4 random members in each cluster
        const numConnections = this.rng.nextInt(2, Math.min(4, others.length));
        const shuffled = [...others].sort(() => this.rng.next() - 0.5);

        for (let i = 0; i < numConnections; i++) {
          const other = shuffled[i];
          if (!other) continue;

          const pairKey = [bridge.globalEntityId, other.globalEntityId].sort().join(':');
          if (!existingPairs.has(pairKey)) {
            existingPairs.add(pairKey);
            connections.push({
              sourceId: bridge.globalEntityId,
              targetId: other.globalEntityId,
              linkType: 'knows',
              strength: 0.6 + this.rng.next() * 0.4,
              context: `Bridge connection across clusters`,
            });
          }
        }
      }
    }

    // Generate random cross-cluster connections (weak ties)
    console.log('\nGenerating random weak ties...');
    const weakTieCount = Math.floor(profiles.length * 0.1); // 10% of profiles get random connections
    for (let i = 0; i < weakTieCount; i++) {
      const source = this.rng.pick(profiles);
      const target = this.rng.pick(profiles.filter(p => p.id !== source.id));
      const pairKey = [source.globalEntityId, target.globalEntityId].sort().join(':');

      if (!existingPairs.has(pairKey)) {
        existingPairs.add(pairKey);
        connections.push({
          sourceId: source.globalEntityId,
          targetId: target.globalEntityId,
          linkType: 'met_at_event',
          strength: 0.2 + this.rng.next() * 0.3, // Weaker connections
          context: 'Random encounter',
        });
      }
    }

    console.log(`\nTotal connections generated: ${connections.length}`);
    return connections;
  }

  async saveConnections(connections: Array<{
    sourceId: string;
    targetId: string;
    linkType: string;
    strength: number;
    context: string;
  }>): Promise<void> {
    console.log('\nSaving connections to database...');

    // Save to entity_links table
    const batchSize = 50;
    let saved = 0;

    for (let i = 0; i < connections.length; i += batchSize) {
      const batch = connections.slice(i, i + batchSize);

      // First check if entity_links table exists
      const { error } = await this.supabase
        .from('entity_links')
        .upsert(batch.map(conn => ({
          source_entity_id: conn.sourceId,
          target_entity_id: conn.targetId,
          link_type: conn.linkType,
          strength: conn.strength,
          context_snippet: conn.context,
          layer: 'public',
        })), { onConflict: 'source_entity_id,target_entity_id,link_type' });

      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.warn('  entity_links table does not exist, skipping database save');
          console.log('  Connections would be saved to entity_links table');
          return;
        }
        console.warn(`  Batch ${i / batchSize + 1} warning:`, error.message);
      } else {
        saved += batch.length;
      }

      if ((i + batchSize) % 100 === 0 || i + batchSize >= connections.length) {
        console.log(`  Saved ${Math.min(i + batchSize, connections.length)}/${connections.length} connections`);
      }
    }

    console.log(`  Database save complete: ${saved} connections`);
  }

  async generateStats(profiles: ProfileWithCluster[], connections: Array<{
    sourceId: string;
    targetId: string;
    linkType: string;
  }>): Promise<void> {
    console.log('\n=== Network Statistics ===');

    // Connection counts per profile
    const connectionCounts = new Map<string, number>();
    for (const conn of connections) {
      connectionCounts.set(conn.sourceId, (connectionCounts.get(conn.sourceId) || 0) + 1);
      connectionCounts.set(conn.targetId, (connectionCounts.get(conn.targetId) || 0) + 1);
    }

    const counts = Array.from(connectionCounts.values());
    const avgConnections = counts.reduce((a, b) => a + b, 0) / counts.length;
    const maxConnections = Math.max(...counts);
    const minConnections = Math.min(...counts);

    console.log(`Profiles: ${profiles.length}`);
    console.log(`Total connections: ${connections.length}`);
    console.log(`Avg connections/person: ${avgConnections.toFixed(1)}`);
    console.log(`Max connections: ${maxConnections}`);
    console.log(`Min connections: ${minConnections}`);

    // Connection types breakdown
    console.log('\nConnection types:');
    const typeCounts = new Map<string, number>();
    for (const conn of connections) {
      typeCounts.set(conn.linkType, (typeCounts.get(conn.linkType) || 0) + 1);
    }
    for (const [type, count] of typeCounts) {
      console.log(`  ${type}: ${count} (${(count / connections.length * 100).toFixed(1)}%)`);
    }

    // Cluster sizes
    console.log('\nCluster membership:');
    const clusters = this.groupByCluster(profiles);
    for (const [tag, members] of clusters) {
      if (members.length > 0) {
        const clusterName = CLUSTERS.find(c => c.tag === tag)?.name || tag;
        console.log(`  ${clusterName}: ${members.length} members`);
      }
    }
  }
}

// =============================================================================
// CLI RUNNER
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const config: NetworkConfig = { ...DEFAULT_CONFIG };

  // Parse CLI args
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--seed' && args[i + 1]) {
      config.seed = parseInt(args[i + 1]!, 10);
      i++;
    } else if (args[i] === '--clear') {
      config.clearExisting = true;
    }
  }

  // Check environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log(`\n=== Good Hang Demo Network Generator ===`);
  console.log(`Config: seed=${config.seed}, clear=${config.clearExisting}\n`);

  const generator = new NetworkGenerator(config.seed, supabaseUrl, supabaseKey);

  // Load profiles
  const profiles = await generator.loadProfiles();

  if (profiles.length === 0) {
    console.error('No profiles found. Run generate-profiles.ts first.');
    process.exit(1);
  }

  // Generate connections
  const connections = generator.generateConnections(profiles);

  // Save to database
  await generator.saveConnections(connections);

  // Show statistics
  await generator.generateStats(profiles, connections);

  console.log('\n=== Network Generation Complete ===');
}

main().catch(console.error);
