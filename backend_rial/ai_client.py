"""
ForgeAI Backend — AI Client (Layer 2)
Owner: Member 2 (Backend Engineer) — integration glue

Delegates prompt building and model calls to the AI Engineer's modules
in backend_ai/ai/. The backend engineer owns:
  - JSON parsing and extraction from raw model responses
  - Schema validation and normalisation
  - The public get_ai_plan() interface called by main.py
"""

import json
import re
import logging
import sys
from pathlib import Path

# ── Make the AI Engineer's module importable ──────────────────
# Add the parent 'backend_ai' directory to sys.path so we can import
# from backend_ai/ai/ without modifying the AI engineer's code.
_BACKEND_AI_DIR = Path(__file__).resolve().parent.parent / "backend_ai"
if str(_BACKEND_AI_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_AI_DIR))

from ai.client import AIClient
from ai.prompt_builder import PromptBuilder

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# Response parser & validator (Backend Engineer's responsibility)
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
    Parse raw model text → validated preprocessing plan dict.
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
# Public interface — called by main.py
# ─────────────────────────────────────────────────────────────

def get_ai_plan(profile: dict) -> dict:
    """
    Send the dataset profile to the AI Engineer's model client and return
    a validated preprocessing plan dict.

    Delegates to:
      - PromptBuilder.build_prompt()  (AI Engineer — backend_ai/ai/prompt_builder.py)
      - AIClient.analyze()            (AI Engineer — backend_ai/ai/client.py)
    Owns:
      - parse_and_validate()          (Backend Engineer)
    """
    try:
        # Build prompt using AI Engineer's PromptBuilder
        prompt = PromptBuilder().build_prompt(profile)

        # Call the model using AI Engineer's AIClient
        raw = AIClient().analyze(prompt)

        logger.info("AI raw response (first 200 chars): %s", raw[:200])

        # Parse and validate the response (backend engineer's responsibility)
        return parse_and_validate(raw)

    except Exception as exc:
        logger.error("AI call failed: %s", exc)
        raise RuntimeError(f"AI reasoning failed: {exc}") from exc
