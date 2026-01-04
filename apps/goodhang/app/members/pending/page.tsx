import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function PendingApprovalPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // If user is active, redirect to dashboard
  if (profile?.membership_status === 'active') {
    redirect('/members');
  }

  // Check if they have an application
  const { data: application } = await supabase
    .from('applications')
    .select('*')
    .eq('email', user.email)
    .single();

  const hasApplication = !!application;
  const isInterviewScheduled = !!application?.interview_scheduled_at;

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-neon-purple/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="font-mono text-2xl font-bold">
            <span className="neon-purple">GOOD_HANG</span>
          </Link>
          <div className="flex gap-6 items-center">
            <Link href="/events" className="text-foreground hover:text-neon-cyan transition-colors font-mono">
              Events
            </Link>
            <form action="/auth/signout" method="post">
              <button className="text-foreground-dim hover:text-neon-magenta transition-colors font-mono">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-3xl mx-auto">
          {/* Status Banner */}
          <div className="border-2 border-neon-purple/30 bg-background-lighter p-8 mb-8 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-4xl font-bold font-mono neon-purple mb-4">
              APPLICATION PENDING
            </h1>
            <p className="text-foreground-dim font-mono text-lg">
              Your membership is currently under review
            </p>
          </div>

          {/* What's Next */}
          <div className="border-2 border-neon-cyan/30 bg-background-lighter p-8 mb-8">
            <h2 className="text-2xl font-bold font-mono neon-cyan mb-6">
              WHAT&apos;S NEXT?
            </h2>

            <div className="space-y-6 font-mono">
              {!hasApplication && (
                <div className="border-l-4 border-neon-magenta pl-4">
                  <h3 className="text-lg font-bold text-neon-magenta mb-2">
                    1. Complete Your Application
                  </h3>
                  <p className="text-foreground-dim mb-4">
                    You&apos;ve created an account but haven&apos;t submitted your membership application yet.
                  </p>
                  <Link
                    href="/apply"
                    className="inline-block px-6 py-2 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-background font-mono uppercase tracking-wider transition-all duration-300"
                  >
                    Complete Application
                  </Link>
                </div>
              )}

              {hasApplication && !isInterviewScheduled && (
                <div className="border-l-4 border-neon-cyan pl-4">
                  <h3 className="text-lg font-bold text-neon-cyan mb-2">
                    1. Application Received ✓
                  </h3>
                  <p className="text-foreground-dim">
                    We&apos;ve received your application and our team is reviewing it. You&apos;ll hear from us within 2-3 business days.
                  </p>
                </div>
              )}

              {isInterviewScheduled && (
                <div className="border-l-4 border-neon-cyan pl-4">
                  <h3 className="text-lg font-bold text-neon-cyan mb-2">
                    1. Interview Scheduled ✓
                  </h3>
                  <p className="text-foreground-dim">
                    You should have received an email with interview details. Check your inbox!
                  </p>
                </div>
              )}

              <div className="border-l-4 border-foreground-dim/30 pl-4">
                <h3 className="text-lg font-bold text-foreground-dim mb-2">
                  2. Evaluation Process
                </h3>
                <p className="text-foreground-dim">
                  This may include a brief interview or conversation with a Good Hang team member to ensure mutual fit.
                </p>
              </div>

              <div className="border-l-4 border-foreground-dim/30 pl-4">
                <h3 className="text-lg font-bold text-foreground-dim mb-2">
                  3. Approval & Welcome
                </h3>
                <p className="text-foreground-dim">
                  Once approved, you&apos;ll get full access to the member dashboard, events, and directory.
                </p>
              </div>
            </div>
          </div>

          {/* What You Can Do Now */}
          <div className="border-2 border-neon-magenta/30 bg-background-lighter p-8">
            <h2 className="text-2xl font-bold font-mono neon-magenta mb-6">
              WHILE YOU WAIT
            </h2>

            <div className="space-y-4 font-mono">
              <div>
                <Link
                  href="/events"
                  className="text-neon-cyan hover:text-neon-magenta transition-colors font-bold"
                >
                  → Browse Upcoming Events
                </Link>
                <p className="text-foreground-dim text-sm mt-1">
                  See what kind of experiences Good Hang hosts
                </p>
              </div>

              <div>
                <Link
                  href="/about"
                  className="text-neon-cyan hover:text-neon-magenta transition-colors font-bold"
                >
                  → Learn More About Good Hang
                </Link>
                <p className="text-foreground-dim text-sm mt-1">
                  Understand our mission and community values
                </p>
              </div>

              <div>
                <Link
                  href="/launch"
                  className="text-neon-cyan hover:text-neon-magenta transition-colors font-bold"
                >
                  → RSVP for Launch Party
                </Link>
                <p className="text-foreground-dim text-sm mt-1">
                  Join us for the official launch event
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-8 text-center">
            <p className="text-foreground-dim font-mono text-sm">
              Questions?{' '}
              <a
                href="mailto:hello@goodhang.club"
                className="text-neon-cyan hover:text-neon-magenta transition-colors"
              >
                hello@goodhang.club
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
