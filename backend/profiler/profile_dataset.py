import json
import pandas as pd
import numpy as np
from pathlib import Path

def json_converter(obj):
    if isinstance(obj, np.integer):
        return int(obj)

    if isinstance(obj, np.floating):
        return float(obj)

    if isinstance(obj, np.bool_):
        return bool(obj)

    if isinstance(obj, np.ndarray):
        return obj.tolist()

    raise TypeError(f"{type(obj)} is not JSON serializable")
    
class DatasetProfiler:
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.df = pd.read_csv(file_path)

    def profile(self) -> dict:
        """
        Returns a complete profile of the dataset.
        """

        profile = {
            "dataset": self._dataset_summary(),
            "columns": self._column_profiles()
        }

        return profile

    def save_profile(self, output_path: str):
        """
        Saves the generated profile as JSON.
        """

        profile = self.profile()

        with open(output_path, "w", encoding="utf-8") as f:
            print(json.dumps(
                profile,
                indent=4,
                default=json_converter
            ))

        print(f"Profile saved to {output_path}")

    def _dataset_summary(self):

        return {
            "rows": len(self.df),
            "columns": len(self.df.columns),
            "duplicate_rows": int(self.df.duplicated().sum()),
            "memory_usage_mb": round(
                self.df.memory_usage(deep=True).sum() / (1024 ** 2),
                2
            )
        }
    
    def _column_profiles(self):

        profiles = []

        for column in self.df.columns:

            series = self.df[column]

            column_profile = {
                "name": column,
                "dtype": str(series.dtype),
                "missing_count": int(series.isna().sum()),
                "missing_percent": round(
                    series.isna().mean() * 100,
                    2
                ),
                "unique_values": int(series.nunique()),
                "possible_identifier": bool(
                    series.nunique() == len(self.df)
                )
            }

            if pd.api.types.is_numeric_dtype(series):
                column_profile.update(
                    self._numeric_profile(series)
                )

            elif pd.api.types.is_object_dtype(series):
                column_profile.update(
                    self._categorical_profile(series)
                )

            profiles.append(column_profile)

        return profiles
    
    def _numeric_profile(self, series):

        clean = series.dropna()

        q1 = clean.quantile(0.25)
        q3 = clean.quantile(0.75)

        iqr = q3 - q1

        outliers = clean[
            (clean < q1 - 1.5 * iqr) |
            (clean > q3 + 1.5 * iqr)
        ]

        return {
            "mean": round(clean.mean(), 3),
            "median": round(clean.median(), 3),
            "std": round(clean.std(), 3),
            "min": round(clean.min(), 3),
            "max": round(clean.max(), 3),
            "skewness": round(clean.skew(), 3),
            "outlier_count": int(len(outliers))
        }
    
    def _categorical_profile(self, series):

        values = series.value_counts(dropna=False).head(5)

        return {
            "top_values": values.index.astype(str).tolist(),
            "top_counts": values.values.tolist()
        }

if __name__ == "__main__":

    BASE_DIR = Path(__file__).resolve().parent.parent

    dataset_path = BASE_DIR / "datasets" / "titanic.csv"

    profiler = DatasetProfiler(dataset_path)

    profile = profiler.profile()

    output_path = BASE_DIR / "datasets" / "profile.json"

    profiler.save_profile(output_path)

    print(json.dumps(
    profile,
    indent=4,
    default=json_converter
    ))