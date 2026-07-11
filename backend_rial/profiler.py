"""
ForgeAI Backend — Dataset Profiler
Owner: Member 2 (Backend Engineer)

Step 2 of July 11 (Dataset Understanding) sprint task.

For now this stays simple on purpose:
    - rows
    - columns
    - data types
    - missing %
    - duplicates
    - unique values

Skewness / outliers / correlation / cardinality get added later
once the AI engineer's prompt schema needs them.
"""

import pandas as pd


def profile_dataset(csv_file) -> dict:
    """
    Profile a raw CSV file and return a plain-JSON-serializable summary.

    Args:
        csv_file: a file path (str), an open file object, or a
                   file-like object (e.g. UploadFile.file from FastAPI).

    Returns:
        dict with keys:
            rows, columns, dtypes, missing_total, missing_pct,
            duplicate_rows, column_analysis (list of per-column stats)
    """
    df = pd.read_csv(csv_file)

    rows, columns = df.shape

    # --- duplicates -----------------------------------------------------
    duplicate_rows = int(df.duplicated().sum())

    # --- missing values ---------------------------------------------------
    missing_per_col = df.isna().sum()
    missing_total = int(missing_per_col.sum())
    total_cells = rows * columns
    missing_pct_overall = round((missing_total / total_cells) * 100, 2) if total_cells else 0.0

    # --- per-column analysis ----------------------------------------------
    column_analysis = []
    for col in df.columns:
        col_missing = int(missing_per_col[col])
        col_missing_pct = round((col_missing / rows) * 100, 2) if rows else 0.0
        unique_count = int(df[col].nunique(dropna=True))

        column_analysis.append({
            "name": col,
            "type": str(df[col].dtype),
            "missing_count": col_missing,
            "missing_pct": col_missing_pct,
            "unique_count": unique_count,
        })

    profile = {
        "rows": int(rows),
        "columns": int(columns),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "missing_total": missing_total,
        "missing_pct": missing_pct_overall,
        "duplicate_rows": duplicate_rows,
        "column_analysis": column_analysis,
    }

    return profile


if __name__ == "__main__":
    # Quick manual smoke test.
    # Usage: python profiler.py path/to/dataset.csv
    import sys
    import json

    if len(sys.argv) < 2:
        print("Usage: python profiler.py <path_to_csv>")
        sys.exit(1)

    result = profile_dataset(sys.argv[1])
    print(json.dumps(result, indent=2))
