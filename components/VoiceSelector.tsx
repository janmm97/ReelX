'use client'

import { useEffect, useState } from 'react'

interface Voice {
  voiceId:    string
  name:       string
  previewUrl: string
}

interface Props {
  value:    string | null
  onChange: (voiceId: string) => void
  disabled?: boolean
}

export default function VoiceSelector({ value, onChange, disabled }: Props) {
  const [voices, setVoices] = useState<Voice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/elevenlabs/voices')
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`)
        setVoices(data.voices ?? [])
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="h-9 w-full rounded-lg bg-white/[0.06] animate-pulse" />
  }

  if (error) {
    return (
      <p className="text-xs text-red-400">
        Could not load voices: {error}
      </p>
    )
  }

  if (voices.length === 0) {
    return (
      <p className="text-xs text-slate-500">
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
        className="w-full appearance-none bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 disabled:opacity-50 cursor-pointer"
      >
        <option value="">Select a cloned voice</option>
        {voices.map((v) => (
          <option key={v.voiceId} value={v.voiceId} className="bg-[#1a1a2e]">
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
            className="text-[11px] text-purple-400 hover:text-purple-300 text-left transition-colors"
          >
            ▶ Preview voice
          </button>
        ) : null
      })()}
    </div>
  )
}
