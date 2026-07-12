"""
ForgeAI Backend — FastAPI App
Owner: Member 2 (Backend Engineer)

Minimal server to host the dataset profiler locally so the
Next.js frontend (localhost:3000) can call it.

Run locally:
    pip install fastapi uvicorn python-multipart pandas
    uvicorn main:app --reload --port 8000

Then open:
    http://localhost:8000/docs   (interactive Swagger UI)
"""

import uuid

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from profiler import profile_dataset

app = FastAPI(title="ForgeAI Backend")

# Allow the Next.js dev server to call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for now — swap for a real DB/cache later.
DATASETS: dict = {}


@app.get("/")
def health_check():
    return {"status": "ok", "service": "ForgeAI backend"}


@app.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    profile = profile_dataset(file.file)

    dataset_id = str(uuid.uuid4())[:8]
    DATASETS[dataset_id] = profile  # cache for later steps (plan/execute/results)

    return {
        "dataset_id": dataset_id,
        "rows": profile["rows"],
        "columns": profile["columns"],
        "missing_total": profile["missing_total"],
        "duplicate_rows": profile["duplicate_rows"],
        "column_analysis": profile["column_analysis"],
        # placeholders until M1 (AI) wires in Gemma:
        "health_score": None,
        "target_column": None,
    }
