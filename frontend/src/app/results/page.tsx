"use client";
import { useState } from "react";
import Link from "next/link";

const ML_MODELS = [
  {
    name: "Random Forest",
    type: "Ensemble",
    suitability: 94,
    reason: "Strong fit for imbalanced classification. Handles mixed feature types and non-linear relationships without much tuning. Good starting point.",
    pros: ["Handles mixed types", "Built-in feature importance", "Robust to outliers"],
    color: "#059669",
  },
  {
    name: "XGBoost",
    type: "Gradient boosting",
    suitability: 91,
    reason: "Excellent on tabular data. Regularization keeps overfitting in check on a dataset this size. Worth training alongside Random Forest.",
    pros: ["Strong out-of-the-box performance", "Fast training", "Good with sparse features"],
    color: "#2563eb",
  },
  {
    name: "Logistic Regression",
    type: "Linear",
    suitability: 74,
    reason: "After scaling and encoding, can serve as an interpretable baseline. Not expected to match the ensemble models, but useful for comparing.",
    pros: ["Fully interpretable", "Fast inference", "Probabilistic output"],
    color: "#7c3aed",
  },
];

const DECISION_LOG = [
  { action: "Removed CustomerID", reason: "Unique identifier — no predictive value", impact: "High", time: "0.001s" },
  { action: "Median imputed Age", reason: "14.2% missing, skew=1.3", impact: "High", time: "0.023s" },
  { action: "Log-transformed Income", reason: "Skewness=4.7, normalized distribution", impact: "High", time: "0.018s" },
  { action: "One-hot encoded Gender", reason: "Nominal, 2 unique values, drop_first", impact: "Medium", time: "0.011s" },
  { action: "Ordinal encoded Contract_Type", reason: "Natural ordering detected", impact: "Medium", time: "0.009s" },
  { action: "Winsorized TotalCharges", reason: "35 outliers capped at IQR bounds", impact: "Medium", time: "0.034s" },
  { action: "Removed PhoneNumber", reason: "PII column, high-entropy string", impact: "Low", time: "0.002s" },
  { action: "Removed 47 duplicates", reason: "Exact row match deduplication", impact: "High", time: "0.041s" },
];

const BEFORE_AFTER = [
  { metric: "Missing values", before: "1,203", after: "0" },
  { metric: "Duplicate rows", before: "47", after: "0" },
  { metric: "Columns", before: "12", after: "14 (after encoding)" },
  { metric: "Health score", before: "42", after: "93" },
  { metric: "Skewed features", before: "3", after: "0" },
  { metric: "Outlier rows", before: "35", after: "0 (capped)" },
];

const PIPELINE_CODE = `# ForgeAI — Generated Preprocessing Pipeline
# Dataset: customer_churn.csv
# Generated: July 12, 2026

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler

def preprocess(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    
    # Step 1: Remove identifier & PII columns
    df = df.drop(columns=['CustomerID', 'PhoneNumber'])
    
    # Step 2: Remove 47 duplicate rows
    df = df.drop_duplicates().reset_index(drop=True)
    
    # Step 3: Median imputation — Age (skew=1.3)
    df['Age'] = df['Age'].fillna(df['Age'].median())
    
    # Step 4: Income — Log transform + median impute + scale
    df['Income'] = np.log1p(df['Income'])
    df['Income'] = df['Income'].fillna(df['Income'].median())
    
    # Step 5: Gender — mode impute + one-hot (drop_first)
    df['Gender'] = df['Gender'].fillna(df['Gender'].mode()[0])
    df = pd.get_dummies(df, columns=['Gender'], drop_first=True)
    
    # Step 6: Contract_Type — ordinal encoding
    order = {'Month-to-month': 0, 'One year': 1, 'Two year': 2}
    df['Contract_Type'] = df['Contract_Type'].map(order)
    
    # Step 7: TotalCharges — IQR winsorization
    q1 = df['TotalCharges'].quantile(0.05)
    q3 = df['TotalCharges'].quantile(0.95)
    df['TotalCharges'] = df['TotalCharges'].clip(q1, q3)
    
    # Step 8: StandardScaler on numeric features
    numeric_cols = ['Age', 'Income', 'TotalCharges']
    scaler = StandardScaler()
    df[numeric_cols] = scaler.fit_transform(df[numeric_cols])
    
    return df

if __name__ == "__main__":
    raw = pd.read_csv("customer_churn.csv")
    clean = preprocess(raw)
    clean.to_csv("customer_churn_clean.csv", index=False)
    print(f"Saved: {len(clean)} rows × {len(clean.columns)} columns")
`;

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "log", label: "Decision log" },
  { id: "pipeline", label: "Pipeline code" },
  { id: "models", label: "Model suggestions" },
] as const;

function HealthRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <div style={{ position: "relative", width: "110px", height: "110px" }}>
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
          <circle
            cx="55" cy="55" r={r}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeDasharray={`${circ * pct} ${circ}`}
            strokeDashoffset={circ * 0.25}
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "20px", fontWeight: 900, color, letterSpacing: "-0.02em" }}>{score}</span>
          <span style={{ fontSize: "10px", color: "var(--text-dimmed)", fontWeight: 500 }}>/ 100</span>
        </div>
      </div>
      <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function StepIndicator({ active }: { active: 1 | 2 | 3 }) {
  const steps = [
    { label: "Upload", num: 1 },
    { label: "Review plan", num: 2 },
    { label: "Results", num: 3 },
  ];

  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      {steps.map((s, i) => {
        const isDone = s.num < active;
        const isActive = s.num === active;
        return (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "22px", height: "22px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 700,
                  background: isDone ? "#059669" : isActive ? "#2563eb" : "rgba(255,255,255,0.05)",
                  color: isDone || isActive ? "white" : "var(--text-muted)",
                  border: isDone || isActive ? "none" : "1px solid var(--border)",
                }}
              >
                {isDone ? "✓" : s.num}
              </div>
              <span style={{ fontSize: "13px", fontWeight: isActive ? 600 : 400, color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span style={{ color: "var(--text-dimmed)", fontSize: "12px", margin: "0 2px" }}>›</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ResultsPage() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "log" | "pipeline" | "models">("overview");

  const copy = () => {
    navigator.clipboard.writeText(PIPELINE_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Nav */}
      <nav
        className="glass"
        style={{
          padding: "0 36px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <rect width="22" height="22" rx="6" fill="#2563eb"/>
            <path d="M7 11.5L10 14.5L15 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.02em" }}>
            Forge<span style={{ color: "#60a5fa" }}>AI</span>
          </span>
        </Link>

        <StepIndicator active={3} />

        <Link href="/upload">
          <button className="btn-secondary" style={{ padding: "6px 14px", fontSize: "13px" }}>
            New dataset
          </button>
        </Link>
      </nav>

      <div style={{ maxWidth: "1060px", margin: "0 auto", padding: "44px 36px" }}>

        {/* Completion banner */}
        <div
          style={{
            padding: "18px 22px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, rgba(5,150,105,0.08), rgba(14,165,233,0.05))",
            border: "1px solid rgba(5,150,105,0.2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "5px" }}>
              <code style={{ fontFamily: "'JetBrains Mono', monospace", color: "#67e8f9" }}>customer_churn.csv</code>{" "}
              is ML-ready
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
              8 actions applied · 7,794 clean rows · health score{" "}
              <strong style={{ color: "#e11d48" }}>42</strong> → <strong style={{ color: "#059669" }}>93</strong>
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button className="btn-primary" style={{ padding: "8px 18px", fontSize: "13px" }} onClick={() => {}}>
              <span>Download clean CSV</span>
            </button>
            <button className="btn-secondary" style={{ padding: "8px 18px", fontSize: "13px" }} onClick={() => {}}>
              Download pipeline
            </button>
          </div>
        </div>

        {/* Health score rings */}
        <div
          style={{
            borderRadius: "14px",
            padding: "28px",
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            marginBottom: "22px",
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <HealthRing score={42} label="Before" color="#e11d48" />
          <div style={{ display: "flex", alignItems: "center", flexDirection: "column", justifyContent: "center", gap: "6px" }}>
            <span style={{ fontSize: "22px", color: "var(--text-muted)" }}>→</span>
            <span className="badge badge-emerald">+51 pts</span>
          </div>
          <HealthRing score={93} label="After" color="#059669" />
          <div style={{ width: "1px", background: "var(--border-subtle)", height: "70px", alignSelf: "center" }} />
          <HealthRing score={97} label="Completeness" color="#2563eb" />
          <HealthRing score={89} label="Consistency" color="#7c3aed" />
          <HealthRing score={94} label="ML readiness" color="#0ea5e9" />
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "2px",
            marginBottom: "20px",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "9px",
            padding: "3px",
            width: "fit-content",
            border: "1px solid var(--border)",
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "7px 18px",
                borderRadius: "7px",
                fontSize: "13px",
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: "pointer",
                border: "none",
                transition: "all 0.15s",
                background: activeTab === tab.id ? "#2563eb" : "transparent",
                color: activeTab === tab.id ? "white" : "var(--text-muted)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            {/* Before / After */}
            <div
              style={{
                borderRadius: "12px",
                border: "1px solid var(--border)",
                overflow: "hidden",
                background: "var(--bg-card)",
              }}
            >
              <div
                style={{
                  padding: "12px 18px",
                  borderBottom: "1px solid var(--border)",
                  background: "var(--bg-secondary)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "13px" }}>Before / After</span>
              </div>
              <table className="data-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th style={{ color: "#fda4af" }}>Before</th>
                    <th style={{ color: "#6ee7b7" }}>After</th>
                  </tr>
                </thead>
                <tbody>
                  {BEFORE_AFTER.map((row) => (
                    <tr key={row.metric}>
                      <td>{row.metric}</td>
                      <td style={{ color: "#fda4af", fontFamily: "'JetBrains Mono', monospace" }}>{row.before}</td>
                      <td style={{ color: "#6ee7b7", fontFamily: "'JetBrains Mono', monospace" }}>{row.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Downloads */}
            <div
              style={{
                borderRadius: "12px",
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 18px",
                  borderBottom: "1px solid var(--border)",
                  background: "var(--bg-secondary)",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "13px" }}>Download artifacts</span>
              </div>
              <div style={{ padding: "12px" }}>
                {[
                  {
                    name: "customer_churn_clean.csv",
                    size: "892 KB",
                    desc: "ML-ready cleaned dataset",
                    color: "#059669",
                  },
                  {
                    name: "preprocessing_pipeline.py",
                    size: "3.2 KB",
                    desc: "Reproducible Python pipeline",
                    color: "#2563eb",
                  },
                  {
                    name: "ai_decision_report.html",
                    size: "48 KB",
                    desc: "Full AI audit trail",
                    color: "#7c3aed",
                  },
                ].map((f) => (
                  <div
                    key={f.name}
                    className="card-hover"
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      marginBottom: "6px",
                      cursor: "pointer",
                      background: "transparent",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "7px",
                        background: `${f.color}14`,
                        border: `1px solid ${f.color}28`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={f.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: "#93c5fd",
                          marginBottom: "2px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {f.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {f.desc} · {f.size}
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
                      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Decision log */}
        {activeTab === "log" && (
          <div
            style={{
              borderRadius: "12px",
              border: "1px solid var(--border)",
              overflow: "hidden",
              background: "var(--bg-card)",
            }}
          >
            <div
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--bg-secondary)",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "13px" }}>AI decision log</span>
              <span className="badge badge-emerald">8 actions · all succeeded</span>
            </div>
            <table className="data-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Reason</th>
                  <th>Impact</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {DECISION_LOG.map((row, i) => (
                  <tr key={i}>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{row.action}</td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{row.reason}</td>
                    <td>
                      <span
                        className={`badge ${row.impact === "High" ? "badge-rose" : row.impact === "Medium" ? "badge-amber" : "badge-blue"}`}
                      >
                        {row.impact}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>
                      {row.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pipeline code */}
        {activeTab === "pipeline" && (
          <div
            style={{
              borderRadius: "12px",
              border: "1px solid var(--border)",
              overflow: "hidden",
              background: "var(--bg-card)",
            }}
          >
            <div
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--bg-secondary)",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "13px", fontFamily: "'JetBrains Mono', monospace" }}>
                preprocessing_pipeline.py
              </span>
              <button
                onClick={copy}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  background: copied ? "rgba(5,150,105,0.12)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${copied ? "rgba(5,150,105,0.25)" : "var(--border-strong)"}`,
                  color: copied ? "#6ee7b7" : "var(--text-secondary)",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
                lineHeight: 1.75,
                padding: "22px",
                overflowX: "auto",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              <code>{PIPELINE_CODE}</code>
            </pre>
          </div>
        )}

        {/* ML models */}
        {activeTab === "models" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {ML_MODELS.map((m, rank) => (
              <div
                key={m.name}
                style={{
                  borderRadius: "12px",
                  padding: "20px 22px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                  position: "relative",
                  overflow: "hidden",
                  transition: "border-color 0.2s ease",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0, top: 0, bottom: 0,
                    width: "2px",
                    background: m.color,
                    opacity: 0.7,
                  }}
                />

                {/* Rank */}
                <div
                  style={{
                    flexShrink: 0,
                    width: "28px",
                    height: "28px",
                    borderRadius: "7px",
                    background: `${m.color}14`,
                    border: `1px solid ${m.color}28`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 800,
                    color: m.color,
                    marginTop: "1px",
                  }}
                >
                  {rank + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "7px", flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.01em" }}>{m.name}</h3>
                    <span
                      style={{
                        padding: "1px 8px",
                        borderRadius: "5px",
                        fontSize: "11px",
                        fontWeight: 500,
                        background: `${m.color}12`,
                        color: m.color,
                        border: `1px solid ${m.color}28`,
                      }}
                    >
                      {m.type}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: "10px" }}>
                    {m.reason}
                  </p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {m.pros.map((p) => (
                      <span key={p} className="badge badge-blue" style={{ fontSize: "11px" }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "24px", fontWeight: 900, color: m.color, letterSpacing: "-0.02em" }}>
                    {m.suitability}%
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "5px" }}>suitability</div>
                  <div className="progress-bar" style={{ width: "72px" }}>
                    <div style={{ height: "100%", borderRadius: "2px", width: `${m.suitability}%`, background: m.color }} />
                  </div>
                </div>
              </div>
            ))}

            <div
              style={{
                padding: "14px 18px",
                borderRadius: "10px",
                background: "rgba(124,58,237,0.06)",
                border: "1px solid rgba(124,58,237,0.18)",
                fontSize: "13px",
                color: "var(--text-secondary)",
                lineHeight: 1.65,
              }}
            >
              <strong style={{ color: "#c4b5fd", fontWeight: 600 }}>Gemma recommends</strong> starting with Random
              Forest as your baseline — it handles the class imbalance in your Churn column (73% / 27% split) without
              needing oversampling. Consider SMOTE + XGBoost once you have a baseline to compare against.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
