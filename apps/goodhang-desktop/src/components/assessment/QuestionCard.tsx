/**
 * Question Card Component
 *
 * Displays a single assessment question with answer input.
 */

import { motion } from 'framer-motion';
import { Mic, MicOff, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { TEST_IDS, testId } from '@/lib/test-utils';
import { RankingInput } from './RankingInput';
import type { FlattenedQuestion } from '@/lib/types';

interface QuestionCardProps {
  question: FlattenedQuestion;
  answer: string;
  onAnswerChange: (value: string) => void;
  interimTranscript?: string;
  isListening: boolean;
  isSupported: boolean;
  isSubmitting: boolean;
  canProceed: boolean;
  isLastQuestion: boolean;
  currentIndex: number;
  onMicToggle: () => void;
  onBack: () => void;
  onNext: () => void;
  error?: string | null;
  themeColor: 'purple' | 'blue';
}

export function QuestionCard({
  question,
  answer,
  onAnswerChange,
  interimTranscript = '',
  isListening,
  isSupported,
  isSubmitting,
  canProceed,
  isLastQuestion,
  currentIndex,
  onMicToggle,
  onBack,
  onNext,
  error,
  themeColor,
}: QuestionCardProps) {
  const colors = {
    purple: {
      gradient: 'from-purple-900/20 to-blue-900/20',
      border: 'border-purple-500/30',
      inputBorder: 'border-purple-500/30 focus:border-purple-500',
      micActive: 'bg-red-500/20 border-red-500 text-red-400 animate-pulse',
      micInactive: 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20',
      button: 'from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg hover:shadow-purple-500/50',
      transcript: 'bg-purple-900/40 border-purple-500/30 text-purple-200',
      transcriptLabel: 'text-purple-400',
    },
    blue: {
      gradient: 'from-blue-900/20 to-purple-900/20',
      border: 'border-blue-500/30',
      inputBorder: 'border-blue-500/30 focus:border-blue-500',
      micActive: 'bg-red-500/20 border-red-500 text-red-400 animate-pulse',
      micInactive: 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20',
      button: 'from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg hover:shadow-blue-500/50',
      transcript: 'bg-blue-900/40 border-blue-500/30 text-blue-200',
      transcriptLabel: 'text-blue-400',
    },
  };

  const c = colors[themeColor];

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      {/* Transition Message */}
      {question.transitionMessage && (
        <div
          {...testId(TEST_IDS.assessment.transitionMessage)}
          className={`mb-6 p-4 ${c.gradient.replace('from-', 'bg-').split(' ')[0]}/20 border ${c.border} rounded-lg`}
        >
          <p className={themeColor === 'purple' ? 'text-purple-300' : 'text-blue-300'}>
            {question.transitionMessage}
          </p>
        </div>
      )}

      {/* Question Card */}
      <div
        {...testId(TEST_IDS.assessment.questionCard)}
        className={`bg-gradient-to-br ${c.gradient} border ${c.border} rounded-lg p-8 mb-6`}
      >
        <div className="mb-6">
          <h2
            {...testId(TEST_IDS.assessment.questionText)}
            className="text-2xl font-semibold text-white mb-4 leading-relaxed"
          >
            {question.text}
          </h2>
          {question.followUp && (
            <p
              {...testId(TEST_IDS.assessment.questionFollowUp)}
              className="text-gray-400 text-sm italic"
            >
              {question.followUp}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {question.isRanking && question.options ? (
            <RankingInput
              options={question.options}
              value={answer}
              onChange={onAnswerChange}
              themeColor={themeColor}
            />
          ) : (
            <div className="relative">
              <textarea
                {...testId(TEST_IDS.assessment.answerInput)}
                value={answer + (interimTranscript ? ` ${interimTranscript}` : '')}
                onChange={(e) => onAnswerChange(e.target.value)}
                placeholder="Type your answer here or use the microphone to dictate..."
                rows={8}
                className={`w-full px-4 py-3 pr-14 bg-gray-900/50 border ${c.inputBorder} rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors resize-none`}
                autoFocus
              />
              <div className="absolute bottom-3 right-3">
                <button
                  {...testId(TEST_IDS.assessment.micBtn)}
                  type="button"
                  onClick={onMicToggle}
                  disabled={isSubmitting}
                  className={`
                    p-2 rounded-lg transition-all duration-200 border
                    ${isListening ? c.micActive : isSupported ? c.micInactive : 'bg-gray-700/30 border-gray-600/30 text-gray-500 cursor-not-allowed'}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  title={isListening ? 'Stop recording' : 'Start dictation'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Interim transcript */}
          {interimTranscript && !question.isRanking && (
            <div
              {...testId(TEST_IDS.assessment.interimTranscript)}
              className={`px-3 py-2 ${c.transcript} border rounded-lg text-sm`}
            >
              <div className={`text-xs ${c.transcriptLabel} mb-1`}>Listening...</div>
              {interimTranscript}
            </div>
          )}

          {/* Character count */}
          {!question.isRanking && (
            <p {...testId(TEST_IDS.assessment.charCount)} className="text-xs text-gray-500">
              {answer.length < 10 ? 'Write at least a few sentences' : `${answer.length} characters`}
            </p>
          )}

          {/* Error message */}
          {error && (
            <div
              {...testId(TEST_IDS.assessment.errorMessage)}
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <button
              {...testId(TEST_IDS.assessment.prevBtn)}
              onClick={onBack}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentIndex === 0 ? 'Cancel' : 'Previous'}
            </button>

            <button
              {...testId(TEST_IDS.assessment.nextBtn)}
              onClick={onNext}
              disabled={!canProceed || isSubmitting}
              className={`flex items-center gap-2 px-8 py-3 bg-gradient-to-r ${c.button} disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : isLastQuestion ? (
                'Save Answer'
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default QuestionCard;
