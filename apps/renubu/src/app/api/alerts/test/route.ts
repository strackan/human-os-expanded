import { NextResponse } from 'next/server';
import { AlertService } from '@/lib/services/AlertService';

export async function POST() {
  try {
    // Create a test alert
    const testAlert = {
      renewal_id: '00000000-0000-0000-0000-000000000000', // This will be replaced with a real renewal ID
      alert_type: 'TEST_ALERT',
      alert_subtype: 'SYSTEM_TEST',
      data_source: 'SYSTEM',
      confidence_score: 1.0,
      current_value: { message: 'This is a test alert' },
      previous_value: null,
      metadata: { test: true }
    };

    const alert = await AlertService.createAlert(testAlert);
    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error creating test alert:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create test alert', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 