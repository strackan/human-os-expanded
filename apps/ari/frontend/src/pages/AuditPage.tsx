import { useState, useRef, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  startAuditAnalysis,
  getAuditDownloadUrl,
  type AuditEvent,
  type BrandProfile,
  type ScoringData,
  type AntiPattern,
  type GapAnalysis,
  type AuditReport,
  type DomainValidation,
  type AuditPromptStart,
} from '../api/audit'

type Step = 'input' | 'discovery' | 'profile' | 'analysis' | 'scoring' | 'patterns' | 'report' | 'download'

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'from-red-600 to-red-700',
  poor: 'from-orange-600 to-orange-700',
  below_avg: 'from-amber-600 to-amber-700',
  moderate: 'from-yellow-600 to-yellow-700',
  good: 'from-lime-600 to-green-600',
  strong: 'from-green-600 to-emerald-600',
  dominant: 'from-emerald-600 to-teal-600',
}

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Critical (0-15)',
  poor: 'Poor (16-30)',
  below_avg: 'Below Average (31-45)',
  moderate: 'Moderate (46-60)',
  good: 'Good (61-75)',
  strong: 'Strong (76-90)',
  dominant: 'Dominant (91-100)',
}

const DIMENSION_LABELS: Record<string, string> = {
  category_default: 'Category Default',
  use_case: 'Use Case',
  comparison: 'Comparison',
  attribute_specific: 'Attribute Specific',
  gift_social: 'Gift & Social',
  founder_brand: 'Founder & Brand',
  geographic: 'Geographic',
  adjacent_category: 'Adjacent Category',
}

export default function AuditPage() {
  const [searchParams] = useSearchParams()
  const initialDomain = searchParams.get('domain') || ''

  const [step, setStep] = useState<Step>('input')
  const [domain, setDomain] = useState(initialDomain)
  const [error, setError] = useState<string | null>(null)

  const [domainInfo, setDomainInfo] = useState<DomainValidation | null>(null)
  const [profile, setProfile] = useState<BrandProfile | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

  // Analysis progress
  const [analysisCurrent, setAnalysisCurrent] = useState(0)
  const [analysisTotal, setAnalysisTotal] = useState(0)
  const [currentPrompt, setCurrentPrompt] = useState<AuditPromptStart | null>(null)

  // Results
  const [scoring, setScoring] = useState<ScoringData | null>(null)
  const [antiPatterns, setAntiPatterns] = useState<AntiPattern[]>([])
  const [, setGaps] = useState<GapAnalysis[]>([])
  const [report, setReport] = useState<AuditReport | null>(null)
  const [reportStage, setReportStage] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)

  const cleanupRef = useRef<(() => void) | null>(null)

  const handleEvent = useCallback((event: AuditEvent) => {
    switch (event.type) {
      case 'status':
        setStatusMessage(event.message)
        break
      case 'domain_validated':
        setDomainInfo(event.data)
        break
      case 'discovery_complete':
        setStep('discovery')
        break
      case 'profile_complete':
        setProfile(event.data)
        setStep('profile')
        break
      case 'matrix_complete':
        setAnalysisTotal(event.data.total_prompts)
        break
      case 'prompt_start':
        setStep('analysis')
        setCurrentPrompt(event)
        setAnalysisCurrent(event.current)
        setAnalysisTotal(event.total)
        break
      case 'prompt_result':
        setAnalysisCurrent(event.current)
        break
      case 'analysis_complete':
        setStatusMessage('Analysis complete. Scoring...')
        setCurrentPrompt(null)
        break
      case 'scoring_complete':
        setScoring(event.data)
        setStep('scoring')
        break
      case 'anti_patterns_complete':
        setAntiPatterns(event.data.anti_patterns || [])
        setGaps(event.data.gaps || [])
        setStep('patterns')
        break
      case 'report_stage':
        setReportStage(event.stage)
        setStep('report')
        break
      case 'report_complete':
        setReport(event.data)
        break
      case 'pdf_ready':
        setJobId(event.job_id)
        setStep('download')
        break
      case 'error':
        setError(event.message)
        setStep('input')
        break
    }
  }, [])

  const startAnalysis = useCallback((domainStr: string) => {
    setError(null)
    setStep('discovery')
    setStatusMessage('Connecting...')

    if (cleanupRef.current) cleanupRef.current()

    cleanupRef.current = startAuditAnalysis(
      domainStr,
      handleEvent,
      (err) => setError(err.message),
    )
  }, [handleEvent])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleaned = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
    if (!cleaned) return
    setDomain(cleaned)
    startAnalysis(cleaned)
  }

  const handleReset = () => {
    if (cleanupRef.current) cleanupRef.current()
    setStep('input')
    setDomain('')
    setDomainInfo(null)
    setProfile(null)
    setScoring(null)
    setAntiPatterns([])
    setGaps([])
    setReport(null)
    setJobId(null)
    setError(null)
    setAnalysisCurrent(0)
    setAnalysisTotal(0)
    setStatusMessage('')
    setCurrentPrompt(null)
    setReportStage('')
  }

  useEffect(() => {
    return () => { if (cleanupRef.current) cleanupRef.current() }
  }, [])

  // Auto-start if domain was passed via URL param
  useEffect(() => {
    if (initialDomain && step === 'input') {
      startAnalysis(initialDomain)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a1f] via-[#1a1333] to-[#0f0a1f]">
      {/* Header */}
      <header className="border-b border-purple-900/30 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white text-sm">
              ARI
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Full AI Visibility Audit</h1>
              <p className="text-xs text-purple-300/60">8 dimensions | 4 AI models | 60+ prompts</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="/snapshot" className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-900/40 text-purple-300 border border-purple-500/30 hover:bg-purple-900/60 transition-all">
              Free Snapshot
            </a>
            <a href="/" className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-900/40 text-purple-300 border border-purple-500/30 hover:bg-purple-900/60 transition-all">
              Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-500/30 text-red-300"
            >
              {error}
              <button onClick={() => setError(null)} className="ml-4 underline text-sm">Dismiss</button>
            </motion.div>
          )}

          {/* STEP: Input */}
          {step === 'input' && (
            <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-3">Full AI Visibility Audit</h2>
                <p className="text-purple-300/70 max-w-lg mx-auto">
                  Enter your domain for a comprehensive audit across 4 AI models, 8 prompt dimensions,
                  and 60+ targeted prompts. Includes anti-pattern detection and consultant-quality report.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="w-full max-w-md">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="yourdomain.com"
                    className="flex-1 px-4 py-3 rounded-xl bg-purple-900/40 text-white border border-purple-500/30 focus:outline-none focus:border-amber-500 placeholder:text-purple-400/50"
                  />
                  <button
                    type="submit"
                    disabled={!domain.trim()}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:from-amber-500 hover:to-orange-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Run Audit
                  </button>
                </div>
                <p className="text-xs text-purple-400/50 mt-3 text-center">
                  ~5-8 minutes | 60+ prompts | 4 AI models | 8 dimensions
                </p>
              </form>
            </motion.div>
          )}

          {/* STEP: Discovery/Profile loading */}
          {(step === 'discovery' || step === 'profile') && (
            <motion.div key="discovery" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="max-w-2xl mx-auto">
                {domainInfo && (
                  <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/20 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">&#10003;</div>
                      <div>
                        <p className="text-white font-medium text-sm">{domainInfo.title}</p>
                        <p className="text-purple-400/60 text-xs">{domainInfo.domain}</p>
                      </div>
                    </div>
                  </div>
                )}

                {profile ? (
                  <div className="bg-purple-900/30 rounded-2xl p-6 border border-purple-500/20 mb-4">
                    <h3 className="text-lg font-bold text-white mb-2">{profile.company_name}</h3>
                    <p className="text-sm text-purple-300/70 mb-3">{profile.domain} | {profile.industry}</p>
                    <p className="text-purple-200/80 text-sm mb-4">{profile.description}</p>

                    <div className="grid md:grid-cols-2 gap-4">
                      {profile.founders.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-amber-400 uppercase mb-1">Leadership</h4>
                          {profile.founders.map((f, i) => (
                            <p key={i} className="text-sm text-purple-200/70">{f.name} - {f.title}</p>
                          ))}
                        </div>
                      )}
                      {profile.products.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-amber-400 uppercase mb-1">Products</h4>
                          {profile.products.slice(0, 3).map((p, i) => (
                            <p key={i} className="text-sm text-purple-200/70">{p.name}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 text-center">
                      <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-purple-300/70 text-sm">{statusMessage || 'Generating prompt matrix...'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-purple-300">{statusMessage || 'Analyzing website...'}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP: Analysis */}
          {step === 'analysis' && (
            <motion.div key="analysis" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Multi-Model Analysis</h3>
                <div className="flex gap-2">
                  {currentPrompt && (
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-amber-900/40 text-amber-300 border border-amber-500/20 uppercase">
                      {currentPrompt.provider}
                    </span>
                  )}
                  {currentPrompt && (
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-purple-900/40 text-purple-300 border border-purple-500/20">
                      {DIMENSION_LABELS[currentPrompt.dimension] || currentPrompt.dimension}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full mb-6">
                <div className="w-full bg-purple-900/40 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: analysisTotal > 0 ? `${(analysisCurrent / analysisTotal) * 100}%` : '0%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <p className="text-xs text-purple-300/70">{analysisCurrent}/{analysisTotal} prompt-provider pairs</p>
                  <p className="text-xs text-purple-400/50">{profile?.company_name}</p>
                </div>
              </div>

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
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-amber-900/40 text-amber-300 border border-amber-500/20 uppercase tracking-wide">
                        {DIMENSION_LABELS[currentPrompt.dimension] || currentPrompt.dimension}
                      </span>
                      <span className="text-[10px] text-purple-500">{currentPrompt.current} of {currentPrompt.total}</span>
                      <div className="ml-auto w-4 h-4 border-2 border-amber-500/40 border-t-amber-400 rounded-full animate-spin" />
                    </div>
                    {currentPrompt.persona && (
                      <div className="flex gap-1.5 mb-3 flex-wrap">
                        <span className="px-2.5 py-1 text-xs rounded-lg bg-purple-800/50 text-purple-200 border border-purple-500/20 font-medium">
                          {currentPrompt.persona}
                        </span>
                        {currentPrompt.topic && (
                          <>
                            <span className="text-xs text-purple-500 self-center">&times;</span>
                            <span className="px-2.5 py-1 text-xs rounded-lg bg-purple-800/50 text-purple-200 border border-purple-500/20 font-medium">
                              {currentPrompt.topic}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-purple-200/70 italic leading-relaxed">
                      &ldquo;{currentPrompt.prompt_text}&rdquo;
                    </p>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="bg-purple-900/30 rounded-xl p-5 border border-purple-500/20 text-center">
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-purple-400/50">{statusMessage || 'Processing...'}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP: Scoring */}
          {step === 'scoring' && scoring && (
            <motion.div key="scoring" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="inline-block mb-4">
                <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${SEVERITY_COLORS[scoring.severity_band] || 'from-gray-600 to-gray-700'} flex items-center justify-center mx-auto`}>
                  <span className="text-4xl font-bold text-white">{scoring.overall_ari.toFixed(0)}</span>
                </div>
              </motion.div>
              <p className="text-purple-300/70 text-sm mb-1">ARI Score (0-100)</p>
              <p className="text-white font-medium">{profile?.company_name}</p>
              <p className={`text-sm font-semibold mt-1 bg-gradient-to-r ${SEVERITY_COLORS[scoring.severity_band] || ''} bg-clip-text text-transparent`}>
                {SEVERITY_LABELS[scoring.severity_band] || scoring.severity_band}
              </p>

              <div className="grid grid-cols-2 gap-4 mt-6 max-w-md mx-auto">
                <ScoreBar label="Mention Frequency (40%)" value={scoring.mention_frequency} />
                <ScoreBar label="Position Quality (25%)" value={scoring.position_quality} />
                <ScoreBar label="Narrative Accuracy (20%)" value={scoring.narrative_accuracy} />
                <ScoreBar label="Founder Retrieval (15%)" value={scoring.founder_retrieval} />
              </div>

              <div className="mt-4">
                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-purple-400/50">{statusMessage || 'Detecting anti-patterns...'}</p>
              </div>
            </motion.div>
          )}

          {/* STEP: Anti-Patterns */}
          {step === 'patterns' && (
            <motion.div key="patterns" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-white mb-4">Anti-Patterns Detected</h3>

              {antiPatterns.length === 0 ? (
                <p className="text-purple-300/70 text-sm">No anti-patterns detected.</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {antiPatterns.map((ap, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`bg-purple-900/30 rounded-xl p-4 border-l-4 ${
                        ap.severity === 'critical' ? 'border-red-500' :
                        ap.severity === 'high' ? 'border-orange-500' :
                        ap.severity === 'medium' ? 'border-amber-500' : 'border-purple-500'
                      } border border-purple-500/20`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-sm">{ap.display_name}</span>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                          ap.severity === 'critical' ? 'bg-red-900/50 text-red-300' :
                          ap.severity === 'high' ? 'bg-orange-900/50 text-orange-300' :
                          'bg-amber-900/50 text-amber-300'
                        }`}>{ap.severity}</span>
                      </div>
                      <p className="text-purple-300/70 text-xs">{ap.evidence}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="mt-4 text-center">
                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-purple-400/50">{statusMessage || 'Composing report...'}</p>
              </div>
            </motion.div>
          )}

          {/* STEP: Report composing */}
          {step === 'report' && (
            <motion.div key="report" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto text-center">
              <h3 className="text-xl font-bold text-white mb-4">Composing Report</h3>
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

              <div className="flex flex-wrap gap-2 justify-center">
                {['executive_summary', 'core_problem', 'competitive_landscape', 'dimension_analysis', 'recommendations', 'pitch_hook'].map((stage) => (
                  <span
                    key={stage}
                    className={`px-3 py-1 text-xs rounded-lg border ${
                      reportStage === stage
                        ? 'bg-amber-900/40 text-amber-300 border-amber-500/30 animate-pulse'
                        : 'bg-purple-900/30 text-purple-400/50 border-purple-500/10'
                    }`}
                  >
                    {stage.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP: Download (final results) */}
          {step === 'download' && scoring && (
            <motion.div key="download" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Score header */}
              <div className="text-center mb-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }} className="inline-block">
                  <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${SEVERITY_COLORS[scoring.severity_band] || 'from-gray-600 to-gray-700'} flex items-center justify-center mx-auto mb-3`}>
                    <span className="text-4xl font-bold text-white">{scoring.overall_ari.toFixed(0)}</span>
                  </div>
                </motion.div>
                <p className="text-purple-300/70 text-sm">ARI Score (0-100)</p>
                <p className="text-lg text-white font-medium mt-1">{profile?.company_name}</p>
                <p className={`text-sm font-semibold bg-gradient-to-r ${SEVERITY_COLORS[scoring.severity_band] || ''} bg-clip-text text-transparent`}>
                  {SEVERITY_LABELS[scoring.severity_band] || scoring.severity_band}
                </p>
              </div>

              {/* 4-Factor Breakdown */}
              <div className="bg-purple-900/30 rounded-2xl p-6 border border-purple-500/20 mb-6">
                <h3 className="text-lg font-bold text-white mb-4">4-Factor Score Breakdown</h3>
                <div className="grid grid-cols-2 gap-4">
                  <ScoreBar label="Mention Frequency (40%)" value={scoring.mention_frequency} />
                  <ScoreBar label="Position Quality (25%)" value={scoring.position_quality} />
                  <ScoreBar label="Narrative Accuracy (20%)" value={scoring.narrative_accuracy} />
                  <ScoreBar label="Founder Retrieval (15%)" value={scoring.founder_retrieval} />
                </div>
              </div>

              {/* Anti-Patterns */}
              {antiPatterns.length > 0 && (
                <div className="bg-purple-900/30 rounded-2xl p-6 border border-purple-500/20 mb-6">
                  <h3 className="text-lg font-bold text-white mb-3">Anti-Patterns Detected</h3>
                  <div className="space-y-2">
                    {antiPatterns.map((ap, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          ap.severity === 'critical' ? 'bg-red-500' :
                          ap.severity === 'high' ? 'bg-orange-500' :
                          'bg-amber-500'
                        }`} />
                        <span className="text-white text-sm font-medium">{ap.display_name}</span>
                        <span className="text-purple-400/50 text-xs">({ap.severity})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Report preview */}
              {report && (
                <div className="bg-purple-900/30 rounded-2xl p-6 border border-purple-500/20 mb-6">
                  <h3 className="text-lg font-bold text-white mb-3">
                    The Core Problem: {report.core_problem_name}
                  </h3>
                  <div className="text-purple-200/80 text-sm whitespace-pre-line">
                    {report.core_problem.slice(0, 500)}{report.core_problem.length > 500 ? '...' : ''}
                  </div>

                  {report.pitch_hook && (
                    <div className="mt-4 bg-purple-900/50 rounded-xl p-4 border border-amber-500/20">
                      <h4 className="text-xs font-semibold text-amber-400 uppercase mb-2">The Pitch</h4>
                      <p className="text-purple-200/90 text-sm italic">{report.pitch_hook}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Download */}
              {jobId && (
                <div className="text-center mt-8">
                  <div className="flex justify-center gap-4">
                    <a
                      href={getAuditDownloadUrl(jobId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:from-amber-500 hover:to-orange-500 transition-all inline-block"
                    >
                      Download Full Audit PDF
                    </a>
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 rounded-xl bg-purple-900/40 text-purple-300 border border-purple-500/30 hover:bg-purple-900/60 transition-all"
                    >
                      Run Another
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-purple-400/70 mb-1">{label}</p>
      <div className="w-full bg-purple-900/40 rounded-full h-4 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <p className="text-xs text-white font-medium mt-0.5">{value.toFixed(0)}</p>
    </div>
  )
}
