'use client'

import Link from 'next/link'
import Image from 'next/image'


export default function PublicHeader() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(11,15,20,0.92)', backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderBottom: '1px solid #1E2A3A',
      padding: '0 32px',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link href="/">
          <Image
            src="/brand/newlogo.png"
            alt="Reelx"
            width={160} height={46}
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
              background: '#ffffff', color: '#070e1a', fontWeight: 600, fontSize: 13,
              padding: '8px 18px', borderRadius: 10, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#dceaf4')}
            onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}
