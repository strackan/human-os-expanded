import { Stage } from '../components/customers/shared/StageTimeline';

export interface Stat {
  label: string;
  value: string;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export interface AIInsight {
  category: string;
  color: 'green' | 'blue' | 'purple' | 'red';
  text: string;
}

export interface MiniChart {
  label: string;
  data: number[];
}

export interface ChatConfig {
  recommendedAction: {
    label: string;
    icon: string;
  };
  botIntroMessage?: string;
  inputPlaceholder?: string;
}

export interface BaseCustomerData {
  name: string;
  arr: string;
  stages: Stage[];
  stats: Stat[];
  aiInsights: AIInsight[];
  miniCharts: MiniChart[];
  riskLevel: string;
  riskColor: string;
  chatConfig: ChatConfig;
}

export interface RenewalData {
  renewalDate: string;
  currentContract: {
    value: number;
    term: string;
  };
  renewalOptions: {
    label: string;
    value: number;
    term: string;
  }[];
}

export interface RevenueData {
  upsellOpportunities: {
    label: string;
    value: number;
    probability: number;
    reasons: string[];
  }[];
  historicalGrowth: {
    period: string;
    value: number;
  }[];
}

export interface ImpactData {
  milestones: {
    date: string;
    title: string;
    description: string;
  }[];
  valueMetrics: {
    label: string;
    value: number;
    trend: number;
  }[];
}

export interface AIData {
  workflows: {
    type: 'negotiation' | 'email' | 'meeting' | 'contract';
    status: 'pending' | 'in-progress' | 'completed';
    title: string;
    description: string;
  }[];
  recommendations: {
    category: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}

export interface CustomerData extends BaseCustomerData {
  features?: {
    renewal?: RenewalData;
    revenue?: RevenueData;
    impact?: ImpactData;
    ai?: AIData;
  };
} 