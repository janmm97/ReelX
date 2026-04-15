import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { prompt?: string; type?: string }
  const { prompt, type = 'image' } = body

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  const systemPrompt = type === 'video'
    ? `You are a creative AI video prompt enhancer. Take the user's basic video prompt and expand it into a rich, detailed, cinematic description. Add camera movements (pans, zooms, tracking shots), lighting conditions, mood, color palette, artistic style, and technical quality descriptors. Keep the enhanced prompt under 200 words. Return only the enhanced prompt text, no explanations or preamble.`
    : `You are a creative AI image prompt enhancer. Take the user's basic image prompt and expand it into a rich, detailed, visually stunning description. Add lighting details (golden hour, studio, dramatic), composition, artistic style, mood, texture details, and technical quality descriptors like "8K", "photorealistic", "cinematic". Keep the enhanced prompt under 200 words. Return only the enhanced prompt text, no explanations or preamble.`

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': request.headers.get('origin') ?? '',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt.trim() },
        ],
      }),
    })

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } }

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message ?? 'Enhancement failed' }, { status: 502 })
    }

    const enhanced = data.choices?.[0]?.message?.content
    if (!enhanced) {
      return NextResponse.json({ error: 'No response from model' }, { status: 502 })
    }

    return NextResponse.json({ prompt: enhanced.trim() })
  } catch {
    return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 })
  }
}
