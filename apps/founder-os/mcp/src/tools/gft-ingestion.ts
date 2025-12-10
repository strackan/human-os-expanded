/**
 * GFT (Guy For That) LinkedIn Ingestion Tools
 *
 * Tools for ingesting LinkedIn profile data from GFT scraper
 * and creating entities with context files.
 */

import type { ContextEngine, KnowledgeGraph } from '@human-os/core';

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

/**
 * Convert name to URL-safe slug
 */
export function slugify(name: string): string {
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
export function generateLinkedInContext(data: LinkedInProfileData): string {
  const sections: string[] = [];

  // Frontmatter
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

  // Main heading
  sections.push(`# ${data.name}`);
  sections.push('');

  // Headline
  if (data.headline) {
    sections.push(`**${data.headline}**`);
    sections.push('');
  }

  // LinkedIn profile link
  if (data.linkedinUrl) {
    sections.push(`LinkedIn: [${data.linkedinUrl}](${data.linkedinUrl})`);
    sections.push('');
  }

  // About section
  if (data.about) {
    sections.push('## About');
    sections.push('');
    sections.push(data.about.trim());
    sections.push('');
  }

  // Experience section
  if (data.experience) {
    sections.push('## Experience');
    sections.push('');
    sections.push(data.experience.trim());
    sections.push('');
  }

  // Education section
  if (data.education) {
    sections.push('## Education');
    sections.push('');
    sections.push(data.education.trim());
    sections.push('');
  }

  // Skills section
  if (data.skills && data.skills.length > 0) {
    sections.push('## Skills');
    sections.push('');
    sections.push(data.skills.map((skill) => `- ${skill}`).join('\n'));
    sections.push('');
  }

  // Current company link (wiki link for graph)
  if (data.company) {
    sections.push('## Current Company');
    sections.push('');
    sections.push(`Works at [[${data.company}]]`);
    sections.push('');
  }

  // Metadata footer
  sections.push('---');
  sections.push('');
  sections.push('*Scraped from LinkedIn via GFT*');
  sections.push(`*Last updated: ${new Date(data.scrapedAt).toLocaleString()}*`);

  return sections.join('\n');
}

/**
 * Extract wiki links from markdown content
 */
export function extractWikiLinks(content: string): string[] {
  const linkPattern = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    const target = match[1];
    if (target) links.push(target);
  }

  return links;
}

/**
 * Ingest a LinkedIn profile from GFT scraper
 */
export async function ingestLinkedInProfile(
  data: LinkedInProfileData,
  contextEngine: ContextEngine,
  knowledgeGraph: KnowledgeGraph,
  userId: string
): Promise<GFTIngestionResult> {
  const slug = slugify(data.name);
  const content = generateLinkedInContext(data);

  // Save context to public layer
  const layer = 'public';
  const folder = 'people';

  try {
    const savedFile = await contextEngine.saveContext(layer, folder, slug, content);

    // Extract wiki links for knowledge graph
    const wikiLinks = extractWikiLinks(content);

    // Create links in knowledge graph
    for (const targetName of wikiLinks) {
      const targetSlug = slugify(targetName);

      await knowledgeGraph.createLink(slug, targetSlug, 'wiki_link', {
        layer,
        linkText: targetName,
      });

      // If it's a company mention, also create works_at relationship
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
export async function batchIngestLinkedInProfiles(
  profiles: LinkedInProfileData[],
  contextEngine: ContextEngine,
  knowledgeGraph: KnowledgeGraph,
  userId: string
): Promise<GFTIngestionResult[]> {
  const results: GFTIngestionResult[] = [];

  for (const profile of profiles) {
    try {
      const result = await ingestLinkedInProfile(
        profile,
        contextEngine,
        knowledgeGraph,
        userId
      );
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
export async function updateLinkedInProfile(
  slug: string,
  data: LinkedInProfileData,
  contextEngine: ContextEngine,
  knowledgeGraph: KnowledgeGraph,
  userId: string
): Promise<GFTIngestionResult> {
  return ingestLinkedInProfile(data, contextEngine, knowledgeGraph, userId);
}
