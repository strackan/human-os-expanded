/**
 * Pricing Outcome API Endpoint
 *
 * PATCH /api/workflows/pricing/outcome
 *
 * Updates pricing recommendation with actual renewal outcome.
 * Used to track acceptance rate and measure recommendation accuracy.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PricingOptimizationService } from '@/lib/workflows/services/PricingOptimizationService';
import type { PricingOutcome } from '@/lib/workflows/services/PricingOptimizationService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Update pricing recommendation with actual renewal outcome
 *
 * PATCH /api/workflows/pricing/outcome
 *
 * Body:
 * {
 *   "recommendationId": "uuid",
 *   "accepted": true,
 *   "finalPrice": 118000,
 *   "selectedScenario": "Recommended",  // Optional: Conservative | Recommended | Aggressive | Custom
 *   "notes": "Customer negotiated down slightly but accepted overall"  // Optional
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Pricing outcome updated successfully"
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const outcome: PricingOutcome = await request.json();

    // Validate required fields
    if (!outcome.recommendationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'recommendationId is required'
        },
        { status: 400 }
      );
    }

    if (outcome.accepted === undefined || outcome.accepted === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'accepted (boolean) is required'
        },
        { status: 400 }
      );
    }

    if (!outcome.finalPrice || outcome.finalPrice <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'finalPrice must be a positive number'
        },
        { status: 400 }
      );
    }

    // Update outcome in database
    await PricingOptimizationService.updateOutcome(outcome);

    return NextResponse.json({
      success: true,
      message: 'Pricing outcome updated successfully'
    });
  } catch (error: any) {
    console.error('Failed to update pricing outcome:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update pricing outcome'
      },
      { status: 500 }
    );
  }
}
