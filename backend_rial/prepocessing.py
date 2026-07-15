"""
ForgeAI Backend — Execution Engine (Layer 3)
Owner: Member 2 (Backend Engineer)

Applies the user-approved preprocessing plan to the raw DataFrame.
Deterministic only — no AI code executed.

Execution order (always enforced regardless of input order):
  dedup → drop → outlier → impute → transform → encode → scale
"""

import time
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler


# ─────────────────────────────────────────────────────────────
# Impact classification
# ─────────────────────────────────────────────────────────────

IMPACT_MAP = {
    "dedup":     "High",
    "drop":      "High",
    "impute":    "High",
    "outlier":   "Medium",
    "transform": "High",
    "encode":    "Medium",
    "scale":     "Low",
}

EXECUTION_ORDER = ["dedup", "drop", "outlier", "impute", "transform", "encode", "scale"]


# ─────────────────────────────────────────────────────────────
# Individual action handlers
# ─────────────────────────────────────────────────────────────

def handle_dedup(df: pd.DataFrame, action: dict) -> pd.DataFrame:
    return df.drop_duplicates().reset_index(drop=True)


def handle_drop(df: pd.DataFrame, action: dict) -> pd.DataFrame:
    col = action.get("column", "")
    if col and col in df.columns:
        return df.drop(columns=[col], errors="ignore")
    return df


def handle_impute(df: pd.DataFrame, action: dict) -> pd.DataFrame:
    col = action.get("column", "")
    if not col or col not in df.columns:
        return df
    action_label = action.get("action", "").lower()
    if "median" in action_label:
        df = df.copy()
        df[col] = df[col].fillna(df[col].median())
    elif "mean" in action_label:
        df = df.copy()
        df[col] = df[col].fillna(df[col].mean())
    elif "mode" in action_label:
        df = df.copy()
        mode_val = df[col].mode()
        if not mode_val.empty:
            df[col] = df[col].fillna(mode_val.iloc[0])
    else:
        # Default: try median for numeric, mode for categorical
        df = df.copy()
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(df[col].median())
        else:
            mode_val = df[col].mode()
            if not mode_val.empty:
                df[col] = df[col].fillna(mode_val.iloc[0])
    return df


def handle_transform(df: pd.DataFrame, action: dict) -> pd.DataFrame:
    col = action.get("column", "")
    if not col or col not in df.columns:
        return df
    action_label = action.get("action", "").lower()
    df = df.copy()
    if "log" in action_label:
        df[col] = np.log1p(df[col].clip(lower=0))
    return df


def handle_encode(df: pd.DataFrame, action: dict) -> pd.DataFrame:
    col = action.get("column", "")
    if not col or col not in df.columns:
        return df
    action_label = action.get("action", "").lower()
    if "one-hot" in action_label or "onehot" in action_label or "get_dummies" in action_label:
        return pd.get_dummies(df, columns=[col], drop_first=True, dtype=int)
    elif "ordinal" in action_label or "label" in action_label:
        mapping = action.get("ordinal_mapping", {})
        df = df.copy()
        if mapping:
            df[col] = df[col].map(mapping)
        else:
            unique_vals = sorted(df[col].dropna().unique().tolist(), key=str)
            df[col] = df[col].map({v: i for i, v in enumerate(unique_vals)})
    return df


def handle_outlier(df: pd.DataFrame, action: dict) -> pd.DataFrame:
    col = action.get("column", "")
    if not col or col not in df.columns:
        return df
    if not pd.api.types.is_numeric_dtype(df[col]):
        return df
    df = df.copy()
    q1 = df[col].quantile(0.05)
    q3 = df[col].quantile(0.95)
    df[col] = df[col].clip(q1, q3)
    return df


def handle_scale(df: pd.DataFrame, action: dict) -> pd.DataFrame:
    col = action.get("column", "")
    if not col or col not in df.columns:
        return df
    if not pd.api.types.is_numeric_dtype(df[col]):
        return df
    df = df.copy()
    scaler = StandardScaler()
    df[[col]] = scaler.fit_transform(df[[col]])
    return df


ACTION_HANDLERS = {
    "dedup":     handle_dedup,
    "drop":      handle_drop,
    "impute":    handle_impute,
    "transform": handle_transform,
    "encode":    handle_encode,
    "outlier":   handle_outlier,
    "scale":     handle_scale,
}


# ─────────────────────────────────────────────────────────────
# Main executor
# ─────────────────────────────────────────────────────────────

def execute_plan(
    df: pd.DataFrame,
    approved_actions: list[dict],
) -> tuple[pd.DataFrame, list[dict]]:
    """
    Apply the approved actions to df in the canonical execution order.

    Returns:
        (cleaned_df, decision_log)
    """
    decision_log: list[dict] = []

    # Sort by canonical execution order
    def sort_key(a: dict) -> int:
        t = a.get("type", "").lower()
        try:
            return EXECUTION_ORDER.index(t)
        except ValueError:
            return 99

    sorted_actions = sorted(approved_actions, key=sort_key)

    for action in sorted_actions:
        action_type = action.get("type", "").lower()
        handler = ACTION_HANDLERS.get(action_type)
        if handler is None:
            continue

        t0 = time.perf_counter()
        try:
            df = handler(df, action)
            elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
            status = "success"
        except Exception as exc:
            elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
            status = f"error: {exc}"

        decision_log.append({
            "action":  action.get("action", action_type),
            "column":  action.get("column", "Dataset"),
            "reason":  action.get("reason", ""),
            "impact":  IMPACT_MAP.get(action_type, "Medium"),
            "time_ms": elapsed_ms,
            "status":  status,
        })

    return df, decision_log
