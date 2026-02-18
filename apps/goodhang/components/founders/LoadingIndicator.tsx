'use client';

interface LoadingIndicatorProps {
  className?: string;
}

export function LoadingIndicator({ className = 'bg-[var(--gh-dark-700)]' }: LoadingIndicatorProps) {
  return (
    <div className="flex justify-start chat-message-enter">
      <div className={`${className} rounded-2xl px-4 py-3`}>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '0.1s' }}
          />
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '0.2s' }}
          />
        </div>
      </div>
    </div>
  );
}

export default LoadingIndicator;
