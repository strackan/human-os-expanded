/**
 * Error Boundary Component
 *
 * Catches React errors and displays user-friendly error messages
 */

'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { getUserFriendlyError, formatErrorForLogging } from '@/lib/utils/error-messages';
import { errorAnalytics } from '@/lib/utils/analytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    const errorLog = formatErrorForLogging(error);
    console.error('Error Boundary caught error:', errorLog, errorInfo);

    // Track error in analytics
    errorAnalytics.occurred(
      error.name,
      error.message,
      errorInfo.componentStack?.split('\n')[1]?.trim(),
      true
    );

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  override render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const friendlyMessage = getUserFriendlyError(this.state.error);

      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-semibold text-red-400 mb-2">
                  Something Went Wrong
                </h2>
              </div>

              <p className="text-gray-300 mb-6 text-center">{friendlyMessage}</p>

              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Reload Page
                </button>

                <button
                  onClick={() => (window.location.href = '/')}
                  className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Go Home
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6 text-xs">
                  <summary className="text-gray-400 cursor-pointer hover:text-gray-300">
                    Technical Details
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-900 rounded text-red-400 overflow-auto">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Error Display Component
 *
 * For displaying inline errors with retry actions
 */
interface ErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({ error, onRetry, className = '' }: ErrorDisplayProps) {
  const errorMessage =
    typeof error === 'string' ? error : getUserFriendlyError(error);

  return (
    <div
      className={`bg-red-500/10 border border-red-500/30 rounded-lg p-4 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <div className="text-red-400 flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="flex-1">
          <p className="text-red-400 text-sm font-medium mb-1">Error</p>
          <p className="text-gray-300 text-sm">{errorMessage}</p>

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm text-purple-400 hover:text-purple-300 underline focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Network Status Banner
 *
 * Shows when user is offline
 */
export function OfflineStatusBanner() {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/20 border-b border-yellow-500/30 py-3 px-4"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-yellow-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
          />
        </svg>
        <span className="font-mono text-sm">
          You&apos;re offline. Changes will sync when reconnected.
        </span>
      </div>
    </div>
  );
}
