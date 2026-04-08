'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  ArrowRight,
  Wand2,
  Zap,
  Clock,
  Download,
  Shield,
  Film,
  CheckCircle,
  Users,
  Building2,
  ImageIcon,
  Star,
} from 'lucide-react'

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS — Brand palette (matches Iart icon)
   Purple (#8B5CF6) → Cyan (#06B6D4) → Pink (#EC4899) + Gold star
══════════════════════════════════════════════════════════════ */
const BG       = '#060510'      // near-black with deep purple tint
const SURFACE  = '#0F0D1A'      // dark surface with purple undertone
const SURFACE2 = '#09070F'      // slightly deeper surface
const TEXT     = '#F0EDE8'      // warm off-white
const MUTED    = '#7A7492'      // muted with subtle purple tint
const BORDER   = 'rgba(139,92,246,0.14)'   // purple-tinted border

// Brand accent (primary — purple)
const PURPLE      = '#8B5CF6'
const PURPLE_DIM  = 'rgba(139,92,246,0.14)'
const PURPLE_BDR  = 'rgba(139,92,246,0.28)'

// Brand gradient (purple → cyan → pink — matches icon exactly)
const GRADIENT    = 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 55%, #ec4899 100%)'
const GRAD_GLOW   = 'linear-gradient(135deg, rgba(139,92,246,0.35) 0%, rgba(6,182,212,0.2) 55%, rgba(236,72,153,0.2) 100%)'

// Accent aliases for readability
const GOLD  = '#fbbf24'         // star/highlight accent (matches icon's star)
const CYAN  = '#06b6d4'
const PINK  = '#ec4899'

// Legacy alias used in the file
const ACCENT       = PURPLE
const ACCENT_DIM   = PURPLE_DIM
const ACCENT_BORDER = PURPLE_BDR

/* ══════════════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════════════ */

const MODELS = [
  { name: 'GPT-5 Image', tag: 'Image', hot: true },
  { name: 'Gemini 3.1 Flash', tag: 'Image', hot: false },
  { name: 'FLUX.2 Max', tag: 'Image', hot: false },
  { name: 'Veo 3.1 Fast', tag: 'Video', hot: true },
  { name: 'Sora 2', tag: 'Video', hot: true },
  { name: 'Kling 3.0', tag: 'Video', hot: false },
  { name: 'Runway Aleph', tag: 'Video', hot: false },
  { name: 'Seedance 2.0', tag: 'Video', hot: false },
  { name: 'FLUX.2 Pro', tag: 'Image', hot: false },
  { name: 'Hailuo Pro', tag: 'Video', hot: false },
  { name: 'Gemini 3 Pro', tag: 'Image', hot: true },
  { name: 'Seedream 4.5', tag: 'Image', hot: false },
  { name: 'Kling 2.6', tag: 'Video', hot: false },
  { name: 'Wan 2.6', tag: 'Video', hot: false },
  { name: 'Runway Gen4 Turbo', tag: 'Video', hot: false },
  { name: 'Grok T2V', tag: 'Video', hot: false },
  { name: 'FLUX.2 Klein', tag: 'Image', hot: false },
  { name: 'Riverflow v2 Max', tag: 'Image', hot: false },
  { name: 'CogVideoX-5B', tag: 'Video', hot: false },
  { name: 'Gemini 2.5 Flash', tag: 'Image', hot: false },
  { name: 'GPT-5 Image Mini', tag: 'Image', hot: false },
  { name: 'FLUX.2 Flex', tag: 'Image', hot: false },
  { name: 'Seedance 2.0 Fast', tag: 'Video', hot: false },
  { name: 'Hailuo Standard', tag: 'Video', hot: false },
  { name: 'Riverflow v2 Fast', tag: 'Image', hot: false },
]

const FEATURES = [
  {
    icon: Wand2,
    title: 'Text to Image',
    desc: 'Describe anything. Get studio-quality visuals in seconds from the world\'s best image models.',
    col: 'lg:col-span-1',
  },
  {
    icon: Film,
    title: 'Image to Video',
    desc: 'One click breathes life into any image — cinematic clips from your stills, instantly.',
    col: 'lg:col-span-1',
  },
  {
    icon: Zap,
    title: '25+ AI Models in One Place',
    desc: 'GPT-5, Gemini, FLUX, Veo 3.1, Sora 2, Kling, Runway and 18+ more — all under one roof. Switch models instantly. Star your favourites. No API keys needed.',
    col: 'lg:col-span-2',
    accent: true,
  },
  {
    icon: Clock,
    title: 'History & Gallery',
    desc: 'Every creation auto-saved. Star-rate and curate your growing visual library.',
    col: 'lg:col-span-1',
  },
  {
    icon: Download,
    title: 'HD Downloads',
    desc: 'Full-resolution exports, ready for social, print, or client presentations.',
    col: 'lg:col-span-1',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    desc: 'Enterprise-grade Google OAuth. Your work stays yours — never used for model training.',
    col: 'lg:col-span-2',
  },
]

const CREATOR_USES = [
  'Social media content at scale',
  'Personal brand & portfolio visuals',
  'YouTube thumbnails & channel art',
  'Concept art & mood boards',
  'Animated video clips from photos',
  'Product showcase imagery',
]

const TEAM_USES = [
  'Campaign visuals across all channels',
  'On-brand imagery in minutes',
  'Ad creative A/B test variations',
  'Product visualization',
  'Presentation & pitch deck graphics',
  'Video ads from static brand assets',
]

const STEPS = [
  {
    n: '01',
    title: 'Describe',
    text: 'Type your vision — a scene, a mood, an emotion. Be specific or go abstract.',
  },
  {
    n: '02',
    title: 'Choose',
    text: 'Pick from 25+ frontier AI models. Star your favourites for instant recall.',
  },
  {
    n: '03',
    title: 'Publish',
    text: 'Generate in seconds. Download HD images or turn any image into video.',
  },
]

const GALLERY_IMAGES = [
  { src: '/Ethereal forest with bioluminescent mushrooms and fireflies.png', prompt: 'Ethereal bioluminescent forest' },
  { src: '/A cyberpunk city at sunset with neon reflections on wet streets.png', prompt: 'Cyberpunk city at sunset' },
  { src: '/Watercolor painting of a Japanese garden in autumn.png', prompt: 'Japanese garden in autumn' },
  { src: '/Surreal floating islands above clouds at golden hour.png', prompt: 'Floating islands, golden hour' },
  { src: '/Macro photograph of morning dew on a spider web.png', prompt: 'Morning dew macro' },
  { src: '/Abstract liquid chrome sculpture of Donald Trump\'s face with its half covered in a spiderman venom type mask in a void, studio lighting.png', prompt: 'Abstract liquid chrome sculpture' },
  // duplicate for seamless loop
  { src: '/Ethereal forest with bioluminescent mushrooms and fireflies.png', prompt: 'Ethereal bioluminescent forest' },
  { src: '/A cyberpunk city at sunset with neon reflections on wet streets.png', prompt: 'Cyberpunk city at sunset' },
  { src: '/Watercolor painting of a Japanese garden in autumn.png', prompt: 'Japanese garden in autumn' },
  { src: '/Surreal floating islands above clouds at golden hour.png', prompt: 'Floating islands, golden hour' },
  { src: '/Macro photograph of morning dew on a spider web.png', prompt: 'Morning dew macro' },
  { src: '/Abstract liquid chrome sculpture of Donald Trump\'s face with its half covered in a spiderman venom type mask in a void, studio lighting.png', prompt: 'Abstract liquid chrome sculpture' },
]

/* ══════════════════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════════════════ */

function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function ModelPill({ m }: { m: (typeof MODELS)[0] }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full shrink-0 select-none"
      style={{
        background: m.hot ? ACCENT_DIM : 'rgba(255,255,255,0.04)',
        border: `1px solid ${m.hot ? ACCENT_BORDER : BORDER}`,
      }}
    >
      {m.hot && <Star className="w-3 h-3" style={{ color: GOLD }} />}
      <span className="text-sm font-medium" style={{ color: m.hot ? GOLD : TEXT }}>
        {m.name}
      </span>
      <span
        className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full"
        style={{
          background: m.tag === 'Video' ? 'rgba(99,102,241,0.15)' : 'rgba(34,197,94,0.1)',
          color: m.tag === 'Video' ? '#818CF8' : '#4ADE80',
        }}
      >
        {m.tag}
      </span>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <main
      style={{ background: BG, color: TEXT }}
      className="relative overflow-hidden font-[family-name:var(--font-manrope)]"
    >
      {/* ═══════════════════════════════════════════════
          NAVBAR
      ═══════════════════════════════════════════════ */}
      <nav
        style={{
          background: 'rgba(10,8,5,0.88)',
          borderBottom: `1px solid ${BORDER}`,
        }}
        className="fixed top-0 left-0 right-0 z-50 px-5 md:px-8 py-4 flex items-center justify-between backdrop-blur-xl"
      >
        <Link href="/" className="cursor-pointer shrink-0">
          <Image src="/Iart.png" alt="InstaArt" width={140} height={35} className="h-8 w-auto" priority />
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: MUTED }}>
          <Link href="#features" className="hover:text-[#F0EAE0] transition-colors duration-200 cursor-pointer">
            Features
          </Link>
          <Link href="#models" className="hover:text-[#F0EAE0] transition-colors duration-200 cursor-pointer">
            Models
          </Link>
          <Link href="#how-it-works" className="hover:text-[#F0EAE0] transition-colors duration-200 cursor-pointer">
            How It Works
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            style={{ color: MUTED }}
            className="hidden sm:inline-flex px-4 py-2 text-sm font-medium hover:text-[#F0EAE0] transition-colors duration-200 cursor-pointer"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            style={{ background: GRADIENT, color: '#fff' }}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity duration-200 hover:opacity-90 cursor-pointer flex items-center gap-1.5"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════ */}
      <section className="min-h-screen flex items-center pt-20 px-5 md:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 lg:gap-8 items-center py-20 lg:py-28">

          {/* ── Left: Text ── */}
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8 text-xs font-semibold tracking-wide"
              style={{ background: ACCENT_DIM, color: ACCENT, border: `1px solid ${ACCENT_BORDER}` }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              25+ AI Models &middot; Image &amp; Video Generation
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="font-[family-name:var(--font-syne)] font-extrabold leading-[0.9] tracking-tight"
              style={{ fontSize: 'clamp(3rem, 5.5vw, 5.25rem)', color: TEXT }}
            >
              From Prompt
              <br />
              <span
              style={{
                background: GRADIENT,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              to Published.
            </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-lg leading-relaxed max-w-[440px]"
              style={{ color: MUTED }}
            >
              The AI creative studio for content creators and marketing teams
              who demand extraordinary results — in seconds, not hours.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 flex flex-col sm:flex-row gap-3"
            >
              <Link
                href="/login"
                style={{ background: GRADIENT, color: '#fff' }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base cursor-pointer hover:opacity-90 transition-opacity duration-200 animate-brand-glow"
              >
                Start Creating — It&apos;s Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                style={{ color: TEXT, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)' }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base cursor-pointer hover:bg-white/[0.07] transition-colors duration-200"
              >
                View Dashboard
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.42 }}
              className="mt-5 text-sm"
              style={{ color: '#4A4540' }}
            >
              No credit card needed &middot; Google sign-in &middot; Instant access
            </motion.p>
          </div>

          {/* ── Right: Floating image constellation ── */}
          <div className="relative h-[520px] lg:h-[620px] hidden lg:block">
            {/* Ambient glow */}
            <div
              className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(6,182,212,0.08) 60%, rgba(236,72,153,0.07) 100%)' }}
            />

            {/* Image A — top-left, landscape, rotate left */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotate: -3 }}
              animate={{ opacity: 1, x: 0, rotate: -3 }}
              transition={{ duration: 0.95, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-0 left-0 w-[62%] aspect-video rounded-2xl overflow-hidden animate-float-a cursor-pointer group"
              style={{
                boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07)',
              }}
            >
              <Image
                src="/A cyberpunk city at sunset with neon reflections on wet streets.png"
                alt="AI generated cyberpunk city"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                sizes="400px"
              />
              <div
                className="absolute inset-x-0 bottom-0 px-3 py-2.5"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)' }}
              >
                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Cyberpunk city at sunset
                </p>
              </div>
            </motion.div>

            {/* Image B — center-right, portrait, rotate right */}
            <motion.div
              initial={{ opacity: 0, x: -28, rotate: 2.5 }}
              animate={{ opacity: 1, x: 0, rotate: 2.5 }}
              transition={{ duration: 0.95, delay: 0.52, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-[22%] right-0 w-[46%] aspect-[3/4] rounded-2xl overflow-hidden animate-float-b cursor-pointer group"
              style={{
                boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07)',
              }}
            >
              <Image
                src="/Ethereal forest with bioluminescent mushrooms and fireflies.png"
                alt="AI generated ethereal forest"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                sizes="300px"
              />
              <div
                className="absolute inset-x-0 bottom-0 px-3 py-2.5"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)' }}
              >
                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Ethereal bioluminescent forest
                </p>
              </div>
            </motion.div>

            {/* Image C — bottom-left, landscape */}
            <motion.div
              initial={{ opacity: 0, y: 32, rotate: 1 }}
              animate={{ opacity: 1, y: 0, rotate: 1 }}
              transition={{ duration: 0.95, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-0 left-[8%] w-[58%] aspect-video rounded-2xl overflow-hidden animate-float-c cursor-pointer group"
              style={{
                boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07)',
              }}
            >
              <Image
                src="/Surreal floating islands above clouds at golden hour.png"
                alt="AI generated floating islands"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                sizes="380px"
              />
              <div
                className="absolute inset-x-0 bottom-0 px-3 py-2.5"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)' }}
              >
                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Floating islands, golden hour
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          MODEL MARQUEE
      ═══════════════════════════════════════════════ */}
      <section
        id="models"
        className="py-10 overflow-hidden"
        style={{
          borderTop: `1px solid ${BORDER}`,
          borderBottom: `1px solid ${BORDER}`,
          background: SURFACE2,
        }}
      >
        {/* Header row */}
        <div className="flex items-center gap-4 px-5 md:px-8 mb-6">
          <span
            className="text-xs font-semibold tracking-widest uppercase shrink-0"
            style={{ color: '#3A3530' }}
          >
            Frontier AI Models
          </span>
          <div className="h-px flex-1" style={{ background: BORDER }} />
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
            style={{ background: PURPLE_DIM, color: PURPLE, border: `1px solid ${PURPLE_BDR}` }}
          >
            25+ Available
          </span>
        </div>

        {/* Marquee row — scrolls left */}
        <div className="relative overflow-hidden mb-3">
          <div
            className="flex gap-3 animate-marquee"
            style={{ width: 'max-content' }}
          >
            {[...MODELS, ...MODELS].map((m, i) => (
              <ModelPill key={`a-${i}`} m={m} />
            ))}
          </div>
          <div
            className="absolute inset-y-0 left-0 w-20 pointer-events-none"
            style={{ background: `linear-gradient(to right, ${SURFACE2}, transparent)` }}
          />
          <div
            className="absolute inset-y-0 right-0 w-20 pointer-events-none"
            style={{ background: `linear-gradient(to left, ${SURFACE2}, transparent)` }}
          />
        </div>

        {/* Marquee row 2 — scrolls right */}
        <div className="relative overflow-hidden">
          <div
            className="flex gap-3 animate-marquee-reverse"
            style={{ width: 'max-content' }}
          >
            {[...MODELS.slice(8), ...MODELS.slice(0, 8), ...MODELS.slice(8), ...MODELS.slice(0, 8)].map((m, i) => (
              <ModelPill key={`b-${i}`} m={m} />
            ))}
          </div>
          <div
            className="absolute inset-y-0 left-0 w-20 pointer-events-none"
            style={{ background: `linear-gradient(to right, ${SURFACE2}, transparent)` }}
          />
          <div
            className="absolute inset-y-0 right-0 w-20 pointer-events-none"
            style={{ background: `linear-gradient(to left, ${SURFACE2}, transparent)` }}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          DUAL AUDIENCE
      ═══════════════════════════════════════════════ */}
      <section className="py-28 md:py-36 px-5 md:px-8">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="mb-16">
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: ACCENT }}>
                Built for creators &amp; teams
              </p>
              <h2
                className="font-[family-name:var(--font-syne)] font-extrabold leading-[0.92] tracking-tight"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', color: TEXT }}
              >
                One studio.
                <br />
                Two superpowers.
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Creators */}
            <FadeIn delay={0.05}>
              <div
                className="relative rounded-3xl p-8 md:p-10 h-full"
                style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
              >
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
                  style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.2)' }}
                >
                  <Users className="w-3.5 h-3.5" />
                  Content Creators
                </div>

                <h3
                  className="font-[family-name:var(--font-syne)] font-bold text-2xl md:text-3xl mb-4"
                  style={{ color: TEXT }}
                >
                  Make content that stops the scroll
                </h3>
                <p className="text-base mb-8 leading-relaxed" style={{ color: MUTED }}>
                  From YouTube thumbnails to TikTok animations — generate visuals your audience has
                  never seen before. Faster than hiring a designer.
                </p>

                <ul className="space-y-3">
                  {CREATOR_USES.map((use) => (
                    <li key={use} className="flex items-center gap-3 text-sm" style={{ color: '#C0B8B0' }}>
                      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#818CF8' }} />
                      {use}
                    </li>
                  ))}
                </ul>

                <div className="mt-10">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity duration-200"
                    style={{ color: '#818CF8' }}
                  >
                    Start as a creator
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </FadeIn>

            {/* Marketing Teams */}
            <FadeIn delay={0.12}>
              <div
                className="relative rounded-3xl p-8 md:p-10 h-full"
                style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
              >
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
                  style={{ background: PURPLE_DIM, color: PURPLE, border: `1px solid ${PURPLE_BDR}` }}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Marketing Teams
                </div>

                <h3
                  className="font-[family-name:var(--font-syne)] font-bold text-2xl md:text-3xl mb-4"
                  style={{ color: TEXT }}
                >
                  Produce campaign assets at velocity
                </h3>
                <p className="text-base mb-8 leading-relaxed" style={{ color: MUTED }}>
                  Brief the AI like you brief a creative team. Get on-brand imagery, ad variants,
                  and video content — without the agency timeline or price tag.
                </p>

                <ul className="space-y-3">
                  {TEAM_USES.map((use) => (
                    <li key={use} className="flex items-center gap-3 text-sm" style={{ color: '#C0B8B0' }}>
                      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: PURPLE }} />
                      {use}
                    </li>
                  ))}
                </ul>

                <div className="mt-10">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity duration-200"
                    style={{ color: PURPLE }}
                  >
                    Start as a team
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FEATURES BENTO
      ═══════════════════════════════════════════════ */}
      <section
        id="features"
        className="py-28 md:py-36 px-5 md:px-8"
        style={{ background: SURFACE2 }}
      >
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="mb-16">
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: ACCENT }}>
                What you get
              </p>
              <h2
                className="font-[family-name:var(--font-syne)] font-extrabold leading-[0.92] tracking-tight"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', color: TEXT }}
              >
                Everything you need.
                <br />
                Nothing you don&apos;t.
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <FadeIn key={f.title} delay={i * 0.07} className={f.col}>
                  <div
                    className="relative h-full rounded-2xl p-7 group cursor-default transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      background: f.accent ? `linear-gradient(135deg, rgba(255,101,0,0.1) 0%, rgba(245,166,35,0.06) 100%)` : SURFACE,
                      border: `1px solid ${f.accent ? ACCENT_BORDER : BORDER}`,
                    }}
                  >
                    {f.accent && (
                      <div
                        className="absolute top-0 right-0 bottom-0 left-0 rounded-2xl pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse 80% 80% at 80% 20%, rgba(255,101,0,0.05), transparent)' }}
                      />
                    )}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                      style={{
                        background: f.accent ? ACCENT_DIM : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${f.accent ? ACCENT_BORDER : BORDER}`,
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: f.accent ? ACCENT : MUTED }} />
                    </div>
                    <h3
                      className="font-[family-name:var(--font-syne)] font-bold text-lg mb-2.5"
                      style={{ color: TEXT }}
                    >
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
                      {f.desc}
                    </p>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-28 md:py-36 px-5 md:px-8">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="mb-20">
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: ACCENT }}>
                How it works
              </p>
              <h2
                className="font-[family-name:var(--font-syne)] font-extrabold leading-[0.92] tracking-tight"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', color: TEXT }}
              >
                Three steps.
                <br />
                Zero friction.
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {STEPS.map((step, i) => (
              <FadeIn key={step.n} delay={i * 0.12}>
                <div
                  className="relative py-10 md:py-0"
                  style={{
                    paddingRight: i < 2 ? '48px' : '0',
                    paddingLeft: i > 0 ? '48px' : '0',
                    borderRight: i < 2 ? `1px solid ${BORDER}` : 'none',
                  }}
                >
                  {/* Step number — large ghosted */}
                  <div
                    className="font-[family-name:var(--font-syne)] font-extrabold text-[6rem] leading-none select-none mb-6 absolute top-0 left-0 pointer-events-none"
                    style={{
                      color: 'rgba(255,255,255,0.03)',
                      fontSize: '8rem',
                      paddingLeft: i > 0 ? '48px' : '0',
                    }}
                  >
                    {step.n}
                  </div>

                  {/* Step indicator */}
                  <div
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm mb-6"
                    style={{ background: GRADIENT, color: '#fff', fontFamily: 'var(--font-syne)' }}
                  >
                    {step.n}
                  </div>

                  <h3
                    className="font-[family-name:var(--font-syne)] font-bold text-2xl mb-3"
                    style={{ color: TEXT }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-base leading-relaxed" style={{ color: MUTED }}>
                    {step.text}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          GALLERY STRIP
      ═══════════════════════════════════════════════ */}
      <section
        className="py-20 overflow-hidden"
        style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, background: SURFACE2 }}
      >
        <FadeIn className="px-5 md:px-8 mb-10">
          <div className="max-w-7xl mx-auto flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: ACCENT }}>
                Gallery
              </p>
              <h2
                className="font-[family-name:var(--font-syne)] font-extrabold leading-tight"
                style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: TEXT }}
              >
                What will <span style={{ color: ACCENT }}>you</span> create?
              </h2>
            </div>
            <Link
              href="/login"
              style={{ color: MUTED }}
              className="hidden sm:flex items-center gap-2 text-sm font-medium hover:text-[#F0EAE0] transition-colors duration-200 cursor-pointer"
            >
              See your gallery
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeIn>

        {/* Auto-scrolling strip */}
        <div className="relative">
          <div className="flex gap-4 animate-gallery-scroll" style={{ width: 'max-content' }}>
            {GALLERY_IMAGES.map((img, i) => (
              <div
                key={i}
                className="relative shrink-0 rounded-2xl overflow-hidden cursor-pointer group"
                style={{
                  width: '320px',
                  height: '220px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <Image
                  src={img.src}
                  alt={img.prompt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="320px"
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)' }}
                >
                  <p className="text-sm font-medium text-white/90">&ldquo;{img.prompt}&rdquo;</p>
                </div>
              </div>
            ))}
          </div>
          {/* Edge fades */}
          <div
            className="absolute inset-y-0 left-0 w-24 pointer-events-none"
            style={{ background: `linear-gradient(to right, ${SURFACE2}, transparent)` }}
          />
          <div
            className="absolute inset-y-0 right-0 w-24 pointer-events-none"
            style={{ background: `linear-gradient(to left, ${SURFACE2}, transparent)` }}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          STATS ROW
      ═══════════════════════════════════════════════ */}
      <section className="py-20 px-5 md:px-8">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-8 rounded-3xl p-10 md:p-14"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              {[
                { value: '25+', label: 'AI Models' },
                { value: '<15s', label: 'Per Image' },
                { value: '100%', label: 'Free to Start' },
                { value: '24/7', label: 'Always On' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div
                    className="font-[family-name:var(--font-syne)] font-extrabold mb-2"
                    style={{
                      fontSize: 'clamp(2.25rem, 4vw, 3rem)',
                      background: GRADIENT,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {value}
                  </div>
                  <div
                    className="text-sm font-semibold uppercase tracking-widest"
                    style={{ color: MUTED }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          MODEL HIGHLIGHT — Image vs Video
      ═══════════════════════════════════════════════ */}
      <section className="py-28 md:py-36 px-5 md:px-8" style={{ background: SURFACE2 }}>
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="mb-16">
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: ACCENT }}>
                Model library
              </p>
              <h2
                className="font-[family-name:var(--font-syne)] font-extrabold leading-[0.92] tracking-tight"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', color: TEXT }}
              >
                Image models.
                <br />
                <span style={{ color: ACCENT }}>Video models.</span>
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Models card */}
            <FadeIn delay={0.05}>
              <div
                className="rounded-2xl p-7 h-full"
                style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-center gap-3 mb-7">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
                  >
                    <ImageIcon className="w-5 h-5" style={{ color: '#4ADE80' }} />
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-syne)] font-bold text-lg" style={{ color: TEXT }}>
                      Image Generation
                    </h3>
                    <p className="text-xs" style={{ color: MUTED }}>
                      10+ frontier models
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {MODELS.filter((m) => m.tag === 'Image').map((m) => (
                    <span
                      key={m.name}
                      className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{
                        background: m.hot ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${m.hot ? 'rgba(34,197,94,0.25)' : BORDER}`,
                        color: m.hot ? '#4ADE80' : MUTED,
                      }}
                    >
                      {m.hot && '★ '}
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Video Models card */}
            <FadeIn delay={0.1}>
              <div
                className="rounded-2xl p-7 h-full"
                style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-center gap-3 mb-7">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}
                  >
                    <Film className="w-5 h-5" style={{ color: '#818CF8' }} />
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-syne)] font-bold text-lg" style={{ color: TEXT }}>
                      Video Generation
                    </h3>
                    <p className="text-xs" style={{ color: MUTED }}>
                      15+ video models · text-to-video &amp; image-to-video
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {MODELS.filter((m) => m.tag === 'Video').map((m) => (
                    <span
                      key={m.name}
                      className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{
                        background: m.hot ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${m.hot ? 'rgba(99,102,241,0.3)' : BORDER}`,
                        color: m.hot ? '#818CF8' : MUTED,
                      }}
                    >
                      {m.hot && '★ '}
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════ */}
      <section className="py-32 md:py-44 px-5 md:px-8 relative overflow-hidden">
        {/* Ambient orange glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: GRAD_GLOW }}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeIn>
            <h2
              className="font-[family-name:var(--font-syne)] font-extrabold leading-[0.92] tracking-tight"
              style={{ fontSize: 'clamp(2.75rem, 5.5vw, 5rem)', color: TEXT }}
            >
              Ready to create
              <br />
              <span
                  style={{
                    background: GRADIENT,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >extraordinary</span> content?
            </h2>
          </FadeIn>

          <FadeIn delay={0.12}>
            <p className="mt-6 text-lg leading-relaxed max-w-lg mx-auto" style={{ color: MUTED }}>
              Sign in with Google and start generating AI images and videos in seconds.
              No credit card. No setup. Just create.
            </p>
          </FadeIn>

          <FadeIn delay={0.22}>
            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                style={{ background: GRADIENT, color: '#fff' }}
                className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-semibold text-lg cursor-pointer hover:opacity-90 transition-opacity duration-200 animate-brand-glow"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <p className="mt-5 text-sm" style={{ color: '#4A4540' }}>
              No credit card &middot; Sign in with Google &middot; Instant access
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════ */}
      <footer
        className="py-10 px-5 md:px-8"
        style={{ borderTop: `1px solid ${BORDER}` }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <Link href="/" className="cursor-pointer shrink-0">
            <Image src="/Iart.png" alt="InstaArt" width={120} height={30} className="h-7 w-auto" />
          </Link>

          <p className="text-sm" style={{ color: '#4A4540' }}>
            &copy; {new Date().getFullYear()} InstaArt. All rights reserved.
          </p>

          <div className="flex gap-6 text-sm" style={{ color: MUTED }}>
            <Link href="/login" className="hover:text-[#F0EAE0] transition-colors cursor-pointer">
              Sign In
            </Link>
            <Link href="/dashboard" className="hover:text-[#F0EAE0] transition-colors cursor-pointer">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
