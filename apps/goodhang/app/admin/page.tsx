import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile to check admin status
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Redirect if not admin
  if (profile?.user_role !== 'admin') {
    redirect('/members');
  }

  // Get pending applications count
  const { count: pendingCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Get pending users (accounts created but not approved)
  const { data: pendingUsers, count: pendingUsersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('membership_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10);

  // Get recent applications
  const { data: recentApplications } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  // Get stats
  const { count: activeMembers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('membership_status', 'active');

  const { count: upcomingEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .gte('event_datetime', new Date().toISOString())
    .eq('is_public', true);

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
            <Link href="/members" className="text-foreground hover:text-neon-cyan transition-colors font-mono">
              Members
            </Link>
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold font-mono neon-cyan mb-4">
              ADMIN DASHBOARD
            </h1>
            <p className="text-foreground-dim font-mono text-lg">
              Welcome back, {profile?.name}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="border-2 border-neon-cyan/30 bg-background-lighter p-6">
              <div className="text-4xl font-bold font-mono neon-cyan mb-2">
                {pendingCount || 0}
              </div>
              <div className="text-foreground-dim font-mono text-sm uppercase">
                Pending Applications
              </div>
            </div>

            <div className="border-2 border-neon-purple/30 bg-background-lighter p-6">
              <div className="text-4xl font-bold font-mono neon-purple mb-2">
                {pendingUsersCount || 0}
              </div>
              <div className="text-foreground-dim font-mono text-sm uppercase">
                Pending Users
              </div>
            </div>

            <div className="border-2 border-neon-magenta/30 bg-background-lighter p-6">
              <div className="text-4xl font-bold font-mono neon-magenta mb-2">
                {activeMembers || 0}
              </div>
              <div className="text-foreground-dim font-mono text-sm uppercase">
                Active Members
              </div>
            </div>

            <div className="border-2 border-foreground-dim/20 bg-background-lighter p-6">
              <div className="text-4xl font-bold font-mono text-foreground mb-2">
                {upcomingEvents || 0}
              </div>
              <div className="text-foreground-dim font-mono text-sm uppercase">
                Upcoming Events
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Link
              href="/admin/applications"
              className="border-2 border-neon-cyan/30 hover:border-neon-cyan bg-background-lighter p-6 transition-all hover:scale-105"
            >
              <h3 className="text-xl font-bold font-mono neon-cyan mb-2">
                Review Applications
              </h3>
              <p className="text-foreground-dim font-mono text-sm">
                Approve or reject membership applications
              </p>
            </Link>

            <Link
              href="/admin/members"
              className="border-2 border-neon-purple/30 hover:border-neon-purple bg-background-lighter p-6 transition-all hover:scale-105"
            >
              <h3 className="text-xl font-bold font-mono neon-purple mb-2">
                Manage Members
              </h3>
              <p className="text-foreground-dim font-mono text-sm">
                View and manage member profiles
              </p>
            </Link>

            <Link
              href="/admin/events"
              className="border-2 border-neon-magenta/30 hover:border-neon-magenta bg-background-lighter p-6 transition-all hover:scale-105"
            >
              <h3 className="text-xl font-bold font-mono neon-magenta mb-2">
                Manage Events
              </h3>
              <p className="text-foreground-dim font-mono text-sm">
                Create and manage events
              </p>
            </Link>

            <Link
              href="/admin/invites"
              className="border-2 border-green-500/30 hover:border-green-500 bg-background-lighter p-6 transition-all hover:scale-105"
            >
              <h3 className="text-xl font-bold font-mono text-green-400 mb-2">
                Invite Codes
              </h3>
              <p className="text-foreground-dim font-mono text-sm">
                Generate and manage invite codes
              </p>
            </Link>
          </div>

          {/* Pending Users Table */}
          {pendingUsers && pendingUsers.length > 0 && (
            <div className="border-2 border-neon-cyan/30 bg-background-lighter p-6 mb-8">
              <h2 className="text-2xl font-bold font-mono neon-cyan mb-6">
                PENDING USERS
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-sm">
                  <thead>
                    <tr className="border-b border-neon-cyan/20">
                      <th className="text-left py-3 text-foreground-dim">Name</th>
                      <th className="text-left py-3 text-foreground-dim">Email</th>
                      <th className="text-left py-3 text-foreground-dim">Signed Up</th>
                      <th className="text-right py-3 text-foreground-dim">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((user) => (
                      <tr key={user.id} className="border-b border-foreground-dim/10">
                        <td className="py-3 text-foreground">{user.name}</td>
                        <td className="py-3 text-foreground-dim">{user.email}</td>
                        <td className="py-3 text-foreground-dim">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="text-neon-cyan hover:text-neon-magenta transition-colors"
                          >
                            Review →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Applications Table */}
          {recentApplications && recentApplications.length > 0 && (
            <div className="border-2 border-neon-purple/30 bg-background-lighter p-6">
              <h2 className="text-2xl font-bold font-mono neon-purple mb-6">
                RECENT APPLICATIONS
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-sm">
                  <thead>
                    <tr className="border-b border-neon-purple/20">
                      <th className="text-left py-3 text-foreground-dim">Name</th>
                      <th className="text-left py-3 text-foreground-dim">Email</th>
                      <th className="text-left py-3 text-foreground-dim">Status</th>
                      <th className="text-left py-3 text-foreground-dim">Submitted</th>
                      <th className="text-right py-3 text-foreground-dim">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApplications.map((app) => (
                      <tr key={app.id} className="border-b border-foreground-dim/10">
                        <td className="py-3 text-foreground">{app.name}</td>
                        <td className="py-3 text-foreground-dim">{app.email}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 text-xs uppercase ${
                              app.status === 'pending'
                                ? 'bg-neon-cyan/20 text-neon-cyan'
                                : app.status === 'approved'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-neon-magenta/20 text-neon-magenta'
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3 text-foreground-dim">
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/admin/applications/${app.id}`}
                            className="text-neon-cyan hover:text-neon-magenta transition-colors"
                          >
                            Review →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
