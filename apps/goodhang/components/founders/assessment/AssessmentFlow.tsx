'use client';

import { useState, useEffect } from 'react';
import type { AssessmentSection } from '@/lib/founders/hooks/use-question-set';

export interface AssessmentConfig {
  storageKey: string;
  sections: AssessmentSection[];
  loadingMessages?: string[];
  themeColor?: string;
  title?: string;
  subtitle?: string;
  completionTitle?: string;
  completionDescription?: string;
  submitButtonText?: string;
}

interface AssessmentFlowProps {
  config: AssessmentConfig;
  onComplete: (answers: Record<string, string>) => void;
  onExit?: (answers: Record<string, string>, currentIndex: number) => void;
  autoSubmit?: boolean;
}

export function AssessmentFlow({ config, onComplete, autoSubmit = false }: AssessmentFlowProps) {
  const allQuestions = config.sections.flatMap(s => s.questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);

  // Restore progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(config.storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (typeof parsed.currentIndex === 'number') setCurrentIndex(parsed.currentIndex);
      } catch { /* ignore */ }
    }
  }, [config.storageKey]);

  // Save progress
  useEffect(() => {
    localStorage.setItem(config.storageKey, JSON.stringify({ answers, currentIndex }));
  }, [answers, currentIndex, config.storageKey]);

  const currentQuestion = allQuestions[currentIndex];
  const progress = allQuestions.length > 0 ? ((currentIndex + 1) / allQuestions.length) * 100 : 0;

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion!.id]: value };
    setAnswers(newAnswers);

    if (autoSubmit && !currentQuestion?.followUp) {
      // Auto-advance for non-textarea questions
      setTimeout(() => {
        if (currentIndex < allQuestions.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setIsComplete(true);
          onComplete(newAnswers);
        }
      }, 300);
    }
  };

  const handleNext = () => {
    if (currentIndex < allQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
      onComplete(answers);
    }
  };

  if (isComplete) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-md animate-founders-fade-in">
          <p className="text-green-400 text-xl font-semibold mb-2">{config.completionTitle || 'Complete!'}</p>
          <p className="text-gray-400 text-sm">{config.completionDescription || 'Your responses have been recorded.'}</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  // Find current section
  let questionCounter = 0;
  let currentSection: AssessmentSection | undefined;
  for (const section of config.sections) {
    if (questionCounter + section.questions.length > currentIndex) {
      currentSection = section;
      break;
    }
    questionCounter += section.questions.length;
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex-shrink-0 mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">{config.title || 'Assessment'}</h3>
        {currentSection && <p className="text-sm text-gray-400">{currentSection.title}</p>}
        <div className="mt-2 h-1 bg-[var(--gh-dark-600)] rounded-full">
          <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-1">{currentIndex + 1} of {allQuestions.length}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <p className="text-white text-base font-medium mb-4">{currentQuestion.text}</p>

        {currentQuestion.isRanking && currentQuestion.options ? (
          <div className="space-y-2">
            {currentQuestion.options.map(option => (
              <button key={option} onClick={() => handleAnswer(option)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  answers[currentQuestion.id] === option
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'border-[var(--gh-dark-600)] text-gray-300 hover:border-gray-500'
                }`}>
                {option}
              </button>
            ))}
          </div>
        ) : (
          <textarea value={answers[currentQuestion.id] || ''} onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Type your answer..."
            className="w-full bg-[var(--gh-dark-700)] text-white rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500" rows={5} />
        )}
      </div>

      {!autoSubmit && (
        <div className="flex-shrink-0 pt-4">
          <button onClick={handleNext} disabled={!answers[currentQuestion.id]}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors">
            {currentIndex < allQuestions.length - 1 ? 'Next' : (config.submitButtonText || 'Complete')}
          </button>
        </div>
      )}
    </div>
  );
}
