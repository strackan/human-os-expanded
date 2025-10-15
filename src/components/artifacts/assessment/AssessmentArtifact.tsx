'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { QuestionBlock, AssessmentAnswers } from './types';
import SliderWithReasonBlock from './SliderWithReasonBlock';
import LongTextBlock from './LongTextBlock';
import RadioWithReasonBlock from './RadioWithReasonBlock';
import MultipleChoiceBlock from './MultipleChoiceBlock';
import DropdownBlock from './DropdownBlock';

interface AssessmentArtifactProps {
  title?: string;
  subtitle?: string;
  customerName?: string;
  questionBlocks: QuestionBlock[];
  onSubmit?: (answers: AssessmentAnswers) => void;
  onBack?: () => void;
  initialAnswers?: AssessmentAnswers;
}

export default function AssessmentArtifact({
  title = 'Assessment',
  subtitle,
  customerName,
  questionBlocks,
  onSubmit,
  onBack,
  initialAnswers = {}
}: AssessmentArtifactProps) {
  const { showToast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>(initialAnswers);

  const totalQuestions = questionBlocks.length;
  const currentBlock = questionBlocks[currentQuestion];

  const handleMicClick = () => {
    showToast({
      message: 'Voice transcription coming soon!',
      type: 'info',
      icon: 'none',
      duration: 2000
    });
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const canProceed = () => {
    const currentAnswer = answers[currentBlock.id];

    if (!currentBlock.required) return true;

    // Check based on question type
    if (currentBlock.type === 'slider-with-reason') {
      return currentAnswer && currentAnswer.reason && currentAnswer.reason.trim().length > 0;
    } else if (currentBlock.type === 'long-text') {
      return currentAnswer && currentAnswer.trim().length > 0;
    } else if (currentBlock.type === 'radio-with-reason') {
      return currentAnswer && currentAnswer.value && currentAnswer.reason && currentAnswer.reason.trim().length > 0;
    } else if (currentBlock.type === 'multiple-choice') {
      if (currentBlock.allowMultiple) {
        return Array.isArray(currentAnswer) && currentAnswer.length > 0;
      }
      return currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== '';
    } else if (currentBlock.type === 'dropdown') {
      return currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== '';
    }

    return true;
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit?.(answers);
  };

  const renderQuestionBlock = () => {
    const questionNumber = currentQuestion + 1;
    const currentAnswer = answers[currentBlock.id];

    switch (currentBlock.type) {
      case 'slider-with-reason':
        return (
          <SliderWithReasonBlock
            config={currentBlock}
            value={currentAnswer || { score: currentBlock.defaultValue || currentBlock.min, reason: '' }}
            onChange={(value) => handleAnswerChange(currentBlock.id, value)}
            questionNumber={questionNumber}
            onMicClick={handleMicClick}
            autoFocus={true}
          />
        );

      case 'long-text':
        return (
          <LongTextBlock
            config={currentBlock}
            value={currentAnswer || ''}
            onChange={(value) => handleAnswerChange(currentBlock.id, value)}
            questionNumber={questionNumber}
            onMicClick={handleMicClick}
            autoFocus={true}
          />
        );

      case 'radio-with-reason':
        return (
          <RadioWithReasonBlock
            config={currentBlock}
            value={currentAnswer || null}
            onChange={(value) => handleAnswerChange(currentBlock.id, value)}
            questionNumber={questionNumber}
            onMicClick={handleMicClick}
            autoFocus={true}
          />
        );

      case 'multiple-choice':
        return (
          <MultipleChoiceBlock
            config={currentBlock}
            value={currentAnswer || (currentBlock.allowMultiple ? [] : null)}
            onChange={(value) => handleAnswerChange(currentBlock.id, value)}
            questionNumber={questionNumber}
            onMicClick={handleMicClick}
            autoFocus={true}
          />
        );

      case 'dropdown':
        return (
          <DropdownBlock
            config={currentBlock}
            value={currentAnswer || null}
            onChange={(value) => handleAnswerChange(currentBlock.id, value)}
            questionNumber={questionNumber}
            onMicClick={handleMicClick}
            autoFocus={true}
          />
        );

      default:
        return (
          <div className="text-red-500">
            Unsupported question type: {(currentBlock as QuestionBlock).type}
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {(subtitle || customerName) && (
          <p className="text-sm text-gray-600 mt-2">
            {subtitle}{customerName && ` for ${customerName}`}
          </p>
        )}

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mt-4">
          {Array.from({ length: totalQuestions }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                idx === currentQuestion
                  ? 'bg-purple-600'
                  : idx < currentQuestion
                  ? 'bg-purple-400'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Question {currentQuestion + 1} of {totalQuestions}
        </p>
      </div>

      {/* Form Content - Single Question Block */}
      <div className="flex-1 flex flex-col p-8 min-h-0">
        <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col min-h-0">
          {renderQuestionBlock()}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="px-8 py-5 border-t border-gray-200 bg-gray-50 flex justify-between items-center gap-4">
        {/* Back to Workflow Button */}
        {currentQuestion === 0 && onBack && (
          <button
            onClick={onBack}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* Previous Question Button */}
        {currentQuestion > 0 && (
          <button
            onClick={handlePrevious}
            className="px-5 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
        )}

        <div className="flex-1"></div>

        {/* Next/Submit Button */}
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
        >
          {currentQuestion < totalQuestions - 1 ? 'Next' : 'Submit'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
