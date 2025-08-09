export interface Customer {
  id: string;
  name: string;
  industry: string;
  tier: string;
  health_score: number;
  primary_contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    title?: string;
  };
  renewal_date?: string;
  current_arr?: number;
  risk_level?: string;
}

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  priority: 'high' | 'medium' | 'low';
  estimated_time: number; // in minutes
  category: 'communication' | 'analysis' | 'action' | 'follow_up';
}

export interface Workflow {
  id: string;
  customer_id: string;
  workflow_type: string;
  title: string;
  description: string;
  steps: WorkflowStep[];
  priority_score: number;
  estimated_completion_time: number; // in minutes
  risk_factors: string[];
  recommendations: string[];
  created_at: Date;
}

export class WorkflowEngine {
  private static generateStepId(): string {
    return `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static calculatePriorityScore(customer: Customer): number {
    let score = 0;
    
    // Base score from health
    score += (100 - customer.health_score) * 0.3; // Lower health = higher priority
    
    // Renewal urgency
    if (customer.renewal_date) {
      const daysUntilRenewal = Math.ceil(
        (new Date(customer.renewal_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilRenewal <= 7) score += 40;
      else if (daysUntilRenewal <= 30) score += 30;
      else if (daysUntilRenewal <= 90) score += 20;
      else if (daysUntilRenewal <= 180) score += 10;
    }
    
    // Risk level
    switch (customer.risk_level) {
      case 'critical': score += 30; break;
      case 'high': score += 20; break;
      case 'medium': score += 10; break;
      case 'low': score += 5; break;
    }
    
    // ARR value (higher value = higher priority)
    if (customer.current_arr) {
      if (customer.current_arr >= 500000) score += 25;
      else if (customer.current_arr >= 250000) score += 15;
      else if (customer.current_arr >= 100000) score += 10;
      else score += 5;
    }
    
    // Tier importance
    switch (customer.tier) {
      case 'enterprise': score += 15; break;
      case 'premium': score += 10; break;
      case 'standard': score += 5; break;
    }
    
    return Math.min(100, Math.max(0, score));
  }

  private static generateRenewalWorkflow(customer: Customer): Workflow {
    const daysUntilRenewal = customer.renewal_date 
      ? Math.ceil((new Date(customer.renewal_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    const steps: WorkflowStep[] = [];
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    
    // Critical renewal workflow (7 days or less)
    if (daysUntilRenewal <= 7) {
      steps.push(
        {
          id: this.generateStepId(),
          title: "Immediate Contact Required",
          description: "Call the primary contact immediately to discuss renewal status",
          completed: false,
          required: true,
          priority: 'high',
          estimated_time: 30,
          category: 'communication'
        },
        {
          id: this.generateStepId(),
          title: "Review Contract Terms",
          description: "Analyze current contract and identify any issues",
          completed: false,
          required: true,
          priority: 'high',
          estimated_time: 45,
          category: 'analysis'
        },
        {
          id: this.generateStepId(),
          title: "Prepare Renewal Proposal",
          description: "Create customized renewal proposal with incentives",
          completed: false,
          required: true,
          priority: 'high',
          estimated_time: 60,
          category: 'action'
        }
      );
      riskFactors.push("Critical renewal window", "High risk of churn");
      recommendations.push("Offer immediate incentives", "Schedule executive meeting");
    }
    // High priority renewal (30 days or less)
    else if (daysUntilRenewal <= 30) {
      steps.push(
        {
          id: this.generateStepId(),
          title: "Schedule Renewal Meeting",
          description: "Set up a meeting with the primary contact to discuss renewal",
          completed: false,
          required: true,
          priority: 'high',
          estimated_time: 15,
          category: 'communication'
        },
        {
          id: this.generateStepId(),
          title: "Analyze Usage Patterns",
          description: "Review customer usage and identify expansion opportunities",
          completed: false,
          required: true,
          priority: 'medium',
          estimated_time: 30,
          category: 'analysis'
        },
        {
          id: this.generateStepId(),
          title: "Prepare Business Review",
          description: "Create a comprehensive business review presentation",
          completed: false,
          required: true,
          priority: 'medium',
          estimated_time: 45,
          category: 'action'
        }
      );
      riskFactors.push("Approaching renewal date", "Competitive pressure");
      recommendations.push("Highlight value delivered", "Identify expansion opportunities");
    }
    // Standard renewal workflow
    else {
      steps.push(
        {
          id: this.generateStepId(),
          title: "Send Renewal Reminder",
          description: "Send a friendly reminder about upcoming renewal",
          completed: false,
          required: false,
          priority: 'medium',
          estimated_time: 10,
          category: 'communication'
        },
        {
          id: this.generateStepId(),
          title: "Review Customer Health",
          description: "Analyze customer health metrics and identify risks",
          completed: false,
          required: true,
          priority: 'medium',
          estimated_time: 20,
          category: 'analysis'
        },
        {
          id: this.generateStepId(),
          title: "Plan Engagement Strategy",
          description: "Develop a strategic engagement plan for the renewal period",
          completed: false,
          required: true,
          priority: 'medium',
          estimated_time: 30,
          category: 'action'
        }
      );
      riskFactors.push("Standard renewal process");
      recommendations.push("Maintain regular communication", "Monitor usage patterns");
    }

    // Add health-based steps
    if (customer.health_score < 50) {
      steps.push(
        {
          id: this.generateStepId(),
          title: "Address Health Concerns",
          description: "Investigate and address factors affecting customer health",
          completed: false,
          required: true,
          priority: 'high',
          estimated_time: 45,
          category: 'analysis'
        }
      );
      riskFactors.push("Low health score", "Potential churn risk");
      recommendations.push("Implement health improvement plan", "Increase engagement frequency");
    }

    // Add ARR-based recommendations
    if (customer.current_arr && customer.current_arr >= 250000) {
      steps.push(
        {
          id: this.generateStepId(),
          title: "Executive Relationship Review",
          description: "Schedule executive-level relationship review",
          completed: false,
          required: false,
          priority: 'medium',
          estimated_time: 60,
          category: 'communication'
        }
      );
      recommendations.push("Maintain executive relationships", "Consider expansion opportunities");
    }

    const priorityScore = this.calculatePriorityScore(customer);
    const estimatedTime = steps.reduce((total, step) => total + step.estimated_time, 0);

    return {
      id: `workflow-${Date.now()}`,
      customer_id: customer.id,
      workflow_type: 'renewal',
      title: `Renewal Workflow - ${customer.name}`,
      description: `Comprehensive renewal management for ${customer.name} (${daysUntilRenewal} days until renewal)`,
      steps,
      priority_score: priorityScore,
      estimated_completion_time: estimatedTime,
      risk_factors: riskFactors,
      recommendations,
      created_at: new Date()
    };
  }

  private static generateHealthImprovementWorkflow(customer: Customer): Workflow {
    const steps: WorkflowStep[] = [
      {
        id: this.generateStepId(),
        title: "Health Assessment",
        description: "Conduct comprehensive health assessment",
        completed: false,
        required: true,
        priority: 'high',
        estimated_time: 30,
        category: 'analysis'
      },
      {
        id: this.generateStepId(),
        title: "Root Cause Analysis",
        description: "Identify root causes of health issues",
        completed: false,
        required: true,
        priority: 'high',
        estimated_time: 45,
        category: 'analysis'
      },
      {
        id: this.generateStepId(),
        title: "Improvement Plan",
        description: "Develop and implement health improvement plan",
        completed: false,
        required: true,
        priority: 'high',
        estimated_time: 60,
        category: 'action'
      }
    ];

    const riskFactors = ["Low health score", "Engagement issues", "Usage decline"];
    const recommendations = ["Increase support touchpoints", "Provide additional training", "Review product fit"];

    return {
      id: `workflow-${Date.now()}`,
      customer_id: customer.id,
      workflow_type: 'health_improvement',
      title: `Health Improvement - ${customer.name}`,
      description: `Address health score issues for ${customer.name}`,
      steps,
      priority_score: this.calculatePriorityScore(customer),
      estimated_completion_time: 135,
      risk_factors: riskFactors,
      recommendations,
      created_at: new Date()
    };
  }

  private static generateExpansionWorkflow(customer: Customer): Workflow {
    const steps: WorkflowStep[] = [
      {
        id: this.generateStepId(),
        title: "Usage Analysis",
        description: "Analyze current usage patterns and identify expansion opportunities",
        completed: false,
        required: true,
        priority: 'medium',
        estimated_time: 30,
        category: 'analysis'
      },
      {
        id: this.generateStepId(),
        title: "Business Review",
        description: "Conduct business review to identify growth areas",
        completed: false,
        required: true,
        priority: 'medium',
        estimated_time: 45,
        category: 'communication'
      },
      {
        id: this.generateStepId(),
        title: "Expansion Proposal",
        description: "Prepare expansion proposal with ROI analysis",
        completed: false,
        required: true,
        priority: 'medium',
        estimated_time: 60,
        category: 'action'
      }
    ];

    const riskFactors = ["Market conditions", "Budget constraints"];
    const recommendations = ["Focus on ROI", "Leverage success stories", "Offer pilot programs"];

    return {
      id: `workflow-${Date.now()}`,
      customer_id: customer.id,
      workflow_type: 'expansion',
      title: `Expansion Opportunity - ${customer.name}`,
      description: `Identify and pursue expansion opportunities for ${customer.name}`,
      steps,
      priority_score: this.calculatePriorityScore(customer),
      estimated_completion_time: 135,
      risk_factors: riskFactors,
      recommendations,
      created_at: new Date()
    };
  }

  public static generateWorkflow(customer: Customer, workflowType?: string): Workflow {
    // Determine workflow type based on customer data if not specified
    if (!workflowType) {
      if (customer.health_score < 50) {
        workflowType = 'health_improvement';
      } else if (customer.renewal_date) {
        const daysUntilRenewal = Math.ceil(
          (new Date(customer.renewal_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilRenewal <= 180) {
          workflowType = 'renewal';
        } else {
          workflowType = 'expansion';
        }
      } else {
        workflowType = 'expansion';
      }
    }

    switch (workflowType) {
      case 'renewal':
        return this.generateRenewalWorkflow(customer);
      case 'health_improvement':
        return this.generateHealthImprovementWorkflow(customer);
      case 'expansion':
        return this.generateExpansionWorkflow(customer);
      default:
        return this.generateRenewalWorkflow(customer);
    }
  }

  public static generateMultipleWorkflows(customer: Customer): Workflow[] {
    const workflows: Workflow[] = [];
    
    // Always generate renewal workflow if renewal date exists
    if (customer.renewal_date) {
      workflows.push(this.generateRenewalWorkflow(customer));
    }
    
    // Generate health improvement workflow if health score is low
    if (customer.health_score < 50) {
      workflows.push(this.generateHealthImprovementWorkflow(customer));
    }
    
    // Generate expansion workflow for high-value customers
    if (customer.current_arr && customer.current_arr >= 100000) {
      workflows.push(this.generateExpansionWorkflow(customer));
    }
    
    return workflows;
  }
} 