"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { deliverablesClient } from "@/lib/deliverables-client";
import { FileText, Download, Presentation, ChevronRight } from "lucide-react";

export default function ReportsPage() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pptxLoading, setPptxLoading] = useState(false);

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => deliverablesClient.listCustomers(),
  });

  const { data: deliverables = [], isLoading: deliverablesLoading } = useQuery({
    queryKey: ["deliverables", selectedSlug],
    queryFn: () => deliverablesClient.listDeliverables(selectedSlug!),
    enabled: !!selectedSlug,
  });

  const { data: content, isLoading: contentLoading } = useQuery({
    queryKey: ["deliverable", selectedSlug, selectedDoc],
    queryFn: () =>
      deliverablesClient.getDeliverable(selectedSlug!, selectedDoc!),
    enabled: !!selectedSlug && !!selectedDoc,
  });

  // Auto-select first customer
  useEffect(() => {
    if (!selectedSlug && customers.length > 0) {
      setSelectedSlug(customers[0].slug);
    }
  }, [selectedSlug, customers]);

  // Auto-select first deliverable
  useEffect(() => {
    if (selectedSlug && deliverables.length > 0 && !selectedDoc) {
      setSelectedDoc(deliverables[0].filename);
    }
  }, [selectedSlug, deliverables, selectedDoc]);

  // Reset doc when switching customer
  const handleSelectCustomer = (slug: string) => {
    setSelectedSlug(slug);
    setSelectedDoc(null);
  };

  const handleDownloadPdf = async () => {
    if (!selectedSlug || !selectedDoc) return;
    setPdfLoading(true);
    try {
      await deliverablesClient.downloadPdf(selectedSlug, selectedDoc);
    } catch {
      // Error handled silently
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadPptx = async () => {
    if (!selectedSlug) return;
    setPptxLoading(true);
    try {
      await deliverablesClient.downloadPptx(selectedSlug);
    } catch {
      // Error handled silently
    } finally {
      setPptxLoading(false);
    }
  };

  const isProposal =
    selectedDoc?.includes("proposal") || selectedDoc?.startsWith("01-");
  const selectedCustomer = customers.find((c) => c.slug === selectedSlug);

  if (customersLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="py-20 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold text-foreground">
          No reports yet
        </h2>
        <p className="text-muted-foreground">
          Client reports and deliverables will appear here after running audits.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-6">
      {/* Sidebar */}
      <div className="w-64 shrink-0 overflow-y-auto rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Clients
        </h3>

        {/* Customer selector */}
        {customers.length > 1 && (
          <select
            value={selectedSlug || ""}
            onChange={(e) => handleSelectCustomer(e.target.value)}
            className="mb-4 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
          >
            {customers.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} ({c.deliverable_count})
              </option>
            ))}
          </select>
        )}

        {/* Document list */}
        {deliverablesLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-lg bg-secondary"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {deliverables.map((d) => (
              <button
                key={d.filename}
                onClick={() => setSelectedDoc(d.filename)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selectedDoc === d.filename
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{d.title}</span>
                {selectedDoc === d.filename && (
                  <ChevronRight className="ml-auto h-3 w-3 shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
        {/* Top bar */}
        {selectedSlug && selectedDoc && (
          <div className="flex items-center justify-between border-b border-border px-6 py-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {deliverables.find((d) => d.filename === selectedDoc)?.title ||
                  selectedDoc}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedCustomer?.name}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                {pdfLoading ? "Downloading..." : "PDF"}
              </button>
              {isProposal && (
                <button
                  onClick={handleDownloadPptx}
                  disabled={pptxLoading}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
                >
                  <Presentation className="h-3.5 w-3.5" />
                  {pptxLoading ? "Downloading..." : "PPTX"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Document content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {contentLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
          ) : content ? (
            <article className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/80 prose-a:text-accent prose-strong:text-foreground prose-th:text-foreground prose-td:text-foreground/80">
              <Markdown remarkPlugins={[remarkGfm]}>{content.content}</Markdown>
            </article>
          ) : (
            <div className="flex items-center justify-center py-16">
              <p className="text-muted-foreground">
                Select a document from the sidebar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
