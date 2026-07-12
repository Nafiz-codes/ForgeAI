import json

from config import DATASETS_DIR
from ai.client import AIClient
from ai.prompt_builder import PromptBuilder

class DatasetAnalyzer:

    def __init__(self):
        self.client = AIClient()
        self.prompt_builder = PromptBuilder()
        

    def load_profile(self, profile_path):
        """
        Load a dataset profile from a JSON file.

        Args:
            profile_path (str): Path to the profile JSON.

        Returns:
            dict: Loaded dataset profile.
        """

        with open(profile_path, "r", encoding="utf-8") as file:
            profile = json.load(file)

        return profile


    def analyze(self, profile_path):

        profile = self.load_profile(profile_path)

        prompt = self.prompt_builder.build_prompt(profile)

        response = self._call_ai(prompt)

        return response
    
    def _call_ai(self, prompt):

        return self.client.analyze(prompt)

    def _validate(self, response):
        ...

def analyze(self, profile_path):

    profile = self.load_profile(profile_path)

    prompt = self.prompt_builder.build_prompt(profile)

    response = self._call_ai(prompt)

    return response