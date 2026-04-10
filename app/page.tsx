'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ImageIcon, Film, Mic, CheckCircle } from 'lucide-react'

/* ── Motion helpers ──────────────────────────────────────────── */
const fadeRise = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as const } },
}
const stagger = { show: { transition: { staggerChildren: 0.08 } } }

/* ── Shared white button style ───────────────────────────────── */
const whiteBtnStyle: React.CSSProperties = {
  background: '#F4F8FB', color: '#0B0F14', fontWeight: 700, fontSize: 15,
  padding: '13px 28px', borderRadius: 12, textDecoration: 'none',
  display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer',
  transition: 'background 0.2s, box-shadow 0.2s',
}
const whiteBtnHover = (el: HTMLElement, on: boolean) => {
  el.style.background = on ? '#e4ecf4' : '#F4F8FB'
  el.style.boxShadow  = on ? '0 6px 28px rgba(244,248,251,0.12)' : 'none'
}

/* ── Header ──────────────────────────────────────────────────── */
function Header() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: scrolled ? 'rgba(11,15,20,0.88)' : 'transparent',
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      borderBottom: scrolled ? '1px solid #273242' : '1px solid transparent',
      transition: 'all 0.3s cubic-bezier(0.25,0.1,0.25,1)',
      padding: '0 32px',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/">
          <Image src="/For Rebranding/reelsy-logo-white-txt.png" alt="Reelsy" width={112} height={32} style={{ objectFit: 'contain' }} />
        </Link>

        <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {(['Product', 'Studio', 'Pricing', 'Enterprise'] as const).map(n => (
            <Link key={n}
              href={n === 'Studio' ? '/studio' : n === 'Pricing' ? '/pricing' : '#'}
              style={{ color: '#A7B4C2', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F4F8FB')}
              onMouseLeave={e => (e.currentTarget.style.color = '#A7B4C2')}
            >{n}</Link>
          ))}
        </nav>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/login"
            style={{ color: '#F4F8FB', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}
          >Sign In</Link>
          <Link href="/login" style={{
            background: '#F4F8FB', color: '#0B0F14', fontWeight: 600, fontSize: 13,
            padding: '8px 18px', borderRadius: 10, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', transition: 'background 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e4ecf4')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F4F8FB')}
          >Get Started for Free</Link>
        </div>
      </div>
    </header>
  )
}

/* ── Hero ────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0B0F14', position: 'relative', overflow: 'hidden',
      padding: '140px 32px 80px', textAlign: 'center',
    }}>
      {/* Centre bloom */}
      <div style={{
        position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 900, height: 900, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,196,204,0.055) 0%, transparent 58%)',
        pointerEvents: 'none',
      }} />
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(#273242 1px, transparent 1px), linear-gradient(90deg, #273242 1px, transparent 1px)',
        backgroundSize: '48px 48px', opacity: 0.035, pointerEvents: 'none',
      }} />

      <motion.div variants={stagger} initial="hidden" animate="show"
        style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, maxWidth: 800 }}>

        <motion.div variants={fadeRise} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,196,204,0.07)', border: '1px solid rgba(0,196,204,0.2)',
          borderRadius: 99, padding: '5px 14px',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C4CC', display: 'inline-block' }} />
          <span style={{ fontSize: 12, color: '#00C4CC', fontWeight: 500, letterSpacing: '0.02em' }}>AI Creative Studio</span>
        </motion.div>

        <motion.h1 variants={fadeRise} style={{
          fontFamily: 'var(--font-syne)', fontSize: 'clamp(52px,6.5vw,88px)',
          fontWeight: 800, color: '#F4F8FB', lineHeight: 1.05, margin: 0,
        }}>
          Creative production,<br />reimagined
        </motion.h1>

        <motion.p variants={fadeRise} style={{
          color: '#A7B4C2', fontSize: 18, lineHeight: 1.65, margin: 0, maxWidth: 600,
        }}>
          One AI studio for images, videos, and avatars—powered by flexible models, fast workflows, and production-ready output.
        </motion.p>

        <motion.div variants={fadeRise}>
          <Link href="/login" style={whiteBtnStyle}
            onMouseEnter={e => whiteBtnHover(e.currentTarget, true)}
            onMouseLeave={e => whiteBtnHover(e.currentTarget, false)}
          >
            Try it for Free <ArrowRight size={16} />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ── Trust strip ─────────────────────────────────────────────── */
const TRUST_ITEMS = [
  'Built for creators', 'Designed for marketers', 'Flexible model access',
  'Avatar video workflows', 'Fast production-ready output', '20+ AI models',
]

function TrustStrip() {
  return (
    <div style={{
      background: '#101722', borderTop: '1px solid #273242', borderBottom: '1px solid #273242',
      padding: '14px 0', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', gap: 48, whiteSpace: 'nowrap' }} className="animate-marquee">
        {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
          <span key={i} style={{ fontSize: 13, color: '#738295', flexShrink: 0 }}>
            <span style={{ color: '#00C4CC', marginRight: 8 }}>·</span>{item}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Media Carousel ──────────────────────────────────────────── */
// Placeholder cards — supply images at 280×187 (3∶2) and videos at 280×158 (16∶9)
const PLACEHOLDER_COUNT = 8

function MediaCarousel() {
  const items = Array.from({ length: PLACEHOLDER_COUNT })

  return (
    <section style={{ padding: '80px 0 96px', background: '#0B0F14', borderTop: '1px solid #273242', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px 48px', textAlign: 'center' }}>
        <motion.p variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ fontSize: 11, fontWeight: 700, color: '#738295', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Made with Reelsy
        </motion.p>
        <motion.h2 variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, color: '#F4F8FB', margin: 0 }}>
          From prompt to pixel — instantly
        </motion.h2>
      </div>

      {/* Row 1 — images, scroll left */}
      <div style={{ marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 14, width: 'max-content', padding: '4px 0' }} className="animate-gallery-scroll">
          {[...items, ...items].map((_, i) => (
            <div key={i} style={{
              width: 280, height: 187, flexShrink: 0,
              background: '#141D28', border: '1px solid #1E2A3A', borderRadius: 12,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <ImageIcon size={22} color="#1E2A3A" />
              <span style={{ fontSize: 10, color: '#2E3D4F', fontFamily: 'monospace' }}>280 × 187 px</span>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2 — videos, scroll right */}
      <div style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 14, width: 'max-content', padding: '4px 0' }} className="animate-marquee-reverse">
          {[...items, ...items].map((_, i) => (
            <div key={i} style={{
              width: 280, height: 158, flexShrink: 0,
              background: '#141D28', border: '1px solid #1E2A3A', borderRadius: 12,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Film size={22} color="#1E2A3A" />
              <span style={{ fontSize: 10, color: '#2E3D4F', fontFamily: 'monospace' }}>280 × 158 px</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Feature Showcase ────────────────────────────────────────── */
const FEATURE_DURATION = 5000

const FEATURES = [
  {
    id: 'image',
    Icon: ImageIcon,
    label: 'Image Generation',
    desc: 'Generate production-ready visuals from any prompt with 15+ models — GPT-5 Image, FLUX.2, Gemini 3 Pro, and more. Switch models mid-project without starting over.',
  },
  {
    id: 'video',
    Icon: Film,
    label: 'Video Generation',
    desc: 'Turn text or images into cinematic clips with Veo 3.1, Kling, Sora 2, Hailuo, and 10+ more models. From quick social clips to full broadcast-quality sequences.',
  },
  {
    id: 'studio',
    Icon: Mic,
    label: 'Studio — Avatar Video',
    desc: 'Upload a portrait, write a script, and Reelsy renders a lip-synced talking video using your cloned ElevenLabs voice. Spokesperson content at scale.',
  },
]

function ImageGenPreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#101722', borderRadius: 10, padding: '12px 16px', border: '1px solid #273242' }}>
        <div style={{ fontSize: 10, color: '#4A5568', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Prompt</div>
        <div style={{ fontSize: 13, color: '#A7B4C2', lineHeight: 1.55 }}>
          A professional brand photo of a founder presenting at a conference, cinematic lighting, shallow depth of field…
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ background: 'rgba(0,196,204,0.1)', color: '#00C4CC', borderRadius: 6, padding: '4px 10px', fontSize: 11 }}>GPT-5 Image</span>
        <span style={{ background: '#101722', border: '1px solid #273242', color: '#738295', borderRadius: 6, padding: '4px 10px', fontSize: 11 }}>1024×1024</span>
        <span style={{ background: '#101722', border: '1px solid #273242', color: '#738295', borderRadius: 6, padding: '4px 10px', fontSize: 11 }}>1.2s</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            height: 96, background: 'linear-gradient(135deg,#141D28,#1C2840)',
            borderRadius: 8, border: '1px solid #1E2A3A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ImageIcon size={16} color="#273242" />
          </div>
        ))}
      </div>
    </div>
  )
}

function VideoGenPreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#101722', borderRadius: 10, padding: '12px 16px', border: '1px solid #273242' }}>
        <div style={{ fontSize: 10, color: '#4A5568', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Prompt</div>
        <div style={{ fontSize: 13, color: '#A7B4C2', lineHeight: 1.55 }}>
          Cinematic drone shot over a modern city at golden hour, slow arc movement, 4K…
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ background: 'rgba(0,196,204,0.1)', color: '#00C4CC', borderRadius: 6, padding: '4px 10px', fontSize: 11 }}>Veo 3.1 Fast</span>
        <span style={{ background: '#101722', border: '1px solid #273242', color: '#738295', borderRadius: 6, padding: '4px 10px', fontSize: 11 }}>16:9 · 5s</span>
      </div>
      {/* Player mock */}
      <div style={{
        height: 140, background: 'linear-gradient(160deg,#101722,#141D28)', borderRadius: 10,
        border: '1px solid #1E2A3A', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(0,196,204,0.12)', border: '1px solid rgba(0,196,204,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: '13px solid #00C4CC', marginLeft: 3 }} />
        </div>
      </div>
      {/* Timeline */}
      <div style={{ height: 4, background: '#273242', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: '38%', height: '100%', background: 'linear-gradient(90deg,#00C4CC,#00F2FE)', borderRadius: 99 }} />
      </div>
    </div>
  )
}

function StudioPreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Avatar placeholder */}
        <div style={{
          width: 72, height: 72, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg,#141D28,#1C2840)', border: '1px solid #1E2A3A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="9" r="5" stroke="#273242" strokeWidth="1.5"/>
            <path d="M3 24c0-5.52 4.48-10 10-10s10 4.48 10 10" stroke="#273242" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ flex: 1, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 2, background: '#273242', borderRadius: 99 }} />
          <div style={{ height: 2, background: '#273242', borderRadius: 99, width: '68%' }} />
          <div style={{ height: 2, background: '#273242', borderRadius: 99, width: '84%' }} />
        </div>
      </div>
      {/* Waveform */}
      <div style={{ background: '#101722', borderRadius: 10, padding: '14px 16px', border: '1px solid #273242' }}>
        <div style={{ fontSize: 13, color: '#A7B4C2', marginBottom: 12, lineHeight: 1.55 }}>
          "Hi, I'm excited to share what we've been building over the past year…"
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 32 }}>
          {[10,18,28,22,32,26,20,30,24,16,28,20,14,24,18].map((h, i) => (
            <div key={i} className="waveform-bar" style={{ height: h, animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <span style={{ background: 'rgba(0,196,204,0.1)', color: '#00C4CC', borderRadius: 6, padding: '4px 10px', fontSize: 11 }}>Voice: Rachel</span>
        <span style={{ background: '#101722', border: '1px solid #273242', color: '#738295', borderRadius: 6, padding: '4px 10px', fontSize: 11 }}>9:16 Vertical</span>
      </div>
    </div>
  )
}

function FeaturePreview({ idx }: { idx: number }) {
  if (idx === 0) return <ImageGenPreview />
  if (idx === 1) return <VideoGenPreview />
  return <StudioPreview />
}

function FeatureShowcase() {
  const [activeIdx, setActiveIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const startRef = useRef<number>(Date.now())
  const rafRef   = useRef<number | null>(null)

  const tick = useCallback(() => {
    const pct = Math.min(((Date.now() - startRef.current) / FEATURE_DURATION) * 100, 100)
    setProgress(pct)
    if (pct < 100) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      setActiveIdx(i => (i + 1) % FEATURES.length)
    }
  }, [])

  useEffect(() => {
    startRef.current = Date.now()
    setProgress(0)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [activeIdx, tick])

  function handleSelect(i: number) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setActiveIdx(i)
  }

  return (
    <section style={{ padding: '96px 32px', background: '#101722', borderTop: '1px solid #273242' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <motion.h2
          variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, color: '#F4F8FB', marginBottom: 6 }}
        >
          Everything you need to create
        </motion.h2>
        <motion.p
          variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ color: '#738295', fontSize: 16, marginBottom: 52, lineHeight: 1.5 }}
        >
          Three powerful tools, one unified workspace.
        </motion.p>

        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 52, alignItems: 'start' }}>
          {/* Left — feature list */}
          <div>
            {FEATURES.map((f, i) => {
              const active = i === activeIdx
              return (
                <div key={f.id}>
                  <button
                    onClick={() => handleSelect(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '20px 0', width: '100%' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: active ? 12 : 0 }}>
                      <f.Icon size={17} color={active ? '#00C4CC' : '#3A4A5C'} />
                      <span style={{
                        fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 17,
                        color: active ? '#F4F8FB' : '#4A5C6E',
                        transition: 'color 0.25s',
                      }}>{f.label}</span>
                    </div>

                    {active && (
                      <>
                        <p style={{ fontSize: 14, color: '#A7B4C2', lineHeight: 1.65, margin: '0 0 16px', paddingLeft: 29 }}>
                          {f.desc}
                        </p>
                        {/* Progress bar */}
                        <div style={{ height: 2, background: '#273242', borderRadius: 99 }}>
                          <div style={{
                            height: '100%', width: `${progress}%`,
                            background: 'linear-gradient(90deg,#00C4CC,#00F2FE)',
                            borderRadius: 99,
                            transition: 'width 0.08s linear',
                          }} />
                        </div>
                      </>
                    )}
                  </button>
                  {i < FEATURES.length - 1 && (
                    <div style={{ height: 1, background: '#1E2A3A' }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Right — preview panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] } }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] } }}
              style={{
                background: '#141D28', border: '1px solid #273242', borderRadius: 16,
                padding: 28, minHeight: 320,
              }}
            >
              <FeaturePreview idx={activeIdx} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

/* ── Workflow ─────────────────────────────────────────────────── */
const WORKFLOW_STEPS = [
  { n: '01', label: 'Describe or upload', desc: 'Write a prompt or drop in a reference image.' },
  { n: '02', label: 'Choose your model', desc: 'Pick from 20+ image and video models.' },
  { n: '03', label: 'Refine and compare', desc: 'Run variants, adjust, and compare side by side.' },
  { n: '04', label: 'Export and publish', desc: 'Download in full quality or push to your pipeline.' },
]

function Workflow() {
  return (
    <section style={{ padding: '96px 32px', background: '#0B0F14', borderTop: '1px solid #273242' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <motion.h2
          variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, color: '#F4F8FB', textAlign: 'center', marginBottom: 64 }}
        >
          From idea to output in four steps
        </motion.h2>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
          {WORKFLOW_STEPS.map((s, i) => (
            <div key={s.n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {i < WORKFLOW_STEPS.length - 1 && (
                <div style={{ position: 'absolute', top: 20, left: '50%', right: '-50%', height: 1, background: 'linear-gradient(90deg,#00C4CC,#273242)', zIndex: 0 }} />
              )}
              <motion.div variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
                style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 16px' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', margin: '0 auto 16px',
                  background: 'linear-gradient(135deg,#00C4CC,#00F2FE)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 13, color: '#0B0F14',
                }}>{s.n}</div>
                <div style={{ fontWeight: 600, color: '#F4F8FB', marginBottom: 8, fontSize: 15 }}>{s.label}</div>
                <div style={{ fontSize: 13, color: '#738295', lineHeight: 1.6 }}>{s.desc}</div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Final CTA ────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section style={{ padding: '104px 32px', background: '#101722', borderTop: '1px solid #273242', textAlign: 'center' }}>
      {/* Subtle bloom */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 300, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,196,204,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
        style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', position: 'relative' }}>
        <motion.h2 variants={fadeRise} style={{
          fontFamily: 'var(--font-syne)', fontSize: 'clamp(30px,4vw,54px)',
          fontWeight: 800, color: '#F4F8FB', margin: 0, lineHeight: 1.08,
        }}>
          Start your content creation journey with Reelsy
        </motion.h2>
        <motion.p variants={fadeRise} style={{ color: '#738295', fontSize: 17, lineHeight: 1.6, margin: 0 }}>
          No design skills required. No credit card to start.
        </motion.p>
        <motion.div variants={fadeRise}>
          <Link href="/login" style={whiteBtnStyle}
            onMouseEnter={e => whiteBtnHover(e.currentTarget, true)}
            onMouseLeave={e => whiteBtnHover(e.currentTarget, false)}
          >
            Get Started for Free <ArrowRight size={16} />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ── Footer ───────────────────────────────────────────────────── */
const FOOTER_COLS: { heading: string; links: [string, string][] }[] = [
  { heading: 'Product',   links: [['Generate','#'], ['Video','#'], ['Gallery','#'], ['History','#']] },
  { heading: 'Studio',    links: [['Avatar video','/studio'], ['Voice sync','#'], ['Templates','#'], ['Pricing','/pricing']] },
  { heading: 'Resources', links: [['Docs','#'], ['API','#'], ['Examples','#'], ['Blog','#']] },
  { heading: 'Company',   links: [['Enterprise','#'], ['Legal','#'], ['Privacy','#'], ['Terms','#']] },
]

function Footer() {
  return (
    <footer style={{ background: '#0D1520', borderTop: '1px solid #273242', padding: '64px 32px 32px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
          <div>
            <Image src="/For Rebranding/reelsy-logo-white-txt.png" alt="Reelsy" width={100} height={28} style={{ objectFit: 'contain', marginBottom: 16 }} />
            <p style={{ fontSize: 13, color: '#738295', lineHeight: 1.6, maxWidth: 240 }}>
              AI creative studio for images, videos, and avatar content.
            </p>
          </div>
          {FOOTER_COLS.map(col => (
            <div key={col.heading}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#A7B4C2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>{col.heading}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} style={{ fontSize: 13, color: '#738295', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#A7B4C2')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#738295')}
                    >{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #273242', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#738295' }}>© 2026 Reelsy. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 16 }}>
            {(['Twitter','LinkedIn','YouTube'] as const).map(s => (
              <Link key={s} href="#" style={{ fontSize: 12, color: '#738295', textDecoration: 'none' }}>{s}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ── Page ────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <MediaCarousel />
        <FeatureShowcase />
        <Workflow />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
