import { useState, useEffect } from 'react';

interface TypingAnimationProps {
  text: string;
  messageId: number;
  speed?: number;
  onTypingComplete?: (messageId: number) => void;
  onTypingStart?: (messageId: number) => void;
}

/**
 * TypingAnimation Component
 *
 * Displays text with a typewriter effect, character by character.
 * Notifies parent when typing starts and completes via callbacks.
 */
export const TypingAnimation = ({
  text,
  messageId,
  speed = 20,
  onTypingComplete,
  onTypingStart
}: TypingAnimationProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else {
      // Notify parent when typing is complete
      if (onTypingComplete) {
        onTypingComplete(messageId);
      }
    }
  }, [currentIndex, text, speed, messageId, onTypingComplete]);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    // Notify parent when typing starts
    if (onTypingStart) {
      onTypingStart(messageId);
    }
  }, [text, messageId, onTypingStart]);

  return <span>{displayedText}</span>;
};
