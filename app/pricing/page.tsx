'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Zap } from 'lucide-react'

/* ── Motion helpers ──────────────────────────────────────────── */
const fadeRise = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
}
const stagger = { show: { transition: { staggerChildren: 0.07 } } }

/* ── Plan data ───────────────────────────────────────────────── */
interface Plan {
  name: string
  monthlyPrice: number | null
  annualPrice:  number | null
  annualSave?:  number
  desc: string
  features: string[]
  cta: string
  highlight: boolean
  enterprise: boolean
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    desc: 'Start creating with AI, no credit card required.',
    features: [
      '50 image credits / month',
      '10 video credits / month',
      'Access to 3 base models',
      '1 workspace',
      'Community support',
    ],
    cta: 'Get Started',
    highlight: false,
    enterprise: false,
  },
  {
    name: 'Creator',
    monthlyPrice: 6.99,
    annualPrice: 4.99,
    annualSave: 24,
    desc: 'For solo creators shipping regular content.',
    features: [
      '300 image credits / month',
      '50 video credits / month',
      '10+ models incl. GPT-5 Image',
      'Studio access',
      '1 workspace',
      'Email support',
    ],
    cta: 'Get Started',
    highlight: false,
    enterprise: false,
  },
  {
    name: 'Pro',
    monthlyPrice: 11.99,
    annualPrice: 9.99,
    annualSave: 24,
    desc: 'For marketers and creators operating at scale.',
    features: [
      '1,000 image credits / month',
      '200 video credits / month',
      '20+ models incl. Gemini 3 Pro',
      'Studio + avatar video',
      'Priority generation queue',
      '3 workspaces',
      'Priority support',
    ],
    cta: 'Get Started',
    highlight: true,
    enterprise: false,
  },
  {
    name: 'Premium',
    monthlyPrice: 24.99,
    annualPrice: 19.99,
    annualSave: 60,
    desc: 'For agencies and power users with volume needs.',
    features: [
      'Unlimited images',
      '1,000 video credits / month',
      'All models incl. Veo 3.1 & Sora 2',
      'Studio + avatar video',
      'API access',
      'Unlimited workspaces',
      'Dedicated support',
    ],
    cta: 'Get Started',
    highlight: false,
    enterprise: false,
  },
  {
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    desc: 'Custom pricing for large teams and organisations.',
    features: [
      'Unlimited everything',
      'Custom model fine-tuning',
      'Dedicated workspace + SSO',
      'SLA & uptime guarantees',
      'Custom integrations & API',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    highlight: false,
    enterprise: true,
  },
]

/* ── Price display ───────────────────────────────────────────── */
function formatPrice(plan: Plan, annual: boolean): string {
  const price = annual ? plan.annualPrice : plan.monthlyPrice
  if (price === null) return 'Custom'
  if (price === 0) return 'Free'
  return `$${price.toFixed(2)}`
}

/* ── Plan card ───────────────────────────────────────────────── */
function PlanCard({ plan, annual }: { plan: Plan; annual: boolean }) {
  const price = formatPrice(plan, annual)
  const save  = annual && plan.annualSave ? plan.annualSave : null

  return (
    <motion.div
      variants={fadeRise}
      style={{
        background: plan.highlight ? '#141D28' : '#101722',
        border: plan.highlight ? '1px solid #00C4CC' : '1px solid #273242',
        borderRadius: 18, padding: 28, display: 'flex', flexDirection: 'column', gap: 0,
        boxShadow: plan.highlight ? '0 0 48px rgba(0,196,204,0.1)' : 'none',
        position: 'relative',
      }}
    >
      {plan.highlight && (
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg,#00C4CC,#00F2FE)',
          color: '#0B0F14', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
          padding: '4px 14px', borderRadius: 99, whiteSpace: 'nowrap',
        }}>
          Most Popular
        </div>
      )}

      {/* Plan name + save badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 18, color: '#F4F8FB' }}>
          {plan.name}
        </span>
        {save && (
          <span style={{
            background: 'rgba(0,196,204,0.1)', color: '#00C4CC',
            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
            border: '1px solid rgba(0,196,204,0.2)',
          }}>
            Save ${save}/year
          </span>
        )}
      </div>

      {/* Price */}
      <div style={{ marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 36, color: '#F4F8FB' }}>
          {price}
        </span>
        {!plan.enterprise && price !== 'Free' && (
          <span style={{ color: '#738295', fontSize: 14, marginLeft: 4 }}>/mo</span>
        )}
      </div>
      {annual && !plan.enterprise && plan.annualPrice !== null && plan.annualPrice > 0 && (
        <div style={{ fontSize: 12, color: '#738295', marginBottom: 16 }}>
          Billed ${(plan.annualPrice! * 12).toFixed(0)}/year
        </div>
      )}
      {(!annual || plan.enterprise || price === 'Free') && (
        <div style={{ height: 20, marginBottom: 16 }} />
      )}

      {/* Description */}
      <p style={{ fontSize: 13, color: '#738295', lineHeight: 1.55, marginBottom: 20 }}>{plan.desc}</p>

      {/* CTA */}
      <Link
        href={plan.enterprise ? '#' : '/login'}
        style={{
          background: '#F4F8FB', color: '#00C4CC',
          fontWeight: 700, fontSize: 14,
          padding: '11px 0', borderRadius: 10, textDecoration: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          marginBottom: 24, border: 'none',
          transition: 'background 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#e4ecf4'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(244,248,251,0.1)' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#F4F8FB'; e.currentTarget.style.boxShadow = 'none' }}
      >
        {plan.cta} {!plan.enterprise && <ArrowRight size={14} />}
      </Link>

      {/* Divider */}
      <div style={{ height: 1, background: '#1E2A3A', marginBottom: 20 }} />

      {/* Features */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {plan.features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#A7B4C2' }}>
            <CheckCircle size={14} color="#00C4CC" style={{ flexShrink: 0, marginTop: 1 }} />
            {f}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

/* ── Page ────────────────────────────────────────────────────── */
export default function PricingPage() {
  const [annual, setAnnual] = useState(true)

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F14', color: '#F4F8FB' }}>

      {/* ── Nav ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(11,15,20,0.9)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid #273242', padding: '0 32px',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/">
            <Image src="/For Rebranding/reelsy-logo-white-txt.png" alt="Reelsy" width={100} height={28} style={{ objectFit: 'contain' }} />
          </Link>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/login" style={{ color: '#F4F8FB', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
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

      {/* ── Hero text ── */}
      <section style={{ padding: '72px 32px 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Bloom */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 400, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,196,204,0.055) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <motion.p variants={fadeRise} style={{ fontSize: 11, fontWeight: 700, color: '#738295', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Pricing
          </motion.p>
          <motion.h1 variants={fadeRise} style={{
            fontFamily: 'var(--font-syne)', fontSize: 'clamp(36px,5vw,60px)',
            fontWeight: 800, color: '#F4F8FB', lineHeight: 1.08, margin: 0,
          }}>
            Flexible pricing that scales<br />with your team
          </motion.h1>
          <motion.p variants={fadeRise} style={{ color: '#738295', fontSize: 17, lineHeight: 1.6, maxWidth: 480, margin: 0 }}>
            Start free, upgrade when you're ready. No surprises.
          </motion.p>

          {/* Billing toggle */}
          <motion.div variants={fadeRise} style={{
            display: 'flex', alignItems: 'center', gap: 12, marginTop: 8,
            background: '#141D28', border: '1px solid #273242', borderRadius: 99,
            padding: '4px 6px',
          }}>
            <button
              onClick={() => setAnnual(false)}
              style={{
                padding: '7px 20px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: !annual ? '#F4F8FB' : 'transparent',
                color: !annual ? '#0B0F14' : '#738295',
                transition: 'all 0.2s',
              }}
            >Monthly</button>
            <button
              onClick={() => setAnnual(true)}
              style={{
                padding: '7px 20px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: annual ? 'linear-gradient(135deg,#00C4CC,#00F2FE)' : 'transparent',
                color: annual ? '#0B0F14' : '#738295',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              Annual
              {annual && (
                <span style={{
                  background: 'rgba(11,15,20,0.2)', color: '#0B0F14',
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                }}>Save up to 20%</span>
              )}
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Plans grid ── */}
      <section style={{ padding: '56px 32px 96px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div
            variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 18, alignItems: 'start' }}
          >
            {PLANS.map(plan => (
              <PlanCard key={plan.name} plan={plan} annual={annual} />
            ))}
          </motion.div>

          {/* Annual note */}
          {annual && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.4 } }}
              style={{ textAlign: 'center', fontSize: 13, color: '#4A5568', marginTop: 28 }}
            >
              Annual plans billed as a single payment. Monthly plans billed each month.
            </motion.p>
          )}
        </div>
      </section>

      {/* ── FAQ / footer strip ── */}
      <div style={{ borderTop: '1px solid #273242', padding: '40px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#738295', margin: '0 0 8px' }}>
          Questions about our plans?
        </p>
        <Link href="#" style={{ fontSize: 14, color: '#00C4CC', textDecoration: 'none', fontWeight: 500 }}>
          Talk to us →
        </Link>
      </div>
    </div>
  )
}
