/**
 * ThinkingProcess Component
 *
 * Displays step-by-step reasoning from Sequential Thinking MCP
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { SequentialThinkingMCP } from '@/lib/mcp/types/mcp.types';

interface ThinkingProcessProps {
  result?: SequentialThinkingMCP.ThinkingResult;
  isThinking?: boolean;
  className?: string;
}

export function ThinkingProcess({
  result,
  isThinking = false,
  className = '',
}: ThinkingProcessProps) {
  if (!result && !isThinking) {
    return null;
  }

  return (
    <div className={`thinking-process ${className}`}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {isThinking ? 'Thinking...' : 'Reasoning Process'}
        </h3>
        {result && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Complexity: {result.metadata?.complexity}
            </span>
            <span className="text-sm text-gray-500">
              Confidence: {result.confidenceScore}%
            </span>
          </div>
        )}
      </div>

      {/* Thinking Animation */}
      {isThinking && (
        <div className="flex items-center gap-2 py-4">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-blue-500"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Analyzing step-by-step...
          </span>
        </div>
      )}

      {/* Thinking Steps */}
      {result && (
        <div className="space-y-3">
          <AnimatePresence>
            {result.steps.map((step, index) => (
              <motion.div
                key={step.stepNumber}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                {/* Step Header */}
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {step.stepNumber}
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {step.title}
                    </h4>
                  </div>
                  {step.confidence !== undefined && (
                    <span className="text-sm text-gray-500">
                      {step.confidence}% confident
                    </span>
                  )}
                </div>

                {/* Step Content */}
                <p className="ml-8 text-sm text-gray-700 dark:text-gray-300">
                  {step.content}
                </p>

                {/* Step Reasoning */}
                {step.reasoning && (
                  <div className="ml-8 mt-2 rounded bg-gray-50 p-2 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-400">
                    <span className="font-semibold">Why: </span>
                    {step.reasoning}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Conclusion */}
          {result.conclusion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: result.steps.length * 0.1 + 0.2 }}
              className="rounded-lg border-2 border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
            >
              <div className="mb-2 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h4 className="font-semibold text-green-900 dark:text-green-100">
                  Conclusion
                </h4>
              </div>
              <p className="text-sm text-green-800 dark:text-green-200">
                {result.conclusion}
              </p>
            </motion.div>
          )}

          {/* Metadata */}
          {result.metadata && (
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>
                Completed in {(result.metadata.timeTaken / 1000).toFixed(2)}s
              </span>
              {result.metadata.tokensUsed && (
                <span>{result.metadata.tokensUsed} tokens used</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function ThinkingProcessCompact({
  result,
}: {
  result: SequentialThinkingMCP.ThinkingResult;
}) {
  return (
    <div className="thinking-process-compact">
      <details className="group">
        <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
          View reasoning ({result.totalSteps} steps)
        </summary>
        <div className="mt-2">
          <ThinkingProcess result={result} />
        </div>
      </details>
    </div>
  );
}
