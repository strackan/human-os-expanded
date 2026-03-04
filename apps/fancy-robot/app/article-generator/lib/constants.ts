export type ArticleStep = "input" | "generating" | "results";

export const PHASE_LABELS: Record<string, { label: string; description: string }> = {
  preprocessing: { label: "Preprocessing", description: "Analyzing domain and gathering context..." },
  writing: { label: "Writing", description: "Generating long-form article draft..." },
  draft_writer: { label: "Writer Complete", description: "Draft article ready" },
  editing: { label: "Editing", description: "Hardening content with multi-pass editor..." },
  draft_editor: { label: "Editor Complete", description: "Hardened article ready" },
  condensing: { label: "Condensing", description: "Creating wire-distribution version..." },
  optimizing: { label: "Optimizing", description: "Converting to HTML with structured data..." },
  completed: { label: "Complete", description: "Pipeline finished" },
};

/**
 * Map pipeline status strings to progress percentage (0-100).
 */
export function phaseToProgress(status: string): number {
  switch (status) {
    case "preprocessing":
      return 5;
    case "writing":
      return 15;
    case "draft_writer":
      return 30;
    case "editing":
      return 40;
    case "draft_editor":
      return 55;
    case "condensing":
      return 65;
    case "optimizing":
      return 80;
    case "completed":
      return 100;
    default:
      return 0;
  }
}
