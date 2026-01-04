/**
 * Assessment Onboarding Intro Component
 *
 * Provides clear instructions and expectations before starting assessment
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OnboardingIntroProps {
  onStart: () => void;
  isLoading?: boolean;
}

export function OnboardingIntro({ onStart, isLoading = false }: OnboardingIntroProps) {
  const [hasRead, setHasRead] = useState(false);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-500/20 rounded-full mb-6">
            <svg
              className="w-10 h-10 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Welcome to the CS Assessment
          </h1>
          <p className="text-lg md:text-xl text-gray-300">
            A comprehensive evaluation to help us understand your skills and match you with the
            best opportunities
          </p>
        </div>

        {/* What to Expect */}
        <div className="space-y-6 mb-8">
          <h2 className="text-xl font-semibold text-purple-300 flex items-center gap-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
            What to Expect
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Time */}
            <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">20-30 Minutes</h3>
                <p className="text-sm text-gray-400">Take your time - quality over speed</p>
              </div>
            </div>

            {/* Questions */}
            <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">26 Questions</h3>
                <p className="text-sm text-gray-400">Across 6 key sections</p>
              </div>
            </div>

            {/* Auto-save */}
            <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Auto-Saved</h3>
                <p className="text-sm text-gray-400">Take breaks anytime - we save as you go</p>
              </div>
            </div>

            {/* Results */}
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Immediate Results</h3>
                <p className="text-sm text-gray-400">Get your scores and insights instantly</p>
              </div>
            </div>
          </div>
        </div>

        {/* What We'll Assess */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-purple-300 mb-4">What We&apos;ll Assess</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: '🧠', title: 'Personality & Work Style', desc: 'MBTI, Enneagram, and work preferences' },
              { icon: '🤖', title: 'AI Orchestration Skills', desc: 'How you leverage AI tools and techniques' },
              { icon: '💼', title: 'Professional Background', desc: 'Experience, education, and expertise' },
              { icon: '🎯', title: 'Technical Skills', desc: 'Your technical capabilities and knowledge' },
              { icon: '❤️', title: 'Emotional Intelligence', desc: 'Self-awareness and interpersonal skills' },
              { icon: '🎨', title: 'Creative Problem-Solving', desc: 'Innovation and adaptability' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
                <span className="text-2xl flex-shrink-0" role="img" aria-label={item.title}>
                  {item.icon}
                </span>
                <div>
                  <h3 className="font-medium text-white text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h3 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Pro Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 flex-shrink-0">•</span>
              <span>Be honest - there are no &quot;right&quot; answers, just authentic ones</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 flex-shrink-0">•</span>
              <span>Provide specific examples when asked - detail helps us match you better</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 flex-shrink-0">•</span>
              <span>Use voice dictation on mobile for faster input (tap the mic icon)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 flex-shrink-0">•</span>
              <span>You can navigate back to previous questions if needed</span>
            </li>
          </ul>
        </div>

        {/* Acknowledgment */}
        <label className="flex items-start gap-3 mb-6 cursor-pointer group">
          <input
            type="checkbox"
            checked={hasRead}
            onChange={(e) => setHasRead(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-2 border-purple-500/50 bg-gray-900 checked:bg-purple-600 checked:border-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all cursor-pointer"
            aria-describedby="acknowledgment-text"
          />
          <span
            id="acknowledgment-text"
            className="text-sm text-gray-300 group-hover:text-white transition-colors"
          >
            I understand this assessment will take 20-30 minutes and my responses will be used to
            match me with relevant opportunities. All information is confidential.
          </span>
        </label>

        {/* Start Button */}
        <button
          onClick={onStart}
          disabled={!hasRead || isLoading}
          className={cn(
            'w-full min-h-[56px] py-4 rounded-lg font-bold text-lg transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900',
            'disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed disabled:shadow-none',
            'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500',
            'text-white shadow-lg hover:shadow-purple-500/50 hover:scale-[1.02]'
          )}
          aria-label="Begin assessment"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              Starting Assessment...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Begin Assessment
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
          )}
        </button>

        {/* Privacy Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          🔒 Your data is encrypted and never shared without permission
        </p>
      </div>
    </div>
  );
}

/**
 * Section Intro Component
 *
 * Brief introduction shown when entering each section
 */
interface SectionIntroProps {
  name: string;
  description: string;
  questionCount: number;
  estimatedMinutes: number;
  icon?: React.ReactNode;
  onContinue: () => void;
}

export function SectionIntro({
  name,
  description,
  questionCount,
  estimatedMinutes,
  icon,
  onContinue,
}: SectionIntroProps) {
  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-8 text-center max-w-2xl mx-auto">
      {icon && <div className="mb-6 flex justify-center">{icon}</div>}

      <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">{name}</h2>
      <p className="text-gray-300 mb-6 max-w-lg mx-auto">{description}</p>

      <div className="flex items-center justify-center gap-6 mb-8 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            {questionCount} {questionCount === 1 ? 'question' : 'questions'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>~{estimatedMinutes} min</span>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="min-h-[48px] px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
      >
        Continue
      </button>
    </div>
  );
}
