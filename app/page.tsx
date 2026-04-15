'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ImageIcon, Film, Mic, CheckCircle } from 'lucide-react'

/* ── Motion helpers ──────────────────────────────────────────── */
const fadeRise = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as const } },
}
const stagger = { show: { transition: { staggerChildren: 0.08 } } }

/* ── Header ─────────────────────────────────────────────────── */
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
          {([['Product', '/products'], ['Pricing', '/pricing'], ['FAQ', '#faq']] as const).map(([n, href]) => (
            <Link key={n}
              href={href}
              style={{ color: '#A7B4C2', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F4F8FB')}
              onMouseLeave={e => (e.currentTarget.style.color = '#A7B4C2')}
            >{n}</Link>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/login" style={{ color: '#F4F8FB', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
          <Link href="/login" style={{
            background: '#F4F8FB', color: '#0B0F14', fontWeight: 600, fontSize: 13,
            padding: '8px 18px', borderRadius: 10, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', transition: 'background 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e4ecf4')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F4F8FB')}
          >Get Started</Link>
        </div>
      </div>
    </header>
  )
}


/* ── Hero Chat UI ────────────────────────────────────────────── */
type GenMode = 'image' | 'video'

const GEN_MODES = [
  { id: 'image' as GenMode, Icon: ImageIcon, label: 'Image' },
  { id: 'video' as GenMode, Icon: Film,      label: 'Video' },
]

const MODE_PLACEHOLDER: Record<GenMode, string> = {
  image: 'Describe the image you want to create…',
  video: 'Describe your video scene or camera movement…',
}

type ModelOption = { id: string; label: string; badge: string; badgeColor: string }

const MODE_MODELS: Record<GenMode, ModelOption[]> = {
  image: [
    { id: 'gpt5-image',       label: 'GPT-5 Image Mode',       badge: 'OpenAI',    badgeColor: '#10B981' },
    { id: 'nb3-pro',          label: 'Nano Banana 3 Pro',       badge: 'NB Labs',   badgeColor: '#8B5CF6' },
    { id: 'nb3-flash',        label: 'Nano Banana 3 Flash',     badge: 'NB Labs',   badgeColor: '#F59E0B' },
  ],
  video: [
    { id: 'seedance-2',       label: 'Seedance 2.0',            badge: 'ByteDance', badgeColor: '#3B82F6' },
    { id: 'veo-3.1',          label: 'Veo 3.1',                 badge: 'Google',    badgeColor: '#10B981' },
    { id: 'kling-3',          label: 'Kling 3.0',               badge: 'Kuaishou',  badgeColor: '#8B5CF6' },
    { id: 'grok-video',       label: 'Grok',                    badge: 'xAI',       badgeColor: '#EC4899' },
  ],
}

function ChevronDownIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AttachIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M13 7.5L7.5 13C6.12 14.38 3.88 14.38 2.5 13C1.12 11.62 1.12 9.38 2.5 8L8 2.5C8.97 1.53 10.53 1.53 11.5 2.5C12.47 3.47 12.47 5.03 11.5 6L6 11.5C5.45 12.05 4.55 12.05 4 11.5C3.45 10.95 3.45 10.05 4 9.5L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function HeroChatPanel() {
  const router = useRouter()
  const [mode, setMode]         = useState<GenMode>('image')
  const [prompt, setPrompt]     = useState('')
  const [focused, setFocused]   = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODE_MODELS.image[0])
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Update selected model when mode changes
  useEffect(() => {
    setSelectedModel(MODE_MODELS[mode][0])
    setModelOpen(false)
  }, [mode])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function goToLogin() { router.push('/login') }

  const hasPrompt = prompt.trim().length > 0

  return (
    <div style={{ width: '100%', maxWidth: 680, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>

      {/* Mode tabs — pill style */}
      <div style={{
        display: 'flex', gap: 1,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 100, padding: '3px',
      }}>
        {GEN_MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 20px', borderRadius: 100, border: 'none', cursor: 'pointer',
            background: mode === m.id ? 'rgba(255,255,255,0.10)' : 'transparent',
            color: mode === m.id ? '#F4F8FB' : 'rgba(255,255,255,0.35)',
            fontSize: 13, fontWeight: 500, transition: 'all 0.2s', letterSpacing: '0.01em',
          }}
            onMouseEnter={e => { if (mode !== m.id) e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
            onMouseLeave={e => { if (mode !== m.id) e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
          >
            <m.Icon size={12} />
            {m.label}
          </button>
        ))}
      </div>

      {/* Main input card */}
      <div style={{
        width: '100%',
        background: 'rgba(18,22,30,0.82)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: `1px solid ${focused ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 20,
        boxShadow: focused
          ? '0 0 0 1px rgba(255,255,255,0.06), 0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)'
          : '0 8px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
        transition: 'border-color 0.22s, box-shadow 0.22s',
        overflow: 'visible',
        position: 'relative',
      }}>

        {/* Prompt input row */}
        <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => { if (e.key === 'Enter') goToLogin() }}
            placeholder={MODE_PLACEHOLDER[mode]}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 15, color: '#F4F8FB', caretColor: '#00C4CC',
              lineHeight: 1.5, padding: '2px 0',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Bottom toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px 12px',
        }}>
          {/* Left tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Attach */}
            <button onClick={goToLogin} title="Attach reference" style={{
              width: 32, height: 32, borderRadius: 9, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
            ><AttachIcon /></button>

            {/* Aspect ratio / quality tags */}
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />
            {(mode === 'image' ? ['1:1','16:9','9:16'] : ['5s','10s','15s']).map(tag => (
              <button key={tag} onClick={goToLogin} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.35)', fontSize: 11, borderRadius: 7,
                padding: '4px 9px', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              >{tag}</button>
            ))}

            {/* Model dropdown */}
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setModelOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: modelOpen ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${modelOpen ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 9, padding: '4px 10px 4px 8px',
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (!modelOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' } }}
                onMouseLeave={e => { if (!modelOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' } }}
              >
                {/* Badge dot */}
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: selectedModel.badgeColor, flexShrink: 0, boxShadow: `0 0 6px ${selectedModel.badgeColor}88` }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 500, whiteSpace: 'nowrap' }}>{selectedModel.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', transition: 'transform 0.18s', transform: modelOpen ? 'rotate(180deg)' : 'none', display: 'flex' }}>
                  <ChevronDownIcon size={11} />
                </span>
              </button>

              {/* Dropdown panel */}
              <AnimatePresence>
                {modelOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.16, ease: [0.25, 0.1, 0.25, 1] }}
                    style={{
                      position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, zIndex: 100,
                      background: 'rgba(16,20,28,0.97)',
                      backdropFilter: 'blur(40px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 14,
                      padding: '6px',
                      minWidth: 240,
                      boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
                    }}
                  >
                    <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px 6px', margin: 0 }}>
                      Premium Models
                    </p>
                    {MODE_MODELS[mode].map(m => {
                      const isSelected = m.id === selectedModel.id
                      return (
                        <button
                          key={m.id}
                          onClick={() => { setSelectedModel(m); setModelOpen(false) }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                            background: isSelected ? 'rgba(255,255,255,0.07)' : 'transparent',
                            textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.12s',
                          }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                        >
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.badgeColor, flexShrink: 0, boxShadow: `0 0 7px ${m.badgeColor}99` }} />
                          <span style={{ flex: 1, fontSize: 12.5, color: isSelected ? '#F4F8FB' : 'rgba(255,255,255,0.65)', fontWeight: isSelected ? 600 : 400 }}>{m.label}</span>
                          <span style={{
                            fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                            background: `${m.badgeColor}18`,
                            color: m.badgeColor, letterSpacing: '0.04em',
                          }}>{m.badge}</span>
                          {isSelected && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                              <path d="M2 6L5 9L10 3" stroke={m.badgeColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Send button */}
          <button onClick={goToLogin} style={{
            width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
            background: hasPrompt ? '#F4F8FB' : 'rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: hasPrompt ? '0 2px 12px rgba(244,248,251,0.25)' : 'none',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 11.5V2.5M7 2.5L3 6.5M7 2.5L11 6.5" stroke={hasPrompt ? '#0B0F14' : 'rgba(255,255,255,0.3)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Hint */}
      <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.22)', margin: 0, letterSpacing: '0.01em' }}>
        Press <kbd style={{ fontFamily: 'inherit', fontSize: 11, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 5px' }}>Enter</kbd> to generate · No credit card required
      </p>
    </div>
  )
}

/* ── Hero ────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{
      height: '100vh', minHeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0B0F14', position: 'relative', overflow: 'hidden',
    }}>
      {/* Video background */}
      <video
        autoPlay muted loop playsInline
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 0,
        }}
      >
        <source src="/For Rebranding/New folder/upscaled-video.mp4" type="video/mp4" />
      </video>

      {/* Overlays — darken + centre-vignette so chat UI reads clearly */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'rgba(8,11,16,0.52)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 75% 65% at 50% 58%, rgba(8,11,16,0.78) 0%, rgba(8,11,16,0.30) 55%, transparent 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(8,11,16,0.65) 0%, transparent 18%, transparent 72%, rgba(8,11,16,0.85) 100%)',
      }} />

      {/* Chat UI */}
      <motion.div
        initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', zIndex: 2, padding: '0 32px', width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <HeroChatPanel />
      </motion.div>
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
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>

      {/* Image preview */}
      <div style={{
        flexShrink: 0, width: 148,
        borderRadius: 12, overflow: 'hidden', border: '1px solid #1E2A3A', lineHeight: 0,
        background: '#0D1420',
      }}>
        <img
          src="/For Rebranding/New folder/image-gen-svg/5.svg"
          alt=""
          style={{ width: '100%', display: 'block' }}
        />
      </div>

      {/* Prompt + controls */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Prompt box */}
        <div style={{
          flex: 1, background: '#0D1420', border: '1px solid #1E2A3A',
          borderRadius: 10, padding: '12px 14px', overflow: 'hidden',
        }}>
          <div style={{ fontSize: 10, color: '#3A4A5C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Prompt</div>
          <div style={{ fontSize: 11, color: '#8A9BB0', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            A professional brand photo of a founder presenting at a conference, cinematic lighting, shallow depth of field, sharp focus on the subject, modern stage backdrop with soft bokeh, confident posture, high-end editorial aesthetic, photorealistic.
          </div>
        </div>

        {/* Model + format row */}
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{
            flex: 1, background: '#0D1420', border: '1px solid #1E2A3A',
            borderRadius: 8, padding: '8px 10px',
          }}>
            <div style={{ fontSize: 9, color: '#3A4A5C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Model</div>
            <div style={{ fontSize: 11, color: '#A7B4C2', display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C4CC' }} />
              GPT-5 Image
            </div>
          </div>
          <div style={{
            background: '#0D1420', border: '1px solid #1E2A3A',
            borderRadius: 8, padding: '8px 10px',
          }}>
            <div style={{ fontSize: 9, color: '#3A4A5C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Size</div>
            <div style={{ fontSize: 11, color: '#A7B4C2' }}>1024×1024</div>
          </div>
        </div>

        {/* Generate button */}
        <button style={{
          background: 'linear-gradient(90deg,#00C4CC,#00F2FE)',
          border: 'none', borderRadius: 8, padding: '9px 14px',
          fontSize: 12, fontWeight: 600, color: '#0A101A', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <polygon points="2,1 11,6 2,11" fill="#0A101A"/>
          </svg>
          Generate Image
        </button>

      </div>
    </div>
  )
}

function VideoGenPreview() {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>

      {/* Video preview */}
      <div style={{
        flexShrink: 0, width: 148,
        borderRadius: 12, overflow: 'hidden', border: '1px solid #1E2A3A', lineHeight: 0,
        background: '#0D1420',
      }}>
        <video autoPlay muted loop playsInline style={{ width: '100%', display: 'block' }}>
          <source src="/For Rebranding/New folder/video-generation.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Prompt + controls */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Prompt box */}
        <div style={{
          flex: 1, background: '#0D1420', border: '1px solid #1E2A3A',
          borderRadius: 10, padding: '12px 14px', overflow: 'hidden',
        }}>
          <div style={{ fontSize: 10, color: '#3A4A5C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Prompt</div>
          <div style={{ fontSize: 11, color: '#8A9BB0', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            Create a realistic vertical 9:16 UGC-style selfie video of a 28-year-old woman promoting HERA skincare. She is filming herself in a bright, modern bathroom with soft morning light, speaking directly to the front-facing camera in a natural, authentic, live social media style. She looks polished but relatable, with healthy glowing skin, minimal elegant makeup, and a clean beauty aesthetic that fits a premium Korean skincare brand. She holds a sleek HERA skincare product, shows it close to the camera, talks about how it feels on the skin, then applies a small amount to her cheek and gently blends it in while continuing to speak.
          </div>
        </div>

        {/* Model + format row */}
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{
            flex: 1, background: '#0D1420', border: '1px solid #1E2A3A',
            borderRadius: 8, padding: '8px 10px',
          }}>
            <div style={{ fontSize: 9, color: '#3A4A5C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Model</div>
            <div style={{ fontSize: 11, color: '#A7B4C2', display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C4CC' }} />
              Veo 3.1 Fast
            </div>
          </div>
          <div style={{
            background: '#0D1420', border: '1px solid #1E2A3A',
            borderRadius: 8, padding: '8px 10px',
          }}>
            <div style={{ fontSize: 9, color: '#3A4A5C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Format</div>
            <div style={{ fontSize: 11, color: '#A7B4C2' }}>9:16 · 8s</div>
          </div>
        </div>

        {/* Generate button */}
        <button style={{
          background: 'linear-gradient(90deg,#00C4CC,#00F2FE)',
          border: 'none', borderRadius: 8, padding: '9px 14px',
          fontSize: 12, fontWeight: 600, color: '#0A101A', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <polygon points="2,1 11,6 2,11" fill="#0A101A"/>
          </svg>
          Generate Video
        </button>

      </div>
    </div>
  )
}

function StudioPreview() {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>

      {/* Avatar stage — center panel preview */}
      <div style={{
        position: 'relative', flexShrink: 0, width: 140,
        borderRadius: 12, overflow: 'hidden', border: '1px solid #1E2A3A', lineHeight: 0,
        background: '#0D1420',
      }}>
        <video autoPlay muted loop playsInline style={{ width: '100%', display: 'block' }}>
          <source src="/For Rebranding/New folder/asian_man.mp4" type="video/mp4" />
        </video>
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: 'rgba(0,196,204,0.15)', border: '1px solid rgba(0,196,204,0.3)',
          borderRadius: 6, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00C4CC' }} />
          <span style={{ fontSize: 10, color: '#00C4CC', fontWeight: 600, letterSpacing: '0.06em' }}>STAGE</span>
        </div>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '18px 10px 8px',
          background: 'linear-gradient(to top, rgba(10,16,26,0.9), transparent)',
          display: 'flex', alignItems: 'flex-end', gap: 2, justifyContent: 'center',
        }}>
          {[6,10,16,12,20,14,8,18,12,6].map((h, i) => (
            <div key={i} className="waveform-bar" style={{ height: h, width: 3, animationDelay: `${i * 70}ms`, borderRadius: 2 }} />
          ))}
        </div>
      </div>

      {/* Setup panel — mirrors actual VideoGeneratorForm */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Model toggle */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1E2A3A', borderRadius: 8, padding: 3, display: 'flex', gap: 3 }}>
          {['InfiniteTalk', 'Kling Avatar'].map((m, i) => (
            <div key={m} style={{
              flex: 1, textAlign: 'center', padding: '5px 0', borderRadius: 6, fontSize: 10, fontWeight: 600,
              background: i === 0 ? 'linear-gradient(90deg,#00C4CC,#00F2FE)' : 'transparent',
              color: i === 0 ? '#0B0F14' : '#4A5C6E',
            }}>{m}</div>
          ))}
        </div>

        {/* Portrait upload */}
        <div style={{ background: '#0D1420', border: '1px dashed #273242', borderRadius: 9, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image
            src="/For Rebranding/New folder/asian_man_img.png"
            alt="Portrait"
            width={34} height={34}
            style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
          />
          <div>
            <div style={{ fontSize: 9, color: '#3A4A5C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Portrait Image</div>
            <div style={{ fontSize: 10, color: '#738295' }}>asian_man_img.png</div>
          </div>
        </div>

        {/* Audio upload */}
        <div style={{ background: '#0D1420', border: '1px dashed #273242', borderRadius: 9, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 6, background: 'rgba(0,196,204,0.1)', border: '1px solid rgba(0,196,204,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M9 18V5l12-2v13" stroke="#00C4CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="6" cy="18" r="3" stroke="#00C4CC" strokeWidth="1.5"/>
              <circle cx="18" cy="16" r="3" stroke="#00C4CC" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 9, color: '#3A4A5C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Audio</div>
            <div style={{ fontSize: 10, color: '#738295' }}>voiceover_take1.mp3 · 2.4 MB</div>
          </div>
        </div>

        {/* Motion prompt */}
        <div style={{ background: '#0D1420', border: '1px solid #1E2A3A', borderRadius: 9, padding: '8px 12px' }}>
          <div style={{ fontSize: 9, color: '#3A4A5C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Motion Prompt</div>
          <div style={{ fontSize: 11, color: '#4A5C6E' }}>speak naturally with slight head movement</div>
        </div>

        {/* Generate button */}
        <button style={{
          background: 'linear-gradient(90deg,#00C4CC,#00F2FE)',
          border: 'none', borderRadius: 8, padding: '9px 14px', marginTop: 'auto',
          fontSize: 12, fontWeight: 600, color: '#0A101A', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <polygon points="2,1 11,6 2,11" fill="#0A101A"/>
          </svg>
          Generate Take
        </button>

      </div>
    </div>
  )
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

  return (
    <section style={{ padding: '56px 32px 64px', background: '#101722', borderTop: '1px solid #273242' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <motion.h2
          variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, color: '#F4F8FB', marginBottom: 6 }}
        >
          Everything you need to create
        </motion.h2>
        <motion.p
          variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ color: '#738295', fontSize: 16, marginBottom: 36, lineHeight: 1.5 }}
        >
          Three powerful tools, one unified workspace.
        </motion.p>
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 52, alignItems: 'start' }}>
          <div>
            {FEATURES.map((f, i) => {
              const active = i === activeIdx
              return (
                <div key={f.id}>
                  <button
                    onClick={() => { if (rafRef.current) cancelAnimationFrame(rafRef.current); setActiveIdx(i) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '20px 0', width: '100%' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: active ? 12 : 0 }}>
                      <f.Icon size={17} color={active ? '#00C4CC' : '#3A4A5C'} />
                      <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 17, color: active ? '#F4F8FB' : '#4A5C6E', transition: 'color 0.25s' }}>{f.label}</span>
                    </div>
                    {active && (
                      <>
                        <p style={{ fontSize: 14, color: '#A7B4C2', lineHeight: 1.65, margin: '0 0 16px', paddingLeft: 29 }}>{f.desc}</p>
                        <div style={{ height: 2, background: '#273242', borderRadius: 99 }}>
                          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#00C4CC,#00F2FE)', borderRadius: 99, transition: 'width 0.08s linear' }} />
                        </div>
                      </>
                    )}
                  </button>
                  {i < FEATURES.length - 1 && <div style={{ height: 1, background: '#1E2A3A' }} />}
                </div>
              )
            })}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] } }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] } }}
              style={{ background: '#141D28', border: '1px solid #273242', borderRadius: 16, padding: 28, minHeight: 320 }}
            >
              {activeIdx === 0 ? <ImageGenPreview /> : activeIdx === 1 ? <VideoGenPreview /> : <StudioPreview />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

/* ── Pricing Highlight ───────────────────────────────────────── */
const HIGHLIGHT_PLANS = [
  {
    name: 'Creator',
    badge: null,
    monthlyPrice: 6.99,
    annualPrice:  4.99,
    credits: '2,000',
    creditsNote: 'credits / month',
    desc: 'For solo creators building a consistent content rhythm.',
    features: [
      '2,000 credits / month',
      'All budget + standard image models',
      'Standard video up to Kling 2.1',
      'Studio avatar video',
      'Email support',
    ],
    accent: '#34D399',
    highlight: false,
  },
  {
    name: 'Pro',
    badge: 'Most Popular',
    monthlyPrice: 11.99,
    annualPrice:  9.99,
    credits: '5,000',
    creditsNote: 'credits / month',
    desc: 'For marketers and power creators who need premium quality.',
    features: [
      '5,000 credits / month',
      'All standard + premium image models',
      'Premium video — Runway Turbo / Kling 2.6',
      'Studio avatar video',
      'Priority generation queue',
      'Priority support',
    ],
    accent: '#00C4CC',
    highlight: true,
  },
  {
    name: 'Premium',
    badge: 'Most Powerful',
    monthlyPrice: 24.99,
    annualPrice:  19.99,
    credits: '10,000',
    creditsNote: 'credits / month',
    desc: 'For agencies and studios running at full capacity.',
    features: [
      '10,000 credits / month',
      'Roll over up to 2,500 unused credits',
      'Every model — including ultra-premium',
      'Veo 3, Sora 2 Pro, Gemini 3 Pro',
      'Studio + long-form avatar video',
      'Dedicated support',
    ],
    accent: '#A78BFA',
    highlight: false,
  },
]

function PricingHighlight() {
  const [annual, setAnnual] = useState(false)
  const router = useRouter()

  return (
    <section style={{ padding: '96px 32px', background: '#0B0F14', borderTop: '1px solid #273242' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 52, flexWrap: 'wrap', gap: 20 }}>
          <div>
            <motion.p variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
              style={{ fontSize: 11, fontWeight: 700, color: '#738295', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              Plans & Pricing
            </motion.p>
            <motion.h2 variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
              style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, color: '#F4F8FB', margin: 0 }}>
              Simple, flexible credits
            </motion.h2>
          </div>
          {/* Annual toggle */}
          <motion.div variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: annual ? '#738295' : '#F4F8FB', transition: 'color 0.2s' }}>Monthly</span>
            <button onClick={() => setAnnual(a => !a)} style={{
              width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer', position: 'relative',
              background: annual ? 'linear-gradient(135deg,#00C4CC,#00F2FE)' : '#273242',
              transition: 'background 0.3s',
            }}>
              <div style={{
                position: 'absolute', top: 3, left: annual ? 'calc(100% - 21px)' : 3,
                width: 18, height: 18, borderRadius: '50%', background: '#F4F8FB',
                transition: 'left 0.3s',
              }} />
            </button>
            <span style={{ fontSize: 13, color: annual ? '#F4F8FB' : '#738295', transition: 'color 0.2s' }}>
              Annual <span style={{ color: '#00C4CC', fontWeight: 600, fontSize: 11 }}>–24%</span>
            </span>
          </motion.div>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {HIGHLIGHT_PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
              style={{
                background: plan.highlight ? 'rgba(0,196,204,0.05)' : '#101722',
                border: `1px solid ${plan.highlight ? 'rgba(0,196,204,0.35)' : '#273242'}`,
                borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Subtle glow for highlighted plan */}
              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
                  background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,196,204,0.12) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />
              )}

              {/* Badge */}
              {plan.badge && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: `${plan.accent}18`, border: `1px solid ${plan.accent}40`,
                  borderRadius: 99, padding: '4px 12px', marginBottom: 16,
                }}>
                  <span style={{ fontSize: 11, color: plan.accent, fontWeight: 600, letterSpacing: '0.04em' }}>{plan.badge}</span>
                </div>
              )}

              <div style={{ marginBottom: plan.badge ? 0 : 16 }}>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 22, color: '#F4F8FB', marginBottom: 6 }}>{plan.name}</div>
                <div style={{ fontSize: 13, color: '#738295', lineHeight: 1.5, marginBottom: 20 }}>{plan.desc}</div>
              </div>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 42, color: '#F4F8FB', lineHeight: 1 }}>
                  ${annual ? plan.annualPrice : plan.monthlyPrice}
                </span>
                <span style={{ fontSize: 13, color: '#738295', marginBottom: 6 }}>/mo</span>
              </div>
              {annual && (
                <div style={{ fontSize: 12, color: '#00C4CC', marginBottom: 4 }}>Billed annually</div>
              )}

              {/* Credits */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: `${plan.accent}12`, border: `1px solid ${plan.accent}25`,
                borderRadius: 10, padding: '10px 14px', marginBottom: 24, marginTop: 16,
              }}>
                <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 18, color: plan.accent }}>{plan.credits}</span>
                <span style={{ fontSize: 12, color: '#738295' }}>{plan.creditsNote}</span>
              </div>

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <CheckCircle size={14} color={plan.accent} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 13, color: '#A7B4C2', lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button onClick={() => router.push('/login')} style={{
                width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 14,
                background: plan.highlight ? 'linear-gradient(135deg,#00C4CC,#00F2FE)' : `${plan.accent}18`,
                color: plan.highlight ? '#0B0F14' : plan.accent,
                boxShadow: plan.highlight ? '0 0 20px rgba(0,196,204,0.3)' : 'none',
                transition: 'opacity 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                Get Started
              </button>
            </motion.div>
          ))}
        </div>

        {/* See all plans link */}
        <motion.div variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ marginTop: 28 }}>
          <Link href="/pricing" style={{
            fontSize: 14, color: '#738295', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#A7B4C2')}
            onMouseLeave={e => (e.currentTarget.style.color = '#738295')}
          >
            See all plans including Free & Enterprise <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

/* ── Gallery ─────────────────────────────────────────────────── */
type GalleryCard =
  | { kind: 'image'; src: string; ratio: '9/16' | '1/1'; tag: string }
  | { kind: 'video'; src: string; ratio: '9/16' | '1/1'; tag: string }

const GALLERY_CARDS: GalleryCard[] = [
  // 9:16 portrait videos
  { kind: 'video', src: '/For Rebranding/New folder/asian_man.mp4',         ratio: '9/16', tag: 'AI Avatar' },
  { kind: 'video', src: '/For Rebranding/New folder/video-generation.mp4',  ratio: '9/16', tag: 'Video Gen' },
  // portrait image
  { kind: 'image', src: '/For Rebranding/New folder/asian_man_img.png',     ratio: '9/16', tag: 'Portrait' },
  // square AI-generated images
  { kind: 'image', src: '/A cyberpunk city at sunset with neon reflections on wet streets.png',                                                                                            ratio: '1/1', tag: 'Cyberpunk' },
  { kind: 'image', src: '/Watercolor painting of a Japanese garden in autumn.png',                                                                                                        ratio: '1/1', tag: 'Watercolor' },
  { kind: 'image', src: '/Surreal floating islands above clouds at golden hour.png',                                                                                                      ratio: '1/1', tag: 'Surreal' },
  { kind: 'image', src: '/Ethereal forest with bioluminescent mushrooms and fireflies.png',                                                                                               ratio: '1/1', tag: 'Nature' },
  { kind: 'image', src: '/Macro photograph of morning dew on a spider web.png',                                                                                                          ratio: '1/1', tag: 'Macro' },
  // SVG illustrations (all ~1.14:1 → treated as square)
  { kind: 'image', src: '/For Rebranding/New folder/image-gen-svg/1.svg',   ratio: '1/1', tag: 'Illustration' },
  { kind: 'image', src: '/For Rebranding/New folder/image-gen-svg/2.svg',   ratio: '1/1', tag: 'Illustration' },
  { kind: 'image', src: '/For Rebranding/New folder/image-gen-svg/3.svg',   ratio: '1/1', tag: 'Illustration' },
  { kind: 'image', src: '/For Rebranding/New folder/image-gen-svg/4.svg',   ratio: '1/1', tag: 'Illustration' },
  { kind: 'image', src: '/For Rebranding/New folder/image-gen-svg/5.svg',   ratio: '1/1', tag: 'Illustration' },
  { kind: 'image', src: '/For Rebranding/New folder/image-gen-svg/6.svg',   ratio: '1/1', tag: 'Illustration' },
  { kind: 'image', src: '/For Rebranding/New folder/image-gen-svg/7.svg',   ratio: '1/1', tag: 'Illustration' },
  { kind: 'video', src: '/For Rebranding/New folder/cr_cologne.mp4',        ratio: '9/16', tag: 'Creative' },
]

function GallerySection() {
  return (
    <section style={{ background: '#080C10', borderTop: '1px solid #1E2A3A', padding: '96px 32px 80px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Label */}
        <motion.p variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ fontSize: 11, fontWeight: 700, color: '#4A5C6E', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
          Gallery
        </motion.p>
        {/* Heading */}
        <motion.h2 variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 700, color: '#F4F8FB', margin: '0 0 56px', lineHeight: 1.15 }}>
          Made with Reelsy
        </motion.h2>

        {/* Collage — CSS columns for masonry stacking */}
        <style>{`
          .gallery-collage { columns: 5; column-gap: 10px; }
          @media (max-width: 1024px) { .gallery-collage { columns: 4 } }
          @media (max-width: 768px)  { .gallery-collage { columns: 3 } }
          @media (max-width: 480px)  { .gallery-collage { columns: 2 } }
        `}</style>
        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.05 }}
          className="gallery-collage"
        >
          {GALLERY_CARDS.map((card, i) => (
            <motion.div
              key={i}
              variants={fadeRise}
              style={{
                breakInside: 'avoid',
                marginBottom: 10,
                borderRadius: 12,
                overflow: 'hidden',
                position: 'relative',
                aspectRatio: card.ratio,
                background: '#0D1420',
                cursor: 'pointer',
              }}
              whileHover={{ scale: 1.025, transition: { duration: 0.18 } }}
            >
              {card.kind === 'video' ? (
                <video
                  autoPlay muted loop playsInline
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                >
                  <source src={card.src} type="video/mp4" />
                </video>
              ) : (
                <Image
                  src={card.src}
                  alt={card.tag}
                  fill
                  unoptimized={card.src.endsWith('.svg')}
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                />
              )}

              {/* Bottom fade + tag */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
                padding: '28px 10px 9px',
              }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.5)',
                }}>{card.tag}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ marginTop: 48, textAlign: 'center' }}>
          <Link href="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #0e7490 0%, #6d28d9 100%)',
            color: '#F4F8FB', fontWeight: 600, fontSize: 14,
            padding: '12px 28px', borderRadius: 12, textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Start creating for free <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

/* ── FAQ ─────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: 'What are credits and how do they work?',
    a: 'Credits are the currency used to generate content on Reelsy. Each generation costs a set number of credits depending on the model and output type — images cost fewer credits than videos. Credits are included with every plan and reset monthly. You can also purchase additional credit packs at any time.',
  },
  {
    q: 'Can I use the content I generate commercially?',
    a: 'Yes. All content generated on Reelsy belongs to you and can be used for commercial purposes, including advertising, client work, and product assets. Output rights are subject to the terms of the underlying AI model provider (e.g., OpenAI, Google), which generally permit commercial use for outputs generated via their APIs.',
  },
  {
    q: 'Which AI models are available?',
    a: 'Reelsy gives you access to a curated selection of the best models across categories — GPT-5 Image Mode, Nano Banana 3 Pro & Flash for images; Seedance 2.0, Veo 3.1, Kling 3.0, and Grok for video. The model list is updated regularly as new models launch.',
  },
  {
    q: 'Do unused credits roll over?',
    a: 'Credits do not roll over between billing periods on standard plans. However, any credits purchased as add-on packs remain available until used, regardless of your billing cycle.',
  },
  {
    q: 'Can I cancel my subscription at any time?',
    a: 'Yes. You can cancel at any time from your account settings. Your plan stays active until the end of the current billing period — you will not be charged again after cancelling.',
  },
  {
    q: 'Is there a free plan?',
    a: 'New accounts receive a one-time allocation of free credits so you can try every generation type before committing to a plan. No credit card is required to sign up.',
  },
  {
    q: 'How do I get support?',
    a: 'Email us at support@reelsy-app.com. We typically respond within 1–2 business days. Pro and Business subscribers receive priority response times.',
  },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" style={{ background: '#0B0F14', borderTop: '1px solid #1E2A3A', padding: '96px 32px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <motion.p variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ fontSize: 11, fontWeight: 700, color: '#4A5C6E', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
          FAQ
        </motion.p>
        <motion.h2 variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 700, color: '#F4F8FB', margin: '0 0 56px', lineHeight: 1.15 }}>
          FAQ
        </motion.h2>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {FAQS.map((faq, i) => {
            const isOpen = open === i
            return (
              <motion.div
                key={i}
                variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
                style={{ borderTop: '1px solid #1E2A3A' }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 20, padding: '22px 0', background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 500, color: isOpen ? '#F4F8FB' : '#C8D5E0', lineHeight: 1.4, transition: 'color 0.18s' }}>
                    {faq.q}
                  </span>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    border: '1px solid #273242', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'border-color 0.18s, background 0.18s',
                    background: isOpen ? 'rgba(255,255,255,0.07)' : 'transparent',
                    borderColor: isOpen ? '#3A4A5C' : '#273242',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                      style={{ transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.22s ease' }}>
                      <path d="M5 1V9M1 5H9" stroke={isOpen ? '#F4F8FB' : '#738295'} strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>

                {/* Answer — grid-template-rows trick for smooth height animation */}
                <div style={{
                  display: 'grid',
                  gridTemplateRows: isOpen ? '1fr' : '0fr',
                  transition: 'grid-template-rows 0.28s ease',
                }}>
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontSize: 14, color: '#738295', lineHeight: 1.75, margin: 0, paddingBottom: 22 }}>
                      {faq.a}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
          {/* Final border */}
          <div style={{ borderTop: '1px solid #1E2A3A' }} />
        </div>
      </div>
    </section>
  )
}

/* ── Footer ───────────────────────────────────────────────────── */
const FOOTER_LINKS: [string, string][] = [
  ['Pricing',         '/pricing'],
  ['Legal',           '/legal'],
  ['Privacy & Terms', '/privacy'],
  ['Contact',         '/contact'],
]

function Footer() {
  return (
    <footer style={{ background: '#0D1520', borderTop: '1px solid #273242', padding: '32px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <Image src="/For Rebranding/reelsy-logo-white-txt.png" alt="Reelsy" width={88} height={24} style={{ objectFit: 'contain' }} />
        <nav style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
          {FOOTER_LINKS.map(([label, href]) => (
            <Link key={label} href={href}
              style={{ fontSize: 13, color: '#738295', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#A7B4C2')}
              onMouseLeave={e => (e.currentTarget.style.color = '#738295')}
            >{label}</Link>
          ))}
        </nav>
        <span style={{ fontSize: 12, color: '#4A5C6E' }}>© 2026 Reelsy. All rights reserved.</span>
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
        <FeatureShowcase />
        <GallerySection />
        <FAQ />
      </main>
      <Footer />
    </>
  )
}
