'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ConnectElevenLabsButton from '@/components/ConnectElevenLabsButton'
import VideoGeneratorForm from '@/components/VideoGeneratorForm'

export default function StudioPage() {
  const router  = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
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
      <div className="min-h-screen flex items-center justify-center bg-[#060510]">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060510] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
          ← Back to Dashboard
        </Link>
        <h1 className="text-sm font-semibold text-white">Talking Video Studio</h1>
        <ConnectElevenLabsButton
          userId={userId}
          onConnected={() => setConnected(true)}
        />
      </nav>

      {/* Main */}
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Create a Talking Video</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Upload a portrait, write a script, pick your cloned ElevenLabs voice, and InstaArt
            generates a lip-synced talking video using your exact voice.
          </p>
        </div>

        {!connected && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-amber-950/30 border border-amber-700/30 text-sm text-amber-300">
            Connect your ElevenLabs account (top right) to use your cloned voices.
          </div>
        )}

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          <VideoGeneratorForm userId={userId} />
        </div>
      </div>
    </div>
  )
}
