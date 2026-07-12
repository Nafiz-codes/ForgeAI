"""
ForgeAI Backend — Dataset Profiler (Layer 1)
Owner: Member 2 (Backend Engineer)

Pure Pandas / NumPy. No AI. No preprocessing. Facts only.
Implements the full spec from docs/backend-walkthrough.md.
"""

import pandas as pd
import numpy as np


# ─────────────────────────────────────────────────────────────
# Dtype helpers
# ─────────────────────────────────────────────────────────────

def classify_dtype(series: pd.Series) -> str:
    """Return a simplified dtype label for the AI prompt."""
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "date"
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    return "categorical"


def count_iqr_outliers(series: pd.Series) -> int:
    """Count values outside [Q1 - 1.5×IQR, Q3 + 1.5×IQR]."""
    clean = series.dropna()
    if len(clean) == 0:
        return 0
    q1, q3 = clean.quantile(0.25), clean.quantile(0.75)
    iqr = q3 - q1
    mask = (clean < q1 - 1.5 * iqr) | (clean > q3 + 1.5 * iqr)
    return int(mask.sum())


def classify_cardinality(n: int) -> str:
    if n <= 10:
        return "Low"
    if n <= 50:
        return "Medium"
    return "High"


# ─────────────────────────────────────────────────────────────
# Task / target inference
# ─────────────────────────────────────────────────────────────

TARGET_NAMES = {"target", "label", "y", "survived", "churn", "class", "outcome",
                "default", "fraud", "diagnosis", "response", "price", "salary"}


def infer_task(df: pd.DataFrame) -> str:
    """Heuristic: binary int col → classification, continuous float → regression."""
    for col in df.columns:
        s = df[col]
        if pd.api.types.is_integer_dtype(s) and s.nunique() == 2:
            return "classification"
    for col in df.columns:
        s = df[col]
        if pd.api.types.is_float_dtype(s) and s.nunique() > 10:
            return "regression"
    return "unknown"


def infer_target(df: pd.DataFrame) -> str | None:
    """Look for a well-known target column by name."""
    for col in df.columns:
        if col.strip().lower() in TARGET_NAMES:
            return col
    return None


# ─────────────────────────────────────────────────────────────
# Health Score
# ─────────────────────────────────────────────────────────────

def count_total_outlier_pct(df: pd.DataFrame) -> float:
    """Return average outlier % across numeric columns."""
    numeric = df.select_dtypes(include="number")
    if numeric.empty:
        return 0.0
    pcts = []
    for col in numeric.columns:
        n_out = count_iqr_outliers(numeric[col])
        pcts.append(n_out / max(len(numeric[col].dropna()), 1) * 100)
    return float(np.mean(pcts)) if pcts else 0.0


def compute_health_score(df: pd.DataFrame) -> int:
    """
    Health score formula from backend-walkthrough.md.
    100 baseline, deductions for: missing, duplicates, skew, outliers.
    """
    score = 100.0

    missing_pct = df.isnull().mean().mean() * 100
    score -= min(40, missing_pct * 2)          # up to -40 for missing

    dup_pct = df.duplicated().mean() * 100
    score -= min(20, dup_pct * 5)              # up to -20 for duplicates

    numeric_cols = df.select_dtypes(include="number")
    skewed = (numeric_cols.skew().abs() > 2).sum()
    score -= min(20, int(skewed) * 5)          # up to -20 for skewed features

    outlier_pct = count_total_outlier_pct(df)
    score -= min(20, outlier_pct * 2)          # up to -20 for outliers

    return max(0, round(score))


# ─────────────────────────────────────────────────────────────
# Main profiler
# ─────────────────────────────────────────────────────────────

def profile_dataset(df: pd.DataFrame, dataset_name: str = "dataset") -> dict:
    """
    Profile a DataFrame and return a rich, AI-ready JSON-serialisable summary.

    Layers:
      - Dataset-level stats
      - Per-column profiles (numeric + categorical paths)
      - Health score
      - Task/target inference
    """
    rows, columns = df.shape
    duplicates = int(df.duplicated().sum())
    missing_cells = int(df.isnull().sum().sum())
    memory_mb = round(df.memory_usage(deep=True).sum() / 1e6, 2)

    health_score = compute_health_score(df)
    possible_task = infer_task(df)
    possible_target = infer_target(df)

    column_profiles = []
    for col in df.columns:
        series = df[col]
        dtype_label = classify_dtype(series)

        col_profile: dict = {
            "name": col,
            "dtype": dtype_label,
            "raw_dtype": str(series.dtype),
            "missing_count": int(series.isnull().sum()),
            "missing_pct": round(float(series.isnull().mean() * 100), 2),
            "unique_count": int(series.nunique()),
            "possible_identifier": bool(series.nunique() == len(df)),
        }

        if dtype_label == "numeric":
            clean = series.dropna()
            col_profile.update({
                "mean":     round(float(clean.mean()), 4)   if len(clean) else None,
                "median":   round(float(clean.median()), 4) if len(clean) else None,
                "std":      round(float(clean.std()), 4)    if len(clean) else None,
                "min":      round(float(clean.min()), 4)    if len(clean) else None,
                "max":      round(float(clean.max()), 4)    if len(clean) else None,
                "skewness": round(float(clean.skew()), 4)   if len(clean) else None,
                "outlier_count": count_iqr_outliers(series),
            })

        elif dtype_label == "categorical":
            mode_val = series.mode()
            col_profile.update({
                "cardinality": classify_cardinality(series.nunique()),
                "most_common": str(mode_val.iloc[0]) if not mode_val.empty else None,
                "top_values": series.value_counts(dropna=True).head(5).index.tolist(),
            })

        # Derive a frontend-friendly flag
        col_profile["flag"] = _derive_flag(col_profile, col)

        column_profiles.append(col_profile)

    return {
        "dataset_name": dataset_name,
        "rows": int(rows),
        "columns": int(columns),
        "duplicates": duplicates,
        "missing_cells": missing_cells,
        "memory_mb": memory_mb,
        "health_score": health_score,
        "possible_task": possible_task,
        "possible_target": possible_target,
        "column_profiles": column_profiles,
    }


def _derive_flag(col_profile: dict, col_name: str) -> str:
    """Human-readable flag for the frontend column analysis table."""
    name_lower = col_name.lower()
    pii_keywords = {"id", "phone", "email", "number", "ssn", "passport", "key"}

    if col_profile.get("possible_identifier"):
        return "Identifier"
    if any(k in name_lower for k in pii_keywords):
        return "Possible PII"
    if col_profile.get("missing_pct", 0) > 5:
        return "Has Nulls"
    if col_profile.get("skewness") and abs(col_profile["skewness"]) > 2:
        return "Skewed"
    if col_profile.get("outlier_count", 0) > 10:
        return "Outliers"
    if col_profile.get("dtype") == "categorical":
        return "Categorical"
    return "OK"


# ─────────────────────────────────────────────────────────────
# Quick smoke test
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) < 2:
        print("Usage: python profiler.py <path_to_csv>")
        sys.exit(1)

    _df = pd.read_csv(sys.argv[1])
    _result = profile_dataset(_df, dataset_name=sys.argv[1])
    print(json.dumps(_result, indent=2, default=str))
