/**
 * Context Sharing Tools
 *
 * MCP tools for bidirectional topic-scoped context sharing.
 * Users opt in to share specific context topics with each other.
 * When either queries the system, they see each other's context for shared topics.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { z } from 'zod';

const HUMAN_OS_SCHEMA = 'human_os';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const sharingTools: Tool[] = [
  {
    name: 'share_context',
    description: `Invite someone to see your context on a specific topic. Creates a pending share that the other person can accept.
Use when the user says "share my sales-leadership context with Scott" or "let Scott see my notes on fundraising".`,
    inputSchema: {
      type: 'object',
      properties: {
        grantee_slug: { type: 'string', description: 'User slug of the person to share with (e.g., "scott")' },
        context_slug: { type: 'string', description: 'Topic slug to share (e.g., "sales-leadership")' },
        bidirectional: { type: 'boolean', description: 'Also create the reverse share (default false)' },
      },
      required: ['grantee_slug', 'context_slug'],
    },
  },
  {
    name: 'accept_share',
    description: 'Accept an incoming context share invitation.',
    inputSchema: {
      type: 'object',
      properties: {
        share_id: { type: 'string', description: 'The share UUID to accept' },
      },
      required: ['share_id'],
    },
  },
  {
    name: 'revoke_share',
    description: 'Revoke a context share (stop sharing a topic with someone).',
    inputSchema: {
      type: 'object',
      properties: {
        share_id: { type: 'string', description: 'The share UUID to revoke' },
        grantee_slug: { type: 'string', description: 'Alternatively, revoke by grantee slug + context_slug' },
        context_slug: { type: 'string', description: 'Topic slug (used with grantee_slug)' },
      },
    },
  },
  {
    name: 'list_shares',
    description: 'List all active context shares — both incoming (shared with me) and outgoing (I share with others).',
    inputSchema: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['incoming', 'outgoing', 'all'],
          description: 'Filter by direction (default: all)',
        },
        status: {
          type: 'string',
          enum: ['pending', 'accepted', 'revoked', 'all'],
          description: 'Filter by status (default: all active)',
        },
      },
    },
  },
  {
    name: 'get_shared_context',
    description: `Query a topic and get merged context from all users who share that topic with you.
Use when the user asks about a shared topic or wants to see what others have contributed.`,
    inputSchema: {
      type: 'object',
      properties: {
        context_slug: { type: 'string', description: 'Topic slug to query' },
      },
      required: ['context_slug'],
    },
  },
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const ShareContextSchema = z.object({
  grantee_slug: z.string().min(1),
  context_slug: z.string().min(1),
  bidirectional: z.boolean().optional().default(false),
});

const RevokeShareSchema = z.object({
  share_id: z.string().uuid().optional(),
  grantee_slug: z.string().optional(),
  context_slug: z.string().optional(),
});

// =============================================================================
// HELPERS
// =============================================================================

async function resolveUserUUIDBySlug(
  ctx: ToolContext,
  slug: string
): Promise<{ id: string; slug: string } | null> {
  const supabase = ctx.getClient();
  const { data } = await supabase
    .schema(HUMAN_OS_SCHEMA)
    .from('users')
    .select('id, slug')
    .eq('slug', slug)
    .single();
  return data;
}

// =============================================================================
// HANDLER
// =============================================================================

export async function handleSharingTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  const supabase = ctx.getClient();
  const schema = supabase.schema(HUMAN_OS_SCHEMA);

  switch (name) {
    case 'share_context': {
      const input = ShareContextSchema.parse(args);

      // Resolve grantee
      const grantee = await resolveUserUUIDBySlug(ctx, input.grantee_slug);
      if (!grantee) {
        return { success: false, error: 'USER_NOT_FOUND', message: `User "${input.grantee_slug}" not found.` };
      }

      // Create outgoing share (me → grantee)
      const { data: share, error } = await schema
        .from('context_shares')
        .upsert(
          {
            owner_id: ctx.userUUID,
            grantee_id: grantee.id,
            context_slug: input.context_slug,
            status: 'pending',
            invited_at: new Date().toISOString(),
          },
          { onConflict: 'owner_id,grantee_id,context_slug' }
        )
        .select('id, status')
        .single();

      if (error) throw new Error(`Failed to create share: ${error.message}`);

      // Optionally create bidirectional share (grantee → me)
      let reverseShare = null;
      if (input.bidirectional) {
        const { data } = await schema
          .from('context_shares')
          .upsert(
            {
              owner_id: grantee.id,
              grantee_id: ctx.userUUID,
              context_slug: input.context_slug,
              status: 'pending',
              invited_at: new Date().toISOString(),
            },
            { onConflict: 'owner_id,grantee_id,context_slug' }
          )
          .select('id, status')
          .single();
        reverseShare = data;
      }

      return {
        success: true,
        share: {
          id: share.id,
          contextSlug: input.context_slug,
          grantee: input.grantee_slug,
          status: share.status,
        },
        reverseShare: reverseShare ? {
          id: reverseShare.id,
          status: reverseShare.status,
        } : null,
        message: input.bidirectional
          ? `Bidirectional share created for "${input.context_slug}" with ${input.grantee_slug}. Both shares are pending acceptance.`
          : `Share invitation sent to ${input.grantee_slug} for "${input.context_slug}".`,
      };
    }

    case 'accept_share': {
      const { share_id } = z.object({ share_id: z.string().uuid() }).parse(args);

      // Verify the share belongs to this user (as grantee)
      const { data: share, error: findError } = await schema
        .from('context_shares')
        .select('id, owner_id, context_slug, status')
        .eq('id', share_id)
        .eq('grantee_id', ctx.userUUID)
        .single();

      if (findError || !share) {
        return { success: false, error: 'NOT_FOUND', message: 'Share not found or not addressed to you.' };
      }

      if (share.status === 'accepted') {
        return { success: false, error: 'ALREADY_ACCEPTED', message: 'This share is already accepted.' };
      }

      const { error } = await schema
        .from('context_shares')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', share_id);

      if (error) throw new Error(`Failed to accept share: ${error.message}`);

      // Get owner info
      const { data: owner } = await schema
        .from('users')
        .select('slug')
        .eq('id', share.owner_id)
        .single();

      return {
        success: true,
        share: {
          id: share.id,
          contextSlug: share.context_slug,
          owner: owner?.slug || 'unknown',
          status: 'accepted',
        },
        message: `Accepted context share for "${share.context_slug}" from ${owner?.slug || 'unknown'}. Their context on this topic will now appear in your queries.`,
      };
    }

    case 'revoke_share': {
      const input = RevokeShareSchema.parse(args);

      if (input.share_id) {
        // Revoke by ID — must be owner
        const { error } = await schema
          .from('context_shares')
          .update({
            status: 'revoked',
            revoked_at: new Date().toISOString(),
          })
          .eq('id', input.share_id)
          .eq('owner_id', ctx.userUUID);

        if (error) throw new Error(`Failed to revoke: ${error.message}`);

        return { success: true, message: 'Share revoked.' };
      }

      if (input.grantee_slug && input.context_slug) {
        // Revoke by grantee + slug
        const grantee = await resolveUserUUIDBySlug(ctx, input.grantee_slug);
        if (!grantee) {
          return { success: false, error: 'USER_NOT_FOUND', message: `User "${input.grantee_slug}" not found.` };
        }

        const { error } = await schema
          .from('context_shares')
          .update({
            status: 'revoked',
            revoked_at: new Date().toISOString(),
          })
          .eq('owner_id', ctx.userUUID)
          .eq('grantee_id', grantee.id)
          .eq('context_slug', input.context_slug);

        if (error) throw new Error(`Failed to revoke: ${error.message}`);

        return { success: true, message: `Revoked "${input.context_slug}" share with ${input.grantee_slug}.` };
      }

      return { success: false, error: 'MISSING_PARAMS', message: 'Provide share_id, or grantee_slug + context_slug.' };
    }

    case 'list_shares': {
      const { direction, status } = z.object({
        direction: z.enum(['incoming', 'outgoing', 'all']).optional().default('all'),
        status: z.enum(['pending', 'accepted', 'revoked', 'all']).optional().default('all'),
      }).parse(args);

      const shares: Array<Record<string, unknown>> = [];

      // Outgoing shares (I share with others)
      if (direction === 'outgoing' || direction === 'all') {
        let query = schema
          .from('context_shares')
          .select('id, grantee_id, context_slug, status, invited_at, accepted_at')
          .eq('owner_id', ctx.userUUID);

        if (status !== 'all') query = query.eq('status', status);
        else query = query.neq('status', 'revoked');

        const { data: outgoing } = await query.order('invited_at', { ascending: false });

        if (outgoing && outgoing.length > 0) {
          const granteeIds = outgoing.map(s => s.grantee_id);
          const { data: grantees } = await schema
            .from('users')
            .select('id, slug')
            .in('id', granteeIds);
          const granteeMap = new Map((grantees || []).map(g => [g.id, g.slug]));

          for (const s of outgoing) {
            shares.push({
              id: s.id,
              direction: 'outgoing',
              contextSlug: s.context_slug,
              otherUser: granteeMap.get(s.grantee_id) || 'unknown',
              status: s.status,
              invitedAt: s.invited_at,
              acceptedAt: s.accepted_at,
            });
          }
        }
      }

      // Incoming shares (others share with me)
      if (direction === 'incoming' || direction === 'all') {
        let query = schema
          .from('context_shares')
          .select('id, owner_id, context_slug, status, invited_at, accepted_at')
          .eq('grantee_id', ctx.userUUID);

        if (status !== 'all') query = query.eq('status', status);
        else query = query.neq('status', 'revoked');

        const { data: incoming } = await query.order('invited_at', { ascending: false });

        if (incoming && incoming.length > 0) {
          const ownerIds = incoming.map(s => s.owner_id);
          const { data: owners } = await schema
            .from('users')
            .select('id, slug')
            .in('id', ownerIds);
          const ownerMap = new Map((owners || []).map(o => [o.id, o.slug]));

          for (const s of incoming) {
            shares.push({
              id: s.id,
              direction: 'incoming',
              contextSlug: s.context_slug,
              otherUser: ownerMap.get(s.owner_id) || 'unknown',
              status: s.status,
              invitedAt: s.invited_at,
              acceptedAt: s.accepted_at,
            });
          }
        }
      }

      return {
        success: true,
        shares,
        count: shares.length,
      };
    }

    case 'get_shared_context': {
      const { context_slug } = z.object({ context_slug: z.string().min(1) }).parse(args);

      // Get accepted incoming shares for this topic
      const { data: incomingShares } = await schema
        .from('context_shares')
        .select('owner_id')
        .eq('grantee_id', ctx.userUUID)
        .eq('context_slug', context_slug)
        .eq('status', 'accepted');

      if (!incomingShares || incomingShares.length === 0) {
        // Try to get just own context
        const ownContext = await ctx.contextEngine.getContext(ctx.layer, 'topics', context_slug);
        return {
          success: true,
          contextSlug: context_slug,
          sharedFrom: [],
          ownContext: ownContext ? { content: ownContext.content, frontmatter: ownContext.frontmatter } : null,
          mergedSources: ownContext ? 1 : 0,
          message: incomingShares?.length === 0
            ? `No one is sharing "${context_slug}" with you yet.`
            : `Only your own context found for "${context_slug}".`,
        };
      }

      // Get owner slugs
      const ownerIds = incomingShares.map(s => s.owner_id);
      const { data: owners } = await schema
        .from('users')
        .select('id, slug')
        .in('id', ownerIds);
      const ownerMap = new Map((owners || []).map(o => [o.id, o.slug]));

      // Fetch context from each shared user's layer
      const sharedContexts: Array<{
        ownerSlug: string;
        content: string;
        frontmatter: Record<string, unknown>;
      }> = [];

      for (const share of incomingShares) {
        const ownerSlug = ownerMap.get(share.owner_id);
        if (!ownerSlug) continue;

        const ownerLayer = `founder:${ownerSlug}` as import('@human-os/core').Layer;

        // Try to get context from the owner's layer
        for (const folder of ['topics', 'people', 'companies', 'experts']) {
          try {
            const context = await ctx.contextEngine.getContext(ownerLayer, folder, context_slug);
            if (context) {
              sharedContexts.push({
                ownerSlug,
                content: context.content,
                frontmatter: context.frontmatter,
              });
              break;
            }
          } catch {
            // Skip inaccessible
          }
        }
      }

      // Also get own context
      let ownContext = null;
      for (const folder of ['topics', 'people', 'companies', 'experts']) {
        try {
          const context = await ctx.contextEngine.getContext(ctx.layer, folder, context_slug);
          if (context) {
            ownContext = { content: context.content, frontmatter: context.frontmatter };
            break;
          }
        } catch {
          // Skip
        }
      }

      return {
        success: true,
        contextSlug: context_slug,
        ownContext,
        sharedFrom: sharedContexts.map(sc => ({
          owner: sc.ownerSlug,
          content: sc.content,
          frontmatter: sc.frontmatter,
        })),
        mergedSources: (ownContext ? 1 : 0) + sharedContexts.length,
        message: `Found context from ${sharedContexts.length} shared source(s)${ownContext ? ' plus your own' : ''}.`,
      };
    }

    default:
      return null;
  }
}
