# ForgeAI — Frontend Walkthrough

> **Owner:** Member 3 — Frontend Engineer  
> **Stack:** Next.js 16 · TypeScript · Tailwind CSS · Vanilla CSS Design System  
> **Last updated:** July 13, 2026

---

## Quick Start

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

---

## Design Philosophy (July 2026 Redesign)

The original frontend used a heavy glassmorphism template aesthetic — every section had stacked glass cards, gradient text everywhere, emoji in buttons and headings, and copy that read like generated marketing text.

The redesign moved toward an editorial, product-first aesthetic inspired by tools like Linear, Vercel, and Liveblocks. Key decisions:

### Visual changes
- **Emoji removed from UI controls** — no emoji in buttons, tabs, section headings, or badges. Icons that communicate status use SVG or unicode text (`✓`, `✗`) only in appropriate toggle contexts.
- **Logo replaced** — the `⚡` emoji logo was replaced with a small SVG checkmark-in-rounded-rect, used consistently across all pages.
- **Glass used sparingly** — glassmorphism now only appears on sticky navbars and the floating confirmation bar on the review page. Regular content cards use `background: var(--bg-card)` with a simple border.
- **Feature card grid** — replaced individual glassmorphism cards with a CSS grid separated by 1px lines (like Linear's feature section), which reads as a unified table rather than isolated tiles.
- **Stat grid on upload page** — same 1px-separator grid pattern instead of individual stat cards.
- **Orb blobs** — kept but reduced opacity from 0.35 to 0.22; used only in hero and CTA sections.
- **Color palette tightened** — accent colors slightly adjusted to feel less saturated. `--accent-blue` is now `#2563eb` (used in buttons) while `#3b82f6` is reserved for informational highlights.
- **Buttons** — `btn-primary` is now a flat `#2563eb` (not a gradient), which looks less like a template and more like a real product button. Hover darkens to `#1d4ed8` with a soft shadow. No `::before` overlay trick.

### Copy changes
- **Hero headline** — "Your data, AI-cleaned. ML-ready in seconds." → "Your messy data, cleaned by AI. ML-ready in under a minute." (more specific, honest)
- **Sub-heading** — removed "doesn't just clean data" phrasing. Replaced with a direct description of what actually happens.
- **Feature descriptions** — each card rewritten to explain the *mechanism*, not the value proposition. E.g., "Gemma reads your dataset profile and reasons about it — the same way a senior data scientist would" instead of "ForgeAI doesn't just run heuristics — Gemma reads your dataset profile and reasons like a senior data scientist, justifying every decision."
- **How it works steps** — same: descriptions now say what Gemma actually does, not how impressive it is.
- **Demo section** — "See the AI Plan Review — live" → "This is what the review step looks like." More honest, less promotional.
- **CTA** — "Ready to forge your perfect dataset?" → "Stop cleaning data by hand." Simpler, problem-focused.
- **Button text** — "🚀 Start Analyzing" → "Start analyzing", "🚀 Launch ForgeAI" → "Upload a dataset", "✅ Approve & Execute" → "Execute plan", "⬇️ Download Clean CSV" → "Download clean CSV".
- **Decision log tab** — "📋 AI Decision Log" → "Decision log".
- **ML model descriptions** — rewritten to be analytical rather than enthusiastic. E.g., "Worth training alongside Random Forest" instead of "Excellent for tabular data."
- **Review page Gemma banner** — "I identified..." rewritten as third-person statement without the emoji, reads more like a system message.

### Layout changes
- **Stats row** in hero section — changed from emoji+value cards to a three-column bordered layout with clear metric/label pairs, no emoji.
- **How It Works** — connector lines removed (were already hidden), step numbers now use low-opacity color fills instead of being nested inside separate icon boxes, cleaner visual hierarchy.
- **Navigation breadcrumb** — `StepIndicator` extracted into a shared component, consistent across all three inner pages. Step dots: pending → `rgba(255,255,255,0.05)`, active → `#2563eb`, done → `#059669`.
- **Demo section** — the panel now has an explicit header row (filename, approval count, "Open full review" link) to look like an actual product UI rather than a marketing mock.
- **Results tabs** — tab bar uses a slightly smaller radius and border, text labels without emoji.
- **Download items** — SVG download icons replace the `⬇️` emoji. Each item has a color-tinted icon square.

### CSS changes (`globals.css`)
- Removed `grid-bg` animated grid (was too heavy, now only used on hero).
- Removed `.noise` pseudo-element (was barely visible, added complexity).
- Added `--bg-surface`, `--border-subtle`, `--border-strong`, `--text-dimmed` tokens for finer control.
- Added `.section-label` utility (small-caps uppercase label above section headings).
- Refined `.data-table` — headers are now muted uppercase labels, not blue. First column defaults to `--text-primary`.
- Reduced `@keyframes` to only those actually used.
- `btn-primary` is now a solid blue, not a gradient. `btn-secondary` has a more neutral background.
- `.card` class added as a simpler alternative to `.glass` for non-sticky contexts.
- Orb opacity reduced from `0.35` → `0.22`.
- `--radius-sm/md/lg/xl` tokens added for consistent border-radius.

---

## Pages Overview

### Landing Page — `/`

**File:** `frontend/src/app/page.tsx`

The marketing homepage. Static — no API calls.

| Section | Description |
|---|---|
| `<NavBar>` | Sticky nav, background appears on scroll. SVG logo. No emoji in links. |
| `<HeroSection>` | Typewriter second line, orb blobs, three-column metrics row (no emoji) |
| `<FeaturesSection>` | 6 feature cells in a 1px-separator grid, `section-label` above heading |
| `<HowItWorksSection>` | 4-step grid, accent top-border per step, big muted step numbers |
| `<DemoSection>` | Interactive decision cards panel, looks like actual product UI |
| `<CTASection>` | Centered, single CTA button, no secondary button |
| `<Footer>` | Three-column layout, small SVG logo, minimal links |

---

### Upload Page — `/upload`

**File:** `frontend/src/app/upload/page.tsx`

Entry point for users. Simulated upload/profiling flow.

**Key UI states:**
| State | What renders |
|---|---|
| `idle` | Upload zone (SVG icon, no emoji), sample dataset text buttons |
| `uploading` | Progress bar with text percentage |
| `profiling` | CSS spinner ring + analysis badge labels |
| `done` | 1px-separator stats grid + data preview table + column analysis |

**Stat grid design:** Uses `gap: "1px"` background as separators instead of individual cards — unified block that reads as a summary panel.

**Column analysis flags:** Removed emoji from flag badges (`⚠️ Identifier` → `Identifier`, `🔴 Has Nulls` → `Has nulls`).

**Upload zone:** The folder icon (📂) replaced with an SVG upload arrow in a tinted box. "Browse Files" button removed from inside the zone; instead the entire zone is clickable with a "Choose file" secondary button.

**Sample dataset buttons:** Changed from blue tinted pill buttons to neutral bordered buttons matching the site's secondary style.

---

### AI Plan Review Page — `/review`

**File:** `frontend/src/app/review/page.tsx`

The core interactive page. Users approve or skip preprocessing actions.

**Decision card changes:**
- Left accent line reduced from `3px` to `2px`
- Toggle button is `36px` (was `40px`), uses `✓` / `✗` text, not emoji
- Category labels on each card have no emoji prefix
- Skipped cards dim to `opacity: 0.55` (was `0.65`)
- Action tag uses `font-weight: 500` (not bold), reads more like metadata

**Category filter:** Plain text buttons with border + background tint on active state, no emoji. "All Actions" → "All".

**Page header copy:** "Gemma analyzed customer_churn.csv and proposed 8 actions" — plain, honest.

**Gemma analysis banner:** Replaced the brain emoji + "Gemma 4 Analysis Complete" header with a small dot indicator and a plain paragraph.

**Bottom bar:** "✅ Execute Plan" → "Execute plan", "← Re-upload" → "Back to upload".

**Completion screen:** The `🎉` emoji replaced with a checkmark in a green-tinted box. Text: "Plan executed" instead of "Plan executed!".

**Execute button in nav:** "✅ Approve & Execute (8)" → "Execute (8 actions)".

---

### Results Page — `/results`

**File:** `frontend/src/app/results/page.tsx`

Shows the outcome of the executed preprocessing plan.

**Tab labels:** All emoji removed: `"📊 Overview"` → `"Overview"`, `"📋 AI Decision Log"` → `"Decision log"`, `"⚙️ Pipeline Code"` → `"Pipeline code"`, `"🎯 ML Models"` → `"Model suggestions"`.

**Success banner:** `🎉` removed. `h1` is now `<code>filename</code> is ML-ready` — inline code element gives it a technical feel without emoji.

**Download buttons:** `"⬇️ Download Clean CSV"` → `"Download clean CSV"` / `"Download pipeline"`.

**Health rings:** `HealthRing` component unchanged in logic; label text cleaned up (`"Before Score"` → `"Before"`, etc.).

**Decision log table:** Status column (`✅`) removed — success is implied. Table now has four columns: Action, Reason, Impact, Time.

**ML Models tab:** 
- `🌲`, `⚡`, `📈` icon emojis replaced with ranked number badges (1, 2, 3) in color-tinted boxes.
- Model descriptions rewritten to be analytical.
- Gemma recommendation note: `"🧠 Gemma recommends"` → `"Gemma recommends"` (no emoji).

**Download items:** `📄`, `⚙️`, `📊` icons replaced with inline SVG download arrows in color-tinted squares.

**Copy button:** `"✓ Copied!"` → `"Copied"`, `"Copy Code"` → `"Copy"`.

---

## Design System

All tokens, utilities, and component styles are in:

**File:** `frontend/src/app/globals.css`

### Color Tokens

| Variable | Value | Usage |
|---|---|---|
| `--bg-primary` | `#080c14` | Page background |
| `--bg-secondary` | `#0c1120` | Nav, table headers, panel headers |
| `--bg-card` | `#0f1524` | Card backgrounds |
| `--bg-card-hover` | `#131a2c` | Card hover state |
| `--bg-surface` | `#111827` | Surfaces needing slightly more contrast |
| `--border` | `rgba(255,255,255,0.07)` | Standard borders |
| `--border-subtle` | `rgba(255,255,255,0.04)` | 1px separator lines |
| `--border-strong` | `rgba(255,255,255,0.14)` | Focused/active borders |
| `--accent-blue` | `#2563eb` | Primary button background |
| `--accent-violet` | `#7c3aed` | AI/Gemma elements |
| `--accent-emerald` | `#059669` | Success / "after" states |
| `--accent-rose` | `#e11d48` | Danger / "before" states |
| `--accent-amber` | `#d97706` | Warnings / Medium confidence |
| `--text-primary` | `#f8fafc` | Main text |
| `--text-secondary` | `#8b9ab0` | Body copy |
| `--text-muted` | `#4b5d73` | Labels, metadata |
| `--text-dimmed` | `#2d3f55` | Very faint hints |

### Utility Classes

| Class | Effect |
|---|---|
| `.card` | Simple dark card (bg-card + border), no blur |
| `.glass` | Glassmorphism — used only for sticky navbars |
| `.glass-bright` | Higher opacity glass for floating bars |
| `.gradient-text` | Blue→Violet→Emerald gradient text |
| `.section-label` | Small-caps uppercase label above headings |
| `.btn-primary` | Solid blue button with hover darken |
| `.btn-secondary` | Neutral bordered button |
| `.badge` + `.badge-{color}` | Pill badges (blue, violet, emerald, amber, rose, cyan) |
| `.card-hover` | Border brighten + translateY(-2px) on hover |
| `.orb` | Blurred background blob (opacity 0.22) |
| `.data-table` | Clean dark table, uppercase muted headers |
| `.progress-bar` + `.progress-fill` | 4px progress bar |
| `.confidence-high/medium/low` | Gradient fills for confidence bars |
| `.upload-zone` | Dashed border drop zone |
| `.grid-bg` | Subtle 48px grid pattern |

### Animations

| Class | Effect |
|---|---|
| `.animate-fadeInUp` | Fade in from below (0.5s) |
| `.animate-fadeIn` | Simple fade in (0.4s) |
| `.animate-float` | Gentle vertical bob (3.5s loop) |
| `.animate-spin-slow` | Used for profiling spinner (1s) |
| `.animate-slideInRight` | Slide in from right (toast) |
| `.thinking-dot` | Pulsing AI dots |

---

## File Structure

```
frontend/
├── src/
│   └── app/
│       ├── globals.css          # Full design system — edit this first
│       ├── layout.tsx           # Root layout + SEO metadata
│       ├── page.tsx             # / — Landing page
│       ├── upload/
│       │   └── page.tsx         # /upload — CSV upload + profiling
│       ├── review/
│       │   └── page.tsx         # /review — AI plan review
│       └── results/
│           └── page.tsx         # /results — Downloads + reports
├── package.json
└── next.config.ts
```

---

## Integration Checklist

These are the tasks remaining before the frontend is fully wired to real AI:

- [ ] **M2 Backend** — `POST /api/upload` returns real dataset profile JSON
- [ ] **M2 Backend** — `GET /api/plan/{id}` returns Gemma's action plan JSON
- [ ] **M1 AI** — Gemma 4 prompt returns the exact JSON schema shown above
- [ ] **M2 Backend** — `POST /api/execute` runs the approved plan
- [ ] **M2 Backend** — `GET /api/results/{id}` returns execution results
- [ ] **M2 Backend** — Artifact download endpoints (CSV, pipeline.py, HTML report)
- [ ] **M3 Frontend** — Replace all hardcoded mock constants with `fetch()` calls
- [ ] **M3 Frontend** — Add loading skeletons while API calls are in flight
- [ ] **M3 Frontend** — Pass `dataset_id` between pages (via URL params or context)
- [ ] **M3 Frontend** — Handle API error states (invalid CSV, Gemma timeout, etc.)
- [ ] **M3 Frontend** — Mobile responsive breakpoints

---

## Team Contacts

| Role | Responsibility |
|---|---|
| M1 — AI Engineer | Gemma 4 prompt, JSON schema, confidence scoring |
| M2 — Backend Engineer | FastAPI, Pandas profiler, sklearn execution, file generation |
| M3 — Frontend Engineer | This file — all pages at `http://localhost:3000` |
