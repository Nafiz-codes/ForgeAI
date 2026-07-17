import json
import os
import time

from dotenv import load_dotenv
from google import genai

from ai.prompt_builder import PromptBuilder
from config import (
    MODEL_NAME,
    TEMPERATURE,
    MAX_RETRIES,
)

load_dotenv()


class AIClient:

    def __init__(self):

        api_key = os.getenv("GEMMA_API_KEY")

        if not api_key:
            raise ValueError(
                "GEMMA_API_KEY was not found in your .env file."
            )

        self.client = genai.Client(api_key=api_key)

        self.model = MODEL_NAME

        self.prompt_builder = PromptBuilder()

    def _send_prompt(self, prompt: str) -> str:

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config={
                "temperature": TEMPERATURE,
            },
        )

        return response.text

    def analyze(self, prompt: str) -> str:
        """
        Public alias for _send_prompt.
        Returns the raw model response text (no JSON parsing).
        Called by backend_rial/ai_client.py.
        """
        return self._send_prompt(prompt)

    def generate(self, profile: dict) -> dict:

        prompt = self.prompt_builder.build_prompt(profile)

        last_error = None

        for attempt in range(MAX_RETRIES):

            try:

                raw_response = self._send_prompt(prompt)

                # Sometimes models wrap JSON inside markdown.
                raw_response = (
                    raw_response
                    .replace("```json", "")
                    .replace("```", "")
                    .strip()
                )

                return json.loads(raw_response)

            except Exception as e:

                last_error = e

                print(
                    f"Retry {attempt + 1}/{MAX_RETRIES}"
                )

                time.sleep(1)

        raise RuntimeError(
            f"Gemma failed after {MAX_RETRIES} attempts.\n\n{last_error}"
        )


if __name__ == "__main__":

    from config import PROFILE_FILE

    with open(PROFILE_FILE, "r", encoding="utf-8") as f:

        profile = json.load(f)

    client = AIClient()

    result = client.generate(profile)

    print(json.dumps(result, indent=4))