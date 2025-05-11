"use client";
import React, { useRef, useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import CustomerChatDialog, { ChatMessage } from "./CustomerChatDialog";
import { useRouter } from 'next/navigation';

export type CustomerRenewalLayoutProps = {
  customer: {
    name: string;
    arr: string;
    stages: any[];
  };
  stats: { label: string; value: string }[];
  aiInsights: { category: string; color: 'green' | 'blue' | 'purple' | 'red'; text: string }[];
  miniCharts: { label: string; data: number[] }[];
  contextByStep: any[][];
  additionalSteps?: any[];
  riskLevel: string;
  riskColor: string;
  chatConfig: {
    recommendedAction: { label: string; icon: React.ElementType; onClick: () => void };
    botIntroMessage?: string;
    inputPlaceholder?: string;
  };
  prevCustomer?: string;
  nextCustomer?: string;
  nextCustomerOverride?: string;
};

const MiniSparklineChart: React.FC<{ data: number[] }> = ({ data }) => (
  <svg width="60" height="24" viewBox="0 0 60 24" fill="none" className="overflow-visible">
    <polyline
      fill="none"
      stroke="#3B82F6"
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

const CustomerRenewalLayout: React.FC<CustomerRenewalLayoutProps> = ({
  customer,
  stats,
  aiInsights,
  miniCharts,
  contextByStep,
  additionalSteps = [],
  riskLevel,
  riskColor,
  chatConfig,
  prevCustomer,
  nextCustomer,
  nextCustomerOverride,
}) => {
  const router = useRouter();
  const [leftWidthPx, setLeftWidthPx] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [mode, setMode] = useState<'pre-action' | 'chat'>('pre-action');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [progressCollapsed, setProgressCollapsed] = useState(false);

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

  // ContextPanel
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
        {miniCharts.map((chart, i) => (
          <div className="flex flex-col items-center" key={i}>
            <MiniSparklineChart data={chart.data} />
            <span className="text-xs text-gray-500 mt-1">{chart.label}</span>
          </div>
        ))}
      </div>
      {/* AI Insights */}
      <div className="grid grid-cols-2 gap-3 mb-4 overflow-hidden">
        {aiInsights.map((insight, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-2 h-full flex flex-col items-center">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${categoryColor[insight.color]}`}>{insight.category}</span>
            <span className="text-sm text-gray-700 text-center">{insight.text}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ProgressStepper
  const checklistItems = [
    "Review account data",
    "Confirm renewal strategy",
    "Confirm contacts",
    "Address risk (if any)",
    "Send renewal notice",
  ];
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

  // Unified handler for proceeding to renewal workflow
  const handleProceedToRenewal = () => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[0] = 'Completed in initial review';
      return newAnswers;
    });
    setStep(1);
    setMode('chat');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Top Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-4 min-h-[180px]">
          <div className="flex flex-col md:flex-row md:justify-between gap-4 flex-1">
            <div className="space-y-2 flex flex-col justify-center h-full">
              <div className="flex items-center gap-3">
                <h2 className={`text-3xl font-extrabold text-${riskColor}-700 tracking-tight`}>
                  {customer.name}
                </h2>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-gray-700 text-base items-center">
                <span className="font-medium text-gray-500">Success Likelihood:</span>
                <span className={`inline-block px-2 py-0.5 rounded-full bg-${riskColor}-100 text-${riskColor}-700 text-xs font-semibold ml-2`}>{riskLevel}</span>
              </div>
            </div>
            <StageTimeline stages={[...customer.stages, ...additionalSteps]} />
          </div>
          {/* Navigation arrows at bottom left and right */}
          <div className="flex w-full justify-end items-end mt-4">
            {(nextCustomerOverride || nextCustomer) && (
              <button
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 focus:outline-none"
                tabIndex={0}
                aria-label={`Go to next customer: ${nextCustomerOverride || nextCustomer}`}
                onClick={() => router.push(`/customers/${(nextCustomerOverride || nextCustomer)?.toLowerCase().replace(/ /g, '-')}`)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && router.push(`/customers/${(nextCustomerOverride || nextCustomer)?.toLowerCase().replace(/ /g, '-')}`)}
              >
                <span>Next: {nextCustomerOverride || nextCustomer}</span>
                <ChevronRightIcon className="w-7 h-7 text-gray-300" />
              </button>
            )}
          </div>
        </div>
        {/* Main Container: Before chat, show only ContextPanel. After, show resizable split with ProgressStepper and ContextPanel, and ChatPanel on the right. */}
        {mode !== 'chat' ? (
          <div className="flex w-full h-[calc(100vh-300px)]" ref={containerRef}>
            <div style={{ width: leftWidthPx, minWidth: 320 }} className="h-full">
              <ContextPanel currentStep={step} />
            </div>
            {/* Draggable Divider for pre-action stage */}
            <div
              className="relative w-6 h-full flex items-center justify-center bg-transparent cursor-col-resize group pointer-events-auto transition-colors duration-150"
              style={{ marginLeft: '-1px', marginRight: '-1px' }}
              onMouseDown={startDrag}
              tabIndex={0}
              aria-label="Resize panel"
              role="separator"
            >
              <div className="h-6 w-2 relative rounded-full border border-gray-300 bg-gray-100 shadow transition duration-200 group-hover:delay-75 group-hover:border-blue-700 group-hover:bg-blue-700 cursor-col-resize"></div>
            </div>
            {/* Right panel: Q&A Chat and Recommended Action */}
            <div className="flex-1 h-full flex flex-col justify-center items-center">
              <div className="w-full max-w-md h-full flex flex-col">
                <CustomerChatDialog
                  messages={messages}
                  setMessages={setMessages}
                  recommendedAction={chatConfig.recommendedAction}
                  workflowSteps={[]}
                  onPrepare={handleProceedToRenewal}
                  botIntroMessage={chatConfig.botIntroMessage}
                  inputPlaceholder={chatConfig.inputPlaceholder}
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
                    className="mt-2 mb-4 p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 self-end"
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
              <div className="h-6 w-2 relative rounded-full border border-gray-300 bg-gray-100 shadow transition duration-200 group-hover:delay-75 group-hover:border-blue-700 group-hover:bg-blue-700 cursor-col-resize"></div>
            </div>
            {/* ChatPanel on the right */}
            <div className="flex-1 h-[70vh]">
              <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col h-full w-full">
                {/* You can add a more advanced chat workflow here if needed */}
                <CustomerChatDialog
                  messages={messages}
                  setMessages={setMessages}
                  recommendedAction={chatConfig.recommendedAction}
                  workflowSteps={[]}
                  onPrepare={handleProceedToRenewal}
                  botIntroMessage={chatConfig.botIntroMessage}
                  inputPlaceholder={chatConfig.inputPlaceholder}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerRenewalLayout; 