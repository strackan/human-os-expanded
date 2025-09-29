import { NextResponse } from 'next/server';
import { WorkflowService } from '@/lib/services/WorkflowService';

export async function GET() {
  try {
    const workflows = await WorkflowService.getActiveWorkflows();
    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
} 