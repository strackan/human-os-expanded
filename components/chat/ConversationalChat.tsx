import React, { useState, useRef, useEffect } from "react";
import { ChatStep } from "./chatWorkflow";

interface ConversationalChatProps {
  steps: ChatStep[];
  step: number;
  answers: string[];
  waiting: boolean;
  onSubmit: (answer: string) => void;
  onInputChange: (val: string) => void;
  input: string;
  setPrice?: (price: number) => void;
  lastContractCheckAnswer?: string | null;
  setLastContractCheckAnswer?: (val: string) => void;
  onMultiStepAdvance: (nextStep: number, updatedAnswers: string[]) => void;
}

const ConversationalChat: React.FC<ConversationalChatProps> = ({
  steps,
  step,
  answers,
  waiting,
  onSubmit,
  onInputChange,
  input,
  setPrice,
  lastContractCheckAnswer,
  setLastContractCheckAnswer,
  onMultiStepAdvance,
}) => {
  const [history, setHistory] = useState<{ role: 'bot' | 'user'; text: string }[]>([
    { role: 'bot', text: typeof steps[0].bot === 'string' ? steps[0].bot : steps[0].bot[0] },
  ]);
  const [localStep, setLocalStep] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shouldAutoScroll) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, shouldAutoScroll]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [localStep, waiting]);

  const handleChatScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;
    const threshold = 40;
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    setShouldAutoScroll(atBottom);
  };

  useEffect(() => {
    if (step < localStep) {
      setHistory(prev => {
        let idx = prev.findIndex(
          (msg, i) => msg.role === 'bot' && (msg.text === (typeof steps[step].bot === 'string' ? steps[step].bot : steps[step].bot[0])) && i > 0
        );
        if (idx === -1) idx = prev.length - 1;
        return prev.slice(0, idx + 1);
      });
      setLocalStep(step);
    }
  }, [step]);

  const stakeholderStepIndex = steps.findIndex(s => s.inputType === 'emailOrSkip');

  const handleChoiceSubmit = (choice: string) => {
    if (!choice.trim() || waiting) return;
    setHistory(prev => {
      if (prev.length > 0 && prev[prev.length - 1].role === 'user' && prev[prev.length - 1].text === choice) {
        return prev;
      }
      return [...prev, { role: 'user', text: choice }];
    });

    // Example: custom logic for contract check step (if needed, can be passed as prop or context)
    if (typeof setPrice === 'function' && localStep === 1 && choice.trim() === '2') {
      const botAck = steps[localStep].onUser(choice, { setPrice });
      setHistory(prev => [...prev, { role: 'bot', text: botAck }]);
      if (setLastContractCheckAnswer) setLastContractCheckAnswer(choice.trim());
      const updatedAnswers = [...answers];
      updatedAnswers[localStep] = choice;
      updatedAnswers[localStep + 1] = '3';
      setLocalStep(localStep + 2);
      onMultiStepAdvance(localStep + 2, updatedAnswers);
      onInputChange('');
      const nextBot = steps[localStep + 2].bot;
      if (typeof nextBot === 'string') {
        setTimeout(() => setHistory(prev => [...prev, { role: 'bot', text: nextBot }]), 700);
      } else if (Array.isArray(nextBot)) {
        let delay = 0;
        nextBot.forEach((msg) => {
          setTimeout(() => setHistory(prev => [...prev, { role: 'bot', text: msg }]), delay);
          delay += 700;
        });
      }
      return;
    }

    // Stakeholder step: after valid input, reply 'Got it.' and advance
    if (localStep === stakeholderStepIndex) {
      setHistory(prev => [...prev, { role: 'bot', text: 'Got it.' }]);
      const updatedAnswers = [...answers];
      updatedAnswers[localStep] = choice;
      setLocalStep(localStep + 1);
      onMultiStepAdvance(localStep + 1, updatedAnswers);
      onInputChange('');
      const nextBot = steps[localStep + 1].bot;
      if (typeof nextBot === 'string') {
        setTimeout(() => setHistory(prev => [...prev, { role: 'bot', text: nextBot }]), 700);
      } else if (Array.isArray(nextBot)) {
        let delay = 0;
        nextBot.forEach((msg) => {
          setTimeout(() => setHistory(prev => [...prev, { role: 'bot', text: msg }]), delay);
          delay += 700;
        });
      }
      return;
    }

    // Normal step handling
    onSubmit(choice);
    const botAck = steps[localStep].onUser(choice, { setPrice });
    setHistory(prev => [...prev, { role: 'bot', text: botAck }]);
    if (typeof setLastContractCheckAnswer === 'function' && localStep === 1) {
      setLastContractCheckAnswer(choice.trim());
    }
    setLocalStep(s => s + 1);
    setTimeout(() => {
      if (localStep + 1 < steps.length) {
        const nextBot = steps[localStep + 1].bot;
        if (typeof nextBot === 'string') {
          setHistory(prev => [...prev, { role: 'bot', text: nextBot }]);
        } else if (Array.isArray(nextBot)) {
          let delay = 0;
          nextBot.forEach((msg, idx) => {
            setTimeout(() => {
              setHistory(prev => [...prev, { role: 'bot', text: msg }]);
            }, delay);
            delay += 700;
          });
        }
      }
    }, 900);
  };

  const currentStep = steps[localStep];
  const isStakeholderStep = localStep === stakeholderStepIndex;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (waiting) return;
    if (isStakeholderStep) {
      if (!input.trim() || /skip|pass/i.test(input)) {
        handleChoiceSubmit("Skip");
        return;
      }
      const emailRegex = /[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/;
      if (!emailRegex.test(input)) {
        onInputChange("");
        return;
      }
      handleChoiceSubmit(input);
      return;
    }
    const currentStepObj = steps[localStep];
    const allowsSkip = ["numberOrSkip", "emailOrSkip", "choiceOrInput"].includes(currentStepObj.inputType);
    if (!input.trim() && allowsSkip) {
      handleChoiceSubmit("Skip");
      return;
    }
    if (!input.trim()) return;
    handleChoiceSubmit(input);
  };

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
      {!waiting && localStep < steps.length && (
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

export default ConversationalChat; 