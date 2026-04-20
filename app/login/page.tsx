'use client'

import { Suspense } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/* ── Gallery columns ────────────────────────────────────────────── */
const COL1 = [
  '/media/1 ia.png',
  '/media/asian_man.mp4',
  '/media/4 ia.png',
  '/media/7a.png',
  '/Surreal floating islands above clouds at golden hour.png',
  '/media/electric_pin.png',
]
const COL2 = [
  '/media/cr_cologne.mp4',
  '/media/2 ia.png',
  '/media/5 ia.png',
  '/media/8a.png',
  '/Watercolor painting of a Japanese garden in autumn.png',
  '/media/3 ia.png',
]
const COL3 = [
  '/media/6 ia.png',
  '/media/video-generation.mp4',
  '/A cyberpunk city at sunset with neon reflections on wet streets.png',
  '/media/upscaled-video.mp4',
  '/Ethereal forest with bioluminescent mushrooms and fireflies.png',
  '/media/your_avatar.png',
]

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

const WATERFALL_STYLES = `
  @keyframes wf-up   { from { transform: translateY(0%);   } to { transform: translateY(-50%); } }
  @keyframes wf-down { from { transform: translateY(-50%); } to { transform: translateY(0%);   } }
`

function WaterfallColumn({ images, direction, duration }: {
  images: string[]
  direction: 'up' | 'down'
  duration: number
}) {
  const doubled = [...images, ...images]
  return (
    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', height: '100%' }}>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        animation: `${direction === 'up' ? 'wf-up' : 'wf-down'} ${duration}s linear infinite`,
        willChange: 'transform',
      }}>
        {doubled.map((src, i) => {
          const isVideo = src.endsWith('.mp4')
          return (
            <div key={i} style={{
              position: 'relative', width: '100%', aspectRatio: '3/4',
              borderRadius: 10, overflow: 'hidden', flexShrink: 0,
            }}>
              {isVideo ? (
                <video
                  src={src}
                  autoPlay muted loop playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <Image src={src} alt="" fill sizes="17vw" style={{ objectFit: 'cover' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AuthCard() {
  const params = useSearchParams()
  const isSignup = params.get('mode') === 'signup'
  const supabase = createClient()

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <div style={{
      background: '#161616', border: '1px solid #1C1C1C', borderRadius: 20,
      padding: 40, width: '100%', maxWidth: 380,
      display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center',
    }}>
      <Image src="/brand/reelx-logo-white-svg.svg" alt="Reelx" width={100} height={28} style={{ objectFit: 'contain' }} />

      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px' }}>
          {isSignup ? 'Create your Reelx workspace' : 'Sign in to Reelx'}
        </h1>
        <p style={{ fontSize: 14, color: '#787878', margin: 0, lineHeight: 1.5 }}>
          {isSignup
            ? 'Continue with Google to get started.'
            : 'Continue with your Google account to access your workspace.'}
        </p>
      </div>

      <button
        onClick={signIn}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: '12px 20px', borderRadius: 12,
          background: '#FFFFFF', color: '#000000', fontWeight: 600, fontSize: 15,
          border: 'none', cursor: 'pointer', transition: 'background 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <p style={{ fontSize: 12, color: '#787878', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
        By continuing you agree to the{' '}
        <a href="/legal" style={{ color: '#FFFFFF', textDecoration: 'underline' }}>Terms of Service</a>
        {' '}and{' '}
        <a href="/privacy" style={{ color: '#FFFFFF', textDecoration: 'underline' }}>Privacy Policy</a>.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    /* overflow:hidden + height:100vh prevents any page scroll */
    <div style={{
      height: '100vh', overflow: 'hidden',
      display: 'grid', gridTemplateColumns: '1fr 1fr',
    }}>

      {/* ── Left: auth ───────────────────────────────────────── */}
      <div style={{
        background: '#000000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px', position: 'relative',
        height: '100vh',
      }}>
        {/* Logo top-left */}
        <div style={{ position: 'absolute', top: 12, left: 36 }}>
          <Image src="/brand/reelx-logo-white-svg.svg" alt="Reelx" width={110} height={30} style={{ objectFit: 'contain' }} />
        </div>

        {/* Auth card — always centered, never clipped */}
        <Suspense fallback={
          <div style={{
            background: '#161616', border: '1px solid #1C1C1C', borderRadius: 20,
            padding: 40, width: '100%', maxWidth: 380,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 240, color: '#787878', fontSize: 14,
          }}>
            Loading…
          </div>
        }>
          <AuthCard />
        </Suspense>
      </div>

      {/* ── Right: waterfall gallery ─────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: '#000000', display: 'flex',
        gap: 6, padding: 6, height: '100vh',
        alignItems: 'flex-start',
      }}>
        <style>{WATERFALL_STYLES}</style>
        {/* col 1 — downward */}
        <WaterfallColumn images={COL1} direction="down" duration={24} />
        {/* col 2 — upward */}
        <WaterfallColumn images={COL2} direction="up" duration={24} />
        {/* col 3 — downward */}
        <WaterfallColumn images={COL3} direction="down" duration={24} />

        {/* top / bottom fade */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, #000000 0%, transparent 10%, transparent 90%, #000000 100%)',
          zIndex: 2,
        }} />
        {/* left-edge blend into auth panel */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to right, #000000 0%, transparent 10%)',
          zIndex: 2,
        }} />
      </div>
    </div>
  )
}
