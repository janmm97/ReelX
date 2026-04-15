'use client'

interface Props {
  videoUrl: string
}

export default function VideoPlayer({ videoUrl }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <video
        src={videoUrl}
        controls
        playsInline
        className="w-full rounded-xl border border-white/[0.08] bg-black"
      />
      <a
        href={videoUrl}
        download="reelx-talking-video.mp4"
        target="_blank"
        rel="noopener noreferrer"
        className="self-start px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-white font-medium transition-colors"
      >
        Download video
      </a>
    </div>
  )
}
