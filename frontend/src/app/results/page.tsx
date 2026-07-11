"use client";
import { useState } from "react";
import Link from "next/link";

const ML_MODELS = [
  {
    name: "Random Forest",
    type: "Ensemble",
    suitability: 94,
    reason: "High suitability for imbalanced classification. Handles mixed feature types and non-linear relationships well.",
    pros: ["Handles mixed types", "Built-in feature importance", "Robust to outliers"],
    color: "#10b981",
    icon: "🌲",
  },
  {
    name: "XGBoost",
    type: "Gradient Boosting",
    suitability: 91,
    reason: "Excellent for tabular data. Regularization prevents overfitting on this 7.8k row dataset.",
    pros: ["State-of-the-art performance", "Handles missing natively", "Fast training"],
    color: "#3b82f6",
    icon: "⚡",
  },
  {
    name: "Logistic Regression",
    type: "Linear",
    suitability: 74,
    reason: "Interpretable baseline. After scaling and encoding, may achieve decent accuracy. Useful for comparison.",
    pros: ["Highly interpretable", "Fast inference", "Probabilistic output"],
    color: "#8b5cf6",
    icon: "📈",
  },
];

const DECISION_LOG = [
  { action: "Removed CustomerID", reason: "Unique identifier — no predictive value", impact: "High", time: "0.001s", status: "✅" },
  { action: "Median imputed Age", reason: "14.2% missing, skew=1.3", impact: "High", time: "0.023s", status: "✅" },
  { action: "Log-transformed Income", reason: "Skewness=4.7, normalized distribution", impact: "High", time: "0.018s", status: "✅" },
  { action: "One-hot encoded Gender", reason: "Nominal, 2 unique values, drop_first", impact: "Medium", time: "0.011s", status: "✅" },
  { action: "Ordinal encoded Contract_Type", reason: "Natural ordering detected", impact: "Medium", time: "0.009s", status: "✅" },
  { action: "Winsorized TotalCharges", reason: "35 outliers capped at IQR bounds", impact: "Medium", time: "0.034s", status: "✅" },
  { action: "Removed PhoneNumber", reason: "PII column, high-entropy string", impact: "Low", time: "0.002s", status: "✅" },
  { action: "Removed 47 duplicates", reason: "Exact row match deduplication", impact: "High", time: "0.041s", status: "✅" },
];

const BEFORE_AFTER = [
  { metric: "Missing Values", before: "1,203", after: "0", unit: "" },
  { metric: "Duplicate Rows", before: "47", after: "0", unit: "" },
  { metric: "Columns", before: "12", after: "14", unit: "(after encoding)" },
  { metric: "Health Score", before: "42", after: "93", unit: "/ 100" },
  { metric: "Skewed Features", before: "3", after: "0", unit: "" },
  { metric: "Outliers", before: "35", after: "0", unit: "(capped)" },
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

function HealthRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <div style={{ position: "relative", width: "120px", height: "120px" }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
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
          <span style={{ fontSize: "22px", fontWeight: 900, color }}>{score}</span>
          <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>/ 100</span>
        </div>
      </div>
      <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>{label}</span>
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
        style={{ padding: "0 40px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 50 }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: "9px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>⚡</div>
          <span style={{ fontWeight: 800, fontSize: "16px" }}>Forge<span style={{ color: "#60a5fa" }}>AI</span></span>
        </Link>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {[
            { label: "Upload", num: 1, done: true },
            { label: "AI Plan", num: 2, done: true },
            { label: "Results", num: 3, active: true },
          ].map((s, i) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{
                  width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "12px", fontWeight: 700,
                  background: s.done || s.active ? (s.done ? "linear-gradient(135deg,#10b981,#06b6d4)" : "linear-gradient(135deg,#3b82f6,#8b5cf6)") : "rgba(255,255,255,0.05)",
                  color: s.done || s.active ? "white" : "var(--text-muted)",
                }}>{s.done ? "✓" : s.num}</div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: s.active ? "var(--text-primary)" : "var(--text-muted)" }}>{s.label}</span>
              </div>
              {i < 2 && <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>›</span>}
            </div>
          ))}
        </div>

        <Link href="/upload">
          <button className="btn-secondary" style={{ padding: "8px 16px", fontSize: "13px" }}>
            + New Dataset
          </button>
        </Link>
      </nav>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 40px" }}>

        {/* Success banner */}
        <div
          style={{
            padding: "20px 28px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.08))",
            border: "1px solid rgba(16,185,129,0.25)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "36px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span style={{ fontSize: "24px" }}>🎉</span>
              <h1 style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" }}>
                <span className="gradient-text">customer_churn.csv</span> is ML-ready
              </h1>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              8 actions applied · 7,794 clean rows · Health Score: <strong style={{ color: "#f43f5e" }}>42</strong> → <strong style={{ color: "#10b981" }}>93</strong>
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              className="btn-primary"
              style={{ padding: "10px 20px", fontSize: "14px" }}
              onClick={() => {}}
            >
              <span>⬇️ Download Clean CSV</span>
            </button>
            <button
              className="btn-secondary"
              style={{ padding: "10px 20px", fontSize: "14px" }}
              onClick={() => {}}
            >
              ⬇️ Download Pipeline
            </button>
          </div>
        </div>

        {/* Health Score rings */}
        <div
          className="glass"
          style={{
            borderRadius: "20px",
            padding: "32px",
            border: "1px solid var(--border)",
            marginBottom: "28px",
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "wrap",
            gap: "24px",
          }}
        >
          <HealthRing score={42} label="Before Score" color="#f43f5e" />
          <div style={{ display: "flex", alignItems: "center", flexDirection: "column", justifyContent: "center", gap: "8px" }}>
            <div style={{ fontSize: "32px" }}>→</div>
            <span className="badge badge-emerald" style={{ fontSize: "11px" }}>+51 pts</span>
          </div>
          <HealthRing score={93} label="After Score" color="#10b981" />
          <div style={{ width: "1px", background: "var(--border)", height: "80px", alignSelf: "center" }} />
          <HealthRing score={97} label="Completeness" color="#3b82f6" />
          <HealthRing score={89} label="Consistency" color="#8b5cf6" />
          <HealthRing score={94} label="ML Readiness" color="#06b6d4" />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "4px", width: "fit-content" }}>
          {(["overview", "log", "pipeline", "models"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                transition: "all 0.2s",
                background: activeTab === tab ? "linear-gradient(135deg,#3b82f6,#8b5cf6)" : "transparent",
                color: activeTab === tab ? "white" : "var(--text-secondary)",
              }}
            >
              {tab === "overview" ? "📊 Overview" : tab === "log" ? "📋 AI Decision Log" : tab === "pipeline" ? "⚙️ Pipeline Code" : "🎯 ML Models"}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
              {/* Before / After table */}
              <div className="glass" style={{ borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                  <h3 style={{ fontWeight: 600, fontSize: "15px" }}>Before / After Comparison</h3>
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
                        <td style={{ color: "var(--text-primary)", fontFamily: "Inter, sans-serif" }}>{row.metric}</td>
                        <td style={{ color: "#fda4af" }}>{row.before}</td>
                        <td style={{ color: "#6ee7b7" }}>{row.after} {row.unit && <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{row.unit}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Download panel */}
              <div className="glass" style={{ borderRadius: "16px", border: "1px solid var(--border)", padding: "24px" }}>
                <h3 style={{ fontWeight: 600, fontSize: "15px", marginBottom: "20px" }}>📦 Download Artifacts</h3>
                {[
                  { name: "customer_churn_clean.csv", size: "892 KB", icon: "📄", color: "#10b981", desc: "ML-ready cleaned dataset" },
                  { name: "preprocessing_pipeline.py", size: "3.2 KB", icon: "⚙️", color: "#3b82f6", desc: "Reproducible Python pipeline" },
                  { name: "ai_decision_report.html", size: "48 KB", icon: "📊", color: "#8b5cf6", desc: "Full AI audit trail" },
                ].map((f) => (
                  <div
                    key={f.name}
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                      padding: "14px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      marginBottom: "10px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      background: "rgba(255,255,255,0.02)",
                    }}
                    className="card-hover"
                  >
                    <div style={{ fontSize: "24px" }}>{f.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "#93c5fd" }}>{f.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{f.desc} · {f.size}</div>
                    </div>
                    <div style={{ color: f.color, fontSize: "18px" }}>⬇️</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Decision Log tab */}
        {activeTab === "log" && (
          <div className="glass" style={{ borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ fontWeight: 600, fontSize: "15px" }}>📋 AI Decision Log</h3>
              <span className="badge badge-emerald" style={{ fontSize: "11px" }}>8 actions · all successful</span>
            </div>
            <table className="data-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Action</th>
                  <th>Reason</th>
                  <th>Impact</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {DECISION_LOG.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: "16px" }}>{row.status}</td>
                    <td style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, color: "var(--text-primary)" }}>{row.action}</td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{row.reason}</td>
                    <td>
                      <span
                        className={`badge ${row.impact === "High" ? "badge-rose" : row.impact === "Medium" ? "badge-amber" : "badge-blue"}`}
                        style={{ fontSize: "11px" }}
                      >
                        {row.impact}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pipeline Code tab */}
        {activeTab === "pipeline" && (
          <div className="glass" style={{ borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontWeight: 600, fontSize: "15px" }}>⚙️ preprocessing_pipeline.py</h3>
              <button
                onClick={copy}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  background: copied ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.1)",
                  border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(59,130,246,0.2)"}`,
                  color: copied ? "#6ee7b7" : "#93c5fd",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {copied ? "✓ Copied!" : "Copy Code"}
              </button>
            </div>
            <pre
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "13px",
                lineHeight: 1.7,
                padding: "24px",
                overflowX: "auto",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              <code>{PIPELINE_CODE}</code>
            </pre>
          </div>
        )}

        {/* ML Models tab */}
        {activeTab === "models" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {ML_MODELS.map((m) => (
              <div
                key={m.name}
                className="glass card-hover"
                style={{
                  borderRadius: "16px",
                  padding: "24px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  gap: "20px",
                  alignItems: "flex-start",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0, top: 0, bottom: 0,
                    width: "3px",
                    background: m.color,
                  }}
                />
                <div style={{ fontSize: "32px" }}>{m.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700 }}>{m.name}</h3>
                    <span
                      style={{
                        padding: "2px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: `${m.color}20`,
                        color: m.color,
                        border: `1px solid ${m.color}35`,
                      }}
                    >
                      {m.type}
                    </span>
                  </div>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "12px" }}>{m.reason}</p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {m.pros.map((p) => (
                      <span key={p} className="badge badge-blue" style={{ fontSize: "11px" }}>✓ {p}</span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "28px", fontWeight: 900, color: m.color }}>{m.suitability}%</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>suitability</div>
                  <div className="progress-bar" style={{ width: "80px" }}>
                    <div style={{ height: "100%", borderRadius: "3px", width: `${m.suitability}%`, background: m.color }} />
                  </div>
                </div>
              </div>
            ))}

            <div
              style={{
                padding: "16px 20px",
                borderRadius: "14px",
                background: "rgba(139,92,246,0.08)",
                border: "1px solid rgba(139,92,246,0.2)",
                fontSize: "14px",
                color: "#c4b5fd",
                lineHeight: 1.6,
              }}
            >
              🧠 <strong>Gemma recommends</strong> starting with <strong>Random Forest</strong> as your baseline — it handles 
              the class imbalance in your Churn column (73% / 27% split) without oversampling. 
              Consider <strong>SMOTE + XGBoost</strong> for production.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
