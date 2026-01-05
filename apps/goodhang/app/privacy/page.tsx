import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Good Hang privacy policy and data protection information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link
          href="/"
          className="inline-block mb-8 text-neon-purple hover:text-neon-magenta transition-colors font-mono text-sm"
        >
          ← Back to Home
        </Link>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-neon-purple via-neon-magenta to-neon-cyan bg-clip-text text-transparent">
          Privacy Policy
        </h1>

        <p className="text-foreground-dim mb-8 font-mono text-sm">
          Last updated: November 16, 2025
        </p>

        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">Introduction</h2>
            <p className="text-foreground-dim leading-relaxed">
              Good Hang (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you visit our
              website and use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">Information We Collect</h2>

            <h3 className="text-xl font-semibold text-neon-purple mb-3">Personal Information</h3>
            <p className="text-foreground-dim leading-relaxed mb-4">
              We may collect personal information that you voluntarily provide to us when you:
            </p>
            <ul className="list-disc list-inside text-foreground-dim space-y-2 mb-4">
              <li>Register for an account</li>
              <li>RSVP to events</li>
              <li>Complete our Customer Success assessment</li>
              <li>Subscribe to our newsletter</li>
              <li>Contact us for support</li>
            </ul>
            <p className="text-foreground-dim leading-relaxed">
              This information may include your name, email address, phone number, professional background,
              and assessment responses.
            </p>

            <h3 className="text-xl font-semibold text-neon-purple mb-3 mt-6">Automatically Collected Information</h3>
            <p className="text-foreground-dim leading-relaxed mb-4">
              When you access our website, we automatically collect certain information about your device, including:
            </p>
            <ul className="list-disc list-inside text-foreground-dim space-y-2">
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>IP address</li>
              <li>Pages visited and time spent on pages</li>
              <li>Referring website addresses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">How We Use Your Information</h2>
            <p className="text-foreground-dim leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-foreground-dim space-y-2">
              <li>Provide, operate, and maintain our services</li>
              <li>Process your event RSVPs and manage attendance</li>
              <li>Analyze your CS assessment responses to provide personalized results</li>
              <li>Send you important updates about events and membership</li>
              <li>Respond to your comments, questions, and support requests</li>
              <li>Improve and optimize our website and services</li>
              <li>Detect, prevent, and address technical issues or fraudulent activity</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">Customer Success Assessment Data</h2>
            <p className="text-foreground-dim leading-relaxed mb-4">
              Our CS assessment uses AI (Claude Sonnet 4.5) to analyze your responses. Please note:
            </p>
            <ul className="list-disc list-inside text-foreground-dim space-y-2">
              <li>Assessment responses are analyzed to generate personality insights and skill assessments</li>
              <li>Your results include archetype classification, category scores, and badges</li>
              <li>You control whether your profile is published publicly via our job board</li>
              <li>Published profiles respect your privacy settings (scores/email visibility)</li>
              <li>Assessment data is stored securely and not shared with third parties without consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">Data Sharing and Disclosure</h2>
            <p className="text-foreground-dim leading-relaxed mb-4">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-foreground-dim space-y-2">
              <li><strong>With your consent:</strong> When you choose to publish your assessment profile</li>
              <li><strong>Service providers:</strong> With vendors who perform services on our behalf (hosting, email, analytics)</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business transfers:</strong> In connection with a merger, sale, or acquisition</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">Data Security</h2>
            <p className="text-foreground-dim leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal
              information. However, no method of transmission over the Internet or electronic storage is 100% secure.
              We use industry-standard encryption and secure authentication via Supabase.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">Your Privacy Rights</h2>
            <p className="text-foreground-dim leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-foreground-dim space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request corrections to inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Data portability:</strong> Request your data in a portable format</li>
            </ul>
            <p className="text-foreground-dim leading-relaxed mt-4">
              To exercise these rights, please contact us at{' '}
              <a href="mailto:privacy@goodhang.club" className="text-neon-purple hover:text-neon-magenta transition-colors">
                privacy@goodhang.club
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">Cookies and Tracking</h2>
            <p className="text-foreground-dim leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our website and store certain
              information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">Third-Party Services</h2>
            <p className="text-foreground-dim leading-relaxed mb-4">
              Our website uses the following third-party services:
            </p>
            <ul className="list-disc list-inside text-foreground-dim space-y-2">
              <li><strong>Supabase:</strong> Database and authentication (see{' '}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-neon-purple hover:text-neon-magenta transition-colors">
                  Supabase Privacy Policy
                </a>)
              </li>
              <li><strong>Anthropic Claude AI:</strong> Assessment scoring (see{' '}
                <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-neon-purple hover:text-neon-magenta transition-colors">
                  Anthropic Privacy Policy
                </a>)
              </li>
              <li><strong>Resend:</strong> Email delivery (see{' '}
                <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-neon-purple hover:text-neon-magenta transition-colors">
                  Resend Privacy Policy
                </a>)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">Children&apos;s Privacy</h2>
            <p className="text-foreground-dim leading-relaxed">
              Our services are not intended for individuals under the age of 18. We do not knowingly collect
              personal information from children. If you believe we have collected information from a child,
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">Changes to This Privacy Policy</h2>
            <p className="text-foreground-dim leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting
              the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review
              this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">Contact Us</h2>
            <p className="text-foreground-dim leading-relaxed mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="text-foreground-dim space-y-2">
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:privacy@goodhang.club" className="text-neon-purple hover:text-neon-magenta transition-colors">
                  privacy@goodhang.club
                </a>
              </p>
              <p>
                <strong>Website:</strong>{' '}
                <a href="https://goodhang.club" className="text-neon-purple hover:text-neon-magenta transition-colors">
                  goodhang.club
                </a>
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-neon-purple/20">
          <Link
            href="/"
            className="inline-block text-neon-purple hover:text-neon-magenta transition-colors font-mono text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
