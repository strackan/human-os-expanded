/**
 * Expert Nomination Tools
 *
 * MCP tools for the expert nomination chain.
 * "I'm the guy for X. Who's your guy for Y?"
 *
 * Flow: designate_expert → email sent → claim_designation → nominate_expert → chain continues
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { z } from 'zod';

const GFT_SCHEMA = 'gft';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const nominationTools: Tool[] = [
  {
    name: 'designate_expert',
    description: `Designate someone as "the guy" for a category. Creates entity, designation, and sends claim email.
Use when the user says things like "Scott is my guy for sales" or "designate Sarah as the expert for fundraising".`,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: "Expert's name" },
        email: { type: 'string', description: "Expert's email (required for claim link)" },
        category_slug: { type: 'string', description: 'Category slug (e.g., "sales-leadership")' },
        message: { type: 'string', description: 'Personal note to include in the email' },
      },
      required: ['name', 'email', 'category_slug'],
    },
  },
  {
    name: 'nominate_expert',
    description: `Nominate someone as an expert (from an existing expert). Creates a nomination record and optionally sends an invite email.
Use after an expert has claimed their designation and wants to extend the chain.`,
    inputSchema: {
      type: 'object',
      properties: {
        nominee_name: { type: 'string', description: "Nominee's name" },
        nominee_email: { type: 'string', description: "Nominee's email" },
        category_slug: { type: 'string', description: 'Category slug for the nomination' },
        message: { type: 'string', description: 'Personal note from the nominator' },
        send_invite: { type: 'boolean', description: 'Whether to send an invite email (default true)' },
      },
      required: ['nominee_name', 'category_slug'],
    },
  },
  {
    name: 'list_expert_categories',
    description: 'List expert categories with designation counts. Optionally filter by status.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'pending_review', 'rejected'],
          description: 'Filter by status',
        },
      },
    },
  },
  {
    name: 'add_category',
    description: 'Add a new expert category.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Category display name' },
        description: { type: 'string', description: 'What this category covers' },
        parent_slug: { type: 'string', description: 'Parent category slug (for hierarchy)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'rename_category',
    description: 'Rename an expert category.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Current category slug' },
        new_name: { type: 'string', description: 'New display name' },
      },
      required: ['slug', 'new_name'],
    },
  },
  {
    name: 'remove_category',
    description: 'Remove an expert category. Will fail if designations exist for it.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Category slug to remove' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'add_expert',
    description: 'Directly add someone as an expert for a category (admin shortcut — skips email/claim flow).',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: "Expert's name" },
        category_slug: { type: 'string', description: 'Category slug' },
        email: { type: 'string', description: "Expert's email (optional)" },
        mini_profile: {
          type: 'object',
          description: 'Optional profile: tagline, linkedin_url, one_liner',
          properties: {
            tagline: { type: 'string' },
            linkedin_url: { type: 'string' },
            one_liner: { type: 'string' },
          },
        },
      },
      required: ['name', 'category_slug'],
    },
  },
  {
    name: 'remove_expert',
    description: 'Remove an expert designation. Optionally scope to a specific category.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: "Expert's name" },
        category_slug: { type: 'string', description: 'Category slug (omit to remove from all)' },
        entity_id: { type: 'string', description: 'Entity UUID (alternative to name)' },
      },
    },
  },
  {
    name: 'get_nomination_chain',
    description: 'Walk the expert nomination chain starting from an entity. Shows who designated whom and the chain of nominations.',
    inputSchema: {
      type: 'object',
      properties: {
        entity_slug: { type: 'string', description: 'Entity slug to start from' },
        entity_id: { type: 'string', description: 'Entity UUID (alternative to slug)' },
      },
    },
  },
  {
    name: 'claim_designation',
    description: 'Claim an expert designation using a claim token. Sets mini profile and marks as claimed.',
    inputSchema: {
      type: 'object',
      properties: {
        claim_token: { type: 'string', description: 'The claim token from the email link' },
        mini_profile: {
          type: 'object',
          description: 'Profile info: tagline, linkedin_url, one_liner',
          properties: {
            tagline: { type: 'string' },
            linkedin_url: { type: 'string' },
            one_liner: { type: 'string' },
          },
        },
      },
      required: ['claim_token'],
    },
  },
  {
    name: 'get_expert_profile',
    description: 'Get an expert\'s profile: their categories, mini profile, and outgoing nominations.',
    inputSchema: {
      type: 'object',
      properties: {
        entity_slug: { type: 'string', description: 'Entity slug' },
        name: { type: 'string', description: 'Person name (alternative to slug)' },
      },
    },
  },
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const DesignateExpertSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  category_slug: z.string().min(1),
  message: z.string().optional(),
});

const NominateExpertSchema = z.object({
  nominee_name: z.string().min(1),
  nominee_email: z.string().email().optional(),
  category_slug: z.string().min(1),
  message: z.string().optional(),
  send_invite: z.boolean().optional().default(true),
});

const SuggestCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parent_slug: z.string().optional(),
});

const ClaimDesignationSchema = z.object({
  claim_token: z.string().min(1),
  mini_profile: z.object({
    tagline: z.string().optional(),
    linkedin_url: z.string().optional(),
    one_liner: z.string().optional(),
  }).optional(),
});

// =============================================================================
// HELPERS
// =============================================================================

function generateClaimToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

async function findOrCreateEntity(
  ctx: ToolContext,
  name: string,
  email?: string
): Promise<{ id: string; slug: string; name: string; email: string | null; created: boolean }> {
  const supabase = ctx.getClient();
  const slug = slugify(name);

  // Try to find existing entity
  const { data: existing } = await supabase
    .from('entities')
    .select('id, slug, name, email')
    .eq('entity_type', 'person')
    .or(`slug.eq.${slug},name.ilike.${name}${email ? `,email.eq.${email}` : ''}`)
    .limit(1)
    .single();

  if (existing) {
    if (email && !existing.email) {
      await supabase.from('entities').update({ email }).eq('id', existing.id);
      existing.email = email;
    }
    return { ...existing, created: false };
  }

  const { data: created, error } = await supabase
    .from('entities')
    .insert({
      slug,
      entity_type: 'person',
      name,
      email: email || null,
      owner_id: ctx.userUUID,
      source_system: 'guyforthat',
      privacy_scope: 'private',
    })
    .select('id, slug, name, email')
    .single();

  if (error) throw new Error(`Failed to create entity: ${error.message}`);
  return { ...created, created: true };
}

async function findCategory(
  ctx: ToolContext,
  slug: string
): Promise<{ id: string; slug: string; name: string } | null> {
  const supabase = ctx.getClient();
  const { data } = await supabase
    .schema(GFT_SCHEMA)
    .from('expert_categories')
    .select('id, slug, name')
    .eq('slug', slug)
    .single();
  return data;
}

async function sendDesignationEmail(
  ctx: ToolContext,
  params: {
    toEmail: string;
    toName: string;
    fromName: string;
    categoryName: string;
    claimToken: string;
    message?: string;
  }
): Promise<boolean> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set — skipping email');
    return false;
  }

  const CLAIM_BASE_URL = process.env.GFT_CRM_URL || 'http://localhost:4502';
  const claimUrl = `${CLAIM_BASE_URL}/claim/${params.claimToken}`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'GuyForThat <noreply@guyforthat.com>',
        to: [params.toEmail],
        subject: `${params.fromName} says you're the expert for ${params.categoryName}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h2 style="color: #2d2a26; margin-bottom: 8px;">You've been designated as an expert</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              <strong>${params.fromName}</strong> says you're their go-to person for
              <strong>${params.categoryName}</strong>.
            </p>
            ${params.message ? `
              <blockquote style="border-left: 3px solid #c2956b; padding-left: 16px; margin: 24px 0; color: #666; font-style: italic;">
                "${params.message}"
              </blockquote>
            ` : ''}
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Claim your expert profile and start building your network:
            </p>
            <a href="${claimUrl}" style="display: inline-block; background: #2d2a26; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
              Claim Your Profile
            </a>
            <p style="color: #999; font-size: 13px; margin-top: 32px;">
              This link is unique to you. Once claimed, you'll be asked who <em>your</em> guy is for other categories.
            </p>
          </div>
        `,
      }),
    });

    return response.ok;
  } catch (err) {
    console.error('Failed to send designation email:', err);
    return false;
  }
}

// =============================================================================
// HANDLER
// =============================================================================

export async function handleNominationTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  const supabase = ctx.getClient();
  const schema = supabase.schema(GFT_SCHEMA);

  switch (name) {
    case 'designate_expert': {
      const input = DesignateExpertSchema.parse(args);

      // Find category
      const category = await findCategory(ctx, input.category_slug);
      if (!category) {
        return { success: false, error: 'CATEGORY_NOT_FOUND', message: `Category "${input.category_slug}" not found.` };
      }

      // Find or create the expert entity
      const expertEntity = await findOrCreateEntity(ctx, input.name, input.email);

      // Find the designator entity (current user)
      const { data: designatorEntity } = await supabase
        .from('entities')
        .select('id, slug, name')
        .eq('owner_id', ctx.userUUID)
        .eq('entity_type', 'person')
        .limit(1)
        .single();

      const designatorId = designatorEntity?.id || ctx.userUUID;

      // Check for existing designation
      const { data: existing } = await schema
        .from('expert_designations')
        .select('id, claim_status')
        .eq('expert_entity_id', expertEntity.id)
        .eq('category_id', category.id)
        .single();

      if (existing) {
        return {
          success: false,
          error: 'ALREADY_DESIGNATED',
          message: `${input.name} is already designated for ${category.name} (status: ${existing.claim_status}).`,
          designationId: existing.id,
        };
      }

      // Create designation
      const claimToken = generateClaimToken();
      const { data: designation, error } = await schema
        .from('expert_designations')
        .insert({
          expert_entity_id: expertEntity.id,
          category_id: category.id,
          designated_by_entity_id: designatorId,
          claim_token: claimToken,
          claim_status: 'pending',
        })
        .select('id')
        .single();

      if (error) throw new Error(`Failed to create designation: ${error.message}`);

      // Create entity_link for knowledge graph
      const designatorSlug = designatorEntity?.slug || ctx.userId;
      await supabase.from('entity_links').insert({
        layer: ctx.layer,
        source_slug: designatorSlug,
        target_slug: expertEntity.slug,
        link_type: 'related_to',
        link_text: `designated expert for ${category.name}`,
        context_snippet: `Expert designation in ${category.name}`,
        strength: 0.9,
      }).then(() => {}); // ignore duplicate errors

      // Send email
      const emailSent = await sendDesignationEmail(ctx, {
        toEmail: input.email,
        toName: input.name,
        fromName: designatorEntity?.name || ctx.userId,
        categoryName: category.name,
        claimToken,
        message: input.message,
      });

      return {
        success: true,
        designation: {
          id: designation.id,
          expert: { id: expertEntity.id, name: expertEntity.name, email: expertEntity.email },
          category: { slug: category.slug, name: category.name },
          claimToken,
          claimStatus: 'pending',
        },
        emailSent,
        message: emailSent
          ? `Designated ${input.name} as expert for ${category.name}. Claim email sent to ${input.email}.`
          : `Designated ${input.name} as expert for ${category.name}. Email could not be sent — share the claim link manually.`,
      };
    }

    case 'nominate_expert': {
      const input = NominateExpertSchema.parse(args);

      const category = await findCategory(ctx, input.category_slug);
      if (!category) {
        return { success: false, error: 'CATEGORY_NOT_FOUND', message: `Category "${input.category_slug}" not found.` };
      }

      // Get nominator entity (current user)
      const { data: nominatorEntity } = await supabase
        .from('entities')
        .select('id, name')
        .eq('owner_id', ctx.userUUID)
        .eq('entity_type', 'person')
        .limit(1)
        .single();

      const nominatorId = nominatorEntity?.id || ctx.userUUID;

      const { data: nomination, error } = await schema
        .from('expert_nominations')
        .insert({
          nominator_entity_id: nominatorId,
          nominee_name: input.nominee_name,
          nominee_email: input.nominee_email || null,
          category_id: category.id,
          message: input.message || null,
          status: 'pending_invite',
        })
        .select('id, status')
        .single();

      if (error) throw new Error(`Failed to create nomination: ${error.message}`);

      // Optionally send invite email
      let emailSent = false;
      if (input.send_invite && input.nominee_email) {
        // Create designation + claim token for the nominee
        const nomineeEntity = await findOrCreateEntity(ctx, input.nominee_name, input.nominee_email);
        const claimToken = generateClaimToken();

        const { data: designation } = await schema
          .from('expert_designations')
          .insert({
            expert_entity_id: nomineeEntity.id,
            category_id: category.id,
            designated_by_entity_id: nominatorId,
            claim_token: claimToken,
            claim_status: 'pending',
          })
          .select('id')
          .single();

        if (designation) {
          // Link nomination to designation
          await schema
            .from('expert_nominations')
            .update({ designation_id: designation.id, status: 'invited' })
            .eq('id', nomination.id);

          emailSent = await sendDesignationEmail(ctx, {
            toEmail: input.nominee_email,
            toName: input.nominee_name,
            fromName: nominatorEntity?.name || ctx.userId,
            categoryName: category.name,
            claimToken,
            message: input.message,
          });
        }
      }

      return {
        success: true,
        nomination: {
          id: nomination.id,
          nomineeName: input.nominee_name,
          category: { slug: category.slug, name: category.name },
          status: input.send_invite && input.nominee_email ? 'invited' : 'pending_invite',
        },
        emailSent,
        message: emailSent
          ? `Nominated ${input.nominee_name} for ${category.name}. Invite email sent.`
          : `Nominated ${input.nominee_name} for ${category.name}.${input.nominee_email ? '' : ' Add their email to send an invite.'}`,
      };
    }

    case 'list_expert_categories': {
      const { status } = z.object({ status: z.string().optional() }).parse(args);

      let query = schema
        .from('expert_categories')
        .select('id, slug, name, description, status');

      if (status) {
        query = query.eq('status', status);
      }

      const { data: categories, error } = await query.order('name');
      if (error) throw new Error(`Failed to list categories: ${error.message}`);

      // Get designation counts per category
      const { data: counts } = await schema
        .from('expert_designations')
        .select('category_id');

      const countMap = new Map<string, number>();
      for (const row of counts || []) {
        countMap.set(row.category_id, (countMap.get(row.category_id) || 0) + 1);
      }

      return {
        categories: (categories || []).map(c => ({
          slug: c.slug,
          name: c.name,
          description: c.description,
          status: c.status,
          designationCount: countMap.get(c.id) || 0,
        })),
        count: categories?.length || 0,
      };
    }

    case 'add_category': {
      const input = SuggestCategorySchema.parse(args);
      const slug = slugify(input.name);

      // Check for existing
      const { data: existing } = await schema
        .from('expert_categories')
        .select('id, slug')
        .eq('slug', slug)
        .single();

      if (existing) {
        return { success: false, error: 'ALREADY_EXISTS', message: `Category "${slug}" already exists.` };
      }

      let parentId = null;
      if (input.parent_slug) {
        const parent = await findCategory(ctx, input.parent_slug);
        if (parent) parentId = parent.id;
      }

      // Get entity for suggested_by
      const { data: entity } = await supabase
        .from('entities')
        .select('id')
        .eq('owner_id', ctx.userUUID)
        .eq('entity_type', 'person')
        .limit(1)
        .single();

      const { data, error } = await schema
        .from('expert_categories')
        .insert({
          slug,
          name: input.name,
          description: input.description || null,
          parent_category_id: parentId,
          status: 'active',
          suggested_by: entity?.id || null,
        })
        .select('id, slug, name, status')
        .single();

      if (error) throw new Error(`Failed to add category: ${error.message}`);

      return { success: true, category: data };
    }

    case 'rename_category': {
      const { slug, new_name } = z.object({
        slug: z.string(),
        new_name: z.string(),
      }).parse(args);

      const newSlug = slugify(new_name);
      const { data, error } = await schema
        .from('expert_categories')
        .update({ name: new_name, slug: newSlug })
        .eq('slug', slug)
        .select('id, slug, name')
        .single();

      if (error) throw new Error(`Failed to rename category: ${error.message}`);
      if (!data) return { success: false, message: `Category "${slug}" not found.` };

      return { success: true, category: data };
    }

    case 'remove_category': {
      const { slug } = z.object({ slug: z.string() }).parse(args);

      // Check for existing designations
      const cat = await findCategory(ctx, slug);
      if (!cat) return { success: false, message: `Category "${slug}" not found.` };

      const { count } = await schema
        .from('expert_designations')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', cat.id);

      if (count && count > 0) {
        return { success: false, message: `Cannot remove "${slug}" — ${count} designation(s) exist. Remove designations first.` };
      }

      const { error } = await schema
        .from('expert_categories')
        .delete()
        .eq('slug', slug);

      if (error) throw new Error(`Failed to remove category: ${error.message}`);

      return { success: true, message: `Category "${slug}" removed.` };
    }

    case 'add_expert': {
      const { name, email, category_slug, mini_profile } = z.object({
        name: z.string(),
        email: z.string().optional(),
        category_slug: z.string(),
        mini_profile: z.object({
          tagline: z.string().optional(),
          linkedin_url: z.string().optional(),
          one_liner: z.string().optional(),
        }).optional(),
      }).parse(args);

      const category = await findCategory(ctx, category_slug);
      if (!category) return { success: false, message: `Category "${category_slug}" not found.` };

      const entity = await findOrCreateEntity(ctx, name, email);
      const token = generateClaimToken();

      const { data, error } = await schema
        .from('expert_designations')
        .upsert({
          expert_entity_id: entity.id,
          category_id: category.id,
          designated_by_entity_id: entity.id, // self-designated for admin add
          claim_status: 'claimed',
          claim_token: token,
          claimed_at: new Date().toISOString(),
          mini_profile: mini_profile || {},
        }, { onConflict: 'expert_entity_id,category_id' })
        .select('id, claim_status, claim_token')
        .single();

      if (error) throw new Error(`Failed to add expert: ${error.message}`);

      return {
        success: true,
        expert: { name, entity_id: entity.id, designation_id: data.id },
        category: { slug: category.slug, name: category.name },
      };
    }

    case 'remove_expert': {
      const { name, category_slug, entity_id } = z.object({
        name: z.string().optional(),
        category_slug: z.string().optional(),
        entity_id: z.string().optional(),
      }).parse(args);

      let expertEntityId = entity_id;

      // Find entity by name if not given
      if (!expertEntityId && name) {
        const { data: ent } = await supabase
          .from('entities')
          .select('id')
          .ilike('name', name)
          .limit(1)
          .single();
        if (ent) expertEntityId = ent.id;
      }

      if (!expertEntityId) return { success: false, message: 'Provide name or entity_id.' };

      let query = schema.from('expert_designations').delete().eq('expert_entity_id', expertEntityId);
      if (category_slug) {
        const cat = await findCategory(ctx, category_slug);
        if (cat) query = query.eq('category_id', cat.id);
      }

      const { error, count } = await query;
      if (error) throw new Error(`Failed to remove expert: ${error.message}`);

      return { success: true, message: `Removed ${count || 0} designation(s).` };
    }

    case 'get_nomination_chain': {
      const { entity_slug, entity_id } = z.object({
        entity_slug: z.string().optional(),
        entity_id: z.string().optional(),
      }).parse(args);

      let entityUUID = entity_id;

      if (!entityUUID && entity_slug) {
        const { data: entity } = await supabase
          .from('entities')
          .select('id')
          .eq('slug', entity_slug)
          .single();
        entityUUID = entity?.id;
      }

      if (!entityUUID) {
        // Fall back to current user's entity
        const { data: entity } = await supabase
          .from('entities')
          .select('id')
          .eq('owner_id', ctx.userUUID)
          .eq('entity_type', 'person')
          .limit(1)
          .single();
        entityUUID = entity?.id;
      }

      if (!entityUUID) {
        return { success: false, error: 'ENTITY_NOT_FOUND', message: 'Could not find entity.' };
      }

      const { data: chain, error } = await schema.rpc('get_nomination_chain', {
        p_entity_id: entityUUID,
      });

      if (error) throw new Error(`Failed to get nomination chain: ${error.message}`);

      return {
        success: true,
        chain: chain || [],
        count: chain?.length || 0,
      };
    }

    case 'claim_designation': {
      const input = ClaimDesignationSchema.parse(args);

      // Find designation by token
      const { data: designation, error: findError } = await schema
        .from('expert_designations')
        .select(`
          id, expert_entity_id, category_id, claim_status,
          designated_by_entity_id
        `)
        .eq('claim_token', input.claim_token)
        .single();

      if (findError || !designation) {
        return { success: false, error: 'INVALID_TOKEN', message: 'Invalid or expired claim token.' };
      }

      if (designation.claim_status === 'claimed') {
        return { success: false, error: 'ALREADY_CLAIMED', message: 'This designation has already been claimed.' };
      }

      // Claim it
      const { error: updateError } = await schema
        .from('expert_designations')
        .update({
          claim_status: 'claimed',
          claimed_at: new Date().toISOString(),
          mini_profile: input.mini_profile || {},
        })
        .eq('id', designation.id);

      if (updateError) throw new Error(`Failed to claim designation: ${updateError.message}`);

      // Get category info
      const { data: category } = await schema
        .from('expert_categories')
        .select('slug, name')
        .eq('id', designation.category_id)
        .single();

      // Get expert entity info
      const { data: expert } = await supabase
        .from('entities')
        .select('name, email, slug')
        .eq('id', designation.expert_entity_id)
        .single();

      return {
        success: true,
        designation: {
          id: designation.id,
          expert: expert ? { name: expert.name, email: expert.email, slug: expert.slug } : null,
          category: category ? { slug: category.slug, name: category.name } : null,
          claimStatus: 'claimed',
          miniProfile: input.mini_profile || {},
        },
        message: `Successfully claimed expert designation for ${category?.name || 'unknown category'}!`,
        nextStep: 'Now nominate your experts — who\'s YOUR guy for other categories?',
      };
    }

    case 'get_expert_profile': {
      const { entity_slug, name: personName } = z.object({
        entity_slug: z.string().optional(),
        name: z.string().optional(),
      }).parse(args);

      // Find entity
      let entityId: string | undefined;
      let entityData: Record<string, unknown> | null = null;

      if (entity_slug) {
        const { data } = await supabase
          .from('entities')
          .select('id, slug, name, email')
          .eq('slug', entity_slug)
          .single();
        if (data) { entityId = data.id; entityData = data; }
      } else if (personName) {
        const slug = slugify(personName);
        const { data } = await supabase
          .from('entities')
          .select('id, slug, name, email')
          .or(`slug.eq.${slug},name.ilike.${personName}`)
          .limit(1)
          .single();
        if (data) { entityId = data.id; entityData = data; }
      }

      if (!entityId || !entityData) {
        return { success: false, error: 'NOT_FOUND', message: 'Expert not found.' };
      }

      // Get designations
      const { data: designations } = await schema
        .from('expert_designations')
        .select('id, category_id, claim_status, claimed_at, mini_profile, designated_by_entity_id')
        .eq('expert_entity_id', entityId);

      // Get categories
      const categoryIds = (designations || []).map(d => d.category_id);
      const { data: categories } = categoryIds.length > 0
        ? await schema.from('expert_categories').select('id, slug, name').in('id', categoryIds)
        : { data: [] };
      const categoryMap = new Map((categories || []).map(c => [c.id, c]));

      // Get designator names
      const designatorIds = (designations || []).map(d => d.designated_by_entity_id).filter(Boolean);
      const { data: designators } = designatorIds.length > 0
        ? await supabase.from('entities').select('id, name').in('id', designatorIds)
        : { data: [] };
      const designatorMap = new Map((designators || []).map(d => [d.id, d.name]));

      // Get outgoing nominations
      const { data: nominations } = await schema
        .from('expert_nominations')
        .select('id, nominee_name, nominee_email, category_id, status, message')
        .eq('nominator_entity_id', entityId);

      return {
        success: true,
        expert: {
          slug: entityData.slug,
          name: entityData.name,
          email: entityData.email,
        },
        designations: (designations || []).map(d => {
          const cat = categoryMap.get(d.category_id);
          return {
            id: d.id,
            category: cat ? { slug: cat.slug, name: cat.name } : null,
            claimStatus: d.claim_status,
            claimedAt: d.claimed_at,
            miniProfile: d.mini_profile,
            designatedBy: designatorMap.get(d.designated_by_entity_id) || null,
          };
        }),
        nominations: (nominations || []).map(n => {
          const cat = categoryMap.get(n.category_id);
          return {
            id: n.id,
            nomineeName: n.nominee_name,
            nomineeEmail: n.nominee_email,
            category: cat ? { slug: cat.slug, name: cat.name } : null,
            status: n.status,
            message: n.message,
          };
        }),
      };
    }

    default:
      return null;
  }
}
