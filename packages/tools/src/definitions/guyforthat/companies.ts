/**
 * GuyForThat Company Tools
 *
 * CRM tools for company context management.
 * Platform: guyforthat
 */

import { z } from 'zod';
import { defineTool } from '../../registry.js';
import { STORAGE_BUCKETS } from '@human-os/core';

// =============================================================================
// GET COMPANY CONTEXT
// =============================================================================

export const getCompanyContext = defineTool({
  name: 'gft_get_company_context',
  description:
    'Get company intelligence from Human-OS knowledge files. Returns sales insights, key personas, strategic priorities, talking points, and recent news.',
  platform: 'guyforthat',
  category: 'companies',

  input: z.object({
    companyId: z
      .string()
      .describe('Company ID, LinkedIn company ID, or company slug'),
    includeTalkingPoints: z
      .boolean()
      .optional()
      .default(true)
      .describe('Include sales talking points'),
  }),

  handler: async (ctx, input) => {
    const slug = input.companyId.toLowerCase().replace(/\s+/g, '-');
    const basePath = `companies/${slug}`;

    const sections: Record<string, string> = {};

    // Load company overview
    const { data: overviewData } = await ctx.supabase.storage
      .from(STORAGE_BUCKETS.HUMAN_OS)
      .download(`${basePath}/overview.md`);
    if (overviewData) {
      sections.overview = await overviewData.text();
    }

    // Load sales intelligence
    if (input.includeTalkingPoints) {
      const { data: salesData } = await ctx.supabase.storage
        .from(STORAGE_BUCKETS.HUMAN_OS)
        .download(`${basePath}/sales-intel.md`);
      if (salesData) {
        sections.salesIntel = await salesData.text();
      }
    }

    // Load key personas
    const { data: personasData } = await ctx.supabase.storage
      .from(STORAGE_BUCKETS.HUMAN_OS)
      .download(`${basePath}/personas.md`);
    if (personasData) {
      sections.personas = await personasData.text();
    }

    if (Object.keys(sections).length === 0) {
      return {
        success: false,
        message: `No context found for company: ${slug}`,
        slug,
      };
    }

    return {
      success: true,
      slug,
      sections,
    };
  },

  rest: { method: 'GET', path: '/gft/companies/:companyId/context' },
});

// =============================================================================
// STORE COMPANY CONTEXT
// =============================================================================

export const storeCompanyContext = defineTool({
  name: 'gft_store_company_context',
  description:
    'Store enriched company data to Human-OS. Includes sales insights, personas, and competitive intelligence.',
  platform: 'guyforthat',
  category: 'companies',

  input: z.object({
    company: z.object({
      linkedin_url: z.string().optional(),
      slug: z.string().optional(),
      name: z.string(),
      industry: z.string().optional(),
      size: z.string().optional(),
      headquarters: z.string().optional(),
      website: z.string().optional(),
      about: z.string().optional(),
      specialties: z.array(z.string()).optional(),
      funding: z.string().optional(),
      recentNews: z.array(z.unknown()).optional(),
    }),
  }),

  handler: async (ctx, input) => {
    const { company } = input;
    const slug =
      company.slug || company.name.toLowerCase().replace(/\s+/g, '-');
    const basePath = `companies/${slug}`;

    // Create company overview markdown
    const overviewMd = formatCompanyOverview(company);

    const { error } = await ctx.supabase.storage
      .from(STORAGE_BUCKETS.HUMAN_OS)
      .upload(`${basePath}/overview.md`, overviewMd, {
        contentType: 'text/markdown',
        upsert: true,
      });

    if (error) {
      return {
        success: false,
        error: error.message,
        slug,
      };
    }

    // Also upsert to companies table
    const { error: dbError } = await ctx.supabase.from('companies').upsert(
      {
        name: company.name,
        linkedin_url: company.linkedin_url,
        industry: company.industry,
        size: company.size,
        headquarters: company.headquarters,
        website: company.website,
        about: company.about,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'linkedin_url' }
    );

    return {
      success: true,
      slug,
      storedToStorage: !error,
      storedToDatabase: !dbError,
      message: `Stored company context for ${company.name}`,
    };
  },

  rest: { method: 'POST', path: '/gft/companies/context' },
});

// =============================================================================
// GET FULL COMPANY PROFILE
// =============================================================================

export const getFullCompanyProfile = defineTool({
  name: 'gft_get_full_company_profile',
  description:
    'Get complete company profile combining database records AND rich context files. Returns structured data plus sales insights, personas, and talking points.',
  platform: 'guyforthat',
  category: 'companies',

  input: z.object({
    linkedinUrl: z.string().optional().describe('LinkedIn company URL'),
    companyId: z.string().optional().describe('Company UUID from database'),
    slug: z.string().optional().describe('Company slug'),
    includeEmployees: z
      .boolean()
      .optional()
      .default(false)
      .describe('Include known employees/decision makers'),
  }),

  handler: async (ctx, input) => {
    // Get from database
    let dbCompany = null;
    if (input.companyId) {
      const { data } = await ctx.supabase
        .from('companies')
        .select('*')
        .eq('id', input.companyId)
        .single();
      dbCompany = data;
    } else if (input.linkedinUrl) {
      const { data } = await ctx.supabase
        .from('companies')
        .select('*')
        .eq('linkedin_url', input.linkedinUrl)
        .single();
      dbCompany = data;
    }

    const slug =
      input.slug ||
      (dbCompany?.name
        ? dbCompany.name.toLowerCase().replace(/\s+/g, '-')
        : null);

    // Get rich context from storage
    const contextSections: Record<string, string> = {};
    if (slug) {
      const basePath = `companies/${slug}`;
      const files = ['overview', 'sales-intel', 'personas', 'news'];

      for (const file of files) {
        const { data } = await ctx.supabase.storage
          .from(STORAGE_BUCKETS.HUMAN_OS)
          .download(`${basePath}/${file}.md`);
        if (data) {
          contextSections[file] = await data.text();
        }
      }
    }

    // Get employees if requested
    let employees: unknown[] = [];
    if (input.includeEmployees && dbCompany?.name) {
      const { data } = await ctx.supabase
        .from('contacts')
        .select('id, name, headline, linkedin_url')
        .ilike('company', `%${dbCompany.name}%`)
        .limit(20);
      employees = data || [];
    }

    return {
      success: true,
      company: dbCompany,
      context: contextSections,
      employees: input.includeEmployees ? employees : undefined,
      slug,
    };
  },

  rest: { method: 'GET', path: '/gft/companies/profile' },
});

// =============================================================================
// SEARCH COMPANIES
// =============================================================================

export const searchCompanies = defineTool({
  name: 'gft_search_companies',
  description: 'Search companies in the database by name, industry, or size.',
  platform: 'guyforthat',
  category: 'companies',

  input: z.object({
    query: z.string().optional().describe('Search query for company name'),
    industry: z.string().optional().describe('Filter by industry'),
    size: z.string().optional().describe('Filter by company size'),
    limit: z.number().optional().default(20).describe('Max results'),
  }),

  handler: async (ctx, input) => {
    let query = ctx.supabase
      .from('companies')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(input.limit || 20);

    if (input.query) {
      query = query.or(
        `name.ilike.%${input.query}%,about.ilike.%${input.query}%`
      );
    }

    if (input.industry) {
      query = query.ilike('industry', `%${input.industry}%`);
    }

    if (input.size) {
      query = query.eq('size', input.size);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message, companies: [] };
    }

    return {
      success: true,
      companies: data || [],
      count: data?.length || 0,
    };
  },

  rest: { method: 'GET', path: '/gft/companies/search' },
});

// =============================================================================
// HELPERS
// =============================================================================

function formatCompanyOverview(company: {
  name: string;
  industry?: string;
  size?: string;
  headquarters?: string;
  website?: string;
  about?: string;
  specialties?: string[];
}): string {
  let md = `# ${company.name}\n\n`;

  if (company.industry) md += `**Industry:** ${company.industry}\n`;
  if (company.size) md += `**Size:** ${company.size}\n`;
  if (company.headquarters) md += `**HQ:** ${company.headquarters}\n`;
  if (company.website) md += `**Website:** ${company.website}\n`;

  md += '\n## About\n\n';
  md += company.about || 'No description available.\n';

  if (company.specialties && company.specialties.length > 0) {
    md += '\n## Specialties\n\n';
    for (const spec of company.specialties) {
      md += `- ${spec}\n`;
    }
  }

  return md;
}
