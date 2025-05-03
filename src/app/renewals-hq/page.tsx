"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  HandRaisedIcon,
} from "@heroicons/react/24/outline";

// Mock data for Acme Corp
const acmeCustomer = {
  name: "Acme Corporation",
  arr: "$450,000",
  stages: [
    { id: 1, name: "Planning", status: "current" },
    { id: 2, name: "Outreach", status: "upcoming" },
    { id: 3, name: "Negotiation", status: "upcoming" },
    { id: 4, name: "Approval", status: "upcoming" },
    { id: 5, name: "Closed", status: "upcoming" },
  ],
};

const prevCustomer = "Globex Inc.";
const nextCustomer = "Initech";

const stats = [
  { label: "Current ARR", value: "$450,000" },
  { label: "Renewal Date", value: "Aug 15, 2024" },
  { label: "Usage", value: "92%" },
  { label: "2Y Avg PI%", value: "6.2%" },
  { label: "Support Tickets (30d)", value: "3" },
  { label: "Last Engagement", value: "4 days ago" },
];

const aiInsights: { category: string; color: 'green' | 'blue' | 'purple' | 'red'; text: string }[] = [
  { category: "Profit", color: "green", text: "Customer is likely to accept a 5-7% price increase." },
  { category: "Engagement", color: "blue", text: "Recent support tickets resolved quickly; sentiment positive." },
  { category: "Sponsor", color: "purple", text: "Executive sponsor attended last QBR." },
  { category: "Risk", color: "red", text: "No open escalations; renewal risk is low." },
];

const recommendedAction = {
  label: "Prepare for Renewal",
  icon: HandRaisedIcon,
};

const metricCaptions = [
  "ARR",
  "RENEWAL",
  "USAGE",
  "PI%",
  "TICKETS",
  "ENGAGE",
];

const miniCharts = [
  { label: "ARR Trend", data: [10, 12, 14, 13, 15, 16, 18] },
  { label: "Usage", data: [80, 85, 90, 92, 91, 93, 92] },
  { label: "PI%", data: [5.2, 5.8, 6.0, 6.1, 6.2, 6.2, 6.2] },
];

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

// Conversational chat steps
interface ChatStep {
  bot: string;
  inputType: 'numberOrSkip' | 'emailOrSkip' | 'choice';
  choices?: string[];
  onUser: (answer: string) => string;
}

const chatSteps: ChatStep[] = [
  {
    bot: "Let's confirm the account details and renewal outlook. Acme Corp has 92% usage, $450k ARR, and a high likelihood of renewal. Do you agree with this assessment and want to proceed with an aggressive price increase strategy, or would you prefer a more conservative approach?",
    inputType: 'choice',
    choices: ["Aggressive (recommended)", "Conservative"],
    onUser: (answer) => {
      if (/conservative/i.test(answer)) {
        return "We'll proceed with a more conservative renewal strategy.";
      }
      return "Great, we'll proceed with the recommended aggressive strategy.";
    },
  },
  {
    bot: "Based on your strategy, I recommend a 7% price increase for this renewal. Would you like to proceed with 7%, or enter a different percentage?",
    inputType: 'numberOrSkip',
    onUser: (answer) => {
      if (/skip|pass/i.test(answer)) return "No problem, we'll revisit the price increase later.";
      const num = parseFloat(answer);
      if (!isNaN(num)) {
        if (num >= 10) {
          return `You entered ${num}%. This amount needs manager approval. We'll let you know when we hear back (or you can edit the number).`;
        }
        if (num === 7) {
          return `Great, 7% is a strong, data-backed choice for this renewal.`;
        }
        return `Noted, we'll propose a ${num}% increase for this renewal.`;
      }
      return "Please enter a number, or type 'Skip'.";
    },
  },
  {
    bot: "Who should receive the renewal notice? The primary contact is Sarah Johnson (sarah@acme.com), and the executive sponsor is Michael Chen (michael@acme.com). You can enter one or both emails, or type 'Skip'.",
    inputType: 'emailOrSkip',
    onUser: (answer) => {
      if (/skip|pass/i.test(answer)) return "No problem, we'll confirm recipients later.";
      return `Got it. The renewal notice will go to: ${answer}`;
    },
  },
  {
    bot: "There's one risk: Feature X usage declined 15% last quarter. Would you like to schedule a usage review meeting before sending the renewal notice, or proceed directly?",
    inputType: 'choice',
    choices: ["Schedule meeting", "Proceed"],
    onUser: (answer) => {
      if (/schedule/i.test(answer)) return "I'll help you schedule a usage review meeting before renewal outreach.";
      return "Understood. We'll proceed directly with the renewal notice.";
    },
  },
  {
    bot: "All set! You're ready to send the official renewal notice. Would you like to send it now?",
    inputType: 'choice',
    choices: ["Send Now", "Not Yet"],
    onUser: (answer) => {
      if (/send/i.test(answer)) return "Renewal notice sent! 🎉";
      return "No problem, you can send it whenever you're ready.";
    },
  },
];

const checklistItems = [
  { label: "Review account data" },
  { label: "Confirm renewal strategy" },
  { label: "Confirm contacts" },
  { label: "Address risk (if any)" },
  { label: "Send renewal notice" },
];

const RenewalChecklist: React.FC<{
  step: number;
  answers: string[];
  onEdit: (stepIdx: number) => void;
}> = ({ step, answers, onEdit }) => (
  <div className="space-y-6">
    <div>
      <h4 className="text-lg font-bold mb-2">Preparation Checklist</h4>
      <ul className="space-y-1">
        {checklistItems.map((item, idx) => (
          <li key={item.label} className="flex items-center gap-2 group">
            <CheckCircleIcon className={`w-4 h-4 ${answers[idx] !== undefined ? 'text-green-500' : 'text-gray-300'}`} />
            <span className="flex-1">{item.label}</span>
            {answers[idx] !== undefined && (
              <span className="text-xs text-gray-500 ml-2">{answers[idx]}</span>
            )}
            {answers[idx] !== undefined && (
              <button
                className="ml-2 text-blue-600 text-xs underline opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                tabIndex={0}
                aria-label={`Edit answer for ${item.label}`}
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

const ConversationalChat: React.FC<{
  step: number;
  answers: string[];
  waiting: boolean;
  onSubmit: (answer: string) => void;
  onInputChange: (val: string) => void;
  input: string;
}> = ({ step, answers, waiting, onSubmit, onInputChange, input }) => {
  const [history, setHistory] = useState<{ role: 'bot' | 'user'; text: string }[]>([
    { role: 'bot', text: chatSteps[0].bot },
  ]);
  const [localStep, setLocalStep] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Only auto-scroll if user is at (or near) the bottom
  useEffect(() => {
    if (shouldAutoScroll) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, shouldAutoScroll]);

  // Track user scroll position
  const handleChatScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;
    const threshold = 40; // px from bottom
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    setShouldAutoScroll(atBottom);
  };

  // Sync localStep with parent step (for edit)
  useEffect(() => {
    if (step < localStep) {
      // If editing, trim history to the correct point
      setHistory(prev => {
        // Find the index of the last bot message for the current step
        let idx = prev.findIndex(
          (msg, i) => msg.role === 'bot' && msg.text === chatSteps[step].bot && i > 0
        );
        if (idx === -1) idx = prev.length - 1;
        return prev.slice(0, idx + 1);
      });
      setLocalStep(step);
    }
  }, [step]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || waiting) return;
    handleChoiceSubmit(input);
  };

  const handleChoiceSubmit = (choice: string) => {
    if (!choice.trim() || waiting) return;
    setHistory(prev => [...prev, { role: 'user', text: choice }]);
    onSubmit(choice); // update parent state
    const botAck = chatSteps[localStep].onUser(choice);
    setHistory(prev => [...prev, { role: 'user', text: choice }, { role: 'bot', text: botAck }]);
    setLocalStep(s => s + 1);
    setTimeout(() => {
      if (localStep + 1 < chatSteps.length) {
        setHistory(prev => [...prev, { role: 'bot', text: chatSteps[localStep + 1].bot }]);
      }
    }, 900);
  };

  const currentStep = chatSteps[localStep];

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex-1 overflow-y-auto space-y-4 p-2"
        ref={chatContainerRef}
        onScroll={handleChatScroll}
      >
        {history.map((msg, i) => (
          <div key={i} className={msg.role === 'bot' ? 'text-left' : 'text-right'}>
            <div className={msg.role === 'bot' ? 'inline-block bg-gray-100 text-gray-800 rounded-lg px-4 py-2' : 'inline-block bg-blue-600 text-white rounded-lg px-4 py-2'}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      {!waiting && localStep < chatSteps.length && (
        <form className="mt-4 flex gap-2" onSubmit={handleSubmit}>
          {currentStep.inputType === 'numberOrSkip' && (
            <input
              className="border rounded px-3 py-2 flex-1"
              placeholder="Enter % (e.g. 7) or 'Skip'"
              value={input}
              onChange={e => onInputChange(e.target.value)}
              type="text"
              title="Enter a number, 'Skip', or 'Pass'"
              autoComplete="off"
            />
          )}
          {currentStep.inputType === 'emailOrSkip' && (
            <input
              className="border rounded px-3 py-2 flex-1"
              placeholder="Enter email(s) or 'Skip'"
              value={input}
              onChange={e => onInputChange(e.target.value)}
              autoComplete="off"
            />
          )}
          {currentStep.inputType === 'choice' && currentStep.choices && (
            <div className={
              currentStep.choices.length === 2
                ? 'flex w-full justify-between items-center'
                : 'flex gap-2'
            }>
              {currentStep.choices.length === 2
                ? [...currentStep.choices].reverse().map((choice, idx) => (
                    <button
                      key={choice}
                      type="button"
                      className={
                        (localStep === 0
                          ? (choice.toLowerCase().includes('aggressive')
                              ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200')
                          : 'bg-blue-600 text-white hover:bg-blue-700')
                        + ' min-w-[140px] px-4 py-2 rounded-lg transition font-semibold'
                      }
                      onClick={() => handleChoiceSubmit(choice)}
                      tabIndex={0}
                      aria-label={`Select ${choice}`}
                    >
                      {choice.replace(/\(recommended\)/i, '(recommended)')}
                    </button>
                  ))
                : currentStep.choices.map(choice => (
                    <button
                      key={choice}
                      type="button"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                      onClick={() => handleChoiceSubmit(choice)}
                      tabIndex={0}
                      aria-label={`Select ${choice}`}
                    >
                      {choice}
                    </button>
                  ))}
            </div>
          )}
          {currentStep.inputType !== 'choice' && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition" type="submit">Submit</button>
          )}
        </form>
      )}
    </div>
  );
};

const AccountSnapshot = () => (
  <div className="space-y-6">
    <div>
      <h4 className="text-lg font-bold mb-2">Account Snapshot</h4>
      <div className="text-sm text-gray-700">
        <div>Company: <span className="font-semibold">Acme Corporation</span></div>
        <div>Current ARR: <span className="font-semibold">$450,000</span></div>
        <div>Renewal Date: <span className="font-semibold">Aug 15, 2024</span></div>
        <div>Days remaining: <span className="font-semibold">103</span></div>
      </div>
    </div>
    <div>
      <h4 className="text-lg font-bold mb-2">Critical Indicators</h4>
      <div className="text-sm text-gray-700">
        <div>Usage: <span className="font-semibold">92%</span></div>
        <div>Support tickets: <span className="font-semibold">3 (30d)</span></div>
        <div>Recommended price increase: <span className="font-semibold">5-7%</span></div>
      </div>
    </div>
    <div>
      <h4 className="text-lg font-bold mb-2">Preparation Checklist</h4>
      <ul className="space-y-1">
        <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-500" /> Review account data</li>
        <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-500" /> Confirm renewal strategy</li>
        <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-gray-300" /> Confirm contacts</li>
        <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-gray-300" /> Address risk (if any)</li>
        <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-gray-300" /> Send renewal notice</li>
      </ul>
    </div>
  </div>
);

const RenewalsHQ2Page = () => {
  const [showStats, setShowStats] = useState(true);
  const [leftWidthPx, setLeftWidthPx] = useState(400); // px
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'pre-action' | 'chat'>('pre-action');
  // Chat state
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setLeftWidthPx(rect.width / 2);
    }
  }, []);

  // Drag handlers
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
    newWidth = Math.max(250, Math.min(newWidth, rect.width - 250));
    setLeftWidthPx(newWidth);
  };
  const stopDrag = () => {
    isDragging.current = false;
    document.body.style.cursor = "default";
    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", stopDrag);
  };

  // Handle chat submit
  const handleChatSubmit = (answer: string) => {
    if (waiting || !answer.trim()) return;
    setWaiting(true);
    // Simulate bot response delay
    setTimeout(() => {
      setAnswers(prev => {
        const newAnswers = [...prev];
        newAnswers[step] = answer;
        return newAnswers;
      });
      setWaiting(false);
      if (step < chatSteps.length - 1) {
        setStep(s => s + 1);
        setInput('');
      }
    }, 800);
  };

  // Handle edit
  const handleEdit = (editStep: number) => {
    setStep(editStep);
    setAnswers(prev => prev.slice(0, editStep));
    setInput('');
    setWaiting(false);
  };

  // Handle input change
  const handleInputChange = (val: string) => setInput(val);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Top Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-4 min-h-[180px]">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 flex-1">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-blue-700 tracking-tight">
                {acmeCustomer.name}
              </h2>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-gray-700 text-base items-center">
                <span className="font-medium text-gray-500">Success Likelihood:</span>
                <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold ml-2">High</span>
              </div>
            </div>
            <StageTimeline stages={acmeCustomer.stages} />
          </div>
          {/* Navigation arrows at bottom left and right */}
          <div className="flex w-full justify-between items-end mt-4">
            <button
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 focus:outline-none"
              tabIndex={0}
              aria-label={`Go to previous customer: ${prevCustomer}`}
              onClick={() => {/* handle prev customer navigation */}}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && /* handle prev customer navigation */ null}
            >
              <ChevronLeftIcon className="w-7 h-7 text-gray-300" />
              <span>Prev: {prevCustomer}</span>
            </button>
            <button
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 focus:outline-none"
              tabIndex={0}
              aria-label={`Go to next customer: ${nextCustomer}`}
              onClick={() => {/* handle next customer navigation */}}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && /* handle next customer navigation */ null}
            >
              <span>Next: {nextCustomer}</span>
              <ChevronRightIcon className="w-7 h-7 text-gray-300" />
            </button>
          </div>
        </div>
        {/* Main Container with draggable divider */}
        <div className="relative flex w-full items-stretch h-[65vh]" ref={containerRef}>
          {/* Left: Tail of the Tape or Info Panel */}
          <div
            className={`bg-white rounded-l-2xl shadow-lg p-8 flex flex-col h-full relative transition-all duration-300 ${showStats ? '' : 'min-h-[64px] max-h-[80px] justify-center items-center overflow-hidden'}`}
            style={{ width: leftWidthPx, minWidth: 180, height: '100%', overflowY: 'auto' }}
          >
            {/* Always show header and chevron */}
            <div className="flex items-center justify-between w-full mb-4">
              <h3 className="text-2xl font-bold">Tail of the Tape</h3>
              <button
                className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                aria-label={showStats ? 'Collapse stats' : 'Expand stats'}
                onClick={() => setShowStats((s) => !s)}
                tabIndex={0}
              >
                {showStats ? (
                  <ChevronUpIcon className="h-6 w-6 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-6 w-6 text-gray-400" />
                )}
              </button>
            </div>
            {/* Only render content if expanded */}
            {showStats && (
              mode === 'pre-action'
                ? <>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {stats.map((stat) => (
                        <div className="bg-gray-50 rounded-lg p-4 min-h-[64px]" key={stat.label}>
                          <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
                          <span className="text-2xl font-bold text-gray-900 mt-1 block">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-4 mb-6">
                      {miniCharts.map((chart, i) => (
                        <div className="flex flex-col items-center" key={i}>
                          <MiniSparklineChart data={chart.data} />
                          <span className="text-xs text-gray-500 mt-1">{chart.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {aiInsights.map((insight, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-4 h-full flex flex-col items-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${categoryColor[insight.color]}`}>{insight.category}</span>
                          <span className="text-sm text-gray-700 text-center">{insight.text}</span>
                        </div>
                      ))}
                    </div>
                  </>
                : <RenewalChecklist step={step} answers={answers} onEdit={handleEdit} />
            )}
          </div>
          {/* Draggable Divider */}
          <div
            className="absolute top-0 z-10 h-full w-px cursor-col-resize bg-gray-200 hover:bg-gray-400 transition-colors duration-150 flex-shrink-0"
            style={{ left: leftWidthPx - 0.5 }}
            onMouseDown={startDrag}
            tabIndex={0}
            aria-label="Resize panel"
            role="separator"
          />
          {/* Right: Conversational Chat or Button */}
          <div
            className="bg-green-50 rounded-r-2xl shadow-lg p-8 flex flex-col justify-between flex-1 h-full overflow-y-auto"
            style={{ minWidth: 180 }}
          >
            {mode === 'chat' ? (
              <ConversationalChat
                step={step}
                answers={answers}
                waiting={waiting}
                onSubmit={handleChatSubmit}
                onInputChange={handleInputChange}
                input={input}
              />
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center">
                <button
                  className="px-8 py-4 bg-green-600 text-white rounded-xl text-lg font-bold flex items-center gap-2 hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow"
                  tabIndex={0}
                  aria-label="Prepare for Renewal"
                  onClick={() => setMode('chat')}
                >
                  <HandRaisedIcon className="h-6 w-6" />
                  Prepare for Renewal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenewalsHQ2Page; 