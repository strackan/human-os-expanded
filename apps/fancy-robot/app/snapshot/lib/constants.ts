import type { PromptStart } from "@/lib/lite-report-client";

export type Step = "input" | "suggestions" | "discovery" | "analysis" | "results" | "download";

export interface DomainSuggestion {
  domain: string;
  title: string;
}

export const STYLE_LABELS: Record<string, string> = {
  top_5: "Top 5",
  best: "Best Pick",
  top_3: "Top 3",
  compare: "Compare",
  as_persona: "Persona View",
  recommend: "Recommend",
  landscape: "Landscape",
};

const INTERSTITIAL_TEMPLATES = [
  (p: PromptStart) => `Testing who is best for ${p.topic}...`,
  (p: PromptStart) => `Checking ${p.persona} recommendations...`,
  (p: PromptStart) => `Evaluating ${p.topic} options...`,
  (p: PromptStart) => `What does AI suggest for ${p.persona}?`,
  (p: PromptStart) => `Probing the ${p.topic} landscape...`,
];

export function getInterstitialMessage(prompt: PromptStart): string {
  const idx = (prompt.current ?? 1) - 1;
  const fn = INTERSTITIAL_TEMPLATES[idx % INTERSTITIAL_TEMPLATES.length];
  return fn(prompt);
}
