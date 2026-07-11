# backend/ai/ai_client.py

import json
import os

from dotenv import load_dotenv
from openai import OpenAI

from prompts import build_prompt
from schema import AIPlan

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


class AIClient:

    def analyze(self, dataset_profile):

        prompt = build_prompt(dataset_profile)

        response = client.responses.create(
            model="gpt-4.1",      # Replace later with Gemma
            input=prompt
        )

        text = response.output_text

        plan = json.loads(text)

        validated = AIPlan.model_validate(plan)

        return validated
