import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import ARIScoreCard from './components/ARIScoreCard'
import CompetitorComparison from './components/CompetitorComparison'
import ModelBreakdown from './components/ModelBreakdown'
import ExampleResponses from './components/ExampleResponses'
import ResponsesPage from './components/ResponsesPage'
import AddEntityForm from './components/AddEntityForm'
import RickDemo from './components/RickDemo'
import DeliverablesPage from './pages/DeliverablesPage'
import SnapshotPage from './pages/SnapshotPage'
import AuditPage from './pages/AuditPage'
import apiClient, { Entity } from './api/client'

function Dashboard() {
  const queryClient = useQueryClient()
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [calculatingJob, setCalculatingJob] = useState<string | null>(null)
  const [showResponses, setShowResponses] = useState(false)
  const [responsesEntity, setResponsesEntity] = useState<{ id: string; name: string } | null>(null)
  const [autoRunTest, setAutoRunTest] = useState(false)
  const [entityTypeFilter, setEntityTypeFilter] = useState<'company' | 'person'>('company')
  const [battleMode, setBattleMode] = useState(false)
  const [battleEntities, setBattleEntities] = useState<string[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  // Fetch all entities
  const { data: entities, isLoading: entitiesLoading } = useQuery({
    queryKey: ['entities'],
    queryFn: () => apiClient.getEntities(),
  })

  // Get filtered entities based on type
  const filteredEntities = entities?.filter(e => e.type === entityTypeFilter) || []

  // Set default selected entity when filter or entities change
  useEffect(() => {
    if (filteredEntities.length > 0) {
      // Select first entity of the current type if none selected or wrong type
      const currentEntity = entities?.find(e => e.id === selectedEntityId)
      if (!selectedEntityId || !currentEntity || currentEntity.type !== entityTypeFilter) {
        setSelectedEntityId(filteredEntities[0].id)
      }
    }
  }, [entities, entityTypeFilter, filteredEntities, selectedEntityId])

  // Find selected entity
  const selectedEntity = entities?.find(e => e.id === selectedEntityId)

  // Fetch scores for all filtered entities (may 404 if not calculated yet)
  const scoreQueries = useQueries({
    queries: filteredEntities.map((entity) => ({
      queryKey: ['score', entity.id],
      queryFn: () => apiClient.getScore(entity.id),
      enabled: !!entity.id,
      retry: false,
    })),
  })

  // Get score and loading state for the selected entity
  const selectedEntityIndex = filteredEntities.findIndex(e => e.id === selectedEntityId)
  const scoreQuery = selectedEntityIndex >= 0 ? scoreQueries[selectedEntityIndex] : null
  const score = scoreQuery?.data
  const scoreLoading = scoreQuery?.isLoading ?? false
  const scoreError = scoreQuery?.error

  // Build array of all entities with their scores for the comparison chart
  // Real ARI scores from entity-test endpoint (content syndication questions)
  const competitorPlaceholders = entityTypeFilter === 'company' ? [
    { id: 'placeholder-pr-newswire', name: 'PR Newswire', score: 52.0, isSelected: false },
    { id: 'placeholder-cision', name: 'Cision', score: 46.0, isSelected: false },
  ] : []

  // Override NewsUSA and NAPS scores with real entity-test results
  const realScoreOverrides: Record<string, number> = {
    'NewsUSA': 32.0,
    'NAPS': 0.0,
  }

  const allEntityScores = [
    ...filteredEntities.map((entity, index) => ({
      id: entity.id,
      name: entity.name,
      // Use real score overrides if available, otherwise fall back to API score
      score: realScoreOverrides[entity.name] ?? scoreQueries[index]?.data?.overall_score ?? 0,
      isSelected: entity.id === selectedEntityId,
    })),
    ...competitorPlaceholders.filter(p =>
      !filteredEntities.some(e => e.name === p.name)
    ),
  ]

  // Handle clicking on a company in the competitive analysis
  const handleEntityClick = (entity: { id?: string; name: string; score: number }) => {
    if (entity.id) {
      setResponsesEntity({ id: entity.id, name: entity.name })
      setShowResponses(true)
    }
  }

  // Poll for calculation status
  const { data: jobStatus } = useQuery({
    queryKey: ['job', calculatingJob],
    queryFn: () => apiClient.getCalculationStatus(calculatingJob!),
    enabled: !!calculatingJob,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'completed' || status === 'failed') {
        return false
      }
      return 1000 // Poll every second
    },
  })

  // Handle job completion
  useEffect(() => {
    if (jobStatus?.status === 'completed') {
      queryClient.invalidateQueries({ queryKey: ['score'] })
      setCalculatingJob(null)
    } else if (jobStatus?.status === 'failed') {
      setCalculatingJob(null)
    }
  }, [jobStatus, queryClient])

  // Calculate score mutation
  const calculateMutation = useMutation({
    mutationFn: (entityId: string) => apiClient.calculateScore(entityId),
    onSuccess: (data) => {
      setCalculatingJob(data.job_id)
    },
  })

  const handleCalculate = () => {
    if (selectedEntityId) {
      calculateMutation.mutate(selectedEntityId)
    }
  }

  // Handle entity creation - navigate to test page and auto-run
  const handleEntityCreated = (entity: Entity) => {
    setShowAddForm(false)
    setEntityTypeFilter(entity.type as 'company' | 'person')
    setResponsesEntity({ id: entity.id, name: entity.name })
    setAutoRunTest(true)
    setShowResponses(true)
  }

  const isCalculating = !!calculatingJob
  const hasScore = !!score && !scoreError
  const noScoreYet = scoreError && !scoreLoading

  if (entitiesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0a1f] via-[#1a1333] to-[#0f0a1f] flex items-center justify-center">
        <div className="text-purple-300 text-lg">Loading entities...</div>
      </div>
    )
  }

  // Show Responses Page
  if (showResponses && responsesEntity) {
    return (
      <ResponsesPage
        entityId={responsesEntity.id}
        entityName={responsesEntity.name}
        autoRunTest={autoRunTest}
        onBack={() => {
          setShowResponses(false)
          setResponsesEntity(null)
          setAutoRunTest(false)
        }}
      />
    )
  }

  // Show Pitch Deck Demo
  if (showDemo) {
    return <RickDemo onExit={() => setShowDemo(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a1f] via-[#1a1333] to-[#0f0a1f]">
      {/* Header */}
      <header className="border-b border-purple-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">
              ARI
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">AI Recommendation Index</h1>
              <p className="text-xs text-purple-300/60">Does AI recommend your brand?</p>
            </div>
            <button
              onClick={() => setShowDemo(true)}
              className="ml-4 px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:from-pink-500 hover:to-rose-500 transition-all"
            >
              Pitch Deck
            </button>
            <a
              href="/deliverables"
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 transition-all"
            >
              Deliverables
            </a>
            <a
              href="/snapshot"
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 transition-all"
            >
              AI Snapshot
            </a>
            <a
              href="/audit"
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 transition-all"
            >
              Full Audit
            </a>
          </div>

          <div className="flex items-center gap-4">
            {/* Entity Type Dropdown */}
            <select
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value as 'company' | 'person')
                setBattleEntities([])
              }}
              className="px-3 py-2 rounded-lg bg-purple-900/40 text-purple-200 border border-purple-500/30 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="company">🏢 Companies</option>
              <option value="person">👤 People</option>
            </select>

            {/* Battle Mode Toggle */}
            <button
              onClick={() => {
                setBattleMode(!battleMode)
                if (!battleMode && selectedEntityId) {
                  setBattleEntities([selectedEntityId])
                }
              }}
              className={`px-3 py-2 rounded-lg font-medium transition-all ${
                battleMode
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                  : 'bg-purple-900/40 text-purple-300 border border-purple-500/30 hover:bg-purple-900/60'
              }`}
            >
              ⚔️ Battle Mode
            </button>

            {/* Add Entity Button */}
            <button
              onClick={() => setShowAddForm(true)}
              className="px-3 py-2 rounded-lg font-medium bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 transition-all"
            >
              + Add Entity
            </button>

            {/* Entity Selector - Single or Multi-select based on battle mode */}
            {!battleMode ? (
              <select
                value={selectedEntityId || ''}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="px-4 py-2 rounded-lg bg-purple-900/40 text-purple-200 border border-purple-500/30 focus:outline-none focus:border-indigo-500 cursor-pointer min-w-[150px]"
              >
                {filteredEntities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex gap-2">
                {filteredEntities.map((entity) => (
                  <button
                    key={entity.id}
                    onClick={() => {
                      if (battleEntities.includes(entity.id)) {
                        setBattleEntities(battleEntities.filter(id => id !== entity.id))
                      } else {
                        setBattleEntities([...battleEntities, entity.id])
                      }
                    }}
                    className={`px-3 py-2 rounded-lg font-medium transition-all ${
                      battleEntities.includes(entity.id)
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                        : 'bg-purple-900/40 text-purple-300 border border-purple-500/30 hover:bg-purple-900/60'
                    }`}
                  >
                    {entity.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Battle Mode Comparison View */}
        {battleMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-2xl p-6 border border-orange-500/30">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                ⚔️ Battle Mode: {entityTypeFilter === 'company' ? 'Company' : 'Person'} Comparison
              </h2>

              {battleEntities.length === 0 ? (
                <p className="text-orange-200/80">Select entities above to compare them head-to-head.</p>
              ) : (
                <div className="space-y-6">
                  {/* Battle comparison bar chart */}
                  <div className="grid gap-4">
                    {battleEntities.map((entityId) => {
                      const entity = filteredEntities.find(e => e.id === entityId)
                      const entityScore = allEntityScores.find(s => s.id === entityId)
                      if (!entity || !entityScore) return null

                      return (
                        <div key={entityId} className="flex items-center gap-4">
                          <div className="w-32 text-right">
                            <button
                              onClick={() => {
                                setResponsesEntity({ id: entityId, name: entity.name })
                                setShowResponses(true)
                              }}
                              className="text-white font-medium hover:text-orange-300 transition-colors"
                            >
                              {entity.name}
                            </button>
                          </div>
                          <div className="flex-1 bg-purple-900/40 rounded-full h-8 relative overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${entityScore.score}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {entityScore.score.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Winner announcement */}
                  {battleEntities.length >= 2 && (() => {
                    const battleScores = battleEntities
                      .map(id => allEntityScores.find(s => s.id === id))
                      .filter(Boolean)
                    const winner = battleScores.reduce((a, b) =>
                      (a?.score || 0) > (b?.score || 0) ? a : b
                    )
                    const entity = filteredEntities.find(e => e.id === winner?.id)

                    return (
                      <div className="text-center p-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-xl border border-yellow-500/30">
                        <span className="text-2xl">🏆</span>
                        <h3 className="text-xl font-bold text-yellow-300">
                          {entity?.name} leads with {winner?.score.toFixed(1)} ARI
                        </h3>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Calculate Score Section - shown when no score exists */}
        {!battleMode && noScoreYet && !isCalculating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-8 rounded-2xl bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/20 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              No ARI Score Yet for {selectedEntity?.name}
            </h2>
            <p className="text-purple-200/80 mb-6 max-w-lg mx-auto">
              Calculate the AI Recommendation Index by querying multiple AI models with our prompt matrix.
              This will take a few minutes.
            </p>
            <button
              onClick={handleCalculate}
              disabled={calculateMutation.isPending}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {calculateMutation.isPending ? 'Starting...' : 'Calculate ARI Score'}
            </button>
          </motion.div>
        )}

        {/* Calculating Progress */}
        {!battleMode && isCalculating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-8 rounded-2xl bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/20 text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <h2 className="text-2xl font-bold text-white">
                Calculating ARI Score...
              </h2>
            </div>
            <p className="text-purple-200/80 mb-2">
              {jobStatus?.message || 'Initializing...'}
            </p>
            <p className="text-purple-400/60 text-sm">
              Status: {jobStatus?.status || 'pending'}
            </p>
          </motion.div>
        )}

        {/* Score Display - shown when score exists */}
        {!battleMode && hasScore && (
          <div className="grid gap-6">
            {/* Top Row: Score Card + Competitor Comparison */}
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                key={selectedEntityId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <ARIScoreCard
                  entityName={score.entity_name}
                  score={score.overall_score}
                  mentionRate={score.mention_rate}
                  totalPrompts={score.total_prompts}
                  onNameClick={() => {
                    if (selectedEntityId && selectedEntity) {
                      setResponsesEntity({ id: selectedEntityId, name: selectedEntity.name })
                      setShowResponses(true)
                    }
                  }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <CompetitorComparison entities={allEntityScores} onEntityClick={handleEntityClick} />
              </motion.div>
            </div>

            {/* Middle Row: Model Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ModelBreakdown
                entityName={score.entity_name}
                providerScores={score.provider_scores}
              />
            </motion.div>

            {/* Bottom Row: Example Responses */}
            {score.sample_responses && score.sample_responses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <ExampleResponses
                  entityName={score.entity_name}
                  responses={score.sample_responses}
                />
              </motion.div>
            )}

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex justify-center gap-4"
            >
              <button
                onClick={() => {
                  if (selectedEntityId && selectedEntity) {
                    setResponsesEntity({ id: selectedEntityId, name: selectedEntity.name })
                    setShowResponses(true)
                  }
                }}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-500 transition-all"
              >
                View All {score.total_prompts} Responses
              </button>
              <button
                onClick={handleCalculate}
                disabled={isCalculating}
                className="px-6 py-3 bg-purple-900/30 text-purple-300 font-medium rounded-lg hover:bg-purple-900/50 transition-all disabled:opacity-50"
              >
                Recalculate Score
              </button>
            </motion.div>
          </div>
        )}

        {/* Loading state */}
        {!battleMode && scoreLoading && !noScoreYet && (
          <div className="text-center py-12">
            <div className="text-purple-300">Loading score...</div>
          </div>
        )}

        {/* Footer insight teaser */}
        {!battleMode && hasScore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 p-4 rounded-lg bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-purple-500/20"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h4 className="font-semibold text-white mb-1">Insight</h4>
                <p className="text-purple-200/80 text-sm">
                  <strong>{score.entity_name}</strong> was mentioned in {score.mentions_count} out of {score.total_prompts} AI responses
                  ({(score.mention_rate * 100).toFixed(0)}% mention rate).
                  {Object.keys(score.provider_scores).length > 1 && (
                    <> Score varies by {Math.max(...Object.values(score.provider_scores)) - Math.min(...Object.values(score.provider_scores))} points across AI models.</>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-900/30 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-purple-400/60 text-sm">
          ARI - AI Recommendation Index | Phase 1 Demo | © 2024
        </div>
      </footer>

      {/* Add Entity Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAddForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
            >
              <AddEntityForm
                onEntityCreated={handleEntityCreated}
                onClose={() => setShowAddForm(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/snapshot" element={<SnapshotPage />} />
      <Route path="/audit" element={<AuditPage />} />
      <Route path="/deliverables" element={<DeliverablesPage />} />
      <Route path="/deliverables/:slug" element={<DeliverablesPage />} />
      <Route path="/deliverables/:slug/:doc" element={<DeliverablesPage />} />
    </Routes>
  )
}

export default App
