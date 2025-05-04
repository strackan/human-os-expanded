"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  HandRaisedIcon,
  PencilIcon,
  Bars3Icon,
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
  bot: string | string[];
  inputType: 'numberOrSkip' | 'emailOrSkip' | 'choice' | 'choiceOrInput' | 'progress';
  choices?: string[];
  onUser: (answer: string, ctx?: { setPrice?: (price: number) => void }) => string;
}

const chatSteps: ChatStep[] = [
  {
    bot: "Let's confirm the account details and renewal outlook. Acme Corp has 92% usage, $450k ARR, and a high likelihood of renewal. Do you agree with this assessment and want to proceed with an aggressive price increase strategy, or would you prefer a more conservative approach?",
    inputType: 'choice',
    choices: ["Aggressive (recommended)", "Conservative"],
    onUser: (answer, ctx) => {
      if (/conservative/i.test(answer)) {
        return "We'll proceed with a more conservative renewal strategy.";
      }
      return "Great, we'll proceed with the recommended aggressive strategy.";
    },
  },
  // Contract check step (now step 2)
  {
    bot: [
      "Checking contract for price increase limits...",
      "The contract has language that does not allow price increases above 3%. Would you like to: 1) Draft an amendment to increase the price limit, 2) Revert to a 3% price increase, or 3) Come back to this later?"
    ],
    inputType: 'numberOrSkip',
    onUser: (answer, ctx) => {
      const trimmed = answer.trim();
      if (trimmed === '1') {
        return "I'll plan to include an amendment in our ongoing strategy. I recommend a 7% price increase as our target. Would you like to proceed with 7%, or enter a different percentage?";
      }
      if (trimmed === '2') {
        if (ctx && typeof ctx.setPrice === 'function') ctx.setPrice(3);
        return "Got it. We'll go with a 3% increase for this renewal. I'll make a note to revisit the amendment discussion as a future action.";
      }
      if (trimmed === '3') {
        return "No problem, we can revisit this later.";
      }
      return "Please enter 1, 2, or 3.";
    },
  },
  // Price input step (only if user chose 1 above)
  {
    bot: "", // Leave bot message empty, since the previous step's reply already contains the question
    inputType: 'numberOrSkip',
    onUser: (answer, ctx) => {
      if (/skip|pass/i.test(answer)) return "No problem, we'll revisit the price increase later.";
      const num = parseFloat(answer);
      if (!isNaN(num)) {
        if (ctx && typeof ctx.setPrice === 'function') ctx.setPrice(num);
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
    bot: "Who should be involved in the renewal process? The primary contact is Sarah Johnson, and the executive sponsor is Michael Chen. Should I include anyone else in these upcoming discussions?",
    inputType: 'emailOrSkip',
    onUser: (answer, ctx) => {
      if (/skip|pass/i.test(answer)) return "No problem, we'll confirm recipients later.";
      if (answer.trim() === '1') return "Got it. The renewal notice will go to: Sarah Johnson (sarah@acme.com)";
      if (answer.trim() === '2') return "Got it. The renewal notice will go to: Michael Chen (michael@acme.com)";
      if (answer.trim() === '3') return "Got it. The renewal notice will go to: Sarah Johnson (sarah@acme.com), Michael Chen (michael@acme.com)";
      return `Got it. The renewal notice will go to: ${answer}`;
    },
  },
  {
    bot: "There's one risk: Feature X usage declined 15% last quarter. Enter 1 to schedule a usage review meeting before sending the renewal notice, 2 to proceed directly, or type your answer:",
    inputType: 'numberOrSkip',
    onUser: (answer, ctx) => {
      if (answer.trim() === '1') return "I'll help you schedule a usage review meeting before renewal outreach.";
      if (answer.trim() === '2') return "Understood. We'll proceed directly with the renewal notice.";
      if (/schedule/i.test(answer)) return "I'll help you schedule a usage review meeting before renewal outreach.";
      if (/proceed/i.test(answer)) return "Understood. We'll proceed directly with the renewal notice.";
      return "Please enter 1, 2, or type your answer.";
    },
  },
  {
    bot: "All set! You're ready to send the official renewal notice. Would you like to send it now?",
    inputType: 'choice',
    choices: ["Send Now", "Not Yet"],
    onUser: (answer, ctx) => {
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
}> = ({ step, answers, onEdit }) => {
  // Debug log for answers and step
  console.log('DEBUG: RenewalChecklist render - step:', step, 'answers:', answers);
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-bold mb-2">Preparation Checklist</h4>
        <ul className="space-y-1">
          {checklistItems.map((item, idx) => {
            console.log('DEBUG: Checklist item', idx, 'label:', item.label, 'answers[idx]:', answers[idx]);
            return (
              <li key={item.label} className="flex items-center gap-2 group">
                <CheckCircleIcon className={`w-4 h-4 ${answers[idx] !== undefined ? 'text-green-500' : 'text-gray-300'}`} />
                <span className="flex-1">{item.label}</span>
                <PencilIcon
                  className={`w-4 h-4 ml-1 inline-block align-text-bottom ${answers[idx] !== undefined ? 'text-gray-400 group-hover:text-blue-500 cursor-pointer' : 'text-gray-200 cursor-not-allowed'}`}
                  aria-label="Editable"
                  aria-disabled={answers[idx] === undefined}
                />
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
            );
          })}
        </ul>
      </div>
    </div>
  );
};

const ConversationalChat: React.FC<{
  step: number;
  answers: string[];
  waiting: boolean;
  onSubmit: (answer: string) => void;
  onInputChange: (val: string) => void;
  input: string;
  setPrice: (price: number) => void;
  lastContractCheckAnswer: string | null;
  setLastContractCheckAnswer: (val: string) => void;
}> = ({ step, answers, waiting, onSubmit, onInputChange, input, setPrice, lastContractCheckAnswer, setLastContractCheckAnswer }) => {
  const [history, setHistory] = useState<{ role: 'bot' | 'user'; text: string }[]>([
    { role: 'bot', text: typeof chatSteps[0].bot === 'string' ? chatSteps[0].bot : chatSteps[0].bot[0] },
  ]);
  const [localStep, setLocalStep] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debug: log localStep and currentStep.inputType whenever localStep changes
  useEffect(() => {
    const currentStep = chatSteps[localStep];
    console.log('DEBUG: localStep', localStep, 'currentStep.inputType', currentStep.inputType);
  }, [localStep]);

  // Only auto-scroll if user is at (or near) the bottom
  useEffect(() => {
    if (shouldAutoScroll) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, shouldAutoScroll]);

  // Focus input when step changes or input is rendered
  useEffect(() => {
    inputRef.current?.focus();
  }, [localStep, waiting]);

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
          (msg, i) => msg.role === 'bot' && (msg.text === (typeof chatSteps[step].bot === 'string' ? chatSteps[step].bot : chatSteps[step].bot[0])) && i > 0
        );
        if (idx === -1) idx = prev.length - 1;
        return prev.slice(0, idx + 1);
      });
      setLocalStep(step);
    }
  }, [step]);

  // Debug: log step and chatSteps
  useEffect(() => {
    console.log('DEBUG: ConversationalChat localStep', localStep, chatSteps[localStep]);
    console.log('DEBUG: ConversationalChat history', history);
  }, [localStep, history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (waiting) return;
    // If input is blank and current step allows skip, treat as 'Skip'
    const currentStepObj = chatSteps[localStep];
    const allowsSkip = ["numberOrSkip", "emailOrSkip", "choiceOrInput"].includes(currentStepObj.inputType);
    if (!input.trim() && allowsSkip) {
      handleChoiceSubmit("Skip");
      return;
    }
    if (!input.trim()) return;
    handleChoiceSubmit(input);
  };

  const handleChoiceSubmit = (choice: string) => {
    if (!choice.trim() || waiting) return;
    // Only add the user answer once
    setHistory(prev => {
      // Prevent duplicate user answers for the same step
      if (prev.length > 0 && prev[prev.length - 1].role === 'user' && prev[prev.length - 1].text === choice) {
        return prev;
      }
      return [...prev, { role: 'user', text: choice }];
    });
    onSubmit(choice); // update parent state
    const botAck = chatSteps[localStep].onUser(choice, { setPrice });
    setHistory(prev => [...prev, { role: 'bot', text: botAck }]);

    // If this is the contract check step, store the answer
    if (localStep === 1) {
      setLastContractCheckAnswer(choice.trim());
    }

    // Custom step advancement logic
    if (localStep === 1 && choice.trim() === '2') {
      // If user chose to revert to 3%, skip price input step and its input prompt
      // Simulate price input step with '3'
      const priceStep = chatSteps[localStep + 1];
      const priceBotAck = priceStep.onUser('3', { setPrice });
      setHistory(prev => [...prev, { role: 'bot', text: priceBotAck }]);
      // Add the next bot message (stakeholder confirmation) immediately
      const nextBot = chatSteps[localStep + 2].bot;
      if (typeof nextBot === 'string') {
        setHistory(prev => [...prev, { role: 'bot', text: nextBot }]);
      } else if (Array.isArray(nextBot)) {
        nextBot.forEach(msg => {
          setHistory(prev => [...prev, { role: 'bot', text: msg }]);
        });
      }
      setLocalStep(3); // jump directly to stakeholder step
      onInputChange('');
      return;
    }
    setLocalStep(s => s + 1);
    setTimeout(() => {
      if (localStep + 1 < chatSteps.length) {
        const nextBot = chatSteps[localStep + 1].bot;
        if (typeof nextBot === 'string') {
          setHistory(prev => [...prev, { role: 'bot', text: nextBot }]);
        } else if (Array.isArray(nextBot)) {
          // Add each string in the array as a separate bot message, with a small delay between them
          let delay = 0;
          nextBot.forEach((msg, idx) => {
            setTimeout(() => {
              setHistory(prev => [...prev, { role: 'bot', text: msg }]);
            }, delay);
            delay += 700; // 700ms between each message
          });
        }
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
        {history.map((msg, i) =>
          msg.text && (
            <div key={i} className={msg.role === 'bot' ? 'text-left' : 'text-right'}>
              <div className={msg.role === 'bot' ? 'inline-block bg-gray-100 text-gray-800 rounded-lg px-4 py-2' : 'inline-block bg-blue-600 text-white rounded-lg px-4 py-2'}>
                {msg.text}
              </div>
            </div>
          )
        )}
        <div ref={chatEndRef} />
      </div>
      {!waiting && localStep < chatSteps.length && (
        <form className="mt-4 flex gap-2" onSubmit={handleSubmit}>
          {currentStep.inputType === 'numberOrSkip' ? (
            <input
              className="border rounded px-3 py-2 flex-1"
              placeholder="Enter a number, or 'Skip'"
              value={input}
              onChange={e => onInputChange(e.target.value)}
              type="text"
              title="Enter a number, 'Skip', or 'Pass'"
              autoComplete="off"
              ref={inputRef}
            />
          ) : null}
          {(currentStep.inputType === 'emailOrSkip' || currentStep.inputType === 'choiceOrInput') ? (
            <input
              className="border rounded px-3 py-2 flex-1"
              placeholder="Reply or press <enter> to skip"
              value={input}
              onChange={e => onInputChange(e.target.value)}
              autoComplete="off"
              ref={inputRef}
            />
          ) : null}
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
                        ((localStep === 0
                          ? (choice.toLowerCase().includes('aggressive')
                              ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200')
                          : 'bg-blue-600 text-white hover:bg-blue-700'))
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

const contextByStep = [
  // Step 0: Confirm account data
  [
    { label: 'Usage', value: stats.find(s => s.label === 'Usage')?.value },
    { label: 'Current ARR', value: stats.find(s => s.label === 'Current ARR')?.value },
    { label: 'Renewal Date', value: stats.find(s => s.label === 'Renewal Date')?.value },
  ],
  // Step 1: Price strategy
  [
    { label: 'Usage', value: stats.find(s => s.label === 'Usage')?.value },
    { label: '2Y Avg PI%', value: stats.find(s => s.label === '2Y Avg PI%')?.value },
    { label: 'Support Tickets (30d)', value: stats.find(s => s.label === 'Support Tickets (30d)')?.value },
  ],
  // Step 2: Contacts
  [
    { label: 'Primary Contact', value: 'Sarah Johnson (sarah@acme.com)' },
    { label: 'Exec Sponsor', value: 'Michael Chen (michael@acme.com)' },
  ],
  // Step 3: Risk/feature usage
  [
    { label: 'Feature X Usage', value: 'Down 15% last quarter' },
    { label: 'Renewal Risk', value: 'Low' },
  ],
  // Step 4: Summary
  [
    { label: 'Ready to send renewal notice', value: '' },
  ],
];

// 2. Stub ProgressStepper
const ProgressStepper: React.FC<{ currentStep: number }> = ({ currentStep }) => (
  <div className="flex flex-col items-center h-full w-full py-6">
    <ol className="space-y-4 w-full">
      {checklistItems.map((item, idx) => (
        <li key={item.label} className="flex items-center gap-3">
          <div className={`rounded-full w-7 h-7 flex items-center justify-center border-2 ${
            idx < currentStep
              ? 'bg-green-100 border-green-500 text-green-700'
              : idx === currentStep
              ? 'bg-blue-100 border-blue-500 text-blue-700 font-bold'
              : 'bg-gray-100 border-gray-300 text-gray-400'
          }`}>
            {idx < currentStep ? <CheckCircleIcon className="w-5 h-5" /> : idx + 1}
              </div>
          <span className={`text-sm ${idx === currentStep ? 'font-bold text-blue-700' : idx < currentStep ? 'text-gray-500 line-through' : 'text-gray-400'}`}>{item.label}</span>
        </li>
      ))}
    </ol>
                </div>
);

// 3. Stub ChatPanel (reuse existing chat logic for now)
const ChatPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-green-50 rounded-2xl shadow-lg p-6 flex flex-col h-full w-full">
    {children}
                </div>
);

const RenewalsHQ2Page = () => {
  const [showStats, setShowStats] = useState(true);
  const [leftWidthPx, setLeftWidthPx] = useState(600); // px, default wider for 2-panel
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [mode, setMode] = useState<'pre-action' | 'chat'>('pre-action');
  // Chat state
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [progressCollapsed, setProgressCollapsed] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [lastContractCheckAnswer, setLastContractCheckAnswer] = useState<string | null>(null);

  // Debug log for mode state
  useEffect(() => {
    console.log('DEBUG: mode changed:', mode);
  }, [mode]);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setLeftWidthPx(rect.width / 2);
    }
  }, []);

  // Drag handlers for vertical divider
  const startDrag = (e: React.MouseEvent) => {
    console.log('DEBUG: startDrag', e.clientX);
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
    console.log('DEBUG: handleDrag', e.clientX, rect.left, newWidth);
    setLeftWidthPx(newWidth);
  };
  const stopDrag = () => {
    console.log('DEBUG: stopDrag');
    isDragging.current = false;
    document.body.style.cursor = "default";
    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", stopDrag);
  };

  // Handle chat submit
  const handleChatSubmit = (answer: string) => {
    if (waiting || !answer.trim()) return;
    setWaiting(true);
    setTimeout(() => {
      setAnswers(prev => {
        const newAnswers = [...prev];
        newAnswers[step] = answer;
        // If this is the last step (send notice) and user sends, check off the fifth box and collapse ProgressStepper
        if (
          step === chatSteps.length - 1 &&
          (/send/i.test(answer))
        ) {
          newAnswers[4] = answer;
          setProgressCollapsed(true);
        }
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
          <div className="flex flex-col md:flex-row md:justify-between gap-4 flex-1">
            <div className="space-y-2 flex flex-col justify-center h-full">
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
          <div className="flex w-full justify-end items-end mt-4">
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
              onMouseDown={e => {
                console.log('DEBUG: Divider (pre-action) onMouseDown', e.clientX);
                startDrag(e);
              }}
              tabIndex={0}
              aria-label="Resize panel"
              role="separator"
            >
              <div className="h-6 w-2 relative rounded-full border border-gray-300 bg-gray-100 shadow transition duration-200 group-hover:delay-75 group-hover:border-blue-700 group-hover:bg-blue-700 cursor-col-resize"></div>
            </div>
            <div className="flex-1 h-full flex flex-col justify-center items-center">
              <button
                className="px-8 py-4 bg-green-600 text-white rounded-xl text-lg font-bold flex items-center gap-2 hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow"
                tabIndex={0}
                aria-label="Prepare for Renewal"
                onClick={() => {
                  console.log('DEBUG: Prepare for Renewal button clicked');
                  setMode('chat');
                }}
              >
                <HandRaisedIcon className="h-6 w-6" />
                Prepare for Renewal
              </button>
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
              onMouseDown={e => {
                console.log('DEBUG: Divider (chat) onMouseDown', e.clientX);
                startDrag(e);
              }}
              tabIndex={0}
              aria-label="Resize panel"
              role="separator"
            >
              <div className="h-6 w-2 relative rounded-full border border-gray-300 bg-gray-100 shadow transition duration-200 group-hover:delay-75 group-hover:border-blue-700 group-hover:bg-blue-700 cursor-col-resize"></div>
            </div>
            {/* ChatPanel on the right */}
            <div className="flex-1 h-[70vh]">
              <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col h-full w-full">
                <ConversationalChat
                  step={step}
                  answers={answers}
                  waiting={waiting}
                  onSubmit={handleChatSubmit}
                  onInputChange={handleInputChange}
                  input={input}
                  setPrice={setPrice}
                  lastContractCheckAnswer={lastContractCheckAnswer}
                  setLastContractCheckAnswer={setLastContractCheckAnswer}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Minimal SplitPaneTest for isolated testing
export const SplitPaneTest = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [leftWidthPx, setLeftWidthPx] = React.useState(400);
  const isDragging = React.useRef(false);

  const startDrag = (e: React.MouseEvent) => {
    console.log('SplitPaneTest startDrag', e.clientX);
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", stopDrag);
  };
  const handleDrag = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let newWidth = e.clientX - rect.left;
    newWidth = Math.max(200, Math.min(newWidth, rect.width - 200));
    console.log('SplitPaneTest handleDrag', e.clientX, rect.left, newWidth);
    setLeftWidthPx(newWidth);
  };
  const stopDrag = () => {
    console.log('SplitPaneTest stopDrag');
    isDragging.current = false;
    document.body.style.cursor = "default";
    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", stopDrag);
  };

  return (
    <div ref={containerRef} className="flex w-full h-96 border mt-10">
      <div style={{ width: leftWidthPx, minWidth: 200 }} className="bg-gray-100 h-full">Left</div>
      <div
        className="w-2 bg-gray-400 cursor-col-resize"
        style={{ zIndex: 10 }}
        onMouseDown={startDrag}
      />
      <div className="flex-1 bg-gray-200 h-full">Right</div>
    </div>
  );
};

export default RenewalsHQ2Page; 