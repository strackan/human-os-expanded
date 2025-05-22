"use client";
import React, { useRef, useState } from "react";
import { HandRaisedIcon, ExclamationTriangleIcon, RocketLaunchIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";

export type ChatMessage = { sender: 'user' | 'bot'; text: string };

export type CustomerChatDialogProps = {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  recommendedAction: {
    label: string;
    icon: string; // Now a string name
  };
  workflowSteps?: string[];
  onPrepare: () => void;
  botIntroMessage?: string;
  inputPlaceholder?: string;
};

const iconMap = {
  HandRaisedIcon,
  ExclamationTriangleIcon,
  RocketLaunchIcon,
  PaperAirplaneIcon,
};

const CustomerChatDialog: React.FC<CustomerChatDialogProps> = ({
  messages,
  setMessages,
  recommendedAction,
  workflowSteps,
  onPrepare,
  botIntroMessage = "Please review the information to the left and feel free to ask any questions about this account.",
  inputPlaceholder = "Type your question...",
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const userMsg = input.trim();
    if (!userMsg) return;
    setMessages((msgs) => [...msgs, { sender: 'user', text: userMsg }]);
    setTimeout(() => {
      setMessages((msgs) => [
        ...msgs,
        { sender: 'bot', text: "Thank you for your question! (This is a demo response. In production, this would be answered by AI or support.)" },
      ]);
    }, 600);
    setInput('');
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  const IconComponent = iconMap[recommendedAction.icon as keyof typeof iconMap] || HandRaisedIcon;

  return (
    <div className="relative flex flex-col h-full w-full">
      {/* Recommended Action Card */}
      <div className="mb-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4 shadow-sm justify-center">
          <div className="flex flex-col items-center text-center">
            <span className="text-sm font-semibold text-green-800 mb-2">Recommended Action:</span>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 inline-flex items-center gap-2"
              onClick={onPrepare}
              tabIndex={0}
              aria-label={recommendedAction.label}
            >
              <IconComponent className="h-5 w-5 text-white" aria-hidden="true" />
              {recommendedAction.label}
            </button>
          </div>
        </div>
      </div>

      {/* Instruction */}
      <div className="mb-1">
        <p className="text-sm text-gray-700 font-medium">
          {botIntroMessage}
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

      {/* Input - sticky at bottom */}
      <div className="sticky bottom-0 left-0 w-full bg-gray-50 z-30 flex items-center gap-2 p-2 mb-2 shadow-[0_-2px_8px_-2px_rgba(0,0,0,0.04)] border-t border-gray-200">
        <input
          ref={inputRef}
          type="text"
          className="flex-1 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={inputPlaceholder}
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

export default CustomerChatDialog; 