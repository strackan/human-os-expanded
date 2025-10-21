import { NextResponse } from 'next/server';
import { AlertService } from '@/lib/services/AlertService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Fetching alerts...');
    const alerts = await AlertService.getRecentAlerts();
    console.log('Alerts fetched:', alerts);
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Detailed error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 