'use client';

import { useState, useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';

interface RSVPFormProps {
  eventId: string;
  currentUser: User | null;
}

export function RSVPForm({ eventId, currentUser }: RSVPFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    guestName: currentUser?.user_metadata?.name || '',
    guestEmail: currentUser?.email || '',
    plusOnes: 0,
  });

  // Auto-focus first field when component mounts or URL hash matches
  useEffect(() => {
    if (window.location.hash === '#rsvp-section') {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('=== RSVP Debug Info ===');
      console.log('Form Data:', formData);
      console.log('Event ID:', eventId);
      console.log('Current User:', currentUser);

      // Call server-side API route instead of client-side Supabase
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: eventId,
          guestName: formData.guestName,
          guestEmail: formData.guestEmail,
          plusOnes: formData.plusOnes,
        }),
      });

      console.log('API response status:', response.status);

      const result = await response.json();
      console.log('API response data:', result);

      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      // Send confirmation email (non-blocking)
      // Temporarily disabled due to Resend domain setup
      // TODO: Re-enable once domain is verified
      /*
      if (rsvpData) {
        fetch('/api/emails/rsvp-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: eventId,
            rsvpId: rsvpData.id,
          }),
        }).catch(err => console.error('Email send failed:', err));
      }
      */

      setSuccess(true);

      // Refresh the page after a short delay to show the updated RSVP status
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      const error = err as Error;
      alert('ERROR CAUGHT: ' + (error.message || error.toString()));
      console.error('=== RSVP Error Details ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error:', JSON.stringify(error, null, 2));
      setError(error.message || 'Failed to submit RSVP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="text-6xl mb-4">✓</div>
        <h3 className="text-2xl font-bold font-mono neon-cyan mb-2">
          YOU&apos;RE ON THE LIST!
        </h3>
        <p className="text-foreground-dim font-mono">
          We&apos;ll send you event details and reminders at <span className="text-neon-cyan">{formData.guestEmail}</span>
        </p>
        <p className="text-foreground-dim font-mono text-sm mt-2">
          Redirecting...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="border-2 border-neon-magenta bg-neon-magenta/10 p-4">
          <p className="text-neon-magenta font-mono text-sm">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="guestName" className="block text-foreground font-mono mb-2">
          Your Name *
        </label>
        <input
          ref={nameInputRef}
          type="text"
          id="guestName"
          required
          value={formData.guestName}
          onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
          className="w-full px-4 py-3 bg-background border-2 border-neon-cyan/30 text-foreground font-mono focus:border-neon-cyan focus:outline-none transition-colors"
          placeholder="Ada Lovelace"
        />
      </div>

      <div>
        <label htmlFor="guestEmail" className="block text-foreground font-mono mb-2">
          Your Email *
        </label>
        <input
          type="email"
          id="guestEmail"
          required
          value={formData.guestEmail}
          onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
          className="w-full px-4 py-3 bg-background border-2 border-neon-cyan/30 text-foreground font-mono focus:border-neon-cyan focus:outline-none transition-colors"
          placeholder="ada@goodhang.club"
        />
      </div>

      <div>
        <label htmlFor="plusOnes" className="block text-foreground font-mono mb-2">
          Plus Ones
        </label>
        <select
          id="plusOnes"
          value={formData.plusOnes}
          onChange={(e) => setFormData({ ...formData, plusOnes: parseInt(e.target.value) })}
          className="w-full px-4 py-3 bg-background border-2 border-neon-cyan/30 text-foreground font-mono focus:border-neon-cyan focus:outline-none transition-colors"
        >
          <option value="0">Just me</option>
          <option value="1">+1 guest</option>
          <option value="2">+2 guests</option>
          <option value="3">+3 guests</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-8 py-3 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-background font-mono uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,204,221,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'SUBMITTING...' : 'CONFIRM RSVP'}
      </button>

      <p className="text-foreground-dim font-mono text-xs text-center">
        By RSVPing, you agree to receive event updates and reminders
      </p>
    </form>
  );
}
