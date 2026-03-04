"use client";

import { useState } from "react";
import { ScoreGauge } from "@/app/snapshot/components/ScoreGauge";
import type { ArticleRun } from "@/lib/article-client";
import type { PhaseData } from "../hooks/useArticleFlow";

interface ResultsStepProps {
  articleRun: ArticleRun;
  phaseData: PhaseData;
  onReset: () => void;
}

type Tab = "rendered" | "markdown" | "html";

export function ResultsStep({ articleRun, phaseData, onReset }: ResultsStepProps) {
  const [tab, setTab] = useState<Tab>("rendered");
  const [copied, setCopied] = useState(false);

  const optimizer = articleRun.optimizer_output;
  const condenser = articleRun.condenser_output;
  const editor = articleRun.editor_output;
  const writer = articleRun.writer_output;

  // Use condensed markdown if available, else editor hardened, else writer draft
  const markdown = condenser?.condensed_markdown ?? editor?.hardened_markdown ?? writer?.article_markdown ?? "";
  const html = optimizer?.article_html ?? "";
  const title = condenser?.title ?? writer?.title ?? articleRun.article_topic;
  const scoreBefore = phaseData.scoreBefore ?? optimizer?.score_before ?? 0;
  const scoreAfter = phaseData.scoreAfter ?? optimizer?.score_after ?? 0;

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (content: string, ext: string) => {
    const blob = new Blob([content], { type: ext === "html" ? "text/html" : "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabContent = () => {
    switch (tab) {
      case "rendered":
        return (
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: html || markdown }}
          />
        );
      case "markdown":
        return (
          <pre className="whitespace-pre-wrap text-xs text-foreground font-mono bg-muted/50 rounded-xl p-4 overflow-auto max-h-[600px]">
            {markdown}
          </pre>
        );
      case "html":
        return (
          <pre className="whitespace-pre-wrap text-xs text-foreground font-mono bg-muted/50 rounded-xl p-4 overflow-auto max-h-[600px]">
            {html}
          </pre>
        );
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Article Ready
        </h1>
        <p className="mt-2 text-base text-muted-foreground">{title}</p>
      </div>

      {/* Score + Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Score Gauge */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col items-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            AI Readability Score
          </h3>
          <ScoreGauge score={scoreAfter} />
        </div>

        {/* Score Improvement */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Score Improvement
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono text-muted-foreground">
              {scoreBefore}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="text-2xl font-mono font-bold text-foreground">
              {scoreAfter}
            </span>
          </div>
          <span className="mt-2 text-sm text-green-600 font-medium">
            +{scoreAfter - scoreBefore} points
          </span>
        </div>

        {/* Pipeline Stats */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Pipeline Stats
          </h3>
          <div className="space-y-2 text-sm">
            {phaseData.totalLatency != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Time</span>
                <span className="font-medium text-foreground">
                  {(phaseData.totalLatency / 1000).toFixed(1)}s
                </span>
              </div>
            )}
            {phaseData.writerWordCount != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Draft Words</span>
                <span className="font-medium text-foreground">
                  {phaseData.writerWordCount}
                </span>
              </div>
            )}
            {phaseData.condenserWordCount != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Final Words</span>
                <span className="font-medium text-foreground">
                  {phaseData.condenserWordCount}
                </span>
              </div>
            )}
            {phaseData.editorChanges != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Editor Changes</span>
                <span className="font-medium text-foreground">
                  {phaseData.editorChanges}
                </span>
              </div>
            )}
            {phaseData.compressionRatio != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Compression</span>
                <span className="font-medium text-foreground">
                  {Math.round(phaseData.compressionRatio * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AIO Scorecard */}
      {phaseData.aioScorecard && Object.keys(phaseData.aioScorecard).length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            AIO Scorecard
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {Object.entries(phaseData.aioScorecard).map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between rounded-xl border border-border bg-background px-4 py-2.5"
              >
                <span className="text-xs text-muted-foreground capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="text-xs font-medium text-foreground">
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Article Preview */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-border">
          {(["rendered", "markdown", "html"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-background text-foreground border-b-2 border-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "rendered" ? "Preview" : t === "markdown" ? "Markdown" : "HTML"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">{tabContent()}</div>

        {/* Actions bar */}
        <div className="flex items-center gap-3 border-t border-border px-6 py-4">
          <button
            onClick={() => handleCopy(tab === "html" ? html : markdown)}
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>
          {markdown && (
            <button
              onClick={() => handleDownload(markdown, "md")}
              className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Download .md
            </button>
          )}
          {html && (
            <button
              onClick={() => handleDownload(html, "html")}
              className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Download .html
            </button>
          )}
        </div>
      </div>

      {/* Generate Another */}
      <div className="text-center">
        <button
          onClick={onReset}
          className="rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Generate Another Article
        </button>
      </div>
    </div>
  );
}
