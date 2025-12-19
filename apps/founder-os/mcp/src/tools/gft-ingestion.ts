/**
 * GFT (Guy For That) LinkedIn Ingestion Tools
 *
 * Tools for ingesting LinkedIn profile data from GFT scraper
 * and creating entities with context files.
 */

import type { ContextEngine, KnowledgeGraph } from '@human-os/core';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { z } from 'zod';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const gftTools: Tool[] = [
  {
    name: 'gft_ingest_linkedin',
    description: 'Ingest a LinkedIn profile from GFT scraper data',
    inputSchema: {
      type: 'object',
      properties: {
        linkedinUrl: { type: 'string', description: 'LinkedIn profile URL' },
        name: { type: 'string', description: 'Full name of the person' },
        headline: { type: 'string', description: 'LinkedIn headline' },
        company: { type: 'string', description: 'Current company' },
        about: { type: 'string', description: 'About/bio section' },
        experience: { type: 'string', description: 'Experience section' },
        education: { type: 'string', description: 'Education section' },
        skills: { type: 'array', items: { type: 'string' }, description: 'List of skills' },
        location: { type: 'string', description: 'Location' },
        scrapedAt: { type: 'string', description: 'Timestamp when scraped (ISO)' },
      },
      required: ['linkedinUrl', 'name', 'scrapedAt'],
    },
  },
  {
    name: 'gft_batch_ingest',
    description: 'Batch ingest multiple LinkedIn profiles',
    inputSchema: {
      type: 'object',
      properties: {
        profiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              linkedinUrl: { type: 'string' },
              name: { type: 'string' },
              headline: { type: 'string' },
              company: { type: 'string' },
              about: { type: 'string' },
              experience: { type: 'string' },
              education: { type: 'string' },
              skills: { type: 'array', items: { type: 'string' } },
              location: { type: 'string' },
              scrapedAt: { type: 'string' },
            },
            required: ['linkedinUrl', 'name', 'scrapedAt'],
          },
          description: 'Array of LinkedIn profile data',
        },
      },
      required: ['profiles'],
    },
  },
  {
    name: 'gft_update_profile',
    description: 'Update an existing LinkedIn profile with new data',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Entity slug to update' },
        linkedinUrl: { type: 'string', description: 'LinkedIn profile URL' },
        name: { type: 'string', description: 'Full name of the person' },
        headline: { type: 'string' },
        company: { type: 'string' },
        about: { type: 'string' },
        experience: { type: 'string' },
        education: { type: 'string' },
        skills: { type: 'array', items: { type: 'string' } },
        location: { type: 'string' },
        scrapedAt: { type: 'string', description: 'Timestamp when scraped (ISO)' },
      },
      required: ['slug', 'linkedinUrl', 'name', 'scrapedAt'],
    },
  },
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const LinkedInProfileSchema = z.object({
  linkedinUrl: z.string(),
  name: z.string(),
  headline: z.string().optional(),
  company: z.string().optional(),
  about: z.string().optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  scrapedAt: z.string(),
});

const BatchIngestSchema = z.object({
  profiles: z.array(LinkedInProfileSchema),
});

const UpdateProfileSchema = LinkedInProfileSchema.extend({
  slug: z.string(),
});

// =============================================================================
// TOOL HANDLER
// =============================================================================

/**
 * Handle GFT tool calls
 * Returns result if handled, null if not a GFT tool
 */
export async function handleGFTTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'gft_ingest_linkedin': {
      const data = LinkedInProfileSchema.parse(args);
      return ingestLinkedInProfile(data, ctx.contextEngine, ctx.knowledgeGraph, ctx.userId);
    }

    case 'gft_batch_ingest': {
      const { profiles } = BatchIngestSchema.parse(args);
      return batchIngestLinkedInProfiles(profiles, ctx.contextEngine, ctx.knowledgeGraph, ctx.userId);
    }

    case 'gft_update_profile': {
      const { slug, ...data } = UpdateProfileSchema.parse(args);
      return updateLinkedInProfile(slug, data, ctx.contextEngine, ctx.knowledgeGraph, ctx.userId);
    }

    default:
      return null;
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface LinkedInProfileData {
  linkedinUrl: string;
  name: string;
  headline?: string;
  company?: string;
  about?: string;
  experience?: string;
  education?: string;
  skills?: string[];
  location?: string;
  scrapedAt: string;
}

export interface GFTIngestionResult {
  entityId: string;
  slug: string;
  filePath: string;
  linksExtracted: number;
}

// =============================================================================
// TOOL IMPLEMENTATIONS
// =============================================================================

/**
 * Ingest a LinkedIn profile from GFT scraper
 */
async function ingestLinkedInProfile(
  data: LinkedInProfileData,
  contextEngine: ContextEngine,
  knowledgeGraph: KnowledgeGraph,
  userId: string
): Promise<GFTIngestionResult> {
  const slug = slugify(data.name);
  const content = generateLinkedInContext(data);

  const layer = 'public';
  const folder = 'people';

  try {
    const savedFile = await contextEngine.saveContext(layer, folder, slug, content);

    const wikiLinks = extractWikiLinks(content);

    for (const targetName of wikiLinks) {
      const targetSlug = slugify(targetName);

      await knowledgeGraph.createLink(slug, targetSlug, 'wiki_link', {
        layer,
        linkText: targetName,
      });

      if (data.company && targetName === data.company) {
        await knowledgeGraph.createLink(slug, targetSlug, 'works_at', {
          layer,
        });
      }
    }

    return {
      entityId: savedFile.entityId || '',
      slug,
      filePath: savedFile.filePath,
      linksExtracted: wikiLinks.length,
    };
  } catch (error) {
    throw new Error(
      `Failed to ingest LinkedIn profile for ${data.name}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Batch ingest multiple LinkedIn profiles
 */
async function batchIngestLinkedInProfiles(
  profiles: LinkedInProfileData[],
  contextEngine: ContextEngine,
  knowledgeGraph: KnowledgeGraph,
  userId: string
): Promise<GFTIngestionResult[]> {
  const results: GFTIngestionResult[] = [];

  for (const profile of profiles) {
    try {
      const result = await ingestLinkedInProfile(profile, contextEngine, knowledgeGraph, userId);
      results.push(result);
    } catch (error) {
      console.error(`Failed to ingest ${profile.name}:`, error);
    }
  }

  return results;
}

/**
 * Update existing LinkedIn profile with new data
 */
async function updateLinkedInProfile(
  slug: string,
  data: LinkedInProfileData,
  contextEngine: ContextEngine,
  knowledgeGraph: KnowledgeGraph,
  userId: string
): Promise<GFTIngestionResult> {
  return ingestLinkedInProfile(data, contextEngine, knowledgeGraph, userId);
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/**
 * Convert name to URL-safe slug
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate markdown context from LinkedIn profile data
 */
function generateLinkedInContext(data: LinkedInProfileData): string {
  const sections: string[] = [];

  sections.push('---');
  sections.push(`name: ${data.name}`);
  sections.push('type: person');
  sections.push('source: gft-scrape');
  sections.push(`scraped_at: ${data.scrapedAt}`);
  if (data.linkedinUrl) {
    sections.push(`linkedin_url: ${data.linkedinUrl}`);
  }
  if (data.company) {
    sections.push(`company: ${data.company}`);
  }
  if (data.location) {
    sections.push(`location: ${data.location}`);
  }
  sections.push('---');
  sections.push('');

  sections.push(`# ${data.name}`);
  sections.push('');

  if (data.headline) {
    sections.push(`**${data.headline}**`);
    sections.push('');
  }

  if (data.linkedinUrl) {
    sections.push(`LinkedIn: [${data.linkedinUrl}](${data.linkedinUrl})`);
    sections.push('');
  }

  if (data.about) {
    sections.push('## About');
    sections.push('');
    sections.push(data.about.trim());
    sections.push('');
  }

  if (data.experience) {
    sections.push('## Experience');
    sections.push('');
    sections.push(data.experience.trim());
    sections.push('');
  }

  if (data.education) {
    sections.push('## Education');
    sections.push('');
    sections.push(data.education.trim());
    sections.push('');
  }

  if (data.skills && data.skills.length > 0) {
    sections.push('## Skills');
    sections.push('');
    sections.push(data.skills.map(skill => `- ${skill}`).join('\n'));
    sections.push('');
  }

  if (data.company) {
    sections.push('## Current Company');
    sections.push('');
    sections.push(`Works at [[${data.company}]]`);
    sections.push('');
  }

  sections.push('---');
  sections.push('');
  sections.push('*Scraped from LinkedIn via GFT*');
  sections.push(`*Last updated: ${new Date(data.scrapedAt).toLocaleString()}*`);

  return sections.join('\n');
}

/**
 * Extract wiki links from markdown content
 */
function extractWikiLinks(content: string): string[] {
  const linkPattern = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    const target = match[1];
    if (target) links.push(target);
  }

  return links;
}
