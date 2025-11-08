#!/usr/bin/env tsx
/**
 * Generate ROADMAP.md from Database
 * Auto-generates product roadmap from releases and features tables
 *
 * Usage:
 *   npm run roadmap                    # Generate current roadmap
 *   npm run roadmap -- --all           # Include all releases
 *   npm run roadmap -- --version 0.1   # Generate historical roadmap for specific version
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface Release {
  id: string;
  version: string;
  name: string;
  status_slug: string;
  phase_number: number;
  planned_start: string | null;
  planned_end: string | null;
  actual_shipped: string | null;
  description: string | null;
}

interface Feature {
  id: string;
  slug: string;
  title: string;
  status_slug: string;
  category_slug: string;
  priority: number;
  effort_hrs: number;
  business_case: string | null;
}

async function getReleases(version?: string, showAll?: boolean): Promise<Release[]> {
  let query = supabase
    .from('releases')
    .select(`
      id,
      version,
      name,
      phase_number,
      planned_start,
      planned_end,
      actual_shipped,
      description,
      release_statuses!inner(slug)
    `)
    .order('phase_number', { ascending: true });

  // If specific version requested
  if (version) {
    query = query.eq('version', version);
  }
  // If not showing all, only show in_progress and planning
  else if (!showAll) {
    query = query.in('release_statuses.slug', ['in_progress', 'planning']);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Failed to fetch releases:', error.message);
    return [];
  }

  if (!data || data.length === 0) {
    console.warn('⚠️  No releases found');
    return [];
  }

  return data.map((r: any) => ({
    id: r.id,
    version: r.version,
    name: r.name,
    status_slug: r.release_statuses.slug,
    phase_number: r.phase_number,
    planned_start: r.planned_start,
    planned_end: r.planned_end,
    actual_shipped: r.actual_shipped,
    description: r.description
  }));
}

async function getFeaturesForRelease(releaseId: string): Promise<Feature[]> {
  const { data, error } = await supabase
    .from('features')
    .select(`
      id,
      slug,
      title,
      priority,
      effort_hrs,
      business_case,
      feature_statuses!inner(slug),
      feature_categories!inner(slug)
    `)
    .eq('release_id', releaseId)
    .order('priority', { ascending: true });

  if (error) {
    console.error(`❌ Failed to fetch features for release:`, error.message);
    return [];
  }

  if (!data) return [];

  return data.map((f: any) => ({
    id: f.id,
    slug: f.slug,
    title: f.title,
    status_slug: f.feature_statuses.slug,
    category_slug: f.feature_categories.slug,
    priority: f.priority,
    effort_hrs: f.effort_hrs,
    business_case: f.business_case
  }));
}

function formatTimeline(release: Release): string {
  if (release.actual_shipped) {
    const date = new Date(release.actual_shipped);
    return `Shipped ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  if (release.planned_start && release.planned_end) {
    const start = new Date(release.planned_start);
    const end = new Date(release.planned_end);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  return 'Timeline TBD';
}

function getStatusEmoji(statusSlug: string): string {
  const map: Record<string, string> = {
    'in_progress': '🚀',
    'planning': '📋',
    'complete': '✅',
    'cancelled': '❌'
  };
  return map[statusSlug] || '📋';
}

function getFeatureStatusCheckbox(statusSlug: string): string {
  return statusSlug === 'complete' ? '[x]' : '[ ]';
}

function generateRoadmap(releases: Release[], featuresMap: Map<string, Feature[]>): string {
  let markdown = `# Renubu Product Roadmap

**Last Generated:** ${new Date().toISOString().split('T')[0]}
**Source:** Auto-generated from database (releases + features tables)

---

`;

  // Determine current and next releases
  const inProgressReleases = releases.filter(r => r.status_slug === 'in_progress');
  const plannedReleases = releases.filter(r => r.status_slug === 'planning');
  const completeReleases = releases.filter(r => r.status_slug === 'complete');

  // Current Release(s)
  if (inProgressReleases.length > 0) {
    markdown += `## ${getStatusEmoji('in_progress')} Current Release${inProgressReleases.length > 1 ? 's' : ''}\n\n`;

    for (const release of inProgressReleases) {
      markdown += formatRelease(release, featuresMap.get(release.id) || []);
    }
  }

  // Planned Releases
  if (plannedReleases.length > 0) {
    markdown += `## ${getStatusEmoji('planning')} Planned Releases\n\n`;

    for (const release of plannedReleases) {
      markdown += formatRelease(release, featuresMap.get(release.id) || []);
    }
  }

  // Completed Releases (if showing all)
  if (completeReleases.length > 0) {
    markdown += `## ${getStatusEmoji('complete')} Completed Releases\n\n`;

    for (const release of completeReleases) {
      markdown += formatRelease(release, featuresMap.get(release.id) || [], true);
    }
  }

  // Footer
  markdown += `---

## How to Update This Roadmap

**This file is auto-generated.** Do not edit manually.

To update:
1. Update releases and features in database
2. Run: \`npm run roadmap\`

To see historical roadmap:
\`\`\`bash
npm run roadmap -- --version 0.1  # Generate for specific version
npm run roadmap -- --all          # Show all releases
\`\`\`

---

**Related Documentation:**
- [FEATURES.md](docs/FEATURES.md) - Complete feature catalog (auto-generated)
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Strategic guardrails & decisions
- Database: \`releases\` and \`features\` tables

**Last Updated:** ${new Date().toISOString().split('T')[0]}
`;

  return markdown;
}

function formatRelease(release: Release, features: Feature[], collapsed: boolean = false): string {
  let markdown = `### ${release.version} - ${release.name}\n\n`;
  markdown += `**Status:** ${capitalize(release.status_slug.replace('_', ' '))}\n`;
  markdown += `**Timeline:** ${formatTimeline(release)}\n`;

  if (release.description) {
    markdown += `\n${release.description}\n`;
  }

  markdown += `\n`;

  if (features.length === 0) {
    markdown += `*No features assigned yet*\n\n`;
  } else {
    // Calculate total effort
    const totalEffort = features.reduce((sum, f) => sum + (f.effort_hrs || 0), 0);
    markdown += `**Features:** ${features.length} | **Total Effort:** ${totalEffort}h\n\n`;

    if (collapsed) {
      // Just show count by status for completed releases
      const byStatus = features.reduce((acc, f) => {
        acc[f.status_slug] = (acc[f.status_slug] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      markdown += Object.entries(byStatus)
        .map(([status, count]) => `- ${capitalize(status)}: ${count}`)
        .join('\n');
      markdown += '\n\n';
    } else {
      // Show full feature list for current/planned
      for (const feature of features) {
        const checkbox = getFeatureStatusCheckbox(feature.status_slug);
        const effortStr = feature.effort_hrs ? ` (${feature.effort_hrs}h)` : '';
        markdown += `- ${checkbox} **${feature.title}**${effortStr} - ${capitalize(feature.status_slug)}\n`;
      }
      markdown += `\n`;
    }
  }

  markdown += `---\n\n`;
  return markdown;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function main() {
  const args = process.argv.slice(2);
  const showAll = args.includes('--all');
  const versionIndex = args.indexOf('--version');
  const specificVersion = versionIndex >= 0 ? args[versionIndex + 1] : undefined;

  console.log('\n📊 Generating Renubu Roadmap...\n');

  // Fetch releases
  const releases = await getReleases(specificVersion, showAll);

  if (releases.length === 0) {
    console.error('❌ No releases found to generate roadmap');
    process.exit(1);
  }

  console.log(`Found ${releases.length} release(s):`);
  releases.forEach(r => console.log(`  - ${r.version}: ${r.name} (${r.status_slug})`));

  // Fetch features for each release
  console.log('\nFetching features...');
  const featuresMap = new Map<string, Feature[]>();

  for (const release of releases) {
    const features = await getFeaturesForRelease(release.id);
    featuresMap.set(release.id, features);
    console.log(`  - ${release.version}: ${features.length} features`);
  }

  // Generate markdown
  const markdown = generateRoadmap(releases, featuresMap);

  // Write to file
  const outputPath = path.join(process.cwd(), 'ROADMAP.md');
  fs.writeFileSync(outputPath, markdown);

  console.log(`\n✅ Roadmap generated: ${outputPath}\n`);
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
