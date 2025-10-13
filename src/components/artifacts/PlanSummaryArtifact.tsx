"use client";

import React from 'react';
import { CheckCircle, Calendar, Users, FileText, ArrowRight, Clock, Target, Database, Bell } from 'lucide-react';

export interface SummaryTask {
  id: string;
  title: string;
  completed: boolean;
  timestamp?: string;
  assignee?: string;
}

export interface NextStep {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  assignee?: string;
  priority?: 'high' | 'medium' | 'low';
  type?: 'ai' | 'user';
}

export interface PlanSummaryProps {
  customerName?: string;
  tasksInitiated?: SummaryTask[];
  accomplishments?: string[];
  nextSteps?: NextStep[];
  followUpDate?: string;
  salesforceUpdated?: boolean;
  trackingEnabled?: boolean;
  onNextCustomer?: () => void;
}

const PlanSummaryArtifact: React.FC<PlanSummaryProps> = ({
  customerName = "Enterprise Customer",
  tasksInitiated = [
    { id: '1', title: 'Contract terms reviewed', completed: true, timestamp: 'Today 2:30 PM', assignee: 'You' },
    { id: '2', title: 'Target pricing established', completed: true, timestamp: 'Today 2:45 PM', assignee: 'You' },
    { id: '3', title: 'Contact validation completed', completed: true, timestamp: 'Today 3:00 PM', assignee: 'You' },
    { id: '4', title: 'Renewal notice prepared', completed: true, timestamp: 'Today 3:15 PM', assignee: 'You' }
  ],
  accomplishments = [
    'Confirmed 8% price increase strategy based on usage growth and market analysis',
    'Identified key stakeholder John Doe (CTO) as primary decision maker',
    'Established 90-day renewal timeline with key milestones',
    'Documented non-standard terms requiring legal review',
    'Set follow-up cadence for proactive engagement'
  ],
  nextSteps = [
    {
      id: '1',
      title: 'Send strategic plan summary email to Marcus',
      description: 'Automated email with plan overview and key milestones',
      dueDate: 'Tomorrow',
      type: 'ai'
    },
    {
      id: '2',
      title: 'Update CRM with strategic plan details',
      description: 'All plan data synced to Salesforce automatically',
      dueDate: 'Today',
      type: 'ai'
    },
    {
      id: '3',
      title: 'Check back in 3 days',
      description: "I'll send you a reminder to follow up on progress",
      dueDate: 'Mar 20',
      type: 'ai'
    },
    {
      id: '4',
      title: 'Schedule stakeholder meeting with Marcus',
      description: '30-min call to present strategic plan',
      dueDate: 'Mar 20, 2025',
      type: 'user'
    },
    {
      id: '5',
      title: 'Review account plan before call',
      description: 'Refresh on key points and priorities',
      dueDate: 'Before meeting',
      type: 'user'
    }
  ],
  followUpDate = "January 3, 2025",
  salesforceUpdated = true,
  trackingEnabled = true,
  onNextCustomer
}) => {

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-gray-900">Planning Complete</h3>
            <p className="text-sm text-gray-500 mt-0.5">{customerName}</p>
          </div>
          <CheckCircle size={18} className="text-green-600" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Tasks Initiated Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-400" />
            Tasks Initiated
          </h4>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="space-y-2">
              {tasksInitiated.map((task) => (
                <div key={task.id} className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm text-gray-900">{task.title}</span>
                    <div className="text-xs text-gray-500 mt-1">
                      {task.timestamp} • {task.assignee}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Accomplishments Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            Key Accomplishments
          </h4>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <ul className="space-y-2">
              {accomplishments.map((accomplishment, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0 mt-2"></div>
                  <span className="text-sm text-gray-700">{accomplishment}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* What I'll Handle - AI Actions */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" />
            I'll Handle
          </h4>
          <div className="space-y-2">
            {nextSteps.filter(step => step.type === 'ai').map((step) => (
              <div key={step.id} className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900">{step.title}</h5>
                    <p className="text-xs text-gray-600 mt-0.5">{step.description}</p>
                    {step.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1.5">
                        <Calendar className="w-3 h-3" />
                        <span>{step.dueDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What You'll Need To Do - User Actions */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            You'll Need To
          </h4>
          <div className="space-y-2">
            {nextSteps.filter(step => step.type === 'user').map((step) => (
              <div key={step.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 flex-shrink-0 mt-0.5 rounded border-2 border-gray-300"></div>
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900">{step.title}</h5>
                    <p className="text-xs text-gray-600 mt-0.5">{step.description}</p>
                    {step.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1.5">
                        <Calendar className="w-3 h-3" />
                        <span>{step.dueDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tracking & Follow-up Section */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">System Status</h4>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="flex items-center gap-2">
                <Database className={`w-4 h-4 ${salesforceUpdated ? 'text-green-500' : 'text-gray-400'}`} />
                <div>
                  <div className="text-xs font-medium text-gray-900">CRM</div>
                  <div className="text-xs text-gray-500">
                    {salesforceUpdated ? 'Synced' : 'Pending'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Bell className={`w-4 h-4 ${trackingEnabled ? 'text-green-500' : 'text-gray-400'}`} />
                <div>
                  <div className="text-xs font-medium text-gray-900">Reminders</div>
                  <div className="text-xs text-gray-500">
                    {trackingEnabled ? 'Active' : 'Off'}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600">Next Follow-up</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{followUpDate}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer - Action Buttons */}
      <div className="px-8 py-4 border-t border-gray-100 flex justify-end">
        <button
          onClick={onNextCustomer}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
        >
          Next Customer
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PlanSummaryArtifact;