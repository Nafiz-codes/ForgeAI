# ForgeAI — Frontend Walkthrough

> **Owner:** Member 3 — Frontend Engineer  
> **Stack:** Next.js 16 · TypeScript · Tailwind CSS · Vanilla CSS Design System  
> **Last updated:** July 12, 2026

---

## Quick Start

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

---

## Pages Overview

### 🏠 Landing Page — `/`

**File:** `frontend/src/app/page.tsx`

The marketing homepage. Everything here is static — no API calls.

| Section | Description |
|---|---|
| `<NavBar>` | Sticky glassmorphism nav, scrolled state changes background |
| `<HeroSection>` | Animated typewriter tagline, gradient headline, background orbs, stats row |
| `<FeaturesSection>` | 6 glassmorphism cards covering the product pillars |
| `<HowItWorksSection>` | 4-step pipeline: Upload → Profile → Review → Download |
| `<DemoSection>` | **Interactive** — live toggleable AI decision cards (✓/✗), no API |
| `<CTASection>` | Full-width call-to-action with glow effect |
| `<Footer>` | Links to all pages |

---

### 📁 Upload Page — `/upload`

**File:** `frontend/src/app/upload/page.tsx`

The entry point for users. Currently uses simulated data — needs wiring to the backend profiler.

**Current flow (mock):**
```
Drop CSV → fake upload progress bar → fake "Gemma profiling" spinner → hardcoded profile stats
```

**Real flow (once backend is ready):**
```
Drop CSV → POST /api/upload → returns dataset_profile.json → render real stats
```

**Key UI states:**
| State | What renders |
|---|---|
| `idle` | Drag-and-drop zone + sample dataset buttons |
| `uploading` | Progress bar (0–100%) |
| `profiling` | Spinning brain icon + badge labels |
| `done` | Stats grid + data preview table + column analysis |

**Hardcoded data to replace:**
- `PROFILE_STATS` → real values from backend profiler
- `COLUMN_ANALYSIS` → real column metadata from Pandas
- `SAMPLE_DATA` → first 5 rows from the actual uploaded CSV

**API contract expected from Backend (M2):**
```json
POST /api/upload
Content-Type: multipart/form-data

Response 200:
{
  "dataset_id": "abc123",
  "rows": 7841,
  "columns": 12,
  "missing_total": 1203,
  "duplicate_rows": 47,
  "health_score": 42,
  "target_column": "Churn",
  "preview": [ { "col": "val", ... } ],
  "column_analysis": [
    { "name": "Age", "type": "float64", "missing_pct": 14.2, "unique_count": 68, "flag": "Has Nulls" }
  ]
}
```

---

### 🧠 AI Plan Review Page — `/review`

**File:** `frontend/src/app/review/page.tsx`

The **key differentiator** of ForgeAI. Every proposed action from Gemma is shown as an interactive card. Users approve or override before a single row is touched.

**Current flow (mock):**
```
Hardcoded INITIAL_DECISIONS array → user toggles cards → "Execute" transitions to /results
```

**Real flow (once AI + backend is ready):**
```
GET /api/plan/{dataset_id} → Gemma's decisions → user edits → POST /api/execute
```

**Decision card fields:**
| Field | Source | Description |
|---|---|---|
| `column` | Gemma JSON | Column name being acted on |
| `action` | Gemma JSON | What will be done (e.g. "Median imputation") |
| `category` | Gemma JSON | Groups actions (Missing Value Handling, etc.) |
| `reason` | Gemma JSON | Gemma's human-readable explanation |
| `confidence` | Gemma JSON | 0–100 confidence score |
| `status` | Frontend state | `keep` or `remove` — set by user toggle |

**Hardcoded data to replace:**
- `INITIAL_DECISIONS` array → fetch from `GET /api/plan/{dataset_id}`

**API contracts:**
```json
GET /api/plan/{dataset_id}
Response 200:
{
  "dataset_health_score": 42,
  "predicted_health_score": 93,
  "summary": "Gemma's overall analysis summary...",
  "actions": [
    {
      "column": "CustomerID",
      "action": "Drop column",
      "category": "Identifier Removal",
      "reason": "Cardinality equals row count (100%)...",
      "confidence": 97,
      "type": "drop"
    }
  ]
}

POST /api/execute
Body: { "dataset_id": "abc123", "approved_actions": [ ...kept actions... ] }
Response 200: { "job_id": "xyz789" }
```

---

### 📊 Results Page — `/results`

**File:** `frontend/src/app/results/page.tsx`

Shows the outcome of the executed preprocessing plan. Four tabbed sections.

| Tab | Content |
|---|---|
| **Overview** | Health score SVG rings (before/after), Before/After comparison table, Download artifact buttons |
| **AI Decision Log** | Audit table of all 8 executed actions with timing |
| **Pipeline Code** | Generated `preprocessing_pipeline.py` with copy-to-clipboard |
| **ML Models** | Gemma's ranked model recommendations with suitability scores |

**Health score rings** are rendered as raw SVG — no chart library needed.

**Hardcoded data to replace:**
- `ML_MODELS` → from Gemma's `ml_recommendations` field
- `DECISION_LOG` → from backend execution log
- `BEFORE_AFTER` → computed from before/after dataset stats
- `PIPELINE_CODE` → fetched as text from `GET /api/artifacts/{dataset_id}/pipeline`

**API contracts:**
```json
GET /api/results/{dataset_id}
Response 200:
{
  "health_score_before": 42,
  "health_score_after": 93,
  "completeness_score": 97,
  "consistency_score": 89,
  "ml_readiness_score": 94,
  "actions_applied": 8,
  "rows_after": 7794,
  "columns_after": 14,
  "decision_log": [ { "action": "...", "reason": "...", "time_ms": 23 } ],
  "ml_recommendations": [ { "model": "Random Forest", "suitability": 94, "reason": "..." } ]
}

GET /api/artifacts/{dataset_id}/csv         → clean CSV file download
GET /api/artifacts/{dataset_id}/pipeline    → preprocessing_pipeline.py text
GET /api/artifacts/{dataset_id}/report      → HTML report file
```

---

## Design System

All design tokens, animations, glassmorphism utilities, badge variants, and component styles live in one file:

**File:** `frontend/src/app/globals.css`

### Color Tokens

| Variable | Value | Usage |
|---|---|---|
| `--bg-primary` | `#030712` | Page background |
| `--bg-card` | `#0d1424` | Card backgrounds |
| `--accent-blue` | `#3b82f6` | Primary actions |
| `--accent-violet` | `#8b5cf6` | AI/Gemma elements |
| `--accent-emerald` | `#10b981` | Success / "after" states |
| `--accent-rose` | `#f43f5e` | Danger / "before" states |
| `--accent-amber` | `#f59e0b` | Warnings / Medium confidence |
| `--text-secondary` | `#94a3b8` | Body copy |
| `--text-muted` | `#475569` | Labels, metadata |

### Utility Classes

| Class | Effect |
|---|---|
| `.glass` | Glassmorphism card (blur + dark bg + subtle border) |
| `.glass-bright` | Higher opacity glass for focal elements |
| `.gradient-text` | Blue→Violet→Emerald gradient text |
| `.btn-primary` | Blue→Violet gradient button with hover lift |
| `.btn-secondary` | Transparent button with border |
| `.badge` + `.badge-{color}` | Pill badges (blue, violet, emerald, amber, rose, cyan) |
| `.card-hover` | Lift + border brighten on hover |
| `.orb` | Blurred background blob for atmosphere |
| `.data-table` | Dark-themed HTML table |
| `.progress-bar` + `.progress-fill` | Thin progress bar |
| `.confidence-high/medium/low` | Gradient fills for confidence bars |

### Animations

| Class | Effect |
|---|---|
| `.animate-float` | Gentle vertical bob (4s loop) |
| `.animate-spin-slow` | Slow full rotation (12s loop) |
| `.animate-fadeInUp` | Fade in from below (one-shot) |
| `.animate-shimmer` | Shimmer sweep across element |
| `.thinking-dot` | AI thinking pulse dots |

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
- [ ] **M3 Frontend** — Framer Motion page transitions (polish day)

---

## Team Contacts

| Role | Responsibility |
|---|---|
| 🧠 M1 — AI Engineer | Gemma 4 prompt, JSON schema, confidence scoring |
| ⚙️ M2 — Backend Engineer | FastAPI, Pandas profiler, sklearn execution, file generation |
| 🎨 M3 — Frontend Engineer | This file — all pages at `http://localhost:3000` |
