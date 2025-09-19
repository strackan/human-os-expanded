"use client";

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Target,
  Play,
  ArrowRight,
  Bell,
  BarChart3
} from 'lucide-react';
import { resolveTemplateName } from '../workflows/utils/templateLauncher';
import StandaloneArtifactViewer from '../workflows/StandaloneArtifactViewer';

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
      trend: '+8.3%',
      status: 'excellent'
    },
    accounts: {
      total: 47,
      atRisk: 3,
      expanding: 8,
      healthy: 36
    },
    renewals: {
      thisQuarter: 12,
      nextQuarter: 8,
      value: '$890K'
    }
  },
  upcomingTasks: [
    {
      id: 1,
      customer: 'Bluebird Memorial Hospital',
      type: 'Renewal Planning',
      priority: 'high',
      dueDate: '2025-01-22',
      value: '$124.5K',
      risk: 'medium'
    },
    {
      id: 2,
      customer: 'Acme Corp Inc.',
      type: 'Expansion Opportunity',
      priority: 'high',
      dueDate: '2025-01-25',
      value: '$485K',
      risk: 'low'
    },
    {
      id: 3,
      customer: 'Intrasoft Solutions',
      type: 'Contract Negotiation',
      priority: 'critical',
      dueDate: '2025-01-20',
      value: '$1.25M',
      risk: 'low'
    }
  ],
  recentUpdates: [
    {
      id: 1,
      customer: 'TechFlow Systems',
      update: 'Signed 2-year extension worth $320K',
      time: '2 hours ago',
      type: 'success'
    },
    {
      id: 2,
      customer: 'Global Healthcare Inc',
      update: 'Raised concern about API rate limits',
      time: '4 hours ago',
      type: 'warning'
    },
    {
      id: 3,
      customer: 'StartupXYZ',
      update: 'Completed onboarding milestone',
      time: '1 day ago',
      type: 'info'
    }
  ]
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

  // Parse URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateGroupId = urlParams.get('templateGroupId');
    const templateId = urlParams.get('templateId');
    const template = urlParams.get('template');

    if (templateGroupId) {
      setDefaultLaunchConfig({ type: 'group', id: templateGroupId });
    } else if (templateId) {
      setDefaultLaunchConfig({ type: 'template', id: templateId });
    } else if (template) {
      // Try to resolve template name to actual config
      const resolvedTemplate = resolveTemplateName(template);
      if (resolvedTemplate) {
        setDefaultLaunchConfig({ type: 'template', id: resolvedTemplate });
      }
    }
  }, []);

  const handleLaunchTaskMode = (taskId?: number) => {
    setLaunchingTask(taskId || 0);

    let configToUse: { type: 'group' | 'template'; id: string; groupIndex?: number };

    if (taskId) {
      // Check if URL parameter overrides are set
      if (defaultLaunchConfig) {
        configToUse = defaultLaunchConfig;
      } else {
        // Default task-based mapping
        const task = dashboardData.upcomingTasks.find(t => t.id === taskId);
        if (task) {
          let groupId = 'healthcare-demo'; // default
          if (task.customer.includes('Acme') || task.customer.includes('Intrasoft')) {
            groupId = 'enterprise-demo';
          }
          configToUse = { type: 'group', id: groupId, groupIndex: 0 };
        } else {
          configToUse = { type: 'group', id: 'healthcare-demo', groupIndex: 0 };
        }
      }
    } else {
      // Launch based on URL parameters or default
      if (defaultLaunchConfig) {
        configToUse = defaultLaunchConfig;
      } else {
        // Default fallback
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Good morning, {dashboardData.rep.name}
            </h1>
            <p className="text-gray-600">
              {dashboardData.rep.role} • {dashboardData.rep.region}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {defaultLaunchConfig && (
              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Configured: {defaultLaunchConfig.type === 'group' ? 'Group' : 'Template'} "{defaultLaunchConfig.id}"
              </div>
            )}
            <button
              onClick={() => handleLaunchTaskMode()}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Play className="w-5 h-5" />
              Launch Task Mode
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* NRR */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Net Revenue Retention</h3>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {dashboardData.metrics.nrr.current}%
            </span>
            <span className="text-sm text-green-600 font-medium">
              {dashboardData.metrics.nrr.trend}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Target: {dashboardData.metrics.nrr.target}%
          </p>
        </div>

        {/* ARR */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Annual Recurring Revenue</h3>
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {dashboardData.metrics.arr.current}
            </span>
            <span className="text-sm text-green-600 font-medium">
              {dashboardData.metrics.arr.trend}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Target: {dashboardData.metrics.arr.target}
          </p>
        </div>

        {/* Accounts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Account Health</h3>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {dashboardData.metrics.accounts.total}
            </span>
            <span className="text-sm text-gray-600">accounts</span>
          </div>
          <div className="flex gap-2 mt-2 text-xs">
            <span className="text-red-600">{dashboardData.metrics.accounts.atRisk} at risk</span>
            <span className="text-green-600">{dashboardData.metrics.accounts.expanding} expanding</span>
          </div>
        </div>

        {/* Renewals */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Upcoming Renewals</h3>
            <Target className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {dashboardData.metrics.renewals.thisQuarter}
            </span>
            <span className="text-sm text-gray-600">this quarter</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Value: {dashboardData.metrics.renewals.value}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Priority Tasks</h2>
            <p className="text-sm text-gray-500">Action items requiring immediate attention</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.upcomingTasks.map((task) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{task.customer}</h3>
                      <p className="text-sm text-gray-600">{task.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <button
                        onClick={() => handleLaunchTaskMode(task.id)}
                        disabled={launchingTask === task.id}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {launchingTask === task.id ? (
                          <>
                            <Clock className="w-3 h-3 animate-spin" />
                            Launching...
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            Start
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-gray-400" />
                        {task.value}
                      </span>
                    </div>
                    <span className={`text-xs ${getRiskColor(task.risk)}`}>
                      {task.risk} risk
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Updates */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Updates</h2>
            <p className="text-sm text-gray-500">Latest activity across your portfolio</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.recentUpdates.map((update) => (
                <div key={update.id} className="flex items-start gap-3">
                  {getUpdateIcon(update.type)}
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{update.customer}</span>
                    </p>
                    <p className="text-sm text-gray-600">{update.update}</p>
                    <p className="text-xs text-gray-400 mt-1">{update.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="flex items-center gap-2 mt-4 text-sm text-blue-600 hover:text-blue-700 transition-colors">
              View all updates
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Performance Chart Section */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Revenue Performance</h2>
            <p className="text-sm text-gray-500">Monthly ARR growth over the last 6 months</p>
          </div>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>
        <div className="h-32 flex items-end justify-between gap-2">
          {[2.1, 2.3, 2.2, 2.4, 2.35, 2.4].map((value, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className="bg-blue-500 rounded-t w-full"
                style={{ height: `${(value / 2.4) * 100}%` }}
              ></div>
              <span className="text-xs text-gray-500 mt-2">
                {['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'][index]}
              </span>
              <span className="text-xs font-medium text-gray-700">
                ${value}M
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Task Mode Modal */}
      {showTaskModal && modalConfig && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-lg shadow-2xl overflow-hidden"
            style={{
              width: '90vw',
              height: '90vh',
              maxWidth: '1600px',
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