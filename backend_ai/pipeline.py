import json
import pandas as pd

from profiler.profile_dataset import DatasetProfiler
from ai.client import AIClient
from executor.preprocessor import DatasetPreprocessor
from reports.report_generator import ReportGenerator

from config import (
    PROFILE_FILE,
    OUTPUTS_DIR
)


class ForgePipeline:

    def run(self, dataset_path):

        import time

        start_time = time.time()

        # -----------------------------
        # Profile dataset
        # -----------------------------

        profiler = DatasetProfiler(dataset_path)

        profile = profiler.profile()

        profiler.save_profile(PROFILE_FILE)

        health_before = int(profile["dataset"]["health_score"])
        # -----------------------------
        # AI Analysis
        # -----------------------------

        client = AIClient()

        plan = client.generate(profile)

        # -----------------------------
        # Execute preprocessing
        # -----------------------------

        df = pd.read_csv(dataset_path)

        preprocessor = DatasetPreprocessor(df, plan)

        clean_df = preprocessor.execute()

        # -----------------------------
        # Save outputs
        # -----------------------------

        OUTPUTS_DIR.mkdir(exist_ok=True)

        clean_path = OUTPUTS_DIR / "cleaned_dataset.csv"

        clean_df.to_csv(
            clean_path,
            index=False
        )

        report = ReportGenerator(profile, plan)

        report_path = OUTPUTS_DIR / "preprocessing_report.json"

        report.save(report_path)

        # -----------------------------
        # Statistics
        # -----------------------------

        execution_time = round(time.time() - start_time, 2)

        operations = int(len(plan["preprocessing_steps"]))

        health_after = min(
            100,
            health_before + operations
        )

        # -----------------------------
        # Return
        # -----------------------------

        return {
            "status": "success",

            "message": "Dataset processed successfully.",

            "summary": {

                "rows": int(len(clean_df)),

                "columns": int(len(clean_df.columns)),

                "health_before": int(health_before),

                "health_after": int(health_after),

                "operations": int(operations),

                "execution_time_seconds": float(execution_time)
            },

            "downloads": {

        "clean_dataset": "/download/dataset",

        "report": "/download/report"
    }
        }