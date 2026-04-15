import type { Metadata } from 'next'
import Link from 'next/link'
import PublicHeader from '@/components/PublicHeader'

/* ── SEO ──────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: 'Reelsy Products — AI Image, Video & Talking Studio',
  description:
    'Generate AI images with GPT-5, produce cinematic videos from text or images, and create voice-driven talking avatar videos with ElevenLabs — all in Reelsy.',
  alternates: { canonical: 'https://reelsy.ai/products' },
  openGraph: {
    title: 'Reelsy Products — AI Image, Video & Talking Studio',
    description:
      'Generate AI images, cinematic videos, and talking avatar content. GPT-5, Veo 3.1, Kling 3.0, ElevenLabs — one platform.',
    type: 'website',
    url: 'https://reelsy.ai/products',
    images: [{ url: 'https://reelsy.ai/og/products.png', width: 1200, height: 630, alt: 'Reelsy Products — AI Image, Video & Talking Studio' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@reelsy',
    title: 'Reelsy Products — AI Image, Video & Talking Studio',
    description:
      'Generate AI images, cinematic videos, and talking avatar content — all in one AI creative platform.',
    images: ['https://reelsy.ai/og/products.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Reelsy',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  url: 'https://reelsy.ai',
  description:
    'AI creative suite for image generation, video creation, and talking avatar videos.',
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '0',
    highPrice: '79',
    priceCurrency: 'USD',
  },
  featureList: [
    'AI image generation with GPT-5 Image Mode and multiple top models',
    'AI video generation from text or images using Veo 3.1, Kling 3.0, Seedance 2.0, and Grok',
    'Talking video studio with ElevenLabs voice cloning across 28 languages',
  ],
}

/* ── Styles ──────────────────────────────────────────────────── */
const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  @keyframes fadeRise {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes waveAnim {
    0%,100% { transform: scaleY(0.4); }
    50%      { transform: scaleY(1); }
  }
  @keyframes frameDrift {
    0%,100% { transform: translateY(0px) rotate(-1.5deg); }
    50%      { transform: translateY(-6px) rotate(-1.5deg); }
  }
  @keyframes frameDrift2 {
    0%,100% { transform: translateY(0px) rotate(1deg); }
    50%      { transform: translateY(-4px) rotate(1deg); }
  }

  .ar-0 { animation: fadeRise 0.7s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
  .ar-1 { animation: fadeRise 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
  .ar-2 { animation: fadeRise 0.7s cubic-bezier(0.22,1,0.36,1) 0.25s both; }
  .ar-3 { animation: fadeRise 0.7s cubic-bezier(0.22,1,0.36,1) 0.35s both; }
  .af   { animation: fadeIn  0.9s ease 0.1s both; }

  .cta-arrow { transition: transform 0.22s cubic-bezier(0.22,1,0.36,1); display:inline-block; }
  .cta-link:hover .cta-arrow { transform: translateX(5px); }

  .pill {
    display:inline-flex; align-items:center; gap:6px;
    padding:5px 12px; border-radius:100px; font-size:12px; font-weight:500;
    background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);
    color:#A7B4C2; white-space:nowrap; letter-spacing:0.01em;
  }
  .pill-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }

  .check-item {
    display:flex; align-items:center; gap:10px;
    font-size:14px; color:#A7B4C2; line-height:1.5;
  }
  .check-ring {
    width:18px; height:18px; border-radius:50%; flex-shrink:0;
    background:rgba(0,196,204,0.1); border:1px solid rgba(0,196,204,0.28);
    display:flex; align-items:center; justify-content:center;
  }

  .divider {
    width:100%; height:1px;
    background:linear-gradient(90deg, transparent 0%, #273242 20%, #273242 80%, transparent 100%);
  }

  .prod-grid { display:grid; grid-template-columns:1fr 1fr; gap:clamp(40px,6vw,96px); align-items:center; }
  .prod-grid.flip { direction:rtl; }
  .prod-grid.flip > * { direction:ltr; }

  .stat-item { text-align:center; }

  .wave-bar {
    width:3px; border-radius:3px; background:#00C4CC; transform-origin:bottom;
  }

  .img-tile { border-radius:8px; overflow:hidden; position:relative; }

  .frame-card {
    border-radius:12px; overflow:hidden; position:relative;
    border:1px solid rgba(255,255,255,0.07);
  }

  .nav-link {
    color:#A7B4C2; font-size:14px; text-decoration:none;
    transition:color 0.2s; font-family:var(--font-manrope);
  }
  .nav-link:hover, .nav-link.active { color:#F4F8FB; }

  @media (max-width:860px) {
    .prod-grid { grid-template-columns:1fr; }
    .prod-grid.flip { direction:ltr; }
    .visual-col { display:none; }
    .stat-row { flex-wrap:wrap; justify-content:center; }
  }
  @media (max-width:600px) {
    .hero-h1 { font-size:clamp(36px,10vw,60px) !important; }
    .prod-h2  { font-size:clamp(28px,8vw,44px) !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    .ar-0,.ar-1,.ar-2,.ar-3,.af { animation: none; opacity: 1; transform: none; }
    .wave-bar { animation: none; }
    .frame-card { animation: none; }
    .cta-arrow { transition: none; }
  }
`

/* ── Icon SVGs ────────────────────────────────────────────────── */
function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckSvg() {
  return (
    <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden="true">
      <path d="M1 3.5L3.5 6L8 1" stroke="#00C4CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Product visuals (pure SVG/CSS, no external assets) ───────── */

function ImageGenVisual() {
  const BASE = '/For%20Rebranding/New%20folder/image-gen-svg'
  const tiles = [
    { src: `${BASE}/1.svg`, label: 'Portrait',  dot: '#00C4CC', ratio: '3/4' },
    { src: `${BASE}/2.svg`, label: 'Abstract',  dot: '#8B5CF6', ratio: '2/3' },
    { src: `${BASE}/3.svg`, label: 'Landscape', dot: '#10B981', ratio: '3/4' },
    { src: `${BASE}/4.svg`, label: 'Product',   dot: '#F59E0B', ratio: '3/4' },
    { src: `${BASE}/5.svg`, label: 'Editorial', dot: '#3B82F6', ratio: '2/3' },
    { src: `${BASE}/6.svg`, label: 'Concept',   dot: '#EC4899', ratio: '3/4' },
  ]

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 480 }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', inset: '-8%',
        background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,196,204,0.07), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Tilted grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8, transform: 'rotate(-4deg)',
        transformOrigin: 'center center',
        padding: '0 12px',
      }}>
        {tiles.map((t, i) => (
          <div key={i} style={{
            aspectRatio: t.ratio,
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            background: '#0D1420',
          }}>
            {/* SVG image fills the card */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={t.src}
              alt={t.label}
              loading="lazy"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center',
                display: 'block',
              }}
            />
            {/* subtle dark vignette so the label reads cleanly */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 45%)',
            }} />
            {/* label */}
            <div style={{
              position: 'absolute', bottom: 7, left: 8, right: 4,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: t.dot, flexShrink: 0 }} />
              <span style={{
                fontSize: 8, fontWeight: 700, letterSpacing: '0.07em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)',
                fontFamily: 'var(--font-manrope)',
              }}>{t.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Floating model badge */}
      <div style={{
        position: 'absolute', bottom: '-6%', right: '0%',
        background: '#111A28', border: '1px solid #2A3D54',
        borderRadius: 12, padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        zIndex: 10,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', flexShrink: 0, boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#F4F8FB', fontFamily: 'var(--font-manrope)', whiteSpace: 'nowrap' }}>
          GPT-5 Image Mode
        </span>
      </div>
    </div>
  )
}

function VideoGenVisual() {

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 520, aspectRatio: '16/10' }}>

      {/* Glow */}
      <div style={{
        position: 'absolute', inset: '-8%',
        background: 'radial-gradient(ellipse 70% 60% at 50% 60%, rgba(59,130,246,0.1), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Back frame — video-generation.mp4 */}
      <div style={{
        position: 'absolute', top: '0%', left: '5%', right: '0%', bottom: '12%',
        borderRadius: 16, border: '1.5px solid rgba(255,255,255,0.16)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
        transform: 'rotate(2.5deg)',
        animation: 'frameDrift2 4s ease-in-out infinite',
        overflow: 'hidden', background: '#0B0F14',
      }}>
        <video autoPlay muted loop playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}>
          <source src="/For%20Rebranding/New%20folder/video-generation.mp4" type="video/mp4" />
        </video>
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 25%)', pointerEvents: 'none' }} />
      </div>

      {/* Front frame — upscaled-video.mp4 */}
      <div style={{
        position: 'absolute', top: '12%', left: '0%', right: '5%', bottom: '0%',
        borderRadius: 16, border: '1.5px solid rgba(255,255,255,0.28)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.75)',
        transform: 'rotate(-2deg)',
        animation: 'frameDrift 5s ease-in-out infinite',
        zIndex: 2, overflow: 'hidden', background: '#0B0F14',
      }}>
        <video autoPlay muted loop playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}>
          <source src="/For%20Rebranding/New%20folder/upscaled-video.mp4" type="video/mp4" />
        </video>
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.15) 100%)', pointerEvents: 'none' }} />
      </div>

      {/* Model badge */}
      <div style={{
        position: 'absolute', bottom: '4%', right: '8%', zIndex: 10,
        background: '#111E30', border: '1px solid #2A3D54',
        borderRadius: 10, padding: '9px 13px',
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 8px 28px rgba(0,0,0,0.6)',
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3B82F6', boxShadow: '0 0 8px rgba(59,130,246,0.5)' }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#C8D8E8', fontFamily: 'var(--font-manrope)' }}>Veo 3.1</span>
        <span style={{ fontSize: 9, color: '#4A6070', fontFamily: 'var(--font-manrope)' }}>/ Google</span>
      </div>
    </div>
  )
}

function StudioVisual() {
  const lines = [
    { text: 'Hey everyone, welcome back to the channel.', t: '0:00', active: false },
    { text: "Today I'm going to show you something that's going to completely change the way you create content online.", t: '0:03', active: true },
    { text: "With Reelsy's Studio, you can turn any script into a lifelike talking video — in minutes.", t: '0:09', active: false },
    { text: "No camera. No microphone. Just your words.", t: '0:16', active: false },
  ]

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 460, height: 380 }}>

      {/* Back card — transcript */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: '10%',
        background: '#0F1822', border: '1.5px solid rgba(255,255,255,0.12)',
        borderRadius: 16, padding: '20px 20px 18px',
        boxShadow: '0 12px 48px rgba(0,0,0,0.55)',
        transform: 'rotate(-4deg)',
        transformOrigin: 'bottom right',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#456B80', fontFamily: 'var(--font-manrope)' }}>
            Script Transcript
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C4CC', boxShadow: '0 0 6px rgba(0,196,204,0.7)' }} />
            <span style={{ fontSize: 10, color: '#00C4CC', fontFamily: 'var(--font-manrope)', fontWeight: 600 }}>LIVE</span>
          </div>
        </div>
        {/* Lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lines.map((l, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '8px 10px', borderRadius: 10,
              background: l.active ? 'rgba(0,196,204,0.07)' : 'transparent',
              border: l.active ? '1px solid rgba(0,196,204,0.18)' : '1px solid transparent',
            }}>
              <span style={{ fontSize: 9, color: l.active ? '#00C4CC' : '#334A5E', fontFamily: 'var(--font-manrope)', fontWeight: 600, marginTop: 2, flexShrink: 0 }}>{l.t}</span>
              <span style={{ fontSize: 12, color: l.active ? '#D4E8F0' : '#4A6070', fontFamily: 'var(--font-manrope)', lineHeight: 1.5 }}>{l.text}</span>
            </div>
          ))}
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: 16, height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ width: '38%', height: '100%', borderRadius: 3, background: '#00C4CC' }} />
        </div>
      </div>

      {/* Front card — portrait photo */}
      <div style={{
        position: 'absolute', bottom: 0, right: 0, width: '58%',
        borderRadius: 16, overflow: 'hidden',
        border: '1.5px solid rgba(255,255,255,0.2)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
        transform: 'rotate(3deg)',
        transformOrigin: 'bottom left',
        zIndex: 2,
        aspectRatio: '3/4',
        background: '#0B0F14',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/For%20Rebranding/New%20folder/asian_man_img.png"
          alt="AI-generated talking avatar"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
        />
        {/* Badge */}
        <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(8,12,18,0.88)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '6px 11px' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C4CC', boxShadow: '0 0 7px rgba(0,196,204,0.8)' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: '#F4F8FB', fontFamily: 'var(--font-manrope)' }}>ElevenLabs Voice</span>
        </div>
      </div>

    </div>
  )
}

/* ── Section label ────────────────────────────────────────────── */
function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 22 }}>
      {icon}
      <span style={{
        fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.13em', textTransform: 'uppercase', color: '#556B80',
      }}>{text}</span>
    </div>
  )
}

/* ── Checklist item ───────────────────────────────────────────── */
function CheckItem({ text }: { text: string }) {
  return (
    <div className="check-item">
      <span className="check-ring"><CheckSvg /></span>
      {text}
    </div>
  )
}

/* ── Model pills ──────────────────────────────────────────────── */
function ModelPills({ models }: { models: { label: string; color: string }[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 32 }}>
      {models.map(m => (
        <span key={m.label} className="pill">
          <span className="pill-dot" style={{ background: m.color }} />
          {m.label}
        </span>
      ))}
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function ProductsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div style={{ background: '#0B0F14', minHeight: '100vh', color: '#F4F8FB', fontFamily: 'var(--font-manrope)' }}>

        <PublicHeader />

        {/* ── Hero ────────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(56px,7vw,96px) 32px clamp(40px,5vw,64px)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <p className="ar-0" style={{
              fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase', color: '#00C4CC',
              marginBottom: 14,
            }}>
              The Reelsy Suite
            </p>
            <h1 className="ar-1 hero-h1" style={{
              fontFamily: 'var(--font-syne)',
              fontSize: 'clamp(44px,7.5vw,100px)',
              fontWeight: 800, lineHeight: 1.04, letterSpacing: '-0.032em',
              margin: '0 0 28px', maxWidth: '13ch',
            }}>
              Three AI tools.<br />One creative<br />workflow.
            </h1>
            <p className="ar-2" style={{
              fontSize: 'clamp(15px,1.8vw,18px)', color: '#8A9EAE',
              maxWidth: 480, lineHeight: 1.7, margin: 0,
            }}>
              From a single prompt to a finished video — Reelsy connects image generation,
              video creation, and voice-driven studio output in one seamless platform.
            </p>
          </div>
        </section>

        <div style={{ padding: '0 32px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div className="divider" />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            01 — Image Generation
        ════════════════════════════════════════════════════════ */}
        <section style={{ padding: 'clamp(64px,8vw,108px) 32px' }} id="image-generation" aria-label="Image Generation">
          <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>

            {/* Watermark */}
            <div className="af" aria-hidden="true" style={{
              position: 'absolute', top: -48, left: -16, zIndex: 0,
              fontFamily: 'var(--font-syne)', fontWeight: 800,
              fontSize: 'clamp(100px,16vw,192px)', lineHeight: 1,
              color: '#111A26', userSelect: 'none', pointerEvents: 'none',
            }}>01</div>

            <div className="prod-grid" style={{ position: 'relative', zIndex: 1 }}>
              {/* Copy */}
              <div>
                <SectionLabel
                  text="Image Generation"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <rect x="1" y="1" width="6" height="6" rx="1.5" fill="#00C4CC" opacity="0.8" />
                      <rect x="9" y="1" width="6" height="6" rx="1.5" fill="#00C4CC" opacity="0.35" />
                      <rect x="1" y="9" width="6" height="6" rx="1.5" fill="#00C4CC" opacity="0.35" />
                      <rect x="9" y="9" width="6" height="6" rx="1.5" fill="#00C4CC" opacity="0.15" />
                    </svg>
                  }
                />

                <h2 className="prod-h2" style={{
                  fontFamily: 'var(--font-syne)',
                  fontSize: 'clamp(32px,4.2vw,56px)',
                  fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.025em',
                  margin: '0 0 20px',
                }}>
                  AI image generation<br />from every leading model.
                </h2>

                <p style={{ fontSize: 15, color: '#8A9EAE', lineHeight: 1.75, margin: '0 0 28px', maxWidth: '44ch' }}>
                  Switch between the world's best image models without leaving the platform.
                  Compare outputs side by side, iterate in seconds, and ship visuals at the
                  speed of thought.
                </p>

                <ModelPills models={[
                  { label: 'GPT-5 Image Mode', color: '#10B981' },
                  { label: 'Nano Banana 3 Pro', color: '#8B5CF6' },
                  { label: 'Nano Banana 3 Flash', color: '#F59E0B' },
                ]} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
                  <CheckItem text="Upload reference images for consistent style" />
                  <CheckItem text="Batch generation across multiple prompts" />
                  <CheckItem text="Full prompt history and version control" />
                </div>

                <Link href="/login" className="cta-link" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 15,
                  color: '#00C4CC', textDecoration: 'none',
                }}>
                  Start generating images
                  <span className="cta-arrow"><ArrowRight /></span>
                </Link>
              </div>

              {/* Visual */}
              <div className="visual-col" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ImageGenVisual />
              </div>
            </div>
          </div>
        </section>

        <div style={{ padding: '0 32px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div className="divider" />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            02 — Video Generation
        ════════════════════════════════════════════════════════ */}
        <section style={{ padding: 'clamp(64px,8vw,108px) 32px' }} id="video-generation" aria-label="Video Generation">
          <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>

            {/* Watermark — right-aligned */}
            <div className="af" aria-hidden="true" style={{
              position: 'absolute', top: -48, right: -16, left: 'auto', zIndex: 0,
              fontFamily: 'var(--font-syne)', fontWeight: 800,
              fontSize: 'clamp(100px,16vw,192px)', lineHeight: 1,
              color: '#111A26', userSelect: 'none', pointerEvents: 'none',
            }}>02</div>

            <div className="prod-grid flip" style={{ position: 'relative', zIndex: 1 }}>
              {/* Visual */}
              <div className="visual-col" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <VideoGenVisual />
              </div>

              {/* Copy */}
              <div>
                <SectionLabel
                  text="Video Generation"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <rect x="1" y="3" width="10" height="10" rx="2" stroke="#00C4CC" strokeWidth="1.4" opacity="0.8" />
                      <path d="M11 8L15 5.5V10.5L11 8Z" fill="#00C4CC" opacity="0.8" />
                    </svg>
                  }
                />

                <h2 className="prod-h2" style={{
                  fontFamily: 'var(--font-syne)',
                  fontSize: 'clamp(32px,4.2vw,56px)',
                  fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.025em',
                  margin: '0 0 20px',
                }}>
                  AI video generation.<br />Cinematic output<br />from one prompt.
                </h2>

                <p style={{ fontSize: 15, color: '#8A9EAE', lineHeight: 1.75, margin: '0 0 28px', maxWidth: '44ch' }}>
                  Text-to-video or image-to-video — select a model and let it run. From
                  short social clips to long-form narratives, every format is supported.
                </p>

                <ModelPills models={[
                  { label: 'Veo 3.1',      color: '#10B981' },
                  { label: 'Kling 3.0',    color: '#8B5CF6' },
                  { label: 'Seedance 2.0', color: '#3B82F6' },
                  { label: 'Grok',         color: '#EC4899' },
                ]} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
                  <CheckItem text="Prompt-to-video in seconds" />
                  <CheckItem text="Animate any still image to video" />
                  <CheckItem text="Long-form video with scene continuity" />
                </div>

                <Link href="/login" className="cta-link" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 15,
                  color: '#00C4CC', textDecoration: 'none',
                }}>
                  Generate your first video
                  <span className="cta-arrow"><ArrowRight /></span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div style={{ padding: '0 32px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div className="divider" />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            03 — Studio
        ════════════════════════════════════════════════════════ */}
        <section style={{ padding: 'clamp(64px,8vw,108px) 32px' }} id="studio" aria-label="Talking Video Studio">
          <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>

            {/* Watermark — left, matching 01 */}
            <div className="af" aria-hidden="true" style={{
              position: 'absolute', top: -48, left: -16, zIndex: 0,
              fontFamily: 'var(--font-syne)', fontWeight: 800,
              fontSize: 'clamp(100px,16vw,192px)', lineHeight: 1,
              color: '#111A26', userSelect: 'none', pointerEvents: 'none',
            }}>03</div>

            <div className="prod-grid" style={{ position: 'relative', zIndex: 1 }}>
              {/* Copy */}
              <div>
                <SectionLabel
                  text="Studio"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <circle cx="8" cy="8" r="6.5" stroke="#00C4CC" strokeWidth="1.4" opacity="0.7" />
                      <circle cx="8" cy="6" r="2.2" fill="#00C4CC" opacity="0.8" />
                      <path d="M3.5 14C3.5 11.5 5.5 9.5 8 9.5C10.5 9.5 12.5 11.5 12.5 14" stroke="#00C4CC" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  }
                />

                <h2 className="prod-h2" style={{
                  fontFamily: 'var(--font-syne)',
                  fontSize: 'clamp(32px,4.2vw,56px)',
                  fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.025em',
                  margin: '0 0 20px',
                }}>
                  Talking video studio.<br />Your voice,<br />your face.
                </h2>

                <p style={{ fontSize: 15, color: '#8A9EAE', lineHeight: 1.75, margin: '0 0 28px', maxWidth: '44ch' }}>
                  Turn your script into a lifelike avatar video. Powered by ElevenLabs voice
                  synthesis — clone your voice or choose from hundreds of voices across
                  28 languages.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
                  <CheckItem text="Voice cloning — digitize your own voice" />
                  <CheckItem text="28 languages for global reach" />
                  <CheckItem text="Frame-accurate lip sync technology" />
                  <CheckItem text="Powered by ElevenLabs synthesis" />
                </div>

                <Link href="/studio" className="cta-link" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 15,
                  color: '#00C4CC', textDecoration: 'none',
                }}>
                  Open the Studio
                  <span className="cta-arrow"><ArrowRight /></span>
                </Link>
              </div>

              {/* Visual */}
              <div className="visual-col" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <StudioVisual />
              </div>
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ──────────────────────────────────────── */}
        <section style={{
          padding: 'clamp(60px,7vw,96px) 32px',
          borderTop: '1px solid #151F2E',
        }}>
          <div style={{
            maxWidth: 1280, margin: '0 auto',
            display: 'flex', flexWrap: 'wrap', alignItems: 'center',
            justifyContent: 'space-between', gap: 32,
          }}>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-syne)',
                fontSize: 'clamp(28px,4vw,52px)',
                fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 10px',
              }}>
                Ready to create?
              </h2>
              <p style={{ fontSize: 15, color: '#8A9EAE', margin: 0 }}>
                Start free. No credit card required.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/login" style={{
                background: '#F4F8FB', color: '#0B0F14', fontWeight: 700, fontSize: 15,
                padding: '14px 28px', borderRadius: 12, textDecoration: 'none',
                fontFamily: 'var(--font-syne)', display: 'inline-flex', alignItems: 'center',
              }}>
                Get Started Free
              </Link>
              <Link href="/pricing" style={{
                background: 'transparent', color: '#F4F8FB', fontWeight: 600, fontSize: 15,
                padding: '14px 28px', borderRadius: 12, textDecoration: 'none',
                fontFamily: 'var(--font-syne)', border: '1px solid #273242',
                display: 'inline-flex', alignItems: 'center',
              }}>
                View Pricing
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
