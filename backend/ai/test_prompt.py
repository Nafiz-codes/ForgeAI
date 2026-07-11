from prompts import build_prompt

profile = {
    "dataset": {
        "rows": 1000,
        "columns": 5,
        "duplicates": 12
    },
    "columns": [
        {
            "name": "Age",
            "dtype": "numeric",
            "missing_percent": 15,
            "skewness": 1.8
        },
        {
            "name": "Salary",
            "dtype": "numeric",
            "missing_percent": 0
        }
    ]
}

prompt = build_prompt(profile)

print(prompt)