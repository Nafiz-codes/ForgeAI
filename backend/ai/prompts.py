# backend/ai/prompts.py

import json
from pathlib import Path

PROMPTS_DIR = Path(__file__).parent / "prompts"


def read_prompt(filename: str) -> str:
    """Read a markdown prompt file."""
    with open(PROMPTS_DIR / filename, "r", encoding="utf-8") as f:
        return f.read()


def build_prompt(dataset_profile: dict) -> str:
    """
    Combines all prompt files into one prompt.
    """

    system = read_prompt("system_prompt.md")
    task = read_prompt("task_prompt.md")
    output = read_prompt("output_format.md")
    examples = read_prompt("examples.md")

    dataset = json.dumps(dataset_profile, indent=2)

    return f"""
{system}

{task}

## Dataset Profile

{dataset}

{output}

{examples}
"""
