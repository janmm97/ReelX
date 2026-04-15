'use client'

import { Suspense } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
      background: '#0f2035', border: '1px solid #183048', borderRadius: 20,
      padding: 40, width: '100%', maxWidth: 400,
      display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center',
    }}>
      <Image
        src="/brand/reelsy-icon.png"
        alt="Reelx"
        width={48} height={48}
        style={{ objectFit: 'contain' }}
      />

      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 700, color: '#dceaf4', margin: '0 0 8px' }}>
          {isSignup ? 'Create your Reelx workspace' : 'Sign in to Reelx'}
        </h1>
        <p style={{ fontSize: 14, color: '#4a7a96', margin: 0, lineHeight: 1.5 }}>
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
          background: '#dceaf4', color: '#070e1a', fontWeight: 600, fontSize: 15,
          border: 'none', cursor: 'pointer', transition: 'background 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#e8eef4')}
        onMouseLeave={e => (e.currentTarget.style.background = '#dceaf4')}
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <p style={{ fontSize: 12, color: '#4a7a96', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
        By continuing you agree to the{' '}
        <a href="#" style={{ color: '#00d8ec', textDecoration: 'underline' }}>Terms of Service</a>
        {' '}and{' '}
        <a href="#" style={{ color: '#00d8ec', textDecoration: 'underline' }}>Privacy Policy</a>.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Left brand panel */}
      <div style={{
        background: '#0D1520', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '64px 56px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(#183048 1px,transparent 1px),linear-gradient(90deg,#183048 1px,transparent 1px)',
          backgroundSize: '40px 40px', opacity: 0.06, pointerEvents: 'none',
        }} />
        {/* Cyan bloom */}
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-10%', width: 480, height: 480,
          borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,184,212,0.1) 0%,transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Ribbon line accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#00b8d4,transparent)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Image src="/brand/newlogo.png" alt="Reelx" width={120} height={34} style={{ objectFit: 'contain', marginBottom: 48 }} />

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,3vw,44px)', fontWeight: 800, color: '#dceaf4', lineHeight: 1.1, marginBottom: 16 }}>
            Create visuals<br />in motion
          </h2>
          <p style={{ fontSize: 16, color: '#4a7a96', lineHeight: 1.6, maxWidth: 380, marginBottom: 48 }}>
            Image, video, and avatar workflows in one AI studio.
          </p>

          {/* Decorative capability cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
            {[
              { label: 'Text to Image', detail: 'GPT-5 Image · 1.2s' },
              { label: 'Text to Video', detail: 'Veo 3.1 Fast · 8s' },
              { label: 'Avatar to Video', detail: 'Studio · ElevenLabs' },
            ].map(item => (
              <div key={item.label} style={{
                background: 'rgba(20,29,40,0.72)', border: '1px solid #183048',
                borderRadius: 10, padding: '10px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                backdropFilter: 'blur(12px)',
              }}>
                <span style={{ fontSize: 13, color: '#dceaf4' }}>{item.label}</span>
                <span style={{ fontSize: 11, color: '#4a7a96' }}>{item.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right auth panel */}
      <div style={{
        background: '#101722', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 40,
      }}>
        <Suspense fallback={null}>
          <AuthCard />
        </Suspense>
      </div>
    </div>
  )
}
