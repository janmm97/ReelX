'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import VideoGeneratorForm from '@/components/VideoGeneratorForm'

function StudioShell() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!userId) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0F14' }}>
        <div className="loader-ribbon" style={{ width: 80 }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F14', color: '#F4F8FB', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', borderBottom: '1px solid #273242',
        background: 'rgba(16,23,34,0.9)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Image src="/For Rebranding/reelsy-icon.png" alt="Reelsy" width={28} height={28} style={{ objectFit: 'contain' }} />
            <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 15, color: '#F4F8FB' }}>Reelsy</span>
          </Link>
          <span style={{ color: '#273242', fontSize: 14 }}>/</span>
          <span style={{ fontSize: 13, color: '#738295' }}>Talking Video Studio</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/dashboard"
            style={{ fontSize: 12, color: '#738295', textDecoration: 'none', padding: '6px 12px', border: '1px solid #273242', borderRadius: 8, transition: 'color 0.2s, border-color 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F4F8FB'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#4A5568' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#738295'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#273242' }}
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      {/* ── 3-panel body ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 260px', minHeight: 0 }}>

        {/* Left — Setup */}
        <aside style={{ borderRight: '1px solid #273242', background: '#101722', overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#738295', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Setup</p>


            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #273242', borderRadius: 14, padding: '16px 14px' }}>
              <VideoGeneratorForm userId={userId} />
            </div>
          </div>
        </aside>

        {/* Center — Stage */}
        <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 24 }}>
          <div style={{
            width: '100%', maxWidth: 520, aspectRatio: '9/16', maxHeight: 'calc(100vh - 120px)',
            background: '#141D28', border: '1px solid #273242', borderRadius: 16,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.25 }}>
              <circle cx="12" cy="12" r="10" stroke="#738295" strokeWidth="1.5" />
              <path d="M10 8l6 4-6 4V8z" fill="#738295" />
            </svg>
            <p style={{ fontSize: 13, color: '#4A5568', textAlign: 'center', lineHeight: 1.5 }}>
              Generate a talking video to preview it here
            </p>
          </div>
        </main>

        {/* Right — Takes */}
        <aside style={{ borderLeft: '1px solid #273242', background: '#101722', overflowY: 'auto', padding: '20px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#738295', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Takes</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)',
              border: '1px solid #1E2A3A', display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{ fontSize: 11, color: '#4A5568', textAlign: 'center', padding: '20px 0' }}>
                No takes yet — generate your first video to see it here.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default function StudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioShell />
    </Suspense>
  )
}
