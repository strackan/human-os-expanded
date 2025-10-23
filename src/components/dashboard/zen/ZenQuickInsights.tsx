'use client';

/**
 * ZenQuickInsights Component
 *
 * Analytics highlights in zen style
 * Replaces QuickActions with data-driven insights
 */

import React, { useEffect, useState } from 'react';
import { WorkflowQueryService } from '@/lib/workflows/actions/WorkflowQueryService';
import { WorkflowActionService } from '@/lib/workflows/actions/WorkflowActionService';
import { Sparkles, TrendingUp, Clock, Users, Target } from 'lucide-react';

interface ZenQuickInsightsProps {
  userId: string;
  className?: string;
}

interface Insight {
  icon: typeof Sparkles;
  text: string;
  color: string;
  bgColor: string;
}

export default function ZenQuickInsights({ userId, className = '' }: ZenQuickInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  const queryService = new WorkflowQueryService();
  const actionService = new WorkflowActionService();

  useEffect(() => {
    loadInsights();
  }, [userId]);

  const loadInsights = async () => {
    setLoading(true);
    const newInsights: Insight[] = [];

    try {
      // Get workflow counts
      const countsResult = await queryService.getWorkflowCounts(userId);

      if (countsResult.success && countsResult.counts) {
        const counts = countsResult.counts;

        // Insight 1: Snoozed workflows ready to resume
        if (counts.snoozed > 0) {
          const snoozedResult = await queryService.getSnoozedWorkflowsDue(userId);
          const dueCount = snoozedResult.workflows?.length || 0;

          if (dueCount > 0) {
            newInsights.push({
              icon: Clock,
              text: `${dueCount} workflow${dueCount !== 1 ? 's' : ''} ready to resume`,
              color: 'text-orange-600',
              bgColor: 'bg-orange-50'
            });
          }
        }

        // Insight 2: Escalations needing attention
        if (counts.escalatedToMe > 0) {
          newInsights.push({
            icon: Users,
            text: `${counts.escalatedToMe} escalation${counts.escalatedToMe !== 1 ? 's' : ''} need${counts.escalatedToMe === 1 ? 's' : ''} attention`,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
          });
        }

        // Insight 3: Active workflows
        if (counts.active > 0) {
          newInsights.push({
            icon: Target,
            text: `${counts.active} active workflow${counts.active !== 1 ? 's' : ''}`,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          });
        }

        // Insight 4: Completion rate (if we have data)
        if (counts.completed > 0) {
          const total = counts.active + counts.completed + counts.skipped;
          const completionRate = Math.round((counts.completed / total) * 100);

          if (completionRate >= 70) {
            newInsights.push({
              icon: TrendingUp,
              text: `Strong ${completionRate}% completion rate`,
              color: 'text-green-600',
              bgColor: 'bg-green-50'
            });
          }
        }
      }

      // If no insights, show a positive message
      if (newInsights.length === 0) {
        newInsights.push({
          icon: Sparkles,
          text: 'All caught up! Great work',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        });
      }

      setInsights(newInsights.slice(0, 4)); // Max 4 insights
    } catch (err) {
      console.error('[ZenQuickInsights] Error loading insights:', err);

      // Fallback insight
      setInsights([{
        icon: Sparkles,
        text: 'Ready to make today count',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-purple-100 shadow-sm ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="text-sm text-purple-600 font-medium">Quick Insights</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-purple-100 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <span className="text-sm text-purple-600 font-medium">Quick Insights</span>
      </div>

      {/* Insights */}
      <div className="space-y-3">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border border-opacity-50 ${insight.bgColor} transition-all`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-4 h-4 ${insight.color} mt-0.5 flex-shrink-0`} />
                <p className="text-sm text-gray-700 flex-1">{insight.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
