# ForgeAI — Frontend Sample Pages ✅

> **Live at:** `http://localhost:3000` — All 4 pages verified, zero errors.
> 
> **Recording:** ![Full demo walkthrough](file:///C:/Users/DibooAnan/.gemini/antigravity-ide/brain/22f2bc77-549d-411a-b00b-40d7405d338f/forgeai_final_demo_1783793521751.webp)

---

## 🏠 Landing Page — `/`

````carousel
![Hero section — dark gradient with typewriter effect and CTAs](file:///C:/Users/DibooAnan/.gemini/antigravity-ide/brain/22f2bc77-549d-411a-b00b-40d7405d338f/landing_page_top_1783793536711.png)
<!-- slide -->
![Feature cards — 6 pillars with glassmorphism cards](file:///C:/Users/DibooAnan/.gemini/antigravity-ide/brain/22f2bc77-549d-411a-b00b-40d7405d338f/landing_features_1783793541291.png)
<!-- slide -->
![How It Works — 4-step pipeline visualization](file:///C:/Users/DibooAnan/.gemini/antigravity-ide/brain/22f2bc77-549d-411a-b00b-40d7405d338f/landing_how_it_works_1783793545195.png)
<!-- slide -->
![Interactive Demo Section — live toggleable AI decision cards](file:///C:/Users/DibooAnan/.gemini/antigravity-ide/brain/22f2bc77-549d-411a-b00b-40d7405d338f/landing_demo_flow_1783793551695.png)
<!-- slide -->
![CTA + Footer](file:///C:/Users/DibooAnan/.gemini/antigravity-ide/brain/22f2bc77-549d-411a-b00b-40d7405d338f/landing_footer_1783793555857.png)
````

---

## 📁 Upload Page — `/upload`

![Drag-and-drop zone with sample dataset buttons](file:///C:/Users/DibooAnan/.gemini/antigravity-ide/brain/22f2bc77-549d-411a-b00b-40d7405d338f/upload_page_1783793567293.png)

---

## 🧠 AI Plan Review Page — `/review`

> **Key differentiator:** Click ✓/✗ on any card to approve/override Gemma's decisions before a single row is touched.

````carousel
![AI Plan Review — decision cards with confidence scores and reasoning](file:///C:/Users/DibooAnan/.gemini/antigravity-ide/brain/22f2bc77-549d-411a-b00b-40d7405d338f/review_page_top_1783793577331.png)
<!-- slide -->
![Review Page — more decision cards + sticky approval bar](file:///C:/Users/DibooAnan/.gemini/antigravity-ide/brain/22f2bc77-549d-411a-b00b-40d7405d338f/review_page_bottom_1783793581539.png)
````

---

## 📊 Results Page — `/results`

````carousel
![Overview tab — health rings 42→93 + Before/After table + Downloads](file:///C:/Users/DibooAnan/.gemini/antigravity-ide/brain/22f2bc77-549d-411a-b00b-40d7405d338f/results_overview_tab_1783793594635.png)
<!-- slide -->
![AI Decision Log tab — full audit trail of all 8 applied actions](file:///C:/Users/DibooAnan/.gemini/antigravity-ide/brain/22f2bc77-549d-411a-b00b-40d7405d338f/results_decision_log_tab_1783793602764.png)
<!-- slide -->
![Pipeline Code tab — generated preprocessing_pipeline.py with copy button](file:///C:/Users/DibooAnan/.gemini/antigravity-ide/brain/22f2bc77-549d-411a-b00b-40d7405d338f/results_pipeline_code_tab_1783793612174.png)
<!-- slide -->
![ML Models tab — ranked recommendations with suitability scores](file:///C:/Users/DibooAnan/.gemini/antigravity-ide/brain/22f2bc77-549d-411a-b00b-40d7405d338f/results_ml_models_tab_1783793621158.png)
````

---

## Quick Start

```bash
cd e:\CS\ForgeAI\frontend
npm run dev
# Open http://localhost:3000
```

## File Map

| File | Route | Description |
|---|---|---|
| [page.tsx](file:///e:/CS/ForgeAI/frontend/src/app/page.tsx) | `/` | Landing page |
| [upload/page.tsx](file:///e:/CS/ForgeAI/frontend/src/app/upload/page.tsx) | `/upload` | CSV upload + profiling |
| [review/page.tsx](file:///e:/CS/ForgeAI/frontend/src/app/review/page.tsx) | `/review` | AI plan review |
| [results/page.tsx](file:///e:/CS/ForgeAI/frontend/src/app/results/page.tsx) | `/results` | Downloads + reports |
| [globals.css](file:///e:/CS/ForgeAI/frontend/src/app/globals.css) | — | Full design system |
