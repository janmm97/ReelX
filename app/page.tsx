'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import {
  Sparkles,
  Zap,
  Shield,
  ImageIcon,
  ArrowRight,
  ChevronDown,
  Wand2,
  Layers,
  Clock,
  Star,
} from 'lucide-react'

/* ── Showcase images ── */
const SHOWCASE = [
  {
    prompt: 'A cyberpunk city at sunset with neon reflections on wet streets',
    image: '/A cyberpunk city at sunset with neon reflections on wet streets.png',
  },
  {
    prompt: 'Ethereal forest with bioluminescent mushrooms and fireflies',
    image: '/Ethereal forest with bioluminescent mushrooms and fireflies.png',
  },
  {
    prompt: 'Abstract liquid chrome sculpture in a void, studio lighting',
    image: '/Abstract liquid chrome sculpture of Donald Trump\'s face with its half covered in a spiderman venom type mask in a void, studio lighting.png',
  },
  {
    prompt: 'Watercolor painting of a Japanese garden in autumn',
    image: '/Watercolor painting of a Japanese garden in autumn.png',
  },
  {
    prompt: 'Surreal floating islands above clouds at golden hour',
    image: '/Surreal floating islands above clouds at golden hour.png',
  },
  {
    prompt: 'Macro photograph of morning dew on a spider web',
    image: '/Macro photograph of morning dew on a spider web.png',
  },
]

const FEATURES = [
  {
    icon: Wand2,
    title: 'Text to Image',
    description:
      'Describe your vision in words and watch it materialize into stunning visuals within seconds.',
  },
  {
    icon: Layers,
    title: 'Multiple Models',
    description:
      'Choose between Gemini Flash and GPT-5 Image — two of the most powerful AI image models available.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description:
      'Optimized pipeline delivers high-quality images in under 15 seconds. No waiting, just creating.',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description:
      'Your prompts and images are yours. Secured with enterprise-grade authentication via Google OAuth.',
  },
  {
    icon: Clock,
    title: 'History & Gallery',
    description:
      'Every creation is saved. Browse, revisit, and download your entire image library anytime.',
  },
  {
    icon: ImageIcon,
    title: 'HD Downloads',
    description:
      'Download your generated images in full resolution. Ready for print, social media, or projects.',
  },
]

const STATS = [
  { value: '2', label: 'AI Models', suffix: '' },
  { value: '10', label: 'Daily Generations', suffix: '' },
  { value: '<15', label: 'Seconds Per Image', suffix: 's' },
  { value: '100', label: 'Free to Start', suffix: '%' },
]

/* ── Animated counter ── */
function AnimatedStat({
  value,
  label,
  suffix,
}: {
  value: string
  label: string
  suffix: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const numericValue = parseInt(value.replace(/\D/g, ''), 10)
  const prefix = value.startsWith('<') ? '<' : ''
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 1200
    const step = Math.ceil(numericValue / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= numericValue) {
        setCount(numericValue)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, numericValue])

  return (
    <div ref={ref} className="text-center">
      <div
        className="text-5xl md:text-6xl font-bold font-[family-name:var(--font-syne)] text-gradient"
        style={{ opacity: isInView ? 1 : 0, transition: 'opacity 0.5s' }}
      >
        {prefix}
        {count}
        {suffix}
      </div>
      <div className="mt-2 text-sm md:text-base text-[var(--muted)] uppercase tracking-widest">
        {label}
      </div>
    </div>
  )
}

/* ── Fade-in wrapper ── */
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
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── Main page ── */
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95])
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100])

  const [typedText, setTypedText] = useState('')
  const fullPrompt = 'A dreamy castle floating in the clouds at sunset...'

  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      setTypedText(fullPrompt.slice(0, i + 1))
      i++
      if (i >= fullPrompt.length) clearInterval(timer)
    }, 50)
    return () => clearInterval(timer)
  }, [])

  return (
    <main className="relative overflow-hidden bg-[var(--background)]">
      {/* ══════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════ */}
      <nav className="fixed top-4 left-4 right-4 z-50 glass rounded-2xl px-4 md:px-6 py-3 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="cursor-pointer shrink-0">
          <Image
            src="/Iart.png"
            alt="InstaArt"
            width={160}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex px-4 py-2 text-sm font-bold cursor-pointer text-gradient hover:opacity-80 transition-opacity duration-200"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer text-white"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 pt-20">
        {/* Aurora blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-aurora-1 absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
          <div className="animate-aurora-2 absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full bg-pink-500/15 blur-[120px]" />
          <div className="animate-aurora-3 absolute bottom-0 left-1/3 h-[450px] w-[450px] rounded-full bg-blue-500/15 blur-[120px]" />
        </div>

        {/* Subtle grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-[var(--muted)] mb-8">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Powered by Gemini & GPT-5</span>
            </div>
          </FadeIn>

          {/* Heading */}
          <FadeIn delay={0.1}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold font-[family-name:var(--font-syne)] leading-[0.95] tracking-tight">
              Imagine it.
              <br />
              <span className="text-gradient-shimmer">Create it.</span>
            </h1>
          </FadeIn>

          {/* Subheading */}
          <FadeIn delay={0.2}>
            <p className="mt-6 text-lg md:text-xl text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
              Transform your ideas into stunning AI-generated images in seconds.
              Type a prompt, pick a model, and watch the magic unfold.
            </p>
          </FadeIn>

          {/* Fake prompt input */}
          <FadeIn delay={0.3}>
            <div className="mt-10 max-w-2xl mx-auto">
              <div className="glass rounded-2xl p-1.5 flex items-center gap-2 group hover:border-purple-500/30 transition-colors duration-300">
                <div className="flex-1 flex items-center gap-3 px-4 py-3 text-left">
                  <Wand2 className="w-5 h-5 text-purple-400 shrink-0" />
                  <span className="text-[var(--muted)] text-sm md:text-base truncate">
                    {typedText}
                    <span className="inline-block w-0.5 h-5 bg-purple-400 ml-0.5 animate-pulse align-middle" />
                  </span>
                </div>
                <Link
                  href="/login"
                  className="shrink-0 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-semibold text-sm text-white transition-all duration-200 cursor-pointer flex items-center gap-2"
                >
                  Generate
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </FadeIn>

          {/* CTA buttons */}
          <FadeIn delay={0.4}>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href="/login"
                className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full font-semibold transition-all duration-200 animate-pulse-glow cursor-pointer text-white flex items-center gap-2"
              >
                Start Creating — It&apos;s Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="px-8 py-3.5 rounded-full font-semibold glass hover:bg-white/10 transition-all duration-200 cursor-pointer text-white"
              >
                Go to Dashboard
              </Link>
            </div>
          </FadeIn>
        </motion.div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-6 h-6 text-[var(--muted)]" />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 2 — SHOWCASE GALLERY
      ══════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-syne)]">
                What will <span className="text-gradient">you</span> create?
              </h2>
              <p className="mt-4 text-[var(--muted)] text-lg max-w-xl mx-auto">
                From photorealistic scenes to abstract art — if you can describe
                it, InstaArt can generate it.
              </p>
            </div>
          </FadeIn>

          {/* Masonry-style grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {SHOWCASE.map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div
                  className={`group relative rounded-2xl overflow-hidden cursor-pointer ${
                    i % 3 === 0 ? 'row-span-2 aspect-[3/4]' : 'aspect-square'
                  }`}
                >
                  {/* Real image */}
                  <Image
                    src={item.image}
                    alt={item.prompt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors duration-300" />
                  {/* Prompt on hover */}
                  <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                    <div className="glass rounded-xl p-3">
                      <p className="text-xs md:text-sm text-white/90 leading-relaxed line-clamp-3">
                        &ldquo;{item.prompt}&rdquo;
                      </p>
                    </div>
                  </div>
                  {/* Sparkle icon */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Sparkles className="w-5 h-5 text-white/80" />
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 3 — FEATURES (Bento Grid)
      ══════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-4 relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-aurora-2 absolute top-0 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[150px]" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-syne)]">
                Everything you need to{' '}
                <span className="text-gradient">create</span>
              </h2>
              <p className="mt-4 text-[var(--muted)] text-lg max-w-xl mx-auto">
                Professional-grade AI image generation, simplified for everyone.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="glass rounded-2xl p-6 md:p-8 h-full hover:border-purple-500/30 hover:bg-white/[0.03] transition-all duration-300 cursor-pointer group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center mb-5 group-hover:from-purple-600/30 group-hover:to-pink-600/30 transition-colors duration-300">
                    <feature.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold font-[family-name:var(--font-syne)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 4 — HOW IT WORKS
      ══════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-syne)]">
                Three steps. <span className="text-gradient">Zero friction.</span>
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: '01',
                title: 'Describe',
                text: 'Type your vision — a scene, a style, an idea. Be as creative or precise as you want.',
              },
              {
                step: '02',
                title: 'Choose',
                text: 'Pick your AI model. Gemini Flash for speed, GPT-5 Image for maximum quality.',
              },
              {
                step: '03',
                title: 'Generate',
                text: 'Hit generate and your image appears in seconds. Download, share, or create more.',
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <div className="relative text-center md:text-left">
                  <div className="text-6xl md:text-7xl font-extrabold font-[family-name:var(--font-syne)] text-white/[0.04] absolute -top-4 -left-2 select-none">
                    {item.step}
                  </div>
                  <div className="relative pt-8">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-bold text-white mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold font-[family-name:var(--font-syne)] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-[var(--muted)] leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 5 — STATS
      ══════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-4 relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-aurora-3 absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[150px]" />
          <div className="animate-aurora-1 absolute top-0 right-0 h-[300px] w-[300px] rounded-full bg-pink-500/10 blur-[120px]" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="glass rounded-3xl p-10 md:p-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
              {STATS.map((stat, i) => (
                <AnimatedStat key={i} {...stat} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 6 — MODEL COMPARISON
      ══════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-syne)]">
                Two world-class <span className="text-gradient">models</span>
              </h2>
              <p className="mt-4 text-[var(--muted)] text-lg max-w-xl mx-auto">
                Pick the perfect engine for your creative vision.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gemini Card */}
            <FadeIn delay={0}>
              <div className="glass rounded-2xl p-8 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer group h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-colors">
                    <Zap className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-[family-name:var(--font-syne)]">
                      Gemini Flash
                    </h3>
                    <p className="text-xs text-[var(--muted)]">by Google</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-[var(--muted)]">
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-cyan-400 shrink-0" />
                    Blazing fast generation
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-cyan-400 shrink-0" />
                    Great for rapid iteration
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-cyan-400 shrink-0" />
                    Strong with creative prompts
                  </li>
                </ul>
              </div>
            </FadeIn>

            {/* GPT-5 Card */}
            <FadeIn delay={0.1}>
              <div className="glass rounded-2xl p-8 hover:border-purple-500/30 transition-all duration-300 cursor-pointer group h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-colors">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-[family-name:var(--font-syne)]">
                      GPT-5 Image
                    </h3>
                    <p className="text-xs text-[var(--muted)]">by OpenAI</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-[var(--muted)]">
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-400 shrink-0" />
                    Highest quality output
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-400 shrink-0" />
                    Excellent prompt adherence
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-400 shrink-0" />
                    Superior detail & realism
                  </li>
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 7 — FINAL CTA
      ══════════════════════════════════════════════ */}
      <section className="py-24 md:py-40 px-4 relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-aurora-1 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-purple-600/15 blur-[180px]" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <FadeIn>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold font-[family-name:var(--font-syne)] leading-[0.95]">
              Ready to bring your
              <br />
              <span className="text-gradient-shimmer">imagination to life?</span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p className="mt-6 text-lg text-[var(--muted)] max-w-lg mx-auto">
              Sign in with Google and start generating stunning AI images in
              seconds. No credit card needed.
            </p>
          </FadeIn>
          <FadeIn delay={0.25}>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full font-semibold text-lg transition-all duration-200 animate-pulse-glow cursor-pointer text-white flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.06] py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--muted)]">
          <Link href="/" className="cursor-pointer shrink-0">
            <Image
              src="/Iart.png"
              alt="InstaArt"
              width={120}
              height={30}
              className="h-7 w-auto"
            />
          </Link>
          <p>&copy; {new Date().getFullYear()} InstaArt. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-white transition-colors cursor-pointer">
              Sign In
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors cursor-pointer">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
