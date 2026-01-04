'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, ChevronRight, MessageSquare, Target, TrendingUp, Heart, Zap } from 'lucide-react';
import SendEmailPopover from './popovers/SendEmailPopover';
import ScheduleMeetingPopover from './popovers/ScheduleMeetingPopover';
import CreateTaskPopover from './popovers/CreateTaskPopover';
import UpdateFieldPopover from './popovers/UpdateFieldPopover';
import RemindLaterPopover from './popovers/RemindLaterPopover';

type ActionType = 'email' | 'meeting' | 'task' | 'update' | 'remind';

interface QuickActionData {
  type: ActionType;
  title: string;
  customer?: string;
  contact?: string;
}

interface QuickActionsProps {
  className?: string;
  expandByDefault?: boolean;
}

export default function QuickActions({ className = '', expandByDefault = false }: QuickActionsProps) {
  const [activeTab, setActiveTab] = useState<'starters' | 'plans' | 'noticed' | 'mystuff'>('starters');
  const [activeAction, setActiveAction] = useState<QuickActionData | null>(null);
  const [isExpanded, setIsExpanded] = useState(expandByDefault);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Reset expanded state when tab changes (but not on initial load)
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }
    // Only collapse if not set to expand by default
    if (!expandByDefault) {
      setIsExpanded(false);
    }
  }, [activeTab, expandByDefault, isInitialLoad]);

  const handleActionClick = (actionData: QuickActionData) => {
    setActiveAction(actionData);
  };

  const handleClosePopover = () => {
    setActiveAction(null);
  };

  const handleEmailSubmit = async (data: { to: string; subject: string; body: string }) => {
    console.log('Sending email:', data);
    // TODO: Call API endpoint
    // await fetch('/api/quick-actions/send-email', { method: 'POST', body: JSON.stringify(data) });
  };

  const handleMeetingSubmit = async (data: { title: string; date: string; time: string; duration: string; attendees: string }) => {
    console.log('Scheduling meeting:', data);
    // TODO: Call API endpoint
    // await fetch('/api/quick-actions/schedule-meeting', { method: 'POST', body: JSON.stringify(data) });
  };

  const handleTaskSubmit = async (data: { title: string; description: string; dueDate: string; priority: string }) => {
    console.log('Creating task:', data);
    // TODO: Call API endpoint
    // await fetch('/api/quick-actions/create-task', { method: 'POST', body: JSON.stringify(data) });
  };

  const handleUpdateSubmit = async (data: { field: string; value: string; notes: string }) => {
    console.log('Updating field:', data);
    // TODO: Call API endpoint
    // await fetch('/api/quick-actions/update-field', { method: 'PATCH', body: JSON.stringify(data) });
  };

  const handleRemindSubmit = async (data: { reminderDate: string; reminderTime: string; notes: string }) => {
    console.log('Setting reminder:', data);
    // TODO: Call API endpoint
    // await fetch('/api/quick-actions/remind-later', { method: 'POST', body: JSON.stringify(data) });
  };

  const tabs = [
    { id: 'starters' as const, label: 'Starters' },
    { id: 'plans' as const, label: 'Plans' },
    { id: 'noticed' as const, label: 'Noticed' },
    { id: 'mystuff' as const, label: 'My Stuff' }
  ];

  // Severity-based card styles
  const getSeverityStyles = (severity: 'critical' | 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'critical':
        return { card: 'bg-red-50 border-red-100 hover:border-red-300', icon: 'text-red-500' };
      case 'high':
        return { card: 'bg-orange-50 border-orange-100 hover:border-orange-300', icon: 'text-orange-500' };
      case 'medium':
        return { card: 'bg-yellow-50 border-yellow-100 hover:border-yellow-300', icon: 'text-yellow-600' };
      case 'low':
        return { card: 'bg-blue-50 border-blue-100 hover:border-blue-300', icon: 'text-blue-500' };
      default:
        return { card: 'bg-gray-50 border-gray-100 hover:border-gray-300', icon: 'text-gray-500' };
    }
  };

  return (
    <div
      id="quick-actions"
      data-testid="quick-actions"
      data-expanded={isExpanded}
      data-active-tab={activeTab}
      className={`bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-purple-100 shadow-sm quick-actions ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 quick-actions__header">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-purple-400 quick-actions__icon" />
          <span className="text-sm text-purple-600 font-medium quick-actions__label">Quick Actions</span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600 transition-colors quick-actions__expand-btn"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          data-testid="quick-actions-expand-btn"
        >
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl quick-actions__tabs" data-testid="quick-actions-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`quick-actions-tab-${tab.id}`}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all quick-actions__tab ${
              activeTab === tab.id
                ? 'bg-white text-purple-600 shadow-sm quick-actions__tab--active'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-3 quick-actions__content" data-testid="quick-actions-content">
        {/* Starters Tab */}
        {activeTab === 'starters' && (
          <div className="animate-fadeIn space-y-3 quick-actions__panel quick-actions__panel--starters" data-testid="quick-actions-panel-starters">
            {/* First card - always shown */}
            <div className={`p-4 rounded-xl border hover:shadow-sm transition-all quick-actions__item ${getSeverityStyles('high').card}`} data-testid="quick-action-item-starters-0">
              <div className="flex items-start gap-3">
                <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 quick-actions__item-icon ${getSeverityStyles('high').icon}`} />
                <div className="flex-1 min-w-0 quick-actions__item-content">
                  <p className="text-sm text-gray-700 mb-1 quick-actions__item-title">DataViz Corp mentioned expansion</p>
                  <p className="text-xs text-gray-500 quick-actions__item-subtitle">Based on LinkedIn activity</p>
                </div>
                <button
                  onClick={() => handleActionClick({
                    type: 'email',
                    title: 'Email about expansion',
                    customer: 'DataViz Corp',
                    contact: 'Sarah Chen'
                  })}
                  className="text-gray-400 hover:text-purple-500 transition-colors p-1 quick-actions__item-action-btn"
                  aria-label="Quick action"
                  data-testid="quick-action-btn-starters-0"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Remaining cards - shown when expanded */}
            {isExpanded && (
              <>
                <div className={`p-4 rounded-xl border hover:shadow-sm transition-all quick-actions__item ${getSeverityStyles('medium').card}`} data-testid="quick-action-item-starters-1">
                  <div className="flex items-start gap-3">
                    <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 quick-actions__item-icon ${getSeverityStyles('medium').icon}`} />
                    <div className="flex-1 min-w-0 quick-actions__item-content">
                      <p className="text-sm text-gray-700 mb-1 quick-actions__item-title">Acme Corp new VP of Engineering</p>
                      <p className="text-xs text-gray-500 quick-actions__item-subtitle">Opportunity to reconnect</p>
                    </div>
                    <button
                      onClick={() => handleActionClick({
                        type: 'email',
                        title: 'Reconnect email',
                        customer: 'Acme Corp',
                        contact: 'New VP of Engineering'
                      })}
                      className="text-gray-400 hover:text-purple-500 transition-colors p-1 quick-actions__item-action-btn"
                      aria-label="Quick action"
                      data-testid="quick-action-btn-starters-1"
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className={`p-4 rounded-xl border hover:shadow-sm transition-all quick-actions__item ${getSeverityStyles('high').card}`} data-testid="quick-action-item-starters-2">
                  <div className="flex items-start gap-3">
                    <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 quick-actions__item-icon ${getSeverityStyles('high').icon}`} />
                    <div className="flex-1 min-w-0 quick-actions__item-content">
                      <p className="text-sm text-gray-700 mb-1 quick-actions__item-title">TechFlow contract ends in 60 days</p>
                      <p className="text-xs text-gray-500 quick-actions__item-subtitle">Schedule renewal discussion</p>
                    </div>
                    <button
                      onClick={() => handleActionClick({
                        type: 'remind',
                        title: 'TechFlow renewal discussion',
                        customer: 'TechFlow'
                      })}
                      className="text-gray-400 hover:text-purple-500 transition-colors p-1 quick-actions__item-action-btn"
                      aria-label="Quick action"
                      data-testid="quick-action-btn-starters-2"
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div className="animate-fadeIn space-y-3 quick-actions__panel quick-actions__panel--plans" data-testid="quick-actions-panel-plans">
            {/* First card - always shown */}
            <div className={`p-4 rounded-xl border hover:shadow-sm transition-all quick-actions__item ${getSeverityStyles('critical').card}`} data-testid="quick-action-item-plans-0">
              <div className="flex items-start gap-3">
                <Target className={`w-4 h-4 mt-0.5 flex-shrink-0 quick-actions__item-icon ${getSeverityStyles('critical').icon}`} />
                <div className="flex-1 min-w-0 quick-actions__item-content">
                  <p className="text-sm text-gray-700 mb-1 quick-actions__item-title">Obsidian Black: Account Plan</p>
                  <p className="text-xs text-gray-500 quick-actions__item-subtitle">Due today • Critical</p>
                </div>
                <button
                  onClick={() => handleActionClick({
                    type: 'task',
                    title: 'Update Account Plan',
                    customer: 'Obsidian Black'
                  })}
                  className="text-gray-400 hover:text-purple-500 transition-colors p-1 quick-actions__item-action-btn"
                  aria-label="Quick action"
                  data-testid="quick-action-btn-plans-0"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Remaining cards - shown when expanded */}
            {isExpanded && (
              <div className={`p-4 rounded-xl border hover:shadow-sm transition-all quick-actions__item ${getSeverityStyles('medium').card}`} data-testid="quick-action-item-plans-1">
                <div className="flex items-start gap-3">
                  <Target className={`w-4 h-4 mt-0.5 flex-shrink-0 quick-actions__item-icon ${getSeverityStyles('medium').icon}`} />
                  <div className="flex-1 min-w-0 quick-actions__item-content">
                    <p className="text-sm text-gray-700 mb-1 quick-actions__item-title">TechFlow: Renewal Strategy</p>
                    <p className="text-xs text-gray-500 quick-actions__item-subtitle">Due this week</p>
                  </div>
                  <button
                    onClick={() => handleActionClick({
                      type: 'task',
                      title: 'Plan Renewal Strategy',
                      customer: 'TechFlow'
                    })}
                    className="text-gray-400 hover:text-purple-500 transition-colors p-1 quick-actions__item-action-btn"
                    aria-label="Quick action"
                    data-testid="quick-action-btn-plans-1"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Noticed Tab */}
        {activeTab === 'noticed' && (
          <div className="animate-fadeIn space-y-3 quick-actions__panel quick-actions__panel--noticed" data-testid="quick-actions-panel-noticed">
            {/* First card - always shown */}
            <div className={`p-4 rounded-xl border hover:shadow-sm transition-all quick-actions__item ${getSeverityStyles('medium').card}`} data-testid="quick-action-item-noticed-0">
              <div className="flex items-start gap-3">
                <TrendingUp className={`w-4 h-4 mt-0.5 flex-shrink-0 quick-actions__item-icon ${getSeverityStyles('medium').icon}`} />
                <div className="flex-1 min-w-0 quick-actions__item-content">
                  <p className="text-sm text-gray-700 mb-1 quick-actions__item-title">DataViz usage up 40%</p>
                  <p className="text-xs text-gray-500 quick-actions__item-subtitle">Expansion signal detected</p>
                </div>
                <button
                  onClick={() => handleActionClick({
                    type: 'meeting',
                    title: 'Discuss expansion opportunity',
                    customer: 'DataViz Corp'
                  })}
                  className="text-gray-400 hover:text-purple-500 transition-colors p-1 quick-actions__item-action-btn"
                  aria-label="Quick action"
                  data-testid="quick-action-btn-noticed-0"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Remaining cards - shown when expanded */}
            {isExpanded && (
              <div className={`p-4 rounded-xl border hover:shadow-sm transition-all quick-actions__item ${getSeverityStyles('high').card}`} data-testid="quick-action-item-noticed-1">
                <div className="flex items-start gap-3">
                  <TrendingUp className={`w-4 h-4 mt-0.5 flex-shrink-0 quick-actions__item-icon ${getSeverityStyles('high').icon}`} />
                  <div className="flex-1 min-w-0 quick-actions__item-content">
                    <p className="text-sm text-gray-700 mb-1 quick-actions__item-title">CloudSync: 3 support tickets</p>
                    <p className="text-xs text-gray-500 quick-actions__item-subtitle">May need check-in</p>
                  </div>
                  <button
                    onClick={() => handleActionClick({
                      type: 'meeting',
                      title: 'Check-in call',
                      customer: 'CloudSync'
                    })}
                    className="text-gray-400 hover:text-purple-500 transition-colors p-1 quick-actions__item-action-btn"
                    aria-label="Quick action"
                    data-testid="quick-action-btn-noticed-1"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* My Stuff Tab */}
        {activeTab === 'mystuff' && (
          <div className="animate-fadeIn space-y-3 quick-actions__panel quick-actions__panel--mystuff" data-testid="quick-actions-panel-mystuff">
            <div className={`p-4 rounded-xl border hover:shadow-sm transition-all quick-actions__item ${getSeverityStyles('low').card}`} data-testid="quick-action-item-mystuff-0">
              <div className="flex items-start gap-3">
                <Heart className={`w-4 h-4 mt-0.5 flex-shrink-0 quick-actions__item-icon ${getSeverityStyles('low').icon}`} />
                <div className="flex-1 min-w-0 quick-actions__item-content">
                  <p className="text-sm text-gray-700 mb-1 quick-actions__item-title">Inbox Zero Progress</p>
                  <div className="mt-2 w-full bg-blue-200 rounded-full h-1.5 quick-actions__progress-bar">
                    <div className="bg-blue-500 h-1.5 rounded-full quick-actions__progress-fill" style={{ width: '68%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 quick-actions__item-subtitle">68% of days this quarter</p>
                </div>
                <button
                  onClick={() => handleActionClick({
                    type: 'update',
                    title: 'Update personal goal'
                  })}
                  className="text-gray-400 hover:text-purple-500 transition-colors p-1 quick-actions__item-action-btn"
                  aria-label="Quick action"
                  data-testid="quick-action-btn-mystuff-0"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Popovers */}
      {activeAction?.type === 'email' && (
        <SendEmailPopover
          customer={activeAction.customer}
          contact={activeAction.contact}
          title={activeAction.title}
          onClose={handleClosePopover}
          onSubmit={handleEmailSubmit}
        />
      )}
      {activeAction?.type === 'meeting' && (
        <ScheduleMeetingPopover
          customer={activeAction.customer}
          title={activeAction.title}
          onClose={handleClosePopover}
          onSubmit={handleMeetingSubmit}
        />
      )}
      {activeAction?.type === 'task' && (
        <CreateTaskPopover
          customer={activeAction.customer}
          title={activeAction.title}
          onClose={handleClosePopover}
          onSubmit={handleTaskSubmit}
        />
      )}
      {activeAction?.type === 'update' && (
        <UpdateFieldPopover
          title={activeAction.title}
          onClose={handleClosePopover}
          onSubmit={handleUpdateSubmit}
        />
      )}
      {activeAction?.type === 'remind' && (
        <RemindLaterPopover
          customer={activeAction.customer}
          title={activeAction.title}
          onClose={handleClosePopover}
          onSubmit={handleRemindSubmit}
        />
      )}
    </div>
  );
}
