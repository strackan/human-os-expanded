const faqs = [
  {
    q: "What is an AI visibility score?",
    a: "It measures how often AI assistants — like ChatGPT, Claude, Gemini, and Perplexity — recommend your brand when users ask questions in your category. A higher score means more AI-driven discovery and traffic.",
  },
  {
    q: "Which AI models do you test?",
    a: "We test across 9 major AI models including ChatGPT, Claude, Gemini, Perplexity, Copilot, Meta AI, Mistral, Grok, and DeepSeek. Each model has different training data and recommendation patterns.",
  },
  {
    q: "How long does an audit take?",
    a: "A free snapshot takes about 30 seconds. A full audit — covering competitive analysis, prompt testing across all models, and a detailed report — is typically delivered within 48 hours.",
  },
  {
    q: "Do I need to change my website?",
    a: "Not necessarily. AI visibility improvements often involve content strategy, structured data, and distribution through authoritative publications — not redesigning your site.",
  },
  {
    q: "How is this different from SEO?",
    a: "SEO optimizes for search engine rankings. AI visibility optimizes for how AI assistants understand and recommend your brand. They're complementary — strong SEO helps, but AI models weigh authority, specificity, and structured content differently than Google does.",
  },
  {
    q: "What industries do you work with?",
    a: "We work with brands across financial services, healthcare, SaaS, professional services, e-commerce, and nonprofits. If AI-driven discovery matters to your category, we can help.",
  },
  {
    q: "How do you improve my AI visibility?",
    a: "After the audit identifies gaps, we use our AI article generator to produce LLM-optimized content \u2014 drafted by AI, hardened through multi-pass editing, and scored for readability. Articles are distributed through our 2,500+ publication network. Then we re-measure to confirm improvement.",
  },
  {
    q: "Can I generate articles without a subscription?",
    a: "Yes \u2014 AI-optimized articles are available ad hoc for anyone. Pro subscribers get 1 article per month included, and Elite subscribers get 5 per month.",
  },
  {
    q: "Is the snapshot really free?",
    a: "Yes — enter your domain and get your AI visibility score in 30 seconds. No login, no credit card, no sales call required.",
  },
];

export function Faq() {
  return (
    <section className="border-t border-border bg-secondary/30 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-muted-foreground">
            Everything you need to know about AI visibility.
          </p>
        </div>

        <div className="mt-12 divide-y divide-border">
          {faqs.map((faq) => (
            <details key={faq.q} className="group">
              <summary className="flex cursor-pointer items-center justify-between py-5 text-left text-base font-medium text-foreground transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span className="ml-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/** JSON-LD FAQ schema for SEO — render in page head */
export function FaqSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
