// app/api/video/status/route.ts
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const jobId = request.nextUrl.searchParams.get('jobId')
  if (!jobId) {
    return NextResponse.json({ error: 'jobId query param is required' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: job, error } = await service
    .from('video_jobs')
    .select('status, completed_chunks, total_chunks, final_video_url')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single()

  if (error || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json({
    status:         job.status,
    completedChunks: job.completed_chunks,
    totalChunks:    job.total_chunks,
    finalVideoUrl:  job.final_video_url,
  })
}
