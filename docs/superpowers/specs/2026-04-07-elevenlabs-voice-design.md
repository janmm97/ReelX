# ElevenLabs Voice Narration

**Date:** 2026-04-07
**Status:** Approved

## Overview

Add ElevenLabs voice narration to video generation. Users write a separate narration script, choose a voice from the ElevenLabs library or their own cloned voice, and receive a single video file with that voice as its audio track. The ElevenLabs audio is merged into the video server-side using FFmpeg after the video is generated.

## UI

**Location:** `app/dashboard/page.tsx` — video panel, below the model/quality selectors and above the Generate button, present in both Text-to-Video and Image-to-Video modes.

**Collapsed state:** A toggle row labelled "Voice Narration" with an on/off switch. Off by default. When off, no voice-related fields are shown and the existing generation flow is unchanged.

**Expanded state (toggle on):**

1. **Voice picker** — `<select>` or custom dropdown with two `<optgroup>` groups:
   - `Library` — ElevenLabs pre-built voices loaded from `GET /api/voices` on first expand
   - `Your Voices` — user's cloned voices (same endpoint, filtered by `category: 'cloned'`)
   - Each option shows voice name; a small ▶ preview button plays a sample clip via ElevenLabs `GET /v1/voices/{id}` `preview_url`
2. **"+ Add your voice"** — inline link below the picker. When clicked, reveals a small drop zone accepting mp3/wav/m4a (max 25 MB) plus a name field. On submit, calls `POST /api/voice-clone`. On success the new voice is prepended to "Your Voices" and selected automatically.
3. **Narration script** — `<textarea>` with `placeholder="Write the narration that will be spoken in the video…"`. No character limit enforced client-side (ElevenLabs handles limits server-side).
4. **"Keep background audio" checkbox** — unchecked by default. When checked, the ElevenLabs voice is mixed over the video model's AI audio at 30% volume rather than replacing it.

**New state in `DashboardPage`:**
```typescript
const [voiceEnabled, setVoiceEnabled] = useState(false)
const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null)
const [narrationScript, setNarrationScript] = useState('')
const [keepBackgroundAudio, setKeepBackgroundAudio] = useState(false)
const [voices, setVoices] = useState<{ id: string; name: string; category: 'library' | 'cloned'; previewUrl: string }[]>([])
```

Voices are fetched once on first expand (`voices.length === 0 && voiceEnabled`) and cached in state for the session.

**Generate button guard:** when `voiceEnabled` is true, the button is also disabled if `selectedVoiceId` is null or `narrationScript.trim()` is empty.

## API Routes

### `GET /api/voices`

Calls ElevenLabs `GET /v1/voices` using `ELEVENLABS_API_KEY`. Maps each voice to `{ id, name, category, previewUrl }` where `category` is `'cloned'` for voices with `category === 'cloned'` in the ElevenLabs response and `'library'` for everything else; `previewUrl` is the ElevenLabs `preview_url` field (an mp3 the client plays directly). Response is cached with `Cache-Control: s-maxage=60`. Requires authenticated session.

### `POST /api/voice-clone`

Accepts `multipart/form-data`:
- `audio` — audio file (mp3/wav/m4a), max 25 MB
- `name` — string, voice display name

Validates file type and size server-side, then forwards to ElevenLabs `POST /v1/voices/add` (Instant Voice Clone). Returns `{ voiceId: string, name: string }`.

ElevenLabs stores the voice against the account's API key — no database changes needed. The cloned voice will appear in `GET /api/voices` on next call.

**Validation errors:**
- Unsupported file type → `400 Only mp3, wav, and m4a are supported`
- File > 25 MB → `400 Audio file must be under 25 MB`
- Missing name → `400 name is required`

### Modified: `POST /api/generate-video` and `POST /api/generate-video-from-image`

Both routes accept three optional additional fields. Because the two routes use different request formats, the fields are sent differently:

**`generate-video` (JSON body):**
```json
{ "narrationScript": "...", "voiceId": "...", "keepBackgroundAudio": true }
```

**`generate-video-from-image` (FormData):**
```
narrationScript=<string>
voiceId=<string>
keepBackgroundAudio=true   ← string "true"/"false", parsed server-side
```

| Field | Type | Notes |
|---|---|---|
| `narrationScript` | `string` | The text ElevenLabs will speak |
| `voiceId` | `string` | ElevenLabs voice ID |
| `keepBackgroundAudio` | `boolean` | Mix vs replace mode, defaults to `false` |

If all three are absent the routes behave exactly as today. If `narrationScript` or `voiceId` is present but the other is missing, return `400`.

## Video Generation Pipeline (with voice)

After the video URL is obtained from kie.ai polling (existing step):

1. **Generate TTS audio** — `POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}` with `{ text: narrationScript, model_id: "eleven_multilingual_v2" }`. Returns `audio/mpeg` buffer.
2. **Download video** — fetch the kie.ai video URL into a buffer.
3. **Write temp files** — both buffers written to `/tmp/` with UUID-prefixed names (`video-{uuid}.mp4`, `audio-{uuid}.mp3`).
4. **FFmpeg merge:**
   - Replace mode (`keepBackgroundAudio = false`):
     ```
     ffmpeg -i video.mp4 -i audio.mp3 -c:v copy -map 0:v:0 -map 1:a:0 -shortest output.mp4
     ```
   - Mix mode (`keepBackgroundAudio = true`):
     ```
     ffmpeg -i video.mp4 -i audio.mp3 \
       -filter_complex "[0:a]volume=0.3[a0];[a0][1:a]amix=inputs=2[a]" \
       -map 0:v -map "[a]" -shortest output.mp4
     ```
5. **Upload merged file** — to Supabase Storage under `merged/{uuid}.mp4` (public bucket). Delete all `/tmp` files.
6. **Return merged URL** — stored in `videos.video_url` as normal. The original kie.ai URL is not persisted.

**Dependencies:**
- `fluent-ffmpeg` — Node.js FFmpeg wrapper
- `ffmpeg-static` — bundled FFmpeg binary (no system install required)

**Route segment config** (both routes):
```typescript
export const maxDuration = 300
```

## Error Handling

| Failure | HTTP | videos.status | Notes |
|---|---|---|---|
| `voiceId` present but `narrationScript` missing (or vice versa) | 400 | — | Before generation starts |
| ElevenLabs TTS fails | 502 | `failed` | ElevenLabs error message passed through |
| kie.ai video download fails | 502 | `failed` | `Could not download generated video` |
| FFmpeg merge fails | 502 | `failed` | `Audio merge failed: <ffmpeg stderr>` |
| Supabase merged upload fails | 500 | `failed` | Temp files cleaned up regardless |
| `/tmp` cleanup fails | — | — | Logged, request not failed |

## Database

No schema changes. `videos.video_url` stores the merged video URL when voice is used, the original kie.ai URL otherwise.

## Environment

```
ELEVENLABS_API_KEY=your_key_here
```

## Out of Scope

- Storing narration script or voice ID in the `videos` table
- Per-user voice library management UI (voices are managed directly in ElevenLabs account)
- Voice preview playback beyond the ElevenLabs-provided `preview_url`
- Subtitle/caption generation from the narration script
