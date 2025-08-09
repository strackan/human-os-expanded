import { NextRequest, NextResponse } from 'next/server';
import { mockCustomers } from '@/data/mockCustomers';
import { Customer } from '@/data/mockCustomers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').toLowerCase();
    const sort = searchParams.get('sort') || 'name';
    const order = searchParams.get('order') === 'desc' ? 'desc' : 'asc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const filtered = mockCustomers.filter(c =>
      c.name.toLowerCase().includes(search) ||
      c.industry.toLowerCase().includes(search)
    );

    filtered.sort((a: Customer, b: Customer) => {
      const aVal = (a as any)[sort as keyof Customer];
      const bVal = (b as any)[sort as keyof Customer];
      if (aVal === undefined || bVal === undefined) return 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return NextResponse.json({
      customers: paginated,
      page,
      pageSize,
      count: total,
      totalPages: Math.ceil(total / pageSize)
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

    const newCustomer: Customer = {
      id: `customer-${Date.now()}`, // Generate unique ID
      name: body.name,
      industry: body.industry || '',
      tier: body.tier || 'standard',
      health_score: body.health_score || 50,
      renewal_date: body.renewal_date || new Date().toISOString().split('T')[0],
      current_arr: body.current_arr ? parseFloat(body.current_arr) : 0,
      usage: body.usage ? parseFloat(body.usage) : 0,
      nps_score: body.nps_score ? parseFloat(body.nps_score) : 0
    };

    // Add to mock data
    mockCustomers.push(newCustomer);

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