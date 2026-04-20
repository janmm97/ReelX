'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function PublicHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderBottom: '1px solid #1C1C1C',
      padding: '0 32px',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        height: compact ? 64 : 110,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link href="/">
          <Image
            src="/brand/reelx-logo-white-svg.svg"
            alt="Reelx"
            width={compact ? 100 : 160}
            height={compact ? 28 : 44}
            style={{ objectFit: 'contain' }}
          />
        </Link>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/login" style={{ color: '#ffffff', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>
            Sign In
          </Link>
          <Link
            href="/login"
            style={{
              background: '#FFFFFF', color: '#000000', fontWeight: 600, fontSize: 13,
              padding: '8px 18px', borderRadius: 10, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', transition: 'opacity 0.18s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}
