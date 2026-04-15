'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  email: string
  name: string | null
  avatar_url: string | null
}

async function downloadFile(url: string, filename: string) {
  const res = await fetch(url)
  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  a.click()
  URL.revokeObjectURL(blobUrl)
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.push('/login'); return }
      setUser({
        email: u.email ?? '',
        name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? null,
        avatar_url: u.user_metadata?.avatar_url ?? null,
      })
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDownloadAll() {
    setDownloading(true)
    setDownloadProgress(null)
    setMessage(null)
    try {
      const [imagesRes, videosRes] = await Promise.all([
        supabase
          .from('images')
          .select('id, image_url, prompt, created_at')
          .eq('status', 'done')
          .eq('hidden', false)
          .order('created_at', { ascending: false }),
        supabase
          .from('videos')
          .select('id, video_url, prompt, created_at')
          .eq('status', 'done')
          .order('created_at', { ascending: false }),
      ])

      const images = imagesRes.data ?? []
      const videos = videosRes.data ?? []
      const total = images.length + videos.length

      if (total === 0) {
        setMessage({ text: 'No generated content found to download.', type: 'error' })
        setDownloading(false)
        return
      }

      setDownloadProgress({ current: 0, total })

      let current = 0

      for (const img of images) {
        const slug = img.prompt?.slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase() ?? 'image'
        const date = new Date(img.created_at).toISOString().slice(0, 10)
        try {
          await downloadFile(img.image_url, `reelsy-${date}-${slug}.png`)
        } catch {
          // skip failed downloads
        }
        current++
        setDownloadProgress({ current, total })
        // small delay to prevent browser from blocking too many downloads
        await new Promise(r => setTimeout(r, 300))
      }

      for (const vid of videos) {
        const slug = vid.prompt?.slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase() ?? 'video'
        const date = new Date(vid.created_at).toISOString().slice(0, 10)
        try {
          await downloadFile(vid.video_url, `reelsy-${date}-${slug}.mp4`)
        } catch {
          // skip failed downloads
        }
        current++
        setDownloadProgress({ current, total })
        await new Promise(r => setTimeout(r, 300))
      }

      setMessage({ text: `Downloaded ${total} file${total !== 1 ? 's' : ''} successfully.`, type: 'success' })
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Download failed', type: 'error' })
    } finally {
      setDownloading(false)
      setDownloadProgress(null)
    }
  }

  async function handleDeleteAccount() {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    setMessage(null)
    try {
      // Sign out and delete account via API
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? 'Account deletion failed')
      }
      await supabase.auth.signOut()
      router.push('/?deleted=1')
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Deletion failed — please contact support.', type: 'error' })
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0F14' }}>
        <div style={{ color: '#738295', fontSize: 14 }}>Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#0B0F14', fontFamily: 'var(--font-manrope)' }}>

      {/* Header */}
      <header style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', background: '#101722', borderBottom: '1px solid #273242',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Image src="/For Rebranding/reelsy-icon.png" alt="Reelsy" width={24} height={24} style={{ objectFit: 'contain' }} />
          </Link>
          <span style={{ color: '#273242', fontSize: 14 }}>/</span>
          <span style={{ color: '#F4F8FB', fontSize: 14, fontWeight: 600 }}>Settings</span>
        </div>
        <Link href="/dashboard" style={{ fontSize: 13, color: '#738295', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#F4F8FB')}
          onMouseLeave={e => (e.currentTarget.style.color = '#738295')}
        >
          ← Back to Dashboard
        </Link>
      </header>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Account info */}
        <section style={{ background: '#101722', border: '1px solid #273242', borderRadius: 16, padding: '24px 28px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: 16, fontWeight: 700, color: '#F4F8FB', margin: '0 0 16px' }}>
            Account
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt={user.name ?? ''} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1a2233', border: '1px solid #273242', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#738295' }}>
                {(user?.name ?? user?.email ?? '?')[0].toUpperCase()}
              </div>
            )}
            <div>
              {user?.name && <p style={{ fontSize: 15, fontWeight: 600, color: '#F4F8FB', margin: '0 0 2px' }}>{user.name}</p>}
              <p style={{ fontSize: 13, color: '#738295', margin: 0 }}>{user?.email}</p>
            </div>
          </div>
        </section>

        {message && (
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            <p style={{ fontSize: 13, color: message.type === 'success' ? '#6ee7b7' : '#fca5a5', margin: 0 }}>{message.text}</p>
          </div>
        )}

        {/* Download all */}
        <section style={{ background: '#101722', border: '1px solid #273242', borderRadius: 16, padding: '24px 28px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: 16, fontWeight: 700, color: '#F4F8FB', margin: '0 0 6px' }}>
            Download Your Content
          </h2>
          <p style={{ fontSize: 13, color: '#738295', margin: '0 0 20px', lineHeight: 1.5 }}>
            Download all images and videos you&apos;ve generated. Files are downloaded one-by-one to your browser.
          </p>

          {downloadProgress && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#738295' }}>
                  Downloading {downloadProgress.current} of {downloadProgress.total}…
                </span>
                <span style={{ fontSize: 12, color: '#738295' }}>
                  {Math.round((downloadProgress.current / downloadProgress.total) * 100)}%
                </span>
              </div>
              <div style={{ height: 4, background: '#1a2233', borderRadius: 99 }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  width: `${(downloadProgress.current / downloadProgress.total) * 100}%`,
                  background: 'linear-gradient(90deg, #00C4CC, #00F2FE)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}

          <button
            onClick={handleDownloadAll}
            disabled={downloading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: 'linear-gradient(135deg, #00C4CC, #00F2FE)',
              border: 'none', color: '#0B0F14', cursor: downloading ? 'wait' : 'pointer',
              opacity: downloading ? 0.7 : 1, transition: 'opacity 0.15s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v7m0 0l-3-3m3 3l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {downloading ? 'Downloading…' : 'Download All Images & Videos'}
          </button>
        </section>

        {/* Danger zone */}
        <section style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: '24px 28px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: 16, fontWeight: 700, color: '#fca5a5', margin: '0 0 6px' }}>
            Danger Zone
          </h2>
          <p style={{ fontSize: 13, color: '#738295', margin: '0 0 20px', lineHeight: 1.5 }}>
            Permanently delete your account and all associated data including generated images, videos, and credits. <strong style={{ color: '#fca5a5' }}>This cannot be undone.</strong>
          </p>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: 'none', border: '1px solid rgba(239,68,68,0.4)',
                color: '#fca5a5', cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              Delete My Account
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: '#fca5a5', margin: 0 }}>
                Type <strong>DELETE</strong> to confirm account deletion:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                style={{
                  background: '#0B0F14', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8,
                  padding: '10px 14px', fontSize: 13, color: '#F4F8FB', outline: 'none',
                  maxWidth: 300,
                }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== 'DELETE' || deleting}
                  style={{
                    padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    background: confirmText === 'DELETE' ? '#ef4444' : '#1a2233',
                    border: 'none', color: '#fff',
                    cursor: confirmText === 'DELETE' && !deleting ? 'pointer' : 'not-allowed',
                    opacity: confirmText !== 'DELETE' || deleting ? 0.5 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {deleting ? 'Deleting…' : 'Permanently Delete Account'}
                </button>
                <button
                  onClick={() => { setConfirmDelete(false); setConfirmText('') }}
                  style={{
                    padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    background: 'none', border: '1px solid #273242', color: '#738295', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
