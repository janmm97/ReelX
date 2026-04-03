import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const MODEL_MAP = {
  // ── Budget tier ──────────────────────────────────────────────
  flux2klein:           'black-forest-labs/flux.2-klein-4b',       // $3.42/M
  riverflowfast:        'sourceful/riverflow-v2-fast',              // $4.79/M
  riverflowfastpreview: 'sourceful/riverflow-v2-fast-preview',      // $7.19/M
  flux2pro:             'black-forest-labs/flux.2-pro',             // $7.32/M
  gpt5mini:             'openai/gpt-5-image-mini',                  // $8/M image
  riverflowstandard:    'sourceful/riverflow-v2-standard-preview',  // $8.38/M
  seedream:             'bytedance-seed/seedream-4.5',              // $9.58/M
  // ── Standard tier ────────────────────────────────────────────
  flux2flex:            'black-forest-labs/flux.2-flex',            // $14.65/M
  flux2max:             'black-forest-labs/flux.2-max',             // $17.09/M
  riverflowmax:         'sourceful/riverflow-v2-max-preview',       // $17.96/M
  // ── Premium tier ─────────────────────────────────────────────
  gemini25flash:        'google/gemini-2.5-flash-image',            // $30/M image
  riverflowp:           'sourceful/riverflow-v2-p',                 // $35.93/M
  gpt5:                 'openai/gpt-5-image',                       // $40/M image
  gemini:               'google/gemini-3.1-flash-image-preview',    // $60/M image
  gemini3pro:           'google/gemini-3-pro-image-preview',        // $120/M image
} as const

type ModelKey = keyof typeof MODEL_MAP

const DAILY_LIMIT = 10

interface ContentPart {
  type: 'text' | 'image_url'
  text?: string
  image_url?: { url: string }
}

interface ORMessage {
  content: string | ContentPart[] | null
  images?: ContentPart[]
}

interface ORResponse {
  choices?: Array<{ message?: ORMessage }>
  error?: { message?: string }
}

// Normalise a raw image string (data URI or bare base64) — strips embedded whitespace
// that OpenRouter/Gemini inserts when wrapping base64 at 76 chars.
function normaliseImage(raw: string): string {
  const prefixMatch = raw.match(/^(data:image\/[a-z]+;base64,)/)
  if (prefixMatch) {
    return prefixMatch[1] + raw.slice(prefixMatch[1].length).replace(/\s+/g, '')
  }
  return `data:image/png;base64,${raw.replace(/\s+/g, '')}`
}

function extractImageUrl(response: ORResponse): string | null {
  const message = response.choices?.[0]?.message
  if (!message) return null

  // OpenRouter/Gemini returns images in a separate `images` array (content is null)
  if (message.images?.length) {
    for (const part of message.images) {
      if (part.type === 'image_url' && part.image_url?.url) {
        return normaliseImage(part.image_url.url)
      }
    }
  }

  if (typeof message.content === 'string') {
    const content = message.content

    // Data URI (base64 may contain newlines from line-wrapping)
    if (content.includes('data:image/')) {
      const prefixMatch = content.match(/data:image\/[a-z]+;base64,/)
      if (prefixMatch) {
        return normaliseImage(content.slice(content.indexOf(prefixMatch[0])))
      }
    }
    // Markdown image link
    const mdMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/)
    if (mdMatch) return mdMatch[1]
    // Bare HTTP URL ending in image extension
    const urlMatch = content.match(/https?:\/\/\S+\.(?:png|jpg|jpeg|webp|gif)(\?[^\s]*)?/i)
    if (urlMatch) return urlMatch[0]
    // Raw base64 — strip whitespace then validate
    const stripped = content.replace(/\s+/g, '')
    if (/^[A-Za-z0-9+/]{100,}={0,2}$/.test(stripped)) {
      return `data:image/png;base64,${stripped}`
    }
    return null
  }

  if (!message.content) return null

  for (const part of message.content) {
    if (part.type === 'image_url' && part.image_url?.url) {
      return normaliseImage(part.image_url.url)
    }
    if (part.type === 'text' && part.text) {
      const text = part.text
      if (text.includes('data:image/')) {
        const prefixMatch = text.match(/data:image\/[a-z]+;base64,/)
        if (prefixMatch) {
          return normaliseImage(text.slice(text.indexOf(prefixMatch[0])))
        }
      }
      const stripped = text.replace(/\s+/g, '')
      if (/^[A-Za-z0-9+/]{100,}={0,2}$/.test(stripped)) {
        return `data:image/png;base64,${stripped}`
      }
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Validate body
  const body = await request.json().catch(() => ({})) as { prompt?: unknown; model?: unknown }
  const { prompt, model } = body

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }
  if (!model || !Object.keys(MODEL_MAP).includes(model as string)) {
    return NextResponse.json({ error: 'model must be "gemini" or "gpt5"' }, { status: 400 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
  }

  const service = createServiceClient()

  // 3. Look up internal user id
  const { data: dbUser, error: userErr } = await service
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (userErr || !dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // 4. Rate limit: max DAILY_LIMIT generations per calendar day
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count } = await service
    .from('images')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', dbUser.id)
    .in('status', ['pending', 'done'])
    .gte('created_at', todayStart.toISOString())

  if ((count ?? 0) >= DAILY_LIMIT) {
    return NextResponse.json({ error: 'Daily limit reached' }, { status: 429 })
  }

  // 5. Insert pending row
  const { data: imageRow, error: insertErr } = await service
    .from('images')
    .insert({ user_id: dbUser.id, prompt: prompt.trim(), model: model as string, status: 'pending' })
    .select('id')
    .single()

  if (insertErr || !imageRow) {
    return NextResponse.json({ error: 'Failed to create image record' }, { status: 500 })
  }

  const imageId: string = imageRow.id

  // 6. Call OpenRouter with a 60s timeout
  const orModel = MODEL_MAP[model as ModelKey]
  let imageUrl: string | null = null

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60_000)

    const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': request.headers.get('origin') ?? '',
      },
      body: JSON.stringify({
        model: orModel,
        messages: [{ role: 'user', content: `Generate an image: ${prompt.trim()}` }],
      }),
    }).finally(() => clearTimeout(timeout))

    const orData = await orRes.json() as ORResponse

    if (!orRes.ok) {
      console.error('[generate] OpenRouter error:', JSON.stringify(orData))
      throw new Error(orData.error?.message ?? `OpenRouter error ${orRes.status}`)
    }

    imageUrl = extractImageUrl(orData)
    if (!imageUrl) throw new Error('No image found in OpenRouter response')

  } catch (err) {
    await service.from('images').update({ status: 'failed' }).eq('id', imageId)
    const message = err instanceof Error ? err.message : 'Image generation failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  // 7. Mark done
  await service
    .from('images')
    .update({ image_url: imageUrl, status: 'done' })
    .eq('id', imageId)

  return NextResponse.json({ imageUrl, imageId })
}
