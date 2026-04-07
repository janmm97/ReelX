# Multi-Image I2V Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-image upload zone in Image-to-Video mode with a dynamic multi-image thumbnail grid where each image carries an optional description woven into the prompt.

**Architecture:** Three changes in two files — update the API route to accept `images[]` + `imageDescriptions[]` FormData fields, update dashboard state/handlers to manage an array of uploaded images, then replace the upload UI with the thumbnail grid. All changes are in `app/api/generate-video-from-image/route.ts` and `app/dashboard/page.tsx`.

**Tech Stack:** Next.js App Router, React (useState/useCallback), Supabase Storage, TypeScript, Tailwind CSS, kie.ai REST API.

**Spec:** `docs/superpowers/specs/2026-04-07-multi-image-i2v-design.md`

---

## File Map

| File | Change |
|---|---|
| `app/api/generate-video-from-image/route.ts` | Accept `images[]` + `imageDescriptions[]`, augment prompt, upload all images, pass URL arrays to model builders |
| `app/dashboard/page.tsx` | Replace `uploadedFile`/`uploadPreview` state with `uploadedImages[]`, update handlers + FormData submission, replace upload zone UI |

---

## Task 1: Update API route — parse and validate multiple images

**Files:**
- Modify: `app/api/generate-video-from-image/route.ts:339-371`

- [ ] **Step 1: Replace the single `imageFile` parse with `images[]` and `imageDescriptions[]`**

In the POST handler, replace lines 351–371 (from `const imageFile = ...` through the size check) with:

```typescript
  const prompt      = formData.get('prompt') as string | null
  const model       = formData.get('model') as string | null
  const quality     = formData.get('quality') as string | null
  const aspectRatio = formData.get('aspectRatio') as string | null
  const imageFiles  = formData.getAll('images[]') as File[]
  const imageDescriptions = formData.getAll('imageDescriptions[]').map(d => String(d))

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }
  if (!model || !ALL_MODELS.has(model as I2VModel)) {
    return NextResponse.json({ error: 'Invalid model' }, { status: 400 })
  }
  if (!quality || !VALID_QUALITIES.has(quality as Quality)) {
    return NextResponse.json({ error: 'Invalid quality' }, { status: 400 })
  }
  if (imageFiles.length === 0 || imageFiles.every(f => f.size === 0)) {
    return NextResponse.json({ error: 'Image file is required' }, { status: 400 })
  }
  for (const f of imageFiles) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, and WebP supported' }, { status: 400 })
    }
    if (f.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 10 MB' }, { status: 400 })
    }
  }
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
cd c:/Projects/InstaArt && npx tsc --noEmit
```

Expected: no errors in `generate-video-from-image/route.ts` (there will be errors in later steps because `imageFile` is now gone — that's fine, fix them in Tasks 2 and 3).

- [ ] **Step 3: Commit**

```bash
git add app/api/generate-video-from-image/route.ts
git commit -m "feat(i2v): parse images[] and imageDescriptions[] from FormData"
```

---

## Task 2: Update API route — augment prompt and upload all images

**Files:**
- Modify: `app/api/generate-video-from-image/route.ts` (above the `POST` export and inside the handler)

- [ ] **Step 1: Add `buildAugmentedPrompt` helper above the `POST` export**

Insert this function just before `export async function POST`:

```typescript
function buildAugmentedPrompt(prompt: string, descriptions: string[]): string {
  const nonEmpty = descriptions.map(d => d.trim()).filter(Boolean)
  if (nonEmpty.length === 0) return prompt
  const preamble = nonEmpty.map((d, i) => `[Image ${i + 1}: ${d}]`).join(' ')
  return `${preamble}\n${prompt}`
}
```

- [ ] **Step 2: Replace the single-image upload block (lines ~400–409) with a multi-image loop**

Replace the block that reads:
```typescript
  // 5. Upload image to Supabase Storage
  let imageUrl: string
  try {
    const buffer = Buffer.from(await imageFile.arrayBuffer())
    imageUrl = await uploadToStorage(service, buffer, imageFile.name, imageFile.type)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Image upload failed'
    console.error('[i2v] upload error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
```

with:

```typescript
  // 5. Upload all images to Supabase Storage
  const imageUrls: string[] = []
  try {
    for (const f of imageFiles) {
      const buffer = Buffer.from(await f.arrayBuffer())
      const url = await uploadToStorage(service, buffer, f.name, f.type)
      imageUrls.push(url)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Image upload failed'
    console.error('[i2v] upload error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // 5b. Augment prompt with image descriptions
  const augmentedPrompt = buildAugmentedPrompt(prompt.trim(), imageDescriptions)
```

- [ ] **Step 3: Update the two submission call sites in the try block to use `augmentedPrompt` and `imageUrls`**

In the `try` block (lines ~430–446), update the two branches. Replace:
```typescript
    if (isVeoI2V) {
      taskId = await submitVeoI2V(prompt.trim(), model as I2VModel, imageUrl, ar, apiKey)
```
with:
```typescript
    if (isVeoI2V) {
      taskId = await submitVeoI2V(augmentedPrompt, model as I2VModel, imageUrls, ar, apiKey)
```

And replace:
```typescript
      const taskBody = buildTaskBody(model as I2VModel, prompt.trim(), imageUrl, quality as Quality, ar)
```
with:
```typescript
      const taskBody = buildTaskBody(model as I2VModel, augmentedPrompt, imageUrls, quality as Quality, ar)
```

The `videos` insert keeps `prompt.trim()` (the original prompt, not the augmented one — descriptions are not persisted).

- [ ] **Step 4: Commit**

```bash
git add app/api/generate-video-from-image/route.ts
git commit -m "feat(i2v): upload multiple images and augment prompt with descriptions"
```

---

## Task 3: Update API route — model body builders accept URL arrays

**Files:**
- Modify: `app/api/generate-video-from-image/route.ts:53-185` (`buildTaskBody`) and `203-233` (`submitVeoI2V`)

- [ ] **Step 1: Update `buildTaskBody` signature from `imageUrl: string` to `imageUrls: string[]`**

Change the function signature at line ~53:
```typescript
function buildTaskBody(
  model: I2VModel,
  prompt: string,
  imageUrls: string[],
  quality: Quality,
  aspectRatio: string | undefined,
) {
  const ar = aspectRatio ?? '16:9'
  const imageUrl = imageUrls[0]  // first image for single-image models
```

- [ ] **Step 2: Update the `kling3` and `kling3_audio` cases to pass all URLs and set `multi_shots`**

Replace the `kling3` case body:
```typescript
    case 'kling3':
      return {
        model: 'kling-3.0/video',
        input: {
          image_urls: imageUrls,
          prompt,
          mode: quality === '1080p' ? 'pro' : 'std',
          duration: '5',
          sound: false,
          aspect_ratio: ar,
          multi_shots: imageUrls.length > 1,
        },
      }
```

Replace the `kling3_audio` case body:
```typescript
    case 'kling3_audio':
      return {
        model: 'kling-3.0/video',
        input: {
          image_urls: imageUrls,
          prompt,
          mode: 'pro',
          duration: '5',
          sound: true,
          aspect_ratio: ar,
          multi_shots: imageUrls.length > 1,
        },
      }
```

- [ ] **Step 3: Update all other cases that used `imageUrl` (singular) to use the correct field**

`grok`: uses `image_urls` array — update to `imageUrls`:
```typescript
    case 'grok':
      return {
        model: 'grok-imagine/image-to-video',
        input: {
          image_urls: imageUrls,
          prompt,
          resolution: quality === '1080p' ? '720p' : quality,
          aspect_ratio: ar,
          duration: '6',
        },
      }
```

`seedance2`: single `first_frame_url` only — stays as `imageUrl` (first element):
```typescript
    case 'seedance2':
      return {
        model: 'bytedance/seedance-2',
        input: {
          prompt,
          first_frame_url: imageUrl,
          resolution: quality === '1080p' ? '720p' : quality,
          aspect_ratio: ar,
          duration: 8,
          generate_audio: true,
        },
      }
```

`hailuo_pro`, `hailuo_std`, `wan26`, `wan26_flash`, `sora2`, `sora2_pro`: all use `image_urls` — update to `imageUrls`:
```typescript
    case 'hailuo_pro':
      return {
        model: 'hailuo/02-image-to-video-pro',
        input: { image_urls: imageUrls, prompt },
      }

    case 'hailuo_std':
      return {
        model: 'hailuo/02-image-to-video-standard',
        input: { image_urls: imageUrls, prompt },
      }

    case 'wan26':
      return {
        model: 'wan/2-6-image-to-video',
        input: {
          image_urls: imageUrls,
          prompt,
          audio: true,
          duration: '5',
          resolution: quality === '480p' ? '720p' : quality,
        },
      }

    case 'wan26_flash':
      return {
        model: 'wan/2-6-flash-image-to-video',
        input: {
          image_urls: imageUrls,
          prompt,
          audio: true,
          duration: '5',
          resolution: quality === '480p' ? '720p' : quality,
        },
      }

    case 'sora2':
      return {
        model: 'sora-2-image-to-video',
        input: {
          image_urls: imageUrls,
          prompt,
          aspect_ratio: ar === '9:16' ? 'portrait' : 'landscape',
          upload_method: 's3',
        },
      }

    case 'sora2_pro':
      return {
        model: 'sora-2-pro-image-to-video',
        input: {
          image_urls: imageUrls,
          prompt,
          aspect_ratio: ar === '9:16' ? 'portrait' : 'landscape',
          upload_method: 's3',
        },
      }
```

- [ ] **Step 4: Update `submitVeoI2V` signature from `imageUrl: string` to `imageUrls: string[]`**

Change the function signature:
```typescript
async function submitVeoI2V(
  prompt: string,
  model: I2VModel,
  imageUrls: string[],
  aspectRatio: string | undefined,
  apiKey: string,
): Promise<string> {
  const veoId = model === 'veo3_fast_i2v' ? 'veo3_fast' : 'veo3'
  const body: Record<string, unknown> = {
    prompt,
    model: veoId,
    generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO',
    imageUrls,
  }
```

(Remove the old `imageUrls: [imageUrl]` line — now just pass the array directly.)

- [ ] **Step 5: Verify TypeScript compiles clean**

```bash
cd c:/Projects/InstaArt && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/generate-video-from-image/route.ts
git commit -m "feat(i2v): update model builders to accept image URL arrays"
```

---

## Task 4: Update dashboard state and form submission

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Add the `UploadedImage` interface and replace the two state declarations**

Near the top of `DashboardPage` (around line 578), find:
```typescript
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
```

Replace with:
```typescript
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string; description: string }[]>([])
```

- [ ] **Step 2: Replace `handleImageSelect`**

Replace the entire `handleImageSelect` function (lines ~764–777):
```typescript
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        push('Only JPEG, PNG, and WebP images are supported.', 'error')
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        push('Image must be under 10 MB.', 'error')
        continue
      }
      setUploadedImages(prev => [...prev, { file, preview: URL.createObjectURL(file), description: '' }])
    }
    e.target.value = ''
  }
```

- [ ] **Step 3: Replace `useImageForVideo`**

Replace the entire `useImageForVideo` function (lines ~779–793):
```typescript
  async function useImageForVideo(imageUrl: string, imagePrompt: string) {
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg'
      const file = new File([blob], `instaart-i2v.${ext}`, { type: blob.type })
      setUploadedImages([{ file, preview: URL.createObjectURL(file), description: '' }])
      setPrompt(imagePrompt)
      setTab('video')
      setVideoMode('image')
    } catch {
      push('Could not load image — try again.', 'error')
    }
  }
```

- [ ] **Step 4: Replace `handleImageDrop`**

Replace the entire `handleImageDrop` function (lines ~795–809):
```typescript
  function handleImageDrop(e: React.DragEvent) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        push('Only JPEG, PNG, and WebP images are supported.', 'error')
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        push('Image must be under 10 MB.', 'error')
        continue
      }
      setUploadedImages(prev => [...prev, { file, preview: URL.createObjectURL(file), description: '' }])
    }
  }
```

- [ ] **Step 5: Update the I2V branch of `handleGenerate`**

In `handleGenerate` (lines ~642–678), replace the `if (videoMode === 'image')` block:
```typescript
      // Image-to-Video mode
      if (videoMode === 'image') {
        if (uploadedImages.length === 0) {
          push('Please upload at least one image first.', 'error')
          setLoading(false)
          return
        }
        try {
          const form = new FormData()
          uploadedImages.forEach((img) => {
            form.append('images[]', img.file)
            form.append('imageDescriptions[]', img.description)
          })
          form.append('prompt', prompt.trim())
          form.append('model', i2vModel)
          form.append('quality', quality)
          form.append('aspectRatio', aspectRatio)

          const res = await fetch('/api/generate-video-from-image', { method: 'POST', body: form })
          const data = await res.json()
          if (!res.ok) {
            const msg = res.status === 429
              ? 'Daily limit reached — come back tomorrow!'
              : (data.error ?? 'Video generation failed')
            setLastError(msg)
            push(msg, 'error')
            return
          }
          setLastError(null)
          setCurrentVideo({ url: data.videoUrl, prompt: prompt.trim() })
          fetchHistory()
          push('Video generated from image!', 'success', 3000)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Something went wrong, try again!'
          setLastError(msg)
          push(msg, 'error')
        } finally {
          setLoading(false)
        }
        return
      }
```

- [ ] **Step 6: Update the generate button's `disabled` condition**

Find line ~1200:
```typescript
              disabled={loading || !prompt.trim() || (tab === 'video' && videoMode === 'image' && !uploadedFile)}
```

Replace with:
```typescript
              disabled={loading || !prompt.trim() || (tab === 'video' && videoMode === 'image' && uploadedImages.length === 0)}
```

- [ ] **Step 7: Verify TypeScript compiles clean**

```bash
cd c:/Projects/InstaArt && npx tsc --noEmit
```

Expected: 0 errors. Any remaining `uploadedFile`/`uploadPreview` references will show as errors — fix them in Step 8.

- [ ] **Step 8: Fix any remaining `uploadedFile` / `uploadPreview` references**

Search for stragglers:
```bash
grep -n "uploadedFile\|uploadPreview" c:/Projects/InstaArt/app/dashboard/page.tsx
```

For each hit that isn't the UI section (which will be replaced in Task 5), delete or update the reference. The UI section around lines 1038–1073 will still reference `uploadPreview` / `uploadedFile` — that entire block is replaced in Task 5, so it's fine to leave it broken for now.

- [ ] **Step 9: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat(i2v): replace single-image state with uploadedImages array"
```

---

## Task 5: Replace upload zone UI with thumbnail grid

**Files:**
- Modify: `app/dashboard/page.tsx:1038-1073`

- [ ] **Step 1: Replace the entire upload zone block**

Find the block starting with:
```tsx
                {videoMode === 'image' && (
                  <>
                    {/* Image upload area */}
                    <div
                      onDrop={handleImageDrop}
```

…and ending just before `{/* Video — AI Model */}` (around line 1073). Replace the entire `{videoMode === 'image' && ( <> ... </> )}` block with:

```tsx
                {videoMode === 'image' && (
                  <div
                    onDrop={handleImageDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="mb-3"
                  >
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {uploadedImages.map((img, i) => (
                        <div key={i} className="shrink-0 flex flex-col gap-1">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/[0.1]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.preview} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                              onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white/80 hover:text-white flex items-center justify-center text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                          <input
                            type="text"
                            value={img.description}
                            onChange={(e) => {
                              const val = e.target.value
                              setUploadedImages(prev => prev.map((x, idx) => idx === i ? { ...x, description: val } : x))
                            }}
                            placeholder="describe…"
                            className="w-20 bg-white/[0.05] border border-white/[0.08] rounded px-1.5 py-1 text-[10px] text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                          />
                        </div>
                      ))}
                      {/* Add image tile */}
                      <label className="shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-white/[0.1] hover:border-purple-500/40 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer">
                        <UploadIcon />
                        <span className="text-[9px] text-slate-500">Add image</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {uploadedImages.length > 0 && (
                      <p className="text-[9px] text-slate-600 mt-1">First image = start frame · Last image = end frame</p>
                    )}
                  </div>
                )}
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
cd c:/Projects/InstaArt && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Start the dev server and manually verify**

```bash
cd c:/Projects/InstaArt && npm run dev
```

Open http://localhost:3000/dashboard. Go to Video tab → Image to Video mode. Verify:
- The "Add image" tile appears (dashed border with + icon)
- Clicking it opens a file picker (supports multi-select)
- Dropping image(s) onto the area adds them to the row
- Each thumbnail shows: image preview, ✕ remove button, description input
- Removing a card works (click ✕)
- Hint text "First image = start frame · Last image = end frame" appears once at least one image is uploaded
- Generate button is disabled with 0 images, enabled with 1+
- The "Use for video" shortcut from the history panel still works (pre-fills a single image)

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat(i2v): replace upload zone with multi-image thumbnail grid"
```

---

## Task 6: End-to-end smoke test

- [ ] **Step 1: Test single-image generation (regression)**

In the dev server: upload 1 image with no description, enter a prompt, pick any I2V model, click Generate. Verify the video generates and appears in the right panel.

- [ ] **Step 2: Test two-image generation with descriptions**

Upload 2 images. Add a description to each ("start scene", "end scene"). Enter a prompt. Verify the kie.ai request logs show the augmented prompt in the format `[Image 1: start scene] [Image 2: end scene]\n<your prompt>` (check terminal output from the dev server).

- [ ] **Step 3: Test seedance2 with 2 images**

Select the Seedance 2.0 model, upload 2 images. Verify no error and the second image is silently ignored (generation proceeds with just the first image).

- [ ] **Step 4: Commit if any fixes were needed, otherwise done**

```bash
git add -p
git commit -m "fix(i2v): <describe any fixes found during smoke test>"
```
