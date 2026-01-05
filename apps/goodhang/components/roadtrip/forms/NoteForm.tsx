'use client';

import { useState } from 'react';
import { RoadtripMessage } from '@/types/roadtrip';
import { submitMessage } from '@/lib/roadtrip/api';
import Modal from '@/components/roadtrip/ui/Modal';
import Button from '@/components/roadtrip/ui/Button';
import Input from '@/components/roadtrip/ui/Input';
import Textarea from '@/components/roadtrip/ui/Textarea';

interface NoteFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NoteForm({ isOpen, onClose }: NoteFormProps) {
  const [formData, setFormData] = useState<Partial<RoadtripMessage>>({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.email || !formData.message) {
      setError('Please fill in your email and message');
      setIsSubmitting(false);
      return;
    }

    const result = await submitMessage(formData as RoadtripMessage);

    if (result.success) {
      setIsSuccess(true);
    } else {
      setError(result.error || 'Something went wrong. Please try again.');
    }

    setIsSubmitting(false);
  };

  if (isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} variant="index-card">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="rt-heading-elegant text-2xl font-bold text-[var(--rt-navy)] mb-2">
            Note Received!
          </h2>
          <p className="rt-typewriter text-[var(--rt-cork-dark)] mb-6">
            Thanks for reaching out.
            <br />
            I&apos;ll get back to you soon.
          </p>
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Me a Note"
      variant="index-card"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="rt-typewriter text-sm text-[var(--rt-cork-dark)] mb-4">
          Got something on your mind? Drop me a line.
        </p>

        <Input
          label="Name (optional)"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Your name"
        />

        <Input
          label="Email *"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="your@email.com"
          required
        />

        <Textarea
          label="Message *"
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          placeholder="What's on your mind?"
          required
        />

        {error && (
          <div className="p-3 bg-[var(--rt-rust)]/10 border border-[var(--rt-rust)] rounded text-[var(--rt-rust)] text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} fullWidth>
            {isSubmitting ? 'Sending...' : 'Send Note'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
