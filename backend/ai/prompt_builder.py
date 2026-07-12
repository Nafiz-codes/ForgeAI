import json


class PromptBuilder:

    def __init__(self):
        pass

    def build_prompt(self, profile: dict):

        prompt = f"""
You are ForgeAI.

You are an expert machine learning engineer.

Given the following dataset profile,
return ONLY valid JSON.

Dataset Profile:

{json.dumps(profile, indent=2)}

Return a preprocessing plan.
"""

        return prompt
    
from config import DATASETS_DIR
import json

if __name__ == "__main__":

    with open(DATASETS_DIR / "profile.json", "r") as f:
        profile = json.load(f)

    builder = PromptBuilder()

    prompt = builder.build_prompt(profile)

    print(prompt)