'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Tab = 'image' | 'video' | '3d'

type Model =
  | 'flux2klein'
  | 'riverflowfast'
  | 'riverflowfastpreview'
  | 'flux2pro'
  | 'gpt5mini'
  | 'riverflowstandard'
  | 'seedream'
  | 'flux2flex'
  | 'flux2max'
  | 'riverflowmax'
  | 'gemini25flash'
  | 'riverflowp'
  | 'gpt5'
  | 'gemini'
  | 'gemini3pro'

type Resolution = '512×512' | '768×768' | '1024×1024' | '1024×1792' | '1792×1024'
type AspectRatio = '1:1 Square' | '4:3 Landscape' | '3:4 Portrait' | '16:9 Widescreen' | '9:16 Vertical'

interface HistoryImage {
  id: string
  prompt: string
  image_url: string
  model: string
  created_at: string
  status: string
}

interface UserProfile {
  email: string
  avatar_url: string | null
  name: string | null
}

interface Toast {
  id: string
  message: string
  type: 'error' | 'success' | 'info'
}

type Tier = 'budget' | 'standard' | 'premium'

const MODELS: {
  id: Model
  label: string
  badge: string
  desc: string
  color: string
  tier: Tier
  cost: string
}[] = [
  // ── Budget ────────────────────────────────────────────────────
  {
    id: 'flux2klein',
    label: 'FLUX.2 Klein 4B',
    badge: 'Black Forest',
    desc: 'Fastest & cheapest — great for rapid iteration and drafts.',
    color: 'from-slate-400 to-zinc-400',
    tier: 'budget',
    cost: '$3.42/M',
  },
  {
    id: 'riverflowfast',
    label: 'Riverflow v2 Fast',
    badge: 'Sourceful',
    desc: 'Speedy Sourceful model optimised for volume generation.',
    color: 'from-teal-500 to-cyan-400',
    tier: 'budget',
    cost: '$4.79/M',
  },
  {
    id: 'riverflowfastpreview',
    label: 'Riverflow v2 Fast Preview',
    badge: 'Sourceful',
    desc: 'Preview of the fast tier with improved prompt adherence.',
    color: 'from-cyan-500 to-sky-400',
    tier: 'budget',
    cost: '$7.19/M',
  },
  {
    id: 'flux2pro',
    label: 'FLUX.2 Pro',
    badge: 'Black Forest',
    desc: 'Pro-grade FLUX model — high fidelity at a budget price point.',
    color: 'from-zinc-400 to-slate-500',
    tier: 'budget',
    cost: '$7.32/M',
  },
  {
    id: 'gpt5mini',
    label: 'GPT-5 Image Mini',
    badge: 'OpenAI',
    desc: 'Lightweight GPT-5 image model — excellent quality for the cost.',
    color: 'from-emerald-500 to-green-400',
    tier: 'budget',
    cost: '$8/M img',
  },
  {
    id: 'riverflowstandard',
    label: 'Riverflow v2 Standard',
    badge: 'Sourceful',
    desc: 'Balanced quality and speed — ideal everyday creative model.',
    color: 'from-sky-500 to-indigo-400',
    tier: 'budget',
    cost: '$8.38/M',
  },
  {
    id: 'seedream',
    label: 'Seedream 4.5',
    badge: 'ByteDance',
    desc: 'Vibrant aesthetics and rich color — great for artistic styles.',
    color: 'from-orange-500 to-pink-500',
    tier: 'budget',
    cost: '$9.58/M',
  },
  // ── Standard ──────────────────────────────────────────────────
  {
    id: 'flux2flex',
    label: 'FLUX.2 Flex',
    badge: 'Black Forest',
    desc: 'Flexible FLUX model with high context window and quality output.',
    color: 'from-violet-500 to-purple-400',
    tier: 'standard',
    cost: '$14.65/M',
  },
  {
    id: 'flux2max',
    label: 'FLUX.2 Max',
    badge: 'Black Forest',
    desc: 'Maximum quality FLUX generation — ultra-sharp details.',
    color: 'from-purple-500 to-violet-600',
    tier: 'standard',
    cost: '$17.09/M',
  },
  {
    id: 'riverflowmax',
    label: 'Riverflow v2 Max',
    badge: 'Sourceful',
    desc: 'Top-tier Sourceful model — studio output with resolution control.',
    color: 'from-fuchsia-500 to-rose-400',
    tier: 'standard',
    cost: '$17.96/M',
  },
  // ── Premium ───────────────────────────────────────────────────
  {
    id: 'gemini25flash',
    label: 'Gemini 2.5 Flash',
    badge: 'Google',
    desc: "Google's latest Flash — sharp multimodal output with 33K context.",
    color: 'from-blue-500 to-cyan-400',
    tier: 'premium',
    cost: '$30/M img',
  },
  {
    id: 'riverflowp',
    label: 'Riverflow v2 P',
    badge: 'Sourceful',
    desc: "Sourceful's flagship — highest fidelity with font & ref support.",
    color: 'from-rose-500 to-orange-400',
    tier: 'premium',
    cost: '$35.93/M',
  },
  {
    id: 'gpt5',
    label: 'GPT-5 Image',
    badge: 'OpenAI',
    desc: 'Full GPT-5 image — best-in-class photorealism and prompt control.',
    color: 'from-emerald-600 to-teal-500',
    tier: 'premium',
    cost: '$40/M img',
  },
  {
    id: 'gemini',
    label: 'Gemini 3.1 Flash',
    badge: 'Google',
    desc: "Google's flagship Flash — 66K context, fast creative generation.",
    color: 'from-sky-500 to-blue-500',
    tier: 'premium',
    cost: '$60/M img',
  },
  {
    id: 'gemini3pro',
    label: 'Gemini 3 Pro',
    badge: 'Google',
    desc: "Google's Pro tier — superior text-in-image and 4K output quality.",
    color: 'from-violet-600 to-blue-600',
    tier: 'premium',
    cost: '$120/M img',
  },
]

const TIER_LABEL: Record<Tier, string> = {
  budget: '💚 Budget',
  standard: '🟡 Standard',
  premium: '🔴 Premium',
}

// ── Video models ─────────────────────────────────────────────────────────────

type VideoModel = 'runway_turbo' | 'runway_aleph' | 'veo3_fast' | 'veo3'

interface VideoModelDef {
  id: VideoModel
  label: string
  badge: string
  desc: string
  color: string
  tier: Tier
}

const VIDEO_MODELS: VideoModelDef[] = [
  {
    id: 'runway_turbo',
    label: 'Runway Gen4 Turbo',
    badge: 'Runway',
    desc: 'Fast cinematic video with precise motion control. 5–10s, up to 1080p.',
    color: 'from-orange-500 to-amber-400',
    tier: 'budget',
  },
  {
    id: 'runway_aleph',
    label: 'Runway Aleph',
    badge: 'Runway',
    desc: 'Advanced Runway model — high-fidelity scenes with complex motion.',
    color: 'from-violet-500 to-purple-400',
    tier: 'standard',
  },
  {
    id: 'veo3_fast',
    label: 'Veo 3.1 Fast',
    badge: 'Google',
    desc: "Google Veo 3.1 Fast — quick generation with audio, 8s clips.",
    color: 'from-sky-500 to-cyan-400',
    tier: 'standard',
  },
  {
    id: 'veo3',
    label: 'Veo 3.1 Quality',
    badge: 'Google',
    desc: "Google Veo 3.1 Quality — richer detail, smoother motion, accurate lighting.",
    color: 'from-blue-600 to-indigo-500',
    tier: 'premium',
  },
]

// ── 3D models ─────────────────────────────────────────────────────────────────

type ThreeDModel = 'tripo3d' | 'meshy4' | 'shape' | 'zero123pp' | 'stable3d'

interface ThreeDModelDef {
  id: ThreeDModel
  label: string
  badge: string
  desc: string
  color: string
  tier: Tier
}

const THREE_D_MODELS: ThreeDModelDef[] = [
  {
    id: 'tripo3d',
    label: 'TripoSG',
    badge: 'Tripo3D',
    desc: 'High-fidelity text-to-3D in seconds. Supports mesh, PBR, and glTF export.',
    color: 'from-cyan-500 to-blue-400',
    tier: 'budget',
  },
  {
    id: 'shape',
    label: 'Shap-E',
    badge: 'OpenAI',
    desc: "OpenAI's generative 3D model — fast implicit & mesh output from prompts.",
    color: 'from-emerald-500 to-teal-400',
    tier: 'budget',
  },
  {
    id: 'stable3d',
    label: 'Stable Zero123',
    badge: 'Stability AI',
    desc: 'Single-image to 3D object. Excellent for product and character assets.',
    color: 'from-violet-500 to-purple-400',
    tier: 'standard',
  },
  {
    id: 'zero123pp',
    label: 'Zero123++',
    badge: 'Zero123',
    desc: 'Multi-view consistent 3D from a single image with high geometric accuracy.',
    color: 'from-sky-500 to-indigo-400',
    tier: 'standard',
  },
  {
    id: 'meshy4',
    label: 'Meshy 4',
    badge: 'Meshy',
    desc: "Meshy's flagship — text-to-3D with textures, rigging, and animation-ready output.",
    color: 'from-rose-500 to-pink-400',
    tier: 'premium',
  },
]

// ── Toast hook ──────────────────────────────────────────────────────────────
function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
  }, [])

  const push = useCallback((message: string, type: Toast['type'] = 'info', duration = 4000) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    const timer = setTimeout(() => dismiss(id), duration)
    timers.current.set(id, timer)
  }, [dismiss])

  return { toasts, push, dismiss }
}

// ── Download helper ──────────────────────────────────────────────────────────
async function downloadImage(url: string, filename = 'instaart.png') {
  if (url.startsWith('data:')) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    return
  }
  const blob = await fetch(url).then((r) => r.blob())
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  a.click()
  URL.revokeObjectURL(blobUrl)
}

// ── Main component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const { toasts, push, dismiss } = useToasts()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState<Model>('gemini')
  const [tab, setTab] = useState<Tab>('image')
  const [videoModel, setVideoModel] = useState<VideoModel>('runway_turbo')
  const [threeDModel, setThreeDModel] = useState<ThreeDModel>('tripo3d')
  const [resolution, setResolution] = useState<Resolution>('1024×1024')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1 Square')
  const [loading, setLoading] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [currentImage, setCurrentImage] = useState<{ url: string; prompt: string } | null>(null)
  const [currentVideo, setCurrentVideo] = useState<{ url: string; prompt: string } | null>(null)
  const [history, setHistory] = useState<HistoryImage[]>([])
  const [expanded, setExpanded] = useState<HistoryImage | null>(null)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.push('/login'); return }
      setUser({
        email: u.email ?? '',
        avatar_url: u.user_metadata?.avatar_url ?? null,
        name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? null,
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    const { data } = await supabase
      .from('images')
      .select('id, prompt, image_url, model, created_at, status')
      .eq('status', 'done')
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .limit(30)
    setHistory((data as HistoryImage[]) ?? [])
    setHistoryLoading(false)
  }, [supabase])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleGenerate() {
    if (!prompt.trim() || loading) return
    setLoading(true)

    if (tab === 'video') {
      setLastError(null)
      try {
        const res = await fetch('/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt.trim(), model: videoModel, aspectRatio }),
        })
        const data = await res.json()
        if (!res.ok) {
          const msg = res.status === 429
            ? 'Daily limit reached — come back tomorrow!'
            : (data.error ?? 'Video generation failed')
          setLastError(msg)
          push(msg, 'error')
          return
        }
        setLastError(null)
        setCurrentVideo({ url: data.videoUrl, prompt: prompt.trim() })
        fetchHistory()
        push('Video generated!', 'success', 3000)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong, try again!'
        setLastError(msg)
        push(msg, 'error')
      } finally {
        setLoading(false)
      }
      return
    }
    setLastError(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), model }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429) {
          push('Daily limit reached — come back tomorrow!', 'error')
        } else {
          push(data.error ?? 'Something went wrong, try again!', 'error')
        }
        return
      }
      setCurrentImage({ url: data.imageUrl, prompt: prompt.trim() })
      fetchHistory()
      push('Image generated!', 'success', 2500)
    } catch {
      push('Something went wrong, try again!', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function copyPrompt(text: string, id: string) {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  async function handleDownload(url: string, promptText: string) {
    try {
      const slug = promptText.slice(0, 40).replace(/[^a-z0-9]/gi, '-').toLowerCase()
      await downloadImage(url, `instaart-${slug}.png`)
    } catch {
      push('Download failed — try right-clicking the image.', 'error')
    }
  }

  async function handleDelete(id: string) {
    // Optimistically remove from view
    setHistory((prev) => prev.filter((img) => img.id !== id))
    if (expanded?.id === id) setExpanded(null)

    const res = await fetch(`/api/images/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      // Restore on failure
      fetchHistory()
      push('Could not remove image, try again.', 'error')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#0d0d14] text-white overflow-hidden">

      {/* ── Toast stack ── */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-xl border backdrop-blur-md animate-in slide-in-from-right-4 duration-300
              ${t.type === 'error'
                ? 'bg-red-950/90 border-red-700/60 text-red-200'
                : t.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-700/60 text-emerald-200'
                : 'bg-slate-800/90 border-slate-600/60 text-slate-200'
              }`}
          >
            <span>{t.type === 'error' ? '✕' : t.type === 'success' ? '✓' : 'ℹ'}</span>
            {t.message}
            <button onClick={() => dismiss(t.id)} className="ml-1 opacity-50 hover:opacity-100 transition-opacity">✕</button>
          </div>
        ))}
      </div>

      {/* ── Nav ── */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/[0.07] shrink-0 bg-[#0d0d14]/80 backdrop-blur-md z-10">
        <Image src="/Iart.png" alt="InstaArt" width={120} height={30} className="h-7 w-auto" />
        {user && (
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt={user.name ?? ''} className="w-8 h-8 rounded-full ring-2 ring-purple-500/40" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
                {(user.name ?? user.email)[0].toUpperCase()}
              </div>
            )}
            <span className="text-sm text-slate-400 hidden sm:block">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="text-xs text-slate-500 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-all"
            >
              Sign out
            </button>
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Panel ── */}
        <aside className="w-[340px] shrink-0 flex flex-col border-r border-white/[0.07] overflow-y-auto bg-[#0d0d18]">

          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-start justify-between mb-0.5">
              <h2 className="text-sm font-semibold text-white">AI Image Generation</h2>
            </div>
            <p className="text-[11px] text-slate-500">Create stunning AI-generated content</p>

            {/* Tab bar */}
            <div className="mt-4 flex gap-1 bg-white/[0.04] rounded-xl p-1">
              {([
                { id: 'image' as Tab, label: 'Image', icon: <ImageTabIcon /> },
                { id: 'video' as Tab, label: 'Video', icon: <VideoTabIcon /> },
                { id: '3d' as Tab, label: '3D Elements', icon: <CubeTabIcon /> },
              ] as { id: Tab; label: string; icon: React.ReactNode }[]).map((t) => {
                const active = tab === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200
                      ${active
                        ? 'bg-white/[0.1] text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Prompt */}
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-slate-400">
                <PromptIcon />
                <span className="text-xs font-medium">Prompt</span>
              </div>
              <button className="text-slate-600 hover:text-slate-300 transition-colors" title="Enhance prompt">
                <MagicIcon />
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                tab === 'video'
                  ? 'A timelapse of a neon-lit city at night, rain falling, people rushing by, cinematic 4K…'
                  : tab === '3d'
                  ? 'A futuristic sci-fi helmet with glowing visor, detailed surface textures, ready for game engine…'
                  : 'A cosmic library floating in deep space, bookshelves carved from nebula clouds, golden light spilling between the stars…'
              }
              rows={5}
              disabled={loading}
              className="w-full bg-transparent text-sm text-white placeholder-slate-600 resize-none focus:outline-none disabled:opacity-50 leading-relaxed"
            />
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-slate-600">{prompt.length} chars</span>
            </div>
          </div>

          {/* Advanced options */}
          <div className="px-5 py-4 flex flex-col gap-1 flex-1">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Advanced Mode</p>

            {tab === 'image' ? (
              <>
                {/* Image — AI Model */}

                <PanelRow icon={<ModelIcon />} label="AI Model">
                  <div className="relative">
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value as Model)}
                      disabled={loading}
                      className="appearance-none bg-white/[0.06] border border-white/[0.08] rounded-lg pl-3 pr-7 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-w-[140px] max-w-[170px]"
                    >
                      <optgroup label="💚 Budget" className="bg-[#1a1a2e]">
                        {MODELS.filter((m) => m.tier === 'budget').map((m) => (
                          <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="🟡 Standard" className="bg-[#1a1a2e]">
                        {MODELS.filter((m) => m.tier === 'standard').map((m) => (
                          <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="🔴 Premium" className="bg-[#1a1a2e]">
                        {MODELS.filter((m) => m.tier === 'premium').map((m) => (
                          <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.label}</option>
                        ))}
                      </optgroup>
                    </select>
                    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </PanelRow>
                {/* Selected image model info */}
                {(() => {
                  const m = MODELS.find((x) => x.id === model)
                  if (!m) return null
                  const tierColor = m.tier === 'budget' ? 'text-emerald-400' : m.tier === 'standard' ? 'text-yellow-400' : 'text-rose-400'
                  return (
                    <div className="mb-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-start gap-2">
                      <span className={`mt-0.5 shrink-0 w-2 h-2 rounded-full bg-gradient-to-br ${m.color}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-semibold text-white/60">{m.badge}</span>
                          <span className={`text-[10px] font-bold ${tierColor}`}>{TIER_LABEL[m.tier]}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{m.desc}</p>
                      </div>
                    </div>
                  )
                })()}

                {/* Resolution */}
                <PanelRow icon={<ResolutionIcon />} label="Resolution">
                  <PanelSelect
                    value={resolution}
                    onChange={(v) => setResolution(v as Resolution)}
                    disabled={loading}
                    options={[
                      { value: '512×512', label: '512×512' },
                      { value: '768×768', label: '768×768' },
                      { value: '1024×1024', label: '1024×1024' },
                      { value: '1024×1792', label: '1024×1792' },
                      { value: '1792×1024', label: '1792×1024' },
                    ]}
                  />
                </PanelRow>

                {/* Aspect Ratio */}
                <PanelRow icon={<AspectIcon />} label="Aspect Ratio">
                  <PanelSelect
                    value={aspectRatio}
                    onChange={(v) => setAspectRatio(v as AspectRatio)}
                    disabled={loading}
                    options={[
                      { value: '1:1 Square', label: '1:1 Square' },
                      { value: '4:3 Landscape', label: '4:3 Landscape' },
                      { value: '3:4 Portrait', label: '3:4 Portrait' },
                      { value: '16:9 Widescreen', label: '16:9 Widescreen' },
                      { value: '9:16 Vertical', label: '9:16 Vertical' },
                    ]}
                  />
                </PanelRow>
              </>
            ) : tab === 'video' ? (
              <>
                {/* Video — AI Model */}
                <PanelRow icon={<ModelIcon />} label="AI Model">
                  <div className="relative">
                    <select
                      value={videoModel}
                      onChange={(e) => setVideoModel(e.target.value as VideoModel)}
                      disabled={loading}
                      className="appearance-none bg-white/[0.06] border border-white/[0.08] rounded-lg pl-3 pr-7 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-w-[140px] max-w-[170px]"
                    >
                      <optgroup label="💚 Budget" className="bg-[#1a1a2e]">
                        {VIDEO_MODELS.filter((m) => m.tier === 'budget').map((m) => (
                          <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="🟡 Standard" className="bg-[#1a1a2e]">
                        {VIDEO_MODELS.filter((m) => m.tier === 'standard').map((m) => (
                          <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="🔴 Premium" className="bg-[#1a1a2e]">
                        {VIDEO_MODELS.filter((m) => m.tier === 'premium').map((m) => (
                          <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.label}</option>
                        ))}
                      </optgroup>
                    </select>
                    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </PanelRow>
                {/* Selected video model info */}
                {(() => {
                  const m = VIDEO_MODELS.find((x) => x.id === videoModel)
                  if (!m) return null
                  const tierColor = m.tier === 'budget' ? 'text-emerald-400' : m.tier === 'standard' ? 'text-yellow-400' : 'text-rose-400'
                  return (
                    <div className="mb-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-start gap-2">
                      <span className={`mt-0.5 shrink-0 w-2 h-2 rounded-full bg-gradient-to-br ${m.color}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-semibold text-white/60">{m.badge}</span>
                          <span className={`text-[10px] font-bold ${tierColor}`}>{TIER_LABEL[m.tier]}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{m.desc}</p>
                      </div>
                    </div>
                  )
                })()}

                {/* Aspect Ratio for video */}
                <PanelRow icon={<AspectIcon />} label="Aspect Ratio">
                  <PanelSelect
                    value={aspectRatio}
                    onChange={(v) => setAspectRatio(v as AspectRatio)}
                    disabled={loading}
                    options={[
                      { value: '16:9 Widescreen', label: '16:9 Widescreen' },
                      { value: '9:16 Vertical', label: '9:16 Vertical' },
                      { value: '1:1 Square', label: '1:1 Square' },
                    ]}
                  />
                </PanelRow>

                {/* Generation time note */}
                <div className="mt-2 px-3 py-3 rounded-xl bg-sky-500/5 border border-sky-500/15 flex items-start gap-2">
                  <svg className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-[11px] text-sky-300/80 leading-relaxed">
                    Video generation takes 1–3 minutes depending on the model. Add <code className="text-sky-200 bg-white/10 px-0.5 rounded">FAL_API_KEY</code> to your environment to enable.
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* 3D — AI Model */}
                <PanelRow icon={<ModelIcon />} label="AI Model">
                  <div className="relative">
                    <select
                      value={threeDModel}
                      onChange={(e) => setThreeDModel(e.target.value as ThreeDModel)}
                      disabled={loading}
                      className="appearance-none bg-white/[0.06] border border-white/[0.08] rounded-lg pl-3 pr-7 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-w-[140px] max-w-[170px]"
                    >
                      <optgroup label="💚 Budget" className="bg-[#1a1a2e]">
                        {THREE_D_MODELS.filter((m) => m.tier === 'budget').map((m) => (
                          <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="🟡 Standard" className="bg-[#1a1a2e]">
                        {THREE_D_MODELS.filter((m) => m.tier === 'standard').map((m) => (
                          <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="🔴 Premium" className="bg-[#1a1a2e]">
                        {THREE_D_MODELS.filter((m) => m.tier === 'premium').map((m) => (
                          <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.label}</option>
                        ))}
                      </optgroup>
                    </select>
                    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </PanelRow>
                {/* Selected 3D model info */}
                {(() => {
                  const m = THREE_D_MODELS.find((x) => x.id === threeDModel)
                  if (!m) return null
                  const tierColor = m.tier === 'budget' ? 'text-emerald-400' : m.tier === 'standard' ? 'text-yellow-400' : 'text-rose-400'
                  return (
                    <div className="mb-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-start gap-2">
                      <span className={`mt-0.5 shrink-0 w-2 h-2 rounded-full bg-gradient-to-br ${m.color}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-semibold text-white/60">{m.badge}</span>
                          <span className={`text-[10px] font-bold ${tierColor}`}>{TIER_LABEL[m.tier]}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{m.desc}</p>
                      </div>
                    </div>
                  )
                })()}

                {/* Output Format */}
                <PanelRow icon={<CubeTabIcon />} label="Output Format">
                  <PanelSelect
                    value="glTF / GLB"
                    onChange={() => {}}
                    disabled={true}
                    options={[
                      { value: 'glTF / GLB', label: 'glTF / GLB' },
                      { value: 'OBJ + MTL', label: 'OBJ + MTL' },
                      { value: 'FBX', label: 'FBX' },
                      { value: 'USDZ', label: 'USDZ' },
                    ]}
                  />
                </PanelRow>

                {/* Coming soon notice */}
                <div className="mt-2 px-3 py-3 rounded-xl bg-violet-500/5 border border-violet-500/15 flex items-start gap-2">
                  <svg className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 3.5v3m0 2h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  <p className="text-[11px] text-violet-300/80 leading-relaxed">
                    3D generation is coming soon. Models are ready — API integration is in progress.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Generate button */}
          <div className="px-5 pb-5 pt-2 shrink-0">
            <button
              onClick={tab !== '3d' ? handleGenerate : undefined}
              disabled={loading || !prompt.trim() || tab === '3d'}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 hover:from-purple-500 hover:via-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_24px_rgba(139,92,246,0.35)] hover:shadow-[0_0_36px_rgba(139,92,246,0.55)] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Spinner />
                  Generating…
                </>
              ) : tab === 'video' ? (
                <>
                  <VideoTabIcon />
                  Generate Video
                </>
              ) : tab === '3d' ? (
                <>
                  <CubeTabIcon />
                  Coming Soon
                </>
              ) : (
                <>
                  <SparkleIcon />
                  Generate Image
                </>
              )}
            </button>
          </div>
        </aside>

        {/* ── Right Panel ── */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Current image */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-hidden relative">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
                  <div className="absolute inset-2 rounded-full border-2 border-purple-400/50 animate-spin" style={{ animationDuration: '2s' }} />
                  <div className="absolute inset-4 rounded-full border-2 border-violet-300/40 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">✦</div>
                </div>
                <p className="text-sm text-slate-400 animate-pulse">
                  {tab === 'video' ? 'Generating your video — this may take a minute…' : 'Generating your masterpiece…'}
                </p>
              </div>
            ) : tab === 'video' && currentVideo ? (
              <div className="h-full flex flex-col items-center gap-3 max-w-2xl w-full">
                <video
                  src={currentVideo.url}
                  controls
                  autoPlay
                  loop
                  className="rounded-2xl max-h-[calc(100%-5rem)] w-full shadow-[0_0_60px_rgba(139,92,246,0.2)] ring-1 ring-white/10"
                />
                <div className="flex items-center gap-3 w-full max-w-md">
                  <p className="text-xs text-slate-500 truncate flex-1">{currentVideo.prompt}</p>
                  <button
                    onClick={() => copyPrompt(currentVideo.prompt, 'current-video')}
                    title="Copy prompt"
                    className="shrink-0 text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                  >
                    {copiedId === 'current-video' ? <CheckIcon /> : <CopyIcon />}
                  </button>
                  <a
                    href={currentVideo.url}
                    download="instaart-video.mp4"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Download video"
                    className="shrink-0 text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                  >
                    <DownloadIcon />
                  </a>
                </div>
              </div>
            ) : lastError && tab === 'video' ? (
              <div className="max-w-md w-full px-6 py-5 rounded-2xl bg-red-950/40 border border-red-500/25 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-red-400">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M8 5v3m0 2.5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <span className="text-sm font-semibold">Video generation failed</span>
                </div>
                <p className="text-xs text-red-300/80 leading-relaxed break-words">{lastError}</p>
                <button
                  onClick={() => setLastError(null)}
                  className="self-start text-xs text-red-400/60 hover:text-red-300 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            ) : currentImage ? (
              <div className="h-full flex flex-col items-center gap-3 max-w-2xl w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentImage.url}
                  alt={currentImage.prompt}
                  className="rounded-2xl object-contain max-h-[calc(100%-5rem)] w-full shadow-[0_0_60px_rgba(139,92,246,0.2)] ring-1 ring-white/10"
                />
                <div className="flex items-center gap-3 w-full max-w-md">
                  <p className="text-xs text-slate-500 truncate flex-1">{currentImage.prompt}</p>
                  <button
                    onClick={() => copyPrompt(currentImage.prompt, 'current')}
                    title="Copy prompt"
                    className="shrink-0 text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                  >
                    {copiedId === 'current' ? <CheckIcon /> : <CopyIcon />}
                  </button>
                  <button
                    onClick={() => handleDownload(currentImage.url, currentImage.prompt)}
                    title="Download image"
                    className="shrink-0 text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                  >
                    <DownloadIcon />
                  </button>
                </div>
              </div>
            ) : (
              <PlaceholderIllustration />
            )}
          </div>

          {/* History strip */}
          <div className="shrink-0 border-t border-white/[0.07] p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">History</p>
            {historyLoading ? (
              <div className="flex gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-28 h-28 rounded-xl bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="flex items-center gap-3 py-5 px-4 rounded-xl border border-dashed border-white/[0.08] text-slate-600 text-xs">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="opacity-40 shrink-0">
                  <rect x="2" y="4" width="16" height="13" rx="3" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="7" cy="9" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 14l4-4 3 3 3-4 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                Your creations will appear here
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                {history.map((img) => (
                  <div key={img.id} className="group shrink-0 w-28 relative rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-purple-500/50 hover:scale-105 transition-all duration-200">
                    <button onClick={() => setExpanded(img)} className="block w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.image_url} alt={img.prompt} className="w-28 h-28 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                        <p className="text-[10px] text-white leading-tight line-clamp-2">{img.prompt}</p>
                      </div>
                    </button>
                    {/* Copy prompt on thumbnail */}
                    <button
                      onClick={(e) => { e.stopPropagation(); copyPrompt(img.prompt, img.id) }}
                      title="Copy prompt"
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                      {copiedId === img.id ? <CheckIcon size={10} /> : <CopyIcon size={10} />}
                    </button>
                    {/* Delete from history */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(img.id) }}
                      title="Remove from history"
                      className="absolute top-1.5 left-1.5 p-1 rounded-md bg-black/60 text-white/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <TrashIcon size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Expanded modal ── */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setExpanded(null)}
        >
          <div
            className="relative bg-[#13131f] border border-white/10 rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={expanded.image_url} alt={expanded.prompt} className="w-full object-contain max-h-[60vh]" />
            <div className="p-4 space-y-2">
              <p className="text-sm text-slate-300">{expanded.prompt}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <ModelBadge model={expanded.model} />
                <span>{new Date(expanded.created_at).toLocaleString()}</span>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => copyPrompt(expanded.prompt, `modal-${expanded.id}`)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-all"
                >
                  {copiedId === `modal-${expanded.id}` ? <><CheckIcon size={12} /> Copied!</> : <><CopyIcon size={12} /> Copy prompt</>}
                </button>
                <button
                  onClick={() => handleDownload(expanded.image_url, expanded.prompt)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-all"
                >
                  <DownloadIcon size={12} /> Download
                </button>
                <button
                  onClick={() => handleDelete(expanded.id)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-all ml-auto"
                >
                  <TrashIcon size={12} /> Remove
                </button>
              </div>
            </div>
            <button
              onClick={() => setExpanded(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white bg-black/50 hover:bg-black/70 rounded-full w-8 h-8 flex items-center justify-center transition-all text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Micro components ─────────────────────────────────────────────────────────

// ── Panel row + select ───────────────────────────────────────────────────────

function PanelRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-2 text-slate-400 min-w-0">
        <span className="shrink-0 opacity-60">{icon}</span>
        <span className="text-xs">{label}</span>
      </div>
      <div className="shrink-0 ml-3">{children}</div>
    </div>
  )
}

function PanelSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  disabled: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="appearance-none bg-white/[0.06] border border-white/[0.08] rounded-lg pl-3 pr-7 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-w-[140px] max-w-[170px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#1a1a2e] text-white">
            {o.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

// ── Tab icons ────────────────────────────────────────────────────────────────

function ImageTabIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="4.5" cy="4.5" r="1.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 9l3-3 2.5 2.5L9 6l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function VideoTabIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="1" y="2.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 5.2l3-1.5v5.6L9 7.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CubeTabIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 1.5L11 4v5L6.5 11.5 2 9V4L6.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6.5 1.5v10M2 4l4.5 2.5L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PromptIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 3h9M2 6.5h6M2 10h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function MagicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 12L8 6M6 2l.5 1.5L8 4l-1.5.5L6 6l-.5-1.5L4 4l1.5-.5L6 2ZM10 7l.3 1 1 .3-1 .3-.3 1-.3-1-1-.3 1-.3.3-1Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ModelIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6.5 1v1.5M6.5 10.5V12M1 6.5h1.5M10.5 6.5H12M2.6 2.6l1.1 1.1M9.3 9.3l1.1 1.1M9.3 3.7L8.2 4.8M3.7 9.3l-1.1 1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function ResolutionIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 1v11M9 1v11M1 4h11M1 9h11" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
    </svg>
  )
}

function AspectIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="1" y="2.5" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 6.5h11" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" strokeDasharray="2 2" />
      <path d="M6.5 2.5v8" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" strokeDasharray="2 2" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 1.5l1 3h3l-2.5 1.8 1 3-2.5-1.8-2.5 1.8 1-3L4 4.5h3l.5-3ZM12 9l.4 1.2 1.2.4-1.2.4-.4 1.2-.4-1.2-1.2-.4 1.2-.4L12 9Z" fill="currentColor" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

function TrashIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M6 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M5 4l.5 9h5l.5-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CopyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DownloadIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 2v8m0 0l-3-3m3 3l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ModelBadge({ model }: { model: string }) {
  const m = MODELS.find((x) => x.id === model)
  if (!m) return <span className="text-slate-500">{model}</span>
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r ${m.color} text-white`}>
      {m.label}
    </span>
  )
}

function PlaceholderIllustration() {
  return (
    <div className="flex flex-col items-center gap-5 select-none">
      <svg width="180" height="180" viewBox="0 0 180 180" fill="none" className="opacity-20">
        <rect x="20" y="40" width="140" height="110" rx="16" stroke="white" strokeWidth="2" strokeDasharray="6 4" />
        <circle cx="62" cy="78" r="14" stroke="white" strokeWidth="2" />
        <path d="M20 120 L55 90 L82 112 L110 80 L160 130" stroke="white" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx="90" cy="22" r="10" fill="white" fillOpacity="0.15" />
        <path d="M90 16 L90 28 M84 22 L96 22" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="text-center space-y-1">
        <p className="text-slate-400 font-medium text-sm">Your canvas awaits</p>
        <p className="text-slate-600 text-xs">Describe an image and hit Generate</p>
      </div>
    </div>
  )
}
