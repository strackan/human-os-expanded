import { redirect } from "next/navigation";
import { getUserPlan } from "@/lib/get-user-plan";
import Link from "next/link";

export default async function DashboardPage() {
  const { plan, user } = await getUserPlan();

  if (!user) redirect("/new-site/login?next=/new-site/dashboard");

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground">
        Welcome back{user.email ? `, ${user.email.split("@")[0]}` : ""}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {plan === "pro" ? "Pro plan" : "Free plan"}
      </p>

      {plan === "free" ? <FreeView /> : <ProView />}
    </div>
  );
}

function FreeView() {
  return (
    <div className="mt-8 space-y-6">
      {/* Saved snapshots placeholder */}
      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">Your Snapshots</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Run a snapshot to see your AI visibility score. Saved snapshots will appear here.
        </p>
        <Link
          href="/snapshot"
          className="mt-4 inline-flex items-center rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110"
        >
          Run Snapshot
        </Link>
      </div>

      {/* Upgrade CTA */}
      <div className="rounded-3xl border border-accent/20 bg-accent/5 p-6 text-center">
        <h3 className="text-lg font-bold text-foreground">
          Unlock Pro Features
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Monitor brands, track scores over time, get strategic recommendations
          and PDF reports.
        </p>
        <Link
          href="/new-site/pricing"
          className="mt-4 inline-flex items-center rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110"
        >
          Go Pro
        </Link>
      </div>
    </div>
  );
}

function ProView() {
  return (
    <div className="mt-8 space-y-6">
      {/* Brand monitoring stub */}
      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">Brand Monitoring</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your monitored brands and score trends will appear here. This
          feature is coming in the next update.
        </p>
      </div>

      {/* Recent snapshots placeholder */}
      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">Recent Snapshots</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your saved snapshot history will appear here.
        </p>
        <Link
          href="/snapshot"
          className="mt-4 inline-flex items-center rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110"
        >
          Run Snapshot
        </Link>
      </div>
    </div>
  );
}
