import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/services/CustomerService';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    const customer = await CustomerService.getCustomerById(resolvedParams.id, supabase);

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Format metrics from customer data
    const metrics = [
      {
        label: 'ARR',
        value: (customer as any).arr ? `$${((customer as any).arr / 1000).toFixed(0)}K` : '$185K',
        status: 'green' as const,
        trend: 'up' as const
      },
      {
        label: 'Health Score',
        value: customer.health_score ? `${customer.health_score}/100` : '85/100',
        status: (customer.health_score
          ? (customer.health_score >= 80 ? 'green' : customer.health_score >= 60 ? 'yellow' : 'red')
          : 'green') as 'green' | 'yellow' | 'red',
        trend: 'flat' as const
      },
      {
        label: 'Renewal',
        value: customer.renewal_date
          ? new Date(customer.renewal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'Mar 15',
        sublabel: customer.renewal_date
          ? `${Math.ceil((new Date(customer.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`
          : '45 days',
        status: 'yellow' as const
      },
      {
        label: 'Risk Score',
        value: (customer as any).risk_level
          ? (customer as any).risk_level.charAt(0).toUpperCase() + (customer as any).risk_level.slice(1)
          : 'Low',
        status: ((customer as any).risk_level === 'high' ? 'red'
          : (customer as any).risk_level === 'medium' ? 'yellow'
          : 'green') as 'green' | 'yellow' | 'red',
        trend: 'flat' as const
      }
    ];

    return NextResponse.json({
      metrics,
      customerName: customer.name || customer.domain || 'Customer'
    });
  } catch (error) {
    console.error('Error fetching customer metrics:', error);

    // Check if it's a validation error (invalid UUID format)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('invalid input syntax for type uuid')) {
      return NextResponse.json(
        { error: 'Invalid customer ID format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch customer metrics' },
      { status: 500 }
    );
  }
}
