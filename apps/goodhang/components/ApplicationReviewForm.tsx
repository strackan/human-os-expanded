'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Application, Profile } from '@/lib/types/database';

interface ApplicationReviewFormProps {
  application: Application;
  userAccount: Profile | null;
  adminId: string;
}

export function ApplicationReviewForm({
  application,
  userAccount,
  adminId,
}: ApplicationReviewFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    interview_scheduled_at: application.interview_scheduled_at || '',
    interview_notes: application.interview_notes || '',
    admin_notes: application.admin_notes || '',
    rejection_reason: application.rejection_reason || '',
  });

  const handleSaveNotes = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('applications')
        .update({
          interview_scheduled_at: formData.interview_scheduled_at || null,
          interview_notes: formData.interview_notes || null,
          admin_notes: formData.admin_notes || null,
        })
        .eq('id', application.id);

      if (updateError) throw updateError;

      router.refresh();
      alert('Notes saved successfully');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save notes';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!userAccount) {
      alert('User must create an account before approval. Ask them to sign up at /login first.');
      return;
    }

    if (!confirm(`Approve ${application.name}'s application and grant them access?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Update application status
      const { error: appError } = await supabase
        .from('applications')
        .update({
          status: 'approved',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', application.id);

      if (appError) throw appError;

      // Update user profile to active
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          membership_status: 'active',
        })
        .eq('id', userAccount.id);

      if (profileError) throw profileError;

      // Send approval email (non-blocking)
      fetch('/api/emails/membership-approved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userAccount.id,
        }),
      }).catch(err => console.error('Email send failed:', err));

      alert('Application approved! User now has active membership.');
      router.push('/admin');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve application';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!formData.rejection_reason.trim()) {
      alert('Please provide a rejection reason before rejecting.');
      return;
    }

    if (!confirm(`Reject ${application.name}'s application? This cannot be easily undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: 'rejected',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: formData.rejection_reason,
        })
        .eq('id', application.id);

      if (updateError) throw updateError;

      alert('Application rejected.');
      router.push('/admin');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject application';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isPending = application.status === 'pending';

  return (
    <div className="space-y-6">
      {error && (
        <div className="border-2 border-neon-magenta bg-neon-magenta/10 p-4">
          <p className="text-neon-magenta font-mono text-sm">{error}</p>
        </div>
      )}

      {/* Evaluation Notes */}
      <div className="border-2 border-neon-purple/30 bg-background-lighter p-8">
        <h2 className="text-2xl font-bold font-mono neon-purple mb-6">
          EVALUATION & NOTES
        </h2>

        <div className="space-y-6">
          {/* Interview Scheduled */}
          <div>
            <label htmlFor="interview_scheduled" className="block text-foreground font-mono mb-2">
              Interview Scheduled At
            </label>
            <input
              type="datetime-local"
              id="interview_scheduled"
              value={formData.interview_scheduled_at ? new Date(formData.interview_scheduled_at).toISOString().slice(0, 16) : ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  interview_scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : '',
                })
              }
              className="w-full px-4 py-3 bg-background border-2 border-neon-cyan/30 text-foreground font-mono focus:border-neon-cyan focus:outline-none transition-colors"
            />
            <p className="text-foreground-dim font-mono text-xs mt-1">
              Optional: Track when you&apos;ve scheduled their evaluation interview
            </p>
          </div>

          {/* Interview Notes */}
          <div>
            <label htmlFor="interview_notes" className="block text-foreground font-mono mb-2">
              Interview Notes
            </label>
            <textarea
              id="interview_notes"
              rows={4}
              value={formData.interview_notes}
              onChange={(e) => setFormData({ ...formData, interview_notes: e.target.value })}
              className="w-full px-4 py-3 bg-background border-2 border-neon-cyan/30 text-foreground font-mono focus:border-neon-cyan focus:outline-none transition-colors"
              placeholder="Notes from interview or evaluation conversation..."
            />
          </div>

          {/* Admin Notes */}
          <div>
            <label htmlFor="admin_notes" className="block text-foreground font-mono mb-2">
              Internal Admin Notes
            </label>
            <textarea
              id="admin_notes"
              rows={3}
              value={formData.admin_notes}
              onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
              className="w-full px-4 py-3 bg-background border-2 border-neon-cyan/30 text-foreground font-mono focus:border-neon-cyan focus:outline-none transition-colors"
              placeholder="Any internal notes about this application..."
            />
          </div>

          {/* Save Notes Button */}
          <button
            type="button"
            onClick={handleSaveNotes}
            disabled={loading}
            className="px-6 py-2 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-background font-mono uppercase tracking-wider transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'SAVING...' : 'SAVE NOTES'}
          </button>
        </div>
      </div>

      {/* Approval Actions */}
      {isPending && (
        <div className="border-2 border-neon-magenta/30 bg-background-lighter p-8">
          <h2 className="text-2xl font-bold font-mono neon-magenta mb-6">
            APPROVAL DECISION
          </h2>

          <div className="space-y-6">
            {/* Rejection Reason (only show if rejecting) */}
            <div>
              <label htmlFor="rejection_reason" className="block text-foreground font-mono mb-2">
                Rejection Reason (if rejecting)
              </label>
              <textarea
                id="rejection_reason"
                rows={3}
                value={formData.rejection_reason}
                onChange={(e) => setFormData({ ...formData, rejection_reason: e.target.value })}
                className="w-full px-4 py-3 bg-background border-2 border-neon-magenta/30 text-foreground font-mono focus:border-neon-magenta focus:outline-none transition-colors"
                placeholder="Reason for rejection (will be stored internally)..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleApprove}
                disabled={loading || !userAccount}
                className="flex-1 px-6 py-3 border-2 border-green-500 text-green-400 hover:bg-green-500 hover:text-background font-mono uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!userAccount ? 'User must create account first' : 'Approve application'}
              >
                ✓ APPROVE
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={loading}
                className="flex-1 px-6 py-3 border-2 border-neon-magenta text-neon-magenta hover:bg-neon-magenta hover:text-background font-mono uppercase tracking-wider transition-all duration-300 disabled:opacity-50"
              >
                ✗ REJECT
              </button>
            </div>

            {!userAccount && (
              <p className="text-neon-magenta font-mono text-sm">
                ⚠ User must create an account at /login before you can approve their application.
                Send them the login link!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Already Reviewed */}
      {!isPending && (
        <div className="border-2 border-foreground-dim/20 bg-background-lighter p-8 text-center">
          <p className="text-foreground-dim font-mono">
            This application has already been reviewed.
          </p>
          {application.reviewed_at && (
            <p className="text-foreground-dim font-mono text-sm mt-2">
              Reviewed on {new Date(application.reviewed_at).toLocaleDateString()}
            </p>
          )}
          {application.rejection_reason && (
            <div className="mt-4 pt-4 border-t border-foreground-dim/20">
              <p className="text-foreground-dim font-mono text-sm mb-2">Rejection Reason:</p>
              <p className="text-foreground font-mono text-sm">{application.rejection_reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
