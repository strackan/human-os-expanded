import { useState } from "react";
import { checkPromoCode } from "@/lib/lite-report-client";

export function InputStep({
  domain,
  promoCode,
  onDomainChange,
  onPromoCodeChange,
  onSubmit,
}: {
  domain: string;
  promoCode: string;
  onDomainChange: (value: string) => void;
  onPromoCodeChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [showPromo, setShowPromo] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
          Does AI recommend{" "}
          <span className="text-accent">your brand?</span>
        </h2>
        <p className="mt-4 max-w-lg mx-auto text-muted-foreground">
          Enter your domain to get a free AI Visibility Snapshot. We'll
          analyze how AI models see your brand vs. competitors across key
          audience personas and topics.
        </p>
      </div>

      <div className="w-full max-w-lg">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              value={domain}
              onChange={(e) => onDomainChange(e.target.value)}
              placeholder="yourdomain.com"
              autoFocus
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="submit"
              disabled={!domain.trim()}
              className="w-full rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Get Your AI Visibility Score
            </button>
            <p className="text-xs text-muted-foreground/70 text-center">
              ~30 seconds &middot; 20 AI prompts &middot; 4 personas
              &middot; Free
            </p>
          </form>

          {/* Promo code toggle */}
          {!showPromo ? (
            promoCode ? (
              <p className="mt-4 text-center text-xs text-accent font-medium">
                Promo code applied{" "}
                <button
                  onClick={() => {
                    onPromoCodeChange("");
                    setShowPromo(false);
                  }}
                  className="text-muted-foreground hover:text-foreground ml-1 underline"
                >
                  remove
                </button>
              </p>
            ) : (
              <button
                onClick={() => setShowPromo(true)}
                className="block mx-auto mt-4 text-xs text-muted-foreground hover:text-foreground"
              >
                Have a promo code?
              </button>
            )
          ) : (
            <div className="mt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    onPromoCodeChange(e.target.value);
                    setPromoError(null);
                  }}
                  placeholder="Enter code"
                  autoFocus
                  className={`flex-1 rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 ${
                    promoError
                      ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                      : "border-border focus:border-accent focus:ring-accent/20"
                  }`}
                />
                <button
                  onClick={async () => {
                    const code = promoCode.trim();
                    if (!code) return;
                    setPromoError(null);
                    setPromoLoading(true);
                    try {
                      const valid = await checkPromoCode(code);
                      if (valid) {
                        setShowPromo(false);
                      } else {
                        setPromoError("Invalid or expired promo code");
                      }
                    } catch {
                      setPromoError("Could not verify code — try again");
                    } finally {
                      setPromoLoading(false);
                    }
                  }}
                  disabled={!promoCode.trim() || promoLoading}
                  className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {promoLoading ? "..." : "Apply"}
                </button>
                <button
                  onClick={() => {
                    onPromoCodeChange("");
                    setPromoError(null);
                    setShowPromo(false);
                  }}
                  className="rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
              {promoError && (
                <p className="mt-2 text-center text-xs text-destructive">
                  {promoError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
