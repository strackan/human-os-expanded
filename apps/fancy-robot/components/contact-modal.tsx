"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ContactForm } from "./contact";

interface ContactModalProps {
  snapshotDomain?: string;
  onClose: () => void;
}

export function ContactModal({ snapshotDomain = "", onClose }: ContactModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-8 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            Get Your Full Report
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {"We'll send you a comprehensive AI visibility audit with strategic recommendations."}
          </p>
        </div>

        <ContactForm snapshotDomain={snapshotDomain} />
      </div>
    </div>,
    document.body
  );
}
