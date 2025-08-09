import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/services/CustomerService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'name';
    const order = searchParams.get('order') === 'desc' ? 'desc' : 'asc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    // Use CustomerService to get customers
    const filters = search ? { search } : {};
    const sortOptions = { field: sort as any, direction: order as 'asc' | 'desc' };
    
    const result = await CustomerService.getCustomers(filters, sortOptions, page, pageSize);

    return NextResponse.json({
      customers: result.customers,
      page,
      pageSize,
      count: result.total,
      totalPages: Math.ceil(result.total / pageSize)
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      );
    }

    // Use CustomerService to create customer
    const newCustomer = await CustomerService.createCustomer({
      name: body.name,
      domain: body.domain || '',
      industry: body.industry || '',
      health_score: body.health_score || 50,
      renewal_date: body.renewal_date || new Date().toISOString().split('T')[0],
      current_arr: body.current_arr ? parseFloat(body.current_arr) : 0,
      assigned_to: body.assigned_to || null
    });

    return NextResponse.json(
      { customer: newCustomer, message: 'Customer created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}