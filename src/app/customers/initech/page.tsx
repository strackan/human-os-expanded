"use client";

import React, { useState, useRef } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import ConversationalChat from "../../../../components/chat/ConversationalChat";
import { initechChatSteps } from '../../../../components/chat/initech/initechChatWorkflow';
import { useRouter } from 'next/navigation';
import PageTransition from "../../../components/layout/PageTransition";
import { CustomerData } from '../../../types/chat';
import '@/styles/resizable-divider.css';
import { ChatStep } from "../../../types/chat";

// Mock data for Initech
const initechCustomer: CustomerData = {
  name: "Initech",
  arr: "$320,000",
  stages: [
    { id: 1, name: "Planning", status: "complete" as const },
    { id: 2, name: "Outreach", status: "current" as const },
    { id: 3, name: "Negotiation", status: "upcoming" as const },
    { id: 4, name: "Approval", status: "upcoming" as const },
    { id: 5, name: "Closed", status: "upcoming" as const },
  ],
  stats: [
    { label: "Current ARR", value: "$320,000" },
    { label: "Renewal Date", value: "Sep 30, 2024" },
    { label: "Usage", value: "88%" },
    { label: "2Y Avg PI%", value: "4.8%" },
    { label: "Support Tickets (30d)", value: "5" },
    { label: "Last Engagement", value: "2 days ago" },
  ],
  aiInsights: [
    { category: "Profit", color: "green", text: "Customer is open to a 3-5% price increase." },
    { category: "Engagement", color: "blue", text: "Recent support tickets resolved; sentiment neutral." },
    { category: "Sponsor", color: "purple", text: "VP of IT attended last QBR." },
    { category: "Risk", color: "red", text: "No open escalations; renewal risk is low." },
  ],
  miniCharts: [
    { label: "ARR Trend", data: [8, 9, 10, 11, 12, 13, 14] },
    { label: "Usage", data: [70, 75, 80, 85, 88, 87, 88] },
    { label: "PI%", data: [4.1, 4.3, 4.5, 4.7, 4.8, 4.8, 4.8] },
  ],
};



const MiniSparklineChart: React.FC<{ data: number[] }> = ({ data }) => (
  <svg width="60" height="24" viewBox="0 0 60 24" fill="none" className="overflow-visible">
    <polyline
      fill="none"
      stroke="#F59E42"
      strokeWidth="2"
      points={data
        .map((d, i) => `${(i / (data.length - 1)) * 58 + 1},${23 - ((d - Math.min(...data)) / (Math.max(...data) - Math.min(...data) || 1)) * 20}`)
        .join(" ")}
    />
  </svg>
);



const categoryColor = {
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  red: "bg-red-100 text-red-700",
};

const checklistItems = [
  "Initial Contact",
  "Needs Assessment",
  "Proposal",
  "Negotiation",
  "Close"
];

// RenewalChecklist component removed as it's not currently used

const ContextPanel: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col h-full w-full overflow-hidden">
    <div className="mb-4">
      <h3 className="text-xl font-bold mb-2">Key Metrics</h3>
      <div className="grid grid-cols-2 gap-3 overflow-hidden">
        {initechCustomer.stats.map((stat) => (
          <div className="bg-gray-50 rounded-lg p-2 min-h-0 min-w-0" key={stat.label}>
            <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
            <span className="text-lg font-bold text-gray-900 mt-1 block">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
    {/* Sparklines */}
    <div className="flex gap-4 mb-4">
      {initechCustomer.miniCharts.map((chart, i) => (
        <div className="flex flex-col items-center" key={i}>
          <MiniSparklineChart data={chart.data} />
          <span className="text-xs text-gray-500 mt-1">{chart.label}</span>
        </div>
      ))}
    </div>
    {/* AI Insights */}
    <div className="grid grid-cols-2 gap-3 mb-4 overflow-hidden">
      {initechCustomer.aiInsights.map((insight, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-2 h-full flex flex-col items-center">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${categoryColor[insight.color]}`}>{insight.category}</span>
          <span className="text-sm text-gray-700 text-center">{insight.text}</span>
        </div>
      ))}
    </div>
  </div>
);

// Shared chat messages for Initech
const DEMO_RESPONSE = 'Thank you for your question! (This is a demo response. In production, this would be answered by AI or support. Would you like to proceed to planning the renewal?)';
const RENEWAL_STRATEGY_MSG = 'Please review the data. Initech has a moderate likelihood of renewal, so I recommend a balanced approach. <br/><br/>Shall we 1) proceed with a moderate price increase strategy, or would you 2) prefer a more conservative approach?';

type ChatMessage = { sender: 'user' | 'bot'; text: string };
const InitialQnAChat: React.FC<{
  onPrepare: () => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isPreAction: boolean;
  renewalStep: 'strategy' | 'chat';
  onStrategyAnswered: (answer: string) => void;
}> = ({ onPrepare, messages, setMessages, isPreAction, renewalStep, onStrategyAnswered }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const userMsg = input.trim();
    if (isPreAction) {
      if (!userMsg) return;
      setMessages((msgs) => [...msgs, { sender: 'user', text: userMsg }]);
      setTimeout(() => {
        if (/^y(es)?$/i.test(userMsg)) {
          onPrepare();
          return;
        }
        setMessages((msgs) => [
          ...msgs,
          {
            sender: 'bot',
            text: DEMO_RESPONSE,
          },
        ]);
      }, 600);
      setInput('');
      inputRef.current?.focus();
      return;
    }
    if (renewalStep === 'strategy') {
      setMessages((msgs) => [...msgs, { sender: 'user', text: userMsg }]);
      setTimeout(() => {
        if (userMsg === '1') {
          onStrategyAnswered('moderate');
        } else if (userMsg === '2') {
          onStrategyAnswered('conservative');
        } else if (userMsg === '') {
          onStrategyAnswered('skipped');
        } else {
          setMessages((msgs) => [
            ...msgs,
            { sender: 'bot', text: RENEWAL_STRATEGY_MSG },
          ]);
        }
      }, 600);
      setInput('');
      inputRef.current?.focus();
      return;
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="flex flex-col h-full w-full max-h-[calc(100vh-180px)]">
      {/* Recommended Action Card - now at the top */}
      <div className="mb-4">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-4 shadow-sm justify-center">
          <div className="flex flex-col items-center text-center">
            <span className="text-sm font-semibold text-orange-800 mb-2">Recommended Action:</span>
            <button
              className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 inline-flex items-center gap-2"
              onClick={onPrepare}
              tabIndex={0}
              aria-label="Send Notification"
            >
              <PaperAirplaneIcon className="h-5 w-5 text-white" aria-hidden="true" />
              Send Notification
            </button>
          </div>
        </div>
      </div>
      {/* Instruction */}
      <div className="mb-1">
        <p className="text-sm text-gray-700 font-medium">
          Please review the information to the left and feel free to ask any questions about this account.
        </p>
      </div>
      {/* Chat area - scrollable, flex-1 */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-4 min-h-[120px]">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-sm text-center mt-8">No questions yet. Ask anything about this account!</div>
        ) : (
          <ul className="space-y-2">
            {messages.map((msg, i) =>
              msg.sender === 'bot' && msg.text.includes('<br/>') ? (
                <li key={i} className="text-left">
                  <span
                    className="inline-block bg-gray-200 text-gray-700 rounded-lg px-3 py-1 text-sm max-w-xs"
                    aria-label="Bot response"
                    dangerouslySetInnerHTML={{ __html: msg.text }}
                  />
                </li>
              ) : (
                <li key={i} className={msg.sender === 'user' ? 'text-right' : 'text-left'}>
                  <span
                    className={
                      msg.sender === 'user'
                        ? 'inline-block bg-blue-100 text-blue-800 rounded-lg px-3 py-1 text-sm max-w-xs'
                        : 'inline-block bg-gray-200 text-gray-700 rounded-lg px-3 py-1 text-sm max-w-xs'
                    }
                    aria-label={msg.sender === 'user' ? 'Your message' : 'Bot response'}
                  >
                    {msg.text}
                  </span>
                </li>
              )
            )}
          </ul>
        )}
      </div>
      {/* Input - always visible at bottom, no margin-top */}
      <div className="flex items-center gap-2 pt-2">
        <input
          ref={inputRef}
          type="text"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          aria-label="Ask a question about this account"
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={handleSend}
          tabIndex={0}
          aria-label="Send question"
        >
          Send
        </button>
      </div>
    </div>
  );
};

const ProgressStepper: React.FC<{ currentStep: number }> = ({ currentStep }) => (
  <div className="flex flex-col items-center h-full w-full py-6">
    <ol className="space-y-4 w-full">
      {checklistItems.map((item, idx) => (
        <li key={item} className="flex items-center gap-3">
          <div className={`rounded-full w-7 h-7 flex items-center justify-center border-2 ${
            idx < currentStep
              ? 'bg-green-100 border-green-500 text-green-700'
              : idx === currentStep
              ? 'bg-blue-100 border-blue-500 text-blue-700 font-bold'
              : 'bg-gray-100 border-gray-300 text-gray-400'
          }`}>
            {idx < currentStep ? <CheckCircleIcon className="w-5 h-5" /> : idx + 1}
          </div>
          <span className={`text-sm ${idx === currentStep ? 'font-bold text-blue-700' : idx < currentStep ? 'text-gray-500 line-through' : 'text-gray-400'}`}>{item}</span>
        </li>
      ))}
    </ol>
  </div>
);

const chatSteps: ChatStep[] = initechChatSteps.map(step => ({
  ...step,
  bot: step.message(),
  inputType: 'choiceOrInput' as const,
  onUser: (answer: string) => {
    // Handle user response
    if (answer === '1') {
      return 'Great! We\'ll proceed with the moderate price increase strategy.';
    } else if (answer === '2') {
      return 'Understood. We\'ll take a more conservative approach with the price increase.';
    } else {
      return 'Please select either option 1 or 2 to proceed.';
    }
  }
}));

const InitechPage = () => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'pre-action' | 'chat'>('pre-action');
  const [step, setStep] = useState(1);
  const [renewalStep, setRenewalStep] = useState<'strategy' | 'chat'>('strategy');
  const [answers, setAnswers] = useState<string[]>(['', '']);
  const [waiting, setWaiting] = useState(false);
  const [input, setInput] = useState('');
  const [progressCollapsed, setProgressCollapsed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const nextCustomer = 'acme-corporation';
  const prevCustomer = null;

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const handleDrag = (e: MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newLeftWidth > 20 && newLeftWidth < 80) {
        containerRef.current.style.setProperty('--left-width', `${newLeftWidth}%`);
      }
    }
  };

  const stopDrag = () => {
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
  };

  const handleChatSubmit = (answer: string) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[step - 1] = answer;
      return newAnswers;
    });
    
    if (step < chatSteps.length) {
      setStep(step + 1);
    } else {
      setWaiting(true);
      setTimeout(() => {
        setWaiting(false);
        setStep(1);
        setAnswers(['', '']);
      }, 2000);
    }
  };

  const handleInputChange = (val: string) => setInput(val);

  const handleMultiStepAdvance = (nextStep: number, updatedAnswers: string[]) => {
    setStep(nextStep);
    setAnswers(updatedAnswers);
  };

  const handleProceedToRenewal = () => {
    setMode('chat');
    setStep(1);
  };

  const handleStrategyAnswered = (answer: string) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[1] = answer;
      return newAnswers;
    });
    setRenewalStep('chat');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-100 p-4 md:p-6 lg:p-8">
        {/* Top Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
                {initechCustomer.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">Customer Management</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-2">
              {prevCustomer && (
                <button 
                  onClick={() => router.push(`/customers/${prevCustomer}`)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  tabIndex={0}
                  aria-label="Previous Customer"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
              )}
              {nextCustomer && (
                <button 
                  onClick={() => router.push(`/customers/${nextCustomer}`)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  tabIndex={0}
                  aria-label="Next Customer"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Container */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
          {/* Main Container: Before chat, show only ContextPanel. After, show resizable split with ProgressStepper and ContextPanel, and ChatPanel on the right. */}
          {mode !== 'chat' ? (
            <div className="flex w-full h-[70vh]" ref={containerRef}>
              <div className="resizable-panel-left h-full">
                <ContextPanel />
              </div>
              {/* Draggable Divider for pre-action stage */}
              <div
                className="divider-handle resizable-divider"
                onMouseDown={startDrag}
                tabIndex={0}
                aria-label="Resize panel"
                role="separator"
              >
                <div className="divider-handle-knob"></div>
              </div>
              {/* Right panel: Q&A Chat and Recommended Action */}
              <div className="flex-1 h-full flex flex-col justify-center items-center pb-6">
                <div className="w-full max-w-md h-full flex flex-col justify-between">
                  <InitialQnAChat
                    onPrepare={handleProceedToRenewal}
                    messages={messages}
                    setMessages={setMessages}
                    isPreAction={mode === 'pre-action'}
                    renewalStep={renewalStep}
                    onStrategyAnswered={handleStrategyAnswered}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex w-full" ref={containerRef}>
              <div
                className="resizable-panel-left bg-white rounded-2xl shadow-lg flex h-[70vh] z-10"
              >
                <div className="flex flex-row h-full w-full">
                  {/* ProgressStepper (collapsible) */}
                  <div className={`border-r border-gray-200 flex flex-col items-start justify-end pl-[5px] ${progressCollapsed ? 'w-12' : 'w-2/5'}`}>
                    {/* Collapse/Expand Icon */}
                    <button
                      className="mt-2 mb-4 p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 self-end"
                      tabIndex={0}
                      aria-label={progressCollapsed ? 'Expand Progress Stepper' : 'Collapse Progress Stepper'}
                      onClick={() => setProgressCollapsed(c => !c)}
                      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setProgressCollapsed(c => !c)}
                    >
                      {progressCollapsed ? (
                        <ChevronRightIcon className="w-6 h-6 text-gray-500" />
                      ) : (
                        <ChevronLeftIcon className="w-6 h-6 text-gray-500" />
                      )}
                    </button>
                    {!progressCollapsed && <ProgressStepper currentStep={step} />}
                  </div>
                  {/* ContextPanel (Key Metrics) */}
                  <div className="flex-1 h-full flex flex-col">
                    <ContextPanel />
                  </div>
                </div>
              </div>
              {/* Draggable Divider for chat mode */}
              <div
                className="divider-handle resizable-divider"
                onMouseDown={startDrag}
                tabIndex={0}
                aria-label="Resize panel"
                role="separator"
              >
                <div className="divider-handle-knob"></div>
              </div>
              {/* ChatPanel on the right */}
              <div className="flex-1 h-[70vh]">
                <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col h-full w-full">
                  <ConversationalChat
                    steps={chatSteps}
                    step={step}
                    answers={answers}
                    waiting={waiting}
                    onSubmit={handleChatSubmit}
                    onInputChange={handleInputChange}
                    input={input}
                    setPrice={() => {}}
                    onMultiStepAdvance={handleMultiStepAdvance}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation at bottom */}
        <div className="flex w-full justify-end items-end mt-4">
          {nextCustomer && (
            <button
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-orange-600 focus:outline-none"
              tabIndex={0}
              aria-label={`Go to next customer: ${nextCustomer}`}
              onClick={() => router.push(`/customers/${nextCustomer}`)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && router.push(`/customers/${nextCustomer}`)}
            >
              <span>Next: {nextCustomer}</span>
              <ChevronRightIcon className="w-7 h-7 text-gray-300" />
            </button>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default InitechPage; 