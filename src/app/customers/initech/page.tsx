"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  RocketLaunchIcon,
  PencilIcon,
  FireIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import ConversationalChat from "../../../../components/chat/ConversationalChat";
import { initechChatSteps } from '../../../../components/chat/initech/initechChatWorkflow';
import { useRouter } from 'next/navigation';
import PageTransition from "../../../components/layout/PageTransition";
import { initechData } from "../../../data/customers";
import CustomerRenewalLayout from "../../../components/customers/CustomerRenewalLayout";
import { CustomerData, ProgressStep } from '../../../types/chat';
import { defaultChecklistItems, defaultProgressSteps, defaultRecommendedAction } from '../../../config/chatWorkflow';

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

const prevCustomer = "Acme Corporation";
const nextCustomer = "Umbrella Corp.";

const stats = [
  { label: "Current ARR", value: "$320,000" },
  { label: "Renewal Date", value: "Sep 30, 2024" },
  { label: "Usage", value: "88%" },
  { label: "2Y Avg PI%", value: "4.8%" },
  { label: "Support Tickets (30d)", value: "5" },
  { label: "Last Engagement", value: "2 days ago" },
];

const aiInsights: { category: string; color: 'green' | 'blue' | 'purple' | 'red'; text: string }[] = [
  { category: "Profit", color: "green", text: "Customer is open to a 3-5% price increase." },
  { category: "Engagement", color: "blue", text: "Recent support tickets resolved; sentiment neutral." },
  { category: "Sponsor", color: "purple", text: "VP of IT attended last QBR." },
  { category: "Risk", color: "red", text: "No open escalations; renewal risk is low." },
];

const recommendedAction = {
  label: "Prepare for Renewal",
  icon: RocketLaunchIcon,
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

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col items-start bg-gray-50 rounded-lg p-4 min-w-[120px] min-h-[64px]">
    <span className="text-xs text-gray-500 font-medium">{label}</span>
    <span className="text-lg font-bold text-gray-900 mt-1">{value}</span>
  </div>
);

const StageTimeline: React.FC<{ stages: any[] }> = ({ stages }) => (
  <div className="flex items-center space-x-4 mt-4">
    {stages.map((stage, idx) => (
      <div key={stage.id} className="flex flex-col items-center">
        <div className="flex items-center">
          {stage.status === "complete" ? (
            <CheckCircleIcon className="h-6 w-6 text-green-500" />
          ) : stage.status === "current" ? (
            <div className="h-6 w-6 rounded-full border-2 border-blue-500 bg-blue-100" />
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
          )}
          {idx < stages.length - 1 && (
            <div
              className={`h-0.5 w-8 ${
                stage.status === "complete" ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          )}
        </div>
        <span
          className={`mt-2 text-sm ${
            stage.status === "complete"
              ? "text-green-600"
              : stage.status === "current"
              ? "text-blue-600 font-medium"
              : "text-gray-500"
          }`}
        >
          {stage.name}
        </span>
      </div>
    ))}
  </div>
);

const categoryColor = {
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  red: "bg-red-100 text-red-700",
};

const checklistItems = [
  "Review account data",
  "Confirm renewal strategy",
  "Confirm contacts",
  "Address risk (if any)",
  "Send renewal notice",
];

const RenewalChecklist: React.FC<{
  step: number;
  answers: string[];
  onEdit: (stepIdx: number) => void;
}> = ({ step, answers, onEdit }) => {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-bold mb-2">Preparation Checklist</h4>
        <ul className="space-y-1">
          {checklistItems.map((item, idx) => (
            <li key={item} className="flex items-center gap-2 group">
              <CheckCircleIcon className={`w-4 h-4 ${answers[idx] !== undefined ? 'text-orange-500' : 'text-gray-300'}`} />
              <span className="flex-1">{item}</span>
              <PencilIcon
                className={`w-4 h-4 ml-1 inline-block align-text-bottom ${answers[idx] !== undefined ? 'text-gray-400 group-hover:text-orange-500 cursor-pointer' : 'text-gray-200 cursor-not-allowed'}`}
                aria-label="Editable"
                aria-disabled={answers[idx] === undefined}
              />
              {answers[idx] !== undefined && (
                <span className="text-xs text-gray-500 ml-2">{answers[idx]}</span>
              )}
              {answers[idx] !== undefined && (
                <button
                  className="ml-2 text-orange-600 text-xs underline opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                  tabIndex={0}
                  aria-label={`Edit answer for ${item}`}
                  onClick={() => onEdit(idx)}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onEdit(idx)}
                >
                  Edit
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const ContextPanel: React.FC<{ currentStep: number }> = ({ currentStep }) => (
  <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col h-full w-full overflow-hidden">
    <div className="mb-4">
      <h3 className="text-xl font-bold mb-2">Key Metrics</h3>
      <div className="grid grid-cols-2 gap-3 overflow-hidden">
        {stats.map((stat) => (
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
const DATA_REVIEW_MSG = 'Please review the data. Initech has a moderate likelihood of renewal, so I recommend a balanced approach. Shall we proceed with a moderate price increase strategy, or would you prefer a more conservative approach?';
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

const customerName = initechCustomer.name;
const chatSteps = initechChatSteps.map(step => ({
  ...step,
  bot: step.message(customerName),
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
  const [showStats, setShowStats] = useState(true);
  const [leftWidthPx, setLeftWidthPx] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [mode, setMode] = useState<'pre-action' | 'chat'>('pre-action');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [progressCollapsed, setProgressCollapsed] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [lastContractCheckAnswer, setLastContractCheckAnswer] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [renewalStep, setRenewalStep] = useState<'strategy' | 'chat'>('strategy');

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

  // Chat logic (stub, can be expanded as needed)
  const handleChatSubmit = (answer: string) => {
    if (waiting || !answer.trim()) return;
    setWaiting(true);
    setTimeout(() => {
      setAnswers(prev => {
        const newAnswers = [...prev];
        newAnswers[step] = answer;
        if (step === initechChatSteps.length - 1 && (/send/i.test(answer))) {
          newAnswers[4] = answer;
          setProgressCollapsed(true);
        }
        return newAnswers;
      });
      setWaiting(false);
      if (step < initechChatSteps.length - 1) {
        setStep(s => s + 1);
        setInput('');
      }
    }, 800);
  };

  const handleEdit = (editStep: number) => {
    setStep(editStep);
    setAnswers(prev => prev.slice(0, editStep));
    setInput('');
    setWaiting(false);
  };

  const handleInputChange = (val: string) => setInput(val);

  const handleMultiStepAdvance = (nextStep: number, updatedAnswers: string[]) => {
    setAnswers(updatedAnswers);
    setStep(nextStep);
    setInput('');
    setWaiting(false);
  };

  const handleProceedToRenewal = () => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[0] = 'Completed in initial review';
      return newAnswers;
    });
    setStep(1);
    setMode('chat');
    setRenewalStep('strategy');
    setMessages([
      { sender: 'bot', text: initechChatSteps[0].message(initechCustomer.name) }
    ]);
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
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Top Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-4 min-h-[180px]">
            <div className="flex flex-col md:flex-row md:justify-between gap-4 flex-1">
              <div className="space-y-2 flex flex-col justify-center h-full">
                <h2 className="text-3xl font-extrabold text-blue-700 tracking-tight">
                  {initechCustomer.name}
                </h2>
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-gray-700 text-base items-center">
                  <span className="font-medium text-gray-500">Success Likelihood:</span>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold ml-2">Moderate</span>
                </div>
              </div>
              <StageTimeline stages={initechCustomer.stages} />
            </div>
            {/* Navigation arrows at bottom left and right */}
            <div className="flex w-full justify-end items-end mt-4">
              <button
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-orange-600 focus:outline-none"
                tabIndex={0}
                aria-label={`Go to next customer: ${nextCustomer}`}
                onClick={() => router.push('/customers?customer=umbrella-corp')}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && router.push('/customers?customer=umbrella-corp')}
              >
                <span>Next: {nextCustomer}</span>
                <ChevronRightIcon className="w-7 h-7 text-gray-300" />
              </button>
            </div>
          </div>
          {/* Main Container: Before chat, show only ContextPanel. After, show resizable split with ProgressStepper and ContextPanel, and ChatPanel on the right. */}
          {mode !== 'chat' ? (
            <div className="flex w-full h-[70vh]" ref={containerRef}>
              <div style={{ width: leftWidthPx, minWidth: 320 }} className="h-full">
                <ContextPanel currentStep={step} />
              </div>
              {/* Draggable Divider for pre-action stage */}
              <div
                className="relative w-6 h-[70vh] flex items-center justify-center bg-transparent cursor-col-resize group pointer-events-auto transition-colors duration-150"
                style={{ marginLeft: '-1px', marginRight: '-1px' }}
                onMouseDown={startDrag}
                tabIndex={0}
                aria-label="Resize panel"
                role="separator"
              >
                <div className="h-6 w-2 relative rounded-full border border-gray-300 bg-gray-100 shadow transition duration-200 group-hover:delay-75 group-hover:border-orange-700 group-hover:bg-orange-700 cursor-col-resize"></div>
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
                className="bg-white rounded-2xl shadow-lg flex h-[70vh]"
                style={{ width: leftWidthPx, minWidth: 320, zIndex: 10 }}
              >
                <div className="flex flex-row h-full w-full">
                  {/* ProgressStepper (collapsible) */}
                  <div className={`border-r border-gray-200 flex flex-col items-start justify-end pl-[5px] ${progressCollapsed ? 'w-12' : 'w-2/5'}`} style={{alignItems: 'flex-start', justifyContent: 'flex-start'}}>
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
                    <ContextPanel currentStep={step} />
                  </div>
                </div>
              </div>
              {/* Draggable Divider for chat mode */}
              <div
                className="relative w-6 h-[70vh] flex items-center justify-center bg-transparent cursor-col-resize group pointer-events-auto transition-colors duration-150"
                style={{ marginLeft: '-1px', marginRight: '-1px' }}
                onMouseDown={startDrag}
                tabIndex={0}
                aria-label="Resize panel"
                role="separator"
              >
                <div className="h-6 w-2 relative rounded-full border border-gray-300 bg-gray-100 shadow transition duration-200 group-hover:delay-75 group-hover:border-orange-700 group-hover:bg-orange-700 cursor-col-resize"></div>
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
                    setPrice={setPrice}
                    lastContractCheckAnswer={lastContractCheckAnswer}
                    setLastContractCheckAnswer={setLastContractCheckAnswer}
                    onMultiStepAdvance={handleMultiStepAdvance}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default InitechPage; 