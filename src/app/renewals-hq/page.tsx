"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  DocumentTextIcon, 
  EnvelopeIcon, 
  HandRaisedIcon, 
  CurrencyDollarIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import ChatModal from '@/components/ChatModal';
import { Customer, Stage } from '@/types';

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

interface CustomerCardProps {
  customer: Customer;
  isTop: boolean;
  onSnooze: () => void;
  isSwiping: boolean;
  style?: React.CSSProperties;
  index: number;
  cardNumber: number;
  currentIndex: number;
  onStartDiscussion: () => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  isTop,
  onSnooze,
  isSwiping,
  style,
  index,
  cardNumber,
  currentIndex,
  onStartDiscussion
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        'bg-white shadow-md rounded-lg px-8 py-6 border border-gray-100 relative transition-all duration-500 ease-in-out w-full',
        isSwiping ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100',
        isTop ? 'z-30' : 'pointer-events-none select-none',
        `absolute top-[${index * 16}px]`,
      ].join(' ')}
      style={{
        ...style,
        transform: !isSwiping && cardNumber !== currentIndex 
          ? 'translate3d(100%, 0, 0)' 
          : undefined,
        transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
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
            {customer.stages.map((stage, idx) => (
              <div 
                key={stage.id}
                className="flex flex-col items-center"
              >
                <div className="flex items-center">
                  {stage.status === 'complete' ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  ) : stage.status === 'current' ? (
                    <div className="h-6 w-6 rounded-full border-2 border-blue-500 bg-blue-100" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                  )}
                  {idx < customer.stages.length - 1 && (
                    <div 
                      className={`h-0.5 w-8 ${
                        stage.status === 'complete' 
                          ? 'bg-green-500' 
                          : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
                <span 
                  className={`mt-2 text-sm ${
                    stage.status === 'complete'
                      ? 'text-green-600'
                      : stage.status === 'current'
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-500'
                  }`}
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
          {/* Add Discuss button next to More Actions */}
          <button
            type="button"
            className="flex items-center px-4 py-2.5 bg-white border-2 border-blue-500 text-blue-600 rounded-lg font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            onClick={onStartDiscussion}
          >
            <SparklesIcon className="h-5 w-5 mr-2" />
            Discuss with AI
          </button>
          {/* More Actions Dropdown */}
          <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
              type="button"
              className="flex items-center px-4 py-2.5 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen ? "true" : "false"}
              aria-haspopup="menu"
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
                  >
                    <EnvelopeIcon className="mr-3 h-5 w-5 text-gray-400" />
                    Send Email
                  </button>
                  <button
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <DocumentTextIcon className="mr-3 h-5 w-5 text-gray-400" />
                    View Contract
                  </button>
                  <button
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <CurrencyDollarIcon className="mr-3 h-5 w-5 text-gray-400" />
                    Generate Quote
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
  const [isExiting, setIsExiting] = useState(false);
  const [leftPaneWidth, setLeftPaneWidth] = useState(60);
  const [showChat, setShowChat] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSnooze = () => {
    setIsExiting(true);
    requestAnimationFrame(() => {
      setTimeout(() => {
        setIsExiting(false);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % customerRecords.length);
      }, 500);
    });
  };

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
  }, []);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    requestAnimationFrame(() => {
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const clampedWidth = Math.min(Math.max(newWidth, 20), 80);
      setLeftPaneWidth(Math.round(clampedWidth));
      
      container.classList.add('resizing');
    });
  }, []);

  const stopResize = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = 'default';
    
    if (containerRef.current) {
      containerRef.current.classList.remove('resizing');
    }
    
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  }, [handleResize]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
    };
  }, [handleResize, stopResize]);

  const handleStartDiscussion = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowChat(true);
  };

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 py-8">
      <div className="relative min-h-[220px] mb-8 h-[260px] overflow-visible">
        <CustomerCard
          customer={customerRecords[currentIndex]}
          isTop={true}
          onSnooze={handleSnooze}
          isSwiping={isExiting}
          index={0}
          cardNumber={currentIndex}
          currentIndex={currentIndex}
          onStartDiscussion={() => handleStartDiscussion(customerRecords[currentIndex])}
        />
      </div>

      {/* Resizable split pane container */}
      <div 
        ref={containerRef} 
        className="flex relative mt-8 [&.resizing]:select-none [&.resizing_.resize-handle]:bg-blue-500"
      >
        {/* Target Accounts Section */}
        <div 
          className="bg-white rounded-l-lg shadow-md p-6 border border-gray-100 transition-[width] duration-75"
          style={{ width: `${leftPaneWidth}%` }}
        >
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

        {/* Resize Handle */}
        <div
          className="w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize relative group resize-handle transition-colors duration-150"
          onMouseDown={startResize}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 bg-gray-200 group-hover:bg-blue-500 rounded opacity-0 group-hover:opacity-100 transition-all duration-150 resize-handle">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-0.5 h-4 bg-gray-400 group-hover:bg-white mx-0.5" />
              <div className="w-0.5 h-4 bg-gray-400 group-hover:bg-white mx-0.5" />
            </div>
          </div>
        </div>

        {/* Activity Feed Section */}
        <div 
          className="bg-white rounded-r-lg shadow-md p-6 border border-l-0 border-gray-100 transition-[width] duration-75"
          style={{ width: `${100 - leftPaneWidth}%` }}
        >
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
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

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Renewal Alert:</span> Microsoft Azure subscription needs attention
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-500">6 hours ago</span>
                  <span className="text-xs text-indigo-600 font-medium">Due in 45 days</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Security Review</span> completed for <span className="font-medium">Salesforce Enterprise</span>
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-500">8 hours ago</span>
                  <span className="text-xs text-orange-600 font-medium">All checks passed</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Financial Update:</span> Q2 renewals tracking above forecast
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-500">10 hours ago</span>
                  <span className="text-xs text-teal-600 font-medium">+8% vs target</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Quarterly Business Review</span> scheduled with <span className="font-medium">Amazon AWS</span>
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-500">12 hours ago</span>
                  <span className="text-xs text-pink-600 font-medium">Jun 15, 2025</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Customer Success</span> achieved 95% satisfaction score with <span className="font-medium">Netflix</span>
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-500">1 day ago</span>
                  <span className="text-xs text-emerald-600 font-medium">High performer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChat}
        onClose={() => {
          setShowChat(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
      />
    </div>
  );
};

export default RenewalsHQPage; 