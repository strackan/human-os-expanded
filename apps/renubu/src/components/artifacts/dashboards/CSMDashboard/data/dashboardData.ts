/**
 * CSM Dashboard Mock Data
 *
 * Sample data for the CSM Dashboard.
 * In a real application, this would come from your backend API.
 */

export const dashboardData = {
  rep: {
    name: 'Angela Martinez',
    role: 'Senior Customer Success Manager',
    region: 'North America'
  },
  metrics: {
    nrr: {
      current: 112,
      target: 110,
      trend: '+2.1%',
      status: 'good' as const
    },
    arr: {
      current: '$2.4M',
      target: '$2.2M',
      trend: '+9.1%',
      status: 'good' as const
    },
    customers: {
      current: 1847,
      target: 1800,
      trend: '+2.6%',
      status: 'good' as const
    },
    healthScore: {
      current: 78,
      target: 80,
      trend: '-2.5%',
      status: 'warning' as const
    },
    adoption: {
      current: 63,
      target: 72,
      trend: '-15%',
      status: 'critical' as const
    },
    strategicEngagements: {
      current: 35,
      target: 50,
      trend: '-10%',
      status: 'critical' as const
    },
    customerFrustration: {
      current: 84,
      target: 3.0,
      trend: '+12%',
      status: 'critical' as const
    }
  },
  upcomingTasks: [
    {
      id: 1,
      title: 'Complete Strategic Account Plan',
      customer: 'Obsidian Black',
      type: 'renewal' as const,
      priority: 'high' as const,
      dueDate: '2025-10-11',
      status: 'pending' as const,
      configId: 'obsblk-strategic-planning' // Uses new WorkflowDefinition
    },
    {
      id: 2,
      title: 'Renewal Process',
      customer: 'Bluebird Memorial Hospital',
      type: 'renewal' as const,
      priority: 'high' as const,
      dueDate: '2025-01-22',
      status: 'pending' as const
    },
    {
      id: 3,
      title: 'Expansion Opportunity',
      customer: 'Acme Corp Inc.',
      type: 'expansion' as const,
      priority: 'high' as const,
      dueDate: '2025-01-25',
      status: 'pending' as const
    },
    {
      id: 4,
      title: 'Health Check',
      customer: 'Intrasoft Solutions',
      type: 'health_check' as const,
      priority: 'high' as const,
      dueDate: '2025-01-20',
      status: 'in_progress' as const
    }
  ],
  recentUpdates: {
    adoption: [
      {
        id: '1',
        customer: 'TechCorp Solutions',
        update: 'Increased usage of advanced analytics features by 45% this month',
        time: '2 hours ago',
        type: 'success' as const,
        priority: 'medium' as const
      },
      {
        id: '2',
        customer: 'DataFlow Inc.',
        update: 'Decreased platform engagement - down 23% from last month',
        time: '4 hours ago',
        type: 'warning' as const,
        priority: 'high' as const
      }
    ],
    sentiment: [
      {
        id: '3',
        customer: 'CloudTech Systems',
        update: 'Positive feedback on new dashboard features in quarterly review',
        time: '1 hour ago',
        type: 'success' as const,
        priority: 'low' as const
      },
      {
        id: '4',
        customer: 'SecureNet Corp',
        update: 'Expressed concerns about data security in latest support ticket',
        time: '3 hours ago',
        type: 'error' as const,
        priority: 'high' as const
      }
    ],
    market: [
      {
        id: '5',
        customer: 'GlobalTech Industries',
        update: 'Company announced major expansion into European markets',
        time: '6 hours ago',
        type: 'info' as const,
        priority: 'medium' as const
      },
      {
        id: '6',
        customer: 'InnovateLab',
        update: 'Received Series B funding round of $50M',
        time: '8 hours ago',
        type: 'success' as const,
        priority: 'low' as const
      }
    ],
    commercial: [
      {
        id: '7',
        customer: 'Enterprise Solutions Ltd',
        update: 'Contract renewal opportunity - potential 40% expansion',
        time: '5 hours ago',
        type: 'success' as const,
        priority: 'high' as const
      },
      {
        id: '8',
        customer: 'StartupHub',
        update: 'Budget cuts announced - reviewing all software subscriptions',
        time: '7 hours ago',
        type: 'warning' as const,
        priority: 'high' as const
      }
    ],
    conversation: [
      {
        id: '9',
        customer: 'DataViz Corp',
        update: 'Interested in discussing custom reporting features for Q2',
        time: '1 hour ago',
        type: 'info' as const,
        priority: 'medium' as const
      },
      {
        id: '10',
        customer: 'Analytics Plus',
        update: 'Requesting demo of new AI-powered insights module',
        time: '2 hours ago',
        type: 'info' as const,
        priority: 'low' as const
      }
    ]
  },
  revenuePerformance: {
    currentYear: 2025,
    chartData: [
      {
        month: 'Jan',
        startingARR: 0.6,
        lostARR: 0.36,
        newARR: 0.12,
        blueBase: 0.24,
        redOverlay: 0.36,
        greenGain: 0.12,
        finalARR: 0.36,
        nrrYTD: 20,
        nrrMonthly: 60,
        isActual: true
      },
      {
        month: 'Feb',
        startingARR: 1.2,
        lostARR: 0.12,
        newARR: 0.84,
        blueBase: 1.08,
        redOverlay: 0.12,
        greenGain: 0.84,
        finalARR: 1.92,
        nrrYTD: 45,
        nrrMonthly: 160,
        isActual: true
      },
      {
        month: 'Mar',
        startingARR: 0.8,
        lostARR: 0.24,
        newARR: 0.16,
        blueBase: 0.56,
        redOverlay: 0.24,
        greenGain: 0.16,
        finalARR: 0.72,
        nrrYTD: 75,
        nrrMonthly: 90,
        isActual: true
      },
      {
        month: 'Apr',
        startingARR: 2.1,
        lostARR: 0.21,
        newARR: 0.42,
        blueBase: 1.89,
        redOverlay: 0.21,
        greenGain: 0.42,
        finalARR: 2.31,
        nrrYTD: 95,
        nrrMonthly: 110,
        isActual: true
      },
      {
        month: 'May',
        startingARR: 0.9,
        lostARR: 0.36,
        newARR: 0.18,
        blueBase: 0.54,
        redOverlay: 0.36,
        greenGain: 0.18,
        finalARR: 0.72,
        nrrYTD: 110,
        nrrMonthly: 80,
        isActual: true
      },
      {
        month: 'Jun',
        startingARR: 1.8,
        lostARR: 0.54,
        newARR: 0.18,
        blueBase: 1.26,
        redOverlay: 0.54,
        greenGain: 0.18,
        finalARR: 1.44,
        nrrYTD: 125,
        nrrMonthly: 80,
        isActual: true
      },
      {
        month: 'Jul',
        startingARR: 0.7,
        lostARR: 0.14,
        newARR: 0.49,
        blueBase: 0.56,
        redOverlay: 0.14,
        greenGain: 0.49,
        finalARR: 1.05,
        nrrYTD: 140,
        nrrMonthly: 150,
        isActual: false
      },
      {
        month: 'Aug',
        startingARR: 1.5,
        lostARR: 0.60,
        newARR: 0.15,
        blueBase: 0.90,
        redOverlay: 0.60,
        greenGain: 0.15,
        finalARR: 1.05,
        nrrYTD: 155,
        nrrMonthly: 70,
        isActual: false
      },
      {
        month: 'Sep',
        startingARR: 2.3,
        lostARR: 0.23,
        newARR: 0.69,
        blueBase: 2.07,
        redOverlay: 0.23,
        greenGain: 0.69,
        finalARR: 2.76,
        nrrYTD: 180,
        nrrMonthly: 120,
        isActual: false
      },
      {
        month: 'Oct',
        startingARR: 1.1,
        lostARR: 0.33,
        newARR: 0.11,
        blueBase: 0.77,
        redOverlay: 0.33,
        greenGain: 0.11,
        finalARR: 0.88,
        nrrYTD: 165,
        nrrMonthly: 80,
        isActual: false
      },
      {
        month: 'Nov',
        startingARR: 0.8,
        lostARR: 0.08,
        newARR: 0.72,
        blueBase: 0.72,
        redOverlay: 0.08,
        greenGain: 0.72,
        finalARR: 1.44,
        nrrYTD: 150,
        nrrMonthly: 180,
        isActual: false
      },
      {
        month: 'Dec',
        startingARR: 1.4,
        lostARR: 0.56,
        newARR: 0.14,
        blueBase: 0.84,
        redOverlay: 0.56,
        greenGain: 0.14,
        finalARR: 0.98,
        nrrYTD: 135,
        nrrMonthly: 70,
        isActual: false
      }
    ]
  }
};
