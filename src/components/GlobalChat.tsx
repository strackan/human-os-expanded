'use client';

import { useChat } from '@/context/ChatContext';
import { SparklesIcon } from '@heroicons/react/24/outline';
import AIChatBox from './AIChatBox';

export default function GlobalChat() {
  const { isChatOpen, toggleChat, closeChat, selectedContract } = useChat();

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 bg-blue-500 text-white rounded-full p-3 shadow-lg hover:bg-blue-600 transition-colors z-50"
        aria-label="Toggle AI Chat"
      >
        <SparklesIcon className="h-6 w-6" />
      </button>

      {/* Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-4 w-96 h-[600px] z-50">
          <div className="w-full h-full bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col overflow-hidden">
            <AIChatBox
              isOpen={true}
              onClose={closeChat}
              selectedContract={selectedContract}
            />
          </div>
        </div>
      )}
    </>
  );
} 