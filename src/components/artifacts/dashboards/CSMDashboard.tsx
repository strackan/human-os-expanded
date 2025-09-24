"use client";

import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { resolveTemplateName } from '../workflows/utils/templateLauncher';
import StandaloneArtifactViewer from '../workflows/StandaloneArtifactViewer';
import Metrics from './Metrics';
import PriorityTasks from './PriorityTasks';
import RecentUpdates from './RecentUpdates';
import Reporting from './Reporting';

// Sample data - in a real app this would come from your backend
const dashboardData = {
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
      status: 'good'
    },
    arr: {
      current: '$2.4M',
      target: '$2.2M',
      trend: '+9.1%',
      status: 'good'
    },
    customers: {
      current: 1847,
      target: 1800,
      trend: '+2.6%',
      status: 'good'
    },
    healthScore: {
      current: 78,
      target: 80,
      trend: '-2.5%',
      status: 'warning'
    },
    adoption: {
      current: 63,
      target: 72,
      trend: '-15%',
      status: 'critical'
    },
    strategicEngagements: {
      current: 35,
      target: 50,
      trend: '-10%',
      status: 'critical'
    },
    customerFrustration: {
      current: 84,
      target: 3.0,
      trend: '+12%',
      status: 'critical'
    }
  },
  upcomingTasks: [
    {
      id: 1,
      title: 'Renewal Process',
      customer: 'Bluebird Memorial Hospital',
      type: 'renewal' as const,
      priority: 'high' as const,
      dueDate: '2025-01-22',
      status: 'pending' as const
    },
    {
      id: 2,
      title: 'Expansion Opportunity',
      customer: 'Acme Corp Inc.',
      type: 'expansion' as const,
      priority: 'high' as const,
      dueDate: '2025-01-25',
      status: 'pending' as const
    },
    {
      id: 3,
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

const CSMDashboard: React.FC = () => {
  const [launchingTask, setLaunchingTask] = useState<number | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: 'group' | 'template';
    id: string;
    groupIndex?: number;
  } | null>(null);
  const [defaultLaunchConfig, setDefaultLaunchConfig] = useState<{
    type: 'group' | 'template';
    id: string;
  } | null>(null);
  const [activeUpdateTab, setActiveUpdateTab] = useState<'adoption' | 'sentiment' | 'market' | 'commercial' | 'conversation'>('adoption');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Parse URL parameters on component mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const templateGroupId = urlParams.get('templateGroupId') || urlParams.get('templateGroup');
    const templateId = urlParams.get('templateId');
    const template = urlParams.get('template');

    // Check sessionStorage as fallback
    let sessionParams = null;
    try {
      const storedParams = sessionStorage.getItem('auth_redirect_params');
      if (storedParams) {
        sessionParams = JSON.parse(storedParams);
      }
    } catch (error) {
      console.error("Error reading sessionStorage:", error);
    }

    // Use URL parameters first, then fall back to sessionStorage
    const finalTemplateGroupId = templateGroupId || sessionParams?.templateGroup || sessionParams?.templateGroupId;
    const finalTemplateId = templateId || sessionParams?.templateId;
    const finalTemplate = template || sessionParams?.template;

    if (finalTemplateGroupId) {
      setDefaultLaunchConfig({ type: 'group', id: finalTemplateGroupId });
      
      // Clear sessionStorage after successful use
      if (sessionParams) {
        sessionStorage.removeItem('auth_redirect_params');
      }
    } else if (finalTemplateId) {
      setDefaultLaunchConfig({ type: 'template', id: finalTemplateId });
      
      // Clear sessionStorage after successful use
      if (sessionParams) {
        sessionStorage.removeItem('auth_redirect_params');
      }
    } else if (finalTemplate) {
      setDefaultLaunchConfig({ type: 'template', id: finalTemplate });
      
      // Clear sessionStorage after successful use
      if (sessionParams) {
        sessionStorage.removeItem('auth_redirect_params');
      }
    }
  }, []);

  const handleLaunchTaskMode = (taskId?: number) => {
    setLaunchingTask(taskId || 0);

    let configToUse: { type: 'group' | 'template'; id: string; groupIndex?: number };
    
    // Priority order: templateGroupId → templateId → customer name matching → fallback
    
    if (taskId) {
      // Launch specific task - check for task-specific overrides first
      const task = dashboardData.upcomingTasks.find(t => t.id === taskId);
      
      // 1. Check for templateGroupId override (highest priority)
      if (defaultLaunchConfig?.type === 'group') {
        configToUse = { 
          type: 'group', 
          id: defaultLaunchConfig.id,
          groupIndex: 0
        };
      }
      // 2. Check for templateId override (second priority)
      else if (defaultLaunchConfig?.type === 'template') {
        configToUse = { 
          type: 'template', 
          id: defaultLaunchConfig.id
        };
      }
      // 3. Customer name matching (third priority)
      else if (task) {
        let groupId = 'healthcare-demo'; // default fallback
        if (task.customer.includes('Acme') || task.customer.includes('Intrasoft')) {
          groupId = 'enterprise-demo';
        }
        configToUse = { type: 'group', id: groupId, groupIndex: 0 };
      }
      // 4. Final fallback
      else {
        configToUse = { type: 'group', id: 'healthcare-demo', groupIndex: 0 };
      }
    } else {
      // Launch general task mode (no specific task)
      // 1. Check for templateGroupId override (highest priority)
      if (defaultLaunchConfig?.type === 'group') {
        configToUse = { 
          type: 'group', 
          id: defaultLaunchConfig.id,
          groupIndex: 0
        };
      }
      // 2. Check for templateId override (second priority)
      else if (defaultLaunchConfig?.type === 'template') {
        configToUse = { 
          type: 'template', 
          id: defaultLaunchConfig.id
        };
      }
      // 3. Final fallback
      else {
        configToUse = { type: 'group', id: 'healthcare-demo', groupIndex: 0 };
      }
    }

    setModalConfig(configToUse);
    setShowTaskModal(true);
    setTimeout(() => setLaunchingTask(null), 500);
  };

  const handleCloseModal = () => {
    setShowTaskModal(false);
    setModalConfig(null);
  };

  const handleContextualHelp = (update: any) => {
    // TODO: Implement contextual chat functionality
    // This could launch a chat interface with context about the specific update
    console.log('Launching contextual help for update:', update);
    
    // For now, we'll just show an alert with the update details
    alert(`Contextual help for ${update.customer}:\n\n${update.update}\n\nThis will eventually launch a chat interface to help you with this specific issue.`);
  };

  const handleGoToReports = () => {
    // TODO: Navigate to reports page or open reports modal
    console.log('Navigating to reports...');
    
    // For now, we'll just show an alert
    alert('This will navigate to the detailed reports section with more comprehensive revenue analytics and insights.');
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showTaskModal) {
        handleCloseModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showTaskModal]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Simple Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-4">
          {defaultLaunchConfig && (
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Configured: {defaultLaunchConfig.type === 'group' ? 'Group' : 'Template'} "{defaultLaunchConfig.id}"
            </div>
          )}
          <button 
            onClick={() => handleLaunchTaskMode()}
            disabled={launchingTask !== null}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {launchingTask !== null ? (
              <>
                <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                Launching Task Mode...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Launch Task Mode
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Section */}
      <Metrics data={dashboardData.metrics} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Priority Tasks */}
        <PriorityTasks 
          data={dashboardData.upcomingTasks} 
          onLaunchTaskMode={handleLaunchTaskMode}
          launchingTask={launchingTask}
        />

        {/* Recent Updates */}
        <RecentUpdates 
          data={dashboardData.recentUpdates}
          activeTab={activeUpdateTab}
          showCriticalOnly={showCriticalOnly}
          onTabChange={setActiveUpdateTab}
          onCriticalToggle={setShowCriticalOnly}
          onContextualHelp={handleContextualHelp}
        />
      </div>

      {/* Reporting Section */}
      <Reporting 
        data={dashboardData.revenuePerformance}
        onGoToReports={handleGoToReports}
      />

      {/* Task Mode Modal */}
      {showTaskModal && modalConfig && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4"
            style={{
              maxHeight: '1000px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {modalConfig.type === 'group' ? (
              <StandaloneArtifactViewer
                groupId={modalConfig.id}
                groupIndex={modalConfig.groupIndex || 0}
                onClose={handleCloseModal}
              />
            ) : (
              <StandaloneArtifactViewer
                configName={modalConfig.id}
                onClose={handleCloseModal}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CSMDashboard;