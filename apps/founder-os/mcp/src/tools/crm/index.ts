/**
 * CRM Tools
 *
 * Combines opportunity and campaign tools for CRM management.
 *
 * Opportunities: create_opportunity, update_opportunity, get_opportunity,
 *   search_opportunities, get_pipeline, get_open_deals, get_deals_closing_soon,
 *   win_deal, lose_deal, add_deal_activity, init_pipeline
 *
 * Campaigns: create_campaign, update_campaign, get_campaign, list_campaigns,
 *   add_to_campaign, update_campaign_member, get_campaign_members,
 *   get_outreach_queue, log_outreach, convert_lead
 */

import type { ToolContext } from '../../lib/context.js';
import { opportunityTools, handleOpportunityTools } from './opportunities.js';
import { campaignTools, handleCampaignTools } from './campaigns.js';

// Combine all CRM tools
export const crmTools = [...opportunityTools, ...campaignTools];

/**
 * Handle CRM tool calls
 * Routes to opportunities or campaigns handler
 */
export async function handleCrmTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  // Try opportunity tools first
  let result = await handleOpportunityTools(name, args, ctx);
  if (result !== null) return result;

  // Try campaign tools
  result = await handleCampaignTools(name, args, ctx);
  if (result !== null) return result;

  // Not a CRM tool
  return null;
}

// Re-export for direct access if needed
export { opportunityTools, handleOpportunityTools } from './opportunities.js';
export { campaignTools, handleCampaignTools } from './campaigns.js';
