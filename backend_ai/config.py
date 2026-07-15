from pathlib import Path

# ==========================================================
# Project Directories
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent

DATASETS_DIR = BASE_DIR / "datasets"
OUTPUTS_DIR = BASE_DIR / "outputs"
PROFILER_DIR = BASE_DIR / "profiler"
AI_DIR = BASE_DIR / "ai"
PROMPTS_DIR = AI_DIR / "prompts"

PROFILE_FILE = DATASETS_DIR / "profile.json"
DATASET_FILE = DATASETS_DIR / "titanic.csv"

# ==========================================================
# AI Configuration
# ==========================================================

MODEL_PROVIDER = "gemma"

MODEL_NAME = "gemma-4-26b-a4b-it"

TEMPERATURE = 0

MAX_RETRIES = 3

REQUEST_TIMEOUT = 60

# ==========================================================
# Common Files
# ==========================================================

PROFILE_FILE = DATASETS_DIR / "profile.json"

CLEAN_DATASET_FILE = OUTPUTS_DIR / "cleaned_dataset.csv"

REPORT_FILE = OUTPUTS_DIR / "forgeai_report.json"