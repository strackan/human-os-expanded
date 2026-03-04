"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useArticleFlow } from "./hooks/useArticleFlow";
import { InputStep } from "./components/InputStep";
import { GeneratingStep } from "./components/GeneratingStep";
import { ResultsStep } from "./components/ResultsStep";

function ArticleGeneratorContent() {
  const flow = useArticleFlow();

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
              <span className="text-sm font-bold text-primary-foreground">
                FR
              </span>
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              Fancy Robot
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pt-24 pb-16">
        {/* Error banner */}
        {flow.error && (
          <div className="animate-in fade-in slide-in-from-top-2 mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {flow.error}
            <button
              onClick={() => flow.setError(null)}
              className="ml-4 underline text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {flow.step === "input" && (
          <InputStep
            form={flow.form}
            onFormChange={flow.setForm}
            onSubmit={flow.handleSubmit}
          />
        )}

        {flow.step === "generating" && (
          <GeneratingStep
            currentPhase={flow.currentPhase}
            statusMessage={flow.statusMessage}
            completedPhases={flow.completedPhases}
            phaseData={flow.phaseData}
            onCancel={flow.handleCancel}
          />
        )}

        {flow.step === "results" && flow.articleRun && (
          <ResultsStep
            articleRun={flow.articleRun}
            phaseData={flow.phaseData}
            onReset={flow.handleReset}
          />
        )}
      </main>
    </div>
  );
}

export default function ArticleGeneratorPage() {
  return (
    <Suspense>
      <ArticleGeneratorContent />
    </Suspense>
  );
}
