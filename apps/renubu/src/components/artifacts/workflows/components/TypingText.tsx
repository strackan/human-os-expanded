import { useState, useEffect } from 'react';

interface TypingTextProps {
  text: string;
  speed?: number;
}

/**
 * TypingText Component
 *
 * Displays text with a typewriter effect for artifact content.
 * Used in email drafts and other artifacts that need typing animation.
 */
export const TypingText = ({ text, speed = 10 }: TypingTextProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return <span>{displayedText}</span>;
};
