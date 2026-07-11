import json
from pathlib import Path

PROMPTS_DIR = Path(__file__).parent / "prompts"


def read_prompt(filename: str) -> str:
    """
    Reads one markdown prompt file.
    """

    with open(PROMPTS_DIR / filename, "r", encoding="utf-8") as file:
        return file.read()


def build_prompt(dataset_profile: dict) -> str:
    """
    Creates the complete prompt sent to the LLM.
    """

    system = read_prompt("system_prompt.md")

    task = read_prompt("task_prompt.md")

    output = read_prompt("output_format.md")

    examples = read_prompt("examples.md")

    dataset = json.dumps(dataset_profile, indent=4)

    prompt = f"""
{system}

----------------------------------------

{task}

----------------------------------------

DATASET PROFILE

{dataset}

----------------------------------------

{output}

----------------------------------------

{examples}
"""

    return prompt
