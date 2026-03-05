"use client";

import type { TemplateInfo } from "@/lib/article-client";

interface TemplatePickerProps {
  templates: TemplateInfo[];
  selected: string;
  onSelect: (templateId: string) => void;
  loading?: boolean;
}

export function TemplatePicker({
  templates,
  selected,
  onSelect,
  loading,
}: TemplatePickerProps) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        Article Template
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            disabled={loading}
            className={`flex-shrink-0 rounded-2xl border-2 p-4 text-left transition-all w-44 ${
              selected === t.id
                ? "border-accent bg-accent/5 shadow-md"
                : "border-border hover:border-accent/40"
            } ${loading ? "opacity-60 cursor-wait" : ""}`}
          >
            {/* Color swatch */}
            <div
              className="w-full h-2 rounded-full mb-3"
              style={{ background: t.accent_color || "#71717a" }}
            />
            <div className="text-sm font-semibold text-foreground">
              {t.name}
            </div>
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {t.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
