import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  getUserSub, canAfford, deductCreditsAmount, refundCreditsAmount, affordErrorMessage,
} from '@/lib/credits'

export const maxDuration = 60

// Only multimodal models that accept image_url content parts on OpenRouter
const BLEND_MODEL_MAP = {
  gpt5mini:     'openai/gpt-5-image-mini',
  gpt5:         'openai/gpt-5-image',
  gemini25flash: 'google/gemini-2.5-flash-image',
  gemini:       'google/gemini-3.1-flash-image-preview',
  gemini3pro:   'google/gemini-3-pro-image-preview',
} as const

type BlendModelKey = keyof typeof BLEND_MODEL_MAP

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

  if (message.images?.length) {
    for (const part of message.images) {
      if (part.type === 'image_url' && part.image_url?.url) {
        return normaliseImage(part.image_url.url)
      }
    }
  }

  if (typeof message.content === 'string') {
    const content = message.content
    if (content.includes('data:image/')) {
      const prefixMatch = content.match(/data:image\/[a-z]+;base64,/)
      if (prefixMatch) {
        return normaliseImage(content.slice(content.indexOf(prefixMatch[0])))
      }
    }
    const mdMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/)
    if (mdMatch) return mdMatch[1]
    const urlMatch = content.match(/https?:\/\/\S+\.(?:png|jpg|jpeg|webp|gif)(\?[^\s]*)?/i)
    if (urlMatch) return urlMatch[0]
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

async function uploadToStorage(
  service: ReturnType<typeof createServiceClient>,
  file: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  const bucket = 'uploads'
  const path   = `blend/${Date.now()}-${filename}`

  await service.storage.createBucket(bucket, { public: true }).catch(() => {})

  const { error } = await service.storage.from(bucket).upload(path, file, {
    contentType,
    upsert: false,
  })
  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = service.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse FormData
  const formData = await request.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const prompt     = formData.get('prompt') as string | null
  const model      = formData.get('model') as string | null
  const imageFiles = (formData.getAll('images[]') as File[]).filter(f => f.size > 0)

  // 3. Validate inputs
  if (!prompt || !prompt.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }
  if (!model || !Object.keys(BLEND_MODEL_MAP).includes(model)) {
    return NextResponse.json({ error: 'model must be a multimodal model (gpt5mini, gpt5, gemini, etc.)' }, { status: 400 })
  }
  if (imageFiles.length < 2) {
    return NextResponse.json({ error: 'At least 2 reference images are required' }, { status: 400 })
  }
  if (imageFiles.length > 8) {
    return NextResponse.json({ error: 'Maximum 8 reference images allowed' }, { status: 400 })
  }
  for (const f of imageFiles) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are supported' }, { status: 400 })
    }
    if (f.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Each image must be under 10 MB' }, { status: 400 })
    }
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
  }

  const service = createServiceClient()

  // 4. Look up internal user id
  const { data: dbUser, error: userErr } = await service
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (userErr || !dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // 5. Plan gate — Image Blend requires Creator plan or higher (no free tier)
  const sub  = await getUserSub(user.id)
  const plan = sub?.plan ?? 'free'

  if (plan === 'free') {
    return NextResponse.json(
      { error: 'Image Blend is available on Creator plan and above. Upgrade to unlock it.', upgrade: true },
      { status: 403 },
    )
  }

  const check = await canAfford(user.id, model)
  if (!check.ok) {
    return NextResponse.json(
      { error: affordErrorMessage(check.reason), upgrade: check.reason === 'upgrade_required' },
      { status: 403 },
    )
  }
  const creditsCost = check.credits

  // 6. Daily rate limit
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

  // 7. Insert pending row
  const { data: imageRow, error: insertErr } = await service
    .from('images')
    .insert({
      user_id: dbUser.id,
      prompt:  prompt.trim(),
      model,
      status:  'pending',
      kind:    'blend',
    })
    .select('id')
    .single()

  if (insertErr || !imageRow) {
    return NextResponse.json({ error: 'Failed to create image record' }, { status: 500 })
  }

  const imageId: string = imageRow.id

  // 8. Deduct credits upfront
  try {
    await deductCreditsAmount(user.id, creditsCost, model, imageId, 'image')
  } catch {
    await service.from('images').update({ status: 'failed' }).eq('id', imageId)
    return NextResponse.json({ error: 'Credit deduction failed. Please try again.' }, { status: 500 })
  }

  // 9. Upload reference images to Supabase Storage
  //    Credits are already deducted — refund on upload failure
  let publicUrls: string[]
  try {
    publicUrls = await Promise.all(
      imageFiles.map(async (f) => {
        const buf = Buffer.from(await f.arrayBuffer())
        return uploadToStorage(service, buf, f.name, f.type)
      })
    )
  } catch (err) {
    await service.from('images').update({ status: 'failed' }).eq('id', imageId)
    await refundCreditsAmount(user.id, creditsCost, imageId, 'image').catch(() => {})
    const message = err instanceof Error ? err.message : 'Image upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // 10. Call OpenRouter — images first, then the text instruction
  const orModel = BLEND_MODEL_MAP[model as BlendModelKey]
  let imageUrl: string | null = null

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60_000)

    const contentParts: ContentPart[] = [
      ...publicUrls.map((url) => ({
        type: 'image_url' as const,
        image_url: { url },
      })),
      {
        type: 'text' as const,
        text: `Generate an image: ${prompt.trim()}`,
      },
    ]

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
        messages: [{ role: 'user', content: contentParts }],
      }),
    }).finally(() => clearTimeout(timeout))

    const orData = await orRes.json() as ORResponse

    if (!orRes.ok) {
      console.error('[generate-blend] OpenRouter error:', JSON.stringify(orData))
      throw new Error(orData.error?.message ?? `OpenRouter error ${orRes.status}`)
    }

    imageUrl = extractImageUrl(orData)
    if (!imageUrl) throw new Error('No image found in OpenRouter response')

  } catch (err) {
    await service.from('images').update({ status: 'failed' }).eq('id', imageId)
    await refundCreditsAmount(user.id, creditsCost, imageId, 'image').catch(() => {})
    const message = err instanceof Error ? err.message : 'Image blend failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  // 11. Mark done
  await service
    .from('images')
    .update({ image_url: imageUrl, status: 'done', credits_charged: creditsCost || null })
    .eq('id', imageId)

  return NextResponse.json({ imageUrl, imageId })
}
