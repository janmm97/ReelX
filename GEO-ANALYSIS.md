# GEO Analysis — Reelx (reelx.ai)
> Generated: 2026-04-21

---

## GEO Readiness Score: 24/100

The site is pre-launch (no live URL, no robots.txt, no llms.txt) and its homepage is fully client-side rendered, which makes it invisible to AI crawlers. One page (`/products`) has schema markup. Everything else is missing.

---

## Platform Breakdown

| Platform | Score | Bottleneck |
|----------|-------|-----------|
| Google AI Overviews | 18/100 | CSR homepage; no server-rendered prose; no authority signals |
| ChatGPT | 12/100 | No Wikipedia/Reddit presence; homepage un-crawlable |
| Perplexity | 10/100 | No Reddit citations; no SSR content passages |
| Bing Copilot | 22/100 | Slightly better — Bing indexes more JS-rendered pages, but still weak |

---

## AI Crawler Access Status

**robots.txt: MISSING** — No `/public/robots.txt` and no `app/robots.ts` found.

Without a robots.txt, crawler behavior is undefined (default: allowed, but no explicit guidance). More critically, there is no `app/robots.ts` to set canonical Allow directives for AI bots.

**Recommended `app/robots.ts`:**
```ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      // AI search crawlers — explicitly allow for GEO visibility
      { userAgent: 'GPTBot',        allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ChatGPT-User',  allow: '/' },
      { userAgent: 'ClaudeBot',     allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      // Block training crawlers if desired
      { userAgent: 'CCBot',         disallow: '/' },
      { userAgent: 'anthropic-ai',  disallow: '/' },
    ],
    sitemap: 'https://reelx.ai/sitemap.xml',
  }
}
```

---

## llms.txt Status: MISSING

No `/public/llms.txt` or `app/llms.txt/route.ts` exists.

**Ready-to-use template** (save as `public/llms.txt`):
```
# Reelx
> Reelx is an AI creative studio for generating images, cinematic videos, and talking avatar content. Access 15+ frontier AI models — GPT-5 Image, Veo 3.1, Kling 3.0, Seedance 2.0 — from a single credit-based platform.

## Core pages
- [Home](https://reelx.ai/): Platform overview, hero demo, gallery, pricing snapshot
- [Products](https://reelx.ai/products): Detailed breakdown of Image Generation, Video Generation, and Studio (avatar video) tools
- [Pricing](https://reelx.ai/pricing): Free plan + Creator ($6.99/mo), Pro ($11.99/mo), Premium ($24.99/mo); credit top-up packs available

## Key facts
- Supports image generation: GPT-5 Image Mode, Nano Banana 3 Pro & Flash, FLUX.2
- Supports video generation: Veo 3.1, Kling 3.0, Seedance 2.0, Grok
- Studio: talking avatar video with ElevenLabs voice cloning (28+ languages)
- Credits reset monthly; add-on packs never expire
- Commercial use allowed on all plans
- Support: support@reelx.ai

## About
- Brand: Reelx (formerly Reelsy)
- Domain: https://reelx.ai
- Target audience: content creators, marketers, UGC producers, agencies
```

---

## Brand Mention Analysis

| Platform | Status | Impact |
|----------|--------|--------|
| Wikipedia | Not present | High negative — ChatGPT cites Wikipedia in 47.9% of responses |
| Reddit | Not present | High negative — Perplexity cites Reddit in 46.7% of responses |
| YouTube | Not present | High negative — YouTube mentions have the strongest AI citation correlation (~0.737) |
| LinkedIn | Not present | Moderate negative |
| Twitter/X | Handle `@reelx` referenced in products page meta | Minimal positive |

**Reelx has zero brand presence on any AI-cited platform.** This is the single largest bottleneck for ChatGPT and Perplexity visibility.

---

## Passage-Level Citability Analysis

### Homepage (`app/page.tsx`) — `'use client'`

**Critical problem: the entire homepage is a Client Component.** AI crawlers do not execute JavaScript. The homepage renders as an empty shell to GPTBot, ClaudeBot, and PerplexityBot. Every heading, feature description, FAQ answer, and pricing detail is invisible to AI.

**Current crawlable content on homepage: ~0 words.**

### `/products` page — Server Component ✓

This page is a Server Component with proper `export const metadata` and JSON-LD schema. AI crawlers can read it. However, no prose passages meet the optimal 134-167 word citability window — content is broken into very short bullet lists.

### `/pricing` page — `'use client'`

Fully client-rendered. Pricing data (the most-cited content type in commercial AI queries) is invisible to AI crawlers.

### `/privacy`, `/legal`, `/contact` pages

Low citability value, but likely server-rendered (no `'use client'` detected at top-level check).

---

## Server-Side Rendering Check

| Page | Rendering | AI-Crawlable |
|------|-----------|-------------|
| `/` (homepage) | `'use client'` — CSR only | NO |
| `/pricing` | `'use client'` — CSR only | NO |
| `/products` | Server Component | YES |
| `/login` | Unknown (likely CSR) | Likely NO |
| `/dashboard`, `/studio`, `/settings`, `/billing` | App pages (auth-gated) | Not relevant |

**Only 1 of the 3 marketing pages is AI-crawlable.**

The homepage is the most important page for GEO and it is completely invisible. This must be fixed before any other optimization has value.

---

## Structured Data / Schema

| Page | Schema | Status |
|------|--------|--------|
| `/products` | `SoftwareApplication` + `AggregateOffer` | Present, good baseline |
| `/` (homepage) | None | Missing |
| `/pricing` | None | Missing |
| All pages | `Organization` | Missing |
| All pages | `WebSite` + `SearchAction` | Missing |
| All pages | `FAQPage` | Missing (FAQ section exists on homepage but no schema) |

---

## Top 5 Highest-Impact Changes

### 1. Convert homepage to Server Component (Critical — blocks all GEO)

Remove `'use client'` from `app/page.tsx`. Move interactive islands (hero chat panel, feature tabs, FAQ accordion, pricing toggle) to separate Client Components. The static prose, headings, and FAQ text must be server-rendered HTML.

**Impact:** Makes homepage content available to all AI crawlers. Without this, changes 2-5 have zero effect on the homepage.

### 2. Add `robots.ts` and `llms.txt` (High — 30-min task)

Create `app/robots.ts` (code above) and `public/llms.txt` (template above). This explicitly invites AI crawlers and provides structured guidance for what Reelx does.

### 3. Add FAQPage schema to homepage (High — after fix #1)

The homepage FAQ section (`FAQS` array, lines 1059-1088 in `app/page.tsx`) already has well-formed Q&A pairs. Add JSON-LD `FAQPage` schema in the server-rendered layout. This is prime AI citation material — each answer is 50-120 words and directly answers a search query.

```ts
// In the server-rendered part of app/page.tsx (after SSR conversion)
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(faq => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
}
```

### 4. Convert `/pricing` page to Server Component (High)

The pricing data is static. The only interactive part is the monthly/annual toggle and the checkout button. Extract those as Client Components. Render all plan names, prices, and feature lists as server HTML so AI crawlers (and Google) can see the pricing structure.

**Impact:** Pricing queries ("how much does Reelx cost?", "Reelx pricing") currently return nothing. After SSR, this becomes a citable pricing page.

### 5. Add `sitemap.ts` (Medium — 15-min task)

Create `app/sitemap.ts` to generate a proper XML sitemap. This helps AI crawlers and Google discover all pages.

```ts
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://reelx.ai'
  const pages = ['', '/products', '/pricing', '/privacy', '/legal', '/contact']
  return pages.map(path => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1.0 : path === '/products' || path === '/pricing' ? 0.8 : 0.5,
  }))
}
```

---

## Schema Recommendations

Add to `app/layout.tsx` (global, all pages):

```ts
// Organization schema — add to RootLayout
const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Reelx',
  url: 'https://reelx.ai',
  logo: 'https://reelx.ai/brand/reelx-logo-white-svg.svg',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'support@reelx.ai',
  },
  sameAs: [
    // Add when profiles exist:
    // 'https://twitter.com/reelx',
    // 'https://linkedin.com/company/reelx',
    // 'https://youtube.com/@reelx',
  ],
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Reelx',
  url: 'https://reelx.ai',
}
```

Add to `/pricing` page (after SSR conversion):
- `SoftwareApplication` with `Offer` per plan
- `PriceSpecification` for each plan tier

---

## Content Reformatting Suggestions

### Homepage Hero (after SSR conversion)

Add a server-rendered H1 with a definition passage before the interactive chat panel:

```html
<h1>Reelx — AI Creative Studio</h1>
<p>
  Reelx is an AI creative studio that lets you generate production-ready images,
  cinematic videos, and lip-synced talking avatar content from a single platform.
  Access 15+ frontier models — including GPT-5 Image Mode, Veo 3.1, and Kling 3.0 —
  with a simple credit system starting at $6.99/month. No credit card required to start.
</p>
```

This 65-word passage follows the "X is..." definition pattern that AI crawlers prioritize. It's self-contained, specific, and citable without context.

### Feature Section Descriptions

Current descriptions (e.g., the Image Generation description at line 395) are good but need to be server-rendered. After SSR conversion, these 50-90 word descriptions will be crawlable and are close to the optimal citability window.

### FAQ Answers

The existing FAQ answers are 40-120 words each — well within the optimal citability range. They directly answer commercial queries:
- "Can I use Reelx content commercially?" → Yes, citable answer at 120 words
- "Which AI models are available?" → Specific model list, citable
- "Is there a free plan?" → Direct yes/no + details

These are only useful after the homepage is server-rendered.

---

## Summary

Reelx scores 24/100 primarily because its two most important marketing pages (homepage, pricing) are fully client-rendered and invisible to AI crawlers. The `/products` page is the only page doing GEO work. The brand has no presence on Reddit, YouTube, or Wikipedia — the three platforms AI systems most heavily cite.

**Priority order:**
1. SSR the homepage (unblocks everything)
2. Add `robots.ts` + `llms.txt` (quick wins)
3. Add FAQPage schema (fast citation surface)
4. SSR the pricing page
5. Add `sitemap.ts`
6. Build Reddit/YouTube brand presence over time
