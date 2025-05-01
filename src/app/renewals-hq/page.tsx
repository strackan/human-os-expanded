"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  EnvelopeIcon, 
  HandRaisedIcon, 
  CurrencyDollarIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const renewalStages = [
  { id: 1, name: 'Planning', status: 'complete' },
  { id: 2, name: 'Outreach', status: 'complete' },
  { id: 3, name: 'Negotiation', status: 'current' },
  { id: 4, name: 'Approval', status: 'upcoming' },
  { id: 5, name: 'Closed', status: 'upcoming' },
] as const;

const snoozeOptions = [
  { label: '1 hour', value: '1h' },
  { label: '1 day', value: '1d' },
  { label: '1 week', value: '1w' },
  { label: 'Custom', value: 'custom' },
];

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

const customerRecords: Customer[] = [
  {
    id: 1,
    name: 'Acme Corporation',
    arr: '$450,000',
    renewalDate: 'Aug 15, 2024',
    daysUntil: 45,
    exec: 'Sarah Johnson',
    health: 'Healthy',
    healthColor: 'green',
    stages: [
      { id: 1, name: 'Planning', status: 'complete' },
      { id: 2, name: 'Outreach', status: 'complete' },
      { id: 3, name: 'Negotiation', status: 'current' },
      { id: 4, name: 'Approval', status: 'upcoming' },
      { id: 5, name: 'Closed', status: 'upcoming' },
    ]
  },
  {
    id: 2,
    name: 'Globex Inc.',
    arr: '$320,000',
    renewalDate: 'Sep 10, 2024',
    daysUntil: 70,
    exec: 'Alex Park',
    health: 'At Risk',
    healthColor: 'red',
    stages: [
      { id: 1, name: 'Planning', status: 'complete' },
      { id: 2, name: 'Outreach', status: 'current' },
      { id: 3, name: 'Negotiation', status: 'upcoming' },
      { id: 4, name: 'Approval', status: 'upcoming' },
      { id: 5, name: 'Closed', status: 'upcoming' },
    ]
  },
  {
    id: 3,
    name: 'Initech',
    arr: '$210,000',
    renewalDate: 'Oct 2, 2024',
    daysUntil: 90,
    exec: 'Michael Bolton',
    health: 'Expansion Ready',
    healthColor: 'blue',
    stages: [
      { id: 1, name: 'Planning', status: 'current' },
      { id: 2, name: 'Outreach', status: 'upcoming' },
      { id: 3, name: 'Negotiation', status: 'upcoming' },
      { id: 4, name: 'Approval', status: 'upcoming' },
      { id: 5, name: 'Closed', status: 'upcoming' },
    ]
  }
];

type Stage = {
  id: number;
  name: string;
  status: 'complete' | 'current' | 'upcoming';
};

type Customer = {
  id: number;
  name: string;
  arr: string;
  renewalDate: string;
  daysUntil: number;
  exec: string;
  health: string;
  healthColor: string;
  stages: Stage[];
};

interface CustomerCardProps {
  customer: Customer;
  isTop: boolean;
  onSnooze: () => void;
  isSwiping: boolean;
  style?: React.CSSProperties;
  index: number;
  cardNumber: number;
}

const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  isTop,
  onSnooze,
  isSwiping,
  style,
  index,
  cardNumber,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClick);
    }

    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  // Use cardNumber for button logic
  let actionLabel = "Prepare to Negotiate";
  let ActionIcon = HandRaisedIcon;

  if (cardNumber === 1) {
    actionLabel = "Create Quote";
    ActionIcon = CurrencyDollarIcon;
  } else if (cardNumber === 2) {
    actionLabel = "Review Contract";
    ActionIcon = DocumentTextIcon;
  }

  return (
    <div
      className={[
        'bg-white shadow-md rounded-lg px-8 py-6 border border-gray-100 relative transition-all duration-400 ease-in-out w-full',
        isSwiping ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100',
        isTop ? '' : 'pointer-events-none select-none',
        `z-[${10 - index}]`,
        `top-[${index * 16}px]`,
        `scale-[${1 - index * 0.04}]`,
        'absolute',
      ].join(' ')}
      aria-label={`Customer card for ${customer.name}`}
    >
      {/* Snooze/Skip Icon Button - absolute right, centered vertically with stages */}
      {isTop && (
        <button
          type="button"
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 z-10"
          aria-label="Snooze or skip this action"
          title="Snooze or skip this action"
          onClick={onSnooze}
        >
          <ClockIcon className="h-6 w-6" />
        </button>
      )}
      <div className="flex flex-col space-y-4">
        {/* Customer Info Section */}
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-gray-900">
              <span className="text-blue-600">{customer.name}</span>
            </h2>
            <div className="space-y-2">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Current ARR:</span>
                  <span className="text-lg font-semibold text-gray-900">{customer.arr}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Renewal Date:</span>
                  <span className="text-lg font-semibold text-gray-900">{customer.renewalDate}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Days Until Renewal:</span>
                  <span className="text-lg font-semibold text-green-600">{customer.daysUntil}</span>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Account Executive:</span>
                  <span className="text-gray-900">{customer.exec}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Customer Health:</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium bg-${customer.healthColor}-50 text-${customer.healthColor}-700`}>
                    {customer.health}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Stages Progress */}
          <div className="flex items-center space-x-4">
            {customer.stages.map((stage: Stage, idx: number) => (
              <div 
                key={stage.id}
                className="flex flex-col items-center"
              >
                <div className="relative flex items-center">
                  {idx !== 0 && (
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
            <ActionIcon className="h-5 w-5 mr-2" />
            {actionLabel}
          </button>
          {/* More Actions Dropdown */}
          <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
              type="button"
              className="flex items-center px-4 py-2.5 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              id={`actions-menu-button-${customer.id}`}
            >
              More Actions
              <ChevronDownIcon className="h-5 w-5 ml-2" />
            </button>

            {dropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby={`actions-menu-button-${customer.id}`}
              >
                <div className="py-1" role="none">
                  <button
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    onClick={() => { setDropdownOpen(false); alert('Send Email'); }}
                  >
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    Send Email
                  </button>
                  <button
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    onClick={() => { setDropdownOpen(false); alert('Review Contract'); }}
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Review Contract
                  </button>
                  <button
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    onClick={() => { setDropdownOpen(false); alert('Generate Quote'); }}
                  >
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    Generate Quote
                  </button>
                  <button
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    onClick={() => { setDropdownOpen(false); alert('Send Invoice'); }}
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Send Invoice
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const RenewalsHQPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Only render the top card, no animation/movement
  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="relative min-h-[220px] mb-8 h-[260px] overflow-visible">
        <CustomerCard
          customer={customerRecords[currentIndex]}
          isTop={true}
          onSnooze={() => setCurrentIndex((i) => (i + 1) % customerRecords.length)}
          isSwiping={false}
          index={0}
          cardNumber={currentIndex}
        />
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