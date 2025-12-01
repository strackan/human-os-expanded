'use client';

/**
 * Customer360SidePanel Component
 *
 * A collapsible side panel that shows contextual information based on workflow type:
 * - Event-triggered workflows: Related event workflows, core metrics, health assessment
 * - Date-triggered workflows: Workflow timeline showing past and scheduled workflows in the series
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Zap,
  Target,
  Users,
  DollarSign,
  Activity
} from 'lucide-react';

interface RelatedWorkflow {
  id: string;
  name: string;
  type: 'event' | 'date';
  status: 'completed' | 'in_progress' | 'scheduled' | 'overdue';
  date?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface CustomerMetric {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  changePercent?: number;
}

interface Customer360SidePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  workflowType: 'event' | 'date';
  customerId: string;
  customerName: string;
  currentWorkflowId?: string;
  // For date-based workflows
  seriesWorkflows?: RelatedWorkflow[];
  // For event-based workflows
  eventWorkflows?: RelatedWorkflow[];
  // Customer metrics
  metrics?: {
    healthScore: number;
    arr: number;
    nps?: number;
    usagePercent?: number;
    daysToRenewal?: number;
    riskLevel?: 'high' | 'medium' | 'low';
    expansionPotential?: number;
  };
}

export default function Customer360SidePanel({
  isOpen,
  onToggle,
  workflowType,
  customerId: _customerId,
  customerName,
  currentWorkflowId,
  seriesWorkflows = [],
  eventWorkflows = [],
  metrics,
}: Customer360SidePanelProps) {
  // customerId reserved for future API calls
  void _customerId;
  // Mock data for demo - in production, this would come from props or API
  const [relatedWorkflows, setRelatedWorkflows] = useState<RelatedWorkflow[]>([]);
  const [customerMetrics, setCustomerMetrics] = useState<CustomerMetric[]>([]);

  useEffect(() => {
    // Set mock data based on workflow type
    if (workflowType === 'date') {
      setRelatedWorkflows(seriesWorkflows.length > 0 ? seriesWorkflows : [
        { id: '1', name: '180-Day Strategic Planning', type: 'date', status: 'completed', date: '2024-09-15' },
        { id: '2', name: '120-Day Account Review', type: 'date', status: 'completed', date: '2024-10-15' },
        { id: '3', name: '90-Day Renewal Prep', type: 'date', status: 'in_progress', date: '2024-11-15' },
        { id: '4', name: '60-Day Negotiation', type: 'date', status: 'scheduled', date: '2024-12-15' },
        { id: '5', name: '30-Day Final Review', type: 'date', status: 'scheduled', date: '2025-01-15' },
      ]);
    } else {
      setRelatedWorkflows(eventWorkflows.length > 0 ? eventWorkflows : [
        { id: '1', name: 'Expansion Opportunity', type: 'event', status: 'in_progress', priority: 'high' },
        { id: '2', name: 'Risk Mitigation', type: 'event', status: 'scheduled', priority: 'medium' },
        { id: '3', name: 'Champion Change Alert', type: 'event', status: 'completed', priority: 'low' },
      ]);
    }

    // Set customer metrics
    if (metrics) {
      setCustomerMetrics([
        { label: 'Health Score', value: `${metrics.healthScore}%`, trend: metrics.healthScore >= 70 ? 'up' : 'down' },
        { label: 'ARR', value: `$${(metrics.arr / 1000).toFixed(0)}k`, trend: 'up', changePercent: 12 },
        { label: 'NPS', value: metrics.nps ?? 'N/A', trend: 'neutral' },
        { label: 'Usage', value: `${metrics.usagePercent ?? 0}%`, trend: 'up', changePercent: 5 },
      ]);
    } else {
      setCustomerMetrics([
        { label: 'Health Score', value: '72%', trend: 'up', changePercent: 8 },
        { label: 'ARR', value: '$125k', trend: 'up', changePercent: 12 },
        { label: 'NPS', value: '45', trend: 'down', changePercent: -5 },
        { label: 'Usage', value: '87%', trend: 'up', changePercent: 3 },
      ]);
    }
  }, [workflowType, seriesWorkflows, eventWorkflows, metrics]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Collapsed state - show toggle button
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-white border border-gray-200 border-r-0 rounded-l-lg shadow-lg p-2 hover:bg-gray-50 transition-colors group"
        title="Open Customer 360"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
        <span className="sr-only">Open Customer 360</span>
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Customer 360</h3>
        </div>
        <button
          onClick={onToggle}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Customer Name */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-sm text-gray-500">Account</p>
        <p className="font-medium text-gray-900">{customerName}</p>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Quick Metrics */}
        <div className="p-4 border-b border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Key Metrics
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {customerMetrics.map((metric, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">{metric.label}</span>
                  {getTrendIcon(metric.trend)}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold text-gray-900">{metric.value}</span>
                  {metric.changePercent && (
                    <span className={`text-xs ${metric.changePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.changePercent > 0 ? '+' : ''}{metric.changePercent}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Assessment (for event-based) */}
        {workflowType === 'event' && (
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Health Assessment
            </h4>
            <div className={`rounded-lg p-3 ${getRiskColor(metrics?.riskLevel || 'medium')}`}>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4" />
                <span className="font-medium">
                  {metrics?.riskLevel === 'high' ? 'At Risk' :
                   metrics?.riskLevel === 'low' ? 'Healthy' : 'Monitor'}
                </span>
              </div>
              <p className="text-sm opacity-80">
                {metrics?.riskLevel === 'high'
                  ? 'Immediate attention needed. Multiple risk signals detected.'
                  : metrics?.riskLevel === 'low'
                  ? 'Account is healthy with strong engagement.'
                  : 'Some areas need attention. Monitor closely.'}
              </p>
            </div>
            {metrics?.expansionPotential && metrics.expansionPotential > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-2">
                <DollarSign className="w-4 h-4" />
                <span>Expansion potential: ${(metrics.expansionPotential / 1000).toFixed(0)}k</span>
              </div>
            )}
          </div>
        )}

        {/* Related Workflows */}
        <div className="p-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            {workflowType === 'date' ? (
              <>
                <Calendar className="w-4 h-4" />
                Renewal Timeline
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Active Plays
              </>
            )}
          </h4>

          <div className="space-y-2">
            {relatedWorkflows.map((workflow, index) => {
              const isCurrent = workflow.id === currentWorkflowId ||
                               workflow.status === 'in_progress';

              return (
                <div
                  key={workflow.id}
                  className={`relative p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                    isCurrent
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Timeline connector for date-based */}
                  {workflowType === 'date' && index < relatedWorkflows.length - 1 && (
                    <div className="absolute left-5 top-10 w-0.5 h-6 bg-gray-200" />
                  )}

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(workflow.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isCurrent ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {workflow.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {workflow.date && (
                          <span className="text-xs text-gray-500">
                            {new Date(workflow.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        )}
                        {workflow.priority && (
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${getPriorityColor(workflow.priority)}`}>
                            {workflow.priority}
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-xs text-blue-600 font-medium">
                            Current
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Days to Renewal (for date-based) */}
        {workflowType === 'date' && metrics?.daysToRenewal !== undefined && (
          <div className="p-4 border-t border-gray-100">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-4 text-white">
              <p className="text-sm opacity-90">Days to Renewal</p>
              <p className="text-3xl font-bold">{metrics.daysToRenewal}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
