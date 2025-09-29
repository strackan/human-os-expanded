import React, { useState, useEffect, useRef } from 'react';
import { Mail, Save, Send, Bold, Italic, Underline, CheckCircle, X } from 'lucide-react';
import { useTypingAnimation } from '../../../../hooks/useTypingAnimation';

interface EmailContent {
  to: string;
  subject: string;
  body: string;
}

interface EmailComposerProps {
  content: EmailContent;
  editable?: boolean;
  typingSpeed?: number;
  onContentChange?: (content: EmailContent) => void;
}

// Email validation utility
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Toast notification component
interface ToastProps {
  message: string;
  type: 'success' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right-full duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
        type === 'success' 
          ? 'bg-green-50 border-green-200 text-green-800' 
          : 'bg-blue-50 border-blue-200 text-blue-800'
      }`}>
        <CheckCircle size={20} className="flex-shrink-0" />
        <span className="font-medium text-sm">{message}</span>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-black/10 rounded-full transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// Rich text editor toolbar component
const RichTextToolbar = ({ 
  onFormat, 
  isVisible 
}: { 
  onFormat: (format: string) => void; 
  isVisible: boolean;
}) => {
  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
      <button
        onClick={() => onFormat('bold')}
        className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
        title="Bold"
        type="button"
      >
        <Bold size={14} />
      </button>
      <button
        onClick={() => onFormat('italic')}
        className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
        title="Italic"
        type="button"
      >
        <Italic size={14} />
      </button>
      <button
        onClick={() => onFormat('underline')}
        className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
        title="Underline"
        type="button"
      >
        <Underline size={14} />
      </button>
    </div>
  );
};

// Typing animation component for email content
const TypingText = ({ 
  text, 
  speed = 10, 
  onComplete 
}: { 
  text: string; 
  speed?: number; 
  onComplete?: () => void;
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return <span>{displayedText}</span>;
};


const EmailComposer: React.FC<EmailComposerProps> = ({
  content,
  editable = true,
  typingSpeed = 8,
  onContentChange
}) => {
  const [emailContent, setEmailContent] = useState<EmailContent>(content);
  const [emailSent, setEmailSent] = useState(false);
  const [showTypingAnimation, setShowTypingAnimation] = useState(true);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'info'>('success');
  const [showToast, setShowToast] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const typingAnimation = useTypingAnimation({
    content,
    speed: typingSpeed,
    onComplete: () => {
      setShowTypingAnimation(false);
      setIsTypingComplete(true);
    }
  });

  // Use typing animation content if animation is active, otherwise use current content
  const displayContent = showTypingAnimation ? {
    to: typingAnimation.to,
    subject: typingAnimation.subject,
    body: typingAnimation.body
  } : emailContent;

  const handleEmailFieldChange = (field: keyof EmailContent, value: string) => {
    if (!editable) return;

    // Validate email field
    if (field === 'to') {
      setIsValidatingEmail(true);

      // Clear previous error
      setEmailError('');

      // Validate if not empty
      if (value.trim() && !isValidEmail(value)) {
        setEmailError('Please enter a valid email address');
      }

      setIsValidatingEmail(false);
    }

    const newContent = { ...emailContent, [field]: value };
    setEmailContent(newContent);
    onContentChange?.(newContent);
  };

  const handleEmailBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!editable) return;
    handleEmailFieldChange('body', e.target.value);
  };

  const handleSaveDraft = () => {
    console.log('Saving draft:', emailContent);
    setToastMessage('Draft saved successfully!');
    setToastType('info');
    setShowToast(true);
    // Implement save functionality
  };

  const handleSendEmail = () => {
    // Validate email before sending
    if (!isValidEmail(emailContent.to)) {
      setEmailError('Please enter a valid email address before sending');
      setToastMessage('Please fix email validation errors before sending');
      setToastType('info');
      setShowToast(true);
      return;
    }

    // Validate required fields
    if (!emailContent.subject.trim()) {
      setToastMessage('Please enter a subject before sending');
      setToastType('info');
      setShowToast(true);
      return;
    }

    if (!emailContent.body.trim()) {
      setToastMessage('Please enter a message before sending');
      setToastType('info');
      setShowToast(true);
      return;
    }

    setEmailSent(true);
    console.log('Sending email:', emailContent);
    setToastMessage('Email sent successfully!');
    setToastType('success');
    setShowToast(true);
    // Implement send functionality
  };

  const handleCloseToast = () => {
    setShowToast(false);
  };

  const handleRichTextFormat = (format: string) => {
    if (!bodyRef.current || !editable) return;
    
    const textarea = bodyRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = emailContent.body.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      default:
        formattedText = selectedText;
    }
    
    const newBody = emailContent.body.substring(0, start) + formattedText + emailContent.body.substring(end);
    handleEmailFieldChange('body', newBody);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const handleBodyFocus = () => {
    if (editable && isTypingComplete) {
      setShowToolbar(true);
    }
  };

  const handleBodyBlur = () => {
    // Delay hiding toolbar to allow clicking on toolbar buttons
    setTimeout(() => setShowToolbar(false), 200);
  };

  return (
    <>
      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={handleCloseToast}
      />
      
      <div className={`bg-white border border-gray-300 rounded-lg shadow-lg transition-all duration-300 ${emailSent ? 'opacity-30' : 'opacity-100'}`}>
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-300 px-4 py-3 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Mail size={18} className="text-gray-600" />
          <span className="font-medium text-gray-900">Compose Email</span>
        </div>
      </div>
      
      {/* Rich Text Toolbar */}
      <RichTextToolbar onFormat={handleRichTextFormat} isVisible={showToolbar} />
      
      <div className="p-4 space-y-3">
        {/* To Field */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-12">To:</label>
            {editable && isTypingComplete ? (
              <input
                type="email"
                value={emailContent.to}
                onChange={(e) => handleEmailFieldChange('to', e.target.value)}
                className={`flex-1 p-2 border rounded text-sm focus:outline-none focus:ring-2 transition-colors ${
                  emailError
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                }`}
                placeholder="recipient@example.com"
              />
            ) : (
              <div className="flex-1 p-2 text-sm text-gray-900">
                {displayContent.to}
              </div>
            )}
          </div>
          {emailError && (
            <div className="ml-15 text-xs text-red-600 flex items-center gap-1">
              <span>⚠️</span>
              <span>{emailError}</span>
            </div>
          )}
        </div>

        {/* Subject Field */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 w-12">Subject:</label>
          {editable && isTypingComplete ? (
            <input
              type="text"
              value={emailContent.subject}
              onChange={(e) => handleEmailFieldChange('subject', e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : (
            <div className="flex-1 p-2 text-sm text-gray-900">
              {displayContent.subject}
            </div>
          )}
        </div>

        {/* Email Body */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Message:</label>
          {editable && isTypingComplete ? (
            <textarea
              ref={bodyRef}
              value={emailContent.body}
              onChange={handleEmailBodyChange}
              onFocus={handleBodyFocus}
              onBlur={handleBodyBlur}
              className="w-full p-3 border border-gray-300 rounded text-sm resize-y h-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              style={{ lineHeight: '1.5' }}
              placeholder="Type your message here..."
            />
          ) : (
            <div className="w-full p-3 border border-gray-300 rounded text-sm h-80 font-mono overflow-y-auto" style={{ lineHeight: '1.5' }}>
              <div className="text-gray-900 whitespace-pre-wrap">
                {displayContent.body}
              </div>
            </div>
          )}
        </div>

        {/* Email Actions */}
        {isTypingComplete && (
          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              This email will be sent from your connected email account
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveDraft}
                disabled={!editable}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save size={16} />
                Save Draft
              </button>
              <button
                onClick={handleSendEmail}
                disabled={!editable}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
                Send Email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default EmailComposer;
