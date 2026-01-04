'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function NotApprovedPage() {
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    city: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setFormData({ email: '', city: '', message: '' });
        setTimeout(() => {
          setShowContactForm(false);
          setSubmitSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-neon-purple/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="font-mono text-2xl font-bold">
            <span className="neon-purple">GOOD_HANG</span>
          </Link>
          <div className="flex gap-6 items-center">
            <Link href="/" className="text-foreground hover:text-neon-cyan transition-colors font-mono">
              Home
            </Link>
            <Link href="/about" className="text-foreground hover:text-neon-cyan transition-colors font-mono">
              About
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-mono neon-purple mb-6">
              Thanks for your interest in Good Hang.
            </h1>
            <p className="text-xl text-foreground-dim font-mono max-w-2xl mx-auto">
              Right now, we&apos;re building carefully to ensure great experiences for our members.
              We&apos;ll keep your assessment on file and reach out when we have availability.
            </p>
          </div>

          {/* Contact Section */}
          <div className="border-2 border-neon-cyan/30 bg-background-lighter p-8 mb-8">
            <h2 className="text-2xl font-bold font-mono neon-cyan mb-4">
              Want Good Hang in your city?
            </h2>
            <p className="text-foreground-dim font-mono mb-6">
              We&apos;re expanding all the time.{' '}
              {!showContactForm && (
                <button
                  onClick={() => setShowContactForm(true)}
                  className="text-neon-purple hover:text-neon-magenta underline transition-colors"
                >
                  Drop us a note
                </button>
              )}
              {' '}or email us at{' '}
              <a
                href="mailto:help@goodhang.club"
                className="text-neon-purple hover:text-neon-magenta transition-colors underline"
              >
                help@goodhang.club
              </a>
            </p>

            {/* Collapsible Contact Form */}
            {showContactForm && (
              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                {submitSuccess && (
                  <div className="bg-neon-cyan/10 border border-neon-cyan/30 p-4">
                    <p className="text-neon-cyan font-mono text-center">
                      Thanks! We&apos;ll be in touch soon.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-foreground-dim font-mono text-sm mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-background border-2 border-neon-cyan/30 text-foreground font-mono focus:border-neon-cyan focus:outline-none transition-colors"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-foreground-dim font-mono text-sm mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 bg-background border-2 border-neon-cyan/30 text-foreground font-mono focus:border-neon-cyan focus:outline-none transition-colors"
                    placeholder="San Francisco, CA"
                  />
                </div>

                <div>
                  <label className="block text-foreground-dim font-mono text-sm mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-background border-2 border-neon-cyan/30 text-foreground font-mono focus:border-neon-cyan focus:outline-none transition-colors resize-none"
                    placeholder="Tell us about your city and why you'd like Good Hang there..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-neon-cyan text-background font-mono font-bold hover:bg-neon-magenta transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="px-6 py-3 border-2 border-neon-purple/30 text-neon-purple font-mono hover:border-neon-purple transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer Info */}
          <div className="text-center text-foreground-dim font-mono text-sm">
            <p>
              Questions?{' '}
              <a
                href="mailto:help@goodhang.club"
                className="text-neon-purple hover:text-neon-magenta transition-colors underline"
              >
                Get in touch
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
