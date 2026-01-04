// GET /api/templates/cs-assessment
// Returns CS Assessment template structure (stateless)
// No authentication required - this is public template data

import { NextResponse } from 'next/server';
import { loadAssessmentConfig } from '@/lib/assessment/question-loader';

export async function GET() {
  try {
    // Load assessment template
    const assessmentConfig = loadAssessmentConfig();

    // Return template structure only (no user data, no storage)
    return NextResponse.json({
      template: assessmentConfig,
      version: assessmentConfig.version,
      estimated_minutes: assessmentConfig.estimatedMinutes,
    });
  } catch (error: any) {
    console.error('Error loading assessment template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load template' },
      { status: 500 }
    );
  }
}

// Enable CORS for any consumer
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
