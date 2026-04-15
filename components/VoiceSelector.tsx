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
  /** Pass true when the user has just connected their ElevenLabs account to trigger a reload */
  connected?: boolean
}

export default function VoiceSelector({ value, onChange, disabled, connected }: Props) {
  const [freeVoices, setFreeVoices] = useState<Voice[]>([])
  const [userVoices, setUserVoices] = useState<Voice[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [loadingFree, setLoadingFree] = useState(true)
  const [error, setError]             = useState<string | null>(null)

  // Load free voices once on mount
  useEffect(() => {
    fetch('/api/elevenlabs/voices?source=free')
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`)
        setFreeVoices(data.voices ?? [])
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingFree(false))
  }, [])

  // Load user voices on mount and whenever `connected` becomes true
  useEffect(() => {
    if (connected === false) return   // skip if parent explicitly says not connected yet
    fetch('/api/elevenlabs/voices?source=user')
      .then(async (r) => {
        const data = await r.json()
        if (data.connected) {
          setUserVoices(data.voices ?? [])
          setIsConnected(true)
        }
      })
      .catch(() => {})
  }, [connected])

  const allVoices     = [...freeVoices, ...userVoices]
  const selectedVoice = allVoices.find((v) => v.voiceId === value)

  if (loadingFree) {
    return <div className="h-9 w-full rounded-lg bg-white/[0.06] animate-pulse" />
  }

  if (error) {
    return <p className="text-xs text-red-400">Could not load voices: {error}</p>
  }

  return (
    <div className="flex flex-col gap-1.5">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00C4CC]/50 disabled:opacity-50 cursor-pointer"
      >
        <option value="">Select a voice</option>

        {freeVoices.length > 0 && (
          <optgroup label="Free Voices">
            {freeVoices.map((v) => (
              <option key={v.voiceId} value={v.voiceId} className="bg-[#1a1a2e]">
                {v.name}
              </option>
            ))}
          </optgroup>
        )}

        {isConnected && userVoices.length > 0 && (
          <optgroup label="My ElevenLabs Voices">
            {userVoices.map((v) => (
              <option key={v.voiceId} value={v.voiceId} className="bg-[#1a1a2e]">
                {v.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>

      {value && selectedVoice?.previewUrl && (
        <button
          type="button"
          onClick={() => new Audio(selectedVoice.previewUrl).play()}
          className="text-[11px] text-[#00C4CC] hover:text-[#00F2FE] text-left transition-colors"
        >
          ▶ Preview voice
        </button>
      )}

      {isConnected && userVoices.length === 0 && (
        <p className="text-xs text-slate-500">
          Your ElevenLabs account has no voices yet.
        </p>
      )}
    </div>
  )
}
