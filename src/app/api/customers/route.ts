import { NextRequest, NextResponse } from 'next/server';

interface Customer {
  id: string;
  name: string;
  industry: string;
  tier: string;
  health_score: number;
  primary_contact_name?: string;
  primary_contact_email?: string;
  renewal_date?: string;
  current_arr?: number;
  risk_level?: string;
}

// Mock data for development - this will be replaced with database queries
let mockCustomers: Customer[] = [
  {
    id: "customer-1",
    name: "Acme Corporation",
    industry: "Technology",
    tier: "enterprise",
    health_score: 85,
    primary_contact_name: "Sarah Johnson",
    primary_contact_email: "sarah@acme.com",
    renewal_date: "2024-08-15",
    current_arr: 450000,
    risk_level: "low"
  },
  {
    id: "customer-2",
    name: "RiskyCorp",
    industry: "Manufacturing",
    tier: "premium",
    health_score: 45,
    primary_contact_name: "John Smith",
    primary_contact_email: "john@riskycorp.com",
    renewal_date: "2024-07-30",
    current_arr: 380000,
    risk_level: "high"
  },
  {
    id: "customer-3",
    name: "TechStart Inc",
    industry: "SaaS",
    tier: "standard",
    health_score: 72,
    primary_contact_name: "Mike Chen",
    primary_contact_email: "mike@techstart.com",
    renewal_date: "2024-09-20",
    current_arr: 120000,
    risk_level: "medium"
  },
  {
    id: "customer-4",
    name: "Global Solutions",
    industry: "Consulting",
    tier: "enterprise",
    health_score: 92,
    primary_contact_name: "Lisa Wang",
    primary_contact_email: "lisa@globalsolutions.com",
    renewal_date: "2024-10-05",
    current_arr: 750000,
    risk_level: "low"
  },
  {
    id: "customer-5",
    name: "StartupXYZ",
    industry: "Fintech",
    tier: "standard",
    health_score: 35,
    primary_contact_name: "Alex Rodriguez",
    primary_contact_email: "alex@startupxyz.com",
    renewal_date: "2024-07-15",
    current_arr: 85000,
    risk_level: "critical"
  }
];

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would query the database
    // SELECT * FROM customers ORDER BY name
    
    return NextResponse.json({ 
      customers: mockCustomers,
      count: mockCustomers.length
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

    // In a real implementation, this would insert into the database
    // INSERT INTO customers (name, industry, tier, health_score, ...) VALUES (...)
    
    const newCustomer: Customer = {
      id: `customer-${Date.now()}`, // Generate unique ID
      name: body.name,
      industry: body.industry || '',
      tier: body.tier || 'standard',
      health_score: body.health_score || 50,
      primary_contact_name: body.primary_contact_name,
      primary_contact_email: body.primary_contact_email,
      renewal_date: body.renewal_date,
      current_arr: body.current_arr ? parseFloat(body.current_arr) : undefined,
      risk_level: body.risk_level || 'medium'
    };

    // Add to mock data
    mockCustomers.push(newCustomer);

    return NextResponse.json({ 
      customer: newCustomer,
      message: 'Customer created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}