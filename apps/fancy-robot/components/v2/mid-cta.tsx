"use client";

import { DomainSearchBar } from "@/components/shared/domain-search-bar";

export function MidCta() {
  return (
    <section className="border-y border-accent/20 bg-accent/5 py-16 lg:py-20">
      <div className="mx-auto max-w-2xl px-6 text-center lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
          Curious where you stand?
        </h2>
        <p className="mt-4 text-muted-foreground">
          See how AI assistants perceive your brand — in 30 seconds.
        </p>
        <div className="mt-8">
          <DomainSearchBar />
        </div>
      </div>
    </section>
  );
}
