"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  startLiteAnalysis,
  type DiscoveryResult,
  type LiteReportEvent,
  type SynthesisData,
  type DomainValidation,
  type PromptStart,
  type PromptResult,
} from "@/lib/lite-report-client";
import type { Step, DomainSuggestion } from "../lib/constants";

export function useSnapshotFlow() {
  const [step, setStep] = useState<Step>("input");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Domain validation state
  const [domainInfo, setDomainInfo] = useState<DomainValidation | null>(null);

  // Discovery state
  const [discovery, setDiscovery] = useState<DiscoveryResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDiscovery, setEditDiscovery] = useState<DiscoveryResult | null>(
    null
  );

  // Analysis state
  const [analysisCurrent, setAnalysisCurrent] = useState(0);
  const [analysisTotal, setAnalysisTotal] = useState(0);
  const [queryCount, setQueryCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState<PromptStart | null>(null);
  const [, setPromptResults] = useState<PromptResult[]>([]);

  // Results state
  const [synthesisData, setSynthesisData] = useState<SynthesisData | null>(
    null
  );
  const [jobId, setJobId] = useState<string | null>(null);
  const [pdfAvailable, setPdfAvailable] = useState(false);
  const [isGated, setIsGated] = useState(true);

  // Promo code state
  const [promoCode, setPromoCode] = useState("");

  // Contact modal state
  const [showContactModal, setShowContactModal] = useState(false);

  // Domain suggestion state
  const [suggestions, setSuggestions] = useState<DomainSuggestion[]>([]);
  const [suggestionQuery, setSuggestionQuery] = useState("");

  const cleanupRef = useRef<(() => void) | null>(null);

  const handleEvent = useCallback((event: LiteReportEvent) => {
    switch (event.type) {
      case "status":
        setStatusMessage(event.message);
        break;

      case "cache_hit":
        setStatusMessage(event.message);
        break;

      case "domain_validated":
        setDomainInfo(event.data);
        break;

      case "discovery_complete":
        setDiscovery(event.data);
        setEditDiscovery(event.data);
        setStep("discovery");
        break;

      case "prompt_start":
        setStep("analysis");
        setQueryCount((prev) => {
          const next = prev + 1;
          setAnalysisCurrent(next);
          setCurrentPrompt({ ...event, current: next });
          return next;
        });
        if (event.total) setAnalysisTotal(event.total);
        break;

      case "prompt_result":
        setPromptResults((prev) => [...prev, event]);
        if (event.total) setAnalysisTotal(event.total);
        break;

      case "analysis_complete":
        setStatusMessage("Analysis complete. Generating insights...");
        setCurrentPrompt(null);
        break;

      case "gate_status":
        setIsGated(event.gated);
        break;

      case "domain_suggestions":
        setSuggestions(event.suggestions);
        setSuggestionQuery(event.query);
        setStep("suggestions");
        break;

      case "synthesis_complete":
        setSynthesisData(event.data);
        setStep("results");
        break;

      case "pdf_ready":
        setJobId(event.job_id);
        setPdfAvailable(event.pdf_available !== false);
        setStep("download");
        break;

      case "error":
        setError(event.message);
        setStep("input");
        setDomainInfo(null);
        setDiscovery(null);
        setCurrentPrompt(null);
        break;
    }
  }, []);

  const startAnalysis = useCallback(
    (domainStr: string, discoveryOverride?: DiscoveryResult) => {
      setError(null);
      setStep("discovery");
      setStatusMessage("Discovering company information...");

      if (cleanupRef.current) cleanupRef.current();

      cleanupRef.current = startLiteAnalysis(
        domainStr,
        handleEvent,
        (err) => setError(err.message),
        discoveryOverride,
        promoCode || undefined
      );
    },
    [handleEvent, promoCode]
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

  const handleEditSubmit = () => {
    if (!editDiscovery) return;
    setIsEditing(false);
    setDiscovery(editDiscovery);
    startAnalysis(editDiscovery.domain, editDiscovery);
  };

  const handleReset = () => {
    if (cleanupRef.current) cleanupRef.current();
    setStep("input");
    setDomain("");
    setDomainInfo(null);
    setDiscovery(null);
    setEditDiscovery(null);
    setSynthesisData(null);
    setJobId(null);
    setPdfAvailable(false);
    setIsGated(true);
    setPromoCode("");
    setSuggestions([]);
    setSuggestionQuery("");
    setError(null);
    setAnalysisCurrent(0);
    setAnalysisTotal(0);
    setQueryCount(0);
    setStatusMessage("");
    setCurrentPrompt(null);
    setPromptResults([]);
  };

  const handleSuggestionSelect = (selectedDomain: string) => {
    setDomain(selectedDomain);
    setSuggestions([]);
    setSuggestionQuery("");
    startAnalysis(selectedDomain);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  return {
    // State
    step,
    domain,
    error,
    domainInfo,
    discovery,
    isEditing,
    editDiscovery,
    analysisCurrent,
    analysisTotal,
    statusMessage,
    currentPrompt,
    synthesisData,
    jobId,
    pdfAvailable,
    isGated,
    promoCode,
    showContactModal,
    suggestions,
    suggestionQuery,

    // Actions
    setDomain,
    setError,
    setIsEditing,
    setEditDiscovery,
    setIsGated,
    setPromoCode,
    setShowContactModal,
    handleSubmit,
    handleEditSubmit,
    handleReset,
    handleSuggestionSelect,
    startAnalysis,
  };
}
