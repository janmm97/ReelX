'use client'

import Link from 'next/link'
import PublicHeader from '@/components/PublicHeader'

export default function ContactPage() {
  return (
    <div style={{ background: '#0B0F14', minHeight: '100vh', color: '#F4F8FB', display: 'flex', flexDirection: 'column' }}>
      <PublicHeader />

      {/* Centred content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 32px' }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          {/* Icon */}
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: '0 auto 28px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid #1E2A3A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="5" width="18" height="13" rx="2.5" stroke="#738295" strokeWidth="1.4" />
              <path d="M2 8L11 13.5L20 8" stroke="#738295" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>

          <h1 style={{ fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 700, margin: '0 0 14px', lineHeight: 1.2 }}>
            Get in touch
          </h1>
          <p style={{ fontSize: 15, color: '#738295', lineHeight: 1.7, margin: '0 0 36px' }}>
            Have a question, a billing issue, or need help with your account? Our support team is here for you. Reach out and we'll get back to you as soon as possible.
          </p>

          <a
            href="mailto:support@reelsy-app.com"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 9,
              background: '#F4F8FB', color: '#0B0F14',
              fontWeight: 600, fontSize: 14,
              padding: '13px 28px', borderRadius: 12,
              textDecoration: 'none',
              transition: 'background 0.18s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = '#dde8f2')}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = '#F4F8FB')}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="1" y="3" width="13" height="9.5" rx="2" stroke="#0B0F14" strokeWidth="1.3" />
              <path d="M1 5.5L7.5 9.5L14 5.5" stroke="#0B0F14" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            support@reelsy-app.com
          </a>

          <p style={{ fontSize: 12, color: '#4A5C6E', marginTop: 20 }}>
            We typically respond within 1–2 business days.
          </p>
        </div>
      </main>
    </div>
  )
}
