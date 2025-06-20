import { NextRequest, NextResponse } from 'next/server';
import { WorkflowEngine, Customer, Workflow } from '../../../../lib/workflowEngine';

// Mock data for development - this will be replaced with database queries
const mockCustomers: Customer[] = [
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
    // In a real implementation, this would:
    // 1. Query the database for customers with active events
    // 2. Calculate priority scores for each customer
    // 3. Return the highest priority customer with their workflow
    
    // For now, we'll generate workflows for all customers and find the highest priority one
    const customerWorkflows = mockCustomers.map(customer => {
      const workflow = WorkflowEngine.generateWorkflow(customer);
      return {
        customer,
        workflow,
        priority_score: workflow.priority_score
      };
    });

    // Sort by priority score (highest first)
    customerWorkflows.sort((a, b) => b.priority_score - a.priority_score);

    // Return the highest priority task
    const highestPriorityTask = customerWorkflows[0];

    if (!highestPriorityTask) {
      return NextResponse.json({ 
        task: null,
        message: 'No active tasks available'
      });
    }

    return NextResponse.json({ 
      task: {
        customer: highestPriorityTask.customer,
        workflow: highestPriorityTask.workflow
      },
      priority_score: highestPriorityTask.priority_score
    });
  } catch (error) {
    console.error('Error fetching next task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch next task' },
      { status: 500 }
    );
  }
} 