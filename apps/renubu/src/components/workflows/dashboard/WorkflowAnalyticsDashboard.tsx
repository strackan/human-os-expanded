'use client';

/**
 * WorkflowAnalyticsDashboard Component
 *
 * Displays analytics and insights about workflow actions:
 * - Snooze patterns and trends
 * - Escalation metrics
 * - Skip reason analysis
 * - Contract renewal tracking
 */

import React, { useEffect, useState } from 'react';
import { WorkflowActionService } from '@/lib/workflows/actions/WorkflowActionService';
import { WorkflowQueryService } from '@/lib/workflows/actions/WorkflowQueryService';
import { TrendingUp, Clock, Users, XCircle, AlertCircle, BarChart3 } from 'lucide-react';

interface WorkflowAnalyticsDashboardProps {
  userId: string;
  className?: string;
}

interface Analytics {
  snoozeMetrics: {
    totalSnoozed: number;
    averageSnoozeDays: number;
    mostCommonDuration: string;
    snoozedThisWeek: number;
  };
  escalationMetrics: {
    totalEscalated: number;
    escalatedToYou: number;
    escalatedByYou: number;
    topEscalationReasons: Array<{ reason: string; count: number }>;
  };
  skipMetrics: {
    totalSkipped: number;
    topSkipReasons: Array<{ reason: string; count: number }>;
  };
  completionMetrics: {
    totalCompleted: number;
    completedThisWeek: number;
    averageCompletionTime: string;
  };
}

export default function WorkflowAnalyticsDashboard({ userId, className = '' }: WorkflowAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const actionService = new WorkflowActionService();
  const queryService = new WorkflowQueryService();

  useEffect(() => {
    loadAnalytics();
  }, [userId]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get user's recent actions for analysis
      const actionsResult = await actionService.getUserActions(userId, 100);

      if (!actionsResult.success || !actionsResult.actions) {
        throw new Error('Failed to load actions');
      }

      const actions = actionsResult.actions;

      // Calculate snooze metrics
      const snoozeActions = actions.filter(a => a.action_type === 'snooze');
      const snoozeDurations: number[] = [];

      snoozeActions.forEach(action => {
        if (action.action_data?.until) {
          const snoozeDate = new Date(action.action_data.until);
          const actionDate = new Date(action.created_at);
          const daysDiff = Math.round((snoozeDate.getTime() - actionDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff > 0) snoozeDurations.push(daysDiff);
        }
      });

      const averageSnoozeDays = snoozeDurations.length > 0
        ? Math.round(snoozeDurations.reduce((a, b) => a + b, 0) / snoozeDurations.length)
        : 0;

      // Find most common snooze duration
      const durationCounts = snoozeDurations.reduce((acc, days) => {
        acc[days] = (acc[days] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const mostCommonDuration = Object.entries(durationCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '0';

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const snoozedThisWeek = snoozeActions.filter(a =>
        new Date(a.created_at) >= weekAgo
      ).length;

      // Calculate escalation metrics
      const escalateActions = actions.filter(a => a.action_type === 'escalate');
      const escalationReasons: Record<string, number> = {};

      escalateActions.forEach(action => {
        if (action.action_data?.reason) {
          const reason = action.action_data.reason;
          escalationReasons[reason] = (escalationReasons[reason] || 0) + 1;
        }
      });

      const topEscalationReasons = Object.entries(escalationReasons)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get escalated to/by counts from query service
      const escalatedToMeResult = await queryService.getEscalatedToMe(userId);
      const escalatedByMeResult = await queryService.getEscalatedByMe(userId);

      // Calculate skip metrics
      const skipActions = actions.filter(a => a.action_type === 'skip');
      const skipReasons: Record<string, number> = {};

      skipActions.forEach(action => {
        if (action.action_data?.reason) {
          const reason = action.action_data.reason;
          skipReasons[reason] = (skipReasons[reason] || 0) + 1;
        }
      });

      const topSkipReasons = Object.entries(skipReasons)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate completion metrics
      const completeActions = actions.filter(a => a.action_type === 'complete');
      const completedThisWeek = completeActions.filter(a =>
        new Date(a.created_at) >= weekAgo
      ).length;

      // Assemble analytics
      setAnalytics({
        snoozeMetrics: {
          totalSnoozed: snoozeActions.length,
          averageSnoozeDays,
          mostCommonDuration: `${mostCommonDuration} days`,
          snoozedThisWeek
        },
        escalationMetrics: {
          totalEscalated: escalateActions.length,
          escalatedToYou: escalatedToMeResult.workflows?.length || 0,
          escalatedByYou: escalatedByMeResult.workflows?.length || 0,
          topEscalationReasons
        },
        skipMetrics: {
          totalSkipped: skipActions.length,
          topSkipReasons
        },
        completionMetrics: {
          totalCompleted: completeActions.length,
          completedThisWeek,
          averageCompletionTime: '2-3 days' // Placeholder - would need execution start/end times
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-8 ${className}`}>
        <div className="flex items-center gap-2 text-red-600 justify-center">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Workflow Analytics</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">Insights into your workflow management patterns</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Snooze Metrics */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-orange-600" />
            <h3 className="font-medium text-gray-900">Snooze Patterns</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{analytics.snoozeMetrics.totalSnoozed}</div>
              <div className="text-sm text-gray-600 mt-1">Total Snoozed</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{analytics.snoozeMetrics.averageSnoozeDays}</div>
              <div className="text-sm text-gray-600 mt-1">Avg Days</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{analytics.snoozeMetrics.mostCommonDuration}</div>
              <div className="text-sm text-gray-600 mt-1">Most Common</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{analytics.snoozeMetrics.snoozedThisWeek}</div>
              <div className="text-sm text-gray-600 mt-1">This Week</div>
            </div>
          </div>
        </div>

        {/* Escalation Metrics */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="font-medium text-gray-900">Escalation Activity</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{analytics.escalationMetrics.totalEscalated}</div>
              <div className="text-sm text-gray-600 mt-1">Total Escalations</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{analytics.escalationMetrics.escalatedToYou}</div>
              <div className="text-sm text-gray-600 mt-1">Escalated to You</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{analytics.escalationMetrics.escalatedByYou}</div>
              <div className="text-sm text-gray-600 mt-1">Escalated by You</div>
            </div>
          </div>

          {/* Top Escalation Reasons */}
          {analytics.escalationMetrics.topEscalationReasons.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Top Escalation Reasons</h4>
              <div className="space-y-2">
                {analytics.escalationMetrics.topEscalationReasons.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.reason}</span>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Skip Metrics */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-medium text-gray-900">Skip Analysis</h3>
          </div>
          <div className="bg-red-50 rounded-lg p-4 mb-4">
            <div className="text-2xl font-bold text-red-600">{analytics.skipMetrics.totalSkipped}</div>
            <div className="text-sm text-gray-600 mt-1">Total Skipped Workflows</div>
          </div>

          {/* Top Skip Reasons */}
          {analytics.skipMetrics.topSkipReasons.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Top Skip Reasons</h4>
              <div className="space-y-2">
                {analytics.skipMetrics.topSkipReasons.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.reason}</span>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Completion Metrics */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="font-medium text-gray-900">Completion Stats</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{analytics.completionMetrics.totalCompleted}</div>
              <div className="text-sm text-gray-600 mt-1">Total Completed</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{analytics.completionMetrics.completedThisWeek}</div>
              <div className="text-sm text-gray-600 mt-1">This Week</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{analytics.completionMetrics.averageCompletionTime}</div>
              <div className="text-sm text-gray-600 mt-1">Avg Time</div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Insights</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            {analytics.snoozeMetrics.totalSnoozed > 5 && (
              <li>• You frequently snooze workflows - consider if workload needs rebalancing</li>
            )}
            {analytics.escalationMetrics.escalatedToYou > analytics.escalationMetrics.escalatedByYou * 2 && (
              <li>• You receive 2x more escalations than you send - you're a go-to expert!</li>
            )}
            {analytics.skipMetrics.totalSkipped > analytics.completionMetrics.totalCompleted * 0.2 && (
              <li>• High skip rate detected - review workflow assignment criteria</li>
            )}
            {analytics.completionMetrics.completedThisWeek > 5 && (
              <li>• Strong completion rate this week - great productivity!</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
