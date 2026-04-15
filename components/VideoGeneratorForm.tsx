'use client'

import { useState, useRef } from 'react'
import VideoPlayer from './VideoPlayer'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const MAX_AUDIO_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_AUDIO_TYPES = new Set([
  'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/aac', 'audio/mp4', 'audio/ogg',
])
const POLL_INTERVAL  = 5000 // 5 s

type ModelChoice = 'infinitalk' | 'kling-avatar'

type Step =
  | { id: 'idle' }
  | { id: 'uploading-image' }
  | { id: 'uploading-audio' }
  | { id: 'splitting-audio' }
  | { id: 'submitting-chunks' }
  | { id: 'processing'; completed: number; total: number }
  | { id: 'stitching' }
  | { id: 'done'; videoUrl: string }
  | { id: 'error'; message: string }

const STEP_LABELS: Record<Step['id'], string> = {
  'idle':              '',
  'uploading-image':   'Uploading image…',
  'uploading-audio':   'Uploading audio…',
  'splitting-audio':   'Splitting audio…',
  'submitting-chunks': 'Submitting to AI…',
  'processing':        'Generating video…',
  'stitching':         'Stitching final video…',
  'done':              'Done!',
  'error':             'Error',
}

interface Props {
  userId: string
}

export default function VideoGeneratorForm({ userId }: Props) {
  const [model,        setModel]       = useState<ModelChoice>('infinitalk')
  const [imageFile,    setImageFile]   = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [audioFile,    setAudioFile]   = useState<File | null>(null)
  const [motionPrompt, setMotionPrompt] = useState('')
  const [step,         setStep]        = useState<Step>({ id: 'idle' })
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setStep({ id: 'error', message: 'Only JPEG, PNG, and WebP images are supported.' })
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setStep({ id: 'error', message: 'Image must be under 10 MB.' })
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    if (step.id === 'error') setStep({ id: 'idle' })
  }

  function handleAudioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_AUDIO_TYPES.has(file.type)) {
      setStep({ id: 'error', message: 'Unsupported format. Allowed: MPEG, WAV, AAC, MP4, OGG.' })
      return
    }
    if (file.size > MAX_AUDIO_SIZE) {
      setStep({ id: 'error', message: 'Audio must be under 10 MB.' })
      return
    }
    setAudioFile(file)
    if (step.id === 'error') setStep({ id: 'idle' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!imageFile || !audioFile || step.id !== 'idle') return

    try {
      // Step 1: Upload portrait image
      setStep({ id: 'uploading-image' })
      const uploadForm = new FormData()
      uploadForm.append('file', imageFile)
      uploadForm.append('prefix', 'studio')
      const uploadRes = await fetch('/api/upload-image', { method: 'POST', body: uploadForm })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error ?? 'Image upload failed')
      const imageUrl: string = uploadData.publicUrl

      // Step 2: Upload audio file
      setStep({ id: 'uploading-audio' })
      const audioForm = new FormData()
      audioForm.append('file', audioFile)
      const audioRes  = await fetch('/api/upload-audio', { method: 'POST', body: audioForm })
      const audioData = await audioRes.json()
      if (!audioRes.ok) throw new Error(audioData.error ?? 'Audio upload failed')

      // Step 3: Get audio chunk URLs
      // InfiniteTalk: split into 13s chunks (model has per-chunk duration limits)
      // Kling Avatar: pass the full audio URL directly — no splitting needed
      let audioChunkUrls: string[]
      if (model === 'kling-avatar') {
        if (!audioData.audioUrl) throw new Error('Audio URL missing from upload response')
        audioChunkUrls = [audioData.audioUrl]
      } else {
        setStep({ id: 'splitting-audio' })
        const splitRes  = await fetch('/api/video/split-audio', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ audioStoragePath: audioData.audioStoragePath }),
        })
        const splitData = await splitRes.json()
        if (!splitRes.ok) throw new Error(splitData.error ?? 'Audio split failed')
        audioChunkUrls = (splitData as { audioChunkUrls: string[] }).audioChunkUrls
      }

      // Step 4: Submit to kie.ai
      setStep({ id: 'submitting-chunks' })
      const defaultPrompt = model === 'kling-avatar'
        ? ''
        : 'speak naturally with slight head movement'
      const genRes  = await fetch('/api/video/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          imageUrl,
          audioChunkUrls,
          prompt:     motionPrompt.trim() || defaultPrompt,
          model,
          resolution: '720p',
        }),
      })
      const genData = await genRes.json()
      if (!genRes.ok) throw new Error(genData.error ?? 'Video submission failed')
      const { jobId } = genData as { jobId: string }

      // Step 5: Poll for completion
      setStep({ id: 'processing', completed: 0, total: audioChunkUrls.length })

      await new Promise<string>((resolve, reject) => {
        pollRef.current = setInterval(async () => {
          try {
            const statusRes  = await fetch(`/api/video/status?jobId=${jobId}`)
            const statusData = await statusRes.json()

            if (!statusRes.ok) {
              clearInterval(pollRef.current!)
              reject(new Error(statusData.error ?? 'Status check failed'))
              return
            }

            const { status, completedChunks, totalChunks, finalVideoUrl } = statusData as {
              status: string
              completedChunks: number
              totalChunks: number
              finalVideoUrl: string | null
            }

            if (status === 'failed') {
              clearInterval(pollRef.current!)
              reject(new Error('Video generation failed'))
              return
            }

            if (status === 'complete' && finalVideoUrl) {
              clearInterval(pollRef.current!)
              resolve(finalVideoUrl)
              return
            }

            if (completedChunks > 0) {
              setStep({ id: 'processing', completed: completedChunks, total: totalChunks })
            }
          } catch (err) {
            clearInterval(pollRef.current!)
            reject(err)
          }
        }, POLL_INTERVAL)
      }).then((videoUrl) => {
        setStep({ id: 'done', videoUrl })
      })

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setStep({ id: 'error', message })
    }
  }

  const isLoading = !['idle', 'done', 'error'].includes(step.id)
  const canSubmit = !!imageFile && !!audioFile && !isLoading

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Model selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-300">Model</label>
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
          {([
            { value: 'infinitalk',   label: 'InfiniteTalk' },
            { value: 'kling-avatar', label: 'Kling Avatar' },
          ] as { value: ModelChoice; label: string }[]).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              disabled={isLoading}
              onClick={() => setModel(value)}
              className={`py-1.5 rounded-md text-xs font-semibold transition-all ${
                model === value
                  ? 'bg-gradient-to-r from-[#00C4CC] to-[#00F2FE] text-[#0B0F14]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Portrait image upload */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-300">Portrait Image</label>
        <label className="relative flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-white/[0.12] hover:border-[#00C4CC]/40 transition-colors cursor-pointer bg-white/[0.02]">
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-xl" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500 px-6 text-center">
              <svg className="w-8 h-8 shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-xs leading-relaxed">Upload portrait (JPEG, PNG, WebP · max 10 MB)</span>
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            disabled={isLoading}
            className="hidden"
          />
        </label>
      </div>

      {/* Audio upload */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-300">Audio</label>
        <label className={`relative flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
          audioFile
            ? 'border-[#00C4CC]/40 bg-[#00C4CC]/5 py-3'
            : 'border-white/[0.12] hover:border-[#00C4CC]/40 bg-white/[0.02] py-6'
        } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          {audioFile ? (
            <div className="flex items-center gap-3 px-4 w-full">
              <svg className="w-8 h-8 shrink-0 text-[#00C4CC]" viewBox="0 0 24 24" fill="none">
                <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-white truncate">{audioFile.name}</span>
                <span className="text-[11px] text-slate-500">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setAudioFile(null) }}
                className="ml-auto text-slate-500 hover:text-white transition-colors shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500 px-6 text-center">
              <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span className="text-xs leading-relaxed">Upload audio · MP3, WAV, AAC, MP4, OGG · max 10 MB</span>
            </div>
          )}
          <input
            type="file"
            accept="audio/mpeg,audio/wav,audio/x-wav,audio/aac,audio/mp4,audio/ogg"
            onChange={handleAudioChange}
            disabled={isLoading}
            className="hidden"
          />
        </label>
      </div>

      {/* Motion prompt */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-300">Motion Prompt</label>
        <input
          type="text"
          value={motionPrompt}
          onChange={(e) => setMotionPrompt(e.target.value)}
          placeholder="e.g. speak naturally with slight head movement"
          disabled={isLoading}
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#00C4CC]/50 disabled:opacity-50"
        />
      </div>

      {/* Status / progress */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <svg className="w-4 h-4 animate-spin text-[#00C4CC] shrink-0" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10" />
            </svg>
            <span>{STEP_LABELS[step.id]}</span>
          </div>
          {step.id === 'processing' && (
            <div className="flex flex-col gap-1">
              <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00C4CC] to-[#00F2FE] transition-all duration-500"
                  style={{ width: `${(step.completed / step.total) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Processing chunk {step.completed} of {step.total}
              </p>
            </div>
          )}
        </div>
      )}

      {step.id === 'error' && (
        <p className="text-sm text-red-400 bg-red-950/30 border border-red-700/30 rounded-lg px-3 py-2.5">
          {step.message}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="btn-primary py-3 w-full rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center"
      >
        {isLoading ? STEP_LABELS[step.id] : 'Generate Talking Video'}
      </button>

      {/* Result */}
      {step.id === 'done' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-emerald-400">Your talking video is ready!</p>
          <VideoPlayer videoUrl={step.videoUrl} />
          <button
            type="button"
            onClick={() => {
              setStep({ id: 'idle' })
              setImageFile(null)
              setImagePreview(null)
              setAudioFile(null)
              setMotionPrompt('')
            }}
            className="text-xs text-slate-500 hover:text-white transition-colors"
          >
            Generate another
          </button>
        </div>
      )}
    </form>
  )
}
