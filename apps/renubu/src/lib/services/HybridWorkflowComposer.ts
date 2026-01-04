/**
 * Hybrid Workflow Composer
 *
 * Allows mixing legacy slides (from slide library) with NEW slides (from template transformer)
 * for incremental migration from v1.8 to v1.9
 *
 * Usage:
 * const config = await composeHybrid({
 *   workflowId: 'obsidian-black-renewal-v2',
 *   templateName: 'obsidian_black_renewal',
 *   customerId,
 *   customerContext,
 *   useNewSlides: [0] // Use template system for slide 0 (greeting), legacy for others
 * });
 */

import { composeFromDatabase } from '../workflows/db-composer';
import { WorkflowConfigTransformer } from './WorkflowConfigTransformer';
import type { WorkflowConfig, WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';

export interface HybridComposeParams {
  workflowId: string;           // Legacy workflow ID (for db-composer)
  templateName: string;          // Template name (for compilation service)
  customerId: string;
  userId: string;                // User ID for compilation API
  customerContext: any;
  useNewSlides: number[];        // Array of slide indexes to use NEW system (e.g., [0, 1, 2])
}

export class HybridWorkflowComposer {
  /**
   * Compose a hybrid workflow mixing legacy and NEW slides
   */
  static async compose(params: HybridComposeParams): Promise<WorkflowConfig | null> {
    const { workflowId, templateName, customerId, userId, customerContext, useNewSlides } = params;

    try {
      console.log('[HybridComposer] Starting hybrid composition');
      console.log('[HybridComposer] Legacy workflow:', workflowId);
      console.log('[HybridComposer] Template:', templateName);
      console.log('[HybridComposer] Using NEW slides for indexes:', useNewSlides);

      // 1. Get legacy workflow from database (v1.8 slide library)
      const legacyConfig = await composeFromDatabase(
        workflowId,
        null, // company_id
        customerContext
      );

      if (!legacyConfig) {
        console.error('[HybridComposer] Failed to load legacy workflow');
        return null;
      }

      console.log('[HybridComposer] Legacy config loaded:', legacyConfig.slides?.length, 'slides');

      // 2. Compile template (v1.9 system) via API
      const compileResponse = await fetch('/api/workflows/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName,
          customerId,
          userId,
          triggerContext: {
            current_arr: customerContext.current_arr,
            health_score: customerContext.health_score,
            days_to_renewal: customerContext.days_until_renewal
          },
          createExecution: false // Don't create execution yet
        })
      });

      if (!compileResponse.ok) {
        const errorText = await compileResponse.text();
        console.error('[HybridComposer] Failed to compile template:', errorText);
        return null;
      }

      const compileResult = await compileResponse.json();
      const compiled = compileResult.data?.compiledWorkflow;

      if (!compiled) {
        console.error('[HybridComposer] No compiled workflow in response');
        return null;
      }

      console.log('[HybridComposer] Template compiled:', compiled.steps.length, 'steps');

      // 3. Transform compiled workflow to WorkflowConfig format
      const newConfig = WorkflowConfigTransformer.transformToWorkflowConfig(
        compiled,
        customerContext.name
      );

      console.log('[HybridComposer] Template transformed:', newConfig.slides?.length, 'slides');

      // 4. Create hybrid slides array
      const hybridSlides: WorkflowSlide[] = [];

      for (let i = 0; i < (legacyConfig.slides?.length || 0); i++) {
        if (useNewSlides.includes(i)) {
          // Use NEW slide from template
          if (newConfig.slides && newConfig.slides[i]) {
            console.log(`[HybridComposer] Using NEW slide ${i}: ${newConfig.slides[i].title}`);
            hybridSlides.push({
              ...newConfig.slides[i],
              slideNumber: i // Ensure correct slide number
            });
          } else {
            console.warn(`[HybridComposer] NEW slide ${i} not found, falling back to legacy`);
            hybridSlides.push(legacyConfig.slides![i]);
          }
        } else {
          // Use legacy slide
          console.log(`[HybridComposer] Using LEGACY slide ${i}: ${legacyConfig.slides![i].title}`);
          hybridSlides.push(legacyConfig.slides![i]);
        }
      }

      // 5. Create hybrid config
      const hybridConfig = {
        ...legacyConfig,
        slides: hybridSlides,
      } as WorkflowConfig;

      // Store hybrid metadata for debugging (not part of WorkflowConfig type)
      (hybridConfig as any)._hybridInfo = {
        legacySlides: legacyConfig.slides?.length || 0,
        newSlides: useNewSlides.length,
        hybridIndexes: useNewSlides
      };

      console.log('[HybridComposer] Hybrid workflow created:',
        hybridSlides.length, 'total slides,',
        useNewSlides.length, 'NEW,',
        (hybridSlides.length - useNewSlides.length), 'legacy'
      );

      return hybridConfig;
    } catch (error) {
      console.error('[HybridComposer] Error composing hybrid workflow:', error);
      return null;
    }
  }
}
