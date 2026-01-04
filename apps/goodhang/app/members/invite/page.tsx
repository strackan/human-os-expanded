'use client';

/**
 * Invite User Page
 * Allows admins and ambassadors to create invite codes
 * - Admins can invite to any region
 * - Ambassadors can only invite to their region
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Region {
  id: string;
  name: string;
  slug: string;
}

export default function InvitePage() {
  const router = useRouter();
  // Create client lazily to avoid SSR issues during build
  const supabase = useMemo(() => createClient(), []);

  const [userRole, setUserRole] = useState<'admin' | 'ambassador' | 'member' | null>(null);
  const [, setUserRegionId] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

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
        .select('user_role, region_id')
        .eq('id', user.id)
        .single();

      if (!profile || (profile.user_role !== 'admin' && profile.user_role !== 'ambassador')) {
        router.push('/members');
        return;
      }

      setUserRole(profile.user_role);
      setUserRegionId(profile.region_id);

      // Load regions
      const { data: regionsData } = await supabase
        .from('regions')
        .select('*')
        .order('name');

      if (regionsData) {
        setRegions(regionsData);
        // Pre-select ambassador's region
        if (profile.user_role === 'ambassador' && profile.region_id) {
          setSelectedRegion(profile.region_id);
        }
      }

      setLoading(false);
    }

    loadData();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    setInviteCode(null);
    setInviteUrl(null);

    try {
      const response = await fetch('/api/invites/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          company: company || undefined,
          job_title: jobTitle || undefined,
          linkedin_url: linkedinUrl || undefined,
          region_id: selectedRegion || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create invite');
      }

      const data = await response.json();

      setInviteCode(data.invite.invite_code);
      setInviteUrl(data.invite.invite_url);

      // Clear form
      setName('');
      setEmail('');
      setCompany('');
      setJobTitle('');
      setLinkedinUrl('');
      if (userRole !== 'ambassador') {
        setSelectedRegion('');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invite';

      // Check for duplicate email error
      if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        setError('An invite for this email already exists. Check pending invites or use a different email.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
      <div className="max-w-2xl mx-auto">
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
              <h1 className="text-4xl font-bold mb-2">Invite New Member</h1>
              <p className="text-gray-400">
                {userRole === 'admin'
                  ? 'Create an invite code to onboard a new member to any region'
                  : `Create an invite code to onboard a new member to your region`}
              </p>
            </div>
            <button
              onClick={() => router.push('/members/invites')}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-200"
            >
              View Pending Invites
            </button>
          </div>
        </div>

        {/* Success Message */}
        {inviteCode && inviteUrl && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-green-400 mb-4">✓ Invite Created!</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Invite Code</label>
                <div className="flex gap-2">
                  <code className="flex-1 bg-black/50 border border-gray-700 rounded px-4 py-3 text-lg tracking-widest">
                    {inviteCode}
                  </code>
                  <button
                    onClick={() => copyToClipboard(inviteCode)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Invite Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteUrl}
                    readOnly
                    className="flex-1 bg-black/50 border border-gray-700 rounded px-4 py-2 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(inviteUrl)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setInviteCode(null);
                setInviteUrl(null);
              }}
              className="mt-4 text-green-400 hover:text-green-300"
            >
              Create Another Invite →
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="jane@example.com"
              />
            </div>

            {userRole === 'admin' && (
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-300 mb-2">
                  Region
                </label>
                <select
                  id="region"
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">No region</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-2">
                Company
              </label>
              <input
                type="text"
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="Acme Inc"
              />
            </div>

            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-300 mb-2">
                Job Title
              </label>
              <input
                type="text"
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="Head of Customer Success"
              />
            </div>

            <div>
              <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-300 mb-2">
                LinkedIn URL
              </label>
              <input
                type="url"
                id="linkedinUrl"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="https://linkedin.com/in/janedoe"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !name || !email}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200"
          >
            {submitting ? 'Creating Invite...' : 'Generate Invite Code'}
          </button>
        </form>
      </div>
    </div>
  );
}
