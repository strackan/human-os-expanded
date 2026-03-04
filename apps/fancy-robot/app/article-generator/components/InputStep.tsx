"use client";

import type { ArticleFormState } from "../hooks/useArticleFlow";

interface InputStepProps {
  form: ArticleFormState;
  onFormChange: (form: ArticleFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function InputStep({ form, onFormChange, onSubmit }: InputStepProps) {
  const update = (field: keyof ArticleFormState, value: string) =>
    onFormChange({ ...form, [field]: value });

  const isValid = form.domain && form.companyName && form.headline && form.description;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          AI Article Generator
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Generate AI-optimized, wire-distribution-ready articles in minutes.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5"
      >
        {/* Domain + Company */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Domain
            </label>
            <input
              type="text"
              placeholder="example.com"
              value={form.domain}
              onChange={(e) => update("domain", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Company Name
            </label>
            <input
              type="text"
              placeholder="Acme Corp"
              value={form.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
        </div>

        {/* Industry (optional) */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Industry{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Online Education, Financial Services"
            value={form.industry}
            onChange={(e) => update("industry", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        {/* Headline */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Article Headline
          </label>
          <input
            type="text"
            placeholder="Six Questions Parents Ask About Online School"
            value={form.headline}
            onChange={(e) => update("headline", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        {/* Description / Key Claims */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Brief Description
          </label>
          <textarea
            rows={4}
            placeholder="Describe the article topic and key points to cover. Each line becomes a key claim."
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Each line will be treated as a key claim for the article.
          </p>
        </div>

        {/* Spokesperson (optional) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Spokesperson Name{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Jane Smith"
              value={form.spokespersonName}
              onChange={(e) => update("spokespersonName", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Spokesperson Title{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="VP of Marketing"
              value={form.spokespersonTitle}
              onChange={(e) => update("spokespersonTitle", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
        </div>

        {/* Word Count Toggle */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Article Format
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onFormChange({ ...form, wordCount: "short" })}
              className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                form.wordCount === "short"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-background text-muted-foreground hover:border-accent/50"
              }`}
            >
              Wire Distribution
              <span className="block text-xs font-normal mt-0.5 opacity-70">
                ~400 words, optimized for syndication
              </span>
            </button>
            <button
              type="button"
              onClick={() => onFormChange({ ...form, wordCount: "long" })}
              className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                form.wordCount === "long"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-background text-muted-foreground hover:border-accent/50"
              }`}
            >
              Long-Form
              <span className="block text-xs font-normal mt-0.5 opacity-70">
                ~1,600 words, for blog / Medium
              </span>
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid}
          className="w-full rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        >
          Generate Article
        </button>
      </form>
    </div>
  );
}
