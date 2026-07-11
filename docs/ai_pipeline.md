# ForgeAI AI Pipeline

Version: 1.0

---

# Overview

ForgeAI separates reasoning from execution.

Traditional AI applications often ask the language model to directly clean datasets.

ForgeAI instead follows a deterministic architecture:

Python gathers facts.

The AI reasons over those facts.

Python executes the decisions.

This improves reliability, explainability, and reproducibility.

---

# Complete Pipeline

User Uploads CSV

↓

Dataset Profiler (Python)

↓

Dataset Profile JSON

↓

AI Data Scientist (Gemma 4)

↓

Structured Preprocessing Plan

↓

Human Review & Approval

↓

Python Execution Engine

↓

Generated Outputs

- Clean Dataset (.csv)
- AI Decision Log
- preprocessing_pipeline.py
- ML Recommendations
- Dataset Health Score

---

# Step 1 — Dataset Upload

The user uploads a CSV dataset.

No preprocessing occurs at this stage.

---

# Step 2 — Dataset Profiling

Python analyzes the dataset.

The profiler extracts:

- Data types
- Missing values
- Duplicates
- Cardinality
- Outliers
- Statistical summaries
- Dataset dimensions

The output is converted into a structured JSON profile.

---

# Step 3 — AI Reasoning

Gemma receives the dataset profile.

The model determines:

- preprocessing strategy
- identifier columns
- target column
- encoding strategy
- scaling strategy
- missing value handling
- feature removal
- ML recommendations

The AI explains every decision.

---

# Step 4 — User Review

The proposed preprocessing plan is displayed.

The user may:

- Approve decisions
- Reject decisions
- Modify preprocessing actions

This keeps the human in control.

---

# Step 5 — Execution

Python converts the approved plan into preprocessing steps.

Examples:

- Median Imputation
- One Hot Encoding
- Standard Scaling
- Duplicate Removal

No AI-generated code is executed.

---

# Step 6 — Outputs

ForgeAI generates

- cleaned_dataset.csv
- preprocessing_pipeline.py
- AI Decision Log
- Dataset Health Score
- Recommended ML Models

---

# Core Philosophy

AI reasons.

Python executes.

Humans approve.