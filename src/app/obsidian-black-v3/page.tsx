/**
 * Obsidian Black Dashboard V3 - FULLY Database-Driven
 *
 * This version demonstrates the Phase 3 database-driven workflow system:
 * ✅ Fetches workflow from database (not code)
 * ✅ Uses slide library for composition
 * ✅ Multi-tenant ready (stock + custom workflows)
 * ✅ Real-time workflow loading
 *
 * Compare to:
 * - V1: /obsidian-black (hardcoded config)
 * - V2: /obsidian-black-v2 (slide library WIP)
 * - V3: /obsidian-black-v3 (THIS - fully DB-driven!)
 */

import ObsidianBlackV3Client from './ObsidianBlackV3Client';
import { composeFromDatabase } from '@/lib/workflows/db-composer';
import { createClient } from '@/lib/supabase/server';

export default async function ObsidianBlackDashboardV3() {
  let workflowConfig = null;
  let workflowMetadata = null;
  let error = null;

  try {
    // 🔥 THIS IS THE KEY DIFFERENCE - FETCHING FROM DATABASE!
    console.log('🔧 [V3] Fetching workflow from database...');

    const supabase = await createClient();

    // Fetch the obsidian-black-renewal workflow from database
    const config = await composeFromDatabase(
      'obsidian-black-renewal', // workflow_id from database
      null, // company_id (null = stock workflow)
      {
        // Context for template hydration (customer + pricing data)
        customer: {
          name: 'Obsidian Black',
          current_arr: 185000,
          health_score: 87,
          contract_end_date: '2026-10-21',
          days_until_renewal: 365,
          utilization: 87,
          monthsToRenewal: 12,
          seatCount: 50,
          primaryContact: {
            name: 'Marcus Chen',
            firstName: 'Marcus',
            lastName: 'Chen',
            title: 'VP of Engineering',
          },
        },
        pricing: {
          currentARR: 185000,
          currentPricePerSeat: 3700,
          proposedARR: 199800,
          proposedPricePerSeat: 3996,
          increasePercent: 8,
          increaseAmount: 14800,
          increasePerSeat: 296,
          proposedPercentile: 50,
        },
      } as any,
      supabase
    );

    workflowConfig = config;
    workflowMetadata = {
      workflowId: config.workflowId,
      workflowName: config.workflowName,
      workflowType: config.workflowType,
      slideCount: config.slides?.length || 0,
      source: 'database',
    };

    console.log('✅ [V3] Workflow loaded from database!', {
      id: workflowMetadata.workflowId,
      slides: workflowMetadata.slideCount,
    });
  } catch (err: any) {
    console.error('❌ [V3] Error loading workflow:', err.message);
    error = err.message;

    // Fallback to obsidian-black-pricing for demo purposes
    console.log('⚠️  [V3] Falling back to obsidian-black-pricing config');
    const { obsidianBlackPricingConfig } = await import('@/config/workflows/obsidianBlackPricing.config');
    workflowConfig = obsidianBlackPricingConfig;
    workflowMetadata = {
      workflowId: 'obsidian-black-pricing',
      workflowName: 'Obsidian Black Pricing (Fallback)',
      workflowType: 'renewal',
      slideCount: obsidianBlackPricingConfig.slides?.length || 0,
      source: 'fallback-code',
    };
  }

  return (
    <ObsidianBlackV3Client
      initialWorkflowConfig={workflowConfig}
      workflowMetadata={workflowMetadata}
      loadError={error}
    />
  );
}
