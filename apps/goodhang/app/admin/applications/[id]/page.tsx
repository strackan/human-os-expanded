import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ApplicationReviewForm } from '@/components/ApplicationReviewForm';

export default async function ApplicationReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check admin status
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_role')
    .eq('id', user.id)
    .single();

  if (profile?.user_role !== 'admin') {
    redirect('/members');
  }

  // Get application details
  const { data: application, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !application) {
    redirect('/admin/applications');
  }

  // Check if user account exists
  const { data: userAccount } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', application.email)
    .single();

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-neon-purple/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="font-mono text-2xl font-bold">
            <span className="neon-purple">GOOD_HANG</span>
            <span className="text-neon-cyan text-sm ml-2">ADMIN</span>
          </Link>
          <div className="flex gap-6 items-center">
            <Link href="/admin" className="text-foreground hover:text-neon-cyan transition-colors font-mono">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-mono neon-cyan mb-4">
              APPLICATION REVIEW
            </h1>
            <div className="flex items-center gap-4">
              <span
                className={`px-3 py-1 text-sm uppercase font-mono ${
                  application.status === 'pending'
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan'
                    : application.status === 'approved'
                    ? 'bg-green-500/20 text-green-400 border border-green-400'
                    : 'bg-neon-magenta/20 text-neon-magenta border border-neon-magenta'
                }`}
              >
                {application.status}
              </span>
              <span className="text-foreground-dim font-mono text-sm">
                Submitted {new Date(application.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* User Account Status */}
          <div className="border-2 border-neon-purple/30 bg-background-lighter p-6 mb-8">
            <h2 className="text-xl font-bold font-mono neon-purple mb-4">
              USER ACCOUNT STATUS
            </h2>
            {userAccount ? (
              <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground-dim">Account Created:</span>
                  <span className="text-foreground">
                    {new Date(userAccount.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-dim">Membership Status:</span>
                  <span
                    className={`font-bold ${
                      userAccount.membership_status === 'active'
                        ? 'text-green-400'
                        : userAccount.membership_status === 'pending'
                        ? 'text-neon-cyan'
                        : 'text-neon-magenta'
                    }`}
                  >
                    {userAccount.membership_status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-dim">User ID:</span>
                  <span className="text-foreground-dim text-xs">{userAccount.id}</span>
                </div>
              </div>
            ) : (
              <p className="text-foreground-dim font-mono text-sm">
                No user account created yet. User will need to sign up at /login.
              </p>
            )}
          </div>

          {/* Application Details */}
          <div className="border-2 border-neon-cyan/30 bg-background-lighter p-8 mb-8">
            <h2 className="text-2xl font-bold font-mono neon-cyan mb-6">
              APPLICATION DETAILS
            </h2>

            <div className="space-y-6 font-mono">
              <div>
                <label className="text-foreground-dim text-sm uppercase block mb-2">
                  Name
                </label>
                <p className="text-foreground text-lg">{application.name}</p>
              </div>

              <div>
                <label className="text-foreground-dim text-sm uppercase block mb-2">
                  Email
                </label>
                <p className="text-foreground">{application.email}</p>
              </div>

              {application.linkedin_url && (
                <div>
                  <label className="text-foreground-dim text-sm uppercase block mb-2">
                    LinkedIn
                  </label>
                  <a
                    href={application.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neon-cyan hover:text-neon-magenta transition-colors"
                  >
                    {application.linkedin_url}
                  </a>
                </div>
              )}

              <div>
                <label className="text-foreground-dim text-sm uppercase block mb-2">
                  Why do you want to join Good Hang?
                </label>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {application.why_join}
                </p>
              </div>

              {application.contribution && (
                <div>
                  <label className="text-foreground-dim text-sm uppercase block mb-2">
                    What can you contribute?
                  </label>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {application.contribution}
                  </p>
                </div>
              )}

              {application.referral_source && (
                <div>
                  <label className="text-foreground-dim text-sm uppercase block mb-2">
                    How did you hear about us?
                  </label>
                  <p className="text-foreground">{application.referral_source}</p>
                </div>
              )}
            </div>
          </div>

          {/* Review Form */}
          <ApplicationReviewForm
            application={application}
            userAccount={userAccount}
            adminId={user.id}
          />
        </div>
      </main>
    </div>
  );
}
