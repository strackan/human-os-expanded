/**
 * Contact Tools
 *
 * MCP tools for the unified contact/company store.
 * Merges data from entities + gft.contacts + relationships
 * into a single view.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { z } from 'zod';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const contactTools: Tool[] = [
  {
    name: 'add_contact',
    description: `Add or update a contact in the unified store. Creates an entity and optionally a GFT contact record.
Use when the user mentions a new person, imports contacts, or wants to track someone.`,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: "Person's full name" },
        email: { type: 'string', description: 'Email address' },
        linkedin_url: { type: 'string', description: 'LinkedIn profile URL' },
        company: { type: 'string', description: 'Company name (will create/link company entity)' },
        job_title: { type: 'string', description: 'Job title' },
        notes: { type: 'string', description: 'Any notes about this person' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_contact',
    description: `Get a unified contact view (entity + GFT data + relationship info). Use when looking up a person.`,
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Entity slug or UUID' },
        name: { type: 'string', description: 'Person name (alternative to slug)' },
      },
    },
  },
  {
    name: 'search_contacts',
    description: `Search contacts across all data sources — entities and GFT contacts.`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (name, email, company, headline)' },
        limit: { type: 'number', description: 'Max results (default 20)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'add_company',
    description: `Add or update a company in the unified store.`,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Company name' },
        linkedin_url: { type: 'string', description: 'LinkedIn company URL' },
        website: { type: 'string', description: 'Company website' },
        industry: { type: 'string', description: 'Industry vertical' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_company',
    description: `Get a unified company view.`,
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Entity slug or UUID' },
        name: { type: 'string', description: 'Company name (alternative to slug)' },
      },
    },
  },
  {
    name: 'link_contact_company',
    description: `Link a contact to a company (creates a "works_at" relationship in the knowledge graph).`,
    inputSchema: {
      type: 'object',
      properties: {
        contact_slug: { type: 'string', description: 'Contact entity slug or UUID' },
        company_slug: { type: 'string', description: 'Company entity slug or UUID' },
      },
      required: ['contact_slug', 'company_slug'],
    },
  },
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const AddContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().optional(),
  linkedin_url: z.string().optional(),
  company: z.string().optional(),
  job_title: z.string().optional(),
  notes: z.string().optional(),
});

const SearchContactsSchema = z.object({
  query: z.string().min(1),
  limit: z.number().optional(),
});

const AddCompanySchema = z.object({
  name: z.string().min(1),
  linkedin_url: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
});

// =============================================================================
// HELPERS
// =============================================================================

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// =============================================================================
// HANDLER
// =============================================================================

export async function handleContactTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  const supabase = ctx.getClient();

  switch (name) {
    case 'add_contact': {
      const input = AddContactSchema.parse(args);
      const slug = slugify(input.name);

      // Upsert entity
      const { data: entity, error: entityError } = await supabase
        .from('entities')
        .upsert(
          {
            slug,
            entity_type: 'person',
            name: input.name,
            email: input.email || null,
            owner_id: ctx.userUUID,
            source_system: 'guyforthat',
            privacy_scope: 'private',
            metadata: {
              ...(input.job_title ? { job_title: input.job_title } : {}),
              ...(input.notes ? { notes: input.notes } : {}),
            },
          },
          { onConflict: 'slug' }
        )
        .select('id, slug, name, email, created_at, updated_at')
        .single();

      if (entityError) throw new Error(`Failed to create contact entity: ${entityError.message}`);

      // Create GFT contact if we have enrichment data
      let gftContact = null;
      if (input.linkedin_url || input.email) {
        const gftData: Record<string, unknown> = {
          owner_id: ctx.userUUID,
          entity_id: entity.id,
          name: input.name,
          email: input.email || null,
          linkedin_url: input.linkedin_url || null,
          current_job_title: input.job_title || null,
          company: input.company || null,
          notes: input.notes || null,
        };

        const { data } = await supabase
          .schema('gft')
          .from('contacts')
          .upsert(gftData, { onConflict: 'linkedin_url', ignoreDuplicates: true })
          .select('id, linkedin_url, current_job_title, company')
          .single();
        gftContact = data;
      }

      // Link to company if provided
      if (input.company) {
        const companySlug = slugify(input.company);
        await supabase
          .from('entities')
          .upsert(
            {
              slug: companySlug,
              entity_type: 'company',
              name: input.company,
              owner_id: ctx.userUUID,
              source_system: 'guyforthat',
              privacy_scope: 'private',
            },
            { onConflict: 'slug' }
          );

        // Create works_at link
        await supabase
          .from('entity_links')
          .upsert(
            {
              layer: ctx.layer,
              source_slug: slug,
              target_slug: companySlug,
              link_type: 'works_at',
              strength: 1.0,
            },
            { onConflict: 'layer,source_slug,target_slug,link_type' }
          );
      }

      return {
        success: true,
        contact: {
          entityId: entity.id,
          slug: entity.slug,
          name: entity.name,
          email: entity.email,
          gftContactId: gftContact?.id,
          linkedinUrl: gftContact?.linkedin_url,
          jobTitle: gftContact?.current_job_title,
          company: gftContact?.company || input.company,
        },
        message: `Contact ${input.name} added to unified store.`,
      };
    }

    case 'get_contact': {
      const { slug, name: personName } = z.object({
        slug: z.string().optional(),
        name: z.string().optional(),
      }).parse(args);

      let entitySlug = slug;
      if (!entitySlug && personName) {
        entitySlug = slugify(personName);
      }

      if (!entitySlug) {
        return { success: false, error: 'MISSING_ID', message: 'Provide slug or name.' };
      }

      // Try by slug, then by name search
      const isUUID = /^[0-9a-f-]{36}$/i.test(entitySlug);
      let entity;

      if (isUUID) {
        const { data } = await supabase
          .from('entities')
          .select('id, slug, name, email, source_system, created_at, updated_at')
          .eq('id', entitySlug)
          .single();
        entity = data;
      } else {
        const { data } = await supabase
          .from('entities')
          .select('id, slug, name, email, source_system, created_at, updated_at')
          .eq('slug', entitySlug)
          .eq('entity_type', 'person')
          .single();
        entity = data;

        // Fall back to name search
        if (!entity && personName) {
          const { data: byName } = await supabase
            .from('entities')
            .select('id, slug, name, email, source_system, created_at, updated_at')
            .eq('entity_type', 'person')
            .ilike('name', `%${personName}%`)
            .limit(1)
            .single();
          entity = byName;
        }
      }

      if (!entity) {
        return { success: false, error: 'NOT_FOUND', message: `Contact "${entitySlug || personName}" not found.` };
      }

      // Get GFT contact
      const { data: gftContact } = await supabase
        .schema('gft')
        .from('contacts')
        .select('id, linkedin_url, headline, current_job_title, company, connection_degree, labels, notes')
        .eq('entity_id', entity.id)
        .limit(1)
        .single();

      // Get relationship
      const { data: relationship } = await supabase
        .schema('founder_os')
        .from('relationships')
        .select('id, relationship, relationship_type, last_contact, sentiment, contact_frequency_days, notes')
        .eq('entity_id', entity.id)
        .eq('user_id', ctx.userUUID)
        .limit(1)
        .single();

      // Get company links
      const { data: companyLinks } = await supabase
        .from('entity_links')
        .select('target_slug')
        .eq('source_slug', entity.slug)
        .eq('link_type', 'works_at');

      let companies: Array<{ slug: string; name: string }> = [];
      if (companyLinks && companyLinks.length > 0) {
        const { data: companyEntities } = await supabase
          .from('entities')
          .select('slug, name')
          .in('slug', companyLinks.map(l => l.target_slug));
        companies = companyEntities || [];
      }

      return {
        success: true,
        contact: {
          entityId: entity.id,
          slug: entity.slug,
          name: entity.name,
          email: entity.email,
          source: entity.source_system,
          // GFT fields
          gftContactId: gftContact?.id,
          linkedinUrl: gftContact?.linkedin_url,
          headline: gftContact?.headline,
          jobTitle: gftContact?.current_job_title,
          company: gftContact?.company,
          connectionDegree: gftContact?.connection_degree,
          labels: gftContact?.labels,
          gftNotes: gftContact?.notes,
          // Relationship
          relationship: relationship ? {
            id: relationship.id,
            type: relationship.relationship_type,
            description: relationship.relationship,
            lastContact: relationship.last_contact,
            sentiment: relationship.sentiment,
            notes: relationship.notes,
          } : null,
          // Companies
          companies,
          createdAt: entity.created_at,
          updatedAt: entity.updated_at,
        },
      };
    }

    case 'search_contacts': {
      const input = SearchContactsSchema.parse(args);
      const limit = input.limit || 20;
      const query = input.query;

      // Search entities
      const { data: entities } = await supabase
        .from('entities')
        .select('id, slug, name, email, source_system, updated_at')
        .eq('entity_type', 'person')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,slug.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(limit);

      // Also search GFT contacts for company/headline matches
      const { data: gftMatches } = await supabase
        .schema('gft')
        .from('contacts')
        .select('entity_id, name, email, company, headline, current_job_title')
        .or(`company.ilike.%${query}%,headline.ilike.%${query}%`)
        .not('entity_id', 'in', `(${(entities || []).map(e => e.id).join(',') || '00000000-0000-0000-0000-000000000000'})`)
        .limit(limit);

      // Merge results
      const results = (entities || []).map(e => ({
        entityId: e.id,
        slug: e.slug,
        name: e.name,
        email: e.email,
        source: e.source_system,
      }));

      // Add GFT-only matches
      for (const gft of gftMatches || []) {
        if (gft.entity_id && !results.some(r => r.entityId === gft.entity_id)) {
          results.push({
            entityId: gft.entity_id,
            slug: slugify(gft.name),
            name: gft.name,
            email: gft.email,
            source: 'guyforthat',
          });
        }
      }

      return {
        success: true,
        contacts: results,
        count: results.length,
        query: input.query,
      };
    }

    case 'add_company': {
      const input = AddCompanySchema.parse(args);
      const slug = slugify(input.name);

      const { data: entity, error } = await supabase
        .from('entities')
        .upsert(
          {
            slug,
            entity_type: 'company',
            name: input.name,
            owner_id: ctx.userUUID,
            source_system: 'guyforthat',
            privacy_scope: 'private',
            metadata: {
              ...(input.industry ? { industry: input.industry } : {}),
            },
          },
          { onConflict: 'slug' }
        )
        .select('id, slug, name, created_at')
        .single();

      if (error) throw new Error(`Failed to create company: ${error.message}`);

      // Create GFT company
      let gftCompany = null;
      if (input.linkedin_url || input.website) {
        const { data } = await supabase
          .schema('gft')
          .from('companies')
          .upsert(
            {
              owner_id: ctx.userUUID,
              entity_id: entity.id,
              name: input.name,
              linkedin_url: input.linkedin_url || null,
              website: input.website || null,
              industry: input.industry || null,
            },
            { onConflict: 'linkedin_company_id', ignoreDuplicates: true }
          )
          .select('id, linkedin_url, website, industry')
          .single();
        gftCompany = data;
      }

      return {
        success: true,
        company: {
          entityId: entity.id,
          slug: entity.slug,
          name: entity.name,
          gftCompanyId: gftCompany?.id,
          linkedinUrl: gftCompany?.linkedin_url,
          website: gftCompany?.website,
          industry: gftCompany?.industry,
        },
        message: `Company ${input.name} added.`,
      };
    }

    case 'get_company': {
      const { slug, name: companyName } = z.object({
        slug: z.string().optional(),
        name: z.string().optional(),
      }).parse(args);

      let entitySlug = slug;
      if (!entitySlug && companyName) {
        entitySlug = slugify(companyName);
      }

      if (!entitySlug) {
        return { success: false, error: 'MISSING_ID', message: 'Provide slug or name.' };
      }

      const isUUID = /^[0-9a-f-]{36}$/i.test(entitySlug);
      const { data: entity } = await supabase
        .from('entities')
        .select('id, slug, name, source_system, created_at, updated_at')
        .eq(isUUID ? 'id' : 'slug', entitySlug)
        .eq('entity_type', 'company')
        .single();

      if (!entity) {
        return { success: false, error: 'NOT_FOUND', message: `Company "${entitySlug}" not found.` };
      }

      const { data: gftCompany } = await supabase
        .schema('gft')
        .from('companies')
        .select('id, linkedin_url, website, industry, description, employee_count, company_size, headquarters')
        .eq('entity_id', entity.id)
        .limit(1)
        .single();

      // Get employees
      const { data: employeeLinks } = await supabase
        .from('entity_links')
        .select('source_slug')
        .eq('target_slug', entity.slug)
        .eq('link_type', 'works_at');

      let employees: Array<{ slug: string; name: string }> = [];
      if (employeeLinks && employeeLinks.length > 0) {
        const { data: empEntities } = await supabase
          .from('entities')
          .select('slug, name')
          .in('slug', employeeLinks.map(l => l.source_slug));
        employees = empEntities || [];
      }

      return {
        success: true,
        company: {
          entityId: entity.id,
          slug: entity.slug,
          name: entity.name,
          gftCompanyId: gftCompany?.id,
          linkedinUrl: gftCompany?.linkedin_url,
          website: gftCompany?.website,
          industry: gftCompany?.industry,
          description: gftCompany?.description,
          employeeCount: gftCompany?.employee_count,
          companySize: gftCompany?.company_size,
          headquarters: gftCompany?.headquarters,
          employees,
        },
      };
    }

    case 'link_contact_company': {
      const { contact_slug, company_slug } = z.object({
        contact_slug: z.string().min(1),
        company_slug: z.string().min(1),
      }).parse(args);

      // Resolve slugs
      const isContactUUID = /^[0-9a-f-]{36}$/i.test(contact_slug);
      const { data: contactEntity } = await supabase
        .from('entities')
        .select('slug, name')
        .eq(isContactUUID ? 'id' : 'slug', contact_slug)
        .single();

      if (!contactEntity) {
        return { success: false, error: 'CONTACT_NOT_FOUND', message: `Contact "${contact_slug}" not found.` };
      }

      const isCompanyUUID = /^[0-9a-f-]{36}$/i.test(company_slug);
      const { data: companyEntity } = await supabase
        .from('entities')
        .select('slug, name')
        .eq(isCompanyUUID ? 'id' : 'slug', company_slug)
        .single();

      if (!companyEntity) {
        return { success: false, error: 'COMPANY_NOT_FOUND', message: `Company "${company_slug}" not found.` };
      }

      const { error } = await supabase
        .from('entity_links')
        .upsert(
          {
            layer: ctx.layer,
            source_slug: contactEntity.slug,
            target_slug: companyEntity.slug,
            link_type: 'works_at',
            strength: 1.0,
          },
          { onConflict: 'layer,source_slug,target_slug,link_type' }
        );

      if (error) throw new Error(`Failed to create link: ${error.message}`);

      return {
        success: true,
        message: `Linked ${contactEntity.name} → works at → ${companyEntity.name}`,
        link: {
          contact: contactEntity.slug,
          company: companyEntity.slug,
          linkType: 'works_at',
        },
      };
    }

    default:
      return null;
  }
}
