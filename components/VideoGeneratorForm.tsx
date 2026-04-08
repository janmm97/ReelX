'use client'

import { useState, useRef } from 'react'
import VoiceSelector from './VoiceSelector'
import VideoPlayer from './VideoPlayer'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES  = new Set(['image/jpeg', 'image/png', 'image/webp'])
const POLL_INTERVAL  = 5000 // 5 s

type Step =
  | { id: 'idle' }
  | { id: 'uploading-image' }
  | { id: 'generating-tts' }
  | { id: 'splitting-audio' }
  | { id: 'submitting-chunks' }
  | { id: 'processing'; completed: number; total: number }
  | { id: 'stitching' }
  | { id: 'done'; videoUrl: string }
  | { id: 'error'; message: string }

const STEP_LABELS: Record<Step['id'], string> = {
  'idle':             '',
  'uploading-image':  'Uploading image…',
  'generating-tts':   'Generating voice…',
  'splitting-audio':  'Splitting audio…',
  'submitting-chunks': 'Submitting to AI…',
  'processing':       'Generating video…',
  'stitching':        'Stitching final video…',
  'done':             'Done!',
  'error':            'Error',
}

interface Props {
  userId: string
}

export default function VideoGeneratorForm({ userId }: Props) {
  const [imageFile,   setImageFile]   = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [transcript,  setTranscript]  = useState('')
  const [motionPrompt, setMotionPrompt] = useState('')
  const [voiceId,     setVoiceId]     = useState<string | null>(null)
  const [step,        setStep]        = useState<Step>({ id: 'idle' })
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_TYPES.has(file.type)) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!imageFile || !voiceId || !transcript.trim() || step.id !== 'idle') return

    try {
      // Step 1: Upload image via server-side API (bypasses storage RLS)
      setStep({ id: 'uploading-image' })
      const uploadForm = new FormData()
      uploadForm.append('file', imageFile)
      uploadForm.append('prefix', 'studio')
      const uploadRes = await fetch('/api/upload-image', { method: 'POST', body: uploadForm })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error ?? 'Image upload failed')
      const imageUrl: string = uploadData.publicUrl

      // Step 2: Generate TTS audio
      setStep({ id: 'generating-tts' })
      const ttsRes  = await fetch('/api/elevenlabs/tts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ voiceId, transcript: transcript.trim() }),
      })
      const ttsData = await ttsRes.json()
      if (!ttsRes.ok) throw new Error(ttsData.error ?? 'TTS failed')

      // Step 3: Split audio into chunks
      setStep({ id: 'splitting-audio' })
      const splitRes  = await fetch('/api/video/split-audio', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ audioStoragePath: ttsData.audioStoragePath }),
      })
      const splitData = await splitRes.json()
      if (!splitRes.ok) throw new Error(splitData.error ?? 'Audio split failed')
      const { audioChunkUrls } = splitData as { audioChunkUrls: string[] }

      // Step 4: Submit to kie.ai InfiniteTalk
      setStep({ id: 'submitting-chunks' })
      const genRes  = await fetch('/api/video/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          imageUrl,
          audioChunkUrls,
          prompt: motionPrompt.trim() || 'speak naturally with slight head movement',
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
  const canSubmit = !!imageFile && !!voiceId && !!transcript.trim() && !isLoading

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Portrait image upload */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-300">Portrait Image</label>
        <label className="relative flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-white/[0.12] hover:border-purple-500/40 transition-colors cursor-pointer bg-white/[0.02]">
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-xl" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-xs">Upload portrait (JPEG, PNG, WebP · max 10 MB)</span>
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

      {/* Transcript */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-300">Transcript</label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Write the full script that will be spoken…"
          rows={4}
          disabled={isLoading}
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500/50 disabled:opacity-50"
        />
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
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 disabled:opacity-50"
        />
      </div>

      {/* Voice selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-300">Cloned Voice</label>
        <VoiceSelector value={voiceId} onChange={setVoiceId} disabled={isLoading} />
      </div>

      {/* Status / progress */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <svg className="w-4 h-4 animate-spin text-purple-400 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10" />
            </svg>
            <span>{STEP_LABELS[step.id]}</span>
          </div>
          {step.id === 'processing' && (
            <div className="flex flex-col gap-1">
              <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all duration-500"
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
        className="py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 hover:from-purple-500 hover:via-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_24px_rgba(139,92,246,0.35)] hover:shadow-[0_0_36px_rgba(139,92,246,0.55)] active:scale-[0.98]"
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
              setTranscript('')
              setMotionPrompt('')
              setVoiceId(null)
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
