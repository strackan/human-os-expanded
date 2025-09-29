'use client';

import { useChat } from '@/context/ChatContext';
import { SparklesIcon } from '@heroicons/react/24/outline';
import AIChatBox from './AIChatBox';

export default function GlobalChat() {
  const { isChatOpen, toggleChat, closeChat, selectedContract } = useChat();

  return (
    <>

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