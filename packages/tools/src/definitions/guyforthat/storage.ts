/**
 * GuyForThat Storage Tools
 *
 * Tools for managing expert corpus in Supabase Storage.
 * Platform: guyforthat
 */

import { z } from 'zod';
import { defineTool } from '../../registry.js';
import { STORAGE_BUCKETS } from '@human-os/core';

// =============================================================================
// LIST EXPERTS
// =============================================================================

export const listExperts = defineTool({
  name: 'gft_list_experts',
  description:
    'List all experts in the Human-OS corpus stored in Supabase Storage. Returns expert slugs that can be used with other storage tools.',
  platform: 'guyforthat',
  category: 'storage',

  input: z.object({}),

  handler: async (ctx) => {
    const { data, error } = await ctx.supabase.storage
      .from(STORAGE_BUCKETS.HUMAN_OS)
      .list('experts', { limit: 100 });

    if (error) {
      return { success: false, error: error.message, experts: [] };
    }

    const experts = (data || [])
      .filter((item) => item.id && !item.name.includes('.'))
      .map((item) => item.name);

    return {
      success: true,
      experts,
      count: experts.length,
    };
  },

  rest: { method: 'GET', path: '/gft/storage/experts' },
});

// =============================================================================
// LIST SOURCES
// =============================================================================

export const listSources = defineTool({
  name: 'gft_list_sources',
  description:
    "List all source files for a specific expert in the Human-OS corpus. Returns filenames like linkedin-about.md, linkedin-posts-2024-12.md, etc.",
  platform: 'guyforthat',
  category: 'storage',

  input: z.object({
    expert_slug: z.string().describe('The expert slug (e.g., "scott-leese")'),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase.storage
      .from(STORAGE_BUCKETS.HUMAN_OS)
      .list(`experts/${input.expert_slug}/sources`, { limit: 100 });

    if (error) {
      return {
        success: false,
        error: error.message,
        expert_slug: input.expert_slug,
        sources: [],
      };
    }

    const sources = (data || [])
      .filter((item) => item.name.endsWith('.md') || item.name.endsWith('.yaml'))
      .map((item) => ({
        name: item.name,
        size: item.metadata?.size,
        updated: item.updated_at,
      }));

    return {
      success: true,
      expert_slug: input.expert_slug,
      sources,
      count: sources.length,
    };
  },

  rest: { method: 'GET', path: '/gft/storage/experts/:expert_slug/sources' },
});

// =============================================================================
// READ SOURCE
// =============================================================================

export const readSource = defineTool({
  name: 'gft_read_source',
  description:
    "Read a source file from an expert's corpus in Supabase Storage. Use to read extracted LinkedIn content like about sections, posts, experience.",
  platform: 'guyforthat',
  category: 'storage',

  input: z.object({
    expert_slug: z.string().describe('The expert slug (e.g., "scott-leese")'),
    filename: z
      .string()
      .describe(
        'The source filename (e.g., "linkedin-about.md", "linkedin-posts-2024-12.md")'
      ),
  }),

  handler: async (ctx, input) => {
    const path = `experts/${input.expert_slug}/sources/${input.filename}`;

    const { data, error } = await ctx.supabase.storage
      .from(STORAGE_BUCKETS.HUMAN_OS)
      .download(path);

    if (error) {
      return {
        success: false,
        error: error.message,
        path,
      };
    }

    const content = await data.text();

    return {
      success: true,
      path,
      content,
    };
  },

  rest: {
    method: 'GET',
    path: '/gft/storage/experts/:expert_slug/sources/:filename',
  },
});

// =============================================================================
// READ FILE
// =============================================================================

export const readFile = defineTool({
  name: 'gft_read_file',
  description:
    'Read any file from Supabase Storage by full path. Use for reading SKILL.md, sources.yaml, or other files.',
  platform: 'guyforthat',
  category: 'storage',

  input: z.object({
    path: z
      .string()
      .describe(
        'Full path within the human-os bucket (e.g., "experts/scott-leese/SKILL.md")'
      ),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase.storage
      .from(STORAGE_BUCKETS.HUMAN_OS)
      .download(input.path);

    if (error) {
      return {
        success: false,
        error: error.message,
        path: input.path,
      };
    }

    const content = await data.text();

    return {
      success: true,
      path: input.path,
      content,
    };
  },

  rest: { method: 'GET', path: '/gft/storage/file' },
});

// =============================================================================
// WRITE FILE
// =============================================================================

export const writeFile = defineTool({
  name: 'gft_write_file',
  description:
    "Write or update a file in an expert's directory in Supabase Storage. Use for creating/updating SKILL.md, voice profiles, or other synthesized content.",
  platform: 'guyforthat',
  category: 'storage',

  input: z.object({
    expert_slug: z.string().describe('The expert slug (e.g., "scott-leese")'),
    filename: z
      .string()
      .describe('The filename to write (e.g., "SKILL.md", "voice-profile.md")'),
    content: z.string().describe('The file content to write'),
  }),

  handler: async (ctx, input) => {
    const path = `experts/${input.expert_slug}/${input.filename}`;

    const { error } = await ctx.supabase.storage
      .from(STORAGE_BUCKETS.HUMAN_OS)
      .upload(path, input.content, {
        contentType: 'text/markdown',
        upsert: true,
      });

    if (error) {
      return {
        success: false,
        error: error.message,
        path,
      };
    }

    return {
      success: true,
      message: `Successfully wrote ${path}`,
      path,
    };
  },

  rest: { method: 'POST', path: '/gft/storage/file' },
});

// =============================================================================
// GET SOURCES INDEX
// =============================================================================

export const getSourcesIndex = defineTool({
  name: 'gft_get_sources_index',
  description:
    'Get the sources.yaml index for an expert. Shows all available source files with metadata.',
  platform: 'guyforthat',
  category: 'storage',

  input: z.object({
    expert_slug: z.string().describe('The expert slug'),
  }),

  handler: async (ctx, input) => {
    const path = `experts/${input.expert_slug}/sources.yaml`;

    const { data, error } = await ctx.supabase.storage
      .from(STORAGE_BUCKETS.HUMAN_OS)
      .download(path);

    if (error) {
      return {
        success: false,
        error: error.message,
        path,
      };
    }

    const content = await data.text();

    return {
      success: true,
      expert_slug: input.expert_slug,
      content,
    };
  },

  rest: { method: 'GET', path: '/gft/storage/experts/:expert_slug/index' },
});

// =============================================================================
// SEARCH KNOWLEDGE
// =============================================================================

export const searchKnowledge = defineTool({
  name: 'gft_search_knowledge',
  description:
    'Search across all Human-OS knowledge files for relevant context. Use to find contacts/companies matching certain criteria or topics.',
  platform: 'guyforthat',
  category: 'storage',

  input: z.object({
    query: z
      .string()
      .describe(
        'Search query (e.g., "AI sales", "VP Engineering", "fintech")'
      ),
    entityType: z
      .enum(['contact', 'company', 'all'])
      .optional()
      .default('all')
      .describe('Type of entities to search'),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe('Maximum results to return'),
  }),

  handler: async (ctx, input) => {
    const results: Array<{
      type: string;
      slug: string;
      name?: string;
      excerpt: string;
    }> = [];

    // Search in contacts table
    if (input.entityType === 'all' || input.entityType === 'contact') {
      const { data: contacts } = await ctx.supabase
        .from('contacts')
        .select('id, name, headline, company, linkedin_url')
        .or(
          `name.ilike.%${input.query}%,headline.ilike.%${input.query}%,company.ilike.%${input.query}%`
        )
        .limit(input.limit || 10);

      for (const c of contacts || []) {
        results.push({
          type: 'contact',
          slug: c.linkedin_url
            ? c.linkedin_url.split('/in/')[1]?.split('/')[0]
            : c.name.toLowerCase().replace(/\s+/g, '-'),
          name: c.name,
          excerpt: `${c.headline || ''} at ${c.company || 'Unknown'}`,
        });
      }
    }

    // Search in companies table
    if (input.entityType === 'all' || input.entityType === 'company') {
      const { data: companies } = await ctx.supabase
        .from('companies')
        .select('id, name, industry, about')
        .or(`name.ilike.%${input.query}%,about.ilike.%${input.query}%`)
        .limit(input.limit || 10);

      for (const c of companies || []) {
        results.push({
          type: 'company',
          slug: c.name.toLowerCase().replace(/\s+/g, '-'),
          name: c.name,
          excerpt: c.industry || c.about?.substring(0, 100) || '',
        });
      }
    }

    return {
      success: true,
      query: input.query,
      results,
      count: results.length,
    };
  },

  rest: { method: 'GET', path: '/gft/storage/search' },
});
