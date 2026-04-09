'use client'

import { useEffect, useState } from 'react'
import { useOneAuth } from '@withone/auth'

interface Props {
  userId: string
  onConnected?: () => void
}

export default function ConnectElevenLabsButton({ userId, onConnected }: Props) {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)

  // Check if already connected on mount
  useEffect(() => {
    fetch('/api/elevenlabs/voices')
      .then((r) => setConnected(r.ok))
      .catch(() => setConnected(false))
  }, [])

  const { open } = useOneAuth({
    token: {
      url: `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL}/api/one-auth`,
      headers: { 'x-user-id': userId },
    },
    onSuccess: async (connection) => {
      setSaving(true)
      try {
        const res = await fetch('/api/connections/save', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ platform: 'elevenlabs', connectionKey: connection.key }),
        })
        if (res.ok) {
          setConnected(true)
          onConnected?.()
        }
      } finally {
        setSaving(false)
      }
    },
    onError: (err) => console.error('[OneAuth]', err),
  })

  async function handleDisconnect() {
    await fetch('/api/connections/save', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ platform: 'elevenlabs' }),
    })
    setConnected(false)
  }

  if (connected === null) {
    return (
      <div className="h-9 w-40 rounded-lg bg-white/[0.06] animate-pulse" />
    )
  }

  if (connected) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          ElevenLabs Connected
        </span>
        <button
          onClick={handleDisconnect}
          className="text-[11px] text-slate-500 hover:text-red-400 transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={open}
      disabled={saving}
      className="btn-primary px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
    >
      {saving ? 'Saving…' : 'Connect ElevenLabs'}
    </button>
  )
}
