'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ArrowRight, ImageIcon, Film, Zap, Users, Building2,
  CheckCircle, Layers, History, Video, Mic, LayoutGrid,
} from 'lucide-react'

/* ── Motion helpers ─────────────────────────────────────────── */
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
          {['Product', 'Studio', 'Examples', 'Pricing', 'Enterprise'].map(n => (
            <Link key={n} href="#" style={{ color: '#A7B4C2', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F4F8FB')}
              onMouseLeave={e => (e.currentTarget.style.color = '#A7B4C2')}>
              {n}
            </Link>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/login" style={{ color: '#A7B4C2', fontSize: 14, textDecoration: 'none' }}>Log in</Link>
          <Link href="/login" className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}>Start free</Link>
        </div>
      </div>
    </header>
  )
}

/* ── Hero ────────────────────────────────────────────────────── */
const FEATURE_CHIPS = [
  'Text to image', 'Text to video', 'Image to video', 'Avatar to video', 'Multi-model workflow',
]

function Hero() {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      background: '#0B0F14', position: 'relative', overflow: 'hidden',
      padding: '120px 32px 80px',
    }}>
      {/* Cyan radial bloom */}
      <div style={{
        position: 'absolute', top: '20%', right: '10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,196,204,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(#273242 1px, transparent 1px), linear-gradient(90deg, #273242 1px, transparent 1px)',
        backgroundSize: '48px 48px', opacity: 0.04, pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        {/* Left */}
        <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <motion.h1 variants={fadeRise} style={{
            fontFamily: 'var(--font-syne)', fontSize: 'clamp(44px,5vw,72px)',
            fontWeight: 800, color: '#F4F8FB', lineHeight: 1.08, margin: 0,
          }}>
            Create images and videos{' '}
            <span className="text-gradient">at the speed of content</span>
          </motion.h1>

          <motion.p variants={fadeRise} style={{ color: '#A7B4C2', fontSize: 18, lineHeight: 1.6, margin: 0, maxWidth: 520 }}>
            Reelsy is an AI creative studio for generating images, videos, and avatar content
            with fast workflows, flexible models, and production-ready output.
          </motion.p>

          <motion.div variants={fadeRise} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/login" className="btn-primary">
              Start free <ArrowRight size={15} />
            </Link>
            <button className="btn-secondary">Watch demo</button>
          </motion.div>

          <motion.div variants={fadeRise} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FEATURE_CHIPS.map(chip => (
              <span key={chip} style={{
                background: '#141D28', border: '1px solid #273242',
                borderRadius: 99, padding: '5px 12px', fontSize: 12, color: '#A7B4C2',
              }}>{chip}</span>
            ))}
          </motion.div>
        </motion.div>

        {/* Right — decorative panel stack */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 } }}
          style={{ position: 'relative', height: 420 }}
        >
          {/* Main prompt panel */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            background: '#141D28', border: '1px solid #273242', borderRadius: 16, padding: 20,
          }}>
            <div style={{ fontSize: 11, color: '#738295', marginBottom: 10 }}>PROMPT</div>
            <div style={{ background: '#101722', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#A7B4C2', border: '1px solid #273242' }}>
              A cinematic close-up of a founder presenting to a camera, professional studio lighting…
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <span style={{ background: 'rgba(0,196,204,0.12)', color: '#00C4CC', borderRadius: 6, padding: '4px 10px', fontSize: 11 }}>GPT-5 Image</span>
              <span style={{ background: '#101722', border: '1px solid #273242', color: '#738295', borderRadius: 6, padding: '4px 10px', fontSize: 11 }}>1024×1024</span>
            </div>
          </div>

          {/* Image preview card */}
          <div style={{
            position: 'absolute', top: 130, right: -20,
            width: 180, background: '#141D28', border: '1px solid #273242',
            borderRadius: 12, overflow: 'hidden',
          }}>
            <div style={{ height: 100, background: 'linear-gradient(135deg, #141D28, #1a2535)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ImageIcon size={24} color="#273242" />
            </div>
            <div style={{ padding: '6px 10px', fontSize: 11, color: '#738295' }}>Generated · 1.2s</div>
          </div>

          {/* Model switcher */}
          <div style={{
            position: 'absolute', bottom: 90, left: -8,
            background: '#141D28', border: '1px solid #00C4CC',
            borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00C4CC', boxShadow: '0 0 6px #00C4CC' }} />
            <span style={{ fontSize: 12, color: '#F4F8FB' }}>Veo 3.1 Fast</span>
          </div>

          {/* Studio chip */}
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            background: '#141D28', border: '1px solid #273242',
            borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Mic size={13} color="#00C4CC" />
            <span style={{ fontSize: 12, color: '#A7B4C2' }}>/studio · avatar video</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ── Trust strip ─────────────────────────────────────────────── */
const TRUST_ITEMS = [
  'Built for creators', 'Designed for marketers', 'Flexible model access',
  'Avatar video workflows', 'Fast production-ready output',
]

function TrustStrip() {
  return (
    <div style={{
      background: '#101722', borderTop: '1px solid #273242', borderBottom: '1px solid #273242',
      padding: '14px 32px', overflow: 'hidden',
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

/* ── Capabilities grid ───────────────────────────────────────── */
const CAPABILITIES = [
  { icon: <ImageIcon size={20} />, label: 'Text to Image', desc: 'Generate production-ready images from any prompt with 15+ models.' },
  { icon: <Film size={20} />, label: 'Text to Video', desc: 'Turn descriptions into cinematic video clips in seconds.' },
  { icon: <Video size={20} />, label: 'Image to Video', desc: 'Animate any still into a smooth, high-quality video sequence.' },
  { icon: <Layers size={20} />, label: 'Multi-Model Workflow', desc: 'Switch between providers mid-project without leaving your workspace.' },
  { icon: <History size={20} />, label: 'Gallery & History', desc: 'Every output saved, searchable, and ready to remix or export.' },
  { icon: <Mic size={20} />, label: 'Studio Avatar-to-Video', desc: 'Upload a portrait, add a script, and render a talking avatar video.' },
]

function CapabilitiesGrid() {
  return (
    <section style={{ padding: '96px 32px', background: '#0B0F14' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <motion.h2
          variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(32px,4vw,48px)', fontWeight: 700, color: '#F4F8FB', textAlign: 'center', marginBottom: 48 }}
        >
          One studio, every format
        </motion.h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {CAPABILITIES.map(c => (
            <motion.div key={c.label}
              variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
              style={{
                background: '#141D28', border: '1px solid #273242', borderRadius: 14, padding: 24,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#00C4CC')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#273242')}
            >
              <div style={{ color: '#00C4CC', marginBottom: 12 }}>{c.icon}</div>
              <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 16, color: '#F4F8FB', marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 14, color: '#738295', lineHeight: 1.6 }}>{c.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Workflow ─────────────────────────────────────────────────── */
const WORKFLOW_STEPS = [
  { n: '01', label: 'Describe or upload', desc: 'Write a prompt or drop in a reference image.' },
  { n: '02', label: 'Generate with the right model', desc: 'Pick from 20+ image and video models.' },
  { n: '03', label: 'Refine and compare', desc: 'Run variants, adjust, and compare side by side.' },
  { n: '04', label: 'Export and publish', desc: 'Download in full quality or push to your pipeline.' },
]

function Workflow() {
  return (
    <section style={{ padding: '96px 32px', background: '#101722', borderTop: '1px solid #273242' }}>
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
                  background: 'linear-gradient(135deg,#00C4CC,#00F2FE)', display: 'flex', alignItems: 'center', justifyContent: 'center',
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

/* ── Studio spotlight ─────────────────────────────────────────── */
const STUDIO_BULLETS = [
  'Upload any front-facing portrait photo',
  'Write the exact script to be spoken',
  'Choose a cloned ElevenLabs voice',
  'Download a lip-synced talking video',
]

function StudioSpotlight() {
  return (
    <section style={{ padding: '96px 32px', background: '#0D1520', borderTop: '1px solid #273242' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <motion.h2 variants={fadeRise} style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, color: '#F4F8FB', margin: 0 }}>
            Turn your avatar into video
          </motion.h2>
          <motion.ul variants={stagger} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {STUDIO_BULLETS.map(b => (
              <motion.li key={b} variants={fadeRise} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: '#A7B4C2' }}>
                <CheckCircle size={16} color="#00C4CC" style={{ flexShrink: 0 }} />{b}
              </motion.li>
            ))}
          </motion.ul>
          <motion.div variants={fadeRise}>
            <Link href="/studio" className="btn-primary">Open Studio <ArrowRight size={15} /></Link>
          </motion.div>
        </motion.div>

        {/* Studio UI preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } }}
          viewport={{ once: true }}
          style={{
            background: '#141D28', border: '1px solid #273242', borderRadius: 16, padding: 24,
            boxShadow: '0 0 60px rgba(0,196,204,0.08)',
          }}
        >
          <div style={{ fontSize: 11, color: '#738295', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Reelsy Studio</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 40, marginBottom: 16 }}>
            {[14, 22, 32, 28, 40, 36, 28, 20, 32, 24, 18, 30, 24, 16].map((h, i) => (
              <div key={i} className="waveform-bar" style={{ height: h, animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
          <div style={{ background: '#101722', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#A7B4C2', marginBottom: 12, lineHeight: 1.5 }}>
            "Hello, I'm excited to share what we've been building…"
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ background: 'rgba(0,196,204,0.1)', color: '#00C4CC', borderRadius: 6, padding: '4px 10px', fontSize: 11 }}>Voice: Rachel</span>
            <span style={{ background: '#101722', border: '1px solid #273242', color: '#738295', borderRadius: 6, padding: '4px 10px', fontSize: 11 }}>9:16 Vertical</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ── Audience ─────────────────────────────────────────────────── */
const AUDIENCE = [
  { icon: <Zap size={22} />, label: 'Marketers', desc: 'Produce ad creatives, product visuals, and campaign content without a production team.' },
  { icon: <Users size={22} />, label: 'Creators', desc: 'Scale your content output without compromising your visual quality.' },
  { icon: <Building2 size={22} />, label: 'Agencies', desc: 'Run multiple brands from a single workspace with full output history.' },
  { icon: <LayoutGrid size={22} />, label: 'Founders', desc: 'Create investor decks, demos, and launch visuals on a startup timeline.' },
]

function AudienceSection() {
  return (
    <section style={{ padding: '96px 32px', background: '#101722', borderTop: '1px solid #273242' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <motion.h2
          variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, color: '#F4F8FB', textAlign: 'center', marginBottom: 12 }}
        >
          Built for modern content teams
        </motion.h2>
        <p style={{ textAlign: 'center', color: '#738295', marginBottom: 48, fontSize: 16 }}>
          Whether you create alone or run a full team, Reelsy fits your workflow.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
          {AUDIENCE.map(a => (
            <motion.div key={a.label}
              variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
              style={{ background: '#141D28', border: '1px solid #273242', borderRadius: 14, padding: 24 }}>
              <div style={{ color: '#00C4CC', marginBottom: 12 }}>{a.icon}</div>
              <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 16, color: '#F4F8FB', marginBottom: 8 }}>{a.label}</div>
              <div style={{ fontSize: 14, color: '#738295', lineHeight: 1.6 }}>{a.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Why Reelsy ───────────────────────────────────────────────── */
const COMPARE_ROWS = [
  { label: 'Image generation',        traditional: '✓', single: '✓', reelsy: '✓' },
  { label: 'Video generation',        traditional: '—', single: '✓', reelsy: '✓' },
  { label: 'Avatar talking video',    traditional: '—', single: '—', reelsy: '✓' },
  { label: 'Multi-model switching',   traditional: '—', single: '—', reelsy: '✓' },
  { label: 'Output history & search', traditional: '—', single: '—', reelsy: '✓' },
  { label: 'Single workspace',        traditional: '—', single: '—', reelsy: '✓' },
]

function WhyReelsy() {
  return (
    <section style={{ padding: '96px 32px', background: '#0B0F14', borderTop: '1px solid #273242' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <motion.h2
          variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, color: '#F4F8FB', textAlign: 'center', marginBottom: 48 }}
        >
          Why Reelsy
        </motion.h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '14px 20px', textAlign: 'left', color: '#738295', fontSize: 13, fontWeight: 500, borderBottom: '1px solid #273242' }}>Capability</th>
              <th style={{ padding: '14px 20px', textAlign: 'center', color: '#738295', fontSize: 13, fontWeight: 500, borderBottom: '1px solid #273242' }}>Traditional stack</th>
              <th style={{ padding: '14px 20px', textAlign: 'center', color: '#738295', fontSize: 13, fontWeight: 500, borderBottom: '1px solid #273242' }}>Single-purpose tool</th>
              <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: 13, fontWeight: 700, borderBottom: '2px solid #00C4CC', color: '#00C4CC' }}>Reelsy</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((r, i) => (
              <tr key={r.label} style={{ borderBottom: '1px solid #273242', background: i % 2 === 0 ? 'transparent' : 'rgba(20,29,40,0.4)' }}>
                <td style={{ padding: '14px 20px', fontSize: 14, color: '#A7B4C2' }}>{r.label}</td>
                <td style={{ padding: '14px 20px', textAlign: 'center', fontSize: 14, color: '#738295' }}>{r.traditional}</td>
                <td style={{ padding: '14px 20px', textAlign: 'center', fontSize: 14, color: '#738295' }}>{r.single}</td>
                <td style={{ padding: '14px 20px', textAlign: 'center', fontSize: 14, color: '#00C4CC', fontWeight: 600 }}>{r.reelsy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* ── Pricing teaser ───────────────────────────────────────────── */
const PLANS = [
  {
    name: 'Starter', price: 'Free', desc: 'For individuals exploring AI content creation.',
    features: ['50 image credits/mo', '10 video credits/mo', '1 workspace', 'Community support'],
    highlight: false,
  },
  {
    name: 'Pro', price: '$29', period: '/mo', desc: 'For creators and marketers shipping at scale.',
    features: ['500 image credits/mo', '100 video credits/mo', 'Studio access', 'Priority generation'],
    highlight: true,
  },
  {
    name: 'Teams', price: '$99', period: '/mo', desc: 'For agencies and content teams with volume needs.',
    features: ['Unlimited images', '500 video credits/mo', '5 seats', 'API access'],
    highlight: false,
  },
]

function PricingTeaser() {
  return (
    <section style={{ padding: '96px 32px', background: '#101722', borderTop: '1px solid #273242' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <motion.h2
          variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, color: '#F4F8FB', textAlign: 'center', marginBottom: 12 }}
        >
          Simple, transparent pricing
        </motion.h2>
        <p style={{ textAlign: 'center', color: '#738295', marginBottom: 48, fontSize: 16 }}>Start free, scale as you grow.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          {PLANS.map(p => (
            <motion.div key={p.name}
              variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
              style={{
                background: '#141D28',
                border: p.highlight ? '1px solid #00C4CC' : '1px solid #273242',
                borderRadius: 16, padding: 28,
                boxShadow: p.highlight ? '0 0 40px rgba(0,196,204,0.12)' : 'none',
              }}
            >
              {p.highlight && <div style={{ color: '#00C4CC', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Most popular</div>}
              <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 20, color: '#F4F8FB', marginBottom: 4 }}>{p.name}</div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 32, color: '#F4F8FB' }}>{p.price}</span>
                {'period' in p && p.period && <span style={{ color: '#738295', fontSize: 14 }}>{p.period}</span>}
              </div>
              <p style={{ fontSize: 14, color: '#738295', marginBottom: 20, lineHeight: 1.5 }}>{p.desc}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {p.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#A7B4C2' }}>
                    <CheckCircle size={14} color="#00C4CC" style={{ flexShrink: 0 }} />{f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className={p.highlight ? 'btn-primary' : 'btn-secondary'} style={{ display: 'block', textAlign: 'center' }}>
                {p.name === 'Starter' ? 'Start free' : 'Get started'}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Final CTA ────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section style={{ padding: '96px 32px', background: '#0B0F14', borderTop: '1px solid #273242', textAlign: 'center' }}>
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
        style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
        <motion.h2 variants={fadeRise} style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, color: '#F4F8FB', margin: 0 }}>
          Start your next visual in Reelsy
        </motion.h2>
        <motion.p variants={fadeRise} style={{ color: '#738295', fontSize: 17, lineHeight: 1.6, margin: 0 }}>
          No design skills required. No credit card to start.
        </motion.p>
        <motion.div variants={fadeRise} style={{ display: 'flex', gap: 12 }}>
          <Link href="/login" className="btn-primary">Start free <ArrowRight size={15} /></Link>
          <button className="btn-secondary">Book a demo</button>
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ── Footer ───────────────────────────────────────────────────── */
const FOOTER_COLS = [
  { heading: 'Product', links: ['Generate', 'Video', 'Gallery', 'History'] },
  { heading: 'Studio', links: ['Avatar video', 'Voice sync', 'Templates', 'Pricing'] },
  { heading: 'Resources', links: ['Docs', 'API', 'Examples', 'Blog'] },
  { heading: 'Company', links: ['Enterprise', 'Legal', 'Privacy', 'Terms'] },
]

function Footer() {
  return (
    <footer style={{ background: '#101722', borderTop: '1px solid #273242', padding: '64px 32px 32px' }}>
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
              <div style={{ fontSize: 12, fontWeight: 600, color: '#A7B4C2', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>{col.heading}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(l => (
                  <li key={l}>
                    <Link href="#" style={{ fontSize: 13, color: '#738295', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#A7B4C2')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#738295')}>
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #273242', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#738295' }}>© 2026 Reelsy. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Twitter', 'LinkedIn', 'YouTube'].map(s => (
              <Link key={s} href="#" style={{ fontSize: 12, color: '#738295', textDecoration: 'none' }}>{s}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ── Main export ──────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <CapabilitiesGrid />
        <Workflow />
        <StudioSpotlight />
        <AudienceSection />
        <WhyReelsy />
        <PricingTeaser />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
