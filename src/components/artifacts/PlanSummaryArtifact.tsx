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
  dueDate: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
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
  onBackToDashboard?: () => void;
  onReviewAccount?: () => void;
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
      title: 'Send renewal notice to customer',
      description: 'Email prepared renewal notice with pricing details',
      dueDate: 'Dec 20, 2024',
      assignee: 'You',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Schedule stakeholder meeting',
      description: 'Book 30-min call with John Doe to discuss renewal',
      dueDate: 'Dec 22, 2024',
      assignee: 'You',
      priority: 'high'
    },
    {
      id: '3',
      title: 'Legal review of contract terms',
      description: 'Submit non-standard terms for legal approval',
      dueDate: 'Dec 24, 2024',
      assignee: 'Legal Team',
      priority: 'medium'
    }
  ],
  followUpDate = "January 3, 2025",
  salesforceUpdated = true,
  trackingEnabled = true,
  onNextCustomer,
  onBackToDashboard,
  onReviewAccount
}) => {

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-300 px-6 py-4 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Renewal Planning Complete</h3>
            <p className="text-sm text-gray-600">{customerName} - Summary & Next Steps</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Tasks Initiated Section */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-green-600" />
            Tasks Initiated & Completed
          </h4>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="space-y-2">
              {tasksInitiated.map((task) => (
                <div key={task.id} className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{task.title}</span>
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
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Key Accomplishments
          </h4>
          <div className="bg-blue-50 rounded-lg p-4">
            <ul className="space-y-2">
              {accomplishments.map((accomplishment, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                  <span className="text-sm text-gray-700">{accomplishment}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Next Steps Section */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-purple-600" />
            Next Steps in the Plan
          </h4>
          <div className="space-y-3">
            {nextSteps.map((step) => (
              <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{step.title}</h5>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(step.priority)}`}>
                    {step.priority.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Due: {step.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{step.assignee}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tracking & Follow-up Section */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600" />
            You're All Set - We've Got This Covered
          </h4>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${salesforceUpdated ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Database className={`w-4 h-4 ${salesforceUpdated ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Salesforce Updated</div>
                  <div className="text-xs text-gray-600">
                    {salesforceUpdated ? 'All planning details synced' : 'Update pending'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${trackingEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Clock className={`w-4 h-4 ${trackingEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Follow-up Tracking</div>
                  <div className="text-xs text-gray-600">
                    {trackingEnabled ? 'Automated reminders set' : 'Manual tracking only'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-gray-900">Next Automated Follow-up</span>
              </div>
              <div className="text-lg font-semibold text-amber-700">{followUpDate}</div>
              <div className="text-xs text-gray-600 mt-1">
                You'll receive a reminder 3 days before to prepare for the next customer touchpoint
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={onNextCustomer}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Next Customer
            </button>

            <button
              onClick={onBackToDashboard}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Back to Dashboard
            </button>

            <button
              onClick={onReviewAccount}
              className="px-6 py-3 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Review this Account Further
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanSummaryArtifact;