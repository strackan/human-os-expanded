/**
 * Contact Service — Unified contact and company store
 *
 * Merges data from entities + gft.contacts + relationships + opinions
 * into a single UnifiedContact / UnifiedCompany view.
 *
 * Used by both MCP tools and REST API.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ServiceContext, ServiceResult } from './types.js';

// =============================================================================
// TYPES
// =============================================================================

export interface UnifiedContact {
  // Entity fields
  entityId: string;
  slug: string;
  name: string;
  email?: string;

  // GFT-specific fields (optional)
  gftContactId?: string;
  linkedinUrl?: string;
  headline?: string;
  jobTitle?: string;
  company?: string;
  connectionDegree?: string;
  tier?: string;
  labels?: string[];

  // Relationship fields (optional)
  relationshipId?: string;
  relationshipType?: string;
  relationship?: string;
  lastContact?: string;
  sentiment?: string;
  contactFrequencyDays?: number;

  // Metadata
  sourceSystem?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedCompany {
  entityId: string;
  slug: string;
  name: string;

  // GFT-specific
  gftCompanyId?: string;
  linkedinUrl?: string;
  website?: string;
  industry?: string;
  description?: string;
  employeeCount?: number;
  companySize?: string;

  // Metadata
  sourceSystem?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertContactInput {
  name: string;
  email?: string;
  linkedinUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface UpsertCompanyInput {
  name: string;
  linkedinUrl?: string;
  website?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchContactsInput {
  query: string;
  limit?: number;
  offset?: number;
  filters?: {
    tier?: string;
    connectionDegree?: string;
    labels?: string[];
    hasEmail?: boolean;
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// =============================================================================
// SERVICE
// =============================================================================

export class ContactService {
  private supabase: SupabaseClient;
  private userId: string;

  constructor(ctx: ServiceContext) {
    this.supabase = ctx.supabase;
    this.userId = ctx.userId;
  }

  /**
   * Create or update a contact (entity + optional GFT record)
   */
  async upsertContact(input: UpsertContactInput): Promise<ServiceResult<UnifiedContact>> {
    const slug = slugify(input.name);

    // Upsert entity
    const { data: entity, error: entityError } = await this.supabase
      .from('entities')
      .upsert(
        {
          slug,
          entity_type: 'person',
          name: input.name,
          email: input.email || null,
          owner_id: this.userId,
          source_system: 'guyforthat',
          privacy_scope: 'private',
          metadata: input.metadata || {},
        },
        { onConflict: 'slug' }
      )
      .select('id, slug, name, email, source_system, created_at, updated_at')
      .single();

    if (entityError) {
      return { success: false, error: `Entity upsert failed: ${entityError.message}` };
    }

    // Upsert GFT contact (trigger will auto-bridge entity_id)
    let gftContact = null;
    if (input.linkedinUrl || input.email) {
      const { data } = await this.supabase
        .schema('gft')
        .from('contacts')
        .upsert(
          {
            owner_id: this.userId,
            entity_id: entity.id,
            name: input.name,
            email: input.email || null,
            linkedin_url: input.linkedinUrl || null,
          },
          { onConflict: 'linkedin_url', ignoreDuplicates: true }
        )
        .select('id, linkedin_url, headline, current_job_title, company, connection_degree, labels')
        .single();
      gftContact = data;
    }

    return {
      success: true,
      data: {
        entityId: entity.id,
        slug: entity.slug,
        name: entity.name,
        email: entity.email || undefined,
        gftContactId: gftContact?.id,
        linkedinUrl: gftContact?.linkedin_url || undefined,
        headline: gftContact?.headline || undefined,
        jobTitle: gftContact?.current_job_title || undefined,
        company: gftContact?.company || undefined,
        connectionDegree: gftContact?.connection_degree || undefined,
        labels: gftContact?.labels || undefined,
        sourceSystem: entity.source_system,
        createdAt: entity.created_at,
        updatedAt: entity.updated_at,
      },
    };
  }

  /**
   * Get a unified contact view (entity + GFT + relationship)
   */
  async getContact(slugOrId: string): Promise<ServiceResult<UnifiedContact>> {
    // Find entity
    const isUUID = /^[0-9a-f-]{36}$/i.test(slugOrId);
    const { data: entity } = await this.supabase
      .from('entities')
      .select('id, slug, name, email, source_system, created_at, updated_at')
      .eq(isUUID ? 'id' : 'slug', slugOrId)
      .eq('entity_type', 'person')
      .single();

    if (!entity) {
      return { success: false, error: `Contact not found: ${slugOrId}` };
    }

    // Get GFT contact
    const { data: gftContact } = await this.supabase
      .schema('gft')
      .from('contacts')
      .select('id, linkedin_url, headline, current_job_title, company, connection_degree, labels')
      .eq('entity_id', entity.id)
      .limit(1)
      .single();

    // Get relationship
    const { data: relationship } = await this.supabase
      .schema('founder_os')
      .from('relationships')
      .select('id, relationship, relationship_type, last_contact, sentiment, contact_frequency_days')
      .eq('entity_id', entity.id)
      .eq('user_id', this.userId)
      .limit(1)
      .single();

    return {
      success: true,
      data: {
        entityId: entity.id,
        slug: entity.slug,
        name: entity.name,
        email: entity.email || undefined,
        gftContactId: gftContact?.id,
        linkedinUrl: gftContact?.linkedin_url || undefined,
        headline: gftContact?.headline || undefined,
        jobTitle: gftContact?.current_job_title || undefined,
        company: gftContact?.company || undefined,
        connectionDegree: gftContact?.connection_degree || undefined,
        labels: gftContact?.labels || undefined,
        relationshipId: relationship?.id,
        relationshipType: relationship?.relationship_type || undefined,
        relationship: relationship?.relationship || undefined,
        lastContact: relationship?.last_contact || undefined,
        sentiment: relationship?.sentiment || undefined,
        contactFrequencyDays: relationship?.contact_frequency_days || undefined,
        sourceSystem: entity.source_system,
        createdAt: entity.created_at,
        updatedAt: entity.updated_at,
      },
    };
  }

  /**
   * Search contacts across entities + GFT contacts
   */
  async searchContacts(input: SearchContactsInput): Promise<ServiceResult<UnifiedContact[]>> {
    const limit = input.limit || 20;
    const offset = input.offset || 0;
    const query = input.query.toLowerCase();

    // Search entities
    const { data: entities } = await this.supabase
      .from('entities')
      .select('id, slug, name, email, source_system, created_at, updated_at')
      .eq('entity_type', 'person')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,slug.ilike.%${query}%`)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!entities || entities.length === 0) {
      // Fall back to GFT contacts search
      const { data: gftContacts } = await this.supabase
        .schema('gft')
        .from('contacts')
        .select('id, entity_id, name, email, linkedin_url, headline, current_job_title, company, connection_degree, labels, created_at, updated_at')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%,headline.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      return {
        success: true,
        data: (gftContacts || []).map(c => ({
          entityId: c.entity_id || '',
          slug: slugify(c.name),
          name: c.name,
          email: c.email || undefined,
          gftContactId: c.id,
          linkedinUrl: c.linkedin_url || undefined,
          headline: c.headline || undefined,
          jobTitle: c.current_job_title || undefined,
          company: c.company || undefined,
          connectionDegree: c.connection_degree || undefined,
          labels: c.labels || undefined,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        })),
      };
    }

    // Enrich entities with GFT data
    const entityIds = entities.map(e => e.id);
    const { data: gftContacts } = await this.supabase
      .schema('gft')
      .from('contacts')
      .select('id, entity_id, linkedin_url, headline, current_job_title, company, connection_degree, labels')
      .in('entity_id', entityIds);

    const gftMap = new Map((gftContacts || []).map(c => [c.entity_id, c]));

    return {
      success: true,
      data: entities.map(e => {
        const gft = gftMap.get(e.id);
        return {
          entityId: e.id,
          slug: e.slug,
          name: e.name,
          email: e.email || undefined,
          gftContactId: gft?.id,
          linkedinUrl: gft?.linkedin_url || undefined,
          headline: gft?.headline || undefined,
          jobTitle: gft?.current_job_title || undefined,
          company: gft?.company || undefined,
          connectionDegree: gft?.connection_degree || undefined,
          labels: gft?.labels || undefined,
          sourceSystem: e.source_system,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        };
      }),
    };
  }

  /**
   * Create or update a company
   */
  async upsertCompany(input: UpsertCompanyInput): Promise<ServiceResult<UnifiedCompany>> {
    const slug = slugify(input.name);

    const { data: entity, error: entityError } = await this.supabase
      .from('entities')
      .upsert(
        {
          slug,
          entity_type: 'company',
          name: input.name,
          owner_id: this.userId,
          source_system: 'guyforthat',
          privacy_scope: 'private',
          metadata: input.metadata || {},
        },
        { onConflict: 'slug' }
      )
      .select('id, slug, name, source_system, created_at, updated_at')
      .single();

    if (entityError) {
      return { success: false, error: `Entity upsert failed: ${entityError.message}` };
    }

    // Upsert GFT company
    let gftCompany = null;
    if (input.linkedinUrl || input.website) {
      const { data } = await this.supabase
        .schema('gft')
        .from('companies')
        .upsert(
          {
            owner_id: this.userId,
            entity_id: entity.id,
            name: input.name,
            linkedin_url: input.linkedinUrl || null,
            website: input.website || null,
          },
          { onConflict: 'linkedin_company_id', ignoreDuplicates: true }
        )
        .select('id, linkedin_url, website, industry, description, employee_count, company_size')
        .single();
      gftCompany = data;
    }

    return {
      success: true,
      data: {
        entityId: entity.id,
        slug: entity.slug,
        name: entity.name,
        gftCompanyId: gftCompany?.id,
        linkedinUrl: gftCompany?.linkedin_url || undefined,
        website: gftCompany?.website || undefined,
        industry: gftCompany?.industry || undefined,
        description: gftCompany?.description || undefined,
        employeeCount: gftCompany?.employee_count || undefined,
        companySize: gftCompany?.company_size || undefined,
        sourceSystem: entity.source_system,
        createdAt: entity.created_at,
        updatedAt: entity.updated_at,
      },
    };
  }

  /**
   * Get a unified company view
   */
  async getCompany(slugOrId: string): Promise<ServiceResult<UnifiedCompany>> {
    const isUUID = /^[0-9a-f-]{36}$/i.test(slugOrId);
    const { data: entity } = await this.supabase
      .from('entities')
      .select('id, slug, name, source_system, created_at, updated_at')
      .eq(isUUID ? 'id' : 'slug', slugOrId)
      .eq('entity_type', 'company')
      .single();

    if (!entity) {
      return { success: false, error: `Company not found: ${slugOrId}` };
    }

    const { data: gftCompany } = await this.supabase
      .schema('gft')
      .from('companies')
      .select('id, linkedin_url, website, industry, description, employee_count, company_size')
      .eq('entity_id', entity.id)
      .limit(1)
      .single();

    return {
      success: true,
      data: {
        entityId: entity.id,
        slug: entity.slug,
        name: entity.name,
        gftCompanyId: gftCompany?.id,
        linkedinUrl: gftCompany?.linkedin_url || undefined,
        website: gftCompany?.website || undefined,
        industry: gftCompany?.industry || undefined,
        description: gftCompany?.description || undefined,
        employeeCount: gftCompany?.employee_count || undefined,
        companySize: gftCompany?.company_size || undefined,
        sourceSystem: entity.source_system,
        createdAt: entity.created_at,
        updatedAt: entity.updated_at,
      },
    };
  }

  /**
   * Link a contact to a company via entity_links (works_at)
   */
  async linkContactToCompany(
    contactSlugOrId: string,
    companySlugOrId: string,
    layer: string
  ): Promise<ServiceResult<{ linked: boolean }>> {
    // Resolve contact slug
    const isContactUUID = /^[0-9a-f-]{36}$/i.test(contactSlugOrId);
    const { data: contactEntity } = await this.supabase
      .from('entities')
      .select('slug')
      .eq(isContactUUID ? 'id' : 'slug', contactSlugOrId)
      .single();

    if (!contactEntity) {
      return { success: false, error: `Contact not found: ${contactSlugOrId}` };
    }

    // Resolve company slug
    const isCompanyUUID = /^[0-9a-f-]{36}$/i.test(companySlugOrId);
    const { data: companyEntity } = await this.supabase
      .from('entities')
      .select('slug')
      .eq(isCompanyUUID ? 'id' : 'slug', companySlugOrId)
      .single();

    if (!companyEntity) {
      return { success: false, error: `Company not found: ${companySlugOrId}` };
    }

    // Create entity_link
    const { error } = await this.supabase
      .from('entity_links')
      .upsert(
        {
          layer,
          source_slug: contactEntity.slug,
          target_slug: companyEntity.slug,
          link_type: 'works_at',
          strength: 1.0,
        },
        { onConflict: 'layer,source_slug,target_slug,link_type' }
      );

    if (error) {
      return { success: false, error: `Failed to create link: ${error.message}` };
    }

    return { success: true, data: { linked: true } };
  }
}
