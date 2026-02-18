'use client';

import { forwardRef } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  showMic?: boolean;
  isListening?: boolean;
  isSupported?: boolean;
  onMicToggle?: () => void;
  sendButtonColor?: 'blue' | 'purple' | 'orange';
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  function ChatInput(
    {
      value,
      onChange,
      onSend,
      placeholder = 'Type your message...',
      disabled = false,
      showMic = false,
      isListening = false,
      isSupported = true,
      onMicToggle,
      sendButtonColor = 'blue',
    },
    ref
  ) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    };

    const buttonColors = {
      blue: 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600',
      purple: 'bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600',
      orange: 'bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600',
    };

    return (
      <div className="p-4 border-t border-[var(--gh-dark-700)]">
        <div className="flex gap-3">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={disabled}
            className="flex-1 bg-[var(--gh-dark-700)] text-white rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />

          {showMic && onMicToggle && (
            <button
              type="button"
              onClick={onMicToggle}
              disabled={disabled}
              className={`px-3 py-3 rounded-xl transition-colors disabled:opacity-50 ${
                isListening
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : isSupported
                  ? 'bg-[var(--gh-dark-700)] text-gray-400 hover:text-white'
                  : 'bg-[var(--gh-dark-700)] text-gray-600 cursor-not-allowed'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={onSend}
            disabled={!value.trim() || disabled}
            className={`px-4 py-3 ${buttonColors[sendButtonColor]} disabled:cursor-not-allowed text-white rounded-xl transition-colors`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }
);

export default ChatInput;
