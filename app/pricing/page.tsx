'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import PublicHeader from '@/components/PublicHeader'
import { CheckCircle, ArrowRight, Zap, RotateCcw, Lock } from 'lucide-react'

// Maps plan name (lowercase) + billing cycle → priceKey expected by /api/billing/checkout
const PLAN_PRICE_KEY: Record<string, Record<string, string>> = {
  creator: { monthly: 'creator_monthly', annual: 'creator_annual' },
  pro:     { monthly: 'pro_monthly',     annual: 'pro_annual'     },
  premium: { monthly: 'premium_monthly', annual: 'premium_annual' },
}

async function startCheckout(priceKey: string): Promise<void> {
  const res  = await fetch('/api/billing/checkout', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ priceKey }),
  })
  if (res.status === 401) { window.location.href = '/login'; return }
  const { url, error } = await res.json()
  if (error) throw new Error(error)
  window.location.href = url
}

async function startTopup(packId: string): Promise<void> {
  const res  = await fetch('/api/credits/topup', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ packId }),
  })
  if (res.status === 401) { window.location.href = '/login'; return }
  const { url, error } = await res.json()
  if (error) throw new Error(error)
  window.location.href = url
}

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
  credits: string
  creditsNote?: string
  rollover?: string
  desc: string
  modelAccess: string
  features: string[]
  examples: string[]
  cta: string
  highlight: boolean
  enterprise: boolean
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    credits: 'Hard caps',
    creditsNote: 'No credit wallet',
    desc: 'Start creating. No credit card required.',
    modelAccess: 'flux2klein images · bytedance v1 Lite videos',
    features: [
      '50 image generations / month',
      '3 video generations / month',
      '1 image model (FLUX.2 Klein)',
      '1 video model (ByteDance v1 Lite)',
      'Community support',
    ],
    examples: [],
    cta: 'Start Free',
    highlight: false,
    enterprise: false,
  },
  {
    name: 'Creator',
    monthlyPrice: 6.99,
    annualPrice: 4.99,
    annualSave: 24,
    credits: '2,000',
    creditsNote: 'credits / month',
    desc: 'For solo creators building a consistent content rhythm.',
    modelAccess: 'All standard models · Budget & standard band',
    features: [
      '2,000 credits / month',
      'All budget + standard image models',
      'Standard video models up to Kling 2.1',
      'Studio avatar video',
      'Email support',
    ],
    examples: [
      '~400 Riverflow Fast images',
      '~200 Seedream 4.5 images',
      '~9 Grok T2V videos',
      '~100 images + 5 videos mixed',
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
    credits: '5,000',
    creditsNote: 'credits / month',
    desc: 'For marketers and power creators who need premium quality.',
    modelAccess: 'Standard + premium models · Up to GPT-5 Image + Runway',
    features: [
      '5,000 credits / month',
      'All standard + premium image models',
      'Premium video up to Runway Turbo / Kling 2.6',
      'Studio avatar video',
      'Priority generation queue',
      'Priority support',
    ],
    examples: [
      '~119 GPT-5 Image generations',
      '~12 Runway Turbo videos',
      '~25 Kling 2.6 videos',
      '~50 FLUX.2 Max + 10 Kling videos',
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
    credits: '10,000',
    creditsNote: 'credits / month',
    rollover: 'Up to 2,500 cr rollover',
    desc: 'For agencies and studios running at full capacity.',
    modelAccess: 'All models · incl. Veo 3, Sora 2 Pro, Gemini 3 Pro',
    features: [
      '10,000 credits / month',
      'Roll over up to 2,500 unused credits',
      'Every model — including ultra-premium',
      'Veo 3, Sora 2 Pro, Gemini 3 Pro',
      'Studio + long-form avatar video',
      'Dedicated support',
    ],
    examples: [
      '~78 Gemini 3 Pro images ($0.12/ea)',
      '~11 Veo 3 Fast videos',
      '~6 Veo 3 HD videos',
      '~50 Kling 3 + 100 GPT-5 Image mixed',
    ],
    cta: 'Get Started',
    highlight: false,
    enterprise: false,
  },
  {
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    credits: '25,000+',
    creditsNote: 'credits / month minimum',
    desc: 'Custom contracts for large teams and organisations.',
    modelAccess: 'All models · custom endpoints · API access',
    features: [
      'Custom credit volume (min 25,000/mo)',
      '100% rollover within contract year',
      'API access + custom integrations',
      'SSO (SAML / OIDC)',
      'Custom model endpoints',
      'Dedicated CSM + SLA guarantee',
    ],
    examples: [],
    cta: 'Contact Sales',
    highlight: false,
    enterprise: true,
  },
]

/* ── Top-up packs ────────────────────────────────────────────── */
const TOPUPS = [
  { name: 'Spark',  credits: 500,   price: 1.49,  per: '$0.003/cr' },
  { name: 'Boost',  credits: 2000,  price: 4.99,  per: '$0.0025/cr' },
  { name: 'Power',  credits: 6000,  price: 12.99, per: '$0.0022/cr' },
  { name: 'Studio', credits: 15000, price: 29.99, per: '$0.002/cr', best: true },
]

/* ── Helpers ─────────────────────────────────────────────────── */
function formatPrice(plan: Plan, annual: boolean): string {
  const price = annual ? plan.annualPrice : plan.monthlyPrice
  if (price === null) return 'Custom'
  if (price === 0) return 'Free'
  return `$${price.toFixed(2)}`
}

/* ── Plan card ───────────────────────────────────────────────── */
function PlanCard({ plan, annual, loading, onCheckout }: {
  plan: Plan
  annual: boolean
  loading: boolean
  onCheckout: () => void
}) {
  const price    = formatPrice(plan, annual)
  const save     = annual && plan.annualSave ? plan.annualSave : null
  const isFree   = plan.monthlyPrice === 0 && plan.annualPrice === 0

  return (
    <motion.div
      variants={fadeRise}
      style={{
        background: plan.highlight ? '#0f2035' : '#0E1722',
        border: plan.highlight ? '1px solid #00b8d4' : '1px solid #1E2A3A',
        borderRadius: 18, padding: '26px 22px', display: 'flex', flexDirection: 'column',
        boxShadow: plan.highlight ? '0 0 52px rgba(0,196,204,0.1)' : 'none',
        position: 'relative',
      }}
    >
      {plan.highlight && (
        <div style={{
          position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg,#00b8d4,#00d8ec)',
          color: '#070e1a', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
          padding: '4px 14px', borderRadius: 99, whiteSpace: 'nowrap', textTransform: 'uppercase',
        }}>Most Popular</div>
      )}

      {/* Name + save badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 17, color: '#dceaf4' }}>
          {plan.name}
        </span>
        {save && (
          <span style={{
            background: 'rgba(0,196,204,0.09)', color: '#00b8d4',
            fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
            border: '1px solid rgba(0,196,204,0.18)', whiteSpace: 'nowrap',
          }}>Save ${save}/yr</span>
        )}
      </div>

      {/* Price */}
      <div style={{ marginBottom: 2 }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 38, color: '#dceaf4', lineHeight: 1 }}>
          {price}
        </span>
        {!plan.enterprise && !isFree && (
          <span style={{ color: '#4A5568', fontSize: 13, marginLeft: 4 }}>/mo</span>
        )}
      </div>
      <div style={{ fontSize: 12, color: '#4A5568', marginBottom: 16, minHeight: 18 }}>
        {annual && !plan.enterprise && !isFree && plan.annualPrice
          ? `Billed $${(plan.annualPrice * 12).toFixed(0)}/year`
          : !isFree && !plan.enterprise ? 'Billed monthly' : ''}
      </div>

      {/* Credits badge */}
      {!isFree && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16,
          background: 'rgba(0,196,204,0.06)', border: '1px solid rgba(0,196,204,0.14)',
          borderRadius: 8, padding: '8px 12px',
        }}>
          <Zap size={13} color="#00b8d4" />
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: '#00b8d4' }}>
            {plan.credits}
          </span>
          <span style={{ fontSize: 12, color: '#4A5568' }}>{plan.creditsNote}</span>
          {plan.rollover && (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#4a7a96' }}>
              <RotateCcw size={11} />{plan.rollover}
            </span>
          )}
        </div>
      )}
      {isFree && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16,
          background: 'rgba(39,50,66,0.4)', border: '1px solid #183048',
          borderRadius: 8, padding: '8px 12px',
        }}>
          <Lock size={12} color="#4A5568" />
          <span style={{ fontSize: 12, color: '#4a7a96' }}>Hard caps — no credit wallet</span>
        </div>
      )}

      {/* Desc */}
      <p style={{ fontSize: 13, color: '#4a7a96', lineHeight: 1.55, marginBottom: 18 }}>{plan.desc}</p>

      {/* CTA */}
      {plan.enterprise ? (
        <Link href="mailto:support@reelx.app" style={{
          background: '#dceaf4', color: '#00b8d4',
          fontWeight: 700, fontSize: 14,
          padding: '11px 0', borderRadius: 10, textDecoration: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          marginBottom: 22,
        }}>
          {plan.cta}
        </Link>
      ) : isFree ? (
        <Link href="/login" style={{
          background: '#dceaf4', color: '#00b8d4',
          fontWeight: 700, fontSize: 14,
          padding: '11px 0', borderRadius: 10, textDecoration: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          marginBottom: 22,
        }}>
          {plan.cta} <ArrowRight size={14} />
        </Link>
      ) : (
        <button
          onClick={onCheckout}
          disabled={loading}
          style={{
            background: '#dceaf4', color: '#00b8d4',
            fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'wait' : 'pointer',
            padding: '11px 0', borderRadius: 10, width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            marginBottom: 22, transition: 'background 0.2s, box-shadow 0.2s',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Redirecting…' : <>{plan.cta} <ArrowRight size={14} /></>}
        </button>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: '#1A2535', marginBottom: 18 }} />

      {/* Model access label */}
      <div style={{ fontSize: 11, fontWeight: 600, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Models included
      </div>
      <p style={{ fontSize: 12, color: '#4a7a96', lineHeight: 1.5, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #1A2535' }}>
        {plan.modelAccess}
      </p>

      {/* Features */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {plan.features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: '#00d8ec' }}>
            <CheckCircle size={13} color="#00b8d4" style={{ flexShrink: 0, marginTop: 1 }} />
            {f}
          </li>
        ))}
      </ul>

      {/* Usage examples */}
      {plan.examples.length > 0 && (
        <>
          <div style={{ height: 1, background: '#1A2535', margin: '18px 0 14px' }} />
          <div style={{ fontSize: 11, fontWeight: 600, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            What you can make
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {plan.examples.map(ex => (
              <li key={ex} style={{ fontSize: 12, color: '#4A5568', paddingLeft: 12, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: '#183048' }}>·</span>
                {ex}
              </li>
            ))}
          </ul>
        </>
      )}
    </motion.div>
  )
}

/* ── Page ────────────────────────────────────────────────────── */
export default function PricingPage() {
  const [annual, setAnnual]       = useState(true)
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  async function handlePlanCheckout(planName: string) {
    const cycle    = annual ? 'annual' : 'monthly'
    const priceKey = PLAN_PRICE_KEY[planName.toLowerCase()]?.[cycle]
    if (!priceKey) return
    setLoadingKey(priceKey)
    try { await startCheckout(priceKey) } finally { setLoadingKey(null) }
  }

  async function handleTopupCheckout(packId: string) {
    setLoadingKey(`topup_${packId}`)
    try { await startTopup(packId) } finally { setLoadingKey(null) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070e1a', color: '#dceaf4' }}>

      <PublicHeader />

      {/* ── Hero ── */}
      <section style={{ padding: '72px 32px 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 360, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,196,204,0.05) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

          <motion.p variants={fadeRise} style={{ fontSize: 11, fontWeight: 700, color: '#4a7a96', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Pricing
          </motion.p>
          <motion.h1 variants={fadeRise} style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(36px,5vw,58px)',
            fontWeight: 800, color: '#dceaf4', lineHeight: 1.08, margin: 0,
          }}>
            Flexible pricing that scales<br />with your needs
          </motion.h1>
          <motion.p variants={fadeRise} style={{ color: '#4a7a96', fontSize: 17, lineHeight: 1.6, maxWidth: 440, margin: 0 }}>
            Start free. Every paid plan runs on a unified credit wallet — one balance for images, videos, and avatar content.
          </motion.p>

          {/* Credit explainer pill */}
          <motion.div variants={fadeRise} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,196,204,0.07)', border: '1px solid rgba(0,196,204,0.18)',
            borderRadius: 99, padding: '6px 16px', marginTop: 4,
          }}>
            <Zap size={12} color="#00b8d4" />
            <span style={{ fontSize: 12, color: '#00b8d4', fontWeight: 500 }}>
              1 credit = $0.001 · cheapest image = 4 cr · cheapest video = 100 cr
            </span>
          </motion.div>

          {/* Billing toggle */}
          <motion.div variants={fadeRise} style={{
            display: 'flex', alignItems: 'center',
            background: '#0f2035', border: '1px solid #183048', borderRadius: 99,
            padding: '4px 6px', marginTop: 8,
          }}>
            <button onClick={() => setAnnual(false)} style={{
              padding: '7px 22px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: !annual ? '#dceaf4' : 'transparent',
              color: !annual ? '#070e1a' : '#4a7a96',
              transition: 'all 0.2s',
            }}>Monthly</button>
            <button onClick={() => setAnnual(true)} style={{
              padding: '7px 22px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: annual ? 'linear-gradient(135deg,#00b8d4,#00d8ec)' : 'transparent',
              color: annual ? '#070e1a' : '#4a7a96',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              Annual
              <span style={{
                background: annual ? 'rgba(11,15,20,0.2)' : 'transparent',
                color: annual ? '#070e1a' : '#4a7a96',
                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
              }}>Save up to 20%</span>
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Plans grid ── */}
      <section style={{ padding: '52px 24px 80px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <motion.div
            variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, alignItems: 'start' }}
          >
            {PLANS.map(plan => {
              const cycle    = annual ? 'annual' : 'monthly'
              const priceKey = PLAN_PRICE_KEY[plan.name.toLowerCase()]?.[cycle] ?? ''
              return (
                <PlanCard
                  key={plan.name}
                  plan={plan}
                  annual={annual}
                  loading={loadingKey === priceKey}
                  onCheckout={() => handlePlanCheckout(plan.name)}
                />
              )
            })}
          </motion.div>

          {annual && (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#3A4A5C', marginTop: 24 }}>
              Annual plans billed as one payment. Monthly plans billed each month. Cancel anytime.
            </p>
          )}
        </div>
      </section>

      {/* ── Top-up packs ── */}
      <section style={{ padding: '64px 32px', background: '#0D1520', borderTop: '1px solid #1E2A3A', borderBottom: '1px solid #1E2A3A' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <motion.div variants={fadeRise} style={{ textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 28, color: '#dceaf4', margin: '0 0 8px' }}>
                Need more credits?
              </h2>
              <p style={{ color: '#4a7a96', fontSize: 15, margin: 0 }}>
                Top-up packs work on any plan. No expiry for 12 months. No restrictions — use on any model.
              </p>
            </motion.div>

            <motion.div variants={stagger}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {TOPUPS.map(pack => (
                <motion.div key={pack.name} variants={fadeRise} style={{
                  background: pack.best ? '#0f2035' : '#101722',
                  border: pack.best ? '1px solid rgba(0,196,204,0.35)' : '1px solid #1E2A3A',
                  borderRadius: 14, padding: '22px 20px', position: 'relative',
                }}>
                  {pack.best && (
                    <div style={{
                      position: 'absolute', top: -10, right: 16,
                      background: 'rgba(0,196,204,0.12)', color: '#00b8d4',
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                      border: '1px solid rgba(0,196,204,0.25)',
                      padding: '3px 10px', borderRadius: 99, textTransform: 'uppercase',
                    }}>Best value</div>
                  )}
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: '#dceaf4', marginBottom: 6 }}>
                    {pack.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 28, color: '#dceaf4' }}>
                      ${pack.price}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 16 }}>
                    <Zap size={12} color="#00b8d4" />
                    <span style={{ fontSize: 14, color: '#00b8d4', fontWeight: 600 }}>{pack.credits.toLocaleString()} credits</span>
                    <span style={{ fontSize: 11, color: '#3A4A5C', marginLeft: 4 }}>· {pack.per}</span>
                  </div>
                  <button
                    onClick={() => handleTopupCheckout(pack.name.toLowerCase())}
                    disabled={loadingKey === `topup_${pack.name.toLowerCase()}`}
                    style={{
                      display: 'block', width: '100%', textAlign: 'center', border: 'none',
                      background: '#dceaf4', color: '#00b8d4', fontWeight: 700, fontSize: 13,
                      padding: '9px 0', borderRadius: 8, cursor: loadingKey === `topup_${pack.name.toLowerCase()}` ? 'wait' : 'pointer',
                      opacity: loadingKey === `topup_${pack.name.toLowerCase()}` ? 0.7 : 1,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#e4ecf4')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#dceaf4')}
                  >
                    {loadingKey === `topup_${pack.name.toLowerCase()}` ? 'Redirecting…' : 'Buy pack'}
                  </button>
                </motion.div>
              ))}
            </motion.div>

            <motion.p variants={fadeRise} style={{ textAlign: 'center', fontSize: 12, color: '#3A4A5C' }}>
              Top-up credits expire 12 months after purchase · Non-refundable · No auto-renewal
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Model access matrix ── */}
      <section style={{ padding: '72px 32px', background: '#070e1a' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <motion.h2
            variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 28, color: '#dceaf4', textAlign: 'center', marginBottom: 8 }}
          >
            Model access by plan
          </motion.h2>
          <motion.p
            variants={fadeRise} initial="hidden" whileInView="show" viewport={{ once: true }}
            style={{ textAlign: 'center', color: '#4a7a96', fontSize: 15, marginBottom: 40 }}
          >
            Each tier unlocks a wider set of models. Ultra-premium video (Veo 3, Sora 2 Pro) requires Premium.
          </motion.p>

          <motion.div
            variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          >
            {[
              {
                tier: 'Free', color: '#3A4A5C',
                image: 'FLUX.2 Klein only',
                video: 'ByteDance v1 Lite only',
              },
              {
                tier: 'Creator', color: '#4a7a96',
                image: 'Budget + standard (FLUX.2 Klein → Riverflow Max)',
                video: 'Standard (up to Kling 2.1 / Grok T2V)',
              },
              {
                tier: 'Pro', color: '#00d8ec',
                image: 'Standard + premium (up to GPT-5 Image)',
                video: 'Premium (up to Runway Turbo / Kling 2.6)',
              },
              {
                tier: 'Premium', color: '#00b8d4',
                image: 'All — incl. Gemini 3 Pro ($0.12/gen)',
                video: 'All — incl. Veo 3, Sora 2 Pro, Kling 3 Audio',
              },
            ].map((row, i) => (
              <motion.div key={row.tier} variants={fadeRise} style={{
                display: 'grid', gridTemplateColumns: '100px 1fr 1fr',
                gap: 0, borderBottom: i < 3 ? '1px solid #1A2535' : 'none',
                padding: '16px 0',
              }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: row.color, display: 'flex', alignItems: 'center' }}>
                  {row.tier}
                </span>
                <div style={{ paddingRight: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#3A4A5C', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Images</div>
                  <div style={{ fontSize: 13, color: '#4a7a96', lineHeight: 1.5 }}>{row.image}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#3A4A5C', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Videos</div>
                  <div style={{ fontSize: 13, color: '#4a7a96', lineHeight: 1.5 }}>{row.video}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Footer strip ── */}
      <div style={{ borderTop: '1px solid #1E2A3A', padding: '40px 32px', background: '#0D1520', textAlign: 'center' }}>
        <p style={{ fontSize: 15, color: '#4a7a96', margin: '0 0 6px' }}>
          Need a custom contract, white-label, or 25,000+ credits/month?
        </p>
        <Link href="#" style={{ fontSize: 15, color: '#00b8d4', textDecoration: 'none', fontWeight: 600 }}>
          Talk to our team →
        </Link>
      </div>
    </div>
  )
}
