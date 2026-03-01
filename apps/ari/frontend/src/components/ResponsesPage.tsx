import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import apiClient, { PromptResponse, EntityTestResult, EntityTestQuestion, EntityTestProgress, AnalysisResult } from '../api/client'

interface ResponsesPageProps {
  entityId: string
  entityName: string
  onBack: () => void
  autoRunTest?: boolean
}

// Entity Test Question Card Component
function EntityTestQuestionCard({
  question,
  entityName,
}: {
  question: EntityTestQuestion
  entityName: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const mentionCount = Object.values(question.responses).filter(r => r.mentioned).length
  const totalProviders = Object.keys(question.responses).length

  return (
    <div className="rounded-lg border border-purple-500/20 bg-purple-900/10 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-purple-900/20 transition-colors text-left"
      >
        <div className="flex-1">
          <p className="text-purple-100 font-medium">{question.question}</p>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <span className={`px-2 py-1 rounded text-sm ${
            mentionCount > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {mentionCount}/{totalProviders} mentioned
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-purple-400"
          >
            ▼
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-3">
              {Object.entries(question.responses).map(([provider, response]) => (
                <div
                  key={provider}
                  className={`p-3 rounded-lg ${
                    response.mentioned
                      ? 'bg-green-900/20 border border-green-500/30'
                      : 'bg-purple-900/20 border border-purple-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-purple-200 capitalize">{provider}</span>
                    {response.mentioned ? (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                        {response.position ? `Rank #${response.position}` : 'Mentioned'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                        Not Mentioned
                      </span>
                    )}
                  </div>
                  <p className="text-purple-100/80 text-sm whitespace-pre-wrap">
                    {response.response.slice(0, 500)}
                    {response.response.length > 500 && '...'}
                  </p>
                  {response.followup && (
                    <div className="mt-3 p-3 bg-indigo-900/30 rounded border border-indigo-500/20">
                      <p className="text-xs text-indigo-300 font-medium mb-1">Follow-up (why not {entityName}?):</p>
                      <p className="text-indigo-100/80 text-sm">
                        {response.followup.slice(0, 400)}
                        {response.followup.length > 400 && '...'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Entity Test Table View
function EntityTestTable({
  results,
  entityName,
}: {
  results: EntityTestQuestion[]
  entityName: string
}) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-purple-500/30">
            <th className="text-left p-3 text-purple-300 font-medium">Question</th>
            <th className="text-center p-3 text-green-400 font-medium w-24">OpenAI</th>
            <th className="text-center p-3 text-orange-400 font-medium w-24">Anthropic</th>
            <th className="text-center p-3 text-blue-400 font-medium w-24">Perplexity</th>
            <th className="text-center p-3 text-purple-400 font-medium w-24">Gemini</th>
          </tr>
        </thead>
        <tbody>
          {results.map((question, i) => (
            <>
              <tr
                key={i}
                className="border-b border-purple-500/20 hover:bg-purple-900/20 cursor-pointer"
                onClick={() => setExpandedRow(expandedRow === i ? null : i)}
              >
                <td className="p-3 text-purple-100 text-sm">{question.question}</td>
                {['openai', 'anthropic', 'perplexity', 'gemini'].map((provider) => {
                  const resp = question.responses[provider]
                  return (
                    <td key={provider} className="p-3 text-center">
                      {resp?.mentioned ? (
                        <span className="inline-block px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                          {resp.position ? `#${resp.position}` : 'Yes'}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                          No
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
              {expandedRow === i && (
                <tr className="bg-purple-900/10">
                  <td colSpan={5} className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(question.responses).map(([provider, resp]) => (
                        <div key={provider} className={`p-3 rounded-lg ${resp.mentioned ? 'bg-green-900/20 border border-green-500/20' : 'bg-black/20'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-purple-200 capitalize">{provider}</span>
                            {resp.mentioned ? (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                {resp.position ? `#${resp.position}` : 'Mentioned'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                                Not mentioned
                              </span>
                            )}
                          </div>
                          <p className="text-purple-100/70 text-xs mb-2">{resp.response.slice(0, 300)}...</p>
                          {resp.followup && (
                            <div className="mt-2 p-2 bg-indigo-900/30 rounded border border-indigo-500/20">
                              <p className="text-xs text-indigo-300 font-medium mb-1">Follow-up (why not {entityName}?):</p>
                              <p className="text-indigo-100/80 text-xs whitespace-pre-wrap">
                                {resp.followup.slice(0, 500)}
                                {resp.followup.length > 500 && '...'}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Progress Display Component
function ProgressDisplay({
  progress,
  providerResults,
}: {
  progress: EntityTestProgress | null
  providerResults: Map<string, { mentioned: boolean; position: number | null }[]>
}) {
  if (!progress) return null

  const percentage = progress.step && progress.total
    ? Math.round((progress.step / progress.total) * 100)
    : 0

  const providers = ['openai', 'anthropic', 'perplexity', 'gemini']

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/20">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        Running AI Test...
      </h3>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-purple-300 mb-1">
          <span>Progress</span>
          <span>{progress.step || 0} / {progress.total || 20} queries</span>
        </div>
        <div className="h-3 bg-purple-900/40 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="text-right text-sm text-purple-400 mt-1">{percentage}%</div>
      </div>

      {/* Current Status */}
      <div className="mb-4 p-3 bg-black/20 rounded-lg">
        <div className="text-purple-200 text-sm">
          {progress.message || `Question ${(progress.question_index ?? 0) + 1}: ${progress.question || 'Starting...'}`}
        </div>
      </div>

      {/* Provider Status Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {providers.map((provider) => {
          const results = providerResults.get(provider) || []
          const mentions = results.filter(r => r.mentioned).length
          const total = results.length
          const isActive = progress.provider === provider

          return (
            <div
              key={provider}
              className={`p-3 rounded-lg text-center transition-all ${
                isActive
                  ? 'bg-indigo-600/40 border border-indigo-400/50 ring-2 ring-indigo-400/30'
                  : 'bg-purple-900/30 border border-purple-500/20'
              }`}
            >
              <div className={`text-xs font-medium mb-1 capitalize ${
                isActive ? 'text-indigo-200' : 'text-purple-300'
              }`}>
                {provider}
              </div>
              <div className={`text-lg font-bold ${
                mentions > 0 ? 'text-green-400' : 'text-purple-400'
              }`}>
                {mentions}/{total}
              </div>
              {isActive && (
                <div className="w-3 h-3 mx-auto mt-1 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          )
        })}
      </div>

      {/* Questions Progress */}
      <div className="flex gap-1">
        {Array.from({ length: progress.total_questions || 5 }).map((_, i) => {
          const isComplete = i < (progress.question_index ?? 0)
          const isCurrent = i === (progress.question_index ?? 0)

          return (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full transition-all ${
                isComplete
                  ? 'bg-green-500'
                  : isCurrent
                  ? 'bg-indigo-500 animate-pulse'
                  : 'bg-purple-900/40'
              }`}
            />
          )
        })}
      </div>
      <div className="text-xs text-purple-400 mt-1">
        Question {(progress.question_index ?? 0) + 1} of {progress.total_questions || 5}
      </div>
    </div>
  )
}

// Analysis Display Component
function AnalysisDisplay({ analysis, isLoading }: { analysis: AnalysisResult | null; isLoading: boolean }) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <h3 className="text-xl font-bold text-white">Analyzing Results with Claude Sonnet...</h3>
        </div>
        <p className="text-amber-200/70">Generating strategic insights and recommendations...</p>
      </div>
    )
  }

  if (!analysis || analysis.error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300">
        {analysis?.error || 'Analysis failed'}
      </div>
    )
  }

  const a = analysis.analysis
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'Low': return 'bg-green-500/20 text-green-400 border-green-500/30'
      default: return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    }
  }

  const getRatingColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case 'excellent': return 'text-green-400'
      case 'good': return 'text-blue-400'
      case 'fair': return 'text-yellow-400'
      case 'poor': return 'text-orange-400'
      case 'critical': return 'text-red-400'
      default: return 'text-purple-400'
    }
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-500/20 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-amber-900/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧠</span>
          <div className="text-left">
            <h3 className="text-lg font-bold text-white">AI Analysis</h3>
            <p className="text-sm text-amber-300/60">Powered by Claude Sonnet</p>
          </div>
        </div>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-amber-400 text-xl">
          ▼
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-2 space-y-6">
              {/* Executive Summary */}
              <div className="p-4 bg-black/20 rounded-xl">
                <h4 className="text-amber-300 font-semibold mb-2 flex items-center gap-2">
                  <span>📋</span> Executive Summary
                </h4>
                <p className="text-white/90">{a.executive_summary}</p>
              </div>

              {/* Score Interpretation */}
              <div className="p-4 bg-black/20 rounded-xl">
                <h4 className="text-amber-300 font-semibold mb-2 flex items-center gap-2">
                  <span>📊</span> Score Interpretation
                </h4>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-2xl font-bold ${getRatingColor(a.score_interpretation.rating)}`}>
                    {a.score_interpretation.rating}
                  </span>
                </div>
                <p className="text-white/70">{a.score_interpretation.context}</p>
              </div>

              {/* Strengths & Weaknesses Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-4 bg-green-900/20 rounded-xl border border-green-500/20">
                  <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                    <span>💪</span> Strengths
                  </h4>
                  <ul className="space-y-2">
                    {a.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2 text-green-100/80 text-sm">
                        <span className="text-green-400 mt-1">✓</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="p-4 bg-red-900/20 rounded-xl border border-red-500/20">
                  <h4 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                    <span>⚠️</span> Areas to Improve
                  </h4>
                  <ul className="space-y-2">
                    {a.weaknesses.map((weakness, i) => (
                      <li key={i} className="flex items-start gap-2 text-red-100/80 text-sm">
                        <span className="text-red-400 mt-1">•</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Provider Insights */}
              <div className="p-4 bg-black/20 rounded-xl">
                <h4 className="text-amber-300 font-semibold mb-3 flex items-center gap-2">
                  <span>🤖</span> AI Provider Insights
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-2">
                    <span className="text-green-400 font-medium w-28 shrink-0">Best Performer:</span>
                    <span className="text-white/80">{a.provider_insights.best_performer}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-red-400 font-medium w-28 shrink-0">Needs Work:</span>
                    <span className="text-white/80">{a.provider_insights.worst_performer}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-purple-400 font-medium w-28 shrink-0">Patterns:</span>
                    <span className="text-white/80">{a.provider_insights.patterns}</span>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-4 bg-black/20 rounded-xl">
                <h4 className="text-amber-300 font-semibold mb-3 flex items-center gap-2">
                  <span>🎯</span> Recommendations
                </h4>
                <div className="space-y-3">
                  {a.recommendations.map((rec, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${getPriorityColor(rec.priority)}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                          {rec.priority}
                        </span>
                        <span className="font-medium text-white">{rec.action}</span>
                      </div>
                      <p className="text-white/60 text-sm">{rec.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Competitive Positioning */}
              <div className="p-4 bg-black/20 rounded-xl">
                <h4 className="text-amber-300 font-semibold mb-2 flex items-center gap-2">
                  <span>⚔️</span> Competitive Positioning
                </h4>
                <p className="text-white/80">{a.competitive_positioning}</p>
              </div>

              {/* Next Steps */}
              <div className="p-4 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-xl border border-indigo-500/20">
                <h4 className="text-indigo-300 font-semibold mb-2 flex items-center gap-2">
                  <span>🚀</span> Recommended Next Steps
                </h4>
                <p className="text-white/90">{a.next_steps}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// LocalStorage helpers for persisting test results
const getStorageKey = (entityName: string, listSize: number) =>
  `ari-test-result:${entityName}:${listSize}`

const saveToStorage = (entityName: string, listSize: number, result: EntityTestResult) => {
  try {
    const data = { result, timestamp: Date.now() }
    localStorage.setItem(getStorageKey(entityName, listSize), JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to save to localStorage:', e)
  }
}

const loadFromStorage = (entityName: string, listSize: number): EntityTestResult | null => {
  try {
    const stored = localStorage.getItem(getStorageKey(entityName, listSize))
    if (stored) {
      const { result } = JSON.parse(stored)
      return result
    }
  } catch (e) {
    console.warn('Failed to load from localStorage:', e)
  }
  return null
}

// Entity Test Results Section
function EntityTestSection({ entityName, autoRun = false }: { entityName: string; autoRun?: boolean }) {
  const hasAutoRun = useRef(false)
  const queryClient = useQueryClient()
  const [listSize, setListSize] = useState(1)
  const [displayMode, setDisplayMode] = useState<'table' | 'cards'>('table')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamProgress, setStreamProgress] = useState<EntityTestProgress | null>(null)
  const [providerResults, setProviderResults] = useState<Map<string, { mentioned: boolean; position: number | null }[]>>(new Map())
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null)
  const [streamError, setStreamError] = useState<string | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  // Load from localStorage on mount or when entityName/listSize changes
  useEffect(() => {
    const cached = loadFromStorage(entityName, listSize)
    if (cached) {
      queryClient.setQueryData(['entity-test', entityName, listSize], cached)
    }
  }, [entityName, listSize, queryClient])

  // Get cached result
  const { data: testResult } = useQuery({
    queryKey: ['entity-test', entityName, listSize],
    queryFn: async () => apiClient.getEntityTest(entityName, listSize),
    enabled: false, // Manual trigger only
    staleTime: Infinity,
    gcTime: Infinity,
  })

  // Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: (results: EntityTestResult) => apiClient.analyzeResults(results),
    onSuccess: (data) => {
      setAnalysisResult(data)
    },
  })

  const handleRunTest = useCallback(() => {
    // Reset state
    setIsStreaming(true)
    setStreamProgress(null)
    setProviderResults(new Map())
    setStreamError(null)

    const cleanup = apiClient.getEntityTestStream(
      entityName,
      listSize,
      // onProgress
      (data) => {
        setStreamProgress(data)

        // Track provider results
        if (data.type === 'provider_complete' && data.provider) {
          setProviderResults(prev => {
            const next = new Map(prev)
            const existing = next.get(data.provider!) || []
            next.set(data.provider!, [...existing, {
              mentioned: data.mentioned ?? false,
              position: data.position ?? null,
            }])
            return next
          })
        }
      },
      // onComplete
      (result) => {
        setIsStreaming(false)
        setLastRunTime(new Date())
        // Update the cache and persist to localStorage
        queryClient.setQueryData(['entity-test', entityName, listSize], result)
        saveToStorage(entityName, listSize, result)
      },
      // onError
      (error) => {
        setIsStreaming(false)
        setStreamError(error.message)
      }
    )

    cleanupRef.current = cleanup
  }, [entityName, listSize, queryClient])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [])

  // Auto-run test if autoRun prop is true
  useEffect(() => {
    if (autoRun && !hasAutoRun.current && !testResult && !isStreaming) {
      hasAutoRun.current = true
      handleRunTest()
    }
  }, [autoRun, testResult, isStreaming, handleRunTest])

  // Show prompt to run test if no data and not streaming
  if (!testResult && !isStreaming) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-white mb-2">Live AI Test</h3>
          <p className="text-purple-300/70 mb-6">
            Run a battery of questions across all 4 LLMs to see how they respond to queries about {entityName}.
            Watch the progress in real-time!
          </p>
          <button
            onClick={handleRunTest}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all"
          >
            Run Live Test
          </button>
        </div>
      </div>
    )
  }

  // Show streaming progress
  if (isStreaming) {
    return (
      <ProgressDisplay progress={streamProgress} providerResults={providerResults} />
    )
  }

  // Show error
  if (streamError) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
        <div className="text-red-300 mb-2">Failed to complete test: {streamError}</div>
        <button
          onClick={handleRunTest}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!testResult) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300">
        No results available.
      </div>
    )
  }

  return (
    <>
    <div className="space-y-6">
      {/* Header with Last Run + Refresh */}
      <div className="flex items-center justify-between">
        <div className="text-purple-300/60 text-sm">
          {lastRunTime && (
            <>Last run: {lastRunTime.toLocaleString()}</>
          )}
        </div>
        <button
          onClick={handleRunTest}
          disabled={isStreaming}
          className="px-4 py-2 bg-purple-900/30 text-purple-300 text-sm font-medium rounded-lg hover:bg-purple-900/50 transition-all disabled:opacity-50"
        >
          {isStreaming ? 'Running...' : 'Refresh Results'}
        </button>
      </div>

      {/* Score Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-indigo-900/30 border border-indigo-500/20">
          <div className="text-3xl font-bold text-indigo-400">{testResult.ari_score}</div>
          <div className="text-sm text-indigo-300/60">ARI Score</div>
        </div>
        <div className="p-4 rounded-xl bg-green-900/20 border border-green-500/20">
          <div className="text-3xl font-bold text-green-400">{testResult.mentions}</div>
          <div className="text-sm text-green-300/60">Mentions</div>
        </div>
        <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-500/20">
          <div className="text-3xl font-bold text-purple-400">{testResult.total_questions}</div>
          <div className="text-sm text-purple-300/60">Questions Asked</div>
        </div>
        <div className="p-4 rounded-xl bg-orange-900/20 border border-orange-500/20">
          <div className="text-3xl font-bold text-orange-400">{testResult.mention_rate.toFixed(0)}%</div>
          <div className="text-sm text-orange-300/60">Mention Rate</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-purple-300 text-sm">List size:</span>
          <div className="flex gap-2">
            {[1, 3, 5].map((size) => (
              <button
                key={size}
                onClick={() => setListSize(size)}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  listSize === size
                    ? 'bg-indigo-600 text-white'
                    : 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50'
                }`}
              >
                Top {size}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-purple-300 text-sm">View:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setDisplayMode('table')}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                displayMode === 'table'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setDisplayMode('cards')}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                displayMode === 'cards'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50'
              }`}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Question Results */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Question Results</h3>

        {displayMode === 'table' ? (
          <EntityTestTable results={testResult.results} entityName={entityName} />
        ) : (
          testResult.results.map((question, i) => (
            <EntityTestQuestionCard
              key={i}
              question={question}
              entityName={entityName}
            />
          ))
        )}
      </div>

    </div>

    {/* AI Analysis Section - separate from results */}
    <div className="mt-8 space-y-4">
      {/* Analyze Results Button */}
      {!analysisResult && !analysisMutation.isPending && (
        <div className="flex justify-center">
          <button
            onClick={() => analysisMutation.mutate(testResult)}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all flex items-center gap-2"
          >
            <span>🧠</span>
            Analyze Results with Claude Sonnet
          </button>
        </div>
      )}

      {/* Analysis Display */}
      {(analysisMutation.isPending || analysisResult) && (
        <AnalysisDisplay
          analysis={analysisResult}
          isLoading={analysisMutation.isPending}
        />
      )}
    </div>
  </>
  )
}

const INTENT_LABELS: Record<string, { label: string; emoji: string; description: string }> = {
  best: { label: 'Best', emoji: '🏆', description: 'Questions about the best option' },
  top: { label: 'Top N', emoji: '📊', description: 'Ranked list questions' },
  recommend: { label: 'Recommend', emoji: '👍', description: 'Recommendation requests' },
  compare: { label: 'Compare', emoji: '⚖️', description: 'Head-to-head comparisons' },
  discover: { label: 'Discover', emoji: '🔍', description: 'Discovery & exploration' },
  evaluate: { label: 'Evaluate', emoji: '📝', description: 'Evaluation questions' },
  unknown: { label: 'Other', emoji: '❓', description: 'Other prompt types' },
}

const PROVIDER_INFO: Record<string, { emoji: string; color: string }> = {
  openai: { emoji: '🤖', color: 'text-green-400' },
  anthropic: { emoji: '🧠', color: 'text-orange-400' },
  perplexity: { emoji: '🔍', color: 'text-blue-400' },
  gemini: { emoji: '✨', color: 'text-purple-400' },
}

function ResponseCard({ response, entityName }: { response: PromptResponse; entityName: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const provider = PROVIDER_INFO[response.provider] || { emoji: '🤖', color: 'text-gray-400' }

  // Highlight entity name in response
  const highlightEntity = (text: string) => {
    const regex = new RegExp(`(${entityName})`, 'gi')
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-500/30 text-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <div
      className={`rounded-lg border transition-all cursor-pointer ${
        response.entity_mentioned
          ? 'border-green-500/30 bg-green-900/10'
          : 'border-purple-500/20 bg-purple-900/10'
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div className={`text-xl ${provider.color}`}>{provider.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-medium ${provider.color}`}>
              {response.provider.charAt(0).toUpperCase() + response.provider.slice(1)}
            </span>
            {response.entity_mentioned ? (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                Mentioned #{response.entity_position}
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                Not Mentioned
              </span>
            )}
            {response.latency_ms && (
              <span className="text-purple-400/60 text-xs">
                {response.latency_ms}ms
              </span>
            )}
          </div>
          <p className="text-purple-200/80 text-sm line-clamp-2">
            {response.raw_response.slice(0, 150)}...
          </p>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="text-purple-400"
        >
          ▼
        </motion.div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-purple-500/20 pt-4">
              {/* Full Response */}
              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <h4 className="text-purple-300 text-xs font-medium mb-2">Full Response:</h4>
                <pre className="text-purple-100/90 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                  {highlightEntity(response.raw_response)}
                </pre>
              </div>

              {/* Mentions */}
              {response.all_mentions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-purple-300 text-xs font-medium mb-2">
                    Entities Detected ({response.all_mentions.length}):
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {response.all_mentions.map((mention, i) => (
                      <span
                        key={i}
                        className={`px-2 py-1 rounded text-xs ${
                          mention.name.toLowerCase() === entityName.toLowerCase()
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}
                      >
                        {mention.name}
                        {mention.position && ` #${mention.position}`}
                        <span className="text-purple-400/60 ml-1">({mention.type})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap gap-4 text-xs text-purple-400/60">
                {response.model_version && (
                  <span>Model: {response.model_version}</span>
                )}
                {response.tokens_used && (
                  <span>Tokens: {response.tokens_used}</span>
                )}
                <span>Type: {response.recommendation_type}</span>
              </div>

              {/* Error */}
              {response.error && (
                <div className="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded text-red-300 text-sm">
                  Error: {response.error}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function IntentSection({
  intent,
  responses,
  entityName,
  summary,
}: {
  intent: string
  responses: PromptResponse[]
  entityName: string
  summary?: { total: number; mentioned: number; mention_rate: number }
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const intentInfo = INTENT_LABELS[intent] || INTENT_LABELS.unknown

  // Group by prompt
  const byPrompt = responses.reduce((acc, r) => {
    if (!acc[r.prompt_text]) acc[r.prompt_text] = []
    acc[r.prompt_text].push(r)
    return acc
  }, {} as Record<string, PromptResponse[]>)

  return (
    <div className="rounded-xl border border-purple-500/20 bg-purple-900/10 overflow-hidden">
      {/* Intent Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-purple-900/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{intentInfo.emoji}</span>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-white">{intentInfo.label}</h3>
            <p className="text-sm text-purple-300/60">{intentInfo.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {summary && (
            <div className="text-right">
              <div className="text-sm font-medium text-purple-200">
                {summary.mentioned}/{summary.total} mentioned
              </div>
              <div
                className={`text-xs ${
                  summary.mention_rate > 20
                    ? 'text-green-400'
                    : summary.mention_rate > 0
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}
              >
                {summary.mention_rate.toFixed(0)}% rate
              </div>
            </div>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-purple-400 text-xl"
          >
            ▼
          </motion.div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-6">
              {Object.entries(byPrompt).map(([promptText, promptResponses]) => (
                <div key={promptText} className="space-y-2">
                  <div className="p-3 bg-indigo-900/30 rounded-lg">
                    <h4 className="text-indigo-200 font-medium">"{promptText}"</h4>
                  </div>
                  <div className="grid gap-2 pl-4">
                    {promptResponses.map((response, i) => (
                      <ResponseCard
                        key={`${response.prompt_id}-${response.provider}-${i}`}
                        response={response}
                        entityName={entityName}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ResponsesPage({ entityId, entityName, onBack, autoRunTest = false }: ResponsesPageProps) {
  const [viewMode, setViewMode] = useState<'entity-test' | 'full-responses'>('entity-test')
  const [filter, setFilter] = useState<'all' | 'mentioned' | 'not_mentioned'>('all')

  // Fetch all responses
  const { data: responses, isLoading: responsesLoading } = useQuery({
    queryKey: ['responses', entityId],
    queryFn: () => apiClient.getAllResponses(entityId),
    enabled: !!entityId,
  })

  // Fetch summary
  const { data: summary } = useQuery({
    queryKey: ['responses-summary', entityId],
    queryFn: () => apiClient.getResponsesSummary(entityId),
    enabled: !!entityId,
  })

  // Filter responses
  const filteredResponses = responses?.filter((r) => {
    if (filter === 'mentioned') return r.entity_mentioned
    if (filter === 'not_mentioned') return !r.entity_mentioned
    return true
  })

  // Group by intent
  const byIntent = filteredResponses?.reduce((acc, r) => {
    if (!acc[r.intent]) acc[r.intent] = []
    acc[r.intent].push(r)
    return acc
  }, {} as Record<string, PromptResponse[]>)

  // Sort intents by importance
  const intentOrder = ['best', 'top', 'recommend', 'compare', 'discover', 'evaluate', 'unknown']
  const sortedIntents = Object.keys(byIntent || {}).sort(
    (a, b) => intentOrder.indexOf(a) - intentOrder.indexOf(b)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a1f] via-[#1a1333] to-[#0f0a1f]">
      {/* Header */}
      <header className="border-b border-purple-900/30 backdrop-blur-sm sticky top-0 z-10 bg-[#0f0a1f]/80">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="px-3 py-2 rounded-lg bg-purple-900/30 text-purple-300 hover:bg-purple-900/50 transition-colors"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  AI Responses for {entityName}
                </h1>
                <p className="text-xs text-purple-300/60">
                  View how AI models respond to questions about {entityName}
                </p>
              </div>
            </div>

            {/* View Mode Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('entity-test')}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  viewMode === 'entity-test'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50'
                }`}
              >
                Live Test
              </button>
              <button
                onClick={() => setViewMode('full-responses')}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  viewMode === 'full-responses'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50'
                }`}
              >
                Full Responses
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Entity Test View */}
      {viewMode === 'entity-test' && (
        <main className="max-w-7xl mx-auto px-4 py-8">
          <EntityTestSection entityName={entityName} autoRun={autoRunTest} />
        </main>
      )}

      {/* Full Responses View */}
      {viewMode === 'full-responses' && (
        <>
          {/* Filter Tabs */}
          <div className="max-w-7xl mx-auto px-4 pt-4">
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All', count: responses?.length },
                { key: 'mentioned', label: 'Mentioned', count: responses?.filter((r) => r.entity_mentioned).length },
                { key: 'not_mentioned', label: 'Not Mentioned', count: responses?.filter((r) => !r.entity_mentioned).length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as typeof filter)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                    filter === tab.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50'
                  }`}
                >
                  {tab.label} ({tab.count || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-500/20">
                  <div className="text-3xl font-bold text-white">{summary.total_responses}</div>
                  <div className="text-sm text-purple-300/60">Total Prompts</div>
                </div>
                <div className="p-4 rounded-xl bg-green-900/20 border border-green-500/20">
                  <div className="text-3xl font-bold text-green-400">{summary.total_mentioned}</div>
                  <div className="text-sm text-green-300/60">Mentioned</div>
                </div>
                <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/20">
                  <div className="text-3xl font-bold text-red-400">
                    {summary.total_responses - summary.total_mentioned}
                  </div>
                  <div className="text-sm text-red-300/60">Not Mentioned</div>
                </div>
                <div className="p-4 rounded-xl bg-indigo-900/20 border border-indigo-500/20">
                  <div className="text-3xl font-bold text-indigo-400">
                    {(summary.overall_mention_rate * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-indigo-300/60">Mention Rate</div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 pb-8">
            {responsesLoading ? (
              <div className="text-center py-12 text-purple-300">Loading responses...</div>
            ) : (
              <div className="space-y-4">
                {sortedIntents.map((intent) => (
                  <IntentSection
                    key={intent}
                    intent={intent}
                    responses={byIntent![intent]}
                    entityName={entityName}
                    summary={summary?.by_intent[intent]}
                  />
                ))}
              </div>
            )}

            {filteredResponses?.length === 0 && !responsesLoading && (
              <div className="text-center py-12 text-purple-300/60">
                No responses match the current filter.
              </div>
            )}
          </main>
        </>
      )}
    </div>
  )
}
