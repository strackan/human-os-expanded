"use client";

import React, { useState } from 'react';
import { 
  DocumentTextIcon, 
  EnvelopeIcon, 
  HandRaisedIcon, 
  CurrencyDollarIcon,
  ChevronDownIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const renewalStages = [
  { id: 1, name: 'Planning', status: 'complete' },
  { id: 2, name: 'Outreach', status: 'complete' },
  { id: 3, name: 'Negotiation', status: 'current' },
  { id: 4, name: 'Approval', status: 'upcoming' },
  { id: 5, name: 'Closed', status: 'upcoming' },
] as const;

const stages = [
  { name: 'Planning', count: 2 },
  { name: 'Outreach', count: 4 },
  { name: 'Negotiation', count: 3 },
  { name: 'Signature', count: 3 },
  { name: 'Invoice', count: 1 },
  { name: 'Paid', count: 0 },
];

const timeFrames = [
  { label: 'Today', count: 1 },
  { label: '7d', count: 2 },
  { label: '30d', count: 5 },
  { label: '60d', count: 3 },
  { label: '90d', count: 0 },
  { label: '120d', count: 1 },
];

const RenewalsHQPage = () => {
  const [viewMode, setViewMode] = useState<'stage' | 'date'>('stage');
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Local header section */}
      <div>
        <header className="bg-white shadow-md rounded-lg px-8 py-6 mb-8 border border-gray-100">
          <div className="flex flex-col space-y-4">
            {/* Customer Info Section */}
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-gray-900">
                  <span className="text-blue-600">Acme Corporation</span>
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Current ARR:</span>
                      <span className="text-lg font-semibold text-gray-900">$450,000</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Renewal Date:</span>
                      <span className="text-lg font-semibold text-gray-900">Aug 15, 2024</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Days Until Renewal:</span>
                      <span className="text-lg font-semibold text-green-600">45</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Account Executive:</span>
                      <span className="text-gray-900">Sarah Johnson</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Customer Health:</span>
                      <span className="px-2 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
                        Healthy
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stages Progress */}
              <div className="flex items-center space-x-4">
                {renewalStages.map((stage, index) => (
                  <div 
                    key={stage.id}
                    className="flex flex-col items-center"
                  >
                    <div className="relative flex items-center">
                      {index !== 0 && (
                        <div 
                          className={`h-0.5 w-8 -ml-4 ${
                            stage.status === 'upcoming' 
                              ? 'bg-gray-200' 
                              : 'bg-blue-500'
                          }`}
                        />
                      )}
                      <div 
                        className={`
                          w-6 h-6 rounded-full flex items-center justify-center
                          ${stage.status === 'complete' ? 'bg-blue-500 text-white' : ''}
                          ${stage.status === 'current' ? 'bg-blue-100 border-2 border-blue-500 text-blue-500' : ''}
                          ${stage.status === 'upcoming' ? 'bg-gray-100 text-gray-400' : ''}
                        `}
                      >
                        {stage.status === 'complete' ? (
                          <CheckCircleIcon className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-medium">{stage.id}</span>
                        )}
                      </div>
                    </div>
                    <span 
                      className={`
                        mt-2 text-xs font-medium whitespace-nowrap
                        ${stage.status === 'complete' ? 'text-blue-500' : ''}
                        ${stage.status === 'current' ? 'text-blue-700' : ''}
                        ${stage.status === 'upcoming' ? 'text-gray-400' : ''}
                      `}
                    >
                      {stage.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex items-center space-x-4 pt-4">
              {/* Recommended Action */}
              <button
                type="button"
                className="flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <HandRaisedIcon className="h-5 w-5 mr-2" />
                Prepare to Negotiate
              </button>

              {/* Other Actions Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsActionsOpen(!isActionsOpen)}
                  className="flex items-center px-4 py-2.5 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-haspopup="true"
                  aria-expanded="false"
                  id="actions-menu-button"
                >
                  More Actions
                  <ChevronDownIcon className="h-5 w-5 ml-2" />
                </button>

                {isActionsOpen && (
                  <div 
                    className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="actions-menu-button"
                  >
                    <div className="py-1">
                      <span
                        role="menuitem"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 opacity-50 cursor-not-allowed"
                        aria-disabled="true"
                      >
                        <DocumentTextIcon className="h-5 w-5 mr-3" />
                        Review Contract
                      </span>
                      <button
                        role="menuitem"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        onClick={() => {
                          // Handle email action
                          setIsActionsOpen(false);
                        }}
                      >
                        <EnvelopeIcon className="h-5 w-5 mr-3" />
                        Send an Email
                      </button>
                      <span
                        role="menuitem"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 opacity-50 cursor-not-allowed"
                        aria-disabled="true"
                      >
                        <CurrencyDollarIcon className="h-5 w-5 mr-3" />
                        Create a Quote
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      </div>
      
      {/* Main content container */}
      <div className="flex gap-8 mt-8">
        {/* Target Accounts Section - 60% */}
        <div className="flex-[6] bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Target Accounts: Week of May 5, 2025</h2>
          <div className="space-y-6">
            {/* Account Item */}
            <div className="border-b border-gray-100 pb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">TechStart Inc.</h3>
                <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium">
                  Price Increase
                </span>
              </div>
              <div className="text-gray-600 mb-2">Due in 14 days • $75,000 ARR</div>
              <div className="text-gray-600 flex flex-col">
                <div className="mb-1">
                  <span className="font-medium">Why targeted:</span> High usage (95%) and stakeholder satisfaction scores suggest opportunity for 7% increase vs. standard 5%
                </div>
                <div className="self-end">
                  <a
                    href="/accounts/techstart"
                    className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    tabIndex={0}
                  >
                    Take Me There
                    <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-100 pb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Global Services Ltd.</h3>
                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                  Expansion Ready
                </span>
              </div>
              <div className="text-gray-600 mb-2">Due in 7 days • $250,000 ARR</div>
              <div className="text-gray-600 flex flex-col">
                <div className="mb-1">
                  <span className="font-medium">Why targeted:</span> Recent API usage increase suggests readiness for Enterprise tier upgrade (+$75K ARR opportunity)
                </div>
                <div className="self-end">
                  <a
                    href="/accounts/global-services"
                    className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    tabIndex={0}
                  >
                    Take Me There
                    <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="pb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Innovate Systems</h3>
                <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                  At Risk
                </span>
              </div>
              <div className="text-gray-600 mb-2">Due in 21 days • $95,000 ARR</div>
              <div className="text-gray-600 flex flex-col">
                <div className="mb-1">
                  <span className="font-medium">Why targeted:</span> Support ticket volume increased 40% in last 30 days; requires executive engagement
                </div>
                <div className="self-end">
                  <a
                    href="/accounts/innovate-systems"
                    className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    tabIndex={0}
                  >
                    Take Me There
                    <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Section - 40% */}
        <div className="flex-[4] bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Activity Feed</h2>
            <button className="text-sm text-gray-500 hover:text-gray-700">View all</button>
          </div>
          <div className="space-y-6">
            {/* Activity Items */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Cloudflare Enterprise</span> renewal approved by finance
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-500">10 minutes ago</span>
                  <span className="text-xs text-green-600 font-medium">+$450,000 ARR</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Alexandra Park</span> scheduled a renewal planning call with <span className="font-medium">Stripe</span>
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-500">1 hour ago</span>
                  <span className="text-xs text-gray-600">May 15, 2025 at 2:00 PM</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Adobe Creative Cloud</span> renewal due in 30 days
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-500">2 hours ago</span>
                  <span className="text-xs text-yellow-600 font-medium">High Priority</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Michael Chen</span> generated Q2 forecast report
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-500">3 hours ago</span>
                  <button className="text-xs text-purple-600 font-medium hover:text-purple-700">View Report</button>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Dropbox</span> flagged for churn risk
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-500">5 hours ago</span>
                  <span className="text-xs text-red-600 font-medium">-$120,000 ARR at risk</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End of additional content */}
    </div>
  );
};

export default RenewalsHQPage; 