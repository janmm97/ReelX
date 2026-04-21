# Reelx — AI Image, Video & Avatar Generation Studio

**Reelx is an AI creative studio** that lets you generate production-ready images, cinematic videos, and lip-synced talking avatar content from a single credit-based platform. Access 15+ frontier AI models — including GPT-5 Image Mode, Veo 3.1, Kling 3.0, and Seedance 2.0 — without switching tools or managing separate API keys.

Built with Next.js, Supabase, and a unified credit system across image generation, text-to-video, image-to-video, and avatar video workflows.

[![License: MIT](https://img.shields.io/badge/License-MIT-white.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-green?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)

---

## What is Reelx?

Reelx is an AI-powered content generation platform for marketers, UGC creators, and agencies. It combines three generation types in one workspace:

- **AI Image Generation** — Text-to-image across 15+ models with aspect ratio and resolution control. Supports GPT-5 Image Mode, FLUX.2 Klein, Nano Banana 3 Pro & Flash, and more via OpenRouter.
- **AI Video Generation** — Text-to-video and image-to-video across 17+ models including Veo 3.1, Kling 3.0, Seedance 2.0, Sora 2, Runway, Hailuo, and Wan. Multiple tiers: budget, standard, and premium. Audio-enabled variants available.
- **Studio — Talking Avatar Video** — Upload a portrait image, write or record a script, and generate a lip-synced talking video using ElevenLabs voice cloning (28+ languages). Powered by InfiniteTalk and Kling Avatar models.

Users purchase credits that work across all three generation types. Plans start at $6.99/month. A free tier is included — no credit card required.

---

## Key Features

- **15+ AI image models** — GPT-5 Image Mode, FLUX.2 Klein, Nano Banana 3 Pro & Flash; budget through ultra-premium tiers
- **17+ AI video models** — Text-to-video and image-to-video with audio support (Veo 3.1 Audio, Kling 3.0 Audio, Sora 2 Audio)
- **Avatar video studio** — ElevenLabs voice cloning + lip sync, 28+ languages, InfiniteTalk and Kling Avatar engines
- **Unified credit wallet** — one balance works across image generation, video generation, and avatar studio
- **Image-to-video shortcut** — generate an image, then instantly use it as the source for a video in one click
- **Stripe subscriptions** — Creator ($6.99/mo), Pro ($11.99/mo), Premium ($24.99/mo); annual billing available
- **Credit top-up packs** — Spark 500cr, Boost 2000cr, Power 6000cr, Studio 15000cr; never expire
- **Google OAuth auth** — via Supabase; no password required
- **Generation history** — per-user gallery with soft-delete and prompt copy
- **Multi-image upload** — attach multiple reference images for image-to-video workflows

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, TypeScript, Tailwind CSS v4) |
| Auth + Database | Supabase (Google OAuth, Postgres, Storage) |
| Image Generation | OpenRouter (GPT-5 Image, FLUX.2, Nano Banana 3, and more) |
| Video Generation | Kie.ai (Veo 3.1, Kling 3.0, Seedance 2.0, Sora 2, Runway, Hailuo, Wan) |
| Avatar Studio | Kie.ai InfiniteTalk + Kling Avatar; ElevenLabs TTS |
| Voice Cloning | ElevenLabs API |
| Payments | Stripe (subscriptions + one-time top-up packs) |
| Animations | Framer Motion |
| Deployment | Vercel |

---

## AI Models

### Image Generation

| Tier | Model | Provider |
|------|-------|---------|
| Budget | FLUX.2 Klein | Black Forest Labs |
| Standard | Nano Banana 3 Flash | NB Labs |
| Standard | Nano Banana 3 Pro | NB Labs |
| Premium | GPT-5 Image Mode | OpenAI |

### Text-to-Video

| Tier | Model | Provider | Audio |
|------|-------|---------|-------|
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
|------|-------|---------|-------|
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

### Talking Avatar Video (Studio)

| Model | Provider | Notes |
|-------|---------|-------|
| InfiniteTalk | Kie.ai | Long-form lip sync, natural motion |
| Kling Avatar | Kuaishou | Short-form avatar, expressive motion |

---

## Project Structure

```
app/
  page.tsx                        Landing page (hero, features, gallery, FAQ, pricing)
  login/page.tsx                  Google OAuth sign-in
  dashboard/page.tsx              Image generation workspace
  products/page.tsx               Product overview (SSR + JSON-LD schema)
  pricing/page.tsx                Plans, credit packs, annual toggle
  studio/page.tsx                 Talking avatar video studio
  settings/page.tsx               Account settings
  billing/page.tsx                Subscription management
  privacy/page.tsx                Privacy policy
  legal/page.tsx                  Terms of service
  contact/page.tsx                Contact page
  api/
    generate/route.ts             POST — AI image generation via OpenRouter
    generate-video/route.ts       POST — text-to-video via Kie.ai
    generate-video-from-image/
      route.ts                    POST — image-to-video via Kie.ai
    studio/route.ts               POST — talking avatar video via Kie.ai
    billing/
      checkout/route.ts           POST — Stripe subscription checkout
      webhook/route.ts            POST — Stripe webhook handler
      portal/route.ts             POST — Stripe customer portal
    credits/
      topup/route.ts              POST — Stripe one-time credit top-up
    images/[id]/route.ts          DELETE — soft-delete image
  auth/callback/route.ts          Supabase OAuth code exchange
components/
  PublicHeader.tsx                Navigation header for public pages
lib/
  supabase/
    client.ts                     Browser Supabase client
    server.ts                     Server + service-role clients
middleware.ts                     Redirects unauthenticated users to /login
```

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
2. Run the SQL migrations in **SQL Editor → New query**

```sql
-- Users table
create table public.users (
  id          uuid primary key default gen_random_uuid(),
  auth_id     uuid unique not null,
  email       text,
  name        text,
  avatar_url  text,
  credits     integer not null default 0,
  plan        text not null default 'free',
  stripe_customer_id text,
  created_at  timestamptz default now()
);

-- Images table
create table public.images (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  prompt      text not null,
  model       text,
  image_url   text,
  status      text not null default 'pending',
  deleted_at  timestamptz,
  created_at  timestamptz default now()
);

create index on public.images (user_id, status, created_at);

alter table public.images enable row level security;
create policy "Users see own images"
  on public.images for select
  using (user_id = (select id from public.users where auth_id = auth.uid()));

-- Videos table
create table public.videos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  prompt       text not null,
  model        text,
  video_url    text,
  job_id       text,
  aspect_ratio text,
  status       text not null default 'pending',
  created_at   timestamptz default now()
);

create index on public.videos (user_id, status, created_at);

alter table public.videos enable row level security;
create policy "Users see own videos"
  on public.videos for select
  using (user_id = (select id from public.users where auth_id = auth.uid()));
```

### 3. Enable Google OAuth

1. Supabase Dashboard → **Authentication → Providers → Google**
2. Enter your Google OAuth Client ID and Client Secret
   (create at [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client ID)
3. Add the authorized redirect URI in Google Console:
   ```
   https://<your-project-id>.supabase.co/auth/v1/callback
   ```
4. Supabase → **Authentication → URL Configuration** → add:
   ```
   http://localhost:3000/auth/callback
   ```

### 4. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `KIE_API_KEY` | [kie.ai](https://kie.ai) → Dashboard → API Keys |
| `ELEVENLABS_API_KEY` | [elevenlabs.io](https://elevenlabs.io) → Profile → API Keys |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → Signing secret |
| `STRIPE_PRICE_CREATOR_MONTHLY` | Stripe Dashboard → Products → Creator plan |
| `STRIPE_PRICE_PRO_MONTHLY` | Stripe Dashboard → Products → Pro plan |
| `STRIPE_PRICE_PREMIUM_MONTHLY` | Stripe Dashboard → Products → Premium plan |
| `NEXT_PUBLIC_APP_URL` | Your production URL (e.g. `https://reelx.ai`) |

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying

```bash
npx vercel
```

Add all environment variables in your Vercel project settings. Add your production URL to:
- Supabase → Authentication → URL Configuration → Redirect URLs
- Google Console → OAuth 2.0 Client → Authorized redirect URIs
- Stripe → Webhooks → Endpoint URL: `https://your-domain.com/api/billing/webhook`

---

## Pricing

| Plan | Monthly | Annual | Credits/mo |
|------|---------|--------|-----------|
| Free | $0 | $0 | Hard caps (50 images, 3 videos) |
| Creator | $6.99 | $4.99 | 2,000 |
| Pro | $11.99 | $9.99 | 5,000 |
| Premium | $24.99 | $19.99 | 10,000 (+ 2,500 rollover) |

Credit top-up packs (never expire): Spark 500cr/$1.49 · Boost 2000cr/$4.99 · Power 6000cr/$12.99 · Studio 15000cr/$29.99

---

## FAQ

**What AI models does Reelx use for image generation?**
Reelx routes image generation through OpenRouter. Available models include GPT-5 Image Mode (OpenAI), FLUX.2 Klein (Black Forest Labs), and Nano Banana 3 Pro & Flash (NB Labs). The model list is updated as new models launch.

**What AI models does Reelx use for video generation?**
Video generation uses the Kie.ai API. Supported models include Veo 3.1 (Google), Kling 3.0 (Kuaishou), Seedance 2.0 (ByteDance), Sora 2 (OpenAI), Runway, Hailuo (MiniMax), and Wan 2.6 (Alibaba). Both text-to-video and image-to-video are supported.

**How does the talking avatar studio work?**
Upload a portrait image and an audio file (or use ElevenLabs voice cloning). Reelx generates a lip-synced talking head video using InfiniteTalk or Kling Avatar models via Kie.ai.

**Can I use generated content commercially?**
Yes. All generated content belongs to you. Commercial use is permitted subject to the terms of the underlying model provider (OpenAI, Google, Kuaishou, etc.), which generally allow commercial use for API-generated outputs.

**How do credits work?**
Credits are a unified currency across image generation, video generation, and avatar studio. Each generation costs a set number of credits depending on the model and output type. Credits reset monthly on paid plans. Top-up packs never expire.

---

## License

MIT © 2026 Reelx
