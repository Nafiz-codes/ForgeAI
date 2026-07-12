import os

from dotenv import load_dotenv
from openai import OpenAI

from prompts import build_prompt

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


class AIClient:

    def ask(self, profile):

        prompt = build_prompt(profile)

        response = client.responses.create(
            model="gpt-4.1-mini",
            input=prompt
        )

        return response.output_text