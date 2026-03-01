import { useState, useEffect } from "react";
import type { DiscoveryResult, SynthesisData } from "@/lib/lite-report-client";
import { getDownloadUrl, validatePromoCode } from "@/lib/lite-report-client";
import { submitEmailForReport } from "@/app/actions/contact";
import type { Step } from "../lib/constants";
import { ScoreGauge } from "./ScoreGauge";
import { CompetitorBars } from "./CompetitorBars";
import type { EntityContext as EntityContextType, AriHistoryEntry } from "@/lib/humanos-client";

export function ResultsStep({
  step,
  synthesisData,
  discovery,
  isGated,
  jobId,
  pdfAvailable,
  promoCode,
  onPromoCodeChange,
  onUngate,
  onContactClick,
  onReset,
}: {
  step: Step;
  synthesisData: SynthesisData;
  discovery: DiscoveryResult | null;
  isGated: boolean;
  jobId: string | null;
  pdfAvailable: boolean;
  promoCode: string;
  onPromoCodeChange: (value: string) => void;
  onUngate: () => void;
  onContactClick: () => void;
  onReset: () => void;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Score header */}
      <div className="mb-4 text-center">
        <ScoreGauge score={Math.round(synthesisData.overall_score)} />
        <p className="mt-1 text-sm text-muted-foreground">
          ARI Score (0-100)
        </p>
        <p className="mt-1 text-lg font-medium text-foreground">
          {discovery?.company_name}
        </p>
      </div>

      {/* HumanOS Entity Context — additive panel, graceful degradation */}
      <EntityContextPanel domain={discovery?.domain || ""} />

      {/* Report title */}
      {synthesisData.report_title && (
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {synthesisData.report_title}
          </h2>
        </div>
      )}

      {/* Headline stat */}
      {synthesisData.headline_stat && (
        <div className="mx-auto mb-8 max-w-2xl rounded-2xl border border-accent/20 bg-accent/5 px-5 py-4 text-center">
          <p className="text-lg font-semibold text-accent">
            {synthesisData.headline_stat}
          </p>
        </div>
      )}

      {/* Executive summary */}
      {synthesisData.executive_summary && (
        <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-lg font-bold text-foreground">
            Executive Summary
          </h3>
          <div className="space-y-3">
            {synthesisData.executive_summary
              .split("\n\n")
              .map((paragraph, i) => (
                <p
                  key={i}
                  className="text-sm leading-relaxed text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
          </div>
        </div>
      )}

      {/* Core finding */}
      {synthesisData.core_finding && (
        <div className="mb-6 overflow-hidden rounded-3xl border border-accent/30">
          <div className="bg-accent/10 px-6 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Core Finding
            </p>
          </div>
          <div className="bg-accent/5 px-6 py-5">
            <h3 className="mb-2 text-xl font-bold text-foreground">
              {synthesisData.core_finding}
            </h3>
            {synthesisData.core_finding_detail && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {synthesisData.core_finding_detail}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Competitor landscape */}
      {synthesisData.competitor_scores.length > 0 && (
        <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-foreground">
            Competitor Landscape
          </h3>
          <CompetitorBars
            companyName={discovery?.company_name || ""}
            companyRate={synthesisData.mention_rate}
            competitors={synthesisData.competitor_scores}
          />
        </div>
      )}

      {/* Key findings — truncated preview only when gated */}
      {isGated && synthesisData.key_findings.length > 0 && (
        <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-foreground">
            Key Findings
          </h3>
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-secondary/50 p-4">
              <span className="text-sm leading-relaxed text-foreground">
                {synthesisData.key_findings[0].length > 120
                  ? synthesisData.key_findings[0].slice(0, 120) + "..."
                  : synthesisData.key_findings[0]}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Gated content */}
      {isGated ? (
        <GatedOverlay
          synthesisData={synthesisData}
          promoCode={promoCode}
          onPromoCodeChange={onPromoCodeChange}
          onUngate={onUngate}
          onContactClick={onContactClick}
          onReset={onReset}
        />
      ) : (
        <UngatedContent
          step={step}
          synthesisData={synthesisData}
          discovery={discovery}
          jobId={jobId}
          pdfAvailable={pdfAvailable}
          onContactClick={onContactClick}
          onReset={onReset}
        />
      )}
    </div>
  );
}

function GatedOverlay({
  synthesisData,
  promoCode,
  onPromoCodeChange,
  onUngate,
  onContactClick,
  onReset,
}: {
  synthesisData: SynthesisData;
  promoCode: string;
  onPromoCodeChange: (value: string) => void;
  onUngate: () => void;
  onContactClick: () => void;
  onReset: () => void;
}) {
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim();
    if (!code) return;
    setPromoError(null);
    setPromoLoading(true);
    try {
      const valid = await validatePromoCode(code);
      if (valid) {
        onUngate();
      } else {
        setPromoError("Invalid or expired promo code");
      }
    } catch {
      setPromoError("Could not validate code. Please try again.");
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <div className="relative mt-6">
      {/* Real content rendered but blurred for visual depth */}
      <div className="pointer-events-none select-none overflow-hidden max-h-[400px]" aria-hidden="true">
        <div className="blur-sm opacity-60">
          {synthesisData.key_findings.length > 1 && (
            <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-foreground">
                More Findings
              </h3>
              <div className="space-y-3">
                {synthesisData.key_findings.slice(1).map((f, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-secondary/50 p-4"
                  >
                    <span className="text-sm leading-relaxed text-foreground">
                      {f}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {synthesisData.strategic_recommendations &&
            synthesisData.strategic_recommendations.length > 0 && (
              <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-foreground">
                  Strategic Recommendations
                </h3>
                <div className="space-y-3">
                  {synthesisData.strategic_recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent border border-accent/20">
                        {i + 1}
                      </span>
                      <p className="text-sm text-foreground">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {synthesisData.article_teasers.length > 0 && (
            <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-1 text-lg font-bold text-foreground">
                Content Gap Recommendations
              </h3>
              <div className="grid gap-3 mt-4">
                {synthesisData.article_teasers.map((t, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-secondary/50 p-4"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {t.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gradient fade overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />

      {/* CTA card anchored at bottom */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center pb-4">
        <div className="rounded-3xl border border-accent/20 bg-card p-8 shadow-lg text-center max-w-md">
          <h4 className="text-lg font-bold">Unlock Your Full Report</h4>
          <p className="text-sm text-muted-foreground mt-2 mb-4">
            Get strategic recommendations, content gap analysis, and a downloadable PDF report.
          </p>
          <button
            onClick={onContactClick}
            className="inline-block rounded-full bg-accent px-8 py-3 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110"
          >
            Get Full Report
          </button>

          {/* Promo code section */}
          {!showPromoInput ? (
            <button
              onClick={() => setShowPromoInput(true)}
              className="block mx-auto mt-3 text-xs text-muted-foreground hover:text-foreground"
            >
              Have a promo code?
            </button>
          ) : (
            <form onSubmit={handlePromoSubmit} className="mt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    onPromoCodeChange(e.target.value);
                    setPromoError(null);
                  }}
                  placeholder="Enter code"
                  autoFocus
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="submit"
                  disabled={!promoCode.trim() || promoLoading}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {promoLoading ? "..." : "Apply"}
                </button>
              </div>
              {promoError && (
                <p className="mt-2 text-xs text-destructive">{promoError}</p>
              )}
            </form>
          )}

          <button
            onClick={onReset}
            className="block mx-auto mt-3 text-xs text-muted-foreground hover:text-foreground"
          >
            Run Another Domain
          </button>
        </div>
      </div>
    </div>
  );
}

function ShareButton({ jobId }: { jobId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/snapshot/share/${jobId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy share link"
      className="inline-flex items-center justify-center rounded-full border border-border bg-card px-4 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
    >
      {copied ? (
        <>
          <svg className="mr-1.5 h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          Link Copied!
        </>
      ) : (
        <>
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          Share
        </>
      )}
    </button>
  );
}

function UngatedContent({
  step,
  synthesisData,
  discovery,
  jobId,
  pdfAvailable,
  onContactClick,
  onReset,
}: {
  step: Step;
  synthesisData: SynthesisData;
  discovery: DiscoveryResult | null;
  jobId: string | null;
  pdfAvailable: boolean;
  onContactClick: () => void;
  onReset: () => void;
}) {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !jobId) return;
    setEmailError(null);
    setEmailLoading(true);
    try {
      const result = await submitEmailForReport({
        email: email.trim(),
        domain: discovery?.domain || "",
        companyName: discovery?.company_name || "",
        jobId,
        score: synthesisData.overall_score,
        mentionRate: synthesisData.mention_rate,
      });
      if (result.success) {
        setEmailSent(true);
      } else {
        setEmailError(result.error || "Something went wrong.");
      }
    } catch {
      setEmailError("Failed to send. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <>
      {/* Key findings — full list when ungated */}
      {synthesisData.key_findings.length > 0 && (
        <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-foreground">
            Key Findings
          </h3>
          <div className="space-y-3">
            {synthesisData.key_findings.map((f, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-secondary/50 p-4"
              >
                <span className="text-sm leading-relaxed text-foreground">
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategic recommendations */}
      {synthesisData.strategic_recommendations &&
        synthesisData.strategic_recommendations.length > 0 && (
          <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-foreground">
              Strategic Recommendations
            </h3>
            <div className="space-y-3">
              {synthesisData.strategic_recommendations.map((rec, i) => {
                const colonIdx = rec.indexOf(":");
                const dashIdx = rec.indexOf(" — ");
                const hasHeader = colonIdx > 0 && colonIdx < 30;
                const verb = hasHeader ? rec.slice(0, colonIdx) : null;
                const rest = hasHeader
                  ? rec.slice(colonIdx + 1).trim()
                  : rec;
                const [title, ...descParts] =
                  dashIdx > 0
                    ? [
                        rest.split(" — ")[0],
                        rest.split(" — ").slice(1).join(" — "),
                      ]
                    : [rest, ""];
                const desc = descParts.join("");

                return (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent border border-accent/20">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {verb && (
                          <span className="font-bold text-accent">
                            {verb}:{" "}
                          </span>
                        )}
                        {title}
                      </p>
                      {desc && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {desc}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Article teasers */}
      {synthesisData.article_teasers.length > 0 && (
        <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-1 text-lg font-bold text-foreground">
            Content Gap Recommendations
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Articles designed to close specific AI visibility gaps
          </p>
          <div className="grid gap-3">
            {synthesisData.article_teasers.map((t, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-secondary/50 p-4"
              >
                <p className="text-sm font-medium text-foreground">
                  {t.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.rationale}
                </p>
                <p className="mt-1 text-xs italic text-accent/70">
                  Addresses: {t.target_gap}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email capture + download + share section */}
      {step === "download" && jobId && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 mt-8 text-center">
          {!emailSent ? (
            <div className="mx-auto max-w-md">
              <p className="mb-3 text-sm text-muted-foreground">
                Enter your email to receive the PDF report
              </p>
              <form onSubmit={handleEmailSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null);
                  }}
                  placeholder="you@company.com"
                  className="flex-1 rounded-full border border-border bg-background px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="submit"
                  disabled={emailLoading || !email.trim()}
                  className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {emailLoading ? "Sending..." : "Send My Report"}
                </button>
              </form>
              {emailError && (
                <p className="mt-2 text-xs text-destructive">{emailError}</p>
              )}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={onReset}
                  className="rounded-full border border-border bg-card px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Run Another
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-md">
              <div className="mb-4 flex items-center justify-center gap-2 text-green-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                <span className="text-sm font-medium">Report sent to {email}</span>
              </div>
              <div className="flex justify-center gap-3">
                {pdfAvailable && (
                  <a
                    href={getDownloadUrl(jobId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110"
                  >
                    Download PDF Report
                  </a>
                )}
                <ShareButton jobId={jobId} />
                <button
                  onClick={onReset}
                  className="rounded-full border border-border bg-card px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Run Another
                </button>
              </div>
            </div>
          )}

          {/* Full audit CTA */}
          <div className="mx-auto mt-8 max-w-lg rounded-3xl border border-accent/20 bg-accent/5 p-6 text-center">
            <h4 className="font-semibold text-foreground mb-2">
              Want deeper insights?
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Get a full AI Visibility Audit with 60+ prompts across 4 AI
              models, 8 scoring dimensions, anti-pattern detection, and a
              consultant-quality narrative report.
            </p>
            <button
              onClick={onContactClick}
              className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110"
            >
              Request Full Audit
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// =============================================================================
// ENTITY CONTEXT PANEL — HumanOS integration (graceful degradation)
// =============================================================================

function EntityContextPanel({ domain }: { domain: string }) {
  const [entityCtx, setEntityCtx] = useState<EntityContextType | null>(null);
  const [history, setHistory] = useState<AriHistoryEntry[]>([]);

  useEffect(() => {
    if (!domain) return;

    // Dynamic import to avoid build-time dependency if HumanOS API unavailable
    import("@/lib/humanos-client").then(async ({ getEntityContext, getAriHistory }) => {
      const [entity, hist] = await Promise.all([
        getEntityContext(domain),
        getAriHistory(domain, 5),
      ]);
      if (entity) setEntityCtx(entity);
      if (hist.length) setHistory(hist);
    }).catch(() => {
      // HumanOS client unavailable — silent degradation
    });
  }, [domain]);

  // Don't render if no context available
  if (!entityCtx?.ari && history.length === 0) return null;

  return (
    <div className="mb-6 rounded-3xl border border-border/50 bg-card/50 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Entity Intelligence
        </h4>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Previous score delta */}
        {entityCtx?.ari?.score_delta != null && (
          <div className="rounded-xl border border-border bg-secondary/30 p-3">
            <p className="text-xs text-muted-foreground">Score Change</p>
            <p className={`text-lg font-bold ${
              entityCtx.ari.score_delta > 0 ? "text-green-600" :
              entityCtx.ari.score_delta < 0 ? "text-red-500" :
              "text-muted-foreground"
            }`}>
              {entityCtx.ari.score_delta > 0 ? "+" : ""}
              {entityCtx.ari.score_delta.toFixed(1)}
            </p>
            {entityCtx.ari.previous_score != null && (
              <p className="text-xs text-muted-foreground">
                from {entityCtx.ari.previous_score.toFixed(1)}
              </p>
            )}
          </div>
        )}

        {/* Last scored timestamp */}
        {entityCtx?.ari?.scored_at && (
          <div className="rounded-xl border border-border bg-secondary/30 p-3">
            <p className="text-xs text-muted-foreground">Last Scored</p>
            <p className="text-sm font-medium text-foreground">
              {new Date(entityCtx.ari.scored_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Score history trend */}
      {history.length > 1 && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-2">Score History</p>
          <div className="flex items-end gap-1 h-10">
            {history.slice().reverse().map((entry, i) => {
              const height = entry.score ? Math.max(10, (entry.score / 100) * 100) : 10;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-accent/40 transition-all"
                  style={{ height: `${height}%` }}
                  title={`${entry.score?.toFixed(1)} - ${new Date(entry.occurred_at).toLocaleDateString()}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
