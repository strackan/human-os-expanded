/**
 * Chat Message Component
 *
 * Single message bubble for chat interfaces.
 */

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { TEST_IDS, testId } from '@/lib/test-utils';
import type { Message } from '@/lib/types';

interface ChatMessageProps {
  message: Message;
  index: number;
  /** Use markdown rendering for assistant messages */
  useMarkdown?: boolean;
  /** Custom class names for user/assistant bubbles */
  userClassName?: string;
  assistantClassName?: string;
}

export function ChatMessage({
  message,
  index,
  useMarkdown = true,
  userClassName,
  assistantClassName,
}: ChatMessageProps) {
  const isUser = message.role === 'user';

  const defaultUserClass = 'bg-gray-100 text-gray-900';
  const defaultAssistantClass = 'bg-gh-dark-700 text-white';

  const bubbleClass = isUser
    ? userClassName || defaultUserClass
    : assistantClassName || defaultAssistantClass;

  return (
    <motion.div
      {...testId(TEST_IDS.chat.message(index))}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${bubbleClass}`}>
        <div
          {...testId(TEST_IDS.chat.messageContent(index))}
          className={`whitespace-pre-wrap ${isUser ? 'text-gray-900' : 'text-white'}`}
        >
          {useMarkdown && !isUser ? (
            <div className="prose prose-invert prose-sm max-w-none break-words">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ) : (
            message.content
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default ChatMessage;
