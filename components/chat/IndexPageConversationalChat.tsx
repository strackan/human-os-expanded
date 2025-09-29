import React, { useState, useRef, useEffect } from "react";
import { ChatStep } from "../../src/types/chat";

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

const TypingIndicator = () => (
  <div className="text-left">
    <span className="inline-block bg-gray-100 text-gray-800 rounded-lg px-4 py-2 font-mono">
      <span className="animate-pulse">▍</span>
    </span>
  </div>
);

const ConversationalChat: React.FC<ConversationalChatProps> = ({
  steps,
  step,
  answers,
  waiting,
  onSubmit,
  onInputChange,
  input,
  setPrice,
  setLastContractCheckAnswer,
  onMultiStepAdvance,
}) => {
  const [history, setHistory] = useState<{ role: 'bot' | 'user'; text: string | { type: string; text: string; href: string } }[]>([
    steps && steps.length > 0 && steps[0] && steps[0].bot
      ? { role: 'bot', text: typeof steps[0].bot === 'string' ? steps[0].bot : steps[0].bot[0] }
      : { role: 'bot', text: "Welcome! (No chat steps configured.)" }
  ]);
  const [localStep, setLocalStep] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isBotTyping, setIsBotTyping] = useState(false);

  const SEVEN_PERCENT_STEP_INDEX = 2; // 0-based index for the 7% confirmation step

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
    if (step !== localStep) {
      setHistory(prev => {
        let idx = prev.findIndex(
          (msg, i) => msg.role === 'bot' && (msg.text === (typeof steps[step].bot === 'string' ? steps[step].bot : steps[step].bot[0])) && i > 0
        );
        if (idx === -1) idx = prev.length - 1;
        return prev.slice(0, idx + 1);
      });
      setLocalStep(step);
    }
  }, [step, localStep, steps]);

  const stakeholderStepIndex = steps.findIndex(s => s.inputType === 'emailOrSkip');
  const contractCheckStepIndex = steps.findIndex(s => Array.isArray(s.bot) && s.bot.some((b: string) => typeof b === 'string' && b.includes('price increase limits')));

  const handleChoiceSubmit = (choice: string) => {
    if (!choice.trim() || waiting) return;
    setHistory(prev => {
      if (prev.length > 0 && prev[prev.length - 1].role === 'user' && prev[prev.length - 1].text === choice) {
        return prev;
      }
      return [...prev, { role: 'user', text: choice }];
    });

    // Special logic: If user chooses '3' on contract check step, skip the number input step
    if (localStep === contractCheckStepIndex && choice.trim() === '3') {
      const botAck = steps[localStep].onUser(choice, { setPrice });
      if (Array.isArray(botAck)) {
        botAck.forEach(item => {
          addBotMessage(item);
        });
      } else {
        addBotMessage(botAck);
      }
      const updatedAnswers = [...answers];
      updatedAnswers[localStep] = choice;
      updatedAnswers[localStep + 1] = 'Skipped';
      setLocalStep(localStep + 2);
      onMultiStepAdvance(localStep + 2, updatedAnswers);
      onInputChange('');
      const nextBot = steps[localStep + 2]?.bot;
      if (nextBot) {
        if (typeof nextBot === 'string') {
          setTimeout(() => addBotMessage(nextBot), 700);
        } else if (Array.isArray(nextBot)) {
          let delay = 0;
          nextBot.forEach((msg) => {
            setTimeout(() => addBotMessage(msg), delay);
            delay += 700;
          });
        }
      }
      return;
    }

    // Example: custom logic for contract check step (if needed, can be passed as prop or context)
    if (typeof setPrice === 'function' && localStep === 1 && choice.trim() === '2') {
      const botAck = steps[localStep].onUser(choice, { setPrice });
      if (Array.isArray(botAck)) {
        botAck.forEach(item => {
          addBotMessage(item);
        });
      } else {
        addBotMessage(botAck);
      }
      if (setLastContractCheckAnswer) setLastContractCheckAnswer(choice.trim());
      const updatedAnswers = [...answers];
      updatedAnswers[localStep] = choice;
      updatedAnswers[localStep + 1] = '3';
      setLocalStep(localStep + 2);
      onMultiStepAdvance(localStep + 2, updatedAnswers);
      onInputChange('');
      const nextBot = steps[localStep + 2].bot;
      if (typeof nextBot === 'string') {
        setTimeout(() => addBotMessage(nextBot), 700);
      } else if (Array.isArray(nextBot)) {
        let delay = 0;
        nextBot.forEach((msg) => {
          setTimeout(() => addBotMessage(msg), delay);
          delay += 700;
        });
      }
      return;
    }

    // Stakeholder step: after valid input, reply 'Got it.' and advance
    if (localStep === stakeholderStepIndex) {
      addBotMessage('Got it.');
      const updatedAnswers = [...answers];
      updatedAnswers[localStep] = choice;
      setLocalStep(localStep + 1);
      onMultiStepAdvance(localStep + 1, updatedAnswers);
      onInputChange('');
      const nextBot = steps[localStep + 1].bot;
      if (typeof nextBot === 'string') {
        setTimeout(() => addBotMessage(nextBot), 700);
      } else if (Array.isArray(nextBot)) {
        let delay = 0;
        nextBot.forEach((msg) => {
          setTimeout(() => addBotMessage(msg), delay);
          delay += 700;
        });
      }
      return;
    }

    // Normal step handling
    onSubmit(choice);
    const botAck = steps[localStep].onUser(choice, { setPrice });
    if (Array.isArray(botAck)) {
      botAck.forEach(item => {
        addBotMessage(item);
      });
    } else {
      addBotMessage(botAck);
    }
    if (typeof setLastContractCheckAnswer === 'function' && localStep === 1) {
      setLastContractCheckAnswer(choice.trim());
    }
    setLocalStep(s => s + 1);
    setTimeout(() => {
      if (localStep + 1 < steps.length) {
        const nextBot = steps[localStep + 1].bot;
        if (typeof nextBot === 'string') {
          addBotMessage(nextBot);
        } else if (Array.isArray(nextBot)) {
          let delay = 0;
          nextBot.forEach((msg) => {
            setTimeout(() => {
              addBotMessage(msg);
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
    // Debug log for form submission
    console.log('DEBUG: handleSubmit called', {
      eventType: e.type,
      inputValue: input,
      isStakeholderStep,
      localStep,
      currentStep,
    });
    if (waiting) return;
    if (isStakeholderStep) {
      handleChoiceSubmit(input);
      return;
    }
    const currentStepObj = steps[localStep];
    const allowsSkip = ["numberOrSkip", "emailOrSkip", "choiceOrInput"].includes(currentStepObj.inputType);
    
    // Handle 7% confirmation step
    if (localStep === SEVEN_PERCENT_STEP_INDEX) {
      // If input is empty, treat it as accepting 7%
      if (!input.trim()) {
        handleChoiceSubmit('7');
        return;
      }
      handleChoiceSubmit(input);
      return;
    }

    // Handle other steps
    if (!input.trim() && allowsSkip) {
      handleChoiceSubmit("Skip");
      return;
    }
    if (!input.trim()) return;
    handleChoiceSubmit(input);
  };

  // Helper to add a bot message with typing effect
  const addBotMessage = (msg: string | { type: string; text: string; href: string }) => {
    setIsBotTyping(true);
    setTimeout(() => {
      const textToAdd = typeof msg === 'string' ? msg : msg.text;
      setHistory(prev => [...prev, { role: 'bot', text: textToAdd }]);
      setIsBotTyping(false);
    }, Math.max(600, Math.min(2000, (typeof msg === 'string' ? msg : msg.text).length * 30)));
  };

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex-1 overflow-y-auto space-y-4 p-2"
        ref={chatContainerRef}
        onScroll={handleChatScroll}
      >
        {history.map((msg, i) => {
          if (!msg.text) return null;
          if (typeof msg.text === 'string') {
            return (
              <div key={i} className={msg.role === 'bot' ? 'text-left' : 'text-right'}>
                <div className={msg.role === 'bot' ? 'inline-block bg-gray-100 text-gray-800 rounded-lg px-4 py-2' : 'inline-block bg-blue-600 text-white rounded-lg px-4 py-2'}>
                  {msg.text}
                </div>
              </div>
            );
          }
          // If it's a link object
          if (typeof msg.text === 'object' && 'type' in msg.text && msg.text.type === 'link' && 'href' in msg.text && 'text' in msg.text) {
            return (
              <div key={i} className="text-center mt-4">
                <a
                  href={msg.text.href}
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {msg.text.text}
                </a>
              </div>
            );
          }
          return null;
        })}
        {isBotTyping && <TypingIndicator />}
        <div ref={chatEndRef} />
      </div>
      {!waiting && localStep < steps.length && (
        <form className="mt-4 flex gap-2" onSubmit={handleSubmit}>
          {currentStep.inputType === 'numberOrSkip' ? (
            <input
              className="border rounded px-3 py-2 flex-1"
              placeholder={
                localStep === SEVEN_PERCENT_STEP_INDEX
                  ? "Press <enter> to accept 7% or enter a different percentage"
                  : "Enter a number, or 'Skip'"
              }
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
                ? [...currentStep.choices].reverse().map((choice) => (
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
                : currentStep.choices.map((choice: string) => (
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
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition" type="submit"
              onClick={() => {
                console.log('DEBUG: Submit button clicked', { inputValue: input });
              }}
            >Submit</button>
          )}
        </form>
      )}
    </div>
  );
};

export default ConversationalChat; 