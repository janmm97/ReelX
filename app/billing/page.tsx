'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface BalanceData {
  balance: number
  plan: string
  billing_cycle: string
  credits_per_month: number
  rollover_max: number
  status: string
  period_ends_at: string | null
}

interface Plan {
  name: string
  key: string
  monthlyPrice: number | null
  annualPrice: number | null
  credits: string
  creditsNote: string
  desc: string
  features: string[]
  highlight: boolean
  enterprise: boolean
}

const PLANS: Plan[] = [
  {
    name: 'Creator',
    key: 'creator',
    monthlyPrice: 6.99,
    annualPrice: 4.99,
    credits: '2,000',
    creditsNote: 'credits / month',
    desc: 'For solo creators building a consistent content rhythm.',
    features: ['2,000 credits / month', 'All budget + standard image models', 'Standard video models up to Kling 2.1', 'Studio avatar video', 'Email support'],
    highlight: false,
    enterprise: false,
  },
  {
    name: 'Pro',
    key: 'pro',
    monthlyPrice: 11.99,
    annualPrice: 9.99,
    credits: '5,000',
    creditsNote: 'credits / month',
    desc: 'For marketers and power creators who need premium quality.',
    features: ['5,000 credits / month', 'All standard + premium image models', 'Premium video up to Runway Turbo / Kling 2.6', 'Studio avatar video', 'Priority generation queue', 'Priority support'],
    highlight: true,
    enterprise: false,
  },
  {
    name: 'Premium',
    key: 'premium',
    monthlyPrice: 24.99,
    annualPrice: 19.99,
    credits: '10,000',
    creditsNote: 'credits / month',
    desc: 'For agencies and studios running at full capacity.',
    features: ['10,000 credits / month', 'Roll over up to 2,500 unused credits', 'Every model — including ultra-premium', 'Veo 3, Sora 2 Pro, Gemini 3 Pro', 'Studio + long-form avatar video', 'Dedicated support'],
    highlight: false,
    enterprise: false,
  },
  {
    name: 'Enterprise',
    key: 'enterprise',
    monthlyPrice: null,
    annualPrice: null,
    credits: '25,000+',
    creditsNote: 'credits / month minimum',
    desc: 'Custom contracts for large teams and organisations.',
    features: ['Custom credit volume (min 25,000/mo)', '100% rollover within contract year', 'API access + custom integrations', 'SSO (SAML / OIDC)', 'Custom model endpoints', 'Dedicated CSM + SLA guarantee'],
    highlight: false,
    enterprise: true,
  },
]

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  free: 'Free',
  creator: 'Creator',
  pro: 'Pro',
  premium: 'Premium',
  enterprise: 'Enterprise',
}

// Fallback credits_per_month by plan key, used when the DB column is 0/null
const PLAN_CREDITS: Record<string, number> = {
  creator: 2000,
  pro: 5000,
  premium: 10000,
  enterprise: 25000,
}

async function startCheckout(priceKey: string): Promise<void> {
  const res = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceKey }),
  })
  if (res.status === 401) { window.location.href = '/login'; return }
  const { url, error } = await res.json()
  if (error) throw new Error(error)
  window.location.href = url
}

export default function BillingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [annual, setAnnual] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      fetch('/api/credits/balance')
        .then(r => r.json())
        .then(data => { setBalance(data); setLoading(false) })
        .catch(() => setLoading(false))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleUpgrade(plan: Plan) {
    if (plan.enterprise) {
      window.location.href = 'mailto:support@reelx.app?subject=Enterprise%20Inquiry'
      return
    }
    const priceKey = `${plan.key}_${annual ? 'annual' : 'monthly'}`
    setCheckoutLoading(priceKey)
    setError(null)
    try {
      await startCheckout(priceKey)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed')
      setCheckoutLoading(null)
    }
  }

  const currentPlan = balance?.plan ?? 'free'
  const creditsPerMonth = balance?.credits_per_month || PLAN_CREDITS[currentPlan] || 0
  const usedCredits = creditsPerMonth > 0 ? Math.max(0, creditsPerMonth - (balance?.balance ?? 0)) : 0
  const usagePercent = creditsPerMonth > 0 ? Math.min(100, (usedCredits / creditsPerMonth) * 100) : 0

  const resetDate = balance?.period_ends_at
    ? new Date(balance.period_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen text-white" style={{ background: '#070e1a', fontFamily: 'var(--font-body-text)' }}>

      {/* Header */}
      <header style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', background: '#101722', borderBottom: '1px solid #183048',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Image src="/brand/reelx-icon.png" alt="Reelx" width={24} height={24} style={{ objectFit: 'contain' }} />
          </Link>
          <span style={{ color: '#183048', fontSize: 14 }}>/</span>
          <span style={{ color: '#dceaf4', fontSize: 14, fontWeight: 600 }}>Billing</span>
        </div>
        <Link href="/dashboard" style={{ fontSize: 13, color: '#4a7a96', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#dceaf4')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4a7a96')}
        >
          ← Back to Dashboard
        </Link>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>

        {/* Credits card */}
        <section style={{
          background: '#101722', border: '1px solid #183048', borderRadius: 16,
          padding: '28px 32px', marginBottom: 32,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: '#dceaf4', margin: '0 0 4px' }}>
                Your Credits
              </h2>
              <p style={{ fontSize: 13, color: '#4a7a96', margin: 0 }}>
                Current plan: <span style={{ color: '#00b8d4', fontWeight: 600 }}>{PLAN_DISPLAY_NAMES[currentPlan] ?? currentPlan}</span>
                {balance?.status === 'active' ? '' : ` · ${balance?.status ?? ''}`}
              </p>
            </div>
            {loading ? (
              <div style={{ width: 100, height: 40, borderRadius: 8, background: '#1a2233', animation: 'pulse 1.5s infinite' }} />
            ) : (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 800, color: '#dceaf4', lineHeight: 1 }}>
                  {(balance?.balance ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: '#4a7a96', marginTop: 3 }}>credits remaining</div>
              </div>
            )}
          </div>

          {/* Usage bar */}
          {creditsPerMonth > 0 ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#4a7a96' }}>
                  {usedCredits.toLocaleString()} used of {creditsPerMonth.toLocaleString()} / month
                </span>
                <span style={{ fontSize: 12, color: '#4a7a96' }}>
                  {Math.round(usagePercent)}%
                </span>
              </div>
              <div style={{ height: 8, background: '#1a2233', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${usagePercent}%`,
                  borderRadius: 99,
                  background: usagePercent > 80
                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                    : 'linear-gradient(90deg, #00b8d4, #00d8ec)',
                  transition: 'width 0.4s ease',
                }} />
              </div>
              {resetDate && (
                <p style={{ fontSize: 12, color: '#4a7a96', marginTop: 8 }}>
                  Resets on <span style={{ color: '#00d8ec' }}>{resetDate}</span>
                </p>
              )}
            </div>
          ) : currentPlan === 'free' ? (
            <div style={{ padding: '12px 16px', borderRadius: 10, background: '#070e1a', border: '1px solid #183048' }}>
              <p style={{ fontSize: 13, color: '#4a7a96', margin: 0 }}>
                You&apos;re on the <strong style={{ color: '#dceaf4' }}>Free</strong> plan with usage caps — no credit wallet. Upgrade to get a monthly credit balance.
              </p>
            </div>
          ) : null}
        </section>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: '#fca5a5', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Billing cycle toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: '#dceaf4', margin: 0 }}>
            Plans
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: annual ? '#4a7a96' : '#dceaf4' }}>Monthly</span>
            <button
              onClick={() => setAnnual(prev => !prev)}
              style={{
                width: 44, height: 24, borderRadius: 99,
                background: annual ? 'linear-gradient(135deg, #00b8d4, #00d8ec)' : '#183048',
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
              }}
            >
              <span style={{
                position: 'absolute', top: 3, left: annual ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s',
              }} />
            </button>
            <span style={{ fontSize: 13, color: annual ? '#dceaf4' : '#4a7a96' }}>
              Annual <span style={{ fontSize: 11, color: '#00b8d4', fontWeight: 600 }}>Save ~24%</span>
            </span>
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {PLANS.map(plan => {
            const isCurrent = currentPlan === plan.key
            const price = annual ? plan.annualPrice : plan.monthlyPrice
            const priceKey = `${plan.key}_${annual ? 'annual' : 'monthly'}`
            const isLoading = checkoutLoading === priceKey

            return (
              <div
                key={plan.key}
                style={{
                  background: plan.highlight ? 'linear-gradient(135deg, rgba(0,196,204,0.08), rgba(139,92,246,0.08))' : '#101722',
                  border: plan.highlight ? '1px solid rgba(0,196,204,0.3)' : isCurrent ? '1px solid rgba(0,196,204,0.5)' : '1px solid #183048',
                  borderRadius: 16, padding: '24px 20px',
                  display: 'flex', flexDirection: 'column', gap: 16,
                  position: 'relative',
                }}
              >
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #00b8d4, #00d8ec)',
                    borderRadius: '0 0 8px 8px', padding: '3px 12px',
                    fontSize: 10, fontWeight: 700, color: '#070e1a', letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}>
                    MOST POPULAR
                  </div>
                )}
                {isCurrent && !plan.highlight && (
                  <div style={{
                    position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                    background: '#183048',
                    borderRadius: '0 0 8px 8px', padding: '3px 12px',
                    fontSize: 10, fontWeight: 700, color: '#00d8ec', letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}>
                    CURRENT PLAN
                  </div>
                )}

                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#dceaf4', margin: '0 0 4px' }}>
                    {plan.name}
                  </h3>
                  <p style={{ fontSize: 12, color: '#4a7a96', margin: 0, lineHeight: 1.4 }}>{plan.desc}</p>
                </div>

                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: '#dceaf4', lineHeight: 1 }}>
                    {price === null ? 'Custom' : price === 0 ? 'Free' : `$${price.toFixed(2)}`}
                  </div>
                  {price !== null && price > 0 && (
                    <div style={{ fontSize: 11, color: '#4a7a96', marginTop: 3 }}>per month, billed {annual ? 'annually' : 'monthly'}</div>
                  )}
                  <div style={{ fontSize: 12, color: '#00b8d4', marginTop: 6, fontWeight: 600 }}>
                    {plan.credits} <span style={{ color: '#4a7a96', fontWeight: 400 }}>{plan.creditsNote}</span>
                  </div>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#00d8ec' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                        <path d="M2 6l3 3 5-5" stroke="#00b8d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={isCurrent || isLoading}
                  style={{
                    width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    cursor: isCurrent || isLoading ? 'default' : 'pointer',
                    background: isCurrent
                      ? '#1a2233'
                      : plan.enterprise
                      ? 'none'
                      : plan.highlight
                      ? 'linear-gradient(135deg, #00b8d4, #00d8ec)'
                      : '#1a2233',
                    border: isCurrent
                      ? '1px solid #183048'
                      : plan.enterprise
                      ? '1px solid #183048'
                      : plan.highlight
                      ? 'none'
                      : '1px solid #183048',
                    color: isCurrent ? '#4a7a96' : plan.highlight ? '#070e1a' : '#dceaf4',
                    opacity: isCurrent ? 0.6 : 1,
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { if (!isCurrent && !isLoading) e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={e => { if (!isCurrent && !isLoading) e.currentTarget.style.opacity = '1' }}
                >
                  {isLoading ? 'Loading…' : isCurrent ? 'Current Plan' : plan.enterprise ? 'Contact Sales' : 'Upgrade'}
                </button>
              </div>
            )
          })}
        </div>

        <p style={{ fontSize: 12, color: '#4a5568', textAlign: 'center', marginTop: 24 }}>
          Prices in USD · Cancel or change plan anytime · Secured by Stripe
        </p>
      </main>
    </div>
  )
}
