import { useState, useEffect } from 'react';

interface EmailContent {
  to: string;
  subject: string;
  body: string;
}

interface UseTypingAnimationProps {
  content: EmailContent;
  speed?: number;
  onComplete?: () => void;
}

export const useTypingAnimation = ({
  content,
  speed = 8,
  onComplete
}: UseTypingAnimationProps) => {
  const [currentField, setCurrentField] = useState<'to' | 'subject' | 'body' | 'complete'>('to');
  const [toText, setToText] = useState('');
  const [subjectText, setSubjectText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fields = ['to', 'subject', 'body'] as const;
    const fieldValues = {
      to: content.to,
      subject: content.subject,
      body: content.body
    };

    if (currentField !== 'complete') {
      const currentFieldValue = fieldValues[currentField];

      if (currentIndex < currentFieldValue.length) {
        const timeout = setTimeout(() => {
          const newChar = currentFieldValue[currentIndex];

          switch (currentField) {
            case 'to':
              setToText(prev => prev + newChar);
              break;
            case 'subject':
              setSubjectText(prev => prev + newChar);
              break;
            case 'body':
              setBodyText(prev => prev + newChar);
              break;
          }

          setCurrentIndex(prev => prev + 1);
        }, speed);

        return () => clearTimeout(timeout);
      } else {
        // Move to next field
        const currentFieldIndex = fields.indexOf(currentField);
        if (currentFieldIndex < fields.length - 1) {
          setCurrentField(fields[currentFieldIndex + 1]);
          setCurrentIndex(0);
        } else {
          setCurrentField('complete');
          onComplete?.();
        }
      }
    }
  }, [currentField, currentIndex, content, speed, onComplete]);

  // Reset animation when content changes
  useEffect(() => {
    setToText('');
    setSubjectText('');
    setBodyText('');
    setCurrentField('to');
    setCurrentIndex(0);
  }, [content.to, content.subject, content.body]);

  return {
    to: toText,
    subject: subjectText,
    body: bodyText,
    isComplete: currentField === 'complete'
  };
};