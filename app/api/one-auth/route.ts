// app/api/one-auth/route.ts
// Token endpoint called by the One Auth iframe widget.
// Must return CORS headers because One Auth runs in an embedded iframe.
import { NextRequest, NextResponse } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':          '*',
  'Access-Control-Allow-Methods':         'POST, OPTIONS',
  'Access-Control-Allow-Headers':         'Content-Type, Authorization, x-user-id',
  'Access-Control-Allow-Private-Network': 'true',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json(
      { error: 'x-user-id header is required' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const secretKey = process.env.ONE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json(
      { error: 'ONE_SECRET_KEY not configured' },
      { status: 500, headers: CORS_HEADERS },
    )
  }

  const { searchParams } = new URL(request.url)
  const page  = searchParams.get('page')  ?? '0'
  const limit = searchParams.get('limit') ?? '50'

  const res = await fetch(
    `https://api.withone.ai/v1/authkit/token?page=${page}&limit=${limit}`,
    {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-One-Secret': secretKey,
      },
      body: JSON.stringify({ identity: userId, identityType: 'user' }),
    },
  )

  const data = await res.json()
  return NextResponse.json(data, {
    status: res.status,
    headers: CORS_HEADERS,
  })
}
