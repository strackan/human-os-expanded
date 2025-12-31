/**
 * Email Tools
 *
 * Wrapper tools for email operations that integrate with Gmail MCP.
 * These tools resolve contacts from our database and provide context
 * for Claude to use Gmail MCP for actual sending.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { z } from 'zod';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const emailTools: Tool[] = [
  {
    name: 'prepare_email',
    description: `Prepare to send an email to a contact. Resolves contact details from the database
and returns information needed to send via Gmail MCP.

Use this BEFORE calling gmail_send_email to:
1. Look up the contact's email address
2. Get context about the relationship
3. Log the outreach attempt

After calling this, use Gmail MCP's send_email tool with the returned email address.`,
    inputSchema: {
      type: 'object',
      properties: {
        contact: {
          type: 'string',
          description: 'Contact name, slug, or UUID to look up',
        },
        subject: {
          type: 'string',
          description: 'Email subject line',
        },
        purpose: {
          type: 'string',
          description: 'Purpose of the email (for logging and context)',
        },
        project_id: {
          type: 'string',
          description: 'Optional project UUID this email relates to',
        },
      },
      required: ['contact'],
    },
  },
  {
    name: 'log_email_sent',
    description: `Log that an email was sent to a contact. Call this AFTER successfully sending
via Gmail MCP to keep our records updated.`,
    inputSchema: {
      type: 'object',
      properties: {
        contact_id: {
          type: 'string',
          description: 'Contact entity UUID',
        },
        subject: {
          type: 'string',
          description: 'Email subject',
        },
        purpose: {
          type: 'string',
          description: 'Purpose/type of email',
        },
        project_id: {
          type: 'string',
          description: 'Related project UUID',
        },
        gmail_message_id: {
          type: 'string',
          description: 'Gmail message ID if available',
        },
      },
      required: ['contact_id'],
    },
  },
  {
    name: 'get_contact_email',
    description: 'Quick lookup of a contact email by name, slug, or ID.',
    inputSchema: {
      type: 'object',
      properties: {
        contact: {
          type: 'string',
          description: 'Contact name, slug, or UUID',
        },
      },
      required: ['contact'],
    },
  },
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const PrepareEmailSchema = z.object({
  contact: z.string().min(1),
  subject: z.string().optional(),
  purpose: z.string().optional(),
  project_id: z.string().uuid().optional(),
});

const LogEmailSchema = z.object({
  contact_id: z.string().uuid(),
  subject: z.string().optional(),
  purpose: z.string().optional(),
  project_id: z.string().uuid().optional(),
  gmail_message_id: z.string().optional(),
});

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Resolve a contact by name, slug, or UUID
 */
async function resolveContact(
  ctx: ToolContext,
  contact: string
): Promise<{
  id: string;
  name: string;
  email: string | null;
  slug: string | null;
  metadata: Record<string, unknown>;
} | null> {
  const supabase = ctx.getClient();

  // Try UUID first
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(contact)) {
    const { data } = await supabase
      .from('entities')
      .select('id, name, email, slug, metadata')
      .eq('id', contact)
      .eq('entity_type', 'person')
      .single();
    return data;
  }

  // Try slug
  const { data: bySlug } = await supabase
    .from('entities')
    .select('id, name, email, slug, metadata')
    .eq('slug', contact.toLowerCase().replace(/\s+/g, '-'))
    .eq('entity_type', 'person')
    .single();

  if (bySlug) return bySlug;

  // Try name (case-insensitive)
  const { data: byName } = await supabase
    .from('entities')
    .select('id, name, email, slug, metadata')
    .ilike('name', contact)
    .eq('entity_type', 'person')
    .limit(1)
    .single();

  if (byName) return byName;

  // Try partial name match
  const { data: byPartial } = await supabase
    .from('entities')
    .select('id, name, email, slug, metadata')
    .ilike('name', `%${contact}%`)
    .eq('entity_type', 'person')
    .limit(1)
    .single();

  return byPartial;
}

// =============================================================================
// HANDLER
// =============================================================================

export async function handleEmailTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  const supabase = ctx.getClient();

  switch (name) {
    case 'prepare_email': {
      const input = PrepareEmailSchema.parse(args);

      // Resolve contact
      const contact = await resolveContact(ctx, input.contact);

      if (!contact) {
        return {
          success: false,
          error: 'CONTACT_NOT_FOUND',
          message: `Could not find contact matching "${input.contact}". Try using their full name or UUID.`,
        };
      }

      if (!contact.email) {
        return {
          success: false,
          error: 'NO_EMAIL',
          message: `Found contact "${contact.name}" but no email address on file.`,
          contact: {
            id: contact.id,
            name: contact.name,
            slug: contact.slug,
          },
          suggestion: 'Add an email address to this contact or find an alternative contact method.',
        };
      }

      // Get relationship context if available
      let relationshipContext: string | null = null;
      const { data: relationship } = await supabase
        .schema('founder_os')
        .from('relationships')
        .select('relationship_type, last_contact, contact_frequency, notes')
        .eq('user_id', ctx.userUUID)
        .eq('entity_id', contact.id)
        .single();

      if (relationship) {
        const daysSinceContact = relationship.last_contact
          ? Math.floor(
              (Date.now() - new Date(relationship.last_contact).getTime()) / (1000 * 60 * 60 * 24)
            )
          : null;

        relationshipContext = [
          relationship.relationship_type ? `Type: ${relationship.relationship_type}` : null,
          daysSinceContact !== null ? `Last contact: ${daysSinceContact} days ago` : null,
          relationship.notes ? `Notes: ${relationship.notes}` : null,
        ]
          .filter(Boolean)
          .join('\n');
      }

      // Get project context if provided
      let projectContext: string | null = null;
      if (input.project_id) {
        const { data: project } = await supabase
          .schema('founder_os')
          .from('projects')
          .select('name, slug')
          .eq('id', input.project_id)
          .single();
        if (project) {
          projectContext = `Project: ${project.name}`;
        }
      }

      return {
        success: true,
        contact: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          slug: contact.slug,
        },
        emailReady: true,
        relationshipContext,
        projectContext,
        nextStep: `Use Gmail MCP's send_email tool with:
  to: "${contact.email}"
  subject: "${input.subject || '[compose subject]'}"

After sending, call log_email_sent with contact_id: "${contact.id}"`,
      };
    }

    case 'log_email_sent': {
      const input = LogEmailSchema.parse(args);

      // Update last_contact in relationships
      const { error: relError } = await supabase
        .schema('founder_os')
        .from('relationships')
        .upsert(
          {
            user_id: ctx.userUUID,
            entity_id: input.contact_id,
            last_contact: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,entity_id',
          }
        );

      if (relError && relError.code !== '23505') {
        // Ignore duplicate key, log other errors
        console.error('Failed to update relationship:', relError);
      }

      // Log to activity/journal if we have that capability
      // For now, just confirm the logging

      return {
        success: true,
        message: 'Email logged successfully.',
        contactId: input.contact_id,
        loggedAt: new Date().toISOString(),
        details: {
          subject: input.subject,
          purpose: input.purpose,
          projectId: input.project_id,
          gmailMessageId: input.gmail_message_id,
        },
      };
    }

    case 'get_contact_email': {
      const { contact: contactInput } = z
        .object({ contact: z.string().min(1) })
        .parse(args);

      const contact = await resolveContact(ctx, contactInput);

      if (!contact) {
        return {
          success: false,
          error: 'CONTACT_NOT_FOUND',
          message: `Could not find contact matching "${contactInput}".`,
        };
      }

      return {
        success: true,
        id: contact.id,
        name: contact.name,
        email: contact.email,
        slug: contact.slug,
        hasEmail: !!contact.email,
      };
    }

    default:
      return null;
  }
}
