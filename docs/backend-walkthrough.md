# ForgeAI — Backend & AI Walkthrough

> **Owners:** Member 2 (Backend Engineer) · Member 1 (AI Engineer)  
> **Stack:** FastAPI · Pandas · scikit-learn · Gemma 4  
> **Principle:** AI reasons. Python executes. Humans approve.  
> **Last updated:** July 12, 2026

---

## Quick Start

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

---

## Architecture Overview

The backend is split into three distinct layers. They must never be mixed.

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 1 — Dataset Profiler (Pure Python / Pandas)      │
│  Input:  raw CSV file                                   │
│  Output: dataset_profile.json                           │
│  Rule:   No AI. No preprocessing. Facts only.           │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  LAYER 2 — AI Reasoning (Gemma 4)                       │
│  Input:  dataset_profile.json + engineered prompt       │
│  Output: preprocessing_plan.json                        │
│  Rule:   No Python execution. Reasoning only.           │
└──────────────────────────┬──────────────────────────────┘
                           │
                    Human review + approval
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  LAYER 3 — Execution Engine (Pandas + sklearn)          │
│  Input:  approved preprocessing_plan.json               │
│  Output: clean_dataset.csv + pipeline.py + report.html  │
│  Rule:   No AI. Deterministic only. No AI-generated code│
└─────────────────────────────────────────────────────────┘
```

---

## Recommended Project Structure

```
backend/
├── main.py                    # FastAPI app — all routes
├── requirements.txt
│
├── profiler/
│   └── profiler.py            # Layer 1 — Dataset profiling logic
│
├── ai/
│   ├── gemma_client.py        # Layer 2 — Gemma 4 API wrapper
│   ├── prompt_builder.py      # Converts profile JSON → prompt string
│   └── response_parser.py     # Validates + parses Gemma's JSON output
│
├── engine/
│   ├── executor.py            # Layer 3 — Applies approved actions
│   ├── health_score.py        # Health score before/after calculation
│   └── artifact_generator.py  # Generates pipeline.py + HTML report
│
├── storage/
│   └── session_store.py       # Temporary file + session management
│
└── schemas/
    ├── profile_schema.py      # Pydantic models for dataset profile
    ├── plan_schema.py         # Pydantic models for preprocessing plan
    └── results_schema.py      # Pydantic models for execution results
```

---

## API Endpoints

### `POST /api/upload`

**Owner:** M2 (Backend)  
Receives the user's CSV, runs the profiler, triggers Gemma reasoning, returns both.

```
Request:
  Content-Type: multipart/form-data
  Body: file (CSV)

Response 200:
{
  "dataset_id": "abc123",           # UUID — used for all subsequent calls
  "rows": 7841,
  "columns": 12,
  "missing_total": 1203,
  "duplicate_rows": 47,
  "memory_mb": 2.4,
  "possible_task": "classification",
  "health_score": 42,
  "target_column": "Churn",
  "preview": [                      # First 5 rows as array of objects
    { "CustomerID": "C001", "Age": 34, "Churn": 0 }
  ],
  "column_analysis": [
    {
      "name": "Age",
      "dtype": "numeric",
      "missing_pct": 14.2,
      "unique_count": 68,
      "possible_identifier": false,
      "flag": "Has Nulls"
    }
  ]
}
```

---

### `GET /api/plan/{dataset_id}`

**Owner:** M1 (AI) + M2 (Backend)  
Returns Gemma's preprocessing plan for the uploaded dataset.

```
Response 200:
{
  "dataset_id": "abc123",
  "health_score_before": 42,
  "predicted_health_score": 93,
  "summary": "I identified 2 identifier columns, 3 numeric features requiring imputation...",
  "actions": [
    {
      "id": 1,
      "column": "CustomerID",
      "action": "Drop column",
      "category": "Identifier Removal",
      "reason": "Cardinality equals row count (100%). Zero predictive signal.",
      "confidence": 97,
      "type": "drop"
    },
    {
      "id": 2,
      "column": "Age",
      "action": "Median imputation",
      "category": "Missing Value Handling",
      "reason": "14.2% missing. Skewness of 1.3 makes median more robust than mean.",
      "confidence": 89,
      "type": "impute"
    }
  ],
  "ml_recommendations": [
    {
      "model": "Random Forest",
      "type": "Ensemble",
      "suitability": 94,
      "reason": "Handles class imbalance well. Robust to mixed feature types.",
      "pros": ["Feature importance", "Handles mixed types", "Robust to outliers"]
    }
  ]
}
```

---

### `POST /api/execute`

**Owner:** M2 (Backend)  
Receives the user's approved plan (with any overrides) and runs the execution engine.

```
Request:
{
  "dataset_id": "abc123",
  "approved_actions": [
    { "id": 1, "column": "CustomerID", "type": "drop" },
    { "id": 2, "column": "Age",        "type": "impute" }
  ]
}

Response 200:
{
  "job_id": "xyz789",
  "status": "complete",
  "rows_before": 7841,
  "rows_after": 7794,
  "columns_before": 12,
  "columns_after": 14,
  "health_score_before": 42,
  "health_score_after": 93,
  "completeness_score": 97,
  "consistency_score": 89,
  "ml_readiness_score": 94,
  "actions_applied": 8,
  "decision_log": [
    {
      "action": "Removed CustomerID",
      "reason": "Unique identifier — no predictive value",
      "impact": "High",
      "time_ms": 1
    }
  ]
}
```

---

### `GET /api/artifacts/{dataset_id}/csv`

Returns the cleaned CSV file as a download.

```
Response: application/octet-stream
Content-Disposition: attachment; filename="customer_churn_clean.csv"
```

---

### `GET /api/artifacts/{dataset_id}/pipeline`

Returns the generated `preprocessing_pipeline.py` as plain text.

```
Response: text/plain
```

---

### `GET /api/artifacts/{dataset_id}/report`

Returns the full HTML AI Decision Report.

```
Response: text/html
```

---

## Layer 1 — Dataset Profiler

**File:** `profiler/profiler.py`  
**Owner:** M2 (Backend)

This is pure Pandas/NumPy. No AI involved. Runs immediately on upload.

### What to compute

```python
import pandas as pd
import numpy as np

def profile_dataset(df: pd.DataFrame, dataset_name: str) -> dict:

    # --- Dataset-level ---
    rows, columns = df.shape
    duplicates = df.duplicated().sum()
    missing_cells = df.isnull().sum().sum()
    memory_mb = round(df.memory_usage(deep=True).sum() / 1e6, 2)

    # --- Column-level ---
    column_profiles = []
    for col in df.columns:
        series = df[col]
        profile = {
            "name": col,
            "dtype": classify_dtype(series),        # "numeric" | "categorical" | "boolean" | "date"
            "missing_pct": round(series.isnull().mean() * 100, 2),
            "unique_count": series.nunique(),
            "possible_identifier": series.nunique() == len(df),
        }

        if profile["dtype"] == "numeric":
            profile.update({
                "mean":     round(series.mean(), 4),
                "median":   round(series.median(), 4),
                "std":      round(series.std(), 4),
                "min":      round(series.min(), 4),
                "max":      round(series.max(), 4),
                "skewness": round(series.skew(), 4),
                "outliers": count_iqr_outliers(series),
            })

        elif profile["dtype"] == "categorical":
            profile.update({
                "cardinality":  classify_cardinality(series.nunique()),  # "Low" | "Medium" | "High"
                "most_common":  series.mode()[0] if not series.mode().empty else None,
            })

        column_profiles.append(profile)

    return {
        "dataset_name": dataset_name,
        "rows": rows,
        "columns": columns,
        "duplicates": int(duplicates),
        "missing_cells": int(missing_cells),
        "memory_mb": memory_mb,
        "possible_task": infer_task(df),        # "classification" | "regression" | "unknown"
        "possible_target": infer_target(df),    # column name or null
        "columns": column_profiles,
    }
```

### Helper functions to implement

| Function | Logic |
|---|---|
| `classify_dtype(series)` | `pd.api.types.is_numeric_dtype` → `"numeric"`, else check for bool, datetime, then `"categorical"` |
| `count_iqr_outliers(series)` | `Q1 = 25th pct, Q3 = 75th pct, IQR = Q3-Q1` → count values outside `[Q1 - 1.5×IQR, Q3 + 1.5×IQR]` |
| `classify_cardinality(n)` | `n ≤ 10 → "Low"`, `n ≤ 50 → "Medium"`, else `"High"` |
| `infer_task(df)` | Look for binary int column — `"classification"`. Continuous float column → `"regression"` |
| `infer_target(df)` | Check for columns named `target, label, y, survived, churn, class` (case-insensitive) |

### Health Score Formula

Compute before and after preprocessing. Higher = better.

```python
def compute_health_score(df: pd.DataFrame) -> int:
    score = 100

    missing_pct = df.isnull().mean().mean() * 100
    score -= min(40, missing_pct * 2)           # Up to -40 for missing values

    dup_pct = df.duplicated().mean() * 100
    score -= min(20, dup_pct * 5)               # Up to -20 for duplicates

    numeric_cols = df.select_dtypes(include="number")
    skewed = (numeric_cols.skew().abs() > 2).sum()
    score -= min(20, skewed * 5)                # Up to -20 for skewed features

    outlier_pct = count_total_outlier_pct(df)
    score -= min(20, outlier_pct * 2)           # Up to -20 for outliers

    return max(0, round(score))
```

---

## Layer 2 — AI Reasoning (Gemma 4)

**Files:** `ai/gemma_client.py`, `ai/prompt_builder.py`, `ai/response_parser.py`  
**Owner:** M1 (AI Engineer)

### Core Principle

> Gemma receives a structured JSON profile. It **never** sees the raw CSV. It returns a structured JSON plan. It **never** writes code or executes anything.

---

### Prompt Template

**File:** `ai/prompt_builder.py`

```python
def build_prompt(profile: dict) -> str:
    return f"""
You are an expert data scientist. You have been given a structured profile 
of a dataset. Your job is to propose a preprocessing plan.

## Dataset Profile
{json.dumps(profile, indent=2)}

## Instructions
Analyze every column and propose exactly one action per column that needs attention.
Follow these rules:
- If a column's unique_count equals the row count, it is an identifier — recommend dropping it.
- If missing_pct > 5% and dtype is numeric, recommend median imputation if skewness > 1, else mean.
- If missing_pct > 0% and dtype is categorical, recommend mode imputation.
- If skewness > 2, recommend log transform before scaling.
- If dtype is categorical with Low cardinality, recommend one-hot encoding.
- If dtype is categorical with Medium/High cardinality, recommend label encoding.
- If outliers > 10, recommend IQR winsorization.
- If duplicates > 0, always recommend deduplication as the first action.
- Any column with "id", "key", "number", "phone", "email" in its name is likely PII — flag it.
- Assign a confidence score (0–100) to every decision.
- Write your reason in plain English, referencing the actual statistics from the profile.

## Output Format
Respond ONLY with valid JSON. No explanation outside the JSON block.

{{
  "summary": "...",
  "predicted_health_score": <integer>,
  "actions": [
    {{
      "column": "<column_name>",
      "action": "<action_label>",
      "category": "<category>",
      "reason": "<plain English explanation referencing actual stats>",
      "confidence": <0-100>,
      "type": "<drop|impute|transform|encode|outlier|dedup|scale>"
    }}
  ],
  "ml_recommendations": [
    {{
      "model": "<model_name>",
      "type": "<model_type>",
      "suitability": <0-100>,
      "reason": "<explanation>",
      "pros": ["...", "..."]
    }}
  ]
}}
"""
```

### Valid `type` values and their meanings

| `type` | What the execution engine will run |
|---|---|
| `drop` | `df.drop(columns=[col])` |
| `impute` | Median or mean fill based on action label |
| `transform` | `np.log1p()` or other transform |
| `encode` | `pd.get_dummies()` or ordinal mapping |
| `outlier` | IQR winsorization (clip at 5th/95th pct) |
| `dedup` | `df.drop_duplicates()` |
| `scale` | `StandardScaler` or `MinMaxScaler` |

### Valid `category` values (for frontend filter tabs)

- `Identifier Removal`
- `PII Removal`
- `Missing Value Handling`
- `Feature Engineering`
- `Categorical Encoding`
- `Outlier Treatment`
- `Data Quality`
- `Feature Scaling`

---

### Response Parser

**File:** `ai/response_parser.py`

Gemma may occasionally return malformed JSON. Always validate:

```python
import json
from jsonschema import validate

PLAN_SCHEMA = {
    "type": "object",
    "required": ["summary", "predicted_health_score", "actions", "ml_recommendations"],
    "properties": {
        "summary": {"type": "string"},
        "predicted_health_score": {"type": "integer", "minimum": 0, "maximum": 100},
        "actions": {
            "type": "array",
            "items": {
                "required": ["column", "action", "category", "reason", "confidence", "type"],
                "properties": {
                    "column":     {"type": "string"},
                    "action":     {"type": "string"},
                    "category":   {"type": "string"},
                    "reason":     {"type": "string"},
                    "confidence": {"type": "integer", "minimum": 0, "maximum": 100},
                    "type":       {"type": "string", "enum": ["drop","impute","transform","encode","outlier","dedup","scale"]}
                }
            }
        }
    }
}

def parse_gemma_response(raw_text: str) -> dict:
    # Strip any markdown code fences Gemma might add
    text = raw_text.strip().removeprefix("```json").removesuffix("```").strip()
    try:
        parsed = json.loads(text)
        validate(instance=parsed, schema=PLAN_SCHEMA)
        return parsed
    except Exception as e:
        raise ValueError(f"Gemma returned invalid JSON: {e}\n\nRaw: {raw_text[:500]}")
```

---

## Layer 3 — Execution Engine

**File:** `engine/executor.py`  
**Owner:** M2 (Backend)

Receives the list of approved actions from the frontend and applies them **deterministically** in order.

### Critical Rules

1. **Always deduplicate first** — before any column operations
2. **Always impute before encoding** — can't encode nulls
3. **Always transform before scaling** — log transform changes distribution first
4. **Never execute AI-generated code** — only run your own pre-written handlers

### Executor Logic

```python
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler

# Action dispatch table — maps `type` to handler function
ACTION_HANDLERS = {
    "dedup":     handle_dedup,
    "drop":      handle_drop,
    "impute":    handle_impute,
    "transform": handle_transform,
    "encode":    handle_encode,
    "outlier":   handle_outlier,
    "scale":     handle_scale,
}

# Execution order — always run in this priority regardless of input order
EXECUTION_ORDER = ["dedup", "drop", "outlier", "impute", "transform", "encode", "scale"]

def execute_plan(df: pd.DataFrame, approved_actions: list[dict]) -> tuple[pd.DataFrame, list[dict]]:
    decision_log = []

    # Sort actions by execution order
    sorted_actions = sorted(
        approved_actions,
        key=lambda a: EXECUTION_ORDER.index(a["type"]) if a["type"] in EXECUTION_ORDER else 99
    )

    for action in sorted_actions:
        import time
        start = time.time()
        df = ACTION_HANDLERS[action["type"]](df, action)
        elapsed_ms = round((time.time() - start) * 1000, 1)

        decision_log.append({
            "action":   action["action"],
            "column":   action.get("column", "Dataset"),
            "reason":   action["reason"],
            "impact":   classify_impact(action["type"]),
            "time_ms":  elapsed_ms,
            "status":   "success"
        })

    return df, decision_log
```

### Handler Implementations

```python
def handle_dedup(df, action):
    return df.drop_duplicates().reset_index(drop=True)

def handle_drop(df, action):
    return df.drop(columns=[action["column"]], errors="ignore")

def handle_impute(df, action):
    col = action["column"]
    if "median" in action["action"].lower():
        df[col] = df[col].fillna(df[col].median())
    elif "mean" in action["action"].lower():
        df[col] = df[col].fillna(df[col].mean())
    elif "mode" in action["action"].lower():
        df[col] = df[col].fillna(df[col].mode()[0])
    return df

def handle_transform(df, action):
    col = action["column"]
    if "log" in action["action"].lower():
        df[col] = np.log1p(df[col].clip(lower=0))
    return df

def handle_encode(df, action):
    col = action["column"]
    if "one-hot" in action["action"].lower():
        return pd.get_dummies(df, columns=[col], drop_first=True, dtype=int)
    elif "ordinal" in action["action"].lower():
        # Ordinal mapping must be inferred from unique values sorted alphabetically
        # or from a pre-defined mapping stored in the action
        mapping = action.get("ordinal_mapping", {})
        if mapping:
            df[col] = df[col].map(mapping)
        else:
            unique_vals = sorted(df[col].dropna().unique())
            df[col] = df[col].map({v: i for i, v in enumerate(unique_vals)})
    return df

def handle_outlier(df, action):
    col = action["column"]
    q1, q3 = df[col].quantile(0.05), df[col].quantile(0.95)
    df[col] = df[col].clip(q1, q3)
    return df

def handle_scale(df, action):
    col = action["column"]
    scaler = StandardScaler()
    df[[col]] = scaler.fit_transform(df[[col]])
    return df
```

---

## Artifact Generation

**File:** `engine/artifact_generator.py`  
**Owner:** M2 (Backend)

### `preprocessing_pipeline.py`

Generate this as a Python string, not by executing AI code. Build it from the approved actions:

```python
def generate_pipeline_code(actions: list[dict], dataset_name: str) -> str:
    lines = [
        f"# ForgeAI — Generated Preprocessing Pipeline",
        f"# Dataset: {dataset_name}",
        f"# Generated: {datetime.now().strftime('%B %d, %Y')}",
        "",
        "import pandas as pd",
        "import numpy as np",
        "from sklearn.preprocessing import StandardScaler",
        "",
        "def preprocess(df: pd.DataFrame) -> pd.DataFrame:",
        "    df = df.copy()",
        "",
    ]

    for i, action in enumerate(actions, 1):
        lines.append(f"    # Step {i}: {action['action']} — {action['column']}")
        lines.append(f"    # Reason: {action['reason'][:80]}...")
        lines.append(f"    {generate_code_line(action)}")
        lines.append("")

    lines += [
        "    return df",
        "",
        'if __name__ == "__main__":',
        f'    raw = pd.read_csv("{dataset_name}.csv")',
        "    clean = preprocess(raw)",
        f'    clean.to_csv("{dataset_name}_clean.csv", index=False)',
        '    print(f"Saved: {len(clean)} rows × {len(clean.columns)} columns")',
    ]

    return "\n".join(lines)
```

### HTML Report

Build a self-contained HTML file with inline CSS. Include:
- Dataset name + timestamps
- Health score before/after
- Table of all decisions with reasons
- ML recommendations section
- Download links for CSV + pipeline

---

## Session / File Storage

**File:** `storage/session_store.py`  
**Owner:** M2 (Backend)

For the sprint, use **local disk** storage keyed by `dataset_id` (UUID). No database needed.

```python
import uuid, os, json
import pandas as pd

STORAGE_DIR = "./sessions"

def create_session() -> str:
    dataset_id = str(uuid.uuid4())[:8]
    os.makedirs(f"{STORAGE_DIR}/{dataset_id}", exist_ok=True)
    return dataset_id

def save_df(dataset_id: str, df: pd.DataFrame, name: str):
    df.to_csv(f"{STORAGE_DIR}/{dataset_id}/{name}.csv", index=False)

def load_df(dataset_id: str, name: str) -> pd.DataFrame:
    return pd.read_csv(f"{STORAGE_DIR}/{dataset_id}/{name}.csv")

def save_json(dataset_id: str, data: dict, name: str):
    with open(f"{STORAGE_DIR}/{dataset_id}/{name}.json", "w") as f:
        json.dump(data, f)

def load_json(dataset_id: str, name: str) -> dict:
    with open(f"{STORAGE_DIR}/{dataset_id}/{name}.json") as f:
        return json.load(f)
```

Files stored per session:
```
sessions/abc123/
├── raw.csv                # Original upload
├── profile.json           # Output of Layer 1
├── plan.json              # Output of Layer 2 (Gemma)
├── clean.csv              # Output of Layer 3
├── pipeline.py            # Generated artifact
└── report.html            # Generated artifact
```

---

## FastAPI App Setup

**File:** `main.py`

```python
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ForgeAI Backend", version="1.0.0")

# Allow the frontend at localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):
    ...

@app.get("/api/plan/{dataset_id}")
async def get_plan(dataset_id: str):
    ...

@app.post("/api/execute")
async def execute_plan(body: ExecuteRequest):
    ...

@app.get("/api/artifacts/{dataset_id}/{artifact}")
async def download_artifact(dataset_id: str, artifact: str):
    ...
```

---

## Requirements

```txt
# requirements.txt
fastapi>=0.111.0
uvicorn[standard]>=0.30.0
pandas>=2.2.0
numpy>=1.26.0
scikit-learn>=1.5.0
python-multipart>=0.0.9
jsonschema>=4.22.0
google-generativeai>=0.7.0    # Gemma 4 SDK
aiofiles>=23.2.1
```

---

## Integration Checklist

- [ ] **M2** — `profiler.py` computes all fields from `dataset_profile.md`
- [ ] **M2** — `health_score.py` computes score using formula above
- [ ] **M1** — Prompt template in `prompt_builder.py` finalized
- [ ] **M1** — Gemma 4 API key configured + tested on 5 sample datasets
- [ ] **M1** — `response_parser.py` validates JSON schema against `PLAN_SCHEMA`
- [ ] **M2** — All 7 action handlers implemented in `executor.py`
- [ ] **M2** — Execution order enforced (dedup → drop → outlier → impute → transform → encode → scale)
- [ ] **M2** — `generate_pipeline_code()` produces valid, runnable Python
- [ ] **M2** — HTML report template implemented
- [ ] **M2** — CORS middleware allows `http://localhost:3000`
- [ ] **M2** — All 4 endpoints tested with Postman / `/docs`
- [ ] **Both** — End-to-end test: Titanic CSV → upload → plan → execute → download
- [ ] **Both** — Test on: Iris, Heart Disease, Customer Churn, Adult Income, Wine Quality

---

## See Also

- [ai_pipeline.md](./ai_pipeline.md) — Full pipeline overview
- [dataset_profile.md](./dataset_profile.md) — Column-level profile field spec
- [forgeai_principles.md](./forgeai_principles.md) — Engineering principles
- [frontend-walkthrough.md](./frontend-walkthrough.md) — Frontend API contracts
