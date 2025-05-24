"use client";
import React, { useRef, useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import CustomerChatDialog, { ChatMessage } from "../shared/CustomerChatDialog";
import { useRouter } from 'next/navigation';
import { useChatWorkflow } from '../../../hooks/useChatWorkflow';

export type BaseCustomerLayoutProps = {
  customer: {
    name: string;
    arr: string;
    stages: any[];
  };
  stats: { label: string; value: string }[];
  aiInsights: { category: string; color: 'green' | 'blue' | 'purple' | 'red'; text: string }[];
  miniCharts: { label: string; data: number[] }[];
  riskLevel: string;
  riskColor: string;
  chatConfig: {
    recommendedAction: { label: string; icon: string };
    botIntroMessage?: string;
    inputPlaceholder?: string;
  };
  prevCustomer?: string;
  nextCustomer?: string;
  // Additional props for specific layouts
  additionalProps?: Record<string, any>;
  // Chat workflow props
  chatSteps?: any[];
  onChatComplete?: () => void;
};

const BaseCustomerLayout: React.FC<BaseCustomerLayoutProps> = ({
  customer,
  stats,
  aiInsights,
  miniCharts,
  riskLevel,
  riskColor,
  chatConfig,
  prevCustomer,
  nextCustomer,
  additionalProps,
  chatSteps,
  onChatComplete,
  children,
}) => {
  const router = useRouter();
  const [leftWidthPx, setLeftWidthPx] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [mode, setMode] = useState<'pre-action' | 'chat'>('pre-action');

  const {
    messages,
    isComplete,
    handleUserMessage,
    initialize
  } = useChatWorkflow({
    steps: chatSteps || [],
    onComplete: onChatComplete
  });

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setLeftWidthPx(rect.width / 2);
    }
  }, []);

  // Drag handlers for vertical divider
  const startDrag = (e: React.MouseEvent) => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  const handleDrag = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    let newWidth = e.clientX - rect.left;
    newWidth = Math.max(320, Math.min(newWidth, rect.width - 320));
    setLeftWidthPx(newWidth);
  };

  const stopDrag = () => {
    isDragging.current = false;
    document.body.style.cursor = "default";
    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", stopDrag);
  };

  const handleProceedToRenewal = () => {
    setMode('chat');
    initialize();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-100 p-4 md:p-6 lg:p-8">
      {/* Top Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
              {customer.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Customer Management</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            {prevCustomer && (
              <button 
                onClick={() => router.push(`/customers/${prevCustomer}`)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Previous Customer"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
            )}
            {nextCustomer && (
              <button 
                onClick={() => router.push(`/customers/${nextCustomer}`)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Next Customer"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div 
        ref={containerRef}
        className="flex gap-6 h-[calc(100vh-12rem)]"
      >
        {/* Left Panel */}
        <div 
          style={{ width: leftWidthPx }}
          className="flex flex-col gap-6 overflow-hidden"
        >
          {children}
        </div>

        {/* Vertical Divider */}
        <div
          className="w-1 bg-gray-200 cursor-col-resize hover:bg-gray-300 transition-colors"
          onMouseDown={startDrag}
        />

        {/* Right Panel */}
        <div 
          style={{ width: `calc(100% - ${leftWidthPx}px - 1.5rem)` }}
          className="flex flex-col gap-6 overflow-hidden"
        >
          {mode === 'pre-action' ? (
            <div className="bg-white rounded-xl shadow-lg p-6 flex-1 flex flex-col">
              <h2 className="text-xl font-bold mb-4">Recommended Action</h2>
              <button
                onClick={handleProceedToRenewal}
                className="mt-auto w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {chatConfig.recommendedAction.label}
              </button>
            </div>
          ) : (
            <CustomerChatDialog
              messages={messages}
              onSendMessage={handleUserMessage}
              placeholder={chatConfig.inputPlaceholder}
              disabled={isComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BaseCustomerLayout; 