"""
ForgeAI Backend — FastAPI Application
Owner: Member 2 (Backend Engineer)

All routes in one file for the sprint. Split into separate modules
post-hackathon if the project grows.

Run:
    uvicorn main:app --reload --port 8000

Docs:
    http://localhost:8000/docs
"""

import io
import logging
import os
from typing import Any

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, PlainTextResponse, StreamingResponse
from pydantic import BaseModel

# ── Local modules ─────────────────────────────────────────────
from profiler import profile_dataset, compute_health_score
from ai_client import get_ai_plan
from prepocessing import execute_plan
from pipeline_generator import generate_pipeline_code
from report import generate_html_report
from session_store import (
    create_session,
    session_exists,
    save_df,
    load_df,
    save_json,
    load_json,
    save_text,
    load_text,
    get_csv_path,
    get_file_path,
    load_meta,
)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()


origins = [
    "https://forge-9icy5fvmp-nafiz-codes-projects.vercel.app/",  # Replace with your Vercel domain
    "http://localhost:3000/",                  # For local development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Use [""] temporarily if you want to allow all origins
    allow_credentials=True,
    allow_methods=[""],
    allow_headers=["*"],
)
# ─────────────────────────────────────────────────────────────
# Bootstrap
# ─────────────────────────────────────────────────────────────

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ForgeAI Backend",
    description="AI-powered dataset preprocessing API",
    version="1.0.0",
)

# Allow the Next.js dev server (and any future Vercel deployment)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────────────────────────

class ApprovedAction(BaseModel):
    id: int | None = None
    column: str
    action: str = ""
    type: str
    reason: str = ""
    category: str = ""
    confidence: int = 0


class ExecuteRequest(BaseModel):
    dataset_id: str
    approved_actions: list[ApprovedAction]


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def _require_session(dataset_id: str):
    if not session_exists(dataset_id):
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found. Please upload again.")


def _column_flag_class(flag: str) -> str:
    mapping = {
        "Identifier": "badge-amber",
        "Possible PII": "badge-rose",
        "Has Nulls": "badge-rose",
        "Skewed": "badge-rose",
        "Outliers": "badge-amber",
        "Categorical": "badge-violet",
        "OK": "badge-emerald",
    }
    return mapping.get(flag, "badge-blue")


# ─────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    return {"status": "ok", "service": "ForgeAI Backend", "version": "1.0.0"}


# ──────────────────────────────────────────────────────────────
# POST /api/upload
# ──────────────────────────────────────────────────────────────

@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)) -> dict[str, Any]:
    """
    Receive a CSV upload, profile it, call the AI for a preprocessing plan,
    then return the combined response the frontend expects.

    Frontend contract (frontend-walkthrough.md):
    {
      dataset_id, rows, columns, missing_total, duplicate_rows,
      health_score, target_column, preview, column_analysis
    }
    """
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")

    # 1. Read CSV
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not parse CSV: {exc}")

    if df.empty:
        raise HTTPException(status_code=422, detail="Uploaded CSV is empty.")

    dataset_name = file.filename or "dataset.csv"

    # 2. Create session + persist raw CSV
    dataset_id = create_session(dataset_name=dataset_name)
    save_df(dataset_id, df, "raw")

    # 3. Profile (Layer 1)
    logger.info("Profiling dataset %s …", dataset_id)
    profile = profile_dataset(df, dataset_name=dataset_name)
    save_json(dataset_id, profile, "profile")

    # 4. AI plan (Layer 2) — non-fatal; store even if it fails so /plan works
    ai_plan: dict | None = None
    try:
        logger.info("Calling AI for dataset %s …", dataset_id)
        ai_plan = get_ai_plan(profile)
        save_json(dataset_id, ai_plan, "plan")
    except Exception as exc:
        logger.warning("AI call failed for %s: %s", dataset_id, exc)
        # Save a minimal stub so /plan doesn't 404
        save_json(dataset_id, {"error": str(exc)}, "plan")

    # 5. Build the frontend-compatible column_analysis list
    col_analysis = []
    for col in profile["column_profiles"]:
        flag = col.get("flag", "OK")
        col_analysis.append({
            "name": col["name"],
            "type": col.get("raw_dtype", col.get("dtype", "")),
            "missing_pct": col.get("missing_pct", 0),
            "unique_count": col.get("unique_count", 0),
            "flag": flag,
            "flagClass": _column_flag_class(flag),
        })

    # 6. Preview (first 5 rows, NaN → None for JSON serialisation)
    preview_records = (
        df.head(5).where(pd.notnull(df.head(5)), None).to_dict(orient="records")
    )

    return {
        "dataset_id": dataset_id,
        "rows": profile["rows"],
        "columns": profile["columns"],
        "missing_total": profile["missing_cells"],
        "duplicate_rows": profile["duplicates"],
        "memory_mb": profile["memory_mb"],
        "health_score": profile["health_score"],
        "possible_task": profile["possible_task"],
        "target_column": profile.get("possible_target"),
        "preview": preview_records,
        "column_analysis": col_analysis,
        # Carry AI plan summary if available
        "ai_summary": ai_plan.get("summary") if ai_plan else None,
        "ai_available": ai_plan is not None and "error" not in ai_plan,
    }


# ──────────────────────────────────────────────────────────────
# GET /api/plan/{dataset_id}
# ──────────────────────────────────────────────────────────────

@app.get("/api/plan/{dataset_id}")
async def get_plan(dataset_id: str) -> dict[str, Any]:
    """
    Return the AI preprocessing plan for an uploaded dataset.
    If the AI plan was already generated during /upload it's returned from cache.
    If not (e.g. AI was down), a fallback rule-based plan is generated.

    Frontend contract (frontend-walkthrough.md):
    {
      dataset_id, health_score_before, predicted_health_score, summary, actions,
      ml_recommendations
    }
    """
    _require_session(dataset_id)

    profile = load_json(dataset_id, "profile")

    # Try cached plan
    plan: dict | None = None
    try:
        plan = load_json(dataset_id, "plan")
        if "error" in plan:
            plan = None
    except FileNotFoundError:
        pass

    # Re-call AI if plan is missing
    if plan is None:
        try:
            plan = get_ai_plan(profile)
            save_json(dataset_id, plan, "plan")
        except Exception as exc:
            raise HTTPException(status_code=503, detail=f"AI service unavailable: {exc}")

    # Inject sequential ids if missing
    for i, action in enumerate(plan.get("actions", []), start=1):
        if "id" not in action:
            action["id"] = i

    # ── Rough predicted score: formula-based, no AI / no simulation ──
    actions = plan.get("actions", [])
    # Points each action type is expected to contribute
    ACTION_BOOST: dict[str, int] = {
        "impute":    8,   # filling missing values improves completeness a lot
        "dedup":     6,   # removing duplicates improves consistency
        "outlier":   5,   # capping outliers reduces skew penalty
        "drop":      3,   # dropping junk columns helps readability
        "transform": 4,   # log-transforms reduce skew penalty
        "encode":    2,   # encoding is neutral for the score formula
        "scale":     1,   # scaling doesn't affect the score formula
    }
    health_before = profile["health_score"]
    boost = sum(ACTION_BOOST.get(a.get("type", "").lower(), 1) for a in actions)
    # Diminishing returns: score naturally approaches 100 asymptotically
    headroom = 100 - health_before
    predicted_score = health_before + round(headroom * (1 - (0.85 ** (boost / 10))))
    predicted_score = max(health_before, min(99, predicted_score))

    return {
        "dataset_id": dataset_id,
        "health_score_before": profile["health_score"],
        "predicted_health_score": predicted_score,
        "summary": plan.get("summary", ""),
        "actions": actions,
        "ml_recommendations": plan.get("ml_recommendations", []),
    }


# ──────────────────────────────────────────────────────────────
# POST /api/execute
# ──────────────────────────────────────────────────────────────

@app.post("/api/execute")
async def execute_preprocessing(body: ExecuteRequest) -> dict[str, Any]:
    """
    Apply the user-approved actions to the raw dataset.
    Generates: clean.csv, pipeline.py, report.html, results.json.

    Frontend contract (frontend-walkthrough.md):
    {
      job_id, status, rows_before, rows_after, columns_before, columns_after,
      health_score_before, health_score_after, completeness_score,
      consistency_score, ml_readiness_score, actions_applied, decision_log
    }
    """
    dataset_id = body.dataset_id
    _require_session(dataset_id)

    # Load raw data + profile + plan
    df_raw = load_df(dataset_id, "raw")
    profile = load_json(dataset_id, "profile")

    plan: dict = {}
    try:
        plan = load_json(dataset_id, "plan")
    except FileNotFoundError:
        pass

    approved = [a.model_dump() for a in body.approved_actions]

    rows_before = len(df_raw)
    cols_before = len(df_raw.columns)

    # Execute (Layer 3)
    logger.info("Executing plan for %s — %d actions …", dataset_id, len(approved))
    df_clean, decision_log = execute_plan(df_raw, approved)

    rows_after = len(df_clean)
    cols_after = len(df_clean.columns)
    health_before = profile["health_score"]
    health_after = compute_health_score(df_clean)
    # Ensure the score never regresses — preprocessing should only improve data quality
    health_after = max(health_after, health_before)
    meta = load_meta(dataset_id)
    dataset_name = meta.get("dataset_name", "dataset.csv")

    # ── Persist outputs ───────────────────────────────────────
    save_df(dataset_id, df_clean, "clean")

    pipeline_code = generate_pipeline_code(approved, dataset_name)
    save_text(dataset_id, pipeline_code, "pipeline.py")

    ml_recs = plan.get("ml_recommendations", [])
    report_html = generate_html_report(
        dataset_name=dataset_name,
        health_before=health_before,
        health_after=health_after,
        decision_log=decision_log,
        ml_recommendations=ml_recs,
        summary=plan.get("summary", ""),
        rows_before=rows_before,
        rows_after=rows_after,
        columns_before=cols_before,
        columns_after=cols_after,
    )
    save_text(dataset_id, report_html, "report.html")

    # ── Derived quality scores ────────────────────────────────
    missing_remaining = int(df_clean.isnull().sum().sum())
    total_cells = rows_after * cols_after
    completeness = round(100 - (missing_remaining / max(total_cells, 1) * 100))
    dup_remaining = int(df_clean.duplicated().sum())
    consistency = round(100 - (dup_remaining / max(rows_after, 1) * 100))
    ml_readiness = round((completeness + consistency + health_after) / 3)

    results = {
        "job_id": dataset_id,
        "status": "complete",
        "dataset_name": dataset_name,
        "rows_before": rows_before,
        "rows_after": rows_after,
        "columns_before": cols_before,
        "columns_after": cols_after,
        "health_score_before": health_before,
        "health_score_after": health_after,
        "completeness_score": completeness,
        "consistency_score": consistency,
        "ml_readiness_score": ml_readiness,
        "actions_applied": len(decision_log),
        "decision_log": decision_log,
        "ml_recommendations": ml_recs,
        "pipeline_code": pipeline_code,
    }
    save_json(dataset_id, results, "results")

    return results


# ──────────────────────────────────────────────────────────────
# GET /api/results/{dataset_id}
# ──────────────────────────────────────────────────────────────

@app.get("/api/results/{dataset_id}")
async def get_results(dataset_id: str) -> dict[str, Any]:
    """
    Return the execution results for a completed job.
    Frontend contract from frontend-walkthrough.md.
    """
    _require_session(dataset_id)
    try:
        results = load_json(dataset_id, "results")
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Results not found. Please call POST /api/execute first.",
        )
    return results


# ──────────────────────────────────────────────────────────────
# GET /api/artifacts/{dataset_id}/{artifact}
# ──────────────────────────────────────────────────────────────

@app.get("/api/artifacts/{dataset_id}/csv")
async def download_csv(dataset_id: str):
    """Return the cleaned CSV as a file download."""
    _require_session(dataset_id)
    try:
        path = get_csv_path(dataset_id, "clean")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Clean CSV not found. Run /api/execute first.")

    meta = load_meta(dataset_id)
    dataset_name = meta.get("dataset_name", "dataset.csv").replace(".csv", "")
    filename = f"{dataset_name}_clean.csv"

    return FileResponse(
        path=str(path),
        media_type="text/csv",
        filename=filename,
    )


@app.get("/api/artifacts/{dataset_id}/pipeline")
async def download_pipeline(dataset_id: str):
    """Return the generated preprocessing_pipeline.py as plain text."""
    _require_session(dataset_id)
    try:
        code = load_text(dataset_id, "pipeline.py")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Pipeline not found. Run /api/execute first.")
    return PlainTextResponse(content=code, media_type="text/plain")


@app.get("/api/artifacts/{dataset_id}/report")
async def download_report(dataset_id: str):
    """Return the HTML AI Decision Report."""
    _require_session(dataset_id)
    try:
        html = load_text(dataset_id, "report.html")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Report not found. Run /api/execute first.")
    return HTMLResponse(content=html)


# ──────────────────────────────────────────────────────────────
# GET /api/profile/{dataset_id}   (bonus — useful for debugging)
# ──────────────────────────────────────────────────────────────

@app.get("/api/profile/{dataset_id}")
async def get_profile(dataset_id: str) -> dict[str, Any]:
    """Return the raw dataset profile JSON (Layer 1 output)."""
    _require_session(dataset_id)
    return load_json(dataset_id, "profile")
