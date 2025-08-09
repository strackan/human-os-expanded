import { NextRequest, NextResponse } from 'next/server';
import { mockCustomers } from '@/data/mockCustomers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { action } = body;
    const resolvedParams = await params;
    
    const customer = mockCustomers.find(c => c.id === resolvedParams.id);
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Handle different management actions
    switch (action) {
      case 'demo':
        return NextResponse.json({
          message: 'Demo action executed successfully',
          customer: customer.name,
          action: 'demo'
        });
      
      case 'activate':
        return NextResponse.json({
          message: 'Customer activated successfully',
          customer: customer.name,
          action: 'activate'
        });
      
      case 'deactivate':
        return NextResponse.json({
          message: 'Customer deactivated successfully',
          customer: customer.name,
          action: 'deactivate'
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error managing customer:', error);
    return NextResponse.json(
      { error: 'Failed to manage customer' },
      { status: 500 }
    );
  }
} 