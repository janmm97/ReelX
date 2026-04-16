import PublicHeader from '@/components/PublicHeader'

const LAST_UPDATED = 'April 14, 2026'

export const metadata = {
  title: 'Privacy & Terms — Reelx',
  description: 'Privacy policy and terms of service for Reelx.',
}

export default function PrivacyPage() {
  return (
    <div style={{ background: '#070e1a', minHeight: '100vh', color: '#dceaf4' }}>
      <PublicHeader compact />

      {/* Body */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '72px 32px 96px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#4A5C6E', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>Privacy & Terms</p>
        <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700, margin: '0 0 8px', lineHeight: 1.15 }}>Privacy Policy & Terms of Service</h1>
        <p style={{ fontSize: 13, color: '#4A5C6E', marginBottom: 56 }}>Last updated: {LAST_UPDATED}</p>

        {/* Privacy */}
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#C8D5E0', margin: '0 0 28px', paddingBottom: 12, borderBottom: '1px solid #1E2A3A' }}>Privacy Policy</h2>

        <Section title="1. Information We Collect">
          <p>When you use Reelx we collect:</p>
          <ul>
            <li><strong>Account data</strong> — email address and authentication credentials when you sign up.</li>
            <li><strong>Usage data</strong> — prompts you submit, generations requested, and feature interactions, used to operate and improve the service.</li>
            <li><strong>Billing data</strong> — payment information processed securely through Stripe. We never store full card numbers.</li>
            <li><strong>Technical data</strong> — IP address, browser type, and session identifiers for security and analytics purposes.</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Data">
          <ul>
            <li>To provide, operate, and maintain the Reelx platform</li>
            <li>To process payments and manage your subscription or credits</li>
            <li>To send transactional emails (receipts, password resets, service notices)</li>
            <li>To detect and prevent fraud or abuse</li>
            <li>To improve model quality and platform performance using aggregated, anonymised data</li>
          </ul>
          <p>We do not sell your personal data to third parties.</p>
        </Section>

        <Section title="3. Data Sharing">
          <p>We share data only with trusted service providers necessary to operate the platform:</p>
          <ul>
            <li><strong>Supabase</strong> — database and authentication infrastructure</li>
            <li><strong>Stripe</strong> — payment processing</li>
            <li><strong>AI model providers</strong> — prompts are forwarded to the selected model (e.g., OpenAI, Google DeepMind, Kuaishou) to generate outputs. Each provider's own privacy policy governs how they handle this data.</li>
          </ul>
        </Section>

        <Section title="4. Data Retention">
          <p>We retain your account data for as long as your account is active. Generated outputs are stored for 30 days after creation unless you delete them earlier. You may request full account deletion at any time by emailing <a href="mailto:support@reelx.app" style={{ color: '#4a7a96' }}>support@reelx.app</a>.</p>
        </Section>

        <Section title="5. Cookies">
          <p>Reelx uses essential cookies for session management and authentication. We do not use tracking or advertising cookies.</p>
        </Section>

        <Section title="6. Your Rights">
          <p>Depending on your jurisdiction you may have the right to access, correct, or delete your personal data. To exercise these rights, contact us at <a href="mailto:support@reelx.app" style={{ color: '#4a7a96' }}>support@reelx.app</a>.</p>
        </Section>

        {/* Terms */}
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#C8D5E0', margin: '48px 0 28px', paddingBottom: 12, borderBottom: '1px solid #1E2A3A' }}>Terms of Service</h2>

        <Section title="7. Acceptance">
          <p>By creating an account or using Reelx you agree to these terms. If you do not agree, do not use the service.</p>
        </Section>

        <Section title="8. Subscriptions & Credits">
          <p>Reelx operates on a credit-based model. Credits are non-refundable once consumed. Subscription charges are billed in advance on a monthly or annual cycle. You may cancel at any time; cancellation takes effect at the end of the current billing period.</p>
        </Section>

        <Section title="9. Content Policy">
          <p>You are responsible for the prompts you submit and the outputs you publish or distribute. You agree not to use Reelx to generate content that violates applicable law or our Acceptable Use Policy (see Legal page).</p>
        </Section>

        <Section title="10. Service Availability">
          <p>We aim for high availability but do not guarantee uninterrupted access. Planned maintenance, third-party outages, or force majeure events may cause temporary disruptions.</p>
        </Section>

        <Section title="11. Account Termination">
          <p>We reserve the right to suspend or terminate accounts that violate these terms. You may close your account at any time by contacting support.</p>
        </Section>

        <Section title="12. Changes to Terms">
          <p>We may revise these terms at any time. We will notify you of material changes via email at least 14 days before they take effect. Continued use after that date constitutes acceptance.</p>
        </Section>

        <div style={{ marginTop: 56, paddingTop: 32, borderTop: '1px solid #1E2A3A' }}>
          <p style={{ fontSize: 13, color: '#4A5C6E' }}>
            Questions?{' '}
            <a href="mailto:support@reelx.app" style={{ color: '#4a7a96', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              support@reelx.app
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#C8D5E0', margin: '0 0 10px' }}>{title}</h3>
      <div style={{ fontSize: 14, color: '#4a7a96', lineHeight: 1.75 }}>
        {children}
      </div>
    </section>
  )
}
