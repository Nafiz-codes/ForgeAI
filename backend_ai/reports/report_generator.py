import json
from profiler.profile_dataset import json_converter
class ReportGenerator:

    def __init__(self, profile, plan):

        self.profile = profile
        self.plan = plan

    def generate(self):

        report = {
            "dataset": {
                "rows": self.profile["dataset"]["rows"],
                "columns": self.profile["dataset"]["columns"],
                "health_score": self.profile["dataset"]["health_score"]
            },

            "operations": self.plan["preprocessing_steps"],

            "summary": self.plan["summary"],

            "recommendations": self.plan["recommendations"],

            "confidence": self.plan["dataset_health_score"]
        }

        return report

    def save(self, output_path):

        report = self.generate()

        with open(output_path, "w", encoding="utf-8") as f:

            json.dump(
            report,
            f,
            indent=4,
            default=json_converter
        )

        print(f"✅ Report saved to {output_path}")