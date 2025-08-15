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
  const [stepContext, setStepContext] = useState<{ pendingConfirmation?: boolean; pendingValue?: number }>({});
  const [showConfirmButtons, setShowConfirmButtons] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [priceIncrease, setPriceIncrease] = useState<string>('7');
  const [showFormElements, setShowFormElements] = useState(true); // Start with true for first message

  // Reset workflow function
  const resetWorkflow = () => {
    setShowSummary(false);
    setLocalStep(0);
    setHistory([{ role: 'bot', text: steps[0].bot as string }]);
    setPriceIncrease('7');
    setStepContext({});
    setShowConfirmButtons(false);
    setShowFormElements(false);
    onMultiStepAdvance(0, []); // This will reset answers in parent
    setTimeout(() => setShowFormElements(true), 1000);
  };

  const SEVEN_PERCENT_STEP_INDEX = 2; // 0-based index for the 7% confirmation step

  useEffect(() => {
    if (shouldAutoScroll) {
      // Scroll to bottom when history changes or form elements appear
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [history, shouldAutoScroll, showFormElements, isBotTyping]);

  useEffect(() => {
    // Focus input when form elements are shown and there's an input field
    if (showFormElements && !waiting && inputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [localStep, waiting, showFormElements]);

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
  const contractCheckStepIndex = steps.findIndex(s => Array.isArray(s.bot) && s.bot.some(b => typeof b === 'string' && b.includes('price increase limits')));

  const handleChoiceSubmit = (choice: string) => {
    if (!choice.trim() || waiting) return;
    
    // Don't add Review/Proceed choices to history
    const isFinalStepChoice = steps[localStep] && steps[localStep].inputType === 'finalStep';
    if (!isFinalStepChoice) {
      setHistory(prev => {
        if (prev.length > 0 && prev[prev.length - 1].role === 'user' && prev[prev.length - 1].text === choice) {
          return prev;
        }
        return [...prev, { role: 'user', text: choice }];
      });
    }

    // Special logic: If user chooses 'Conservative' on first step, skip contract questions and go to contacts
    if (localStep === 0 && /conservative/i.test(choice)) {
      const botAck = steps[localStep].onUser(choice, { setPrice });
      if (Array.isArray(botAck)) {
        botAck.forEach(item => {
          addBotMessage(item);
        });
      } else {
        addBotMessage(botAck);
      }
      const updatedAnswers = [...answers];
      updatedAnswers[0] = choice;
      updatedAnswers[1] = 'Skipped - Conservative approach';
      updatedAnswers[2] = 'Skipped - Conservative approach';
      setLocalStep(3); // Jump to contacts step
      onMultiStepAdvance(3, updatedAnswers);
      onInputChange('');
      const nextBot = steps[3]?.bot;
      if (nextBot) {
        if (typeof nextBot === 'string') {
          setTimeout(() => addBotMessage(nextBot, true), 700);
        } else if (Array.isArray(nextBot)) {
          let delay = 0;
          nextBot.forEach((msg, index, array) => {
            setTimeout(() => addBotMessage(msg, index === array.length - 1), delay);
            delay += 700;
          });
        }
      }
      return;
    }

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
          setTimeout(() => addBotMessage(nextBot, true), 700); // Show form after message
        } else if (Array.isArray(nextBot)) {
          let delay = 0;
          nextBot.forEach((msg, index, array) => {
            setTimeout(() => addBotMessage(msg, index === array.length - 1), delay); // Show form after last message
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
      const updatedAnswers = [...answers];
      updatedAnswers[localStep] = choice;
      updatedAnswers[localStep + 1] = '3';
      setLocalStep(localStep + 2);
      onMultiStepAdvance(localStep + 2, updatedAnswers);
      onInputChange('');
      const nextBot = steps[localStep + 2].bot;
      if (typeof nextBot === 'string') {
        setTimeout(() => addBotMessage(nextBot, true), 700); // Show form after message
      } else if (Array.isArray(nextBot)) {
        let delay = 0;
        nextBot.forEach((msg, index, array) => {
          setTimeout(() => addBotMessage(msg, index === array.length - 1), delay); // Show form after last message
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
        setTimeout(() => addBotMessage(nextBot, true), 700); // Show form after risk message
      } else if (Array.isArray(nextBot)) {
        let delay = 0;
        nextBot.forEach((msg, index, array) => {
          setTimeout(() => addBotMessage(msg, index === array.length - 1), delay); // Show form after last message
          delay += 700;
        });
      }
      return;
    }

    // Normal step handling with context support
    const context = { ...stepContext, setPrice };
    const botAck = steps[localStep].onUser(choice, context);
    
    // Check if we got a confirmation request (array with confirmation message)
    if (Array.isArray(botAck) && botAck.length === 1 && 
        (botAck[0].includes('Are you certain') || botAck[0].includes('Please confirm'))) {
      // This is a confirmation request
      setStepContext(context);
      setShowConfirmButtons(botAck[0].includes('Are you certain'));
      addBotMessage(botAck[0], true); // Show form after confirmation message
      return;
    }
    
    // Check if this was a re-ask (array but not moving forward)
    if (Array.isArray(botAck)) {
      const isReAsk = (botAck.length === 1 && 
                       (botAck[0].includes("Let's reconsider") || 
                        botAck[0].includes("I didn't understand") ||
                        botAck[0].includes("Please confirm"))) ||
                      (botAck.length === 2 && botAck[1].includes("Please enter 1, 2, or 3"));
      
      if (isReAsk && !botAck[0].includes('Are you certain')) {
        // Reset context and show the message(s)
        setStepContext({});
        setShowConfirmButtons(false);
        botAck.forEach((msg, index, array) => addBotMessage(msg, index === array.length - 1));
        return;
      }
    }
    
    // Handle final step (Review/Proceed)
    if (steps[localStep] && steps[localStep].inputType === 'finalStep') {
      console.log('Final step detected, choice:', choice, 'localStep:', localStep);
      if (choice.toLowerCase().includes('review')) {
        console.log('Setting showSummary to true');
        setShowSummary(true);
        setShowFormElements(true); // Show the summary buttons
        // Don't advance step or add messages, just show the summary
        return;
      }
      if (choice.toLowerCase().includes('proceed')) {
        window.location.href = '/customers/initech';
        return;
      }
    }
    
    // Capture price increase when it's set in step 2
    if (localStep === 2) {
      if (stepContext.pendingValue) {
        // User confirmed a value outside normal range
        setPriceIncrease(String(stepContext.pendingValue));
      } else if (!choice.trim()) {
        // User pressed enter (default to 7%)
        setPriceIncrease('7');
      } else {
        const num = parseFloat(choice);
        if (!isNaN(num)) {
          // User entered a valid number
          setPriceIncrease(String(num));
        }
      }
    }
    
    // Normal response - clear context and proceed
    setStepContext({});
    setShowConfirmButtons(false);
    
    // Check if this is step 1 and user chose "1" (draft amendment)
    // In this case, we move to step 2 which asks for percentage
    const isStep1Option1 = localStep === 1 && choice.trim() === '1';
    
    onSubmit(choice);
    
    if (Array.isArray(botAck)) {
      botAck.forEach((item, index, array) => {
        addBotMessage(item, index === array.length - 1);
      });
    } else if (typeof botAck === 'object' && botAck.type) {
      // Handle special response types (review, proceed)
      if (botAck.type === 'review') {
        setShowSummary(true);
      } else if (botAck.type === 'proceed') {
        window.location.href = botAck.href;
      }
    } else {
      // Special case: if this is step 1 and option 1 was chosen, show form after the response
      const showFormAfterResponse = (localStep === 1 && choice.trim() === '1');
      addBotMessage(botAck, showFormAfterResponse);
    }
    
    // Check if we should show the final step buttons after the risk question
    const shouldShowFinalStep = localStep === 4 && (choice.toLowerCase().includes('yes') || choice.toLowerCase().includes('no'));
    
    // Only advance to next step if this wasn't a re-ask
    setLocalStep(s => s + 1);
    
    // Add the next step's bot message if it exists and isn't empty
    setTimeout(() => {
      if (localStep + 1 < steps.length) {
        const nextBot = steps[localStep + 1].bot;
        // Special cases where we skip adding the bot message:
        // 1. Step 2 has empty bot message after choosing option 1 in step 1
        if (isStep1Option1 && localStep === 1) {
          // Step 2 has no bot message, but we need to ensure form is visible
          // Form was already shown after the bot response in step 1
          return;
        }
        // 2. Final step has empty bot message after risk question
        if (shouldShowFinalStep) {
          // Show form for final step buttons
          setTimeout(() => {
            setShowFormElements(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }, 300);
          return;
        }
        // 3. Don't add empty bot messages
        if (typeof nextBot === 'string' && nextBot === '') {
          // If there's no bot message, ensure form is still shown
          setTimeout(() => {
            setShowFormElements(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }, 300);
          return;
        }
        
        // Add the bot message for the next step
        if (typeof nextBot === 'string') {
          addBotMessage(nextBot, true); // Show form after message
        } else if (Array.isArray(nextBot)) {
          let delay = 0;
          nextBot.forEach((msg, index, array) => {
            setTimeout(() => {
              // Only show form after the last message in the array
              addBotMessage(msg, index === array.length - 1);
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
  const addBotMessage = (msg: string | { type: string; text: string; href: string }, showFormAfter: boolean = false) => {
    setIsBotTyping(true);
    setShowFormElements(false); // Hide form elements while typing
    const typingDuration = Math.max(600, Math.min(2000, (typeof msg === 'string' ? msg : msg.text).length * 30));
    setTimeout(() => {
      const textToAdd = typeof msg === 'string' ? msg : msg.text;
      setHistory(prev => [...prev, { role: 'bot', text: textToAdd }]);
      setIsBotTyping(false);
      // Ensure scroll after message is added
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 50);
      // Show form elements after message is displayed
      if (showFormAfter) {
        setTimeout(() => {
          setShowFormElements(true);
          // Focus input after form becomes visible
          setTimeout(() => {
            inputRef.current?.focus();
            // Scroll again to ensure input is in view
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }, 100);
        }, 300);
      }
    }, typingDuration);
  };

  return (
    <div className="flex flex-col h-full relative">
      <div
        className="flex-1 overflow-y-auto space-y-4 p-2 min-h-0"
        style={{ maxHeight: 'calc(100% - 120px)' }}
        ref={chatContainerRef}
        onScroll={handleChatScroll}
      >
        {/* Show either summary or chat history */}
        {showSummary ? (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Renewal Summary</h2>
            <div className="space-y-4 text-lg">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-semibold text-gray-600">Customer:</span>
                <span className="text-gray-900">Acme Corp</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-semibold text-gray-600">Renewal Date:</span>
                <span className="text-gray-900">March 15, 2024</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-semibold text-gray-600">Current ARR:</span>
                <span className="text-gray-900">$450,000</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-semibold text-gray-600">Proposed Change:</span>
                <span className="text-green-600 font-semibold">+{priceIncrease || '7'}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-semibold text-gray-600">New ARR:</span>
                <span className="text-gray-900 font-bold">${(450000 * (1 + parseFloat(priceIncrease || '7') / 100)).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ) : (
          history.map((msg, i) => {
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
        })
        )}
        {!showSummary && isBotTyping && <TypingIndicator />}
        <div ref={chatEndRef} />
      </div>
      {!waiting && (localStep < steps.length || showSummary) && showFormElements && (
        <form className="mt-4 flex gap-2 pb-2 px-2 flex-shrink-0" onSubmit={handleSubmit}>
          {/* Show summary action buttons when summary is displayed */}
          {showSummary && (
            <div className="flex gap-2 w-full justify-between">
              <button
                type="button"
                className="px-6 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition"
                onClick={resetWorkflow}
              >
                Make Changes
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                onClick={() => {
                  window.location.href = '/customers/initech';
                }}
              >
                Looks Good, Proceed
              </button>
            </div>
          )}
          {/* Show confirmation buttons only when we have a pending confirmation */}
          {!showSummary && showConfirmButtons && stepContext.pendingConfirmation && (
            <div className="flex gap-2 w-full justify-center">
              <button
                type="button"
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                onClick={() => handleChoiceSubmit('Yes')}
              >
                Yes, proceed
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition"
                onClick={() => handleChoiceSubmit('No')}
              >
                No, go back
              </button>
            </div>
          )}
          {/* Show input fields when not in confirmation mode and not showing summary */}
          {!showSummary && !showConfirmButtons && currentStep.inputType === 'numberOrSkip' ? (
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
          {!showSummary && !showConfirmButtons && (currentStep.inputType === 'emailOrSkip' || currentStep.inputType === 'choiceOrInput') ? (
            <input
              className="border rounded px-3 py-2 flex-1"
              placeholder="Reply or press <enter> to skip"
              value={input}
              onChange={e => onInputChange(e.target.value)}
              autoComplete="off"
              ref={inputRef}
            />
          ) : null}
          {!showSummary && !showConfirmButtons && (currentStep.inputType === 'choice' || currentStep.inputType === 'finalStep') && currentStep.choices && (
            <div className={
              currentStep.choices.length === 2
                ? 'flex w-full justify-between items-center'
                : 'flex gap-2'
            }>
              {currentStep.choices.length === 2
                ? (currentStep.inputType === 'finalStep'
                    ? currentStep.choices.map((choice) => (
                        <button
                          key={choice}
                          type="button"
                          className={
                            (choice.toLowerCase().includes('review')
                              ? 'bg-gray-500 text-white hover:bg-gray-600'
                              : 'bg-green-600 text-white hover:bg-green-700')
                            + ' min-w-[140px] px-4 py-2 rounded-lg transition font-semibold'
                          }
                          onClick={() => handleChoiceSubmit(choice)}
                          tabIndex={0}
                          aria-label={`Select ${choice}`}
                        >
                          {choice}
                        </button>
                      ))
                    : [...currentStep.choices].reverse().map((choice) => (
                        <button
                          key={choice}
                          type="button"
                          className={
                            ((localStep === 0
                              ? (choice.toLowerCase().includes('aggressive')
                                  ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                                  : 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200')
                              : localStep === 4 // Risk question step
                              ? (choice.toLowerCase().includes('yes')
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-gray-400 text-white hover:bg-gray-500')
                              : 'bg-blue-600 text-white hover:bg-blue-700'))
                            + ' min-w-[140px] px-4 py-2 rounded-lg transition font-semibold'
                          }
                          onClick={() => handleChoiceSubmit(choice)}
                          tabIndex={0}
                          aria-label={`Select ${choice}`}
                        >
                          {choice.replace(/\(recommended\)/i, '(recommended)')}
                        </button>
                      )))
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
          {!showSummary && !showConfirmButtons && currentStep.inputType !== 'choice' && currentStep.inputType !== 'finalStep' && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition" type="submit"
              onClick={() => {
                console.log('DEBUG: Submit button clicked', { inputValue: input });
              }}
            >Submit</button>
          )}
        </form>
      )}
      {/* Start Over link at the bottom - absolutely positioned */}
      {!showSummary && (
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <button
            type="button"
            onClick={resetWorkflow}
            className="text-sm text-gray-500 hover:text-gray-700 underline bg-white px-2 py-1 rounded"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
};

export default ConversationalChat; 