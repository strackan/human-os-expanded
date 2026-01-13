/**
 * Pricing Recommendation API Endpoint
 *
 * POST /api/workflows/pricing/recommend
 *
 * Calculates optimal pricing recommendation for a customer renewal.
 * Core value proposition of Renubu platform.
 *
 * Target: >70% recommendation acceptance rate
 */

import { NextRequest, NextResponse } from 'next/server';
import { PricingOptimizationService } from '@/lib/workflows/services/PricingOptimizationService';
import type { CSMInputs } from '@/lib/workflows/services/PricingOptimizationService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RequestBody {
  customerId: string;
  executionId?: string; // Optional: link to workflow execution
  csmInputs?: CSMInputs;
  storeRecommendation?: boolean; // Whether to store in database for tracking
}

/**
 * Calculate pricing recommendation
 *
 * POST /api/workflows/pricing/recommend
 *
 * Body:
 * {
 *   "customerId": "uuid",
 *   "executionId": "uuid" (optional),
 *   "csmInputs": {
 *     "price_increase_cap": 10,  // Optional: max % increase
 *     "risk_tolerance": "moderate"  // Optional: conservative | moderate | aggressive
 *   },
 *   "storeRecommendation": true  // Optional: store for tracking (default: true if executionId provided)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "recommendation": {
 *     "targetPrice": 120000,
 *     "increasePercent": 7.5,
 *     "increaseAmount": 7500,
 *     "confidence": 85,
 *     "scenarios": [...],
 *     "factors": {...},
 *     "dataQuality": {...}
 *   },
 *   "recommendationId": "uuid"  // If stored
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    // Validate required fields
    if (!body.customerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'customerId is required'
        },
        { status: 400 }
      );
    }

    // Calculate pricing recommendation
    const recommendation = await PricingOptimizationService.calculateRecommendation(
      body.customerId,
      body.csmInputs || {}
    );

    // Store recommendation if requested (default: true if executionId provided)
    let recommendationId: string | undefined;
    const shouldStore = body.storeRecommendation ?? (!!body.executionId);

    if (shouldStore && body.executionId) {
      recommendationId = await PricingOptimizationService.storeRecommendation(
        body.customerId,
        body.executionId,
        recommendation
      );
    }

    return NextResponse.json({
      success: true,
      recommendation,
      recommendationId
    });
  } catch (error: any) {
    console.error('Pricing recommendation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to calculate pricing recommendation'
      },
      { status: 500 }
    );
  }
}

/**
 * Get pricing acceptance metrics
 *
 * GET /api/workflows/pricing/recommend
 *
 * Returns acceptance rate and accuracy metrics for last 90 days.
 * Used to track >70% acceptance rate target.
 *
 * Response:
 * {
 *   "success": true,
 *   "metrics": {
 *     "acceptanceRate": 78.5,
 *     "totalRecommendations": 42,
 *     "avgPriceDeviation": 2500,
 *     ...
 *   }
 * }
 */
export async function GET() {
  try {
    const metrics = await PricingOptimizationService.getAcceptanceMetrics();

    return NextResponse.json({
      success: true,
      metrics
    });
  } catch (error: any) {
    console.error('Failed to get pricing metrics:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get pricing metrics'
      },
      { status: 500 }
    );
  }
}
