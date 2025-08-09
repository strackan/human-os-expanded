import { NextRequest, NextResponse } from 'next/server';
import { mockCustomers } from '@/data/mockCustomers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const customer = mockCustomers.find(c => c.id === resolvedParams.id);
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const resolvedParams = await params;
    const customerIndex = mockCustomers.findIndex(c => c.id === resolvedParams.id);
    
    if (customerIndex === -1) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Update customer with provided fields
    mockCustomers[customerIndex] = {
      ...mockCustomers[customerIndex],
      ...body
    };

    return NextResponse.json({
      customer: mockCustomers[customerIndex],
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
} 