"use client";

import { useState, useEffect } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { submitContactForm } from "@/app/actions/contact";

export function ContactForm({ snapshotDomain = "" }: { snapshotDomain?: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await submitContactForm(formData);

    setPending(false);
    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-accent/20 bg-accent/5 py-14">
        <CheckCircle2 className="h-12 w-12 text-accent" />
        <h3 className="text-xl font-semibold text-foreground">
          {"We'll be in touch."}
        </h3>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          {"Thanks for reaching out. We'll review your info and get back to you within 24 hours with your AI visibility snapshot. Talk soon."}
        </p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="contact-name"
            className="text-sm font-medium text-foreground"
          >
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            placeholder="Your name"
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="contact-company"
            className="text-sm font-medium text-foreground"
          >
            Company
          </label>
          <input
            id="contact-company"
            name="company"
            type="text"
            required
            placeholder="Your company"
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="contact-email"
          className="text-sm font-medium text-foreground"
        >
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          placeholder="you@company.com"
          className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="contact-product"
          className="text-sm font-medium text-foreground"
        >
          Tell us what you sell in one sentence
        </label>
        <textarea
          id="contact-product"
          name="product"
          required
          rows={3}
          placeholder="We help companies do X by Y..."
          className="resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {snapshotDomain && (
        <input type="hidden" name="snapshot_domain" value={snapshotDomain} />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110 disabled:opacity-60"
        >
          {pending ? (
            <>
              Sending...
              <Loader2 className="h-4 w-4 animate-spin" />
            </>
          ) : (
            <>
              Get Your Score
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export function Contact() {
  const [snapshotDomain, setSnapshotDomain] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const domain = params.get("snapshot_domain");
    if (domain) setSnapshotDomain(domain);
  }, []);

  return (
    <section
      id="contact"
      className="border-t border-border bg-secondary/50 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm lg:p-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
                Find out if AI recommends you.
              </h2>
              <p className="mt-4 text-muted-foreground">
                {"Fill this out. We'll get back to you with your initial AI visibility snapshot. No strings, no sales pitch. Just data."}
              </p>
            </div>

            <div className="mt-10">
              <ContactForm snapshotDomain={snapshotDomain} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
