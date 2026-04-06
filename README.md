# InstaArt

AI image and video generation studio built with Next.js, Supabase, and multiple AI provider APIs.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Supabase** — auth (Google OAuth) + Postgres database + Storage
- **OpenRouter** — image generation (Gemini Flash, GPT-4o Image, FLUX, etc.)
- **Kie.ai** — video generation (Runway, Veo, Kling, Sora, Seedance, Hailuo, Wan, and more)

---

## Features

- **Image generation** — text-to-image across 15+ models with resolution and aspect ratio control
- **Text-to-video** — 17 video models across budget / standard / premium tiers, including audio-enabled variants (Veo 3.1 with Audio, Kling 3.0 with Audio, Sora 2 with Audio)
- **Image-to-video** — 12 models; upload any image or use a freshly generated one via the "Use this image to generate a video" shortcut
- **History** — per-user gallery with soft-delete and prompt copy
- **Rate limiting** — 10 generations per user per calendar day

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/janmm97/InstaArt
cd InstaArt
npm install
```

### 2. Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL migrations below in **SQL Editor → New query**

#### SQL migrations

```sql
-- Users table (mirrors Supabase Auth)
create table public.users (
  id        uuid primary key default gen_random_uuid(),
  auth_id   uuid unique not null,
  email     text,
  name      text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Images table
create table public.images (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  prompt     text not null,
  model      text,
  image_url  text,
  status     text not null default 'pending',
  deleted_at timestamptz,
  created_at timestamptz default now()
);

create index on public.images (user_id, status, created_at);

alter table public.images enable row level security;

create policy "Users see own images"
  on public.images for select
  using (
    user_id = (select id from public.users where auth_id = auth.uid())
  );

-- Videos table
create table public.videos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  prompt     text not null,
  model      text,
  video_url  text,
  job_id     text,
  aspect_ratio text,
  status     text not null default 'pending',
  created_at timestamptz default now()
);

create index on public.videos (user_id, status, created_at);

alter table public.videos enable row level security;

create policy "Users see own videos"
  on public.videos for select
  using (
    user_id = (select id from public.users where auth_id = auth.uid())
  );
```

> **Note:** API routes use the service-role key to bypass RLS for writes.

### 3. Enable Google OAuth

1. Supabase Dashboard → **Authentication → Providers → Google**
2. Enable it and enter your Google OAuth Client ID and Client Secret
   (create at [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client ID → Web application)
3. Add the Authorized redirect URI in Google Console:
   ```
   https://<your-project-id>.supabase.co/auth/v1/callback
   ```
4. Supabase → **Authentication → URL Configuration** → Redirect URLs:
   ```
   http://localhost:3000/auth/callback
   ```

### 4. Environment variables

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `KIE_API_KEY` | [kie.ai](https://kie.ai) → Dashboard → API Keys |

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
app/
  page.tsx                          Landing page
  login/page.tsx                    Google sign-in
  dashboard/page.tsx                Main studio (image + video tabs)
  api/
    generate/route.ts               POST — image generation via OpenRouter
    generate-video/route.ts         POST — text-to-video via Kie.ai
    generate-video-from-image/      POST — image-to-video via Kie.ai
      route.ts
    images/[id]/route.ts            DELETE — soft-delete image
  auth/callback/route.ts            Supabase OAuth code exchange
lib/
  supabase/
    client.ts                       Browser Supabase client
    server.ts                       Server + service-role clients
middleware.ts                       Redirects unauthenticated /dashboard → /login
logs/                               Development changelog
```

## Video models

### Text-to-Video

| Tier | Model | Provider | Audio |
|------|-------|----------|-------|
| Budget | Runway Gen4 Turbo | Runway | — |
| Budget | Grok Text-to-Video | xAI | — |
| Budget | Seedance 2.0 Fast | ByteDance | Yes |
| Budget | Hailuo Standard | MiniMax | — |
| Standard | Runway Aleph | Runway | — |
| Standard | Veo 3.1 Fast | Google | Yes |
| Standard | Kling 2.6 | Kuaishou | Yes |
| Standard | Kling 3.0 | Kuaishou | — |
| Standard | Seedance 2.0 | ByteDance | Yes |
| Standard | Hailuo Pro | MiniMax | — |
| Standard | Sora 2 | OpenAI | — |
| Standard | Wan 2.6 | Alibaba | Yes |
| Premium | Veo 3.1 Quality | Google | Yes |
| Premium | Veo 3.1 with Audio | Google | Yes |
| Premium | Kling 3.0 with Audio | Kuaishou | Yes |
| Premium | Sora 2 Pro | OpenAI | — |
| Premium | Sora 2 with Audio | OpenAI | Yes |

### Image-to-Video

| Tier | Model | Provider | Audio |
|------|-------|----------|-------|
| Budget | Grok | xAI | — |
| Budget | Wan 2.6 Flash | Alibaba | Yes |
| Budget | Hailuo Standard | MiniMax | — |
| Standard | Kling 3.0 | Kuaishou | — |
| Standard | Seedance 2.0 | ByteDance | Yes |
| Standard | Hailuo Pro | MiniMax | — |
| Standard | Wan 2.6 | Alibaba | Yes |
| Standard | Sora 2 | OpenAI | — |
| Standard | Veo 3.1 Fast | Google | Yes |
| Premium | Kling 3.0 with Audio | Kuaishou | Yes |
| Premium | Sora 2 Pro | OpenAI | — |
| Premium | Veo 3.1 Quality | Google | Yes |

## Deploying

```bash
npx vercel
```

Add all environment variables in your Vercel project settings, and add your production URL to the Supabase redirect URL list and Google OAuth authorized redirect URIs.
