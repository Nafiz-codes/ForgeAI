import json

from config import DATASETS_DIR
from client import AIClient
from prompt_builder import PromptBuilder

class DatasetAnalyzer:

    def __init__(self):
        ...

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
        ...

    def _call_ai(self, prompt):
        ...

    def _validate(self, response):
        ...

if __name__ == "__main__":

    analyzer = DatasetAnalyzer()

    profile = analyzer.load_profile(
        DATASETS_DIR / "profile.json"
    )

    print(type(profile))