'use client'

import { Suspense } from 'react'
import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

type Tab = 'image' | 'video'
type ImageMode = 'text' | 'blend'
type BlendModel = 'gpt5mini' | 'gpt5' | 'gemini25flash' | 'gemini' | 'gemini3pro'

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

type I2VModel =
  | 'grok'
  | 'kling21_i2v'
  | 'kling25_turbo_i2v'
  | 'kling3'
  | 'kling3_audio'
  | 'seedance2'
  | 'seedance15_pro_i2v'
  | 'hailuo_pro'
  | 'hailuo_std'
  | 'hailuo23_pro'
  | 'hailuo23_std'
  | 'wan26'
  | 'wan26_flash'
  | 'wan27_i2v'
  | 'bytedance_v1_pro_i2v'
  | 'bytedance_v1_lite_i2v'
  | 'sora2'
  | 'sora2_pro'
  | 'veo3_i2v'
  | 'veo3_fast_i2v'
type Quality = '480p' | '720p' | '1080p'
type VideoMode = 'text' | 'image'

interface HistoryImage {
  id: string
  prompt: string
  image_url: string
  model: string
  created_at: string
  status: string
  kind: 'image'
}

interface HistoryVideo {
  id: string
  prompt: string
  video_url: string
  model: string
  created_at: string
  status: string
  kind: 'video'
}

type HistoryItem = HistoryImage | HistoryVideo

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
    color: 'from-violet-500 to-[#00d8ec]',
    tier: 'standard',
    cost: '$14.65/M',
  },
  {
    id: 'flux2max',
    label: 'FLUX.2 Max',
    badge: 'Black Forest',
    desc: 'Maximum quality FLUX generation — ultra-sharp details.',
    color: 'from-[#00b8d4] to-violet-600',
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
  budget: '★',
  standard: '★★★',
  premium: '★★★★★',
}

const BLEND_MODEL_IDS = new Set<Model>(['gpt5mini', 'gpt5', 'gemini25flash', 'gemini', 'gemini3pro'])

// ── Video models ─────────────────────────────────────────────────────────────

type VideoModel =
  | 'runway_turbo'
  | 'runway_aleph'
  | 'veo3_fast'
  | 'veo3'
  | 'veo3_audio'
  | 'veo3_lite'
  | 'kling21_std'
  | 'kling21_pro'
  | 'kling25_turbo'
  | 'kling26'
  | 'kling3'
  | 'kling3_audio'
  | 'seedance2'
  | 'seedance2_fast'
  | 'seedance15_pro'
  | 'hailuo_pro'
  | 'hailuo_std'
  | 'sora2'
  | 'sora2_pro'
  | 'sora2_audio'
  | 'wan26'
  | 'wan27'
  | 'bytedance_v1_pro'
  | 'bytedance_v1_lite'
  | 'grok_t2v'

interface VideoModelDef {
  id: VideoModel
  label: string
  badge: string
  desc: string
  color: string
  tier: Tier
}

const VIDEO_MODELS: VideoModelDef[] = [
  // ── Budget ────────────────────────────────────────────────────
  {
    id: 'runway_turbo',
    label: 'Runway Gen4 Turbo',
    badge: 'Runway',
    desc: 'Fast cinematic video with precise motion control. 5–10s, up to 1080p.',
    color: 'from-orange-500 to-amber-400',
    tier: 'budget',
  },
  {
    id: 'grok_t2v',
    label: 'Grok Text-to-Video',
    badge: 'xAI',
    desc: 'Fast text-to-video with fun/normal/spicy modes. 6–30s, up to 720p.',
    color: 'from-rose-500 to-orange-400',
    tier: 'budget',
  },
  {
    id: 'seedance2_fast',
    label: 'Seedance 2.0 Fast',
    badge: 'ByteDance',
    desc: 'Quick generation with audio. 4–15s, up to 720p.',
    color: 'from-cyan-500 to-teal-400',
    tier: 'budget',
  },
  {
    id: 'hailuo_std',
    label: 'Hailuo Standard',
    badge: 'MiniMax',
    desc: 'Rapid video generation optimised for speed and volume.',
    color: 'from-amber-500 to-yellow-400',
    tier: 'budget',
  },
  // ── Standard ──────────────────────────────────────────────────
  {
    id: 'runway_aleph',
    label: 'Runway Aleph',
    badge: 'Runway',
    desc: 'Advanced Runway model — high-fidelity scenes with complex motion.',
    color: 'from-violet-500 to-[#00d8ec]',
    tier: 'standard',
  },
  {
    id: 'veo3_fast',
    label: 'Veo 3.1 Fast',
    badge: 'Google',
    desc: 'Google Veo 3.1 Fast — quick generation with audio, 8s clips.',
    color: 'from-sky-500 to-cyan-400',
    tier: 'standard',
  },
  {
    id: 'kling26',
    label: 'Kling 2.6',
    badge: 'Kuaishou',
    desc: 'Kling 2.6 text-to-video with optional audio. 5–10s.',
    color: 'from-indigo-500 to-blue-400',
    tier: 'standard',
  },
  {
    id: 'kling3',
    label: 'Kling 3.0',
    badge: 'Kuaishou',
    desc: 'High-fidelity video with multi-shot support. 3–15s, up to 1080p.',
    color: 'from-violet-500 to-indigo-400',
    tier: 'standard',
  },
  {
    id: 'seedance2',
    label: 'Seedance 2.0',
    badge: 'ByteDance',
    desc: 'Rich detail with audio generation. 4–15s, up to 720p.',
    color: 'from-teal-500 to-emerald-400',
    tier: 'standard',
  },
  {
    id: 'hailuo_pro',
    label: 'Hailuo Pro',
    badge: 'MiniMax',
    desc: 'High-quality Hailuo model with prompt optimisation.',
    color: 'from-orange-500 to-red-400',
    tier: 'standard',
  },
  {
    id: 'sora2',
    label: 'Sora 2',
    badge: 'OpenAI',
    desc: 'Realistic motion with complex scene understanding. 10–15 frames.',
    color: 'from-emerald-500 to-teal-400',
    tier: 'standard',
  },
  {
    id: 'wan26',
    label: 'Wan 2.6',
    badge: 'Alibaba',
    desc: 'Wan 2.6 text-to-video with multi-shot and audio support.',
    color: 'from-blue-500 to-sky-400',
    tier: 'standard',
  },
  // ── Premium ───────────────────────────────────────────────────
  {
    id: 'veo3',
    label: 'Veo 3.1 Quality',
    badge: 'Google',
    desc: 'Google Veo 3.1 Quality — richer detail, smoother motion, accurate lighting.',
    color: 'from-blue-600 to-indigo-500',
    tier: 'premium',
  },
  {
    id: 'veo3_audio',
    label: 'Veo 3.1 with Audio',
    badge: 'Google',
    desc: 'Veo 3.1 Quality with synchronised background audio.',
    color: 'from-blue-600 to-[#00d8ec]',
    tier: 'premium',
  },
  {
    id: 'kling3_audio',
    label: 'Kling 3.0 with Audio',
    badge: 'Kuaishou',
    desc: 'Kling 3.0 pro mode with sound effects enabled. Up to 1080p.',
    color: 'from-[#00b8d4] to-indigo-500',
    tier: 'premium',
  },
  {
    id: 'sora2_pro',
    label: 'Sora 2 Pro',
    badge: 'OpenAI',
    desc: 'Premium Sora 2 with higher resolution and longer output.',
    color: 'from-green-600 to-emerald-500',
    tier: 'premium',
  },
  {
    id: 'sora2_audio',
    label: 'Sora 2 with Audio',
    badge: 'OpenAI',
    desc: 'Sora 2 Pro with synchronised audio generation.',
    color: 'from-emerald-600 to-green-500',
    tier: 'premium',
  },
  {
    id: 'kling21_std',
    label: 'Kling 2.1 Standard',
    badge: 'Kuaishou',
    desc: 'Kling 2.1 standard mode — solid quality at budget speed.',
    color: 'from-indigo-400 to-blue-400',
    tier: 'budget',
  },
  {
    id: 'kling21_pro',
    label: 'Kling 2.1 Pro',
    badge: 'Kuaishou',
    desc: 'Kling 2.1 pro mode — higher fidelity with cinematic motion.',
    color: 'from-indigo-500 to-violet-400',
    tier: 'standard',
  },
  {
    id: 'kling25_turbo',
    label: 'Kling 2.5 Turbo',
    badge: 'Kuaishou',
    desc: 'Kling 2.5 Turbo Pro — fast generation with high visual quality.',
    color: 'from-violet-500 to-[#00d8ec]',
    tier: 'standard',
  },
  {
    id: 'wan27',
    label: 'Wan 2.7',
    badge: 'Alibaba',
    desc: 'Wan 2.7 text-to-video with improved motion and up to 1080p.',
    color: 'from-cyan-500 to-blue-500',
    tier: 'standard',
  },
  {
    id: 'seedance15_pro',
    label: 'Seedance 1.5 Pro',
    badge: 'ByteDance',
    desc: 'Seedance 1.5 Pro — higher fidelity video with audio generation.',
    color: 'from-teal-600 to-emerald-500',
    tier: 'standard',
  },
  {
    id: 'bytedance_v1_pro',
    label: 'ByteDance V1 Pro',
    badge: 'ByteDance',
    desc: 'ByteDance V1 Pro — detailed generation with audio. Up to 720p.',
    color: 'from-orange-400 to-amber-500',
    tier: 'standard',
  },
  {
    id: 'bytedance_v1_lite',
    label: 'ByteDance V1 Lite',
    badge: 'ByteDance',
    desc: 'ByteDance V1 Lite — fast and economical video generation.',
    color: 'from-yellow-500 to-amber-400',
    tier: 'budget',
  },
  {
    id: 'veo3_lite',
    label: 'Veo 3.1 Lite',
    badge: 'Google',
    desc: 'Google Veo 3.1 Lite — fastest Veo variant with audio.',
    color: 'from-sky-400 to-teal-400',
    tier: 'budget',
  },
]

// ── Image-to-Video models ───────────────────────────────────────────────────

interface I2VModelDef {
  id: I2VModel
  label: string
  badge: string
  desc: string
  color: string
  tier: Tier
}

const I2V_MODELS: I2VModelDef[] = [
  // ── Budget ────────────────────────────────────────────────────
  {
    id: 'grok',
    label: 'Grok',
    badge: 'xAI',
    desc: 'Fast image-to-video with expressive motion. 6–30s, max 720p.',
    color: 'from-rose-500 to-orange-400',
    tier: 'budget',
  },
  {
    id: 'wan26_flash',
    label: 'Wan 2.6 Flash',
    badge: 'Alibaba',
    desc: 'Fast image-to-video with audio. Up to 1080p.',
    color: 'from-blue-500 to-sky-400',
    tier: 'budget',
  },
  {
    id: 'hailuo_std',
    label: 'Hailuo Standard',
    badge: 'MiniMax',
    desc: 'Quick image-to-video for rapid iteration.',
    color: 'from-amber-500 to-yellow-400',
    tier: 'budget',
  },
  // ── Standard ──────────────────────────────────────────────────
  {
    id: 'kling3',
    label: 'Kling 3.0',
    badge: 'Kuaishou',
    desc: 'High-fidelity video with multi-shot support. 3–15s, up to 1080p.',
    color: 'from-violet-500 to-indigo-400',
    tier: 'standard',
  },
  {
    id: 'seedance2',
    label: 'Seedance 2.0',
    badge: 'ByteDance',
    desc: 'Image-to-video with audio, first/last frame control. 4–15s.',
    color: 'from-teal-500 to-emerald-400',
    tier: 'standard',
  },
  {
    id: 'hailuo_pro',
    label: 'Hailuo Pro',
    badge: 'MiniMax',
    desc: 'High-quality image-to-video with prompt optimisation.',
    color: 'from-orange-500 to-red-400',
    tier: 'standard',
  },
  {
    id: 'wan26',
    label: 'Wan 2.6',
    badge: 'Alibaba',
    desc: 'Wan 2.6 image-to-video with audio and multi-shot support.',
    color: 'from-blue-500 to-indigo-400',
    tier: 'standard',
  },
  {
    id: 'sora2',
    label: 'Sora 2',
    badge: 'OpenAI',
    desc: 'Realistic motion with complex scene understanding and continuity.',
    color: 'from-emerald-500 to-teal-400',
    tier: 'standard',
  },
  {
    id: 'veo3_fast_i2v',
    label: 'Veo 3.1 Fast',
    badge: 'Google',
    desc: 'Google Veo 3.1 Fast image-to-video with audio.',
    color: 'from-sky-500 to-cyan-400',
    tier: 'standard',
  },
  // ── Premium ───────────────────────────────────────────────────
  {
    id: 'kling3_audio',
    label: 'Kling 3.0 with Audio',
    badge: 'Kuaishou',
    desc: 'Kling 3.0 pro mode with sound effects. Up to 1080p.',
    color: 'from-[#00b8d4] to-indigo-500',
    tier: 'premium',
  },
  {
    id: 'sora2_pro',
    label: 'Sora 2 Pro',
    badge: 'OpenAI',
    desc: 'Premium Sora 2 with higher fidelity and longer output.',
    color: 'from-green-600 to-emerald-500',
    tier: 'premium',
  },
  {
    id: 'veo3_i2v',
    label: 'Veo 3.1 Quality',
    badge: 'Google',
    desc: 'Google Veo 3.1 Quality image-to-video with audio.',
    color: 'from-blue-600 to-indigo-500',
    tier: 'premium',
  },
  {
    id: 'kling21_i2v',
    label: 'Kling 2.1',
    badge: 'Kuaishou',
    desc: 'Kling 2.1 image-to-video — smooth motion and good detail.',
    color: 'from-indigo-400 to-blue-400',
    tier: 'standard',
  },
  {
    id: 'kling25_turbo_i2v',
    label: 'Kling 2.5 Turbo',
    badge: 'Kuaishou',
    desc: 'Kling 2.5 Turbo Pro image-to-video — fast with high fidelity.',
    color: 'from-violet-500 to-[#00d8ec]',
    tier: 'standard',
  },
  {
    id: 'seedance15_pro_i2v',
    label: 'Seedance 1.5 Pro',
    badge: 'ByteDance',
    desc: 'Seedance 1.5 Pro image-to-video with audio. Up to 720p.',
    color: 'from-teal-600 to-emerald-500',
    tier: 'standard',
  },
  {
    id: 'hailuo23_pro',
    label: 'Hailuo 2.3 Pro',
    badge: 'MiniMax',
    desc: 'Hailuo 2.3 Pro image-to-video with prompt optimisation.',
    color: 'from-red-500 to-orange-500',
    tier: 'standard',
  },
  {
    id: 'hailuo23_std',
    label: 'Hailuo 2.3 Standard',
    badge: 'MiniMax',
    desc: 'Hailuo 2.3 Standard image-to-video for fast iteration.',
    color: 'from-amber-500 to-orange-400',
    tier: 'budget',
  },
  {
    id: 'wan27_i2v',
    label: 'Wan 2.7',
    badge: 'Alibaba',
    desc: 'Wan 2.7 image-to-video with audio and improved fidelity.',
    color: 'from-cyan-500 to-blue-500',
    tier: 'standard',
  },
  {
    id: 'bytedance_v1_pro_i2v',
    label: 'ByteDance V1 Pro',
    badge: 'ByteDance',
    desc: 'ByteDance V1 Pro image-to-video with audio. Up to 720p.',
    color: 'from-orange-400 to-amber-500',
    tier: 'standard',
  },
  {
    id: 'bytedance_v1_lite_i2v',
    label: 'ByteDance V1 Lite',
    badge: 'ByteDance',
    desc: 'ByteDance V1 Lite image-to-video — fast and economical.',
    color: 'from-yellow-500 to-amber-400',
    tier: 'budget',
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
const ONBOARDING_STEPS = [
  { heading: 'What brings you to Reelx?', options: ['Marketing', 'Content creation', 'Agency work', 'Founder'] },
  { heading: 'What do you want to create?', options: ['Images', 'Videos', 'Avatar videos', 'All of the above'] },
  { heading: "You're ready.", options: [], ctas: true },
] as const

function OnboardingOverlay({
  step, selections, onSelect, onNext, onFinish,
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
        background: '#0f2035', border: '1px solid #183048', borderRadius: 20,
        padding: 40, width: '100%', maxWidth: 520,
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {ONBOARDING_STEPS.map((_, i) => (
            <div key={i} style={{
              height: 3, flex: 1, borderRadius: 99,
              background: i <= step ? 'linear-gradient(135deg,#00b8d4,#00d8ec)' : '#183048',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#dceaf4', margin: 0 }}>
          {current.heading}
        </h2>
        {current.options.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {(current.options as readonly string[]).map(opt => {
              const selected = selections[step] === opt
              return (
                <button key={opt} onClick={() => onSelect(opt)} style={{
                  background: selected ? 'rgba(0,196,204,0.12)' : '#101722',
                  border: selected ? '1px solid #00b8d4' : '1px solid #183048',
                  borderRadius: 12, padding: '14px 16px', textAlign: 'left',
                  color: selected ? '#dceaf4' : '#00d8ec', fontSize: 14, cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: selected ? '0 0 16px rgba(0,196,204,0.2)' : 'none',
                }}>{opt}</button>
              )
            })}
          </div>
        )}
        {'ctas' in current && current.ctas ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onFinish('/dashboard')}>Start creating</button>
            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onFinish('/studio')}>Open Studio</button>
            <button className="btn-tertiary" style={{ justifyContent: 'center' }} onClick={() => onFinish('/dashboard')}>Explore examples →</button>
          </div>
        ) : (
          <button className="btn-primary" disabled={!selections[step]} style={{ alignSelf: 'flex-end', opacity: selections[step] ? 1 : 0.4 }} onClick={onNext}>
            Continue
          </button>
        )}
      </div>
    </div>
  )
}

function DashboardInner() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toasts, push, dismiss } = useToasts()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState<Model>('gemini')
  const [tab, setTab] = useState<Tab>('image')
  const [videoModel, setVideoModel] = useState<VideoModel>('runway_turbo')

  const [resolution, setResolution] = useState<Resolution>('1024×1024')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1 Square')
  const [videoMode, setVideoMode] = useState<VideoMode>('text')
  const [i2vModel, setI2vModel] = useState<I2VModel>('grok')
  const [quality, setQuality] = useState<Quality>('720p')
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string; description: string }[]>([])
  const [imageMode, setImageMode] = useState<ImageMode>('text')
  const [blendImages, setBlendImages] = useState<{ file: File; preview: string }[]>([])
  const [blendModel, setBlendModel] = useState<BlendModel>('gpt5mini')
  const [loading, setLoading] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [currentImage, setCurrentImage] = useState<{ url: string; prompt: string } | null>(null)
  const [currentVideo, setCurrentVideo] = useState<{ url: string; prompt: string } | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [expanded, setExpanded] = useState<HistoryItem | null>(null)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState('5')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [promptExpanded, setPromptExpanded] = useState(false)
  const [enhancingPrompt, setEnhancingPrompt] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState<number | null>(
    searchParams.get('welcome') === 'true' ? 0 : null
  )
  const [onboardingSelections, setOnboardingSelections] = useState<Record<number, string>>({})

  function handleOnboardingFinish(route: string) {
    setOnboardingStep(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('welcome')
    window.history.replaceState({}, '', url.toString())
    if (route !== '/dashboard') router.push(route)
  }

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
    const [{ data: images }, { data: videos }] = await Promise.all([
      supabase
        .from('images')
        .select('id, prompt, image_url, model, created_at, status')
        .eq('status', 'done')
        .eq('hidden', false)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('videos')
        .select('id, prompt, video_url, model, created_at, status')
        .eq('status', 'done')
        .order('created_at', { ascending: false })
        .limit(30),
    ])
    const imageItems: HistoryImage[] = (images ?? []).map((r) => ({ ...r, kind: 'image' as const }))
    const videoItems: HistoryVideo[] = (videos ?? []).map((r) => ({ ...r, kind: 'video' as const }))
    const merged = [...imageItems, ...videoItems]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 30)
    setHistory(merged)
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

      const totalDurationSec = parseInt(videoDuration, 10)

      // ── Long video (≥30 s) — multi-clip pipeline ─────────────────────────────
      if (totalDurationSec >= 30) {
        try {
          if (videoMode === 'image' && uploadedImages.length === 0) {
            push('Please upload at least one image first.', 'error')
            setLoading(false)
            return
          }

          let res: Response
          if (videoMode === 'image') {
            const form = new FormData()
            form.append('prompt',        prompt.trim())
            form.append('mode',          videoMode)
            form.append('i2vModel',      i2vModel)
            form.append('aspectRatio',   aspectRatio)
            form.append('totalDuration', String(totalDurationSec))
            uploadedImages.forEach((img) => form.append('images[]', img.file))
            res = await fetch('/api/generate-long-video', { method: 'POST', body: form })
          } else {
            res = await fetch('/api/generate-long-video', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: prompt.trim(), mode: videoMode, videoModel, aspectRatio, totalDuration: totalDurationSec }),
            })
          }
          const data = await res.json()
          if (!res.ok) {
            const msg = res.status === 429 ? 'Daily limit reached — come back tomorrow!' : (data.error ?? 'Long video generation failed')
            setLastError(msg); push(msg, 'error'); return
          }
          setLastError(null)
          setCurrentVideo({ url: data.videoUrl, prompt: prompt.trim() })
          fetchHistory()
          push(`${videoDuration}s video ready!`, 'success', 4000)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Something went wrong, try again!'
          setLastError(msg); push(msg, 'error')
        } finally { setLoading(false) }
        return
      }

      // Image-to-Video mode
      if (videoMode === 'image') {
        if (uploadedImages.length === 0) {
          push('Please upload at least one image first.', 'error')
          setLoading(false)
          return
        }
        try {
          const form = new FormData()
          uploadedImages.forEach((img) => {
            form.append('images[]', img.file)
            form.append('imageDescriptions[]', img.description)
          })
          form.append('prompt', prompt.trim())
          form.append('model', i2vModel)
          form.append('quality', quality)
          form.append('aspectRatio', aspectRatio)
          form.append('duration', videoDuration)

          const res = await fetch('/api/generate-video-from-image', { method: 'POST', body: form })
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
          push('Video generated from image!', 'success', 3000)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Something went wrong, try again!'
          setLastError(msg)
          push(msg, 'error')
        } finally {
          setLoading(false)
        }
        return
      }

      // Text-to-Video mode
      try {
        const res = await fetch('/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt.trim(), model: videoModel, aspectRatio, duration: videoDuration }),
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
    // Image Blend mode
    if (imageMode === 'blend') {
      if (blendImages.length < 2) {
        push('Upload at least 2 reference images to blend.', 'error')
        setLoading(false)
        return
      }
      setLastError(null)
      try {
        const form = new FormData()
        form.append('prompt', prompt.trim())
        form.append('model', blendModel)
        blendImages.forEach((img) => form.append('images[]', img.file))
        const res = await fetch('/api/generate-blend', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) {
          const msg = res.status === 429
            ? 'Daily limit reached — come back tomorrow!'
            : (data.error ?? 'Blend failed, try again!')
          setLastError(msg)
          push(msg, 'error')
          return
        }
        setCurrentImage({ url: data.imageUrl, prompt: prompt.trim() })
        fetchHistory()
        push('Blend image generated!', 'success', 2500)
      } catch {
        const msg = 'Something went wrong, try again!'
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

  async function handleDeleteVideo(id: string) {
    setHistory((prev) => prev.filter((item) => item.id !== id))
    if (expanded?.id === id) setExpanded(null)

    const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      fetchHistory()
      push('Could not remove video, try again.', 'error')
    }
  }

  async function handleEnhancePrompt() {
    if (!prompt.trim() || enhancingPrompt) return
    setEnhancingPrompt(true)
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), type: tab }),
      })
      const data = await res.json() as { prompt?: string; error?: string }
      if (res.ok && data.prompt) {
        setPrompt(data.prompt)
        push('Prompt enhanced!', 'success', 2500)
      } else {
        push(data.error ?? 'Failed to enhance prompt', 'error')
      }
    } catch {
      push('Failed to enhance prompt', 'error')
    } finally {
      setEnhancingPrompt(false)
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        push('Only JPEG, PNG, and WebP images are supported.', 'error')
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        push('Image must be under 10 MB.', 'error')
        continue
      }
      setUploadedImages(prev => [...prev, { file, preview: URL.createObjectURL(file), description: '' }])
    }
    e.target.value = ''
  }

  async function useImageForVideo(imageUrl: string, imagePrompt: string) {
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg'
      const file = new File([blob], `instaart-i2v.${ext}`, { type: blob.type })
      setUploadedImages([{ file, preview: URL.createObjectURL(file), description: '' }])
      setPrompt(imagePrompt)
      setTab('video')
      setVideoMode('image')
    } catch {
      push('Could not load image — try again.', 'error')
    }
  }

  function handleImageDrop(e: React.DragEvent) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        push('Only JPEG, PNG, and WebP images are supported.', 'error')
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        push('Image must be under 10 MB.', 'error')
        continue
      }
      setUploadedImages(prev => [...prev, { file, preview: URL.createObjectURL(file), description: '' }])
    }
  }

  function handleBlendImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    let count = blendImages.length
    for (const file of files) {
      if (count >= 8) {
        push('Maximum 8 reference images.', 'error')
        break
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        push('Only JPEG, PNG, and WebP images are supported.', 'error')
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        push('Image must be under 10 MB.', 'error')
        continue
      }
      setBlendImages(prev => [...prev, { file, preview: URL.createObjectURL(file) }])
      count++
    }
    e.target.value = ''
  }

  function removeBlendImage(index: number) {
    setBlendImages(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="flex flex-col h-screen text-white overflow-hidden" style={{ background: '#070e1a' }}>

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

      {/* ── Top header ── */}
      <header style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', background: '#101722', borderBottom: '1px solid #183048',
        flexShrink: 0, zIndex: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/brand/reelx-icon.png" alt="Reelx" width={26} height={26} style={{ objectFit: 'contain' }} />
        </div>
        {/* Search bar */}
        <div style={{
          flex: 1, maxWidth: 420, margin: '0 24px',
          background: '#0f2035', border: '1px solid #183048',
          borderRadius: 10, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="#4a7a96" strokeWidth="2"/>
            <path d="M16.5 16.5L21 21" stroke="#4a7a96" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            placeholder="Search your creations…"
            style={{ background: 'none', border: 'none', outline: 'none', color: '#dceaf4', fontSize: 13, width: '100%' }}
          />
        </div>
        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user && (
            <>
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt={user.name ?? ''} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#0f2035', border: '1px solid #183048', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#4a7a96' }}>
                  {(user.name ?? user.email)[0].toUpperCase()}
                </div>
              )}
              <button
                onClick={handleSignOut}
                style={{ fontSize: 12, color: '#4a7a96', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#dceaf4')}
                onMouseLeave={e => (e.currentTarget.style.color = '#4a7a96')}
              >Sign out</button>
            </>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar nav ── */}
        <nav style={{
          width: sidebarCollapsed ? 52 : 192, background: '#101722', borderRight: '1px solid #183048',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          overflowY: 'auto', transition: 'width 0.2s ease', overflow: 'hidden',
        }}>
          {/* Collapse toggle */}
          <div style={{ display: 'flex', justifyContent: sidebarCollapsed ? 'center' : 'flex-end', padding: '10px 10px 4px' }}>
            <button
              onClick={() => setSidebarCollapsed(prev => !prev)}
              title={sidebarCollapsed ? 'Expand panel' : 'Collapse panel'}
              style={{
                background: 'none', border: '1px solid #183048', borderRadius: 6,
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#4a7a96', flexShrink: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#dceaf4')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4a7a96')}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                {sidebarCollapsed
                  ? <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  : <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                }
              </svg>
            </button>
          </div>

          <div style={{ flex: 1, paddingTop: 4 }}>
            {([
              { label: 'Go to Studio', icon: '◈', href: '/studio' },
              { label: 'Billing',      icon: '$', href: '/billing' },
              { label: 'Settings',     icon: '⚙', href: '/settings' },
            ] as { label: string; icon: string; href: string }[]).map(item => (
              <a
                key={item.label}
                href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: sidebarCollapsed ? 0 : 10,
                  padding: sidebarCollapsed ? '10px 0' : '9px 20px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  fontSize: 13,
                  color: '#4a7a96',
                  textDecoration: 'none', transition: 'color 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#dceaf4')}
                onMouseLeave={e => (e.currentTarget.style.color = '#4a7a96')}
              >
                <span style={{ fontSize: 14, width: 16, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                {!sidebarCollapsed && item.label}
              </a>
            ))}
          </div>

          {!sidebarCollapsed && (
            <div style={{ padding: '16px 16px', borderTop: '1px solid #183048' }}>
              <Link href="/pricing" className="btn-primary" style={{ display: 'block', textAlign: 'center', fontSize: 12, padding: '7px 0' }}>
                Upgrade
              </Link>
            </div>
          )}
        </nav>

        {/* ── Left Panel ── */}
        <aside className="w-[340px] shrink-0 flex flex-col border-r overflow-y-auto" style={{ borderColor: '#183048', background: '#101722' }}>

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
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPromptExpanded(true)}
                  title="Expand prompt editor"
                  className="text-slate-600 hover:text-slate-300 transition-colors p-0.5 rounded"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 5l4.5-4.5L11 5M2 8l4.5 4.5L11 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={handleEnhancePrompt}
                  disabled={!prompt.trim() || enhancingPrompt || loading}
                  title="Enhance prompt with AI"
                  className={`transition-colors p-0.5 rounded ${enhancingPrompt ? 'text-[#00b8d4] animate-pulse' : 'text-slate-600 hover:text-[#00b8d4]'} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {enhancingPrompt ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
                      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="8 8" />
                    </svg>
                  ) : (
                    <MagicIcon />
                  )}
                </button>
              </div>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                tab === 'video'
                  ? 'A timelapse of a neon-lit city at night, rain falling, people rushing by, cinematic 4K…'
                  : 'A cosmic library floating in deep space, bookshelves carved from nebula clouds, golden light spilling between the stars…'
              }
              rows={5}
              disabled={loading}
              className="w-full bg-transparent text-sm text-white placeholder-slate-600 resize-none focus:outline-none disabled:opacity-50 leading-relaxed"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-slate-600">
                {!prompt.trim() ? 'Click ✦ to enhance your prompt with AI' : ''}
              </span>
              <span className="text-[10px] text-slate-600">{prompt.length} chars</span>
            </div>
          </div>

          {/* Prompt expand modal */}
          {promptExpanded && (
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[200] flex items-center justify-center p-6"
              onClick={() => setPromptExpanded(false)}
            >
              <div
                className="relative bg-[#0f2035] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
                style={{ maxHeight: '80vh' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {tab === 'video' ? 'Video Prompt' : 'Image Prompt'}
                    </span>
                    <button
                      onClick={handleEnhancePrompt}
                      disabled={!prompt.trim() || enhancingPrompt || loading}
                      title="Enhance with AI"
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all
                        ${enhancingPrompt
                          ? 'border-[#00b8d4]/40 text-[#00b8d4] bg-[#00b8d4]/10'
                          : 'border-white/10 text-slate-400 hover:border-[#00b8d4]/40 hover:text-[#00b8d4] hover:bg-[#00b8d4]/5'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {enhancingPrompt ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="animate-spin">
                          <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="7 7" />
                        </svg>
                      ) : (
                        <MagicIcon />
                      )}
                      {enhancingPrompt ? 'Enhancing…' : 'Enhance'}
                    </button>
                  </div>
                  <button
                    onClick={() => setPromptExpanded(false)}
                    className="text-slate-400 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] rounded-lg w-7 h-7 flex items-center justify-center transition-all text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-5 flex-1 overflow-hidden flex flex-col">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      tab === 'video'
                        ? 'A timelapse of a neon-lit city at night, rain falling, people rushing by, cinematic 4K…'
                        : 'A cosmic library floating in deep space, bookshelves carved from nebula clouds, golden light spilling between the stars…'
                    }
                    disabled={loading}
                    className="flex-1 w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-[#00b8d4]/50 disabled:opacity-50 leading-relaxed"
                    style={{ minHeight: 280 }}
                    autoFocus
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[11px] text-slate-600">{prompt.length} chars</span>
                    <button
                      onClick={() => setPromptExpanded(false)}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#00b8d4] to-[#00d8ec] text-[#070e1a] hover:opacity-90 transition-opacity"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced options */}
          <div className="px-5 py-4 flex flex-col gap-1 flex-1">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Advanced Mode</p>

            {tab === 'image' ? (
              <>
                {/* Image sub-mode: Text to Image / Image Blend */}
                <div className="flex gap-1 bg-white/[0.04] rounded-lg p-0.5 mb-3">
                  {([
                    { id: 'text' as ImageMode, label: 'Text to Image' },
                    { id: 'blend' as ImageMode, label: 'Image Blend' },
                  ]).map((m) => {
                    const active = imageMode === m.id
                    return (
                      <button
                        key={m.id}
                        onClick={() => setImageMode(m.id)}
                        className={`flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200
                          ${active
                            ? 'bg-white/[0.1] text-white shadow-sm'
                            : 'text-slate-500 hover:text-white'
                          }`}
                      >
                        {m.label}
                      </button>
                    )
                  })}
                </div>

                {/* AI Model */}
                <PanelRow icon={<ModelIcon />} label="AI Model">
                  <div className="relative">
                    <select
                      value={imageMode === 'blend' ? blendModel : model}
                      onChange={(e) => imageMode === 'blend'
                        ? setBlendModel(e.target.value as BlendModel)
                        : setModel(e.target.value as Model)
                      }
                      disabled={loading}
                      className="appearance-none bg-white/[0.06] border border-white/[0.08] rounded-lg pl-3 pr-7 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00b8d4]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-w-[140px] max-w-[170px]"
                    >
                      {imageMode === 'blend' ? (
                        MODELS.filter((m) => BLEND_MODEL_IDS.has(m.id)).map((m) => (
                          <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.label}</option>
                        ))
                      ) : (
                        <>
                          <optgroup label="★" className="bg-[#1a1a2e]">
                            {MODELS.filter((m) => m.tier === 'budget').map((m) => (
                              <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.label}</option>
                            ))}
                          </optgroup>
                          <optgroup label="★★★" className="bg-[#1a1a2e]">
                            {MODELS.filter((m) => m.tier === 'standard').map((m) => (
                              <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.label}</option>
                            ))}
                          </optgroup>
                          <optgroup label="★★★★★" className="bg-[#1a1a2e]">
                            {MODELS.filter((m) => m.tier === 'premium').map((m) => (
                              <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.label}</option>
                            ))}
                          </optgroup>
                        </>
                      )}
                    </select>
                    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </PanelRow>

                {/* Selected model info */}
                {(() => {
                  const m = MODELS.find((x) => x.id === (imageMode === 'blend' ? blendModel : model))
                  if (!m) return null
                  return (
                    <div className="mb-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-start gap-2">
                      <span className={`mt-0.5 shrink-0 w-2 h-2 rounded-full bg-gradient-to-br ${m.color}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-semibold text-white/60">{m.badge}</span>
                          <span className="text-[9px] font-bold tracking-wider bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">{TIER_LABEL[m.tier]}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{m.desc}</p>
                      </div>
                    </div>
                  )
                })()}

                {/* Blend — reference image upload grid */}
                {imageMode === 'blend' && (
                  <div className="mb-1">
                    <p className="text-[10px] text-slate-500 mb-2">Reference images (2–8)</p>
                    <div className="flex gap-2 flex-wrap">
                      {blendImages.map((img, i) => (
                        <div key={i} className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-white/[0.1]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.preview} alt={`Ref ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeBlendImage(i)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white/80 hover:text-white flex items-center justify-center text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {blendImages.length < 8 && (
                        <label className="shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-white/[0.1] hover:border-[#00b8d4]/40 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer">
                          <UploadIcon />
                          <span className="text-[9px] text-slate-500">Add image</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={handleBlendImageSelect}
                            disabled={loading}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-600 mt-1.5">
                      {blendImages.length < 2
                        ? 'Upload at least 2 images · write a prompt describing the output'
                        : `${blendImages.length} image${blendImages.length !== 1 ? 's' : ''} selected · Creator plan required`}
                    </p>
                  </div>
                )}

                {/* Resolution & Aspect Ratio — text mode only */}
                {imageMode === 'text' && (
                  <>
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
                )}
              </>
            ) : (
              <>
                {/* Video sub-mode toggle: Text / Image */}
                <div className="flex gap-1 bg-white/[0.04] rounded-lg p-0.5 mb-3">
                  {([
                    { id: 'text' as VideoMode, label: 'Text to Video' },
                    { id: 'image' as VideoMode, label: 'Image to Video' },
                  ]).map((m) => {
                    const active = videoMode === m.id
                    return (
                      <button
                        key={m.id}
                        onClick={() => setVideoMode(m.id)}
                        className={`flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200
                          ${active
                            ? 'bg-white/[0.1] text-white shadow-sm'
                            : 'text-slate-500 hover:text-white'
                          }`}
                      >
                        {m.label}
                      </button>
                    )
                  })}
                </div>

                {videoMode === 'image' && (
                  <div
                    onDrop={handleImageDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="mb-3"
                  >
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {uploadedImages.map((img, i) => (
                        <div key={i} className="shrink-0 flex flex-col gap-1">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/[0.1]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.preview} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                              onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white/80 hover:text-white flex items-center justify-center text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                          <input
                            type="text"
                            value={img.description}
                            onChange={(e) => {
                              const val = e.target.value
                              setUploadedImages(prev => prev.map((x, idx) => idx === i ? { ...x, description: val } : x))
                            }}
                            placeholder="describe…"
                            className="w-20 bg-white/[0.05] border border-white/[0.08] rounded px-1.5 py-1 text-[10px] text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#00b8d4]/50"
                          />
                        </div>
                      ))}
                      {/* Add image tile */}
                      <label className="shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-white/[0.1] hover:border-[#00b8d4]/40 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer">
                        <UploadIcon />
                        <span className="text-[9px] text-slate-500">Add image</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {uploadedImages.length > 0 && (
                      <p className="text-[9px] text-slate-600 mt-1">First image = start frame · Last image = end frame</p>
                    )}
                  </div>
                )}

                {/* Video — AI Model */}
                <PanelRow icon={<ModelIcon />} label="AI Model">
                  <div className="relative">
                    {videoMode === 'text' ? (
                      <select
                        value={videoModel}
                        onChange={(e) => setVideoModel(e.target.value as VideoModel)}
                        disabled={loading}
                        className="appearance-none bg-white/[0.06] border border-white/[0.08] rounded-lg pl-3 pr-7 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00b8d4]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-w-[140px] max-w-[170px]"
                      >
                        <optgroup label="★" className="bg-[#1a1a2e]">
                          {VIDEO_MODELS.filter((m) => m.tier === 'budget').map((m) => (
                            <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="★★★" className="bg-[#1a1a2e]">
                          {VIDEO_MODELS.filter((m) => m.tier === 'standard').map((m) => (
                            <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="★★★★★" className="bg-[#1a1a2e]">
                          {VIDEO_MODELS.filter((m) => m.tier === 'premium').map((m) => (
                            <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.label}</option>
                          ))}
                        </optgroup>
                      </select>
                    ) : (
                      <select
                        value={i2vModel}
                        onChange={(e) => setI2vModel(e.target.value as I2VModel)}
                        disabled={loading}
                        className="appearance-none bg-white/[0.06] border border-white/[0.08] rounded-lg pl-3 pr-7 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00b8d4]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-w-[140px] max-w-[170px]"
                      >
                        <optgroup label="★" className="bg-[#1a1a2e]">
                          {I2V_MODELS.filter((m) => m.tier === 'budget').map((m) => (
                            <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="★★★" className="bg-[#1a1a2e]">
                          {I2V_MODELS.filter((m) => m.tier === 'standard').map((m) => (
                            <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="★★★★★" className="bg-[#1a1a2e]">
                          {I2V_MODELS.filter((m) => m.tier === 'premium').map((m) => (
                            <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.label}</option>
                          ))}
                        </optgroup>
                      </select>
                    )}
                    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </PanelRow>
                {/* Selected video model info */}
                {(() => {
                  const m = videoMode === 'text'
                    ? VIDEO_MODELS.find((x) => x.id === videoModel)
                    : I2V_MODELS.find((x) => x.id === i2vModel)
                  if (!m) return null
                  return (
                    <div className="mb-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-start gap-2">
                      <span className={`mt-0.5 shrink-0 w-2 h-2 rounded-full bg-gradient-to-br ${m.color}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-semibold text-white/60">{m.badge}</span>
                          <span className="text-[9px] font-bold tracking-wider bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">{TIER_LABEL[m.tier]}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{m.desc}</p>
                      </div>
                    </div>
                  )
                })()}

                {/* Quality selector (both modes) */}
                <PanelRow icon={<ResolutionIcon />} label="Quality">
                  <PanelSelect
                    value={quality}
                    onChange={(v) => setQuality(v as Quality)}
                    disabled={loading}
                    options={[
                      { value: '480p', label: '480p' },
                      { value: '720p', label: '720p' },
                      { value: '1080p', label: '1080p' },
                    ]}
                  />
                </PanelRow>

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

                {/* Duration selector */}
                <PanelRow icon={<svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-slate-400"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5.5V8l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>} label="Duration">
                  <PanelSelect
                    value={videoDuration}
                    onChange={(v) => setVideoDuration(v)}
                    disabled={loading}
                    options={[
                      { value: '5',   label: '5 sec' },
                      { value: '8',   label: '8 sec' },
                      { value: '10',  label: '10 sec' },
                      { value: '30',  label: '30 sec' },
                      { value: '60',  label: '60 sec' },
                      { value: '90',  label: '90 sec' },
                      { value: '120', label: '2 min' },
                    ]}
                  />
                </PanelRow>

                {parseInt(videoDuration, 10) >= 30 && (
                  <p className="text-[10px] text-[#00b8d4]/70 px-1">
                    Long video: {Math.ceil(parseInt(videoDuration, 10) / 10)} × 10 s clips stitched. Use Kling 3.0, Wan 2.7, or ByteDance V1.
                  </p>
                )}

                {/* Generation time note */}
                <div className="mt-2 px-3 py-3 rounded-xl bg-sky-500/5 border border-sky-500/15 flex items-start gap-2">
                  <svg className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-[11px] text-sky-300/80 leading-relaxed">
                    {parseInt(videoDuration, 10) >= 30
                      ? 'Long video: clips generate in parallel (~3–5 min) then stitch automatically.'
                      : 'Video generation takes 1–3 minutes depending on the model.'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Generate button */}
          <div className="px-5 pb-5 pt-2 shrink-0">
            <button
              onClick={handleGenerate}
              disabled={
                loading ||
                !prompt.trim() ||
                (tab === 'video' && videoMode === 'image' && uploadedImages.length === 0) ||
                (tab === 'image' && imageMode === 'blend' && blendImages.length < 2)
              }
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#00b8d4] via-violet-600 to-[#00d8ec] hover:from-[#00b8d4] hover:via-violet-500 hover:to-[#00d8ec] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_24px_rgba(139,92,246,0.35)] hover:shadow-[0_0_36px_rgba(139,92,246,0.55)] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Spinner />
                  Generating…
                </>
              ) : tab === 'image' && imageMode === 'blend' ? (
                <>
                  <SparkleIcon />
                  Blend Images
                </>
              ) : tab === 'video' ? (
                <>
                  <VideoTabIcon />
                  {videoMode === 'image' ? 'Generate from Image' : 'Generate Video'}
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
                  <div className="absolute inset-0 rounded-full border-2 border-[#00b8d4]/30 animate-ping" />
                  <div className="absolute inset-2 rounded-full border-2 border-[#00b8d4]/50 animate-spin" style={{ animationDuration: '2s' }} />
                  <div className="absolute inset-4 rounded-full border-2 border-[#00d8ec]/40 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
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
                <button
                  onClick={() => useImageForVideo(currentImage.url, currentImage.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f2035]/15 border border-[#00b8d4]/30 text-[#00d8ec] hover:bg-[#0f2035]/25 hover:text-[#00b8d4] transition-all text-xs font-medium"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0">
                    <rect x="1" y="2.5" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M9 5l3 2-3 2V5z" fill="currentColor" />
                  </svg>
                  Use this image to generate a video
                </button>
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
                {history.map((item) => (
                  <div key={item.id} className="group shrink-0 w-28 relative rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-[#00b8d4]/50 hover:scale-105 transition-all duration-200">
                    <button onClick={() => setExpanded(item)} className="block w-full">
                      {item.kind === 'image' ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.image_url} alt={item.prompt} className="w-28 h-28 object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                            <p className="text-[10px] text-white leading-tight line-clamp-2">{item.prompt}</p>
                          </div>
                        </>
                      ) : (
                        <div className="w-28 h-28 bg-black/40 flex flex-col items-center justify-center gap-1">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#00b8d4]">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="currentColor" />
                          </svg>
                          <p className="text-[9px] text-white/50 px-1 text-center line-clamp-2 leading-tight">{item.prompt}</p>
                        </div>
                      )}
                    </button>
                    {/* Copy prompt on thumbnail */}
                    <button
                      onClick={(e) => { e.stopPropagation(); copyPrompt(item.prompt, item.id) }}
                      title="Copy prompt"
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                      {copiedId === item.id ? <CheckIcon size={10} /> : <CopyIcon size={10} />}
                    </button>
                    {/* Delete from history */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        item.kind === 'image' ? handleDelete(item.id) : handleDeleteVideo(item.id)
                      }}
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
            className="relative bg-[#0f2035] border border-white/10 rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {expanded.kind === 'image' ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={expanded.image_url} alt={expanded.prompt} className="w-full object-contain max-h-[60vh]" />
            ) : (
              <video src={expanded.video_url} controls className="w-full max-h-[60vh] bg-black" />
            )}
            <div className="p-4 space-y-2">
              <p className="text-sm text-slate-300">{expanded.prompt}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <ModelBadge model={expanded.model} />
                <span>{new Date(expanded.created_at).toLocaleString()}</span>
              </div>
              <div className="flex gap-2 pt-1 flex-wrap">
                <button
                  onClick={() => copyPrompt(expanded.prompt, `modal-${expanded.id}`)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-all"
                >
                  {copiedId === `modal-${expanded.id}` ? <><CheckIcon size={12} /> Copied!</> : <><CopyIcon size={12} /> Copy prompt</>}
                </button>
                {expanded.kind === 'image' ? (
                  <>
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
                      <TrashIcon size={12} /> Delete
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href={expanded.video_url}
                      download="reelx-video.mp4"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <DownloadIcon size={12} /> Download
                    </a>
                    <button
                      onClick={() => handleDeleteVideo(expanded.id)}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-all ml-auto"
                    >
                      <TrashIcon size={12} /> Delete
                    </button>
                  </>
                )}
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

      {onboardingStep !== null && (
        <OnboardingOverlay
          step={onboardingStep}
          selections={onboardingSelections}
          onSelect={(s) => setOnboardingSelections(prev => ({ ...prev, [onboardingStep]: s }))}
          onNext={() => setOnboardingStep(prev => (prev ?? 0) + 1)}
          onFinish={handleOnboardingFinish}
        />
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardInner />
    </Suspense>
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
        className="appearance-none bg-white/[0.06] border border-white/[0.08] rounded-lg pl-3 pr-7 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00b8d4]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-w-[140px] max-w-[170px]"
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

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-slate-500">
      <path d="M12 16V4m0 0l-4 4m4-4l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
  return <div className="loader-ribbon" style={{ width: 80 }} />
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
    ?? VIDEO_MODELS.find((x) => x.id === model)
    ?? I2V_MODELS.find((x) => x.id === model)
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
