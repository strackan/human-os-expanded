/**
 * Human-OS Webhook Handler
 *
 * Receives external wake events from Human-OS and matches them
 * to active workflow triggers.
 *
 * POST /api/webhooks/human-os
 *
 * Phase 4 of 0.2.0 Human-OS Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import crypto from 'crypto';
import type {
  ExternalWakeEvent,
  EventType,
  CompanyFundingEventConfig,
  ContactJobChangeConfig,
  LinkedInActivitySpikeConfig,
  CompanyNewsEventConfig,
  RelationshipOpinionAddedConfig,
} from '@/types/wake-triggers';

// ============================================================================
// CONSTANTS
// ============================================================================

const EXTERNAL_EVENT_TYPES: EventType[] = [
  'company_funding_event',
  'contact_job_change',
  'linkedin_activity_spike',
  'company_news_event',
  'relationship_opinion_added',
];

// ============================================================================
// TYPES
// ============================================================================

interface WebhookPayload {
  event: ExternalWakeEvent;
  signature?: string;
}

interface MatchedWorkflow {
  workflowExecutionId: string;
  customerId: string;
  triggerId: string;
  matchReason: string;
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse and validate payload
    const body = await request.json() as WebhookPayload;

    if (!body.event) {
      return NextResponse.json(
        { error: 'Missing event payload' },
        { status: 400 }
      );
    }

    const { event } = body;

    // Validate event type
    if (!EXTERNAL_EVENT_TYPES.includes(event.eventType)) {
      return NextResponse.json(
        { error: `Invalid event type: ${event.eventType}` },
        { status: 400 }
      );
    }

    // Verify webhook signature if configured
    const webhookSecret = process.env.HUMAN_OS_WEBHOOK_SECRET;
    if (webhookSecret && body.signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(event))
        .digest('hex');

      if (body.signature !== expectedSignature) {
        console.warn('[Human-OS Webhook] Invalid signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Check feature flag
    const externalTriggersEnabled = process.env.FEATURE_EXTERNAL_WAKE_TRIGGERS === 'true';
    if (!externalTriggersEnabled) {
      console.log('[Human-OS Webhook] External wake triggers disabled, ignoring event');
      return NextResponse.json({
        success: true,
        message: 'External wake triggers disabled',
        processed: false,
      });
    }

    console.log(`[Human-OS Webhook] Received ${event.eventType} event: ${event.eventId}`);

    // Process the event
    const supabase = createServiceRoleClient();
    const result = await processExternalEvent(event, supabase);

    const duration = Date.now() - startTime;
    console.log(
      `[Human-OS Webhook] Processed in ${duration}ms: ${result.matchedWorkflows.length} workflows matched`
    );

    return NextResponse.json({
      success: true,
      eventId: event.eventId,
      matchedWorkflows: result.matchedWorkflows.length,
      wokenWorkflows: result.wokenWorkflows,
      duration,
    });
  } catch (error) {
    console.error('[Human-OS Webhook] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// EVENT PROCESSING
// ============================================================================

async function processExternalEvent(
  event: ExternalWakeEvent,
  supabase: ReturnType<typeof createServiceRoleClient>
): Promise<{
  matchedWorkflows: MatchedWorkflow[];
  wokenWorkflows: number;
}> {
  const matchedWorkflows: MatchedWorkflow[] = [];
  let wokenWorkflows = 0;

  try {
    // Find snoozed workflows with matching trigger types
    const { data: snoozedWorkflows, error } = await supabase
      .from('workflow_executions')
      .select(`
        id,
        customer_id,
        wake_triggers,
        status,
        customers (
          id,
          name,
          domain
        )
      `)
      .eq('status', 'snoozed')
      .not('wake_triggers', 'is', null);

    if (error) {
      console.error('[Human-OS Webhook] Error fetching workflows:', error);
      return { matchedWorkflows, wokenWorkflows: 0 };
    }

    if (!snoozedWorkflows || snoozedWorkflows.length === 0) {
      return { matchedWorkflows, wokenWorkflows: 0 };
    }

    // Match event against each workflow's triggers
    for (const workflow of snoozedWorkflows) {
      const triggers = workflow.wake_triggers as unknown[];
      if (!Array.isArray(triggers)) continue;

      for (const trigger of triggers) {
        const triggerObj = trigger as { id: string; type: string; config: { eventType?: string; eventConfig?: Record<string, unknown> } };

        if (triggerObj.type !== 'event') continue;
        if (triggerObj.config?.eventType !== event.eventType) continue;

        // Check if event matches trigger config
        const customer = Array.isArray(workflow.customers)
          ? workflow.customers[0]
          : workflow.customers;

        const matchResult = matchEventToTrigger(
          event,
          triggerObj.config.eventConfig || {},
          customer as { name?: string; domain?: string } | null
        );

        if (matchResult.matches) {
          matchedWorkflows.push({
            workflowExecutionId: workflow.id,
            customerId: workflow.customer_id,
            triggerId: triggerObj.id,
            matchReason: matchResult.reason,
          });

          // Wake the workflow
          const wakeResult = await wakeWorkflow(
            workflow.id,
            triggerObj.id,
            event,
            supabase
          );

          if (wakeResult) {
            wokenWorkflows++;
          }

          // Only match first matching trigger per workflow
          break;
        }
      }
    }

    // Store event for audit/debugging
    await storeExternalEvent(event, matchedWorkflows, supabase);

    return { matchedWorkflows, wokenWorkflows };
  } catch (error) {
    console.error('[Human-OS Webhook] Error processing event:', error);
    return { matchedWorkflows, wokenWorkflows: 0 };
  }
}

// ============================================================================
// EVENT MATCHING
// ============================================================================

function matchEventToTrigger(
  event: ExternalWakeEvent,
  triggerConfig: Record<string, unknown>,
  customer: { name?: string; domain?: string } | null
): { matches: boolean; reason: string } {
  const { payload } = event;

  switch (event.eventType) {
    case 'company_funding_event': {
      const config = triggerConfig as CompanyFundingEventConfig;

      // Match company name
      const targetCompany = config.companyName || customer?.name;
      if (targetCompany && payload.companyName) {
        if (!payload.companyName.toLowerCase().includes(targetCompany.toLowerCase())) {
          return { matches: false, reason: 'Company name mismatch' };
        }
      }

      // Check minimum amount
      if (config.minAmount && payload.details.amount) {
        const amount = payload.details.amount as number;
        if (amount < config.minAmount) {
          return { matches: false, reason: `Funding amount ${amount} below threshold ${config.minAmount}` };
        }
      }

      // Check funding round
      if (config.fundingRounds && config.fundingRounds.length > 0 && payload.details.round) {
        const round = payload.details.round as string;
        if (!config.fundingRounds.some(r => r.toLowerCase() === round.toLowerCase())) {
          return { matches: false, reason: `Funding round ${round} not in watched list` };
        }
      }

      return {
        matches: true,
        reason: `Company ${payload.companyName} raised funding`,
      };
    }

    case 'contact_job_change': {
      const config = triggerConfig as ContactJobChangeConfig;

      // Match contact name or email
      if (config.contactName && payload.contactName) {
        if (!payload.contactName.toLowerCase().includes(config.contactName.toLowerCase())) {
          return { matches: false, reason: 'Contact name mismatch' };
        }
      }

      if (config.contactEmail && payload.contactEmail) {
        if (payload.contactEmail.toLowerCase() !== config.contactEmail.toLowerCase()) {
          return { matches: false, reason: 'Contact email mismatch' };
        }
      }

      // Check watched titles
      if (config.watchedTitles && config.watchedTitles.length > 0 && payload.details.newTitle) {
        const newTitle = payload.details.newTitle as string;
        const matchesTitle = config.watchedTitles.some(t =>
          newTitle.toLowerCase().includes(t.toLowerCase())
        );
        if (!matchesTitle) {
          return { matches: false, reason: `New title ${newTitle} not in watched list` };
        }
      }

      return {
        matches: true,
        reason: `Contact ${payload.contactName} changed jobs`,
      };
    }

    case 'linkedin_activity_spike': {
      const config = triggerConfig as LinkedInActivitySpikeConfig;

      // Match contact name
      if (config.contactName && payload.contactName) {
        if (!payload.contactName.toLowerCase().includes(config.contactName.toLowerCase())) {
          return { matches: false, reason: 'Contact name mismatch' };
        }
      }

      // Check activity threshold
      const minPosts = config.minPostsPerWeek || 3;
      const postsThisWeek = payload.details.postsThisWeek as number;
      if (postsThisWeek < minPosts) {
        return { matches: false, reason: `Activity ${postsThisWeek} below threshold ${minPosts}` };
      }

      return {
        matches: true,
        reason: `Contact ${payload.contactName} has activity spike (${postsThisWeek} posts)`,
      };
    }

    case 'company_news_event': {
      const config = triggerConfig as CompanyNewsEventConfig;

      // Match company name
      const targetCompany = config.companyName || customer?.name;
      if (targetCompany && payload.companyName) {
        if (!payload.companyName.toLowerCase().includes(targetCompany.toLowerCase())) {
          return { matches: false, reason: 'Company name mismatch' };
        }
      }

      // Check keywords
      if (config.keywords && config.keywords.length > 0 && payload.details.headline) {
        const headline = payload.details.headline as string;
        const matchesKeyword = config.keywords.some(k =>
          headline.toLowerCase().includes(k.toLowerCase())
        );
        if (!matchesKeyword) {
          return { matches: false, reason: 'No matching keywords in headline' };
        }
      }

      // Check sentiment
      if (config.sentiment && config.sentiment !== 'any' && payload.details.sentiment) {
        const sentiment = payload.details.sentiment as string;
        if (sentiment !== config.sentiment) {
          return { matches: false, reason: `Sentiment ${sentiment} doesn't match ${config.sentiment}` };
        }
      }

      return {
        matches: true,
        reason: `Company ${payload.companyName} in news`,
      };
    }

    case 'relationship_opinion_added': {
      const config = triggerConfig as RelationshipOpinionAddedConfig;

      // Match entity type
      if (config.entityType && config.entityType !== 'any' && payload.details.entityType) {
        const entityType = payload.details.entityType as string;
        if (entityType !== config.entityType) {
          return { matches: false, reason: `Entity type ${entityType} doesn't match ${config.entityType}` };
        }
      }

      // Match entity name
      if (config.entityName) {
        const entityName = (payload.contactName || payload.companyName || '') as string;
        if (!entityName.toLowerCase().includes(config.entityName.toLowerCase())) {
          return { matches: false, reason: 'Entity name mismatch' };
        }
      }

      // Check opinion types
      if (config.opinionTypes && config.opinionTypes.length > 0 && payload.details.opinionType) {
        const opinionType = payload.details.opinionType as string;
        if (!config.opinionTypes.includes(opinionType)) {
          return { matches: false, reason: `Opinion type ${opinionType} not in watched list` };
        }
      }

      return {
        matches: true,
        reason: `New opinion added for ${payload.contactName || payload.companyName}`,
      };
    }

    default:
      return { matches: false, reason: 'Unknown event type' };
  }
}

// ============================================================================
// WORKFLOW WAKE
// ============================================================================

async function wakeWorkflow(
  workflowExecutionId: string,
  triggerId: string,
  event: ExternalWakeEvent,
  supabase: ReturnType<typeof createServiceRoleClient>
): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    // Update workflow status
    const { error } = await supabase
      .from('workflow_executions')
      .update({
        status: 'in_progress',
        snoozed_until: null,
        last_evaluated_at: now,
        trigger_fired_at: now,
        fired_trigger_type: 'event',
        // Store event details for reference
        metadata: {
          woken_by_external_event: true,
          external_event_id: event.eventId,
          external_event_type: event.eventType,
          fired_trigger_id: triggerId,
        },
      })
      .eq('id', workflowExecutionId);

    if (error) {
      console.error(`[Human-OS Webhook] Failed to wake workflow ${workflowExecutionId}:`, error);
      return false;
    }

    console.log(`[Human-OS Webhook] Woke workflow ${workflowExecutionId} via ${event.eventType}`);
    return true;
  } catch (error) {
    console.error(`[Human-OS Webhook] Error waking workflow ${workflowExecutionId}:`, error);
    return false;
  }
}

// ============================================================================
// EVENT STORAGE
// ============================================================================

async function storeExternalEvent(
  event: ExternalWakeEvent,
  matchedWorkflows: MatchedWorkflow[],
  supabase: ReturnType<typeof createServiceRoleClient>
): Promise<void> {
  try {
    // Store in external_wake_events table (if it exists)
    // This is for audit/debugging purposes
    await supabase
      .from('external_wake_events')
      .insert({
        event_id: event.eventId,
        event_type: event.eventType,
        event_payload: event.payload,
        source: event.source,
        received_at: new Date().toISOString(),
        processed: true,
        matched_workflow_ids: matchedWorkflows.map(m => m.workflowExecutionId),
      })
      .single();
  } catch {
    // Table may not exist yet - that's okay
    console.log('[Human-OS Webhook] external_wake_events table not available');
  }
}
