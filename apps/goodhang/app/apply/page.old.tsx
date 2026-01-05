'use client';

import { Widget } from '@typeform/embed-react';
import Link from 'next/link';

export default function ApplyPage() {
  const formId = process.env.NEXT_PUBLIC_TYPEFORM_FORM_ID || 'YOUR_FORM_ID';

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
            <Link href="/launch" className="text-neon-cyan hover:text-neon-magenta transition-colors font-mono">
              Launch Party
            </Link>
            <Link href="/members/directory" className="text-foreground hover:text-neon-cyan transition-colors font-mono">
              Members
            </Link>
            <Link href="/login" className="text-neon-purple hover:text-neon-magenta transition-colors font-mono">
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold font-mono neon-purple mb-4">
              APPLY FOR MEMBERSHIP
            </h1>
            <p className="text-xl text-foreground-dim font-mono max-w-2xl mx-auto mb-8">
              Join an exclusive community of tech professionals who want more than networking —
              <span className="text-neon-cyan"> they want adventure</span>
            </p>

            {/* What Members Get */}
            <div className="border-2 border-neon-cyan/30 bg-background-lighter p-6 text-left mb-8">
              <h2 className="text-xl font-bold font-mono neon-cyan mb-4">What Members Get</h2>
              <ul className="space-y-3 text-foreground-dim font-mono text-sm">
                <li className="flex items-start">
                  <span className="text-neon-purple mr-3">→</span>
                  <span>Access to member directory and direct connections</span>
                </li>
                <li className="flex items-start">
                  <span className="text-neon-purple mr-3">→</span>
                  <span>Invites to exclusive events and social hangs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-neon-purple mr-3">→</span>
                  <span>Priority RSVP for popular events</span>
                </li>
                <li className="flex items-start">
                  <span className="text-neon-purple mr-3">→</span>
                  <span>Email updates on upcoming opportunities</span>
                </li>
                <li className="flex items-start">
                  <span className="text-neon-purple mr-3">→</span>
                  <span><strong>Core Members</strong>: Beacon system, favor tracker, accountability partners</span>
                </li>
              </ul>
            </div>

            {/* Application Process */}
            <div className="border-2 border-neon-magenta/30 bg-background-lighter p-6 text-left">
              <h2 className="text-xl font-bold font-mono neon-magenta mb-4">Application Process</h2>
              <ol className="space-y-3 text-foreground-dim font-mono text-sm">
                <li className="flex items-start">
                  <span className="text-neon-purple mr-3 font-bold">1.</span>
                  <span>Fill out the application below (takes ~5 minutes)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-neon-purple mr-3 font-bold">2.</span>
                  <span>We review on a rolling basis (usually within 3-5 days)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-neon-purple mr-3 font-bold">3.</span>
                  <span>If approved, you&apos;ll get an invite link to create your account</span>
                </li>
                <li className="flex items-start">
                  <span className="text-neon-purple mr-3 font-bold">4.</span>
                  <span>Complete your profile and start connecting!</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Typeform Embed */}
          <div className="border-2 border-neon-purple/30 bg-background-lighter p-4 min-h-[700px] md:min-h-[800px]">
            {formId && formId !== 'YOUR_FORM_ID' ? (
              <Widget
                id={formId}
                style={{ width: '100%', height: '100%' }}
                className="typeform-widget h-[700px] md:h-[800px]"
              />
            ) : (
              <div className="flex items-center justify-center h-[700px] md:h-[800px]">
                <div className="text-center">
                  <p className="text-neon-purple font-mono text-xl mb-4">⚠️ Typeform Not Configured</p>
                  <p className="text-foreground-dim font-mono text-sm mb-4">
                    Please follow the instructions in <code className="text-neon-cyan">TYPEFORM-SETUP.md</code>
                  </p>
                  <p className="text-foreground-dim font-mono text-xs">
                    Add your form ID to <code className="text-neon-cyan">.env.local</code>:
                    <br />
                    <code className="text-foreground">NEXT_PUBLIC_TYPEFORM_FORM_ID=your_form_id</code>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-foreground-dim font-mono text-sm">
              Questions about membership?{' '}
              <a href="mailto:hello@goodhang.club" className="text-neon-cyan hover:text-neon-magenta transition-colors">
                Get in touch
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
