'use client';

/**
 * Pending Invites Management Page
 * Allows admins and ambassadors to view and manage pending invites
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface PendingInvite {
  id: string;
  name: string;
  email: string;
  invite_code: string;
  used_at: string | null;
  created_at: string;
}

export default function PendingInvitesPage() {
  const router = useRouter();
  // Create client lazily to avoid SSR issues during build
  const supabase = useMemo(() => createClient(), []);

  const [, setUserRole] = useState<'admin' | 'ambassador' | 'member' | null>(null);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showUsed, setShowUsed] = useState(false);

  const loadInvites = useCallback(async () => {
    // Load all pending invites
    const { data: invitesData, error: invitesError } = await supabase
      .from('pending_invites')
      .select('*')
      .order('created_at', { ascending: false });

    if (invitesError) {
      console.error('Error loading invites:', invitesError);
      setError('Failed to load invites');
    } else {
      setInvites(invitesData || []);
    }
  }, [supabase]);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', user.id)
        .single();

      if (!profile || (profile.user_role !== 'admin' && profile.user_role !== 'ambassador')) {
        router.push('/members');
        return;
      }

      setUserRole(profile.user_role);

      loadInvites();

      setLoading(false);
    }

    loadData();
  }, [supabase, router, loadInvites]);

  const copyToClipboard = (text: string, inviteCode: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(inviteCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const revokeInvite = async (inviteId: string) => {
    const invite = invites.find(inv => inv.id === inviteId);
    const action = invite?.used_at ? 'delete' : 'revoke';

    if (!confirm(`Are you sure you want to ${action} this invite? This cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pending_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      // Remove from local state
      setInvites(invites.filter(inv => inv.id !== inviteId));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert('Failed to revoke invite: ' + errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/members')}
            className="text-gray-400 hover:text-white mb-4"
          >
            ← Back to Members
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Invites</h1>
              <p className="text-gray-400">
                Manage member invitations
              </p>
            </div>
            <button
              onClick={() => router.push('/members/invite')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all duration-200"
            >
              Create New Invite
            </button>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setShowUsed(false)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !showUsed
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Pending ({invites.filter(inv => !inv.used_at).length})
          </button>
          <button
            onClick={() => setShowUsed(true)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showUsed
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Used ({invites.filter(inv => inv.used_at).length})
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Invites List */}
        {invites.filter(inv => showUsed ? inv.used_at : !inv.used_at).length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400 mb-4">No {showUsed ? 'used' : 'pending'} invites</p>
            <button
              onClick={() => router.push('/members/invite')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all duration-200"
            >
              Create Your First Invite
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {invites.filter(inv => showUsed ? inv.used_at : !inv.used_at).map((invite) => (
              <div
                key={invite.id}
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {invite.name}
                    </h3>
                    <p className="text-gray-400 mb-4">{invite.email}</p>

                    <div className="flex gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Invite Code</label>
                        <div className="flex items-center gap-2">
                          <code className="bg-black/50 border border-gray-700 rounded px-3 py-1 text-sm tracking-widest">
                            {invite.invite_code}
                          </code>
                          <button
                            onClick={() => copyToClipboard(invite.invite_code, invite.invite_code)}
                            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm"
                          >
                            {copiedCode === invite.invite_code ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Invite Link</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3200'}/assessment/start?code=${invite.invite_code}`}
                            readOnly
                            className="flex-1 bg-black/50 border border-gray-700 rounded px-3 py-1 text-sm text-gray-400"
                          />
                          <button
                            onClick={() => copyToClipboard(
                              `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3200'}/assessment/start?code=${invite.invite_code}`,
                              `url-${invite.invite_code}`
                            )}
                            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm"
                          >
                            {copiedCode === `url-${invite.invite_code}` ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-4 text-xs text-gray-500">
                      <span>Created {new Date(invite.created_at).toLocaleDateString()}</span>
                      {invite.used_at && (
                        <span className="text-green-400">
                          ✓ Used {new Date(invite.used_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-6">
                    <button
                      onClick={() => revokeInvite(invite.id)}
                      className="px-4 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 text-red-400 rounded text-sm transition-colors"
                    >
                      {invite.used_at ? 'Delete' : 'Revoke'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
