/**
 * Renubu External Enrichment Tools
 *
 * Provides public/external intelligence from GFT for Renubu workflows.
 *
 * PERMISSION BOUNDARY:
 * - CAN access: gft.contacts, gft.companies, gft.activities, gft.li_posts
 * - CANNOT access: founder_os.*, powerpak.*, personal context files
 */

import { createClient } from '@supabase/supabase-js';

export interface ContactEnrichmentResult {
  found: boolean;
  contact?: {
    name: string;
    linkedin_url?: string;
    headline?: string;
    current_job_title?: string;
    location?: string;
    about?: string;
    recent_posts?: Array<{
      content: string;
      posted_at: string;
      engagement: {
        likes: number;
        comments: number;
      };
    }>;
    activity_summary?: {
      last_scraped: string;
      total_activities: number;
    };
  };
  matching_contacts?: Array<{
    id: string;
    name: string;
    headline?: string;
    company?: string;
    match_score: number;
  }>;
}

export interface CompanyEnrichmentResult {
  found: boolean;
  company?: {
    name: string;
    linkedin_url?: string;
    industry?: string;
    company_size?: string;
    headquarters?: string;
    about?: string;
    known_contacts?: Array<{
      name: string;
      title?: string;
      linkedin_url?: string;
    }>;
    recent_activity?: {
      last_updated: string;
      contact_count: number;
    };
  };
  matching_companies?: Array<{
    id: string;
    name: string;
    industry?: string;
    match_score: number;
  }>;
}

export interface FullEnrichmentResult {
  contact: ContactEnrichmentResult;
  company: CompanyEnrichmentResult;
  triangulation_hints: {
    shared_connections: string[];
    industry_context: string;
    relationship_signals: string[];
  };
}

/**
 * Search for and enrich a contact from GFT data
 */
export async function enrichContact(
  supabaseUrl: string,
  supabaseKey: string,
  params: {
    contact_name?: string;
    contact_email?: string;
    contact_linkedin_url?: string;
    company_name?: string;
  }
): Promise<ContactEnrichmentResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Build query based on available parameters
  let query = supabase
    .schema('gft')
    .from('contacts')
    .select(`
      id,
      name,
      linkedin_url,
      headline,
      current_job_title,
      location,
      about,
      company,
      last_scraped_at,
      li_posts (
        content,
        posted_at,
        likes_count,
        comments_count
      ),
      activities (
        activity_type,
        occurred_at
      )
    `);

  // Priority: LinkedIn URL > Email > Name + Company
  if (params.contact_linkedin_url) {
    query = query.eq('linkedin_url', params.contact_linkedin_url);
  } else if (params.contact_email) {
    query = query.eq('email', params.contact_email);
  } else if (params.contact_name) {
    query = query.ilike('name', `%${params.contact_name}%`);
    if (params.company_name) {
      query = query.ilike('company', `%${params.company_name}%`);
    }
  } else {
    return { found: false };
  }

  const { data: contacts, error } = await query.limit(5);

  if (error) {
    console.error('Error enriching contact:', error);
    return { found: false };
  }

  if (!contacts || contacts.length === 0) {
    return { found: false };
  }

  // If exact match (1 result or LinkedIn URL match)
  if (contacts.length === 1 || params.contact_linkedin_url) {
    const contact = contacts[0];
    return {
      found: true,
      contact: {
        name: contact.name,
        linkedin_url: contact.linkedin_url,
        headline: contact.headline,
        current_job_title: contact.current_job_title,
        location: contact.location,
        about: contact.about,
        recent_posts: (contact.li_posts || []).slice(0, 5).map((post: any) => ({
          content: post.content?.substring(0, 500),
          posted_at: post.posted_at,
          engagement: {
            likes: post.likes_count || 0,
            comments: post.comments_count || 0,
          },
        })),
        activity_summary: {
          last_scraped: contact.last_scraped_at,
          total_activities: (contact.activities || []).length,
        },
      },
    };
  }

  // Multiple matches - return list for disambiguation
  return {
    found: false,
    matching_contacts: contacts.map((c: any) => ({
      id: c.id,
      name: c.name,
      headline: c.headline,
      company: c.company,
      match_score: calculateMatchScore(c, params),
    })),
  };
}

/**
 * Search for and enrich a company from GFT data
 */
export async function enrichCompany(
  supabaseUrl: string,
  supabaseKey: string,
  params: {
    company_name?: string;
    company_domain?: string;
    company_linkedin_url?: string;
  }
): Promise<CompanyEnrichmentResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  let query = supabase
    .schema('gft')
    .from('companies')
    .select(`
      id,
      name,
      linkedin_url,
      industry,
      company_size,
      headquarters,
      about,
      website,
      updated_at
    `);

  if (params.company_linkedin_url) {
    query = query.eq('linkedin_url', params.company_linkedin_url);
  } else if (params.company_domain) {
    query = query.ilike('website', `%${params.company_domain}%`);
  } else if (params.company_name) {
    query = query.ilike('name', `%${params.company_name}%`);
  } else {
    return { found: false };
  }

  const { data: companies, error } = await query.limit(5);

  if (error) {
    console.error('Error enriching company:', error);
    return { found: false };
  }

  if (!companies || companies.length === 0) {
    return { found: false };
  }

  // If exact match
  if (companies.length === 1 || params.company_linkedin_url) {
    const company = companies[0];

    // Get known contacts at this company
    const { data: contacts } = await supabase
      .schema('gft')
      .from('contacts')
      .select('name, current_job_title, linkedin_url')
      .eq('company_id', company.id)
      .limit(10);

    return {
      found: true,
      company: {
        name: company.name,
        linkedin_url: company.linkedin_url,
        industry: company.industry,
        company_size: company.company_size,
        headquarters: company.headquarters,
        about: company.about,
        known_contacts: (contacts || []).map((c: any) => ({
          name: c.name,
          title: c.current_job_title,
          linkedin_url: c.linkedin_url,
        })),
        recent_activity: {
          last_updated: company.updated_at,
          contact_count: contacts?.length || 0,
        },
      },
    };
  }

  // Multiple matches
  return {
    found: false,
    matching_companies: companies.map((c: any) => ({
      id: c.id,
      name: c.name,
      industry: c.industry,
      match_score: calculateCompanyMatchScore(c, params),
    })),
  };
}

/**
 * Full enrichment - contact + company + triangulation hints
 */
export async function getFullEnrichment(
  supabaseUrl: string,
  supabaseKey: string,
  params: {
    contact_name?: string;
    contact_email?: string;
    contact_linkedin_url?: string;
    company_name?: string;
    company_domain?: string;
  }
): Promise<FullEnrichmentResult> {
  const [contactResult, companyResult] = await Promise.all([
    enrichContact(supabaseUrl, supabaseKey, {
      contact_name: params.contact_name,
      contact_email: params.contact_email,
      contact_linkedin_url: params.contact_linkedin_url,
      company_name: params.company_name,
    }),
    enrichCompany(supabaseUrl, supabaseKey, {
      company_name: params.company_name,
      company_domain: params.company_domain,
    }),
  ]);

  // Generate triangulation hints based on what we found
  const hints = generateTriangulationHints(contactResult, companyResult);

  return {
    contact: contactResult,
    company: companyResult,
    triangulation_hints: hints,
  };
}

/**
 * Calculate match score for contact disambiguation
 */
function calculateMatchScore(
  contact: any,
  params: { contact_name?: string; company_name?: string }
): number {
  let score = 0;

  if (params.contact_name) {
    const nameMatch = contact.name.toLowerCase().includes(params.contact_name.toLowerCase());
    if (nameMatch) score += 50;
    if (contact.name.toLowerCase() === params.contact_name.toLowerCase()) score += 30;
  }

  if (params.company_name && contact.company) {
    const companyMatch = contact.company.toLowerCase().includes(params.company_name.toLowerCase());
    if (companyMatch) score += 20;
  }

  return score;
}

/**
 * Calculate match score for company disambiguation
 */
function calculateCompanyMatchScore(
  company: any,
  params: { company_name?: string; company_domain?: string }
): number {
  let score = 0;

  if (params.company_name) {
    const nameMatch = company.name.toLowerCase().includes(params.company_name.toLowerCase());
    if (nameMatch) score += 50;
    if (company.name.toLowerCase() === params.company_name.toLowerCase()) score += 30;
  }

  if (params.company_domain && company.website) {
    const domainMatch = company.website.toLowerCase().includes(params.company_domain.toLowerCase());
    if (domainMatch) score += 20;
  }

  return score;
}

/**
 * Generate triangulation hints from enrichment results
 */
function generateTriangulationHints(
  contactResult: ContactEnrichmentResult,
  companyResult: CompanyEnrichmentResult
): {
  shared_connections: string[];
  industry_context: string;
  relationship_signals: string[];
} {
  const hints = {
    shared_connections: [] as string[],
    industry_context: '',
    relationship_signals: [] as string[],
  };

  // Industry context
  if (companyResult.found && companyResult.company?.industry) {
    hints.industry_context = companyResult.company.industry;
  }

  // Known contacts at the company (potential warm intros)
  if (companyResult.found && companyResult.company?.known_contacts) {
    hints.shared_connections = companyResult.company.known_contacts
      .map(c => c.name)
      .slice(0, 5);
  }

  // Relationship signals from contact activity
  if (contactResult.found && contactResult.contact?.recent_posts) {
    const posts = contactResult.contact.recent_posts;
    if (posts.length > 0) {
      hints.relationship_signals.push(`Active on LinkedIn (${posts.length} recent posts)`);
    }

    // Check for high engagement
    const avgEngagement = posts.reduce((sum, p) => sum + p.engagement.likes + p.engagement.comments, 0) / posts.length;
    if (avgEngagement > 50) {
      hints.relationship_signals.push('High LinkedIn engagement');
    }
  }

  if (contactResult.found && contactResult.contact?.headline) {
    // Look for seniority signals
    const headline = contactResult.contact.headline.toLowerCase();
    if (headline.includes('vp') || headline.includes('director') || headline.includes('head of')) {
      hints.relationship_signals.push('Senior leadership role');
    }
    if (headline.includes('founder') || headline.includes('ceo') || headline.includes('cto')) {
      hints.relationship_signals.push('Executive/Founder');
    }
  }

  return hints;
}
