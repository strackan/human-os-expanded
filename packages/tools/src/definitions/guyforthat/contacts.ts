/**
 * GuyForThat Contact Tools
 *
 * CRM tools for contact context management.
 * Platform: guyforthat
 */

import { z } from 'zod';
import { defineTool } from '../../registry.js';
import { STORAGE_BUCKETS } from '@human-os/core';

// =============================================================================
// GET CONTACT CONTEXT
// =============================================================================

export const getContactContext = defineTool({
  name: 'gft_get_contact_context',
  description:
    'Get rich context about a contact from Human-OS knowledge files. Returns markdown with about section, job history, posts, recommendations - everything needed to personalize outreach.',
  platform: 'guyforthat',
  category: 'contacts',

  input: z.object({
    contactId: z
      .string()
      .describe('Contact ID, LinkedIn slug (john-doe), or LinkedIn URL'),
    sections: z
      .array(z.string())
      .optional()
      .describe(
        'Optional: specific sections to retrieve (about, experience, posts, recommendations)'
      ),
  }),

  handler: async (ctx, input) => {
    const slug = extractSlug(input.contactId);
    const basePath = `experts/${slug}`;

    // Try to load contact markdown files
    const sections: Record<string, string> = {};
    const sectionFiles = input.sections || [
      'about',
      'experience',
      'posts',
      'recommendations',
    ];

    for (const section of sectionFiles) {
      const filePath = `${basePath}/sources/linkedin-${section}.md`;
      const { data, error } = await ctx.supabase.storage
        .from(STORAGE_BUCKETS.HUMAN_OS)
        .download(filePath);

      if (!error && data) {
        sections[section] = await data.text();
      }
    }

    // Also try to get SKILL.md if it exists
    const { data: skillData } = await ctx.supabase.storage
      .from(STORAGE_BUCKETS.HUMAN_OS)
      .download(`${basePath}/SKILL.md`);

    if (skillData) {
      sections.skill = await skillData.text();
    }

    if (Object.keys(sections).length === 0) {
      return {
        success: false,
        message: `No context found for contact: ${slug}`,
        slug,
      };
    }

    return {
      success: true,
      slug,
      sections,
      hint: 'Use this context to personalize outreach messages',
    };
  },

  rest: { method: 'GET', path: '/gft/contacts/:contactId/context' },
});

// =============================================================================
// STORE CONTACT CONTEXT
// =============================================================================

export const storeContactContext = defineTool({
  name: 'gft_store_contact_context',
  description:
    'Store enriched contact data to Human-OS. Converts structured data to rich markdown for future consumption.',
  platform: 'guyforthat',
  category: 'contacts',

  input: z.object({
    contact: z.object({
      linkedin_url: z.string().optional(),
      slug: z.string().optional(),
      name: z.string(),
      headline: z.string().optional(),
      about: z.string().optional(),
      location: z.string().optional(),
      experiences: z
        .array(
          z.object({
            title: z.string(),
            company: z.string(),
            duration: z.string().optional(),
            description: z.string().optional(),
          })
        )
        .optional(),
      education: z.array(z.unknown()).optional(),
      skills: z.array(z.string()).optional(),
      posts: z.array(z.unknown()).optional(),
      recommendations: z.array(z.unknown()).optional(),
    }),
  }),

  handler: async (ctx, input) => {
    const { contact } = input;
    const slug =
      contact.slug || extractSlug(contact.linkedin_url || contact.name);
    const basePath = `experts/${slug}/sources`;

    const results: { file: string; success: boolean; error?: string }[] = [];

    // Store about section
    if (contact.about) {
      const aboutMd = formatAboutMarkdown(contact);
      const { error } = await ctx.supabase.storage
        .from(STORAGE_BUCKETS.HUMAN_OS)
        .upload(`${basePath}/linkedin-about.md`, aboutMd, {
          contentType: 'text/markdown',
          upsert: true,
        });
      results.push({
        file: 'linkedin-about.md',
        success: !error,
        error: error?.message,
      });
    }

    // Store experience
    if (contact.experiences && contact.experiences.length > 0) {
      const expMd = formatExperienceMarkdown(contact.experiences);
      const { error } = await ctx.supabase.storage
        .from(STORAGE_BUCKETS.HUMAN_OS)
        .upload(`${basePath}/linkedin-experience.md`, expMd, {
          contentType: 'text/markdown',
          upsert: true,
        });
      results.push({
        file: 'linkedin-experience.md',
        success: !error,
        error: error?.message,
      });
    }

    // Store posts if provided
    if (contact.posts && contact.posts.length > 0) {
      const postsMd = formatPostsMarkdown(contact.posts);
      const monthYear = new Date().toISOString().slice(0, 7);
      const { error } = await ctx.supabase.storage
        .from(STORAGE_BUCKETS.HUMAN_OS)
        .upload(`${basePath}/linkedin-posts-${monthYear}.md`, postsMd, {
          contentType: 'text/markdown',
          upsert: true,
        });
      results.push({
        file: `linkedin-posts-${monthYear}.md`,
        success: !error,
        error: error?.message,
      });
    }

    const successCount = results.filter((r) => r.success).length;

    return {
      success: successCount > 0,
      slug,
      stored: results,
      message: `Stored ${successCount}/${results.length} files for ${contact.name}`,
    };
  },

  rest: { method: 'POST', path: '/gft/contacts/context' },
});

// =============================================================================
// GET FULL CONTACT PROFILE
// =============================================================================

export const getFullContactProfile = defineTool({
  name: 'gft_get_full_contact_profile',
  description:
    'Get complete contact profile combining database records AND rich context files. This is the primary tool for contact lookup.',
  platform: 'guyforthat',
  category: 'contacts',

  input: z.object({
    linkedinUrl: z.string().optional().describe('LinkedIn profile URL'),
    contactId: z.string().optional().describe('Contact UUID from database'),
    slug: z.string().optional().describe('Expert slug'),
    includeCompanyContext: z
      .boolean()
      .optional()
      .default(true)
      .describe('Also fetch their company context'),
  }),

  handler: async (ctx, input) => {
    const slug =
      input.slug ||
      (input.linkedinUrl ? extractSlug(input.linkedinUrl) : null);

    // Try to get from contacts table first
    let dbContact = null;
    if (input.contactId) {
      const { data } = await ctx.supabase
        .from('contacts')
        .select('*')
        .eq('id', input.contactId)
        .single();
      dbContact = data;
    } else if (input.linkedinUrl) {
      const { data } = await ctx.supabase
        .from('contacts')
        .select('*')
        .eq('linkedin_url', input.linkedinUrl)
        .single();
      dbContact = data;
    }

    // Get rich context from storage
    const contextSections: Record<string, string> = {};
    if (slug) {
      const basePath = `experts/${slug}/sources`;
      const files = ['about', 'experience', 'posts', 'recommendations'];

      for (const file of files) {
        const { data } = await ctx.supabase.storage
          .from(STORAGE_BUCKETS.HUMAN_OS)
          .download(`${basePath}/linkedin-${file}.md`);
        if (data) {
          contextSections[file] = await data.text();
        }
      }

      // Get SKILL.md
      const { data: skillData } = await ctx.supabase.storage
        .from(STORAGE_BUCKETS.HUMAN_OS)
        .download(`experts/${slug}/SKILL.md`);
      if (skillData) {
        contextSections.skill = await skillData.text();
      }
    }

    // Get company context if requested
    let companyContext = null;
    if (input.includeCompanyContext && dbContact?.company) {
      const { data } = await ctx.supabase
        .from('companies')
        .select('*')
        .eq('name', dbContact.company)
        .single();
      companyContext = data;
    }

    return {
      success: true,
      contact: dbContact,
      context: contextSections,
      company: companyContext,
      slug,
    };
  },

  rest: { method: 'GET', path: '/gft/contacts/profile' },
});

// =============================================================================
// SEARCH CONTACTS
// =============================================================================

export const searchContacts = defineTool({
  name: 'gft_search_contacts',
  description:
    'Search contacts in the database by name, company, or other criteria.',
  platform: 'guyforthat',
  category: 'contacts',

  input: z.object({
    query: z.string().optional().describe('Search query for name or company'),
    company: z.string().optional().describe('Filter by company name'),
    tags: z.array(z.string()).optional().describe('Filter by tags'),
    limit: z.number().optional().default(20).describe('Max results'),
  }),

  handler: async (ctx, input) => {
    let query = ctx.supabase
      .from('contacts')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(input.limit || 20);

    if (input.query) {
      query = query.or(
        `name.ilike.%${input.query}%,company.ilike.%${input.query}%,headline.ilike.%${input.query}%`
      );
    }

    if (input.company) {
      query = query.ilike('company', `%${input.company}%`);
    }

    if (input.tags && input.tags.length > 0) {
      query = query.contains('tags', input.tags);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message, contacts: [] };
    }

    return {
      success: true,
      contacts: data || [],
      count: data?.length || 0,
    };
  },

  rest: { method: 'GET', path: '/gft/contacts/search' },
});

// =============================================================================
// HELPERS
// =============================================================================

function extractSlug(input: string): string {
  // Handle LinkedIn URLs
  if (input.includes('linkedin.com/in/')) {
    const match = input.match(/linkedin\.com\/in\/([^/?]+)/);
    if (match) return match[1].toLowerCase();
  }
  // Handle direct slugs or names
  return input.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function formatAboutMarkdown(contact: {
  name: string;
  headline?: string;
  about?: string;
  location?: string;
}): string {
  return `# ${contact.name}

${contact.headline ? `**${contact.headline}**` : ''}

${contact.location ? `📍 ${contact.location}` : ''}

## About

${contact.about || 'No about section available.'}
`;
}

function formatExperienceMarkdown(
  experiences: Array<{
    title: string;
    company: string;
    duration?: string;
    description?: string;
  }>
): string {
  let md = '# Experience\n\n';
  for (const exp of experiences) {
    md += `## ${exp.title} at ${exp.company}\n`;
    if (exp.duration) md += `*${exp.duration}*\n\n`;
    if (exp.description) md += `${exp.description}\n\n`;
  }
  return md;
}

function formatPostsMarkdown(posts: unknown[]): string {
  let md = '# LinkedIn Posts\n\n';
  for (const post of posts as Array<{ content?: string; date?: string }>) {
    md += `---\n\n`;
    if (post.date) md += `*${post.date}*\n\n`;
    md += `${post.content || ''}\n\n`;
  }
  return md;
}
