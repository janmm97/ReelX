# Multi-Image Upload for Image-to-Video

**Date:** 2026-04-07  
**Status:** Approved

## Overview

Replace the single-image upload zone in the Image-to-Video sidebar with a dynamic multi-image thumbnail grid. Each image can carry a free-form description that gets prepended to the prompt as structured context for the AI. No hard cap on image count — future subscription tiers will gate this.

## UI

**Location:** `app/dashboard/page.tsx` — the image upload area inside `videoMode === 'image'` (currently lines ~1038–1073).

**Layout:**
- Horizontal scrollable row of 80×80px thumbnail cards
- Last item is always an "Add image" tile (dashed border, `+` icon) — clicking opens the file picker, dropping a file anywhere on the row adds to the array (never replaces an existing image)
- Each card contains:
  - Image preview (object-cover)
  - `✕` remove button (top-right corner)
  - A small description text input below the thumbnail (`placeholder="describe this image…"`)
- Below the row: hint text — `First image = start frame · Last image = end frame`

**State changes:**
- Remove: `uploadedFile: File | null`, `uploadPreview: string | null`
- Add: `uploadedImages: { file: File; preview: string; description: string }[]`
- Generate button: disabled when `uploadedImages.length === 0` (same guard as today)
- `handleImageSelect`, `handleImageDrop`, and `useImageForVideo` updated to push into the array instead of setting a single value

**Validation per image (client-side):**
- Accepted types: `image/jpeg`, `image/png`, `image/webp`
- Max size: 10 MB
- Errors shown via existing toast system

## API — `/api/generate-video-from-image`

**Request format change** (FormData):

| Field | Before | After |
|---|---|---|
| `image` | single `File` | removed |
| `images[]` | — | one entry per image (ordered) |
| `imageDescriptions[]` | — | optional string per image, same index |
| `prompt`, `model`, `quality`, `aspectRatio` | unchanged | unchanged |

**Prompt augmentation:**  
If any `imageDescriptions[]` entries are non-empty, prepend a bracketed preamble to the prompt before forwarding to kie.ai:

```
[Image 1: red dress woman] [Image 2: luxury perfume bottle]
A woman gracefully picks up the perfume...
```

If all descriptions are empty, the prompt is forwarded as-is.

**Per-model image URL handling:**

| Model(s) | Field | Multi-image behaviour |
|---|---|---|
| `grok`, `hailuo_pro`, `hailuo_std`, `wan26`, `wan26_flash`, `sora2`, `sora2_pro` | `image_urls` | All URLs passed as array |
| `kling3`, `kling3_audio` | `image_urls` | All URLs passed as array; `multi_shots` set to `true` when >1 image |
| `veo3_i2v`, `veo3_fast_i2v` | `imageUrls` | All URLs passed as array |
| `seedance2` | `first_frame_url` | First image URL only; additional images silently ignored |

## Backend

**Storage:** `uploadToStorage` is called once per image. All uploads run sequentially; if any fails the request returns `500` immediately (no partial state).

**Database:** No schema changes. The `videos` row is inserted identically to today — multiple images are an input detail, not persisted separately.

**Server-side validation:**
- 0 images → `400 Image file is required`
- Any image > 10 MB → `400 Image must be under 10 MB`
- Unsupported type → `400 Only JPEG, PNG, and WebP supported`
- Supabase upload failure → `500 Storage upload failed: <message>`
- kie.ai rejection → `502` with kie.ai's error message passed through

## Out of Scope

- Drag-to-reorder (order is set by upload sequence)
- Per-image role dropdowns (free-form description covers this)
- Subscription tier enforcement (future work — no hard cap for now)
- Persisting image URLs or descriptions to the `videos` table
