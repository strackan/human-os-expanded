"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  startArticleGeneration,
  getArticleRun,
  type ArticleGeneratorInput,
  type ArticleEvent,
  type ArticleRun,
  type EditorPass,
} from "@/lib/article-client";
import type { ArticleStep } from "../lib/constants";

export interface ArticleFormState {
  domain: string;
  companyName: string;
  industry: string;
  headline: string;
  description: string;
  spokespersonName: string;
  spokespersonTitle: string;
  wordCount: "short" | "long";
}

const INITIAL_FORM: ArticleFormState = {
  domain: "",
  companyName: "",
  industry: "",
  headline: "",
  description: "",
  spokespersonName: "",
  spokespersonTitle: "",
  wordCount: "short",
};

export interface PhaseData {
  writerWordCount?: number;
  writerLatency?: number;
  writerProvider?: string;
  editorWordCount?: number;
  editorChanges?: number;
  editorPasses?: EditorPass[];
  aioScorecard?: Record<string, unknown>;
  condenserWordCount?: number;
  condenserSourceWordCount?: number;
  compressionRatio?: number;
  scoreBefore?: number;
  scoreAfter?: number;
  optimizerLatency?: number;
  totalLatency?: number;
  runId?: string;
}

export function useArticleFlow() {
  const [step, setStep] = useState<ArticleStep>("input");
  const [form, setForm] = useState<ArticleFormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);

  // Generating state
  const [currentPhase, setCurrentPhase] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [completedPhases, setCompletedPhases] = useState<string[]>([]);
  const [phaseData, setPhaseData] = useState<PhaseData>({});

  // Results state
  const [articleRun, setArticleRun] = useState<ArticleRun | null>(null);

  const cleanupRef = useRef<(() => void) | null>(null);

  const handleEvent = useCallback((event: ArticleEvent) => {
    switch (event.type) {
      case "status":
        setCurrentPhase(event.status);
        setStatusMessage(event.message);
        break;

      case "gumshoe_complete":
      case "gumshoe_skipped":
        setCompletedPhases((prev) => [...prev, "gumshoe"]);
        break;

      case "writer_complete":
        setCompletedPhases((prev) => [...prev, "writer"]);
        setPhaseData((prev) => ({
          ...prev,
          writerWordCount: event.word_count,
          writerLatency: event.latency_ms,
          writerProvider: event.provider_used,
        }));
        break;

      case "editor_complete":
        setCompletedPhases((prev) => [...prev, "editor"]);
        setPhaseData((prev) => ({
          ...prev,
          editorWordCount: event.word_count,
          editorChanges: event.total_changes,
          editorPasses: event.passes,
          aioScorecard: event.aio_scorecard,
        }));
        break;

      case "condenser_complete":
        setCompletedPhases((prev) => [...prev, "condenser"]);
        setPhaseData((prev) => ({
          ...prev,
          condenserWordCount: event.word_count,
          condenserSourceWordCount: event.source_word_count,
          compressionRatio: event.compression_ratio,
        }));
        break;

      case "optimizer_complete":
        setCompletedPhases((prev) => [...prev, "optimizer"]);
        setPhaseData((prev) => ({
          ...prev,
          scoreBefore: event.score_before,
          scoreAfter: event.score_after,
          optimizerLatency: event.latency_ms,
        }));
        break;

      case "pipeline_complete":
        setPhaseData((prev) => ({
          ...prev,
          totalLatency: event.total_latency_ms,
          runId: event.run_id,
        }));
        // Fetch the full article run data
        getArticleRun(event.run_id)
          .then((run) => {
            setArticleRun(run);
            setStep("results");
          })
          .catch((err) => {
            setError(`Failed to fetch article: ${err.message}`);
            setStep("input");
          });
        break;

      case "error":
        setError(event.message);
        setStep("input");
        break;
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setStep("generating");
      setCurrentPhase("preprocessing");
      setStatusMessage("Starting article pipeline...");
      setCompletedPhases([]);
      setPhaseData({});
      setArticleRun(null);

      if (cleanupRef.current) cleanupRef.current();

      const input: ArticleGeneratorInput = {
        client_name: form.companyName,
        domain: form.domain.trim().replace(/^https?:\/\//, "").replace(/\/$/, ""),
        industry: form.industry || undefined,
        article_topic: form.headline,
        key_claims: form.description
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        target_word_count: form.wordCount === "short" ? 400 : 1600,
      };

      if (form.spokespersonName) {
        input.spokesperson = {
          name: form.spokespersonName,
          title: form.spokespersonTitle,
          company: form.companyName,
        };
      }

      cleanupRef.current = startArticleGeneration(
        input,
        handleEvent,
        (err) => {
          setError(err.message);
          setStep("input");
        }
      );
    },
    [form, handleEvent]
  );

  const handleReset = useCallback(() => {
    if (cleanupRef.current) cleanupRef.current();
    setStep("input");
    setForm(INITIAL_FORM);
    setError(null);
    setCurrentPhase("");
    setStatusMessage("");
    setCompletedPhases([]);
    setPhaseData({});
    setArticleRun(null);
  }, []);

  const handleCancel = useCallback(() => {
    if (cleanupRef.current) cleanupRef.current();
    setStep("input");
    setCurrentPhase("");
    setStatusMessage("");
    setCompletedPhases([]);
    setPhaseData({});
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  return {
    // State
    step,
    form,
    error,
    currentPhase,
    statusMessage,
    completedPhases,
    phaseData,
    articleRun,

    // Actions
    setForm,
    setError,
    handleSubmit,
    handleReset,
    handleCancel,
  };
}
