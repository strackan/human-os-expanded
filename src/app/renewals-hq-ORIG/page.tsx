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
  SparklesIcon
} from '@heroicons/react/24/outline';
import ChatModal from '@/components/ChatModal';
import { Customer } from '@/types';
import '@/styles/resizable-divider.css';

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
              aria-expanded={dropdownOpen ? "true" : "false" as "true" | "false"}
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
  const isResizing = useRef(false);
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

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setLeftPaneWidth(rect.width / 2);
    }
  }, []);

  // Initialize panel width on mount
  useEffect(() => {
    document.documentElement.style.setProperty('--panel-width-left', `${leftPaneWidth}%`);
    document.documentElement.style.setProperty('--panel-width-right', `${100 - leftPaneWidth}%`);
  }, [leftPaneWidth]);

  const startResize = () => {
    isResizing.current = true;
    document.body.classList.add('resizing');
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
  };

  const handleResize = (e: MouseEvent) => {
    if (!isResizing.current || !containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedWidth = Math.max(30, Math.min(70, newWidth));
    setLeftPaneWidth(clampedWidth);
    document.documentElement.style.setProperty('--panel-width-left', `${clampedWidth}%`);
    document.documentElement.style.setProperty('--panel-width-right', `${100 - clampedWidth}%`);
  };

  const stopResize = () => {
    isResizing.current = false;
    document.body.classList.remove('resizing');
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  };

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
          className="resizable-panel-left bg-white rounded-l-lg shadow-md p-6 border border-gray-100 transition-[width] duration-75"
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
          className="divider-handle resizable-divider"
          onMouseDown={startResize}
        >
          <div className="divider-handle-knob"></div>
        </div>

        {/* Activity Feed Section */}
        <div 
          className="resizable-panel-right bg-white rounded-r-lg shadow-md p-6 border border-l-0 border-gray-100 transition-[width] duration-75"
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