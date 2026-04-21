# GPT Image 1.5 via kie.ai — Design Spec

**Date:** 2026-04-21
**Status:** Approved

---

## Summary

Add two new image generation models powered by OpenAI's GPT Image 1.5, accessed via the kie.ai API. Both models support text-to-image and image-to-image (blend) modes and are available to Creator plan users and above.

GPT Image 2 is excluded — it is not yet released on kie.ai.

---

## Models

| App key | Label | kie.ai quality | kie.ai price | Our credits | Tier |
|---|---|---|---|---|---|
| `gptimage15med` | GPT Image 1.5 Medium | `medium` | $0.02/image | 22 | standard |
| `gptimage15high` | GPT Image 1.5 High | `high` | $0.11/image | 121 | standard |

Both models map to two kie.ai model IDs depending on mode:
- Text-to-image: `gpt-image/1.5-text-to-image`
- Image-to-image: `gpt-image/1.5-image-to-image`

Both are `standard` tier — available from Creator plan (`PLAN_MAX_TIER['creator'] = 'standard'`).

Credit math: `ceil(kie_price_usd × 1000 × 1.1)` → 22 and 121 credits respectively.

---

## API Flow

kie.ai image generation is **asynchronous** — unlike the current sync OpenRouter calls. The pattern mirrors the existing I2V video route:

1. POST `https://api.kie.ai/api/v1/jobs/createTask` with `{ model, input: { prompt, aspect_ratio, quality } }`
2. Receive `{ data: { taskId } }`
3. Poll `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...` every 3s
4. On `state === 'success'`: parse `data.resultJson` → `resultUrls[0]` → image URL
5. On `state === 'fail'` or timeout (60s): throw error, refund credits

For image-to-image, `input` adds `input_urls: string[]` (public Supabase storage URLs of reference images).

Reuses `KIE_API_KEY` env var already present for video.

---

## Aspect Ratio Mapping

kie.ai gpt-image-1.5 supports: `1:1`, `2:3`, `3:2`.

Dashboard AR labels → kie.ai:
| Dashboard label | kie.ai |
|---|---|
| `1:1 Square` | `1:1` |
| `3:4 Portrait` | `2:3` |
| `4:3 Landscape` | `3:2` |
| `16:9 Widescreen` | `3:2` (closest) |
| `9:16 Vertical` | `2:3` (closest) |

---

## Files Changed

### 1. `app/api/generate/route.ts`

- Add `gptimage15med` and `gptimage15high` to `MODEL_MAP` (value = quality string, not OR slug)
- Add a `KIE_IMAGE_MODELS` set to distinguish them from OpenRouter models
- Add `submitKieImageTask()` + `pollKieImageTask()` helpers (60s timeout, 3s intervals)
- In the POST handler: after credit gate, branch on `KIE_IMAGE_MODELS.has(model)` to use kie.ai path; otherwise use existing OpenRouter path
- Reuses `KIE_API_KEY` env var

### 2. `app/api/generate-blend/route.ts`

- Add `gptimage15med` and `gptimage15high` to `BLEND_MODEL_MAP` (with quality value)
- Add same `KIE_IMAGE_MODELS` set and helpers (or import from shared lib)
- In the POST handler: after image upload to Supabase, branch on kie.ai models → call `gpt-image/1.5-image-to-image` with `input_urls`
- Existing OpenRouter path unchanged

### 3. `app/dashboard/page.tsx`

- Add `'gptimage15med' | 'gptimage15high'` to the `Model` union type
- Add `'gptimage15med' | 'gptimage15high'` to `BlendModel` union type
- Add 2 entries to `MODELS` array (standard tier, green/amber color scheme for OpenAI family)
- Add both to `BLEND_MODEL_IDS` set

### 4. `supabase/migrations/20260421_gpt_image_15.sql`

- Insert `gptimage15med` (22 credits, standard) and `gptimage15high` (121 credits, standard) into `model_credit_costs`

---

## Error Handling

- Poll timeout (60s) → `status: failed`, credits refunded
- kie.ai `state: fail` → same
- Missing `resultUrls` → throw, same refund path
- `KIE_API_KEY` missing → 500, no credits deducted (gate before deduction)

---

## Out of Scope

- GPT Image 2 (not released on kie.ai)
- Quality toggle UI (handled via separate model keys per approved approach A)
- New callback/webhook endpoint (polling is sufficient for images)
