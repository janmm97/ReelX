'use client'

import Link from 'next/link'
import Image from 'next/image'

const NAV_LINKS: [string, string][] = [
  ['Products', '/products'],
  ['FAQ',      '/#faq'],
  ['Contact',  '/contact'],
]

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
            src="/For Rebranding/reelsy-logo-white-txt.png"
            alt="Reelsy"
            width={112} height={32}
            style={{ objectFit: 'contain' }}
          />
        </Link>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {NAV_LINKS.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              style={{ color: '#A7B4C2', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F4F8FB')}
              onMouseLeave={e => (e.currentTarget.style.color = '#A7B4C2')}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/login" style={{ color: '#F4F8FB', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>
            Sign In
          </Link>
          <Link
            href="/login"
            style={{
              background: '#F4F8FB', color: '#0B0F14', fontWeight: 600, fontSize: 13,
              padding: '8px 18px', borderRadius: 10, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e4ecf4')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F4F8FB')}
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}
