"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
} from "@/lib/audit-client";

type Step =
  | "input"
  | "discovery"
  | "profile"
  | "analysis"
  | "scoring"
  | "patterns"
  | "report"
  | "download";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "from-red-600 to-red-700",
  poor: "from-orange-600 to-orange-700",
  below_avg: "from-amber-600 to-amber-700",
  moderate: "from-yellow-600 to-yellow-700",
  good: "from-lime-600 to-green-600",
  strong: "from-green-600 to-emerald-600",
  dominant: "from-emerald-600 to-teal-600",
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: "Critical (0-15)",
  poor: "Poor (16-30)",
  below_avg: "Below Average (31-45)",
  moderate: "Moderate (46-60)",
  good: "Good (61-75)",
  strong: "Strong (76-90)",
  dominant: "Dominant (91-100)",
};

const DIMENSION_LABELS: Record<string, string> = {
  category_default: "Category Default",
  use_case: "Use Case",
  comparison: "Comparison",
  attribute_specific: "Attribute Specific",
  gift_social: "Gift & Social",
  founder_brand: "Founder & Brand",
  geographic: "Geographic",
  adjacent_category: "Adjacent Category",
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="h-4 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-orange-500 transition-all duration-1000 ease-out"
          style={{ width: mounted ? `${Math.min(value, 100)}%` : "0%" }}
        />
      </div>
      <p className="mt-0.5 text-xs font-medium text-foreground">
        {value.toFixed(0)}
      </p>
    </div>
  );
}

export default function AuditPage() {
  const searchParams = useSearchParams();
  const initialDomain = searchParams.get("domain") || "";

  const [step, setStep] = useState<Step>("input");
  const [domain, setDomain] = useState(initialDomain);
  const [error, setError] = useState<string | null>(null);

  const [domainInfo, setDomainInfo] = useState<DomainValidation | null>(null);
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const [analysisCurrent, setAnalysisCurrent] = useState(0);
  const [analysisTotal, setAnalysisTotal] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState<AuditPromptStart | null>(
    null,
  );

  const [scoring, setScoring] = useState<ScoringData | null>(null);
  const [antiPatterns, setAntiPatterns] = useState<AntiPattern[]>([]);
  const [, setGaps] = useState<GapAnalysis[]>([]);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [reportStage, setReportStage] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);

  const cleanupRef = useRef<(() => void) | null>(null);

  const handleEvent = useCallback((event: AuditEvent) => {
    switch (event.type) {
      case "status":
        setStatusMessage(event.message);
        break;
      case "domain_validated":
        setDomainInfo(event.data);
        break;
      case "discovery_complete":
        setStep("discovery");
        break;
      case "profile_complete":
        setProfile(event.data);
        setStep("profile");
        break;
      case "matrix_complete":
        setAnalysisTotal(event.data.total_prompts);
        break;
      case "prompt_start":
        setStep("analysis");
        setCurrentPrompt(event);
        setAnalysisCurrent(event.current);
        setAnalysisTotal(event.total);
        break;
      case "prompt_result":
        setAnalysisCurrent(event.current);
        break;
      case "analysis_complete":
        setStatusMessage("Analysis complete. Scoring...");
        setCurrentPrompt(null);
        break;
      case "scoring_complete":
        setScoring(event.data);
        setStep("scoring");
        break;
      case "anti_patterns_complete":
        setAntiPatterns(event.data.anti_patterns || []);
        setGaps(event.data.gaps || []);
        setStep("patterns");
        break;
      case "report_stage":
        setReportStage(event.stage);
        setStep("report");
        break;
      case "report_complete":
        setReport(event.data);
        break;
      case "pdf_ready":
        setJobId(event.job_id);
        setStep("download");
        break;
      case "error":
        setError(event.message);
        setStep("input");
        break;
    }
  }, []);

  const startAnalysis = useCallback(
    (domainStr: string) => {
      setError(null);
      setStep("discovery");
      setStatusMessage("Connecting...");

      if (cleanupRef.current) cleanupRef.current();

      cleanupRef.current = startAuditAnalysis(domainStr, handleEvent, (err) =>
        setError(err.message),
      );
    },
    [handleEvent],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = domain
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    if (!cleaned) return;
    setDomain(cleaned);
    startAnalysis(cleaned);
  };

  const handleReset = () => {
    if (cleanupRef.current) cleanupRef.current();
    setStep("input");
    setDomain("");
    setDomainInfo(null);
    setProfile(null);
    setScoring(null);
    setAntiPatterns([]);
    setGaps([]);
    setReport(null);
    setJobId(null);
    setError(null);
    setAnalysisCurrent(0);
    setAnalysisTotal(0);
    setStatusMessage("");
    setCurrentPrompt(null);
    setReportStage("");
  };

  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  // Auto-start if domain was passed via URL param
  useEffect(() => {
    if (initialDomain && step === "input") {
      startAnalysis(initialDomain);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STEP: Input */}
      {step === "input" && (
        <div className="flex flex-col items-center">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold text-foreground">
              Full AI Visibility Audit
            </h2>
            <p className="mx-auto max-w-lg text-muted-foreground">
              Enter your domain for a comprehensive audit across 4 AI models, 8
              prompt dimensions, and 60+ targeted prompts. Includes anti-pattern
              detection and consultant-quality report.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <div className="flex gap-3">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yourdomain.com"
                className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                disabled={!domain.trim()}
                className="rounded-xl bg-accent px-6 py-3 font-semibold text-white transition-all hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Run Audit
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              ~5-8 minutes | 60+ prompts | 4 AI models | 8 dimensions
            </p>
          </form>
        </div>
      )}

      {/* STEP: Discovery/Profile loading */}
      {(step === "discovery" || step === "profile") && (
        <div className="mx-auto max-w-2xl">
          {domainInfo && (
            <div className="mb-4 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-xs font-bold text-white">
                  ✓
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {domainInfo.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {domainInfo.domain}
                  </p>
                </div>
              </div>
            </div>
          )}

          {profile ? (
            <div className="mb-4 rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-2 text-lg font-bold text-foreground">
                {profile.company_name}
              </h3>
              <p className="mb-3 text-sm text-muted-foreground">
                {profile.domain} | {profile.industry}
              </p>
              <p className="mb-4 text-sm text-foreground/80">
                {profile.description}
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                {profile.founders.length > 0 && (
                  <div>
                    <h4 className="mb-1 text-xs font-semibold uppercase text-accent">
                      Leadership
                    </h4>
                    {profile.founders.map((f, i) => (
                      <p key={i} className="text-sm text-foreground/70">
                        {f.name} - {f.title}
                      </p>
                    ))}
                  </div>
                )}
                {profile.products.length > 0 && (
                  <div>
                    <h4 className="mb-1 text-xs font-semibold uppercase text-accent">
                      Products
                    </h4>
                    {profile.products.slice(0, 3).map((p, i) => (
                      <p key={i} className="text-sm text-foreground/70">
                        {p.name}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-3 text-center">
                <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                <p className="text-sm text-muted-foreground">
                  {statusMessage || "Generating prompt matrix..."}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <p className="text-muted-foreground">
                {statusMessage || "Analyzing website..."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* STEP: Analysis */}
      {step === "analysis" && (
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground">
              Multi-Model Analysis
            </h3>
            <div className="flex gap-2">
              {currentPrompt && (
                <span className="rounded border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase text-accent">
                  {currentPrompt.provider}
                </span>
              )}
              {currentPrompt && (
                <span className="rounded border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {DIMENSION_LABELS[currentPrompt.dimension] ||
                    currentPrompt.dimension}
                </span>
              )}
            </div>
          </div>

          <div className="mb-6 w-full">
            <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-orange-500 transition-all duration-300"
                style={{
                  width:
                    analysisTotal > 0
                      ? `${(analysisCurrent / analysisTotal) * 100}%`
                      : "0%",
                }}
              />
            </div>
            <div className="mt-1.5 flex justify-between">
              <p className="text-xs text-muted-foreground">
                {analysisCurrent}/{analysisTotal} prompt-provider pairs
              </p>
              <p className="text-xs text-muted-foreground/60">
                {profile?.company_name}
              </p>
            </div>
          </div>

          {currentPrompt ? (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
                  {DIMENSION_LABELS[currentPrompt.dimension] ||
                    currentPrompt.dimension}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {currentPrompt.current} of {currentPrompt.total}
                </span>
                <div className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-accent/40 border-t-accent" />
              </div>
              {currentPrompt.persona && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <span className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
                    {currentPrompt.persona}
                  </span>
                  {currentPrompt.topic && (
                    <>
                      <span className="self-center text-xs text-muted-foreground">
                        &times;
                      </span>
                      <span className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
                        {currentPrompt.topic}
                      </span>
                    </>
                  )}
                </div>
              )}
              <p className="text-sm italic leading-relaxed text-foreground/70">
                &ldquo;{currentPrompt.prompt_text}&rdquo;
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <p className="text-xs text-muted-foreground/60">
                {statusMessage || "Processing..."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* STEP: Scoring */}
      {step === "scoring" && scoring && (
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-block animate-in fade-in zoom-in duration-500">
            <div
              className={`mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br ${SEVERITY_COLORS[scoring.severity_band] || "from-gray-600 to-gray-700"}`}
            >
              <span className="text-4xl font-bold text-white">
                {scoring.overall_ari.toFixed(0)}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">ARI Score (0-100)</p>
          <p className="font-medium text-foreground">
            {profile?.company_name}
          </p>
          <p
            className={`mt-1 bg-gradient-to-r bg-clip-text text-sm font-semibold text-transparent ${SEVERITY_COLORS[scoring.severity_band] || ""}`}
          >
            {SEVERITY_LABELS[scoring.severity_band] || scoring.severity_band}
          </p>

          <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-4">
            <ScoreBar
              label="Mention Frequency (40%)"
              value={scoring.mention_frequency}
            />
            <ScoreBar
              label="Position Quality (25%)"
              value={scoring.position_quality}
            />
            <ScoreBar
              label="Narrative Accuracy (20%)"
              value={scoring.narrative_accuracy}
            />
            <ScoreBar
              label="Founder Retrieval (15%)"
              value={scoring.founder_retrieval}
            />
          </div>

          <div className="mt-4">
            <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-xs text-muted-foreground/60">
              {statusMessage || "Detecting anti-patterns..."}
            </p>
          </div>
        </div>
      )}

      {/* STEP: Anti-Patterns */}
      {step === "patterns" && (
        <div className="mx-auto max-w-2xl">
          <h3 className="mb-4 text-xl font-bold text-foreground">
            Anti-Patterns Detected
          </h3>

          {antiPatterns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No anti-patterns detected.
            </p>
          ) : (
            <div className="mb-6 space-y-3">
              {antiPatterns.map((ap, i) => (
                <div
                  key={i}
                  className={`rounded-xl border border-border bg-card p-4 ${
                    ap.severity === "critical"
                      ? "border-l-4 border-l-red-500"
                      : ap.severity === "high"
                        ? "border-l-4 border-l-orange-500"
                        : ap.severity === "medium"
                          ? "border-l-4 border-l-amber-500"
                          : "border-l-4 border-l-border"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {ap.display_name}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        ap.severity === "critical"
                          ? "bg-red-500/20 text-red-400"
                          : ap.severity === "high"
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {ap.severity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{ap.evidence}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 text-center">
            <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-xs text-muted-foreground/60">
              {statusMessage || "Composing report..."}
            </p>
          </div>
        </div>
      )}

      {/* STEP: Report composing */}
      {step === "report" && (
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="mb-4 text-xl font-bold text-foreground">
            Composing Report
          </h3>
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />

          <div className="flex flex-wrap justify-center gap-2">
            {[
              "executive_summary",
              "core_problem",
              "competitive_landscape",
              "dimension_analysis",
              "recommendations",
              "pitch_hook",
            ].map((stage) => (
              <span
                key={stage}
                className={`rounded-lg border px-3 py-1 text-xs ${
                  reportStage === stage
                    ? "animate-pulse border-accent/30 bg-accent/10 text-accent"
                    : "border-border bg-secondary text-muted-foreground/50"
                }`}
              >
                {stage.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* STEP: Download (final results) */}
      {step === "download" && scoring && (
        <div>
          {/* Score header */}
          <div className="mb-8 text-center">
            <div className="mb-3 inline-block animate-in fade-in zoom-in duration-500">
              <div
                className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br ${SEVERITY_COLORS[scoring.severity_band] || "from-gray-600 to-gray-700"}`}
              >
                <span className="text-4xl font-bold text-white">
                  {scoring.overall_ari.toFixed(0)}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">ARI Score (0-100)</p>
            <p className="mt-1 text-lg font-medium text-foreground">
              {profile?.company_name}
            </p>
            <p
              className={`bg-gradient-to-r bg-clip-text text-sm font-semibold text-transparent ${SEVERITY_COLORS[scoring.severity_band] || ""}`}
            >
              {SEVERITY_LABELS[scoring.severity_band] || scoring.severity_band}
            </p>
          </div>

          {/* 4-Factor Breakdown */}
          <div className="mb-6 rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-bold text-foreground">
              4-Factor Score Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <ScoreBar
                label="Mention Frequency (40%)"
                value={scoring.mention_frequency}
              />
              <ScoreBar
                label="Position Quality (25%)"
                value={scoring.position_quality}
              />
              <ScoreBar
                label="Narrative Accuracy (20%)"
                value={scoring.narrative_accuracy}
              />
              <ScoreBar
                label="Founder Retrieval (15%)"
                value={scoring.founder_retrieval}
              />
            </div>
          </div>

          {/* Anti-Patterns */}
          {antiPatterns.length > 0 && (
            <div className="mb-6 rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-3 text-lg font-bold text-foreground">
                Anti-Patterns Detected
              </h3>
              <div className="space-y-2">
                {antiPatterns.map((ap, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        ap.severity === "critical"
                          ? "bg-red-500"
                          : ap.severity === "high"
                            ? "bg-orange-500"
                            : "bg-amber-500"
                      }`}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {ap.display_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({ap.severity})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report preview */}
          {report && (
            <div className="mb-6 rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-3 text-lg font-bold text-foreground">
                The Core Problem: {report.core_problem_name}
              </h3>
              <div className="whitespace-pre-line text-sm text-foreground/80">
                {report.core_problem.slice(0, 500)}
                {report.core_problem.length > 500 ? "..." : ""}
              </div>

              {report.pitch_hook && (
                <div className="mt-4 rounded-xl border border-accent/20 bg-secondary p-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase text-accent">
                    The Pitch
                  </h4>
                  <p className="text-sm italic text-foreground/90">
                    {report.pitch_hook}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Download */}
          {jobId && (
            <div className="mt-8 text-center">
              <div className="flex justify-center gap-4">
                <a
                  href={getAuditDownloadUrl(jobId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-xl bg-accent px-8 py-3 font-semibold text-white transition-all hover:bg-accent/90"
                >
                  Download Full Audit PDF
                </a>
                <button
                  onClick={handleReset}
                  className="rounded-xl border border-border bg-card px-6 py-3 text-foreground transition-all hover:bg-secondary"
                >
                  Run Another
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
