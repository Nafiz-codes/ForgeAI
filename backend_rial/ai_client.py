"""
ForgeAI Backend — AI Client (Layer 2)
Owner: Member 2 (Backend Engineer)

Responsibilities:
  - Translate the backend profiler's schema into a prompt for Gemma
  - Call the AI Engineer's model via AIClient._send_prompt()
  - Parse and validate the raw JSON response
  - Return a clean preprocessing plan dict to main.py

NOTE on schema separation:
  The AI Engineer's PromptBuilder (backend_ai/ai/prompt_builder.py) uses a
  different profile schema (profile["dataset"] / profile["columns"]) and
  instructs Gemma to return a different JSON schema ("preprocessing_steps",
  "dataset_health_score") than what the frontend contract requires.

  To avoid brittle cross-module coupling we own the prompt logic here and
  instruct Gemma to return EXACTLY the schema that parse_and_validate() and
  the frontend expect.  The AI Engineer's AIClient is used only for its
  model connection (_send_prompt), which is stable.
"""

import json
import re
import logging
import sys
from pathlib import Path

# ── Make the AI Engineer's module importable ──────────────────
# Add backend_ai to sys.path so we can import from backend_ai/ai/
_BACKEND_AI_DIR = Path(__file__).resolve().parent.parent / "backend_ai"
if str(_BACKEND_AI_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_AI_DIR))

from ai.client import AIClient

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# Prompt builder (Backend Engineer owns this)
# Uses OUR profiler schema and requests OUR action schema.
# ─────────────────────────────────────────────────────────────

def _build_prompt(profile: dict) -> str:
    """
    Convert a profiler.py profile dict into a Gemma prompt.
    Instructs Gemma to return the EXACT JSON the frontend expects.
    """
    rows        = profile.get("rows", 0)
    columns     = profile.get("columns", 0)
    duplicates  = profile.get("duplicates", 0)
    missing     = profile.get("missing_cells", 0)
    health      = profile.get("health_score", 0)
    task        = profile.get("possible_task", "unknown")
    target      = profile.get("possible_target", "unknown")

    # Build column summary lines
    col_lines: list[str] = []
    for col in profile.get("column_profiles", []):
        name         = col["name"]
        dtype        = col.get("dtype", "unknown")
        missing_pct  = col.get("missing_pct", 0)
        unique       = col.get("unique_count", 0)
        is_id        = col.get("possible_identifier", False)
        flag         = col.get("flag", "OK")

        line = (
            f"  - {name} | dtype={dtype} | missing={missing_pct}% "
            f"| unique={unique} | identifier={is_id} | flag={flag}"
        )

        # Append numeric stats when available
        if "mean" in col:
            line += (
                f" | mean={col['mean']} median={col['median']} "
                f"std={col['std']} skew={col.get('skewness',0)} "
                f"outliers={col.get('outlier_count',0)}"
            )
        # Append categorical stats when available
        if "cardinality" in col:
            line += f" | cardinality={col['cardinality']}"
        if "top_values" in col:
            top = col["top_values"][:3]
            line += f" | top_values={top}"

        col_lines.append(line)

    col_block = "\n".join(col_lines)

    return f"""
You are ForgeAI — an expert AI Data Engineer and Machine Learning Engineer.

Analyze the dataset profile below and recommend the best preprocessing pipeline.

RULES:
- Only recommend actions that are clearly justified by the data.
- Never invent columns, statistics, or facts not shown below.
- Return ONLY valid JSON.  No markdown. No explanations outside the JSON.
- Every action MUST have a reason and a confidence score (0-100).

=====================================
DATASET PROFILE
=====================================
Name:          {profile.get("dataset_name", "dataset")}
Rows:          {rows}
Columns:       {columns}
Duplicates:    {duplicates}
Missing cells: {missing}
Health score:  {health}/100
Possible task: {task}
Target column: {target}

COLUMN DETAILS:
{col_block}

=====================================
OUTPUT FORMAT
=====================================
Return EXACTLY this JSON structure and nothing else:

{{
  "summary": "<2-4 sentence plain-English summary of the dataset state and recommended pipeline>",
  "predicted_health_score": <integer 0-100 estimating health after preprocessing>,
  "actions": [
    {{
      "column":     "<column name, or 'Dataset' for row-level ops>",
      "action":     "<short description, e.g. 'Drop column', 'Median imputation', 'One-hot encoding'>",
      "type":       "<one of: drop | impute | transform | encode | outlier | dedup | scale>",
      "category":   "<one of: Identifier Removal | PII Removal | Missing Value Handling | Feature Engineering | Categorical Encoding | Outlier Treatment | Data Quality | Feature Scaling>",
      "reason":     "<clear, data-driven justification>",
      "confidence": <integer 0-100>
    }}
  ],
  "ml_recommendations": [
    {{
      "model":       "<model name, e.g. Random Forest, XGBoost, Logistic Regression>",
      "type":        "<classification | regression | clustering>",
      "suitability": <integer 0-100>,
      "reason":      "<why this model fits the preprocessed dataset>",
      "pros":        ["<strength 1>", "<strength 2>"]
    }}
  ]
}}

Common action types for reference:
  - Drop column (identifier, constant, or PII)
  - Median imputation (for numeric columns with missing values)
  - Mode imputation (for categorical columns with missing values)
  - One-hot encoding (for low-cardinality categorical columns)
  - Log transform (for heavily right-skewed numeric columns)
  - Standard scaling / Robust scaling
  - Outlier winsorization (cap at 5th/95th percentile)
  - Deduplication (remove duplicate rows)
"""


# Public alias so test_all.py can import it directly
build_prompt = _build_prompt



# ─────────────────────────────────────────────────────────────
# Response parser & validator (Backend Engineer's responsibility)
# ─────────────────────────────────────────────────────────────

VALID_TYPES = {"drop", "impute", "transform", "encode", "outlier", "dedup", "scale"}


def _strip_fences(text: str) -> str:
    """Remove markdown code fences the model might wrap around JSON."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    # If JSON starts after some prose — find first {
    brace_idx = text.find("{")
    if brace_idx > 0:
        text = text[brace_idx:]
    return text.strip()


def parse_and_validate(raw_text: str) -> dict:
    """
    Parse raw model text → validated preprocessing plan dict.
    Raises ValueError on parse/validation failure.
    """
    text = _strip_fences(raw_text)
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Model returned invalid JSON: {exc}\n\n"
            f"Raw (first 500 chars):\n{raw_text[:500]}"
        )

    # ── Required top-level fields ──────────────────────────────
    for field in ("summary", "predicted_health_score", "actions", "ml_recommendations"):
        if field not in parsed:
            raise ValueError(f"Missing required field in model response: '{field}'")

    # ── Normalise and validate actions ────────────────────────
    for i, action in enumerate(parsed["actions"]):
        for req in ("column", "action", "category", "reason", "confidence", "type"):
            if req not in action:
                raise ValueError(f"Action #{i} missing field '{req}'")
        # Clamp confidence
        action["confidence"] = max(0, min(100, int(action["confidence"])))
        # Coerce type to lowercase
        action["type"] = action["type"].lower().strip()
        if action["type"] not in VALID_TYPES:
            action["type"] = "drop"  # best-effort fallback
        # Assign numeric id if missing
        if "id" not in action:
            action["id"] = i + 1

    # ── Normalise ml_recommendations ─────────────────────────
    for rec in parsed.get("ml_recommendations", []):
        if "suitability" in rec:
            rec["suitability"] = max(0, min(100, int(rec["suitability"])))
        rec.setdefault("pros", [])

    # ── Score bounds ─────────────────────────────────────────
    score = parsed.get("predicted_health_score", 80)
    parsed["predicted_health_score"] = max(0, min(100, int(score)))

    return parsed


# ─────────────────────────────────────────────────────────────
# Public interface — called by main.py
# ─────────────────────────────────────────────────────────────

def get_ai_plan(profile: dict) -> dict:
    """
    Send the dataset profile to the AI Engineer's model client and return
    a validated preprocessing plan dict.

    Flow:
      1. _build_prompt(profile)  — Backend Engineer's prompt, uses our schema
      2. AIClient._send_prompt() — AI Engineer's model connection
      3. parse_and_validate()    — Backend Engineer's parser

    This decouples us from the AI Engineer's PromptBuilder and its
    mismatched profile/output schemas.
    """
    try:
        # 1. Build prompt from our profile schema
        prompt = _build_prompt(profile)

        # 2. Send via AI Engineer's model client (use _send_prompt directly
        #    since it gives us the raw text — analyze() doesn't exist on
        #    the AI engineer's class)
        client = AIClient()
        raw = client._send_prompt(prompt)

        logger.info("AI raw response (first 200 chars): %s", raw[:200])

        # 3. Parse and validate
        return parse_and_validate(raw)

    except Exception as exc:
        logger.error("AI call failed: %s", exc)
        raise RuntimeError(f"AI reasoning failed: {exc}") from exc
