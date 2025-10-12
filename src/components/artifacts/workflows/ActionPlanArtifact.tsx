/**
 * Action Plan Artifact Component
 *
 * Displays emergency resolution plans and action items
 * Maps to database artifact_type: 'action_plan'
 *
 * Features:
 * - Flexible structure handling (resolution plan vs immediate actions)
 * - Primary blocker identification
 * - Action item lists by category
 * - Timeline tracking (daily status or hourly updates)
 * - Display-only (not editable)
 */

'use client';

import React from 'react';

interface ExecutiveCall {
  scheduled: boolean;
  participants: string[];
  objective: string;
}

interface ResolutionActions {
  multiChannelOutreach?: string[];
  executiveCall?: ExecutiveCall;
  alternativeMethods?: string[];
}

interface ImmediateActions {
  paymentCoordination?: string[];
  executiveConfirmation?: string[];
  hourlyUpdates?: string;
  [key: string]: string[] | string | undefined;
}

interface ActionPlanContent {
  // Common fields
  primaryBlocker: string;

  // Resolution Plan fields
  deadline?: string;
  resolutionActions?: ResolutionActions;
  dailyStatus?: {
    [key: string]: string;
  };

  // Immediate Action fields
  hoursRemaining?: number;
  immediateActions?: ImmediateActions;
}

interface ActionPlanArtifactProps {
  title: string;
  data?: ActionPlanContent;
  customerContext?: any;
  onClose?: () => void;
}

export function ActionPlanArtifact({
  title,
  data,
  customerContext,
  onClose
}: ActionPlanArtifactProps) {
  // Replace handlebars variables in title
  const processedTitle = title.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const keys = path.trim().split('.');
    let value: any = customerContext;
    for (const key of keys) {
      value = value?.[key];
    }
    return value !== undefined ? String(value) : match;
  });

  const content = data || { primaryBlocker: 'Unknown' };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Determine plan type
  const isResolutionPlan = content.resolutionActions !== undefined;
  const isImmediateAction = content.immediateActions !== undefined;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-orange-50 to-yellow-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{processedTitle}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {isResolutionPlan ? 'Emergency resolution action plan' : 'Immediate action items'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full border border-orange-200">
            ACTION REQUIRED
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Timeline Alert */}
      {(content.deadline || content.hoursRemaining !== undefined) && (
        <div className="px-6 py-3 bg-red-100 border-b border-red-200">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              {content.deadline && (
                <>
                  <p className="text-sm font-semibold text-red-900">Deadline</p>
                  <p className="text-xs text-red-700">{formatDate(content.deadline)}</p>
                </>
              )}
              {content.hoursRemaining !== undefined && (
                <>
                  <p className="text-xl font-bold text-red-900">{content.hoursRemaining} Hours Remaining</p>
                  <p className="text-xs text-red-700">Time until renewal deadline</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-6">

          {/* Primary Blocker */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Primary Blocker
            </h3>
            <div className="bg-red-50 rounded-lg p-4 border-2 border-red-300">
              <p className="text-base font-semibold text-red-900">{content.primaryBlocker}</p>
            </div>
          </div>

          {/* Resolution Plan Actions */}
          {isResolutionPlan && content.resolutionActions && (
            <>
              {/* Multi-Channel Outreach */}
              {content.resolutionActions.multiChannelOutreach && content.resolutionActions.multiChannelOutreach.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Multi-Channel Outreach
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <ul className="space-y-2">
                      {content.resolutionActions.multiChannelOutreach.map((action, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-blue-900">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Executive Call */}
              {content.resolutionActions.executiveCall && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Executive Call
                  </h3>
                  <div className={`rounded-lg p-4 border-2 ${
                    content.resolutionActions.executiveCall.scheduled
                      ? 'bg-green-50 border-green-300'
                      : 'bg-yellow-50 border-yellow-300'
                  }`}>
                    <div className="mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        content.resolutionActions.executiveCall.scheduled
                          ? 'bg-green-200 text-green-900'
                          : 'bg-yellow-200 text-yellow-900'
                      }`}>
                        {content.resolutionActions.executiveCall.scheduled ? '✓ SCHEDULED' : 'PENDING'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">Objective</p>
                        <p className="text-sm text-gray-900">{content.resolutionActions.executiveCall.objective}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">Participants</p>
                        <div className="flex flex-wrap gap-2">
                          {content.resolutionActions.executiveCall.participants.map((participant, idx) => (
                            <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-900 text-xs rounded border border-purple-200">
                              {participant}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Alternative Methods */}
              {content.resolutionActions.alternativeMethods && content.resolutionActions.alternativeMethods.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Alternative Methods
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <ul className="space-y-2">
                      {content.resolutionActions.alternativeMethods.map((method, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 text-gray-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-900">{method}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Daily Status Updates */}
              {content.dailyStatus && Object.keys(content.dailyStatus).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Daily Status Updates
                  </h3>
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200 space-y-3">
                    {Object.entries(content.dailyStatus).map(([day, status]) => (
                      <div key={day} className="border-l-4 border-indigo-400 pl-3">
                        <p className="text-xs font-semibold text-indigo-700 uppercase mb-1">{day}</p>
                        <p className="text-sm text-indigo-900">{status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Immediate Actions */}
          {isImmediateAction && content.immediateActions && (
            <>
              {Object.entries(content.immediateActions).map(([category, actions]) => {
                // Skip if it's a string (like hourlyUpdates)
                if (typeof actions === 'string') {
                  return (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                        <p className="text-sm text-orange-900">{actions}</p>
                      </div>
                    </div>
                  );
                }

                // Array of action items
                return (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <ul className="space-y-2">
                        {(actions as string[]).map((action, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded"
                            />
                            <span className="text-sm text-green-900">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Action plans are read-only. Use checkboxes for tracking progress.
        </div>
        <button
          onClick={() => alert('Export to PDF (mock)')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
        >
          Export to PDF
        </button>
      </div>
    </div>
  );
}
