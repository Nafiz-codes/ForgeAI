"""
ForgeAI Backend — AI Client (Layer 2)
Owner: Member 1 (AI Engineer) — integration glue written by M2

Wraps the AI engineer's prompt builder with robust JSON parsing
and schema validation. Supports both OpenAI and Google Gemma
backends via environment-variable config.
"""

import json
import os
import re
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────
# Prompt builder (reproduces the template from backend-walkthrough.md)
# ─────────────────────────────────────────────────────────────

PROMPT_TEMPLATE = """You are an expert data scientist. You have been given a structured profile
of a dataset. Your job is to propose a preprocessing plan.

## Dataset Profile
{profile_json}

## Instructions
Analyze every column and propose exactly one action per column that needs attention.
Follow these rules:
- If a column's unique_count equals the row count, it is an identifier — recommend dropping it.
- If missing_pct > 5% and dtype is numeric, recommend median imputation if |skewness| > 1, else mean imputation.
- If missing_pct > 0% and dtype is categorical, recommend mode imputation.
- If |skewness| > 2, recommend log transform before scaling.
- If dtype is categorical with Low cardinality (<= 10 unique), recommend one-hot encoding.
- If dtype is categorical with Medium/High cardinality (> 10 unique), recommend label encoding.
- If outlier_count > 10, recommend IQR winsorization.
- If duplicates > 0, always include deduplication as the FIRST action (column = "Dataset").
- Any column with "id", "key", "number", "phone", "email" in its name is likely PII — flag it.
- Assign a confidence score (0–100) to every decision.
- Write your reason in plain English, referencing the actual statistics from the profile.
- Do NOT recommend actions for columns that look clean with no issues.

## Output Format
Respond ONLY with valid JSON. No explanation outside the JSON block.

{{
  "summary": "...",
  "predicted_health_score": <integer 0-100>,
  "actions": [
    {{
      "column": "<column_name or Dataset for global actions>",
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

Valid type values: drop, impute, transform, encode, outlier, dedup, scale
Valid category values: Identifier Removal, PII Removal, Missing Value Handling,
  Feature Engineering, Categorical Encoding, Outlier Treatment, Data Quality, Feature Scaling
"""


def build_prompt(profile: dict) -> str:
    profile_json = json.dumps(profile, indent=2, default=str)
    return PROMPT_TEMPLATE.format(profile_json=profile_json)


# ─────────────────────────────────────────────────────────────
# Response parser & validator
# ─────────────────────────────────────────────────────────────

VALID_TYPES = {"drop", "impute", "transform", "encode", "outlier", "dedup", "scale"}
VALID_CATEGORIES = {
    "Identifier Removal", "PII Removal", "Missing Value Handling",
    "Feature Engineering", "Categorical Encoding", "Outlier Treatment",
    "Data Quality", "Feature Scaling",
}


def _strip_fences(text: str) -> str:
    """Remove markdown code fences the model might wrap around JSON."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    # Also handle if JSON starts after some prose — find first {
    brace_idx = text.find("{")
    if brace_idx > 0:
        text = text[brace_idx:]
    return text.strip()


def parse_and_validate(raw_text: str) -> dict:
    """
    Parse Gemma/OpenAI raw text → validated preprocessing plan dict.
    Raises ValueError on parse/validation failure.
    """
    text = _strip_fences(raw_text)
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Model returned invalid JSON: {exc}\n\nRaw (first 500 chars):\n{raw_text[:500]}")

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
            # Best-effort fix
            action["type"] = "drop"
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
# AI backend — pluggable (OpenAI or Google Gemini)
# ─────────────────────────────────────────────────────────────

def _call_openai(prompt: str) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    response = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        messages=[
            {"role": "system", "content": "You are an expert data scientist. Respond only with valid JSON."},
            {"role": "user",   "content": prompt},
        ],
        temperature=0.1,
        max_tokens=4096,
    )
    return response.choices[0].message.content or ""


def _call_gemini(prompt: str) -> str:
    import google.generativeai as genai
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemma-3-27b-it"))
    response = model.generate_content(prompt)
    return response.text or ""


def get_ai_plan(profile: dict) -> dict:
    """
    Send the dataset profile to the configured AI backend and return
    a validated preprocessing plan dict.

    Environment variables:
      AI_BACKEND      = "openai" (default) | "gemini"
      OPENAI_API_KEY  — required for openai backend
      OPENAI_MODEL    — defaults to gpt-4o-mini
      GEMINI_API_KEY  — required for gemini backend
      GEMINI_MODEL    — defaults to gemma-3-27b-it
    """
    prompt = build_prompt(profile)
    backend = os.getenv("AI_BACKEND", "openai").lower()

    try:
        if backend == "gemini":
            raw = _call_gemini(prompt)
        else:
            raw = _call_openai(prompt)

        logger.info("AI raw response (first 200 chars): %s", raw[:200])
        return parse_and_validate(raw)

    except Exception as exc:
        logger.error("AI call failed: %s", exc)
        raise RuntimeError(f"AI reasoning failed: {exc}") from exc
