/**
 * INTEL Service
 *
 * Reads customer, contact, and user INTEL files to provide context for LLM interactions.
 *
 * Storage Strategy:
 * - Production/Staging: Fetches from Supabase Storage bucket 'intel'
 * - Local Development: Falls back to filesystem (skills/ folder) if Supabase fails
 *
 * IMPORTANT: This service can ONLY run server-side.
 * It should only be imported by:
 * - API routes (src/app/api/*)
 * - Server Components without 'use client'
 * - Server Actions
 */

import { createClient } from '@supabase/supabase-js';

// Conditionally import fs for local fallback (only works server-side)
let fs: typeof import('fs').promises | null = null;
let path: typeof import('path') | null = null;

// Dynamic import for server-side only
async function getFileSystemModules() {
  if (typeof window === 'undefined' && !fs) {
    const fsModule = await import('fs');
    const pathModule = await import('path');
    fs = fsModule.promises;
    path = pathModule.default;
  }
  return { fs, path };
}

/**
 * Create Supabase client with service role for storage access
 *
 * Note: INTEL bucket is in the staging project (amugmkrihnjsxlpwdzcy)
 * Use STAGING_SUPABASE_URL and STAGING_SUPABASE_SERVICE_ROLE_KEY env vars
 */
function createStorageClient() {
  // INTEL bucket is in staging project - use staging credentials if available
  const STAGING_URL = 'https://amugmkrihnjsxlpwdzcy.supabase.co';
  const supabaseUrl = process.env.STAGING_SUPABASE_URL || STAGING_URL;
  const serviceRoleKey = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[INTELService] Missing Supabase credentials for storage access');
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });
}

const INTEL_BUCKET = 'intel';

/**
 * Simple YAML-like frontmatter parser
 * Parses the content between --- markers
 */
function parseFrontmatter(content: string): { data: Record<string, any>; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content };
  }

  const frontmatterContent = match[1];
  const bodyContent = match[2];

  // Parse simple YAML key-value pairs
  const data: Record<string, any> = {};
  const lines = frontmatterContent.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value: any = line.slice(colonIndex + 1).trim();

    // Handle boolean values
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    // Handle numeric values
    else if (!isNaN(Number(value)) && value !== '') value = Number(value);
    // Remove quotes if present
    else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    data[key] = value;
  }

  return { data, content: bodyContent };
}

export interface CustomerINTEL {
  customer_id: string;
  name: string;
  domain: string;
  industry: string;
  tier: string;
  arr: number;
  health_score: number;
  risk_score: number;
  opportunity_score: number;
  renewal_date: string;
  content: string; // Full markdown content
  frontmatter: Record<string, any>;
}

export interface ContactINTEL {
  contact_id: string;
  customer_id: string;
  name: string;
  role: string;
  email?: string;
  is_primary: boolean;
  relationship_strength: 'strong' | 'moderate' | 'weak';
  content: string;
  frontmatter: Record<string, any>;
}

export interface UserINTEL {
  user_id: string;
  name: string;
  email: string;
  role: string;
  content: string;
  frontmatter: Record<string, any>;
}

export interface INTELContext {
  customer?: CustomerINTEL;
  contacts?: ContactINTEL[];
  user?: UserINTEL;
}

/**
 * Convert customer name to folder name
 * e.g., "GrowthStack" -> "growthstack"
 * e.g., "TechCorp Solutions" -> "techcorp-solutions"
 */
function customerNameToFolderName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Read INTEL file from Supabase Storage
 */
async function readFromSupabase(storagePath: string): Promise<string | null> {
  const supabase = createStorageClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.storage
      .from(INTEL_BUCKET)
      .download(storagePath);

    if (error) {
      console.warn(`[INTELService] Supabase storage error for ${storagePath}:`, error.message);
      return null;
    }

    if (!data) {
      console.warn(`[INTELService] No data returned for ${storagePath}`);
      return null;
    }

    const content = await data.text();
    console.log(`[INTELService] Successfully read from Supabase: ${storagePath} (${content.length} chars)`);
    return content;
  } catch (error) {
    console.warn(`[INTELService] Error reading from Supabase: ${storagePath}`, error);
    return null;
  }
}

/**
 * Read INTEL file from local filesystem (fallback for development)
 */
async function readFromFilesystem(relativePath: string): Promise<string | null> {
  const { fs: fsModule, path: pathModule } = await getFileSystemModules();
  if (!fsModule || !pathModule) return null;

  try {
    const skillsDir = pathModule.join(process.cwd(), 'skills');
    const fullPath = pathModule.join(skillsDir, relativePath);
    const content = await fsModule.readFile(fullPath, 'utf-8');
    console.log(`[INTELService] Successfully read from filesystem: ${relativePath} (${content.length} chars)`);
    return content;
  } catch (error) {
    // Don't warn for filesystem fallback failures - it's expected in production
    return null;
  }
}

/**
 * Read INTEL file with Supabase-first, filesystem fallback strategy
 */
async function readINTELFile(relativePath: string): Promise<{ frontmatter: Record<string, any>; content: string } | null> {
  // Try Supabase Storage first
  let fileContent = await readFromSupabase(relativePath);

  // Fall back to filesystem for local development
  if (!fileContent) {
    fileContent = await readFromFilesystem(relativePath);
  }

  if (!fileContent) {
    console.warn(`[INTELService] Could not read INTEL file from any source: ${relativePath}`);
    return null;
  }

  const { data: frontmatter, content } = parseFrontmatter(fileContent);
  return { frontmatter, content };
}

/**
 * List files in a Supabase Storage folder
 */
async function listSupabaseFolder(folderPath: string): Promise<string[]> {
  const supabase = createStorageClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.storage
      .from(INTEL_BUCKET)
      .list(folderPath);

    if (error) {
      console.warn(`[INTELService] Error listing folder ${folderPath}:`, error.message);
      return [];
    }

    return (data || [])
      .filter(item => item.name.endsWith('.md'))
      .map(item => item.name);
  } catch (error) {
    console.warn(`[INTELService] Error listing folder ${folderPath}:`, error);
    return [];
  }
}

/**
 * List files in a local filesystem folder
 */
async function listFilesystemFolder(relativePath: string): Promise<string[]> {
  const { fs: fsModule, path: pathModule } = await getFileSystemModules();
  if (!fsModule || !pathModule) return [];

  try {
    const skillsDir = pathModule.join(process.cwd(), 'skills');
    const fullPath = pathModule.join(skillsDir, relativePath);
    const files = await fsModule.readdir(fullPath);
    return files.filter(f => f.endsWith('.md'));
  } catch (error) {
    return [];
  }
}

/**
 * Read customer INTEL file
 */
export async function getCustomerINTEL(customerName: string): Promise<CustomerINTEL | null> {
  const folderName = customerNameToFolderName(customerName);
  const relativePath = `customers/${folderName}/INTEL.md`;

  const result = await readINTELFile(relativePath);
  if (!result) return null;

  const { frontmatter, content } = result;

  return {
    customer_id: frontmatter.customer_id || '',
    name: frontmatter.name || customerName,
    domain: frontmatter.domain || '',
    industry: frontmatter.industry || '',
    tier: frontmatter.tier || 'standard',
    arr: frontmatter.arr || 0,
    health_score: frontmatter.health_score || 0,
    risk_score: frontmatter.risk_score || 0,
    opportunity_score: frontmatter.opportunity_score || 0,
    renewal_date: frontmatter.renewal_date || '',
    content,
    frontmatter,
  };
}

/**
 * Read all contact INTEL files for a customer
 */
export async function getContactsINTEL(customerName: string): Promise<ContactINTEL[]> {
  const folderName = customerNameToFolderName(customerName);
  const contactsFolderPath = `customers/${folderName}/contacts`;

  // Try Supabase first, then filesystem
  let files = await listSupabaseFolder(contactsFolderPath);
  if (files.length === 0) {
    files = await listFilesystemFolder(contactsFolderPath);
  }

  const contacts: ContactINTEL[] = [];

  for (const file of files) {
    const relativePath = `${contactsFolderPath}/${file}`;
    const result = await readINTELFile(relativePath);
    if (!result) continue;

    const { frontmatter, content } = result;

    contacts.push({
      contact_id: frontmatter.contact_id || '',
      customer_id: frontmatter.customer_id || '',
      name: frontmatter.name || '',
      role: frontmatter.role || '',
      email: frontmatter.email,
      is_primary: frontmatter.is_primary || false,
      relationship_strength: frontmatter.relationship_strength || 'moderate',
      content,
      frontmatter,
    });
  }

  // Sort by primary first, then by name
  return contacts.sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Read user INTEL file (CSM profile)
 */
export async function getUserINTEL(userId: string): Promise<UserINTEL | null> {
  const relativePath = `users/${userId}.md`;

  const result = await readINTELFile(relativePath);
  if (!result) return null;

  const { frontmatter, content } = result;

  return {
    user_id: frontmatter.user_id || userId,
    name: frontmatter.name || '',
    email: frontmatter.email || '',
    role: frontmatter.role || '',
    content,
    frontmatter,
  };
}

/**
 * Get full INTEL context for a workflow
 *
 * This is the main entry point - it gathers all three layers of INTEL:
 * 1. Customer INTEL (company-level context)
 * 2. Contact INTEL (stakeholder-level context)
 * 3. User INTEL (CSM/user preferences)
 */
export async function getINTELContext(
  customerName: string,
  userId: string = 'grace'
): Promise<INTELContext> {
  console.log(`[INTELService] Getting INTEL context for customer: ${customerName}, user: ${userId}`);

  const [customer, contacts, user] = await Promise.all([
    getCustomerINTEL(customerName),
    getContactsINTEL(customerName),
    getUserINTEL(userId),
  ]);

  const result = {
    customer: customer || undefined,
    contacts: contacts.length > 0 ? contacts : undefined,
    user: user || undefined,
  };

  console.log(`[INTELService] INTEL context result:`, {
    hasCustomer: !!result.customer,
    contactCount: result.contacts?.length || 0,
    hasUser: !!result.user,
  });

  return result;
}

/**
 * Build a concise summary of INTEL context for LLM system prompt
 *
 * This creates a structured summary that gives the LLM enough context
 * to provide personalized, informed guidance.
 */
export function buildINTELSummary(context: INTELContext): string {
  const sections: string[] = [];

  if (context.customer) {
    const c = context.customer;
    sections.push(`## Customer: ${c.name}
- **Industry:** ${c.industry}
- **Tier:** ${c.tier} | **ARR:** $${c.arr.toLocaleString()}
- **Health Score:** ${c.health_score}/100 | **Risk Score:** ${c.risk_score}/100 | **Opportunity Score:** ${c.opportunity_score}/100
- **Renewal Date:** ${c.renewal_date}

${extractKeyInsights(c.content)}`);
  }

  if (context.contacts && context.contacts.length > 0) {
    const contactSummaries = context.contacts.map(contact => {
      const primary = contact.is_primary ? ' (Primary)' : '';
      const strength = contact.relationship_strength;
      return `- **${contact.name}**${primary}: ${contact.role} - Relationship: ${strength}`;
    });

    sections.push(`## Key Contacts
${contactSummaries.join('\n')}`);

    // Add detailed context for primary contact
    const primaryContact = context.contacts.find(c => c.is_primary);
    if (primaryContact) {
      sections.push(`### Primary Contact Details: ${primaryContact.name}
${extractKeyInsights(primaryContact.content, 3)}`);
    }
  }

  if (context.user) {
    sections.push(`## CSM Profile: ${context.user.name}
${extractKeyInsights(context.user.content, 2)}`);
  }

  return sections.join('\n\n');
}

/**
 * Extract key insights from markdown content
 *
 * Pulls out the most important sections for LLM context
 */
function extractKeyInsights(content: string, maxSections: number = 5): string {
  const lines = content.split('\n');
  const insights: string[] = [];
  let currentSection = '';
  let sectionContent: string[] = [];
  let sectionsFound = 0;

  // Priority sections to extract
  const prioritySections = [
    'strategic context',
    'risk factors',
    'expansion opportunities',
    'recent updates',
    'upcoming',
    'goals & motivations',
    'key concerns',
    'leverage points',
    'current priorities',
  ];

  for (const line of lines) {
    if (line.startsWith('## ') || line.startsWith('### ')) {
      // Save previous section if it was a priority
      if (currentSection && sectionContent.length > 0 && sectionsFound < maxSections) {
        const sectionTitle = currentSection.toLowerCase().replace(/^#+\s*/, '');
        if (prioritySections.some(p => sectionTitle.includes(p))) {
          insights.push(`**${currentSection.replace(/^#+\s*/, '')}:**\n${sectionContent.slice(0, 5).join('\n')}`);
          sectionsFound++;
        }
      }

      currentSection = line;
      sectionContent = [];
    } else if (line.trim()) {
      sectionContent.push(line);
    }
  }

  // Check last section
  if (currentSection && sectionContent.length > 0 && sectionsFound < maxSections) {
    const sectionTitle = currentSection.toLowerCase().replace(/^#+\s*/, '');
    if (prioritySections.some(p => sectionTitle.includes(p))) {
      insights.push(`**${currentSection.replace(/^#+\s*/, '')}:**\n${sectionContent.slice(0, 5).join('\n')}`);
    }
  }

  return insights.join('\n\n');
}

/**
 * Build greeting slide context from INTEL
 *
 * Creates a personalized greeting message based on customer intelligence.
 */
export function buildGreetingContext(context: INTELContext): {
  greetingText: string;
  summary: string;
  keyMetrics: { label: string; value: string | number; trend?: 'up' | 'down' | 'neutral' }[];
  urgency: 'critical' | 'high' | 'medium' | 'low';
} {
  const customer = context.customer;

  if (!customer) {
    return {
      greetingText: "Let's get started with this workflow.",
      summary: '',
      keyMetrics: [],
      urgency: 'medium',
    };
  }

  // Determine urgency based on scores and dates
  let urgency: 'critical' | 'high' | 'medium' | 'low' = 'medium';
  if (customer.risk_score >= 70) {
    urgency = 'critical';
  } else if (customer.risk_score >= 50 || customer.health_score < 50) {
    urgency = 'high';
  } else if (customer.opportunity_score >= 70) {
    urgency = 'medium'; // Growth opportunity, not urgent
  } else {
    urgency = 'low';
  }

  // Build key metrics
  const keyMetrics = [
    {
      label: 'Health Score',
      value: customer.health_score,
      trend: customer.health_score >= 70 ? 'up' as const : customer.health_score < 50 ? 'down' as const : 'neutral' as const,
    },
    {
      label: 'Risk Score',
      value: customer.risk_score,
      trend: customer.risk_score < 30 ? 'up' as const : customer.risk_score >= 60 ? 'down' as const : 'neutral' as const,
    },
    {
      label: 'ARR',
      value: `$${customer.arr.toLocaleString()}`,
    },
    {
      label: 'Renewal',
      value: customer.renewal_date,
    },
  ];

  // Build greeting based on account state
  let greetingText = `Let's work on ${customer.name}.`;

  if (urgency === 'critical') {
    greetingText = `${customer.name} needs attention - risk score is ${customer.risk_score}. Let's develop a strategy.`;
  } else if (urgency === 'high') {
    greetingText = `${customer.name} has some concerns to address. Let's review the situation.`;
  } else if (customer.opportunity_score >= 70) {
    greetingText = `${customer.name} shows strong expansion potential. Let's explore opportunities.`;
  } else if (customer.health_score >= 80) {
    greetingText = `${customer.name} is in great shape. Let's make sure the renewal goes smoothly.`;
  }

  return {
    greetingText,
    summary: buildINTELSummary(context),
    keyMetrics,
    urgency,
  };
}
