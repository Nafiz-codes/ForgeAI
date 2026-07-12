"""
ForgeAI Backend — Session / File Storage
Owner: Member 2 (Backend Engineer)

UUID-keyed directory storage. No database needed for the sprint.
Each session lives under:

  sessions/<dataset_id>/
    raw.csv          — original upload
    profile.json     — Layer 1 output
    plan.json        — Layer 2 output (Gemma)
    clean.csv        — Layer 3 output
    pipeline.py      — generated artifact
    report.html      — generated artifact
    results.json     — execution summary
"""

import json
import os
import uuid
from pathlib import Path

import pandas as pd

STORAGE_DIR = Path(__file__).parent / "sessions"


# ─────────────────────────────────────────────────────────────
# Session lifecycle
# ─────────────────────────────────────────────────────────────

def create_session(dataset_name: str = "dataset") -> str:
    """Create a new session directory and return the dataset_id."""
    dataset_id = str(uuid.uuid4())[:8]
    session_dir = STORAGE_DIR / dataset_id
    session_dir.mkdir(parents=True, exist_ok=True)
    # Store meta
    _write_meta(dataset_id, {"dataset_name": dataset_name, "dataset_id": dataset_id})
    return dataset_id


def session_exists(dataset_id: str) -> bool:
    return (STORAGE_DIR / dataset_id).is_dir()


def _session_dir(dataset_id: str) -> Path:
    d = STORAGE_DIR / dataset_id
    if not d.is_dir():
        raise FileNotFoundError(f"Session '{dataset_id}' not found")
    return d


# ─────────────────────────────────────────────────────────────
# CSV helpers
# ─────────────────────────────────────────────────────────────

def save_df(dataset_id: str, df: pd.DataFrame, name: str) -> None:
    path = _session_dir(dataset_id) / f"{name}.csv"
    df.to_csv(path, index=False)


def load_df(dataset_id: str, name: str) -> pd.DataFrame:
    path = _session_dir(dataset_id) / f"{name}.csv"
    if not path.exists():
        raise FileNotFoundError(f"CSV '{name}' not found in session '{dataset_id}'")
    return pd.read_csv(path)


def get_csv_path(dataset_id: str, name: str) -> Path:
    path = _session_dir(dataset_id) / f"{name}.csv"
    if not path.exists():
        raise FileNotFoundError(f"CSV '{name}' not found in session '{dataset_id}'")
    return path


# ─────────────────────────────────────────────────────────────
# JSON helpers
# ─────────────────────────────────────────────────────────────

def save_json(dataset_id: str, data: dict, name: str) -> None:
    path = _session_dir(dataset_id) / f"{name}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)


def load_json(dataset_id: str, name: str) -> dict:
    path = _session_dir(dataset_id) / f"{name}.json"
    if not path.exists():
        raise FileNotFoundError(f"JSON '{name}' not found in session '{dataset_id}'")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# ─────────────────────────────────────────────────────────────
# Text / binary file helpers
# ─────────────────────────────────────────────────────────────

def save_text(dataset_id: str, text: str, filename: str) -> None:
    path = _session_dir(dataset_id) / filename
    path.write_text(text, encoding="utf-8")


def load_text(dataset_id: str, filename: str) -> str:
    path = _session_dir(dataset_id) / filename
    if not path.exists():
        raise FileNotFoundError(f"File '{filename}' not found in session '{dataset_id}'")
    return path.read_text(encoding="utf-8")


def get_file_path(dataset_id: str, filename: str) -> Path:
    path = _session_dir(dataset_id) / filename
    if not path.exists():
        raise FileNotFoundError(f"File '{filename}' not found in session '{dataset_id}'")
    return path


# ─────────────────────────────────────────────────────────────
# Meta helpers (dataset name etc.)
# ─────────────────────────────────────────────────────────────

def _write_meta(dataset_id: str, meta: dict) -> None:
    save_json(dataset_id, meta, "meta")


def load_meta(dataset_id: str) -> dict:
    try:
        return load_json(dataset_id, "meta")
    except FileNotFoundError:
        return {"dataset_name": "dataset", "dataset_id": dataset_id}
