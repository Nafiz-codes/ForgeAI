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

    def save_profile(self, output_path):
        """
        Saves the generated profile as JSON.
        """

        profile = self.profile()

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(
                profile,
                f,
                indent=4,
                default=json_converter
            )

        print(f"Profile saved to {output_path}")

    def _dataset_summary(self):

        return {
            "rows": len(self.df),
            "columns": len(self.df.columns),
            "duplicate_rows": int(self.df.duplicated().sum()),
            "memory_usage_mb": round(
                self.df.memory_usage(deep=True).sum() / (1024 ** 2),
                2
            ),
            "health_score": self._dataset_health()
        }
    
    def _column_profiles(self):

        profiles = []

        for column in self.df.columns:

            series = self.df[column]
            semantic_type = self._semantic_type(column, series)
            missing_percent = round(
                series.isna().mean() * 100,
                2
            )
            column_profile = {
                "name": column,
                "dtype": str(series.dtype),
                "semantic_type": semantic_type,
                "missing_count": int(series.isna().sum()),
                "missing_percent": missing_percent,
                "risk": self._risk_level(missing_percent),
                "constant": self._is_constant(series),
                "unique_values": int(series.nunique()),
                "possible_identifier": semantic_type == "identifier"
            }
            if semantic_type == "numeric":
                column_profile.update(
                    self._numeric_profile(series)
                )
            elif semantic_type in ["categorical", "text"]:
                column_profile.update(
                    self._categorical_profile(series)
                )

            profiles.append(column_profile)
            print(column, series.dtype)
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

        top_values = []

        for value in values.index:

            if pd.isna(value):
                top_values.append(None)      # becomes null in JSON
            else:
                top_values.append(str(value))

        return {
            "top_values": top_values,
            "top_counts": [int(v) for v in values.values]
        }
    
    def _semantic_type(self, column_name, series):

        name = column_name.lower()

        if (
            "id" in name
            or name.endswith("_id")
            or series.nunique() == len(self.df)
        ):
            return "identifier"

        if pd.api.types.is_bool_dtype(series):
            return "boolean"

        if pd.api.types.is_datetime64_any_dtype(series):
            return "datetime"

        if pd.api.types.is_numeric_dtype(series):
            return "numeric"

        if (
            pd.api.types.is_object_dtype(series)
            or pd.api.types.is_string_dtype(series)
        ):
            uniqueness_ratio = (
                series.nunique(dropna=True)
                / max(len(series), 1)
            )
            if uniqueness_ratio > 0.5:
                return "text"
            return "categorical"

        return "unknown"
    
    def _risk_level(self, missing_percent):

        if missing_percent <= 5:
            return "Low"

        elif missing_percent <= 20:
            return "Medium"

        return "High"
    
    def _is_constant(self, series):

        return series.nunique(dropna=False) <= 1

    def _dataset_health(self):

        score = 100

        duplicate_rows = self.df.duplicated().sum()

        score -= duplicate_rows * 2

        for column in self.df.columns:

            series = self.df[column]

            missing = series.isna().mean() * 100

            if missing > 20:
                score -= 5

            if self._is_constant(series):
                score -= 3

            if self._semantic_type(column, series) == "identifier":
                score -= 1

        return max(score, 0)
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