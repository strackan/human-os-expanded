'use client';

/**
 * Join Renubu - Talent Application Landing Page
 *
 * Public landing page for candidates to apply. No authentication required.
 * Creates candidate record and workflow_execution, then redirects to interview.
 *
 * Release 1.5: Talent Orchestration System
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CandidateService } from '@/lib/services/CandidateService';
import { createClient } from '@/lib/supabase';

export default function JoinPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    linkedin_url: '',
    referral_source: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate form
      if (!formData.name || !formData.email) {
        throw new Error('Please provide your name and email');
      }

      // For public signup, candidates will be associated with a system/talent user
      // This allows public access without requiring authentication upfront
      const TALENT_SYSTEM_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID || '00000000-0000-0000-0000-000000000000';

      // Create server-side API call to avoid exposing service role key
      const response = await fetch('/api/talent/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          linkedin_url: formData.linkedin_url || undefined,
          referral_source: formData.referral_source || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create candidate');
      }

      const { candidate } = await response.json();

      // TODO: Create workflow_execution for interview tracking
      // This will be implemented in the next phase

      // Redirect to interview experience
      router.push(`/join/interview?candidate=${candidate.id}`);
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Join Renubu
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're building the future of customer success orchestration.
            If you're passionate about AI, workflows, and helping customers succeed,
            we'd love to meet you.
          </p>
        </div>

        {/* Video Section (optional - can add founder video later) */}
        <div className="mb-12 bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
          <p className="text-gray-500">Founder Video Placeholder</p>
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Start Your Application
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Jane Smith"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="jane@example.com"
              />
            </div>

            {/* LinkedIn */}
            <div>
              <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn Profile (optional)
              </label>
              <input
                type="url"
                id="linkedin_url"
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://linkedin.com/in/janesmith"
              />
            </div>

            {/* Referral Source */}
            <div>
              <label htmlFor="referral_source" className="block text-sm font-medium text-gray-700 mb-2">
                How did you hear about us?
              </label>
              <select
                id="referral_source"
                name="referral_source"
                value={formData.referral_source}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select one...</option>
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">Twitter</option>
                <option value="referral">Referral from friend/colleague</option>
                <option value="job_board">Job Board</option>
                <option value="company_website">Company Website</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Starting Interview...
                </span>
              ) : (
                'Begin Interview'
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500 text-center">
            Next: 20-minute conversational AI interview to understand your skills and experience
          </p>
        </div>

        {/* Return Visitor Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already interviewed?{' '}
            <a href="/join/returning" className="text-blue-600 hover:text-blue-700 font-medium">
              Continue your conversation
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
