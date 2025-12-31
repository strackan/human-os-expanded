/**
 * GuyForThat Post Engagement Tools
 *
 * Tools for tracking and analyzing LinkedIn post engagement.
 * Platform: guyforthat
 */

import { z } from 'zod';
import { defineTool } from '../../registry.js';

// =============================================================================
// SAVE POST ENGAGERS
// =============================================================================

export const savePostEngagers = defineTool({
  name: 'gft_save_post_engagers',
  description:
    'Save extracted post engagers to database for tracking and follow-up. Call after extracting engagers from a LinkedIn post.',
  platform: 'guyforthat',
  category: 'engagement',

  input: z.object({
    post: z.object({
      url: z.string().describe('LinkedIn post URL'),
      content: z.string().optional().describe('Post content'),
      author: z.string().optional().describe('Post author name'),
      date: z.string().optional().describe('Post date'),
      hashtags: z.array(z.string()).optional().describe('Post hashtags'),
    }),
    engagers: z
      .array(
        z.object({
          name: z.string().optional(),
          linkedin_url: z.string(),
          engagement_type: z
            .enum(['like', 'comment', 'share', 'reaction'])
            .describe('Type of engagement'),
          comment_text: z.string().optional().describe('Comment text if applicable'),
          engagement_date: z.string().optional(),
        })
      )
      .describe('Array of engager objects from extraction'),
  }),

  handler: async (ctx, input) => {
    const { post, engagers } = input;

    const results = {
      saved: 0,
      skipped: 0,
      errors: [] as Array<{ linkedin_url: string; error: string }>,
    };

    for (const engager of engagers) {
      try {
        const record = {
          post_url: post.url,
          post_content: post.content?.substring(0, 1000),
          post_author: post.author,
          post_date: post.date,
          hashtags: post.hashtags || [],
          linkedin_url: engager.linkedin_url,
          engagement_type: engager.engagement_type,
          comment_text: engager.comment_text?.substring(0, 500),
          engagement_date: engager.engagement_date || new Date().toISOString(),
          created_by: 'mcp_server',
        };

        const { error } = await ctx.supabase
          .schema('gft')
          .from('post_engagement')
          .upsert(record, {
            onConflict: 'post_url,linkedin_url,engagement_type',
          });

        if (error) {
          results.skipped++;
        } else {
          results.saved++;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        results.errors.push({
          linkedin_url: engager.linkedin_url,
          error: message,
        });
      }
    }

    return {
      success: true,
      post_url: post.url,
      ...results,
      message: `Saved ${results.saved} engagers, skipped ${results.skipped}`,
    };
  },

  rest: { method: 'POST', path: '/gft/engagement/save' },
});

// =============================================================================
// GET TOP POST ENGAGERS
// =============================================================================

export const getTopPostEngagers = defineTool({
  name: 'gft_get_top_engagers',
  description:
    'Get top engagers across all tracked posts. Useful for identifying your most engaged audience members.',
  platform: 'guyforthat',
  category: 'engagement',

  input: z.object({
    limit: z
      .number()
      .optional()
      .default(20)
      .describe('Maximum engagers to return'),
    daysBack: z
      .number()
      .optional()
      .default(30)
      .describe('Look back period in days'),
  }),

  handler: async (ctx, input) => {
    const limit = input.limit || 20;
    const daysBack = input.daysBack || 30;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Get engagement data
    const { data, error } = await ctx.supabase
      .schema('gft')
      .from('post_engagement')
      .select('linkedin_url, engagement_type')
      .gte('engagement_date', cutoffDate.toISOString())
      .limit(1000);

    if (error) {
      return { success: false, error: error.message, engagers: [] };
    }

    // Aggregate by linkedin_url
    const counts: Record<
      string,
      { linkedin_url: string; engagement_count: number; engagement_types: Set<string> }
    > = {};

    for (const row of data || []) {
      if (!counts[row.linkedin_url]) {
        counts[row.linkedin_url] = {
          linkedin_url: row.linkedin_url,
          engagement_count: 0,
          engagement_types: new Set(),
        };
      }
      counts[row.linkedin_url].engagement_count++;
      counts[row.linkedin_url].engagement_types.add(row.engagement_type);
    }

    // Sort and limit
    const engagers = Object.values(counts)
      .map((e) => ({
        linkedin_url: e.linkedin_url,
        engagement_count: e.engagement_count,
        engagement_types: Array.from(e.engagement_types),
      }))
      .sort((a, b) => b.engagement_count - a.engagement_count)
      .slice(0, limit);

    return {
      success: true,
      period: {
        start: cutoffDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
        days: daysBack,
      },
      engagers,
      count: engagers.length,
    };
  },

  rest: { method: 'GET', path: '/gft/engagement/top' },
});

// =============================================================================
// GET POST ENGAGEMENT STATS
// =============================================================================

export const getPostEngagementStats = defineTool({
  name: 'gft_get_post_stats',
  description: 'Get engagement statistics for a specific post.',
  platform: 'guyforthat',
  category: 'engagement',

  input: z.object({
    postUrl: z.string().describe('LinkedIn post URL'),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase
      .schema('gft')
      .from('post_engagement')
      .select('engagement_type')
      .eq('post_url', input.postUrl);

    if (error) {
      return { success: false, error: error.message, post_url: input.postUrl };
    }

    // Count by type
    const stats: Record<string, number> = {};
    for (const row of data || []) {
      stats[row.engagement_type] = (stats[row.engagement_type] || 0) + 1;
    }

    return {
      success: true,
      post_url: input.postUrl,
      stats: Object.entries(stats).map(([type, count]) => ({
        engagement_type: type,
        count,
      })),
      total_engagements: data?.length || 0,
    };
  },

  rest: { method: 'GET', path: '/gft/engagement/stats' },
});

// =============================================================================
// LIST TRACKED POSTS
// =============================================================================

export const listTrackedPosts = defineTool({
  name: 'gft_list_tracked_posts',
  description: 'List all posts being tracked for engagement.',
  platform: 'guyforthat',
  category: 'engagement',

  input: z.object({
    limit: z.number().optional().default(20).describe('Maximum posts to return'),
    author: z.string().optional().describe('Filter by post author'),
  }),

  handler: async (ctx, input) => {
    let query = ctx.supabase
      .schema('gft')
      .from('post_engagement')
      .select('post_url, post_author, post_content, post_date')
      .limit(input.limit || 20);

    if (input.author) {
      query = query.ilike('post_author', `%${input.author}%`);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message, posts: [] };
    }

    // Deduplicate by post_url
    const postsMap = new Map<
      string,
      { post_url: string; author?: string; content_preview?: string; date?: string }
    >();
    for (const row of data || []) {
      if (!postsMap.has(row.post_url)) {
        postsMap.set(row.post_url, {
          post_url: row.post_url,
          author: row.post_author,
          content_preview: row.post_content?.substring(0, 100),
          date: row.post_date,
        });
      }
    }

    const posts = Array.from(postsMap.values());

    return {
      success: true,
      posts,
      count: posts.length,
    };
  },

  rest: { method: 'GET', path: '/gft/engagement/posts' },
});
