from pathlib import Path
import shutil

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

from pipeline import ForgePipeline
from config import OUTPUTS_DIR

app = FastAPI(
    title="ForgeAI API",
    version="1.0.0"
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@app.get("/")
def home():
    return {
        "message": "ForgeAI Backend Running 🚀"
    }


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):

    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported."
        )

    file_path = UPLOAD_DIR / file.filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    pipeline = ForgePipeline()

    return pipeline.run(file_path)


@app.get("/download/dataset")
def download_dataset():

    dataset = OUTPUTS_DIR / "cleaned_dataset.csv"

    if not dataset.exists():
        raise HTTPException(
            status_code=404,
            detail="Dataset not found."
        )

    return FileResponse(
        path=dataset,
        filename="cleaned_dataset.csv",
        media_type="text/csv"
    )


@app.get("/download/report")
def download_report():

    report = OUTPUTS_DIR / "preprocessing_report.json"

    if not report.exists():
        raise HTTPException(
            status_code=404,
            detail="Report not found."
        )

    return FileResponse(
        path=report,
        filename="preprocessing_report.json",
        media_type="application/json"
    )