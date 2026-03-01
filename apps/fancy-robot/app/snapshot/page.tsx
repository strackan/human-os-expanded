"use client";

import { ContactModal } from "@/components/contact-modal";
import { useSnapshotFlow } from "./hooks/useSnapshotFlow";
import { InputStep } from "./components/InputStep";
import { SuggestionsStep } from "./components/SuggestionsStep";
import { DiscoveryStep } from "./components/DiscoveryStep";
import { AnalysisStep } from "./components/AnalysisStep";
import { ResultsStep } from "./components/ResultsStep";

export default function SnapshotPage() {
  const flow = useSnapshotFlow();

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
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
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to Home
          </a>
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
            domain={flow.domain}
            promoCode={flow.promoCode}
            onDomainChange={flow.setDomain}
            onPromoCodeChange={flow.setPromoCode}
            onSubmit={flow.handleSubmit}
          />
        )}

        {flow.step === "suggestions" && flow.suggestions.length > 0 && (
          <SuggestionsStep
            suggestions={flow.suggestions}
            query={flow.suggestionQuery}
            onSelect={flow.handleSuggestionSelect}
            onReset={flow.handleReset}
          />
        )}

        {flow.step === "discovery" && (
          <DiscoveryStep
            discovery={flow.discovery}
            domainInfo={flow.domainInfo}
            statusMessage={flow.statusMessage}
            isEditing={flow.isEditing}
            editDiscovery={flow.editDiscovery}
            onEdit={() => flow.setIsEditing(true)}
            onEditChange={flow.setEditDiscovery}
            onEditSubmit={flow.handleEditSubmit}
            onEditCancel={() => flow.setIsEditing(false)}
            onReset={flow.handleReset}
          />
        )}

        {flow.step === "analysis" && (
          <AnalysisStep
            analysisCurrent={flow.analysisCurrent}
            analysisTotal={flow.analysisTotal}
            currentPrompt={flow.currentPrompt}
            discovery={flow.discovery}
            statusMessage={flow.statusMessage}
            onReset={flow.handleReset}
          />
        )}

        {(flow.step === "results" || flow.step === "download") &&
          flow.synthesisData && (
            <ResultsStep
              step={flow.step}
              synthesisData={flow.synthesisData}
              discovery={flow.discovery}
              isGated={flow.isGated}
              jobId={flow.jobId}
              pdfAvailable={flow.pdfAvailable}
              promoCode={flow.promoCode}
              onPromoCodeChange={flow.setPromoCode}
              onUngate={() => flow.setIsGated(false)}
              onContactClick={() => flow.setShowContactModal(true)}
              onReset={flow.handleReset}
            />
          )}
      </main>

      {flow.showContactModal && (
        <ContactModal
          snapshotDomain={flow.domain}
          onClose={() => flow.setShowContactModal(false)}
        />
      )}
    </div>
  );
}
