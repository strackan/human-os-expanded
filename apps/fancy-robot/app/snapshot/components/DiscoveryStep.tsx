import type { DiscoveryResult, DomainValidation } from "@/lib/lite-report-client";
import { Spinner } from "./Spinner";
import { EditDiscoveryForm } from "./EditDiscoveryForm";

export function DiscoveryStep({
  discovery,
  domainInfo,
  statusMessage,
  isEditing,
  editDiscovery,
  onEdit,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  onReset,
}: {
  discovery: DiscoveryResult | null;
  domainInfo: DomainValidation | null;
  statusMessage: string;
  isEditing: boolean;
  editDiscovery: DiscoveryResult | null;
  onEdit: () => void;
  onEditChange: (d: DiscoveryResult) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  onReset: () => void;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!discovery ? (
        <div className="py-12 text-center">
          {domainInfo ? (
            <div className="animate-in fade-in duration-300 max-w-md mx-auto">
              <div className="rounded-2xl border border-border bg-card p-5 mb-6 text-left shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground text-xs font-bold">
                    &#10003;
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {domainInfo.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {domainInfo.domain}
                    </p>
                  </div>
                </div>
                {domainInfo.meta_description && (
                  <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2">
                    {domainInfo.meta_description}
                  </p>
                )}
              </div>
              <Spinner />
              <p className="text-sm text-muted-foreground mt-3">
                {statusMessage ||
                  "Analyzing website and identifying competitors..."}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {[
                  "Scraping pages",
                  "Identifying competitors",
                  "Mapping personas",
                  "Finding topics",
                ].map((label, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <button
                onClick={onReset}
                className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <Spinner />
              <p className="text-muted-foreground mt-3">
                {statusMessage || "Connecting..."}
              </p>
              <button
                onClick={onReset}
                className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      ) : isEditing ? (
        <EditDiscoveryForm
          discovery={editDiscovery!}
          onChange={onEditChange}
          onSubmit={onEditSubmit}
          onCancel={onEditCancel}
        />
      ) : (
        <div>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {discovery.company_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {discovery.domain} | {discovery.industry}
                </p>
              </div>
              <button
                onClick={onEdit}
                className="rounded-full border border-border bg-secondary px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                Edit
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {discovery.description}
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase text-accent">
                  Competitors
                </h4>
                {discovery.competitors.map((c, i) => (
                  <p key={i} className="text-sm text-muted-foreground">
                    {c.name}
                  </p>
                ))}
              </div>
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase text-accent">
                  Personas
                </h4>
                {discovery.personas.map((p, i) => (
                  <p key={i} className="text-sm text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase text-accent">
                  Topics
                </h4>
                {discovery.topics.map((t, i) => (
                  <p key={i} className="text-sm text-muted-foreground">
                    {t}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center">
            <Spinner />
            <p className="mt-2 text-sm text-muted-foreground">
              Running AI analysis...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
