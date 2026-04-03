# InstaArt

AI image generation app built with Next.js 14, Supabase, and OpenRouter.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Supabase** — auth (Google OAuth) + Postgres database
- **OpenRouter** — image generation via Gemini Flash or GPT-4o Image

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
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
  auth_id   uuid unique not null,   -- matches auth.users.id
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
  status     text not null default 'pending', -- pending | done | failed
  created_at timestamptz default now()
);

-- Index for rate-limit query
create index on public.images (user_id, status, created_at);

-- RLS: users can only read their own images
alter table public.images enable row level security;

create policy "Users see own images"
  on public.images for select
  using (
    user_id = (
      select id from public.users where auth_id = auth.uid()
    )
  );
```

> **Note:** The API routes use the service-role key to bypass RLS for writes,
> so you only need the select policy for the client-side history query.

### 3. Enable Google OAuth

1. Supabase Dashboard → **Authentication → Providers → Google**
2. Enable it and enter your **Google OAuth Client ID** and **Client Secret**
   (create credentials at [console.cloud.google.com](https://console.cloud.google.com) →
   APIs & Services → Credentials → OAuth 2.0 Client ID, type: Web application)
3. Add the **Authorized redirect URI** in Google Console:
   ```
   https://<your-project-id>.supabase.co/auth/v1/callback
   ```
4. Back in Supabase → **Authentication → URL Configuration**, add to **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   ```
   (add your production URL here too when you deploy)

### 4. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → `service_role` key |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) |

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
app/
  page.tsx                  Landing page
  login/page.tsx            Google sign-in
  dashboard/page.tsx        Image studio (prompt + gallery)
  api/generate/route.ts     POST — calls OpenRouter, stores result
  auth/callback/route.ts    Supabase OAuth code exchange
lib/
  supabase/
    client.ts               Browser client (createBrowserClient)
    server.ts               Server client + service-role client
middleware.ts               Redirects unauthenticated /dashboard → /login
```

## Rate limiting

The API enforces a hard limit of **10 generations per user per calendar day**.
Exceeding it returns `HTTP 429` with `{ "error": "Daily limit reached" }`.

## Deploying

Deploy to Vercel in one command:

```bash
npx vercel
```

Add the same four environment variables in your Vercel project settings, and
add your production URL (e.g. `https://instaart.vercel.app/auth/callback`) to
the Supabase redirect URL list and your Google OAuth authorized redirect URIs.
