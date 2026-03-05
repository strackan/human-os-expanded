"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { PriceKey } from "@/lib/stripe";

const features = {
  free: [
    "AI Visibility Snapshot",
    "Overall ARI score",
    "Competitor landscape",
    "Executive summary",
  ],
  pro: [
    "Everything in Free",
    "Unlimited snapshots",
    "Brand monitoring dashboard",
    "Score tracking over time",
    "Strategic recommendations",
    "Content gap analysis",
    "1 AI-optimized article/month",
    "PDF report downloads",
    "Email alerts on score changes",
  ],
  elite: [
    "Everything in Pro",
    "Full 60+ prompt audit",
    "9 AI model coverage",
    "Gumshoe competitive intel",
    "Fusion narrative report",
    "8 scoring dimensions",
    "Anti-pattern detection",
    "5 AI-optimized articles/month",
    "Dedicated support",
  ],
};

export function PricingAuthed() {
  const [annual, setAnnual] = useState(true);
  const { user } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleCheckout = async (priceKey: PriceKey) => {
    if (!user) {
      window.location.href = `/new-site/login?next=/new-site/pricing`;
      return;
    }
    setCheckoutLoading(priceKey);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceKey }),
      });
      const { url, error } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        console.error("Checkout error:", error);
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <section id="pricing" className="py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            Simple, transparent
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Start free, scale when ready
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every engagement starts with data. Pick the depth that fits.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-card p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                !annual
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                annual
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              <span className="ml-1.5 text-xs opacity-80">Save 30%</span>
            </button>
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Free */}
          <div className="flex flex-col rounded-3xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-md">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Free
            </span>
            <div className="mt-4">
              <span className="text-4xl font-bold text-foreground">$0</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              See your AI visibility score in 30 seconds
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {features.free.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="/snapshot"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-secondary"
            >
              Check My Score
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Pro — highlighted */}
          <div className="relative flex flex-col rounded-3xl border border-accent bg-accent/5 p-8 shadow-md ring-1 ring-accent/20 transition-shadow hover:shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                Most Popular
              </span>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              Pro
            </span>
            <div className="mt-4">
              <span className="text-4xl font-bold text-foreground">
                ${annual ? "69" : "99"}
              </span>
              <span className="text-sm text-muted-foreground">/mo</span>
            </div>
            {annual && (
              <p className="mt-1 text-xs text-accent">
                Billed annually ($828/yr)
              </p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              Track, monitor, and improve your AI presence
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {features.pro.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() =>
                handleCheckout(annual ? "pro_annual" : "pro_monthly")
              }
              disabled={checkoutLoading !== null}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110 disabled:opacity-50"
            >
              {checkoutLoading === "pro_monthly" || checkoutLoading === "pro_annual"
                ? "Redirecting..."
                : "Go Pro"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Elite */}
          <div className="flex flex-col rounded-3xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-md">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Elite
            </span>
            <div className="mt-4">
              <span className="text-4xl font-bold text-foreground">
                ${annual ? "199" : "299"}
              </span>
              <span className="text-sm text-muted-foreground">
                {annual ? "/yr" : "/mo"}
              </span>
            </div>
            {annual && (
              <p className="mt-1 text-xs text-accent">
                Save over 40% vs monthly
              </p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              Deep competitive audit with strategic narrative
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {features.elite.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() =>
                handleCheckout(annual ? "elite_annual" : "elite_monthly")
              }
              disabled={checkoutLoading !== null}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-secondary disabled:opacity-50"
            >
              {checkoutLoading === "elite_monthly" || checkoutLoading === "elite_annual"
                ? "Redirecting..."
                : "Go Elite"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
