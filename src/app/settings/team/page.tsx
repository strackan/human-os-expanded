'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Mail,
  Trash2,
  Crown,
  UserX
} from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  status: number;
  is_admin: boolean;
  created_at: string;
}

export default function TeamManagementPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!profile) {
        router.push('/no-access');
      } else if (!profile.is_admin) {
        router.push('/dashboard');
      } else {
        fetchTeamMembers();
      }
    }
  }, [authLoading, profile, router]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/team/members');
      if (!response.ok) throw new Error('Failed to fetch team members');
      const data = await response.json();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!inviteEmail) {
      setError('Please enter an email address');
      return;
    }

    try {
      setInviting(true);
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to invite user');
      }

      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      fetchTeamMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const toggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    try {
      const response = await fetch(`/api/team/${userId}/promote`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_admin: !currentlyAdmin })
      });

      if (!response.ok) throw new Error('Failed to update admin status');

      setSuccess(currentlyAdmin ? 'Admin removed' : 'User promoted to admin');
      fetchTeamMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const disableUser = async (userId: string) => {
    if (!confirm('Are you sure you want to disable this user? They will lose access to the app.')) {
      return;
    }

    try {
      const response = await fetch(`/api/team/${userId}/disable`, {
        method: 'PATCH'
      });

      if (!response.ok) throw new Error('Failed to disable user');

      setSuccess('User disabled successfully');
      fetchTeamMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable user');
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Disabled</span>;
      case 1:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span>;
      case 2:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Pending</span>;
      default:
        return null;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const activeMembers = members.filter(m => m.status === 1);
  const pendingInvites = members.filter(m => m.status === 2);
  const disabledMembers = members.filter(m => m.status === 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Management</h1>
        <p className="text-gray-600">Invite and manage your team members</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Invite Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <UserPlus className="h-5 w-5 mr-2" />
          Invite Team Member
        </h2>
        <form onSubmit={handleInvite} className="flex gap-3">
          <input
            type="email"
            placeholder="email@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={inviting}
          />
          <button
            type="submit"
            disabled={inviting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {inviting ? 'Sending...' : 'Invite'}
          </button>
        </form>
        <p className="mt-2 text-sm text-gray-500">
          An invitation will be created. The user can sign in with this email to join your workspace.
        </p>
      </div>

      {/* Active Members */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Active Members ({activeMembers.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {activeMembers.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {member.full_name?.[0] || member.email[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.full_name || member.email}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(member.status)}
                {member.is_admin && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 flex items-center">
                    <Crown className="h-3 w-3 mr-1" />
                    Admin
                  </span>
                )}
                {member.id !== profile?.id && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleAdmin(member.id, member.is_admin)}
                      className={`p-2 rounded-lg ${
                        member.is_admin
                          ? 'text-purple-600 hover:bg-purple-50'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title={member.is_admin ? 'Remove admin' : 'Make admin'}
                    >
                      {member.is_admin ? <Shield className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => disableUser(member.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Disable user"
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {activeMembers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No active members
            </div>
          )}
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Pending Invitations ({pendingInvites.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{invite.email}</p>
                    <p className="text-sm text-gray-500">Invited {new Date(invite.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {getStatusBadge(invite.status)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disabled Users */}
      {disabledMembers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <UserX className="h-5 w-5 mr-2" />
              Disabled Users ({disabledMembers.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {disabledMembers.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between opacity-60">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <UserX className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.full_name || member.email}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                {getStatusBadge(member.status)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
