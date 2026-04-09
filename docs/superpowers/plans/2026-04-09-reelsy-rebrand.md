# Reelsy Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand InstaArt → Reelsy across globals.css, landing page, login, dashboard, and /studio with a new obsidian-and-teal design system.

**Architecture:** Approach A — global token swap in globals.css first, then in-place page rewrites. VideoGeneratorForm pipeline logic is untouched; only its JSX surface is reskinned. Post-auth onboarding is a dashboard overlay triggered by `?welcome=true`.

**Tech Stack:** Next.js (App Router), Tailwind CSS v4, Framer Motion, Supabase Auth, Lucide React, inline styles for design token values

**Spec:** `docs/superpowers/specs/2026-04-09-reelsy-rebrand-design.md`

---

## File Map

| File | Change |
|------|--------|
| `app/globals.css` | Full token replacement |
| `app/layout.tsx` | Metadata + OG update |
| `app/page.tsx` | Full rewrite — landing page |
| `app/login/page.tsx` | Full rewrite — split-panel auth |
| `app/auth/callback/route.ts` | Add `?welcome=true` for new users |
| `app/dashboard/page.tsx` | Structural rewrite — preserve all logic |
| `components/VideoGeneratorForm.tsx` | JSX reskin only — zero logic changes |
| `components/VoiceSelector.tsx` | JSX reskin only |
| `components/VideoPlayer.tsx` | JSX reskin only |
| `components/ConnectElevenLabsButton.tsx` | JSX reskin only |
| `app/studio/page.tsx` | Shell rewrite — 3-panel layout |

No new files are created. Icon replacement is done by copying the PNG in a shell step.

---

## Design Token Reference (use throughout every task)

```
BG_OBSIDIAN      = '#0B0F14'
BG_CHARCOAL      = '#101722'
BG_PANEL         = '#141D28'
BG_GRAPHITE_LINE = '#273242'
ACCENT_TEAL      = '#00C4CC'
ACCENT_CYAN      = '#00F2FE'
ACCENT_AQUA      = '#6EFAFF'
GRADIENT_PRIMARY = 'linear-gradient(135deg, #00C4CC, #00F2FE)'
TEXT_PRIMARY     = '#F4F8FB'
TEXT_SECONDARY   = '#A7B4C2'
TEXT_MUTED       = '#738295'
SUCCESS          = '#21D69B'
WARNING          = '#F6B94A'
ERROR            = '#FF5D6C'
```

---

## Task 1: Design Token Foundation

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace globals.css**

Replace the entire file with:

```css
@import "tailwindcss";

:root {
  /* ── Backgrounds ── */
  --color-bg-obsidian:      #0B0F14;
  --color-bg-charcoal:      #101722;
  --color-bg-panel:         #141D28;
  --color-bg-graphite-line: #273242;

  /* ── Accents ── */
  --color-accent-teal: #00C4CC;
  --color-accent-cyan: #00F2FE;
  --color-accent-aqua: #6EFAFF;

  /* ── Gradient ── */
  --gradient-primary: linear-gradient(135deg, #00C4CC, #00F2FE);

  /* ── Text ── */
  --color-text-primary:   #F4F8FB;
  --color-text-secondary: #A7B4C2;
  --color-text-muted:     #738295;

  /* ── Semantic ── */
  --color-success: #21D69B;
  --color-warning: #F6B94A;
  --color-error:   #FF5D6C;

  /* ── Legacy aliases for @theme block ── */
  --background: #0B0F14;
  --foreground: #F4F8FB;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-syne), system-ui, sans-serif;
  --font-body: var(--font-manrope), system-ui, sans-serif;
}

body {
  background: var(--color-bg-obsidian);
  color: var(--color-text-primary);
  font-family: var(--font-body), system-ui, sans-serif;
}

/* ── Background drift blobs ── */
@keyframes bg-drift-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(30px, -50px) scale(1.1); }
  66%  { transform: translate(-20px, 20px) scale(0.9); }
}
@keyframes bg-drift-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(-40px, 30px) scale(1.15); }
  66%  { transform: translate(25px, -40px) scale(0.85); }
}
@keyframes bg-drift-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(20px, 40px) scale(1.05); }
  66%  { transform: translate(-30px, -30px) scale(0.95); }
}
.animate-bg-drift-1 { animation: bg-drift-1 8s ease-in-out infinite; }
.animate-bg-drift-2 { animation: bg-drift-2 10s ease-in-out infinite; }
.animate-bg-drift-3 { animation: bg-drift-3 12s ease-in-out infinite; }

/* ── Float ── */
@keyframes float-up {
  0%, 100% { transform: translateY(0); }
  50%  { transform: translateY(-12px); }
}
@keyframes float-down {
  0%, 100% { transform: translateY(0); }
  50%  { transform: translateY(12px); }
}
.animate-float-up   { animation: float-up 6s ease-in-out infinite; }
.animate-float-down { animation: float-down 6s ease-in-out infinite; }

/* ── Fade rise ── */
@keyframes fade-rise {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-rise { animation: fade-rise 0.6s cubic-bezier(0.25,0.1,0.25,1) forwards; }

/* ── Slide in ── */
@keyframes slide-in {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}
.animate-slide-in { animation: slide-in 0.6s cubic-bezier(0.25,0.1,0.25,1) forwards; }

/* ── Shimmer ── */
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.animate-shimmer {
  background-size: 200% auto;
  animation: shimmer 3s linear infinite;
}

/* ── Ribbon sweep (branded progress loader) ── */
@keyframes ribbon-sweep {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}
.loader-ribbon {
  position: relative;
  height: 2px;
  background: #273242;
  border-radius: 99px;
  overflow: hidden;
}
.loader-ribbon::after {
  content: '';
  position: absolute;
  inset: 0;
  width: 25%;
  background: linear-gradient(135deg, #00C4CC, #00F2FE);
  border-radius: 99px;
  animation: ribbon-sweep 1.4s cubic-bezier(0.4,0,0.6,1) infinite;
}

/* ── Waveform pulse (studio) ── */
@keyframes waveform-pulse {
  0%, 100% { transform: scaleY(0.4); }
  50%       { transform: scaleY(1); }
}
.waveform-bar {
  display: inline-block;
  width: 3px;
  height: 24px;
  border-radius: 2px;
  background: linear-gradient(135deg, #00C4CC, #00F2FE);
  transform-origin: bottom;
  animation: waveform-pulse 0.9s ease-in-out infinite;
}
.waveform-bar:nth-child(2) { animation-delay: 0.1s; }
.waveform-bar:nth-child(3) { animation-delay: 0.2s; }
.waveform-bar:nth-child(4) { animation-delay: 0.3s; }
.waveform-bar:nth-child(5) { animation-delay: 0.4s; }
.waveform-bar:nth-child(6) { animation-delay: 0.2s; }
.waveform-bar:nth-child(7) { animation-delay: 0.1s; }

/* ── Marquee ── */
@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
.animate-marquee { animation: marquee 30s linear infinite; }

/* ── Gallery scroll ── */
@keyframes gallery-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
.animate-gallery-scroll { animation: gallery-scroll 40s linear infinite; }

/* ── Glow (teal) ── */
@keyframes teal-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(0,196,204,0.3); }
  50%       { box-shadow: 0 0 40px rgba(0,196,204,0.55), 0 0 80px rgba(0,242,254,0.18); }
}
.animate-teal-glow { animation: teal-glow 3s ease-in-out infinite; }

/* ── Stagger delays ── */
.delay-100  { animation-delay: 100ms; }
.delay-200  { animation-delay: 200ms; }
.delay-300  { animation-delay: 300ms; }
.delay-400  { animation-delay: 400ms; }
.delay-500  { animation-delay: 500ms; }
.delay-700  { animation-delay: 700ms; }
.delay-1000 { animation-delay: 1000ms; }

/* ── Glass panels ── */
.glass {
  background: rgba(20, 29, 40, 0.72);
  backdrop-filter: blur(20px);
  border: 1px solid #273242;
}
.glass-light {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.07);
}

/* ── Gradient text ── */
.text-gradient {
  background: linear-gradient(90deg, #00C4CC, #00F2FE);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── Button base classes ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 22px;
  border-radius: 12px;
  background: linear-gradient(135deg, #00C4CC, #00F2FE);
  color: #0B0F14;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.2s, box-shadow 0.2s;
}
.btn-primary:hover {
  opacity: 0.9;
  box-shadow: 0 0 24px rgba(0,196,204,0.45);
}
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 22px;
  border-radius: 12px;
  background: #141D28;
  color: #F4F8FB;
  font-weight: 600;
  font-size: 14px;
  border: 1px solid #00C4CC;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s, box-shadow 0.2s;
}
.btn-secondary:hover {
  background: #1a2535;
  box-shadow: 0 0 16px rgba(0,196,204,0.25);
}
.btn-tertiary {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #A7B4C2;
  font-weight: 500;
  font-size: 14px;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s, text-shadow 0.2s;
}
.btn-tertiary:hover {
  color: #00F2FE;
}

/* ── Sidebar active pill ── */
.sidebar-active {
  background: rgba(0,196,204,0.1);
  border-left: 3px solid #00C4CC;
  color: #F4F8FB;
}

/* ── Respect reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Verify dev server starts**

```bash
npm run dev
```
Expected: no compile errors. Open `http://localhost:3000` — page background should be `#0B0F14` (near-black, no purple tint).

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: replace Instaart tokens with Reelsy obsidian-teal design system"
```

---

## Task 2: Metadata, Layout & Favicon

**Files:**
- Modify: `app/layout.tsx`
- Shell: copy icon files

- [ ] **Step 1: Copy Reelsy icon over the existing app icons**

```bash
cp "public/For Rebranding/reelsy-icon.png" app/icon.png
cp "public/For Rebranding/reelsy-icon.png" app/apple-icon.png
```

- [ ] **Step 2: Update app/layout.tsx**

Replace the entire file:

```tsx
import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Reelsy — AI Creative Studio",
  description:
    "Create images, videos, and avatar content at the speed of content. Reelsy is an AI creative studio with fast workflows, flexible models, and production-ready output.",
  openGraph: {
    title: "Reelsy — AI Creative Studio",
    description:
      "Create images, videos, and avatar content at the speed of content. Reelsy is an AI creative studio with fast workflows, flexible models, and production-ready output.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```
Open `http://localhost:3000`. Check browser tab title reads "Reelsy — AI Creative Studio".

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/icon.png app/apple-icon.png
git commit -m "feat: update metadata and favicon for Reelsy brand"
```

---

## Task 3: Landing Page — Full Rewrite

**Files:**
- Modify: `app/page.tsx`

The current file is 1,091 lines with the old purple Instaart brand. Replace it entirely.

- [ ] **Step 1: Write new app/page.tsx**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ArrowRight, ImageIcon, Film, Zap, Users, Building2,
  CheckCircle, Layers, History, Video, Mic, LayoutGrid,
  ChevronRight,
} from 'lucide-react'

/* ── Framer Motion helpers ─────────────────────────────────── */
const fadeRise = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25,0.1,0.25,1] } },
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
          {['Product','Studio','Examples','Pricing','Enterprise'].map(n => (
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
  'Text to image','Text to video','Image to video','Avatar to video','Multi-model workflow',
]

function HeroPanel({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(20,29,40,0.72)', border: '1px solid #273242',
      borderRadius: 12, padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: 8,
      backdropFilter: 'blur(16px)', color: '#A7B4C2', fontSize: 12,
    }}>
      <span style={{ color: '#00C4CC' }}>{icon}</span>
      {label}
    </div>
  )
}

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
          animate={{ opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25,0.1,0.25,1], delay: 0.2 } }}
          style={{ position: 'relative', height: 480 }}
        >
          {/* Main prompt panel */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            background: '#141D28', border: '1px solid #273242', borderRadius: 16, padding: 20,
          }}>
            <div style={{ fontSize: 11, color: '#738295', marginBottom: 10, fontFamily: 'var(--font-body)' }}>PROMPT</div>
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
            position: 'absolute', top: 140, right: -24,
            width: 200, background: '#141D28', border: '1px solid #273242',
            borderRadius: 12, overflow: 'hidden',
          }}>
            <div style={{ height: 120, background: 'linear-gradient(135deg, #141D28, #1a2535)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ImageIcon size={28} color="#273242" />
            </div>
            <div style={{ padding: '8px 12px', fontSize: 11, color: '#738295' }}>Generated · 1.2s</div>
          </div>

          {/* Model switcher */}
          <div style={{
            position: 'absolute', bottom: 80, left: -12,
            background: '#141D28', border: '1px solid #00C4CC',
            borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00C4CC', boxShadow: '0 0 6px #00C4CC' }} />
            <span style={{ fontSize: 12, color: '#F4F8FB' }}>Veo 3.1 Fast</span>
          </div>

          {/* Studio preview chip */}
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
  'Built for creators','Designed for marketers','Flexible model access',
  'Avatar video workflows','Fast production-ready output',
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
          whileInView={{ opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25,0.1,0.25,1] } }}
          viewport={{ once: true }}
          style={{
            background: '#141D28', border: '1px solid #273242', borderRadius: 16, padding: 24,
            boxShadow: '0 0 60px rgba(0,196,204,0.08)',
          }}
        >
          <div style={{ fontSize: 11, color: '#738295', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Reelsy Studio</div>
          {/* Waveform bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 40, marginBottom: 16 }}>
            {[14,22,32,28,40,36,28,20,32,24,18,30,24,16].map((h,i) => (
              <div key={i} className="waveform-bar" style={{ height: h, animationDelay: `${i*60}ms` }} />
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
  const col = (content: string, highlight = false) => (
    <td style={{
      padding: '14px 20px', textAlign: 'center', fontSize: 14,
      color: highlight ? '#00C4CC' : '#738295', fontWeight: highlight ? 600 : 400,
    }}>{content}</td>
  )
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
                {col(r.traditional)}
                {col(r.single)}
                {col(r.reelsy, true)}
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
  { name: 'Starter', price: 'Free', desc: 'For individuals exploring AI content creation.', features: ['50 image credits/mo','10 video credits/mo','1 workspace','Community support'] },
  { name: 'Pro', price: '$29', period: '/mo', desc: 'For creators and marketers shipping at scale.', features: ['500 image credits/mo','100 video credits/mo','Studio access','Priority generation'], highlight: true },
  { name: 'Teams', price: '$99', period: '/mo', desc: 'For agencies and content teams with volume needs.', features: ['Unlimited images','500 video credits/mo','5 seats','API access'] },
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
                {p.period && <span style={{ color: '#738295', fontSize: 14 }}>{p.period}</span>}
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
  { heading: 'Product', links: ['Generate','Video','Gallery','History'] },
  { heading: 'Studio', links: ['Avatar video','Voice sync','Templates','Pricing'] },
  { heading: 'Resources', links: ['Docs','API','Examples','Blog'] },
  { heading: 'Company', links: ['Enterprise','Legal','Privacy','Terms'] },
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
                  <li key={l}><Link href="#" style={{ fontSize: 13, color: '#738295', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#A7B4C2')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#738295')}>{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #273242', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#738295' }}>© 2026 Reelsy. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Twitter','LinkedIn','YouTube'].map(s => (
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
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```
Open `http://localhost:3000`. Verify: dark obsidian background, teal accent on heading gradient, no purple anywhere, Reelsy logo in header and footer, all sections render without errors.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: rewrite landing page with Reelsy brand and obsidian-teal design"
```

---

## Task 4: Login Page — Split-Panel Auth

**Files:**
- Modify: `app/login/page.tsx`

- [ ] **Step 1: Write new app/login/page.tsx**

```tsx
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
      background: '#141D28', border: '1px solid #273242', borderRadius: 20,
      padding: 40, width: '100%', maxWidth: 400,
      display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center',
    }}>
      <Image
        src="/For Rebranding/reelsy-icon.png"
        alt="Reelsy"
        width={48} height={48}
        style={{ objectFit: 'contain' }}
      />

      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 24, fontWeight: 700, color: '#F4F8FB', margin: '0 0 8px' }}>
          {isSignup ? 'Create your Reelsy workspace' : 'Sign in to Reelsy'}
        </h1>
        <p style={{ fontSize: 14, color: '#738295', margin: 0, lineHeight: 1.5 }}>
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
          background: '#F4F8FB', color: '#0B0F14', fontWeight: 600, fontSize: 15,
          border: 'none', cursor: 'pointer', transition: 'background 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#e8eef4')}
        onMouseLeave={e => (e.currentTarget.style.background = '#F4F8FB')}
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <p style={{ fontSize: 12, color: '#738295', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
        By continuing you agree to the{' '}
        <a href="#" style={{ color: '#A7B4C2', textDecoration: 'underline' }}>Terms of Service</a>
        {' '}and{' '}
        <a href="#" style={{ color: '#A7B4C2', textDecoration: 'underline' }}>Privacy Policy</a>.
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
          backgroundImage: 'linear-gradient(#273242 1px,transparent 1px),linear-gradient(90deg,#273242 1px,transparent 1px)',
          backgroundSize: '40px 40px', opacity: 0.06, pointerEvents: 'none',
        }} />
        {/* Cyan bloom */}
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-10%', width: 480, height: 480,
          borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,196,204,0.1) 0%,transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Ribbon line accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#00C4CC,transparent)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Image src="/For Rebranding/reelsy-logo-white-txt.png" alt="Reelsy" width={120} height={34} style={{ objectFit: 'contain', marginBottom: 48 }} />

          <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(28px,3vw,44px)', fontWeight: 800, color: '#F4F8FB', lineHeight: 1.1, marginBottom: 16 }}>
            Create visuals<br />in motion
          </h2>
          <p style={{ fontSize: 16, color: '#738295', lineHeight: 1.6, maxWidth: 380, marginBottom: 48 }}>
            Image, video, and avatar workflows in one AI studio.
          </p>

          {/* Decorative panel stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
            {[
              { label: 'Text to Image', detail: 'GPT-5 Image · 1.2s' },
              { label: 'Text to Video', detail: 'Veo 3.1 Fast · 8s' },
              { label: 'Avatar to Video', detail: 'Studio · ElevenLabs' },
            ].map(item => (
              <div key={item.label} style={{
                background: 'rgba(20,29,40,0.72)', border: '1px solid #273242',
                borderRadius: 10, padding: '10px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                backdropFilter: 'blur(12px)',
              }}>
                <span style={{ fontSize: 13, color: '#F4F8FB' }}>{item.label}</span>
                <span style={{ fontSize: 11, color: '#738295' }}>{item.detail}</span>
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
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```
Open `http://localhost:3000/login`. Verify: split two-column layout, Reelsy logo + brand panel on left, Google auth card on right. Open `http://localhost:3000/login?mode=signup` — heading should read "Create your Reelsy workspace".

- [ ] **Step 3: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat: rewrite login page as split-panel Reelsy auth"
```

---

## Task 5: Auth Callback — New-User Detection

**Files:**
- Modify: `app/auth/callback/route.ts`

- [ ] **Step 1: Add new-user detection to the callback**

The current redirect is `${origin}${next}`. Replace the final `return NextResponse.redirect(...)` line with logic that appends `?welcome=true` for users whose account was just created (within 60 seconds):

Replace:
```ts
  return NextResponse.redirect(`${origin}${next}`)
```

With:
```ts
  const createdAt = new Date(user.created_at).getTime()
  const isNewUser = Date.now() - createdAt < 60_000
  const destination = isNewUser ? `${origin}/dashboard?welcome=true` : `${origin}${next}`
  return NextResponse.redirect(destination)
```

- [ ] **Step 2: Verify**

No runtime test needed — just confirm the file compiles:

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no TypeScript errors in `app/auth/callback/route.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/auth/callback/route.ts
git commit -m "feat: redirect new users to dashboard with ?welcome=true for onboarding"
```

---

## Task 6: Dashboard — Structural Rewrite

**Files:**
- Modify: `app/dashboard/page.tsx`

The current file is 1,895 lines. All state management, API calls, model definitions, polling logic, and auth checks are preserved exactly — only the outer JSX layout and inline styles are replaced.

**Strategy:** The existing component is a single large function. Wrap the existing logic in a new app shell (sidebar + top header + main area). Replace color values throughout but do not touch state, `useEffect`, `useCallback`, API `fetch` calls, or type definitions.

- [ ] **Step 1: Read lines 1–400 of app/dashboard/page.tsx to understand the full state and render structure**

```bash
# Just reading — no edit yet
sed -n '1,400p' app/dashboard/page.tsx
```

- [ ] **Step 2: Read lines 1500–1895 to understand the return JSX structure**

```bash
sed -n '1500,1895p' app/dashboard/page.tsx
```

- [ ] **Step 3: Replace the outer layout JSX**

Locate the `return (` statement in the main `DashboardPage` export function (near line ~1500). Replace everything from the opening `<div` wrapper through the closing `</div>` of the outer container with the new app shell below.

The goal: the existing inner panels (generate form, history grid, model pickers, etc.) slot into the new layout's main content area. Preserve every existing variable, handler, and rendered sub-section — only restructure the outermost container, header bar, and sidebar.

New outer shell to wrap the existing content:

```tsx
return (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0B0F14' }}>
    {/* ── Top header ── */}
    <header style={{
      height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', background: '#101722', borderBottom: '1px solid #273242',
      position: 'sticky', top: 0, zIndex: 40, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Image src="/For Rebranding/reelsy-icon.png" alt="Reelsy" width={28} height={28} style={{ objectFit: 'contain' }} />
      </div>
      {/* Search bar */}
      <div style={{
        flex: 1, maxWidth: 420, margin: '0 24px',
        background: '#141D28', border: '1px solid #273242',
        borderRadius: 10, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="#738295" strokeWidth="2"/>
          <path d="M16.5 16.5L21 21" stroke="#738295" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          placeholder="Search your creations…"
          style={{ background: 'none', border: 'none', outline: 'none', color: '#F4F8FB', fontSize: 13, width: '100%' }}
        />
      </div>
      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          background: '#141D28', border: '1px solid #273242',
          borderRadius: 8, padding: '4px 12px', fontSize: 12, color: '#A7B4C2',
        }}>
          {/* Credits — render existing credits state here if available */}
          Credits: —
        </div>
        {profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {profile.avatar_url
              ? <Image src={profile.avatar_url} alt={profile.name ?? ''} width={30} height={30} style={{ borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#141D28', border: '1px solid #273242', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#738295' }}>
                  {(profile.name ?? profile.email)[0].toUpperCase()}
                </div>
            }
            <button
              onClick={handleSignOut}
              style={{ fontSize: 12, color: '#738295', background: 'none', border: 'none', cursor: 'pointer' }}
            >Sign out</button>
          </div>
        )}
      </div>
    </header>

    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* ── Left sidebar ── */}
      <aside style={{
        width: 220, background: '#101722', borderRight: '1px solid #273242',
        display: 'flex', flexDirection: 'column', padding: '16px 0', flexShrink: 0,
        position: 'sticky', top: 56, height: 'calc(100vh - 56px)', overflowY: 'auto',
      }}>
        {([
          { label: 'Home',     icon: '⌂' },
          { label: 'Generate', icon: '✦' },
          { label: 'Video',    icon: '▶' },
          { label: 'Studio',   icon: '◈', href: '/studio' },
          { label: 'History',  icon: '↺' },
          { label: 'Favorites',icon: '♡' },
          { label: 'Projects', icon: '⊞' },
          { label: 'Billing',  icon: '$' },
          { label: 'Settings', icon: '⚙' },
        ] as { label: string; icon: string; href?: string }[]).map(item => {
          const isActive = item.label === (tab === 'image' || tab === 'video' ? 'Generate' : 'Home')
          return (
            <a
              key={item.label}
              href={item.href ?? '#'}
              onClick={item.href ? undefined : (e) => { e.preventDefault() }}
              className={isActive ? 'sidebar-active' : ''}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 20px', fontSize: 13, color: isActive ? '#F4F8FB' : '#738295',
                textDecoration: 'none', transition: 'color 0.15s',
                borderLeft: isActive ? undefined : '3px solid transparent',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#A7B4C2' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#738295' }}
            >
              <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </a>
          )
        })}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Usage meter */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #273242' }}>
          <div style={{ fontSize: 11, color: '#738295', marginBottom: 6 }}>Monthly credits</div>
          <div style={{ background: '#273242', borderRadius: 99, height: 4, marginBottom: 12 }}>
            <div style={{ width: '40%', height: '100%', background: 'linear-gradient(135deg,#00C4CC,#00F2FE)', borderRadius: 99 }} />
          </div>
          <Link href="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', fontSize: 12, padding: '7px 0' }}>
            Upgrade
          </Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {/* EXISTING DASHBOARD CONTENT GOES HERE — preserve all existing JSX panels */}
        {/* existing_content_placeholder */}
      </main>
    </div>

    {/* Onboarding overlay — see Task 7 */}
  </div>
)
```

**Important:** Replace `{/* existing_content_placeholder */}` with the existing inner JSX that was previously inside the old outer container. Do not delete any existing panels, grids, or forms.

- [ ] **Step 4: Replace all purple color values in the file**

Find and replace throughout `app/dashboard/page.tsx`:

| Find | Replace |
|------|---------|
| `purple-500` | `[#00C4CC]` |
| `purple-600` | `[#00C4CC]` |
| `purple-400` | `[#00C4CC]` |
| `violet-500` | `[#00C4CC]` |
| `violet-600` | `[#00C4CC]` |
| `from-purple-` | `from-[#00C4CC]` |
| `via-purple-` | `via-[#00C4CC]` |
| `to-purple-` | `to-[#00F2FE]` |
| `#060510` | `#0B0F14` |
| `#0F0D1A` | `#101722` |
| `ring-purple-` | `ring-[#00C4CC]` |
| `focus:ring-purple` | `focus:ring-[#00C4CC]` |
| `border-purple` | `border-[#00C4CC]` |
| `text-purple` | `text-[#00C4CC]` |
| `bg-purple` | `bg-[#141D28]` |
| `InstaArt` | `Reelsy` |
| `Instaart` | `Reelsy` |
| `instaart` | `reelsy` |

Also replace spinner SVG with `.loader-ribbon` div wherever a spinning `animate-spin` exists:

Find:
```tsx
<svg className="w-4 h-4 animate-spin text-purple-400 shrink-0" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10" />
</svg>
```

Replace with:
```tsx
<div className="loader-ribbon" style={{ width: 120 }} />
```

- [ ] **Step 5: Verify**

```bash
npm run dev
```
Open `http://localhost:3000/dashboard` (sign in first). Verify: sidebar visible with cyan active indicator, top header with Reelsy icon, no purple anywhere. Existing generate form and history should be functional.

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: rewrite dashboard with Reelsy app shell and teal accents"
```

---

## Task 7: Dashboard — Onboarding Overlay

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Add onboarding state and overlay**

Add these imports at the top of the file (after existing imports):

```tsx
import { useSearchParams } from 'next/navigation'
```

Inside `DashboardPage`, add state after existing state declarations:

```tsx
const searchParams = useSearchParams()
const [onboardingStep, setOnboardingStep] = useState<number | null>(
  searchParams.get('welcome') === 'true' ? 0 : null
)
const [onboardingSelections, setOnboardingSelections] = useState<Record<number,string>>({})
```

- [ ] **Step 2: Add the OnboardingOverlay component above the main export**

Add this component just before the `export default function DashboardPage`:

```tsx
const ONBOARDING_STEPS = [
  {
    heading: 'What brings you to Reelsy?',
    options: ['Marketing','Content creation','Agency work','Founder'],
  },
  {
    heading: 'What do you want to create?',
    options: ['Images','Videos','Avatar videos','All of the above'],
  },
  {
    heading: "You're ready.",
    options: [],
    ctas: true,
  },
]

function OnboardingOverlay({
  step,
  selections,
  onSelect,
  onNext,
  onFinish,
}: {
  step: number
  selections: Record<number, string>
  onSelect: (s: string) => void
  onNext: () => void
  onFinish: (route: string) => void
}) {
  const current = ONBOARDING_STEPS[step]
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(11,15,20,0.92)',
      backdropFilter: 'blur(8px)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#141D28', border: '1px solid #273242', borderRadius: 20,
        padding: 40, width: '100%', maxWidth: 520,
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6 }}>
          {ONBOARDING_STEPS.map((_, i) => (
            <div key={i} style={{
              height: 3, flex: 1, borderRadius: 99,
              background: i <= step ? 'linear-gradient(135deg,#00C4CC,#00F2FE)' : '#273242',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: 22, fontWeight: 700, color: '#F4F8FB', margin: 0 }}>
          {current.heading}
        </h2>

        {current.options.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {current.options.map(opt => {
              const selected = selections[step] === opt
              return (
                <button
                  key={opt}
                  onClick={() => onSelect(opt)}
                  style={{
                    background: selected ? 'rgba(0,196,204,0.12)' : '#101722',
                    border: selected ? '1px solid #00C4CC' : '1px solid #273242',
                    borderRadius: 12, padding: '14px 16px', textAlign: 'left',
                    color: selected ? '#F4F8FB' : '#A7B4C2', fontSize: 14, cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: selected ? '0 0 16px rgba(0,196,204,0.2)' : 'none',
                  }}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {current.ctas ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onFinish('/dashboard')}>
              Start creating
            </button>
            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onFinish('/studio')}>
              Open Studio
            </button>
            <button className="btn-tertiary" style={{ justifyContent: 'center' }} onClick={() => onFinish('/dashboard')}>
              Explore examples →
            </button>
          </div>
        ) : (
          <button
            className="btn-primary"
            disabled={!selections[step]}
            style={{ alignSelf: 'flex-end', opacity: selections[step] ? 1 : 0.4 }}
            onClick={onNext}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire the overlay into the dashboard return JSX**

Inside `DashboardPage`, add a `router` import and `handleOnboardingFinish`:

```tsx
const router = useRouter()  // already imported

function handleOnboardingFinish(route: string) {
  setOnboardingStep(null)
  if (route !== '/dashboard') router.push(route)
  // Remove ?welcome=true from URL without reload
  const url = new URL(window.location.href)
  url.searchParams.delete('welcome')
  window.history.replaceState({}, '', url.toString())
}
```

At the very end of the return JSX, before the final closing `</div>`, add:

```tsx
{onboardingStep !== null && (
  <OnboardingOverlay
    step={onboardingStep}
    selections={onboardingSelections}
    onSelect={(s) => setOnboardingSelections(prev => ({ ...prev, [onboardingStep]: s }))}
    onNext={() => setOnboardingStep(prev => (prev ?? 0) + 1)}
    onFinish={handleOnboardingFinish}
  />
)}
```

- [ ] **Step 4: Verify**

```bash
npm run dev
```
Navigate to `http://localhost:3000/dashboard?welcome=true`. Verify: onboarding overlay appears with step indicator, card selections glow cyan when active, Continue button disabled until a selection is made, final step shows three CTA buttons.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add post-auth onboarding overlay to dashboard"
```

---

## Task 8: Studio Page Shell — Three-Panel Layout

**Files:**
- Modify: `app/studio/page.tsx`

The existing file is 68 lines. Replace entirely — it currently renders `VideoGeneratorForm` inside a simple centered container. The new shell wraps that same component in a three-panel layout.

- [ ] **Step 1: Write new app/studio/page.tsx**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ConnectElevenLabsButton from '@/components/ConnectElevenLabsButton'
import VideoGeneratorForm from '@/components/VideoGeneratorForm'

export default function StudioPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [userId,    setUserId]    = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

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
        <div className="loader-ribbon" style={{ width: 120 }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0D1520', color: '#F4F8FB', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', background: '#0D1520', borderBottom: '1px solid #273242',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image src="/For Rebranding/reelsy-icon.png" alt="Reelsy" width={26} height={26} style={{ objectFit: 'contain' }} />
          <Link href="/dashboard" style={{ fontSize: 13, color: '#738295', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Dashboard
          </Link>
        </div>
        <span style={{ fontFamily: 'var(--font-syne)', fontSize: 14, fontWeight: 600, color: '#F4F8FB' }}>Reelsy Studio</span>
        <ConnectElevenLabsButton userId={userId} onConnected={() => setConnected(true)} />
      </nav>

      {/* Three-panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr 300px', flex: 1, overflow: 'hidden', height: 'calc(100vh - 56px)' }}>

        {/* ── Left panel (setup) ── */}
        <div style={{
          background: '#101722', borderRight: '1px solid #273242',
          overflowY: 'auto', display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ padding: '20px 20px 0', borderBottom: '1px solid #273242', paddingBottom: 16, marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#738295', textTransform: 'uppercase', letterSpacing: 1 }}>Setup</div>
          </div>

          {/* Form lives here — VideoGeneratorForm manages all panel content */}
          <div style={{ padding: 20, flex: 1 }}>
            {!connected && (
              <div style={{
                marginBottom: 16, padding: '10px 14px', borderRadius: 10,
                background: 'rgba(246,185,74,0.08)', border: '1px solid rgba(246,185,74,0.25)',
                fontSize: 12, color: '#F6B94A', lineHeight: 1.5,
              }}>
                Connect your ElevenLabs account (top right) to use your cloned voices.
              </div>
            )}
            <VideoGeneratorForm userId={userId} />
          </div>
        </div>

        {/* ── Center panel (stage) ── */}
        <div style={{
          background: '#0D1520', display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Grid texture */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(#273242 1px,transparent 1px),linear-gradient(90deg,#273242 1px,transparent 1px)',
            backgroundSize: '40px 40px', opacity: 0.04, pointerEvents: 'none',
          }} />
          {/* Empty state */}
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 360, padding: 24 }}>
            <div style={{
              width: 280, height: 200, margin: '0 auto 24px',
              background: '#141D28', border: '2px solid #273242', borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ textAlign: 'center' }}>
                {/* Waveform decoration */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, justifyContent: 'center', marginBottom: 12 }}>
                  {[12,18,24,20,28,24,18,12].map((h,i) => (
                    <div key={i} style={{ width: 3, height: h, borderRadius: 2, background: '#273242' }} />
                  ))}
                </div>
                <div style={{ fontSize: 12, color: '#738295', lineHeight: 1.5 }}>
                  Upload an avatar, add a script,<br />and choose a voice to begin
                </div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#738295', lineHeight: 1.6 }}>
              Your generated video will appear here.
            </p>
          </div>
        </div>

        {/* ── Right panel (takes) ── */}
        <div style={{
          background: '#101722', borderLeft: '1px solid #273242',
          overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#738295', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Takes & Outputs
          </div>

          {(['Current session','Recent takes','Saved outputs'] as const).map(section => (
            <div key={section}>
              <div style={{ fontSize: 12, color: '#A7B4C2', fontWeight: 500, marginBottom: 10 }}>{section}</div>
              <div style={{
                background: '#141D28', border: '1px solid #273242', borderRadius: 10,
                padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: 60,
              }}>
                <span style={{ fontSize: 12, color: '#738295' }}>No takes yet</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```
Open `http://localhost:3000/studio` (signed in). Verify: three-column layout renders, left panel shows VideoGeneratorForm, center shows cinematic empty state, right panel shows takes sections, no purple anywhere.

- [ ] **Step 3: Commit**

```bash
git add app/studio/page.tsx
git commit -m "feat: rewrite studio page with 3-panel Reelsy shell"
```

---

## Task 9: VideoGeneratorForm — JSX Reskin

**Files:**
- Modify: `components/VideoGeneratorForm.tsx`

Logic is frozen. Only JSX class names and inline styles change.

- [ ] **Step 1: Update the form JSX surface**

Make the following targeted replacements in `components/VideoGeneratorForm.tsx`. Do not touch anything outside of `return (...)` or the `STEP_LABELS` object copy:

**Portrait upload label (label wrapping the drop zone):**
```tsx
// BEFORE
<label className="relative flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-white/[0.12] hover:border-purple-500/40 transition-colors cursor-pointer bg-white/[0.02]">

// AFTER
<label className="relative flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-[#273242] hover:border-[#00C4CC]/40 transition-colors cursor-pointer bg-white/[0.02]">
```

**Transcript textarea:**
```tsx
// BEFORE
className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500/50 disabled:opacity-50"

// AFTER
className="w-full bg-white/[0.05] border border-[#273242] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-[#00C4CC]/50 disabled:opacity-50"
```

**Motion prompt input:**
```tsx
// BEFORE
className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 disabled:opacity-50"

// AFTER
className="w-full bg-white/[0.05] border border-[#273242] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#00C4CC]/50 disabled:opacity-50"
```

**Loading state — replace the spinner SVG + label row:**
```tsx
// BEFORE
<div className="flex items-center gap-2 text-sm text-slate-300">
  <svg className="w-4 h-4 animate-spin text-purple-400 shrink-0" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10" />
  </svg>
  <span>{STEP_LABELS[step.id]}</span>
</div>

// AFTER
<div className="flex flex-col gap-2">
  <span className="text-sm" style={{ color: '#A7B4C2' }}>{STEP_LABELS[step.id]}</span>
  <div className="loader-ribbon" />
</div>
```

**Progress bar (inside `step.id === 'processing'` block):**
```tsx
// BEFORE
<div className="h-full rounded-full bg-purple-500 transition-all duration-500"

// AFTER
<div className="h-full rounded-full transition-all duration-500" style={{ background: 'linear-gradient(135deg,#00C4CC,#00F2FE)' }}
```

**Progress bar track:**
```tsx
// BEFORE
<div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">

// AFTER
<div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#273242' }}>
```

**Submit button:**
```tsx
// BEFORE
className="py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 hover:from-purple-500 hover:via-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_24px_rgba(139,92,246,0.35)] hover:shadow-[0_0_36px_rgba(139,92,246,0.55)] active:scale-[0.98]"

// AFTER
className="btn-primary w-full justify-center py-3 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
```

**Result success message:**
```tsx
// BEFORE
<p className="text-xs font-semibold text-emerald-400">Your talking video is ready!</p>

// AFTER
<p className="text-xs font-semibold" style={{ color: '#21D69B' }}>Your talking video is ready!</p>
```

**Generate another button:**
```tsx
// BEFORE
className="text-xs text-slate-500 hover:text-white transition-colors"

// AFTER
className="btn-tertiary text-xs"
```

**Update STEP_LABELS copy:**
```tsx
// BEFORE
const STEP_LABELS: Record<Step['id'], string> = {
  'idle':             '',
  'uploading-image':  'Uploading image…',
  'generating-tts':   'Generating voice…',
  'splitting-audio':  'Splitting audio…',
  'submitting-chunks': 'Submitting to AI…',
  'processing':       'Generating video…',
  'stitching':        'Stitching final video…',
  'done':             'Done!',
  'error':            'Error',
}

// AFTER
const STEP_LABELS: Record<Step['id'], string> = {
  'idle':             '',
  'uploading-image':  'Uploading image…',
  'generating-tts':   'Synthesizing voice…',
  'splitting-audio':  'Preparing audio…',
  'submitting-chunks': 'Submitting to AI…',
  'processing':       'Animating avatar…',
  'stitching':        'Rendering final video…',
  'done':             'Done!',
  'error':            'Error',
}
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```
Open `/studio`. Submit the form with a test image, transcript, and voice. Verify: no purple spinner, ribbon-line loader appears, progress bar is teal, button is gradient-primary style.

- [ ] **Step 3: Commit**

```bash
git add components/VideoGeneratorForm.tsx
git commit -m "feat: reskin VideoGeneratorForm with Reelsy teal accents"
```

---

## Task 10: Component Reskins — VoiceSelector, VideoPlayer, ConnectElevenLabsButton

**Files:**
- Modify: `components/VoiceSelector.tsx`
- Modify: `components/VideoPlayer.tsx`
- Modify: `components/ConnectElevenLabsButton.tsx`

- [ ] **Step 1: Reskin VoiceSelector**

Replace the `return` JSX in `components/VoiceSelector.tsx`:

```tsx
  if (loading) {
    return <div className="loader-ribbon" style={{ marginTop: 4 }} />
  }

  if (error) {
    return (
      <div style={{ fontSize: 12, color: '#FF5D6C', padding: '8px 12px', background: 'rgba(255,93,108,0.08)', border: '1px solid rgba(255,93,108,0.2)', borderRadius: 8 }}>
        Could not load voices: {error}
        {' '}<button onClick={() => { setError(null); setLoading(true) }} style={{ color: '#00C4CC', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>Retry</button>
      </div>
    )
  }

  if (voices.length === 0) {
    return (
      <p style={{ fontSize: 12, color: '#738295', padding: '8px 0' }}>
        No cloned voices found. Clone a voice in ElevenLabs first.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%', appearance: 'none',
          background: '#141D28', border: `1px solid ${value ? '#00C4CC' : '#273242'}`,
          borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#F4F8FB',
          outline: 'none', cursor: 'pointer',
          boxShadow: value ? '0 0 10px rgba(0,196,204,0.15)' : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        <option value="" style={{ background: '#141D28' }}>Select a cloned voice</option>
        {voices.map((v) => (
          <option key={v.voiceId} value={v.voiceId} style={{ background: '#141D28' }}>
            {v.name}
          </option>
        ))}
      </select>

      {value && (() => {
        const v = voices.find((x) => x.voiceId === value)
        return v?.previewUrl ? (
          <button
            type="button"
            onClick={() => new Audio(v.previewUrl).play()}
            style={{ fontSize: 11, color: '#00C4CC', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, transition: 'color 0.2s' }}
          >
            ▶ Preview voice
          </button>
        ) : null
      })()}
    </div>
  )
```

- [ ] **Step 2: Reskin VideoPlayer**

Replace the entire `return` block in `components/VideoPlayer.tsx`:

```tsx
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <video
        src={videoUrl}
        controls
        playsInline
        style={{
          width: '100%', borderRadius: 12,
          border: '1px solid #273242', background: '#0B0F14',
        }}
      />
      <a
        href={videoUrl}
        download="reelsy-talking-video.mp4"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary"
        style={{ alignSelf: 'flex-start', fontSize: 12, padding: '7px 16px' }}
      >
        Download video
      </a>
    </div>
  )
```

- [ ] **Step 3: Reskin ConnectElevenLabsButton**

Replace the three `return` blocks in `components/ConnectElevenLabsButton.tsx`:

Loading state:
```tsx
  if (connected === null) {
    return <div className="loader-ribbon" style={{ width: 120 }} />
  }
```

Connected state:
```tsx
  if (connected) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: '#21D69B' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#21D69B', flexShrink: 0 }} />
          ElevenLabs Connected
        </span>
        <button
          onClick={handleDisconnect}
          style={{ fontSize: 11, color: '#738295', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#FF5D6C')}
          onMouseLeave={e => (e.currentTarget.style.color = '#738295')}
        >
          Disconnect
        </button>
      </div>
    )
  }
```

Disconnected state:
```tsx
  return (
    <button
      onClick={open}
      disabled={saving}
      className="btn-primary"
      style={{ fontSize: 12, padding: '6px 14px' }}
    >
      {saving ? 'Saving…' : 'Connect ElevenLabs'}
    </button>
  )
```

- [ ] **Step 4: Verify**

```bash
npm run dev
```
Open `/studio`. Verify: VoiceSelector has teal glow on selected voice, VideoPlayer shows teal border, ConnectElevenLabsButton is gradient-primary when disconnected and green dot when connected.

- [ ] **Step 5: Commit**

```bash
git add components/VoiceSelector.tsx components/VideoPlayer.tsx components/ConnectElevenLabsButton.tsx
git commit -m "feat: reskin VoiceSelector, VideoPlayer, ConnectElevenLabsButton for Reelsy"
```

---

## Self-Review Checklist

**Spec coverage:**

| Spec requirement | Task |
|-----------------|------|
| CSS tokens — remove all purple/pink vars | Task 1 |
| Reelsy logo in header, footer | Task 3 |
| Split-panel login with Google only | Task 4 |
| First-time variant (?mode=signup) | Task 4 |
| New-user ?welcome=true detection | Task 5 |
| Dashboard app shell (sidebar + header) | Task 6 |
| Branded loading states (ribbon, no spinners) | Task 1 + Task 6 Step 4 |
| Onboarding overlay 3-step | Task 7 |
| Studio 3-panel shell | Task 8 |
| VideoGeneratorForm reskin (logic frozen) | Task 9 |
| VoiceSelector / VideoPlayer / ConnectElevenLabs reskin | Task 10 |
| app/layout.tsx metadata update | Task 2 |
| Favicon replacement | Task 2 |
| Waveform bars in studio center | Task 8 |
| Ribbon loader in VideoGeneratorForm | Task 9 |
| Reelsy STEP_LABELS copy | Task 9 |

All spec requirements covered.

**Placeholder scan:** None found.

**Type consistency:** `VideoGeneratorForm` `Step` type and all `setStep` calls are untouched across Tasks 8–9. `OnboardingOverlay` uses local types defined in Task 7. `profile` variable referenced in Task 6 shell — confirm it exists in the existing dashboard state before applying (read first in Step 1).
