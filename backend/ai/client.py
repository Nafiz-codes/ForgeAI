import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


class AIClient:

    def __init__(self):

        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )

        self.model = "gpt-4.1-mini"

    def analyze(self, prompt: str) -> str:
        """
        Send a prompt to the AI model.

        Returns the raw text response.
        """

        response = self.client.responses.create(
            model=self.model,
            input=prompt
        )

        return response.output_text

if __name__ == "__main__":

    client = AIClient()

    response = client.analyze(
        "Reply with exactly: ForgeAI client works."
    )

    print(response)