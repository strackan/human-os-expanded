import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  startLiteAnalysis,
  getDownloadUrl,
  type DiscoveryResult,
  type LiteReportEvent,
  type SynthesisData,
  type CompetitorScore,
  type DomainValidation,
  type PromptStart,
  type PromptResult,
} from '../api/liteReport'

type Step = 'input' | 'discovery' | 'analysis' | 'results' | 'download'

export default function SnapshotPage() {
  const [step, setStep] = useState<Step>('input')
  const [domain, setDomain] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Domain validation state
  const [domainInfo, setDomainInfo] = useState<DomainValidation | null>(null)

  // Discovery state
  const [discovery, setDiscovery] = useState<DiscoveryResult | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editDiscovery, setEditDiscovery] = useState<DiscoveryResult | null>(null)

  // Analysis state
  const [analysisCurrent, setAnalysisCurrent] = useState(0)
  const [analysisTotal, setAnalysisTotal] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [currentPrompt, setCurrentPrompt] = useState<PromptStart | null>(null)
  const [, setPromptResults] = useState<PromptResult[]>([])

  // Results state
  const [synthesisData, setSynthesisData] = useState<SynthesisData | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)

  const cleanupRef = useRef<(() => void) | null>(null)

  const handleEvent = useCallback((event: LiteReportEvent) => {
    switch (event.type) {
      case 'status':
        setStatusMessage(event.message)
        break

      case 'cache_hit':
        setStatusMessage(event.message)
        break

      case 'domain_validated':
        setDomainInfo(event.data)
        break

      case 'discovery_complete':
        setDiscovery(event.data)
        setEditDiscovery(event.data)
        setStep('discovery')
        break

      case 'prompt_start':
        setStep('analysis')
        setCurrentPrompt(event)
        setAnalysisCurrent(event.current)
        setAnalysisTotal(event.total)
        break

      case 'prompt_result':
        setPromptResults(prev => [...prev, event])
        setAnalysisCurrent(event.current)
        setAnalysisTotal(event.total)
        break

      case 'analysis_complete':
        setStatusMessage('Analysis complete. Generating insights...')
        setCurrentPrompt(null)
        break

      case 'synthesis_complete':
        setSynthesisData(event.data)
        setStep('results')
        break

      case 'pdf_ready':
        setJobId(event.job_id)
        setStep('download')
        break

      case 'error':
        setError(event.message)
        setStep('input')
        setDomainInfo(null)
        setDiscovery(null)
        setCurrentPrompt(null)
        break
    }
  }, [])

  const startAnalysis = useCallback((domainStr: string, discoveryOverride?: DiscoveryResult) => {
    setError(null)
    setStep('discovery')
    setStatusMessage('Discovering company information...')

    if (cleanupRef.current) cleanupRef.current()

    cleanupRef.current = startLiteAnalysis(
      domainStr,
      handleEvent,
      (err) => setError(err.message),
      discoveryOverride,
    )
  }, [handleEvent])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleaned = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
    if (!cleaned) return
    setDomain(cleaned)
    startAnalysis(cleaned)
  }

  const handleEditSubmit = () => {
    if (!editDiscovery) return
    setIsEditing(false)
    setDiscovery(editDiscovery)
    startAnalysis(editDiscovery.domain, editDiscovery)
  }

  const handleReset = () => {
    if (cleanupRef.current) cleanupRef.current()
    setStep('input')
    setDomain('')
    setDomainInfo(null)
    setDiscovery(null)
    setEditDiscovery(null)
    setSynthesisData(null)
    setJobId(null)
    setError(null)
    setAnalysisCurrent(0)
    setAnalysisTotal(0)
    setStatusMessage('')
    setCurrentPrompt(null)
    setPromptResults([])
  }

  // Auto-advance from discovery to analysis after 3 seconds
  useEffect(() => {
    if (step === 'discovery' && discovery && !isEditing) {
      // The SSE stream auto-advances — no timer needed since the backend
      // continues to analysis phase immediately after discovery
    }
  }, [step, discovery, isEditing])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a1f] via-[#1a1333] to-[#0f0a1f]">
      {/* Header */}
      <header className="border-b border-purple-900/30 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm">
              ARI
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">AI Visibility Snapshot</h1>
              <p className="text-xs text-purple-300/60">Powered by ARI &amp; Gumshoe</p>
            </div>
          </div>
          <a
            href="/"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-900/40 text-purple-300 border border-purple-500/30 hover:bg-purple-900/60 transition-all"
          >
            Back to Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {/* Error banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-500/30 text-red-300"
            >
              {error}
              <button onClick={() => setError(null)} className="ml-4 underline text-sm">
                Dismiss
              </button>
            </motion.div>
          )}

          {/* STEP 1: Input */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-3">
                  Does AI recommend your brand?
                </h2>
                <p className="text-purple-300/70 max-w-lg mx-auto">
                  Enter your domain to get a free AI Visibility Snapshot. We'll analyze how AI models
                  see your brand vs. competitors across key audience personas and topics.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="w-full max-w-md">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="yourdomain.com"
                    className="flex-1 px-4 py-3 rounded-xl bg-purple-900/40 text-white border border-purple-500/30 focus:outline-none focus:border-cyan-500 placeholder:text-purple-400/50"
                  />
                  <button
                    type="submit"
                    disabled={!domain.trim()}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold hover:from-cyan-500 hover:to-blue-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Generate Snapshot
                  </button>
                </div>
                <p className="text-xs text-purple-400/50 mt-3 text-center">
                  ~30 seconds | 20 AI prompts | 4 personas | Free
                </p>
              </form>
            </motion.div>
          )}

          {/* STEP 2: Discovery */}
          {step === 'discovery' && (
            <motion.div
              key="discovery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {!discovery ? (
                <div className="text-center py-12">
                  {domainInfo ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-md mx-auto"
                    >
                      <div className="bg-purple-900/30 rounded-xl p-5 border border-purple-500/20 mb-6 text-left">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                            &#10003;
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{domainInfo.title}</p>
                            <p className="text-purple-400/60 text-xs">{domainInfo.domain}</p>
                          </div>
                        </div>
                        {domainInfo.meta_description && (
                          <p className="text-purple-300/50 text-xs mt-2 line-clamp-2">{domainInfo.meta_description}</p>
                        )}
                      </div>
                      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-purple-300 text-sm">{statusMessage || 'Analyzing website and identifying competitors...'}</p>
                      <div className="flex justify-center gap-2 mt-3">
                        {['Scraping pages', 'Identifying competitors', 'Mapping personas', 'Finding topics'].map((label, i) => (
                          <span key={i} className="px-2 py-0.5 text-[10px] rounded bg-purple-900/40 text-purple-400/50 border border-purple-500/10">
                            {label}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-purple-300">{statusMessage || 'Connecting...'}</p>
                    </>
                  )}
                </div>
              ) : isEditing ? (
                <EditDiscoveryForm
                  discovery={editDiscovery!}
                  onChange={setEditDiscovery}
                  onSubmit={handleEditSubmit}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <div>
                  <div className="bg-purple-900/30 rounded-2xl p-6 border border-purple-500/20 mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{discovery.company_name}</h3>
                        <p className="text-sm text-purple-300/70">{discovery.domain} | {discovery.industry}</p>
                      </div>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-900/40 text-purple-300 border border-purple-500/30 hover:bg-purple-900/60 transition-all"
                      >
                        Edit
                      </button>
                    </div>

                    <p className="text-purple-200/80 text-sm mb-4">{discovery.description}</p>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-purple-400 uppercase mb-2">Competitors</h4>
                        {discovery.competitors.map((c, i) => (
                          <p key={i} className="text-sm text-purple-200/70">{c.name}</p>
                        ))}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-purple-400 uppercase mb-2">Personas</h4>
                        {discovery.personas.map((p, i) => (
                          <p key={i} className="text-sm text-purple-200/70">{p}</p>
                        ))}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-purple-400 uppercase mb-2">Topics</h4>
                        {discovery.topics.map((t, i) => (
                          <p key={i} className="text-sm text-purple-200/70">{t}</p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-purple-300/70 text-sm">Running AI analysis...</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: Analysis */}
          {step === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Running AI Analysis</h3>
                <span className="text-xs text-purple-400/50 bg-purple-900/30 px-2 py-1 rounded border border-purple-500/10">
                  Claude Sonnet 4.6
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full mb-6">
                <div className="w-full bg-purple-900/40 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: analysisTotal > 0 ? `${(analysisCurrent / analysisTotal) * 100}%` : '0%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <p className="text-xs text-purple-300/70">
                    {analysisCurrent}/{analysisTotal} prompts
                  </p>
                  {discovery && (
                    <p className="text-xs text-purple-400/50">
                      {discovery.company_name} vs. {discovery.competitors.slice(0, 3).map(c => c.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Interstitial context message */}
              {currentPrompt && (
                <motion.p
                  key={`interstitial-${currentPrompt.current}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm text-purple-400/60 mb-3"
                >
                  {getInterstitialMessage(currentPrompt)}
                </motion.p>
              )}

              {/* Current prompt card */}
              {currentPrompt ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPrompt.current}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="bg-purple-900/30 rounded-xl p-5 border border-purple-500/20"
                  >
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-cyan-900/40 text-cyan-300 border border-cyan-500/20 uppercase tracking-wide">
                        {STYLE_LABELS[currentPrompt.style] || currentPrompt.style}
                      </span>
                      <span className="text-[10px] text-purple-500">Prompt {currentPrompt.current} of {currentPrompt.total}</span>
                      <div className="ml-auto w-4 h-4 border-2 border-cyan-500/40 border-t-cyan-400 rounded-full animate-spin" />
                    </div>
                    <div className="flex gap-1.5 mb-3 flex-wrap">
                      <span className="px-2.5 py-1 text-xs rounded-lg bg-purple-800/50 text-purple-200 border border-purple-500/20 font-medium">
                        {currentPrompt.persona}
                      </span>
                      <span className="text-xs text-purple-500 self-center">&times;</span>
                      <span className="px-2.5 py-1 text-xs rounded-lg bg-purple-800/50 text-purple-200 border border-purple-500/20 font-medium">
                        {currentPrompt.topic}
                      </span>
                    </div>
                    <p className="text-sm text-purple-200/70 italic leading-relaxed">
                      &ldquo;{currentPrompt.prompt_text}&rdquo;
                    </p>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="bg-purple-900/30 rounded-xl p-5 border border-purple-500/20 text-center">
                  <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-purple-400/50">{statusMessage || 'Preparing prompts...'}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 4: Results */}
          {(step === 'results' || step === 'download') && synthesisData && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* 1. Score header */}
              <div className="text-center mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="inline-block"
                >
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-3">
                    <span className="text-4xl font-bold text-white">
                      {synthesisData.overall_score.toFixed(0)}
                    </span>
                  </div>
                </motion.div>
                <p className="text-purple-300/70 text-sm">ARI Score (0-100)</p>
                <p className="text-lg text-white font-medium mt-1">{discovery?.company_name}</p>
              </div>

              {/* 2. Report title */}
              {synthesisData.report_title && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center mb-8"
                >
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    {synthesisData.report_title}
                  </h2>
                </motion.div>
              )}

              {/* 3. Headline stat */}
              {synthesisData.headline_stat && (
                <div className="mb-8 px-5 py-4 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-xl border border-cyan-500/20 max-w-2xl mx-auto text-center">
                  <p className="text-cyan-300 font-semibold text-lg">{synthesisData.headline_stat}</p>
                </div>
              )}

              {/* 4. Executive summary */}
              {synthesisData.executive_summary && (
                <div className="bg-purple-900/30 rounded-2xl p-6 border border-purple-500/20 mb-6">
                  <h3 className="text-lg font-bold text-white mb-3">Executive Summary</h3>
                  <div className="space-y-3">
                    {synthesisData.executive_summary.split('\n\n').map((paragraph, i) => (
                      <p key={i} className="text-purple-200/80 text-sm leading-relaxed">{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Core Finding callout */}
              {synthesisData.core_finding && (
                <div className="mb-6 rounded-2xl overflow-hidden border border-amber-500/30">
                  <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/40 px-6 py-3">
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Core Finding</p>
                  </div>
                  <div className="bg-amber-900/20 px-6 py-5">
                    <h3 className="text-xl font-bold text-white mb-2">{synthesisData.core_finding}</h3>
                    {synthesisData.core_finding_detail && (
                      <p className="text-purple-200/80 text-sm leading-relaxed">{synthesisData.core_finding_detail}</p>
                    )}
                  </div>
                </div>
              )}

              {/* 6. Competitor landscape */}
              {synthesisData.competitor_scores.length > 0 && (
                <div className="bg-purple-900/30 rounded-2xl p-6 border border-purple-500/20 mb-6">
                  <h3 className="text-lg font-bold text-white mb-4">Competitor Landscape</h3>
                  <CompetitorBars
                    companyName={discovery?.company_name || ''}
                    companyRate={synthesisData.mention_rate}
                    competitors={synthesisData.competitor_scores}
                  />
                </div>
              )}

              {/* 7. Key findings with emoji badges */}
              {synthesisData.key_findings.length > 0 && (
                <div className="bg-purple-900/30 rounded-2xl p-6 border border-purple-500/20 mb-6">
                  <h3 className="text-lg font-bold text-white mb-4">Key Findings</h3>
                  <div className="space-y-3">
                    {synthesisData.key_findings.map((f, i) => (
                      <div key={i} className="flex items-start gap-3 bg-purple-900/20 rounded-xl p-4 border border-purple-500/10">
                        <span className="text-purple-200/90 text-sm leading-relaxed">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 8. Strategic recommendations */}
              {synthesisData.strategic_recommendations && synthesisData.strategic_recommendations.length > 0 && (
                <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/30 rounded-2xl p-6 border border-indigo-500/20 mb-6">
                  <h3 className="text-lg font-bold text-white mb-4">Strategic Recommendations</h3>
                  <div className="space-y-3">
                    {synthesisData.strategic_recommendations.map((rec, i) => {
                      const colonIdx = rec.indexOf(':')
                      const dashIdx = rec.indexOf(' — ')
                      const hasHeader = colonIdx > 0 && colonIdx < 30
                      const verb = hasHeader ? rec.slice(0, colonIdx) : null
                      const rest = hasHeader ? rec.slice(colonIdx + 1).trim() : rec
                      const [title, ...descParts] = dashIdx > 0 ? [rest.split(' — ')[0], rest.split(' — ').slice(1).join(' — ')] : [rest, '']
                      const desc = descParts.join('')

                      return (
                        <div key={i} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-600/40 flex items-center justify-center text-indigo-300 text-xs font-bold border border-indigo-500/30">
                            {i + 1}
                          </span>
                          <div>
                            <p className="text-white text-sm font-medium">
                              {verb && <span className="text-cyan-400 font-bold">{verb}: </span>}
                              {title}
                            </p>
                            {desc && <p className="text-purple-300/60 text-xs mt-1">{desc}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 9. Article teasers */}
              {synthesisData.article_teasers.length > 0 && (
                <div className="bg-purple-900/30 rounded-2xl p-6 border border-purple-500/20 mb-6">
                  <h3 className="text-lg font-bold text-white mb-3">Content Gap Recommendations</h3>
                  <p className="text-purple-300/50 text-xs mb-4">Articles designed to close specific AI visibility gaps</p>
                  <div className="grid gap-3">
                    {synthesisData.article_teasers.map((t, i) => (
                      <div key={i} className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/10">
                        <p className="text-white font-medium text-sm">{t.title}</p>
                        <p className="text-purple-300/60 text-xs mt-1">{t.rationale}</p>
                        <p className="text-cyan-400/70 text-xs mt-1 italic">Addresses: {t.target_gap}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 10. Download section */}
              {step === 'download' && jobId && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mt-8"
                >
                  <div className="flex justify-center gap-4">
                    <a
                      href={getDownloadUrl(jobId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold hover:from-cyan-500 hover:to-blue-500 transition-all inline-block"
                    >
                      Download PDF Report
                    </a>
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 rounded-xl bg-purple-900/40 text-purple-300 border border-purple-500/30 hover:bg-purple-900/60 transition-all"
                    >
                      Run Another
                    </button>
                  </div>

                  {/* Upgrade CTA */}
                  <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 max-w-lg mx-auto text-center">
                    <h4 className="text-white font-semibold mb-2">Want deeper insights?</h4>
                    <p className="text-purple-300/70 text-sm mb-4">
                      Get a full AI Visibility Audit with 60+ prompts across 4 AI models, 8 scoring dimensions,
                      anti-pattern detection, and a consultant-quality narrative report.
                    </p>
                    <a
                      href={`/audit?domain=${encodeURIComponent(domain)}`}
                      className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-500 hover:to-teal-500 transition-all"
                    >
                      Run Full Audit
                    </a>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

const STYLE_LABELS: Record<string, string> = {
  top_5: 'Top 5',
  best: 'Best Pick',
  top_3: 'Top 3',
  compare: 'Compare',
  as_persona: 'Persona View',
  recommend: 'Recommend',
  landscape: 'Landscape',
}

const INTERSTITIAL_TEMPLATES = [
  (p: PromptStart) => `Testing who is best for ${p.topic}...`,
  (p: PromptStart) => `Checking ${p.persona} recommendations...`,
  (p: PromptStart) => `Evaluating ${p.topic} options...`,
  (p: PromptStart) => `What does AI suggest for ${p.persona}?`,
  (p: PromptStart) => `Probing the ${p.topic} landscape...`,
]

function getInterstitialMessage(prompt: PromptStart): string {
  const fn = INTERSTITIAL_TEMPLATES[(prompt.current - 1) % INTERSTITIAL_TEMPLATES.length]
  return fn(prompt)
}

// --- Sub-components ---

function CompetitorBars({
  companyName,
  companyRate,
  competitors,
}: {
  companyName: string
  companyRate: number
  competitors: CompetitorScore[]
}) {
  const all = [
    { name: companyName, rate: companyRate, isCompany: true },
    ...competitors.map((c) => ({ name: c.name, rate: c.mention_rate, isCompany: false })),
  ].sort((a, b) => b.rate - a.rate)

  const maxRate = Math.max(...all.map((a) => a.rate), 0.01)

  return (
    <div className="space-y-3">
      {all.map((item) => (
        <div key={item.name} className="flex items-center gap-3">
          <div className="w-36 text-right">
            <span className={`text-sm ${item.isCompany ? 'text-cyan-300 font-bold' : 'text-purple-200/70'}`}>
              {item.name}
            </span>
          </div>
          <div className="flex-1 bg-purple-900/40 rounded-full h-6 relative overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.rate / maxRate) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                item.isCompany
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  : 'bg-purple-600/60'
              }`}
            />
            <div className="absolute inset-0 flex items-center px-3">
              <span className="text-xs text-white font-medium">
                {(item.rate * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EditDiscoveryForm({
  discovery,
  onChange,
  onSubmit,
  onCancel,
}: {
  discovery: DiscoveryResult
  onChange: (d: DiscoveryResult) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  const updateField = <K extends keyof DiscoveryResult>(key: K, value: DiscoveryResult[K]) => {
    onChange({ ...discovery, [key]: value })
  }

  const updateCompetitor = (idx: number, name: string) => {
    const comps = [...discovery.competitors]
    comps[idx] = { ...comps[idx], name }
    updateField('competitors', comps)
  }

  const updateListItem = (key: 'personas' | 'topics', idx: number, value: string) => {
    const list = [...discovery[key]]
    list[idx] = value
    updateField(key, list)
  }

  return (
    <div className="bg-purple-900/30 rounded-2xl p-6 border border-purple-500/20">
      <h3 className="text-lg font-bold text-white mb-4">Edit Discovery Results</h3>

      <div className="grid gap-4">
        <div>
          <label className="block text-xs font-semibold text-purple-400 uppercase mb-1">Company Name</label>
          <input
            value={discovery.company_name}
            onChange={(e) => updateField('company_name', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-purple-900/40 text-white border border-purple-500/30 focus:outline-none focus:border-cyan-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-purple-400 uppercase mb-1">Industry</label>
          <input
            value={discovery.industry}
            onChange={(e) => updateField('industry', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-purple-900/40 text-white border border-purple-500/30 focus:outline-none focus:border-cyan-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-purple-400 uppercase mb-1">Competitors</label>
          {discovery.competitors.map((c, i) => (
            <input
              key={i}
              value={c.name}
              onChange={(e) => updateCompetitor(i, e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-purple-900/40 text-white border border-purple-500/30 focus:outline-none focus:border-cyan-500 text-sm mb-2"
            />
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-purple-400 uppercase mb-1">Personas</label>
          {discovery.personas.map((p, i) => (
            <input
              key={i}
              value={p}
              onChange={(e) => updateListItem('personas', i, e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-purple-900/40 text-white border border-purple-500/30 focus:outline-none focus:border-cyan-500 text-sm mb-2"
            />
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-purple-400 uppercase mb-1">Topics</label>
          {discovery.topics.map((t, i) => (
            <input
              key={i}
              value={t}
              onChange={(e) => updateListItem('topics', i, e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-purple-900/40 text-white border border-purple-500/30 focus:outline-none focus:border-cyan-500 text-sm mb-2"
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onSubmit}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium hover:from-cyan-500 hover:to-blue-500 transition-all"
        >
          Run Analysis
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2 rounded-lg bg-purple-900/40 text-purple-300 border border-purple-500/30 hover:bg-purple-900/60 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
