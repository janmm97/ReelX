# Reelsy Rebrand Design Spec

**Date:** 2026-04-09  
**Approach:** A — Global token swap + in-place page rewrites  
**Scope:** `globals.css`, `app/page.tsx`, `app/login/page.tsx`, `app/dashboard/page.tsx`, `app/studio/page.tsx`, `components/VideoGeneratorForm.tsx` (reskin only)

---

## Assets

| File | Usage |
|------|-------|
| `public/For Rebranding/reelsy-logo-white-txt.png` | Header, footer, OG image, any dark-bg placement |
| `public/For Rebranding/reelsy-icon.png` | Sidebar, auth card logomark, favicon |
| `public/For Rebranding/reelsy-logo-black-txt.png` | Not used (light bg only — not applicable to this dark-themed app) |

---

## Design Tokens (`globals.css`)

All current Instaart purple/pink/gold brand variables are removed and replaced with the Reelsy obsidian-and-teal system.

### CSS Custom Properties

```css
/* Backgrounds */
--color-bg-obsidian:       #0B0F14;   /* page bg — replaces #060510 */
--color-bg-charcoal:       #101722;   /* primary surface — replaces #0F0D1A */
--color-bg-panel:          #141D28;   /* elevated panel layer */
--color-bg-graphite-line:  #273242;   /* border / divider */

/* Accents */
--color-accent-teal:  #00C4CC;        /* primary accent — replaces purple #8B5CF6 */
--color-accent-cyan:  #00F2FE;
--color-accent-aqua:  #6EFAFF;        /* hover / glow state */

/* Gradient */
--gradient-primary: linear-gradient(135deg, #00C4CC, #00F2FE);

/* Text */
--color-text-primary:    #F4F8FB;
--color-text-secondary:  #A7B4C2;
--color-text-muted:      #738295;

/* Semantic */
--color-success: #21D69B;
--color-warning: #F6B94A;
--color-error:   #FF5D6C;
```

### Removals
All of the following are removed from `:root` and `@theme`: `--brand-purple`, `--brand-cyan`, `--brand-pink`, `--brand-gold`, `--gradient-brand`, `--gradient-brand-text`, `--accent-purple`, `--accent-pink`, `--accent-blue`, `--accent-cyan`, `--muted`, `--surface`, `--surface-light`, `--background`, `--foreground`.

### Fonts
Unchanged — Bricolage Grotesque (`--font-syne`) + Plus Jakarta Sans (`--font-manrope`) are kept as-is.

### Animations / Keyframes
- `aurora-1/2/3` blob animations: kept but renamed `bg-drift-1/2/3` to remove the aurora framing
- `float-up`, `float-down`, `fade-up`, `shimmer`: kept as-is
- **New additions:**
  - `ribbon-sweep`: thin cyan line sweeping left-to-right for branded progress
  - `waveform-pulse`: simple scale pulse for the studio waveform bars
  - `fade-rise`: opacity 0→1 + translateY 20px→0 (replaces any spring/bounce easing)

### Button conventions (utility classes added)
```css
.btn-primary   /* gradient-primary bg, dark text, 12–14px radius, cyan glow on hover */
.btn-secondary /* --color-bg-panel fill, --color-accent-cyan border, white text */
.btn-tertiary  /* text-only + small arrow, cyan glow on hover */
.loader-ribbon /* ribbon-sweep animation strip */
```

---

## 1. Landing Page (`app/page.tsx`)

Full structural rewrite. All "Instaart" references removed. Motion: fade+rise and soft horizontal slide only — Framer Motion `spring` easing replaced with `ease: [0.25, 0.1, 0.25, 1]`.

### Structure (top to bottom)

#### Header
- Fixed, transparent over hero → dark glass + blur on scroll (`useScrollY`)
- Left: `reelsy-logo-white-txt.png` via `<Image>`
- Center/right nav: Product · Studio · Examples · Pricing · Enterprise
- Far right: Log in (text link) + Start free (`.btn-primary`)

#### Hero (two-column desktop, stacked mobile)
- **Left column:**
  - H1 (64–80px): *"Create images and videos at the speed of content"*
  - Subhead (16–18px): *"Reelsy is an AI creative studio for generating images, videos, and avatar content with fast workflows, flexible models, and production-ready output."*
  - CTAs: Start free (`.btn-primary`) + Watch demo (`.btn-secondary`)
  - Feature chips: Text to image · Text to video · Image to video · Avatar to video · Multi-model workflow
- **Right column:** Layered dark-glass panels — prompt panel, image preview card, video card, model switcher, gallery panel, /studio preview card. These are purely decorative hardcoded div mockups (no live data), positioned with CSS `transform` to simulate depth. Fade-rise on load.
- **Background:** `#0B0F14`, soft cyan radial bloom centered right, 1px grid overlay at 4% opacity, floating dark-glass panels with cyan edge highlights

#### Trust strip
Slim horizontal row of capability labels:  
Built for creators · Designed for marketers · Flexible model access · Avatar video workflows · Fast production-ready output

#### Capabilities grid (2×3)
Cards: Text to Image | Text to Video | Image to Video | Multi-Model Workflow | Gallery & History | Studio Avatar-to-Video  
Each card: icon + label + one-line description, `--color-bg-panel` surface, `--color-bg-graphite-line` border, cyan icon accent

#### Workflow section (4-step horizontal)
Describe or upload → Generate with the right model → Refine and compare → Export and publish  
Connecting line between steps, numbered circles with `--gradient-primary`

#### Studio spotlight (two-column)
- Heading: *"Turn your avatar into video"*
- Left: 4 feature bullets + "Open Studio" CTA (`.btn-primary`)
- Right: large `/studio` UI showcase (static composition)
- Background: deeper navy (`#0D1520`), waveform accent, stronger cyan contrast

#### Output gallery
Dark masonry/grid layout. Tabs: Social · Ads · Product · Cinematic · Avatar videos  
Static placeholder images from `public/` gallery images.

#### Audience section
*"Built for modern content teams"* — 4 cards: Marketers · Creators · Agencies · Founders

#### Why Reelsy (comparison matrix)
3-column table: Traditional stack | Single-purpose tools | Reelsy  
Reelsy column highlighted with cyan border

#### Pricing teaser
3 cards: Starter · Pro · Teams  
Pro card uses `--gradient-primary` border

#### Final CTA
*"Start your next visual in Reelsy"*  
Start free + Book a demo buttons

#### Footer
Columns: Product · Studio · Pricing · Docs · API · Enterprise · Legal · Social  
Left: `reelsy-logo-white-txt.png`  
Bottom: copyright line with "Reelsy"

---

## 2. Sign In / Sign Up (`app/login/page.tsx`)

Full rewrite from 45 lines to a full split-panel auth page.

### Layout (desktop: two columns; mobile: single card)

#### Left brand panel
- `reelsy-logo-white-txt.png`
- Headline: *"Create visuals in motion"*
- Supporting line: *"Image, video, and avatar workflows in one AI studio"*
- Layered product visual stack (static composition)
- Style: dark cinematic gradient, technical grid texture, cyan bloom, ribbon-line accent

#### Right auth card
- `reelsy-icon.png` logomark (top of card)
- Heading: *"Sign in to Reelsy"*
- Supporting text: *"Continue with your Google account to access your workspace."*
- Google sign-in button (white/light surface, Google SVG icon left, "Continue with Google")
- ToS + Privacy Policy links below button

#### First-time variant
Heading switches to *"Create your Reelsy workspace"*  
Supporting text: *"Continue with Google to get started."*  
Detection: check URL for `?mode=signup` query param; default is sign-in.

#### Post-auth onboarding (3-step overlay)
Rendered as a full-page overlay **on the dashboard**, shown once for new users.  
The auth callback (`app/auth/callback/`) appends `?welcome=true` when redirecting to dashboard for a new user (detectable via Supabase `user.created_at` matching `last_sign_in_at` within 60 seconds). `app/dashboard/page.tsx` reads the query param and shows the overlay. State is local React state (step index + selections). No new route required. Steps:

1. **Welcome** — choose primary use case:  
   Marketing / Content creation / Agency work / Founder  
   Large card selections, cyan glow on active
2. **What to create** — Images / Videos / Avatar videos / All of the above  
   Same card style
3. **Enter workspace** — Start creating / Open Studio / Explore examples  
   Two `.btn-primary` + one `.btn-tertiary`

---

## 3. Main Dashboard (`app/dashboard/page.tsx`)

Structural rewrite of 1,895 lines. Functional wiring (auth, API calls, polling, history queries) preserved — only layout and visual layer replaced.

### App Shell

#### Top header
- Left: `reelsy-icon.png` logomark
- Center: global search / command bar input
- Right: credits chip + notifications icon + user avatar menu

#### Left sidebar
Navigation items: Home · Generate · Video · Studio · History · Favorites · Projects · Billing · Settings  
Active item: cyan glow pill indicator (`--color-accent-teal` left border + soft bg)  
Bottom: usage meter bar, upgrade button (`.btn-primary`)

### Dashboard Home
- **Quick action band:** New image · New video · Open Studio · Upload image
- **Recent creations:** horizontal rail/grid, type badges (Image/Video), hover actions (View · Duplicate · Download · Favorite)
- **Continue working:** in-progress drafts, queued renders, recent sessions
- **Templates:** Ad creative · Product visual · Social clip · Talking avatar
- **Usage summary:** plan name, remaining credits, render queue count

### Generate Workspace (3-column)
- **Left panel:** mode switch (Image / Video / Image-to-Video), prompt textarea, model selector, quality/style controls, aspect ratio picker, duration slider (video), generate button (`.btn-primary`)
- **Center panel:** main preview canvas. Loading states: ribbon-line loader, labeled "Generating frames" / "Rendering motion" / "Preparing output" / "Syncing voice". Video playback when done.
- **Right panel:** version rail — variants grid, rerun button, upscale/remix/animate actions, save to project

### Gallery / History
Search input + filter chips + tabs: All · Images · Videos · Studio · Favorites  
Card hover actions: View · Duplicate · Download · Add to project · Favorite · Delete

### Loading / Generation States (branded)
- No default browser spinners
- Ribbon-line loader: `loader-ribbon` utility class
- Sweeping cyan progress bar
- Status labels per state (see above)

---

## 4. Studio (`app/studio/page.tsx` + `components/VideoGeneratorForm.tsx`)

### Constraint
**`VideoGeneratorForm` pipeline logic is untouched.** The existing `Step` type, `setStep` calls, API interactions, polling intervals, and state machine (`idle → uploading-image → generating-tts → splitting-audio → submitting-chunks → processing → stitching → done → error`) are preserved exactly. Only JSX surface layer is reskinned.

### Page shell (`app/studio/page.tsx`)
- Nav: `reelsy-icon.png` left, "← Back to dashboard" link, page title "Reelsy Studio"
- Background: `#0D1520` (slightly darker than dashboard)
- Three-column layout wrapping `VideoGeneratorForm`

### Left panel (setup)
1. **Progress checklist** (top): Avatar uploaded · Script added · Voice selected · Ready to render (driven by existing form state)
2. **Avatar upload** — drag-drop zone with thumbnail preview, replace/remove, guidance text: *"Use a front-facing portrait with a clear face and balanced lighting"*
3. **Script editor** — large `<textarea>`, word count, estimated speaking time (≈130 wpm), pacing hint, max length note
4. **Voice selector** — ElevenLabs connection status, searchable voice list, tone/style/language metadata, sample play; selected voice: cyan glow ring; empty state: *"Connect your ElevenLabs account to select a voice"*
5. **Video settings** (collapsible) — aspect ratio, resolution, subtitles toggle, background style, speaking pace
6. **Sticky footer** — "Generate avatar video" (`.btn-primary`) + "Save draft" (`.btn-secondary`)

### Center panel (studio stage)
- **Empty state:** cinematic framed monitor — *"Upload an avatar, add a script, and choose a voice to begin"*
- **Rendering state:** animated waveform bars (`waveform-pulse`) + ribbon progress strip + "Synthesizing voice" / "Animating avatar" / "Rendering final video" status labels
- **Completed state:** `VideoPlayer` with scrub bar, replay, fullscreen, download, save to project, "Create new take"

### Right panel (takes & outputs)
Sections: Current session · Recent takes · Saved outputs  
Take card: thumbnail, duration, voice used, script length, generated time, status badge  
Hover actions: Preview · Duplicate · Download · Rename · Add to project

---

## Global Rules

- Remove every instance of "Instaart" / "InstaArt" from text, meta tags, page titles, alt text, and comments
- Replace with "Reelsy" throughout
- `app/layout.tsx` metadata: title `"Reelsy — AI Creative Studio"`, update description and OG fields
- No default browser spinners — use `.loader-ribbon` or `waveform-pulse`
- Copy tone: concise, modern, direct, slightly cinematic — never "magical" or playful
- Cyan gradient (`--gradient-primary`) used only on buttons, accents, and highlights — not as large background fills
- All surfaces use the dark charcoal palette
- Motion: `fade-rise` and soft horizontal slide — no `spring` / `bounce` physics
- Responsive: mobile landing stacks hero vertically, hamburger nav, swipe rails; mobile dashboard uses bottom nav; mobile studio uses step-by-step flow

---

## File Change Summary

| File | Change type |
|------|------------|
| `app/globals.css` | Token replacement, animation additions |
| `app/layout.tsx` | Metadata update (title, description, OG) |
| `app/page.tsx` | Full structural rewrite |
| `app/login/page.tsx` | Full rewrite (split-panel + onboarding) |
| `app/dashboard/page.tsx` | Structural rewrite (preserve functional wiring) |
| `app/studio/page.tsx` | Shell rewrite (3-panel layout) |
| `components/VideoGeneratorForm.tsx` | JSX surface reskin only — no logic changes |
| `components/VoiceSelector.tsx` | JSX surface reskin only |
| `components/VideoPlayer.tsx` | JSX surface reskin only |
| `components/ConnectElevenLabsButton.tsx` | JSX surface reskin only |
| `app/icon.png` | Replace with `reelsy-icon.png` (copy file) |
| `app/apple-icon.png` | Replace with `reelsy-icon.png` (copy file) |
| `public/For Rebranding/*` | Assets used, not modified |
