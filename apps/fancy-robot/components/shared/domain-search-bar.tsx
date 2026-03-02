"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function DomainSearchBar({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = domain
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    if (!cleaned) return;
    router.push(`/snapshot?domain=${encodeURIComponent(cleaned)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center rounded-2xl border-2 border-border bg-card shadow-lg transition-all focus-within:ring-2 focus-within:ring-accent/40 focus-within:border-accent sm:rounded-full">
        <Search className="ml-5 h-6 w-6 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="Enter your domain..."
          autoFocus={autoFocus}
          className="min-w-0 flex-1 bg-transparent px-4 py-4 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:text-lg sm:py-5"
        />
        <button
          type="submit"
          disabled={!domain.trim()}
          className="mr-2 shrink-0 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground shadow-sm transition-all hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed sm:rounded-full sm:px-8 sm:py-3.5 sm:text-base"
        >
          Check My Score
        </button>
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground lg:text-left">
        Free · 30 seconds · No login required
      </p>
    </form>
  );
}
