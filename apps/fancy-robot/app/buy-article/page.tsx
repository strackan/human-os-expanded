"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  PenTool,
  ShieldCheck,
  Code,
  FileText,
  BarChart3,
  Quote,
  Cpu,
  Clock,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

function BuyArticleContent() {
  const searchParams = useSearchParams();
  const title = searchParams.get("title");
  const gap = searchParams.get("gap");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
              <span className="text-sm font-bold text-primary-foreground">
                FR
              </span>
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              Fancy Robot
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pt-16 pb-16">
        {/* Hero */}
        <section className="text-center">
          <div className="mx-auto max-w-2xl">
            <span className="inline-block rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs font-semibold text-accent">
              $9.99 per article
            </span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              AI-Optimized Articles That Close Visibility Gaps
            </h1>
            {title ? (
              <div className="mt-6 rounded-2xl border border-accent/20 bg-accent/5 px-6 py-5">
                <p className="text-sm font-medium text-muted-foreground">
                  Your Article
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {title}
                </p>
                {gap && (
                  <p className="mt-2 text-sm text-accent/80">
                    Addresses: {gap}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-5 text-lg text-muted-foreground">
                Get a publication-ready article in minutes — optimized for AI
                model training data so your brand shows up when it matters.
              </p>
            )}
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-foreground">
            How It Works
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Search,
                step: "1",
                title: "Research",
                desc: "AI analyzes your domain, competitors, and content gaps to find the strongest angle.",
              },
              {
                icon: PenTool,
                step: "2",
                title: "Write",
                desc: "1,600-word long-form draft with spokesperson quotes and data points.",
              },
              {
                icon: ShieldCheck,
                step: "3",
                title: "Edit",
                desc: "Multi-pass editor hardens for accuracy, readability, and AI optimization.",
              },
              {
                icon: Code,
                step: "4",
                title: "Optimize",
                desc: "HTML conversion with JSON-LD schema, FAQ markup, and AIO scoring.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-3xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-sm font-bold text-accent border border-accent/20">
                    {item.step}
                  </span>
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* What You Get */}
        <section className="py-16">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-foreground">
            What You Get
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: FileText,
                title: "Two Versions",
                desc: "Wire-distribution-ready (~400 words) AND long-form (~1,600 words) versions included.",
              },
              {
                icon: BarChart3,
                title: "AI Readability Score 75-87",
                desc: "Proven via A/B testing to maximize AI model comprehension and citation.",
              },
              {
                icon: Code,
                title: "Structured Data Built In",
                desc: "JSON-LD structured data and FAQ schema markup for maximum discoverability.",
              },
              {
                icon: Quote,
                title: "Spokesperson Integration",
                desc: "Named, attributed spokesperson quotes woven naturally into the narrative.",
              },
              {
                icon: Cpu,
                title: "AI Training-Optimized",
                desc: "Optimized for AI model training data — ChatGPT, Claude, Gemini, and Perplexity.",
              },
              {
                icon: FileText,
                title: "Ready for CMS",
                desc: "Delivered as Markdown + HTML, ready to paste into any content management system.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
              >
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Peace of Mind */}
        <section className="py-16">
          <div className="mx-auto max-w-lg rounded-3xl border border-accent/20 bg-accent/5 p-8 text-center">
            <h2 className="text-xl font-bold text-foreground">
              Satisfaction Guaranteed
            </h2>
            <div className="mt-5 space-y-3">
              {[
                {
                  icon: RefreshCw,
                  text: "Unlimited revisions until you're happy",
                },
                {
                  icon: ShieldCheck,
                  text: "Full refund if article doesn't meet quality standards",
                },
                {
                  icon: Clock,
                  text: "Delivered within 24 hours",
                },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center justify-center gap-2"
                >
                  <item.icon className="h-4 w-4 text-accent" />
                  <p className="text-sm text-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">
              One article, zero hassle
            </p>
            <p className="mt-2 text-4xl font-bold text-foreground">$9.99</p>
            <button
              onClick={() =>
                alert(
                  "Stripe checkout coming soon! Contact us at hello@fancyrobot.com to purchase."
                )
              }
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110"
            >
              Get My Article — $9.99
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              One-time purchase. No subscription.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto max-w-2xl space-y-3">
            <FaqItem
              q="How long does it take?"
              a="Most articles are delivered within 24 hours. Our AI pipeline handles research, writing, editing, and optimization automatically — you'll receive both a long-form and wire-distribution version."
            />
            <FaqItem
              q="What formats do I receive?"
              a="You get two versions: a ~1,600-word long-form article (Markdown) and a ~400-word wire-distribution article (HTML with JSON-LD and FAQ schema). Both are ready for immediate publishing."
            />
            <FaqItem
              q="Can I request edits?"
              a="Absolutely. Every article includes unlimited revisions. If something doesn't match your brand voice or needs adjustments, we'll revise until you're satisfied."
            />
            <FaqItem
              q="What if I'm not satisfied?"
              a="We offer a full refund if the article doesn't meet our quality standards. Your satisfaction is guaranteed — no questions asked."
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Fancy Robot Creative
        </Link>{" "}
        · AI Visibility Intelligence
      </footer>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-foreground">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function BuyArticlePage() {
  return (
    <Suspense>
      <BuyArticleContent />
    </Suspense>
  );
}
