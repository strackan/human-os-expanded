'use client';

import { useState } from 'react';
import { Sparkles, CheckCircle2, MessageSquare, Target, TrendingUp, Heart, Zap } from 'lucide-react';
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
}

export default function QuickActions({ className = '' }: QuickActionsProps) {
  const [activeTab, setActiveTab] = useState<'starters' | 'plans' | 'noticed' | 'mystuff'>('starters');
  const [activeAction, setActiveAction] = useState<QuickActionData | null>(null);

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

  return (
    <div className={`bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-purple-100 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="text-sm text-purple-600 font-medium">Quick Actions</span>
        </div>
        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 transition-colors">
          <CheckCircle2 className="w-4 h-4" />
          <span>check in</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-3">
        {/* Starters Tab */}
        {activeTab === 'starters' && (
          <div className="animate-fadeIn space-y-3">
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 hover:border-purple-300 hover:shadow-sm transition-all">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 mb-1">DataViz Corp mentioned expansion</p>
                  <p className="text-xs text-gray-500">Based on LinkedIn activity</p>
                </div>
                <button
                  onClick={() => handleActionClick({
                    type: 'email',
                    title: 'Email about expansion',
                    customer: 'DataViz Corp',
                    contact: 'Sarah Chen'
                  })}
                  className="text-gray-400 hover:text-purple-500 transition-colors p-1"
                  aria-label="Quick action"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 hover:border-purple-300 hover:shadow-sm transition-all">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 mb-1">Acme Corp new VP of Engineering</p>
                  <p className="text-xs text-gray-500">Opportunity to reconnect</p>
                </div>
                <button
                  onClick={() => handleActionClick({
                    type: 'email',
                    title: 'Reconnect email',
                    customer: 'Acme Corp',
                    contact: 'New VP of Engineering'
                  })}
                  className="text-gray-400 hover:text-purple-500 transition-colors p-1"
                  aria-label="Quick action"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 hover:border-indigo-300 hover:shadow-sm transition-all">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 mb-1">TechFlow contract ends in 60 days</p>
                  <p className="text-xs text-gray-500">Schedule renewal discussion</p>
                </div>
                <button
                  onClick={() => handleActionClick({
                    type: 'remind',
                    title: 'TechFlow renewal discussion',
                    customer: 'TechFlow'
                  })}
                  className="text-gray-400 hover:text-indigo-500 transition-colors p-1"
                  aria-label="Quick action"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div className="animate-fadeIn space-y-3">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="flex items-start gap-3">
                <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 mb-1">Obsidian Black: Account Plan</p>
                  <p className="text-xs text-gray-500">Due today • Critical</p>
                </div>
                <button
                  onClick={() => handleActionClick({
                    type: 'task',
                    title: 'Update Account Plan',
                    customer: 'Obsidian Black'
                  })}
                  className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                  aria-label="Quick action"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="flex items-start gap-3">
                <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 mb-1">TechFlow: Renewal Strategy</p>
                  <p className="text-xs text-gray-500">Due this week</p>
                </div>
                <button
                  onClick={() => handleActionClick({
                    type: 'task',
                    title: 'Plan Renewal Strategy',
                    customer: 'TechFlow'
                  })}
                  className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                  aria-label="Quick action"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Noticed Tab */}
        {activeTab === 'noticed' && (
          <div className="animate-fadeIn space-y-3">
            <div className="p-4 bg-green-50 rounded-xl border border-green-100 hover:border-green-300 hover:shadow-sm transition-all">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 mb-1">DataViz usage up 40%</p>
                  <p className="text-xs text-gray-500">Expansion signal detected</p>
                </div>
                <button
                  onClick={() => handleActionClick({
                    type: 'meeting',
                    title: 'Discuss expansion opportunity',
                    customer: 'DataViz Corp'
                  })}
                  className="text-gray-400 hover:text-green-500 transition-colors p-1"
                  aria-label="Quick action"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 hover:border-orange-300 hover:shadow-sm transition-all">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 mb-1">CloudSync: 3 support tickets</p>
                  <p className="text-xs text-gray-500">May need check-in</p>
                </div>
                <button
                  onClick={() => handleActionClick({
                    type: 'meeting',
                    title: 'Check-in call',
                    customer: 'CloudSync'
                  })}
                  className="text-gray-400 hover:text-orange-500 transition-colors p-1"
                  aria-label="Quick action"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My Stuff Tab */}
        {activeTab === 'mystuff' && (
          <div className="animate-fadeIn space-y-3">
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 hover:border-purple-300 hover:shadow-sm transition-all">
              <div className="flex items-start gap-3">
                <Heart className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 mb-1">Inbox Zero Progress</p>
                  <div className="mt-2 w-full bg-purple-200 rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">68% of days this quarter</p>
                </div>
                <button
                  onClick={() => handleActionClick({
                    type: 'update',
                    title: 'Update personal goal'
                  })}
                  className="text-gray-400 hover:text-purple-500 transition-colors p-1"
                  aria-label="Quick action"
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
