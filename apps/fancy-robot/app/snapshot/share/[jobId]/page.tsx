import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { SynthesisData, DiscoveryResult } from "@/lib/lite-report-client";
import { ScoreGauge } from "../../components/ScoreGauge";
import { CompetitorBars } from "../../components/CompetitorBars";

interface SnapshotRow {
  id: string;
  discovery: DiscoveryResult;
  analysis: SynthesisData;
}

async function getSnapshot(jobId: string): Promise<SnapshotRow | { _error: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { _error: "Supabase client not available — missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" };
  }

  const { data, error } = await supabase
    .schema("fancyrobot")
    .from("snapshot_runs")
    .select("id, discovery, analysis")
    .eq("id", jobId)
    .single();

  if (error) {
    return { _error: `Supabase: ${error.message} (code: ${error.code}, details: ${error.details}, hint: ${error.hint})` };
  }
  if (!data) return { _error: "No data returned" };
  return data as SnapshotRow;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ jobId: string }>;
}): Promise<Metadata> {
  const { jobId } = await params;
  const snapshot = await getSnapshot(jobId);
  if ("_error" in snapshot) {
    return { title: "Report Not Found | Fancy Robot" };
  }

  const companyName = snapshot.discovery?.company_name || "Unknown";
  const score = Math.round(snapshot.analysis?.overall_score || 0);

  return {
    title: `AI Visibility Report — ${companyName} | Fancy Robot`,
    description: `${companyName} scored ${score}/100 on AI visibility. See how AI models perceive and recommend this brand.`,
    openGraph: {
      title: `AI Visibility Report — ${companyName}`,
      description: `${companyName} scored ${score}/100 on AI visibility. See how AI models perceive and recommend this brand.`,
      siteName: "Fancy Robot",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `AI Visibility Report — ${companyName}`,
      description: `${companyName} scored ${score}/100 on AI visibility.`,
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const snapshot = await getSnapshot(jobId);

  if ("_error" in snapshot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-lg rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <h1 className="text-lg font-bold text-destructive mb-2">Debug: Share page error</h1>
          <p className="text-sm text-foreground font-mono break-all">{snapshot._error}</p>
          <p className="text-xs text-muted-foreground mt-3">Job ID: {jobId}</p>
        </div>
      </div>
    );
  }

  const discovery = snapshot.discovery;
  const analysis = snapshot.analysis;

  if (!analysis) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <a href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
              <span className="text-sm font-bold text-primary-foreground">
                FR
              </span>
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              Fancy Robot
            </span>
          </a>
          <a
            href="/snapshot"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Run Your Own Snapshot
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pt-16 pb-16">
        {/* Score header */}
        <div className="mb-4 text-center">
          <ScoreGauge score={Math.round(analysis.overall_score)} />
          <p className="mt-1 text-sm text-muted-foreground">
            ARI Score (0-100)
          </p>
          <p className="mt-1 text-lg font-medium text-foreground">
            {discovery?.company_name}
          </p>
        </div>

        {/* Report title */}
        {analysis.report_title && (
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {analysis.report_title}
            </h1>
          </div>
        )}

        {/* Headline stat */}
        {analysis.headline_stat && (
          <div className="mx-auto mb-8 max-w-2xl rounded-2xl border border-accent/20 bg-accent/5 px-5 py-4 text-center">
            <p className="text-lg font-semibold text-accent">
              {analysis.headline_stat}
            </p>
          </div>
        )}

        {/* Executive summary */}
        {analysis.executive_summary && (
          <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-bold text-foreground">
              Executive Summary
            </h2>
            <div className="space-y-3">
              {analysis.executive_summary
                .split("\n\n")
                .map((paragraph: string, i: number) => (
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
        {analysis.core_finding && (
          <div className="mb-6 overflow-hidden rounded-3xl border border-accent/30">
            <div className="bg-accent/10 px-6 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Core Finding
              </p>
            </div>
            <div className="bg-accent/5 px-6 py-5">
              <h3 className="mb-2 text-xl font-bold text-foreground">
                {analysis.core_finding}
              </h3>
              {analysis.core_finding_detail && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {analysis.core_finding_detail}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Competitor landscape */}
        {analysis.competitor_scores?.length > 0 && (
          <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-foreground">
              Competitor Landscape
            </h2>
            <CompetitorBars
              companyName={discovery?.company_name || ""}
              companyRate={analysis.mention_rate}
              competitors={analysis.competitor_scores}
            />
          </div>
        )}

        {/* Key findings */}
        {analysis.key_findings?.length > 0 && (
          <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-foreground">
              Key Findings
            </h2>
            <div className="space-y-3">
              {analysis.key_findings.map((f: string, i: number) => (
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
        {analysis.strategic_recommendations?.length > 0 && (
          <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-foreground">
              Strategic Recommendations
            </h2>
            <div className="space-y-3">
              {analysis.strategic_recommendations.map((rec: string, i: number) => {
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

        {/* Content gap recommendations */}
        {analysis.article_teasers?.length > 0 && (
          <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-foreground">
              Content Gap Recommendations
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Articles designed to close specific AI visibility gaps
            </p>
            <div className="grid gap-3">
              {analysis.article_teasers.map((t: { title: string; rationale: string; target_gap: string }, i: number) => (
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

        {/* CTA */}
        <div className="mx-auto mt-12 max-w-lg rounded-3xl border border-accent/20 bg-accent/5 p-8 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">
            Want your own AI Visibility Report?
          </h3>
          <p className="text-sm text-muted-foreground mb-5">
            See how AI models perceive and recommend your brand. Run a free
            snapshot in under 2 minutes.
          </p>
          <a
            href="/snapshot"
            className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110"
          >
            Run Free Snapshot
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <a href="/" className="hover:text-foreground">
          Fancy Robot Creative
        </a>{" "}
        · AI Visibility Intelligence
      </footer>
    </div>
  );
}
