/**
 * Meeting Notes Artifact Component
 *
 * Displays executive escalation briefs and status check meetings
 * Maps to database artifact_type: 'meeting_notes'
 *
 * Features:
 * - Flexible structure handling (escalation brief vs status check)
 * - Situation analysis and risk factors
 * - Executive action items
 * - War room details
 * - Display-only (not editable)
 */

'use client';

import React from 'react';

interface WhatsAtStake {
  currentARR: number;
  expansionARR: number;
  atRiskARR: number;
  accountHealth: string;
}

interface ExecutiveActions {
  vendorCEO?: string;
  vendorCFO?: string;
  customerSuccess?: string;
  [key: string]: string | undefined;
}

interface WarRoomDetails {
  frequency: string;
  participants: string[];
  agenda: string;
}

interface RapidStatus {
  contractStatus: string;
  paymentStatus: string;
  primaryBlocker: string;
}

interface MeetingNotesContent {
  // Executive Escalation Brief fields
  situationBrief?: string;
  whyAtRisk?: string[];
  whatsAtStake?: WhatsAtStake;
  executiveActions?: ExecutiveActions;
  warRoomRecommendation?: string;
  warRoomDetails?: WarRoomDetails;

  // Emergency Status Check fields
  hoursUntilRenewal?: number;
  rapidStatus?: RapidStatus;
  pathForward?: string;
  reasoning?: string;
  teamNotification?: string;
}

interface MeetingNotesArtifactProps {
  title: string;
  data?: MeetingNotesContent;
  customerContext?: any;
  onClose?: () => void;
}

export function MeetingNotesArtifact({
  title,
  data,
  customerContext,
  onClose
}: MeetingNotesArtifactProps) {
  // Replace handlebars variables in title
  const processedTitle = title.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const keys = path.trim().split('.');
    let value: any = customerContext;
    for (const key of keys) {
      value = value?.[key];
    }
    return value !== undefined ? String(value) : match;
  });

  const content = data || {};

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Determine meeting type
  const isEscalationBrief = content.situationBrief !== undefined;
  const isStatusCheck = content.hoursUntilRenewal !== undefined;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{processedTitle}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {isEscalationBrief ? 'Executive escalation briefing document' : 'Emergency status check meeting notes'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full border border-red-200">
            {isEscalationBrief ? 'EXECUTIVE ESCALATION' : 'EMERGENCY STATUS'}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-6">

          {/* Executive Escalation Brief Format */}
          {isEscalationBrief && (
            <>
              {/* Situation Brief */}
              {content.situationBrief && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Situation Brief
                  </h3>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <p className="text-sm text-red-900">{content.situationBrief}</p>
                  </div>
                </div>
              )}

              {/* Why At Risk */}
              {content.whyAtRisk && content.whyAtRisk.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Why This Renewal Is At Risk
                  </h3>
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <ul className="space-y-2">
                      {content.whyAtRisk.map((risk, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-600 mt-0.5 font-bold">•</span>
                          <span className="text-sm text-orange-900">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* What's At Stake */}
              {content.whatsAtStake && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    What's At Stake
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Current ARR</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(content.whatsAtStake.currentARR)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Expansion ARR</p>
                        <p className="text-xl font-bold text-green-700">{formatCurrency(content.whatsAtStake.expansionARR)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">At-Risk ARR</p>
                        <p className="text-xl font-bold text-red-700">{formatCurrency(content.whatsAtStake.atRiskARR)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Account Health</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{content.whatsAtStake.accountHealth}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Executive Actions */}
              {content.executiveActions && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Required Executive Actions
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-3">
                    {Object.entries(content.executiveActions).map(([role, action]) => (
                      action && (
                        <div key={role} className="flex items-start gap-3">
                          <span className="px-2 py-1 bg-blue-200 text-blue-900 text-xs font-semibold rounded">
                            {role.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                          </span>
                          <span className="text-sm text-blue-900 flex-1">{action}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* War Room Recommendation */}
              {content.warRoomRecommendation && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    War Room Activation
                  </h3>
                  <div className={`rounded-lg p-4 border-2 ${
                    content.warRoomRecommendation === 'YES'
                      ? 'bg-purple-50 border-purple-300'
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-2xl font-bold ${
                        content.warRoomRecommendation === 'YES' ? 'text-purple-900' : 'text-gray-700'
                      }`}>
                        {content.warRoomRecommendation}
                      </span>
                      <span className="text-sm text-gray-600">- War Room Required</span>
                    </div>

                    {content.warRoomDetails && (
                      <div className="space-y-3 mt-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">Frequency</p>
                          <p className="text-sm text-gray-900">{content.warRoomDetails.frequency}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">Participants</p>
                          <div className="flex flex-wrap gap-2">
                            {content.warRoomDetails.participants.map((participant, idx) => (
                              <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-900 text-xs rounded border border-purple-200">
                                {participant}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">Agenda</p>
                          <p className="text-sm text-gray-900">{content.warRoomDetails.agenda}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Emergency Status Check Format */}
          {isStatusCheck && (
            <>
              {/* Countdown */}
              {content.hoursUntilRenewal !== undefined && (
                <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-3xl font-bold text-red-900">{content.hoursUntilRenewal} Hours</p>
                      <p className="text-sm text-red-700">Until Renewal Deadline</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rapid Status */}
              {content.rapidStatus && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Current Status
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Contract Status</span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        content.rapidStatus.contractStatus.includes('SIGNED')
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      }`}>
                        {content.rapidStatus.contractStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Payment Status</span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        content.rapidStatus.paymentStatus.includes('RECEIVED')
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {content.rapidStatus.paymentStatus}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Primary Blocker</p>
                      <p className="text-sm font-medium text-red-700">{content.rapidStatus.primaryBlocker}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Path Forward */}
              {content.pathForward && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Path Forward
                  </h3>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-900">{content.pathForward}</p>
                  </div>
                </div>
              )}

              {/* Reasoning */}
              {content.reasoning && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Reasoning
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-900">{content.reasoning}</p>
                  </div>
                </div>
              )}

              {/* Team Notification */}
              {content.teamNotification && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Team Notification
                  </h3>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-purple-900">{content.teamNotification}</p>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Meeting notes are read-only and cannot be edited.
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
