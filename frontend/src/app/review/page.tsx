"use client";
import { useState } from "react";
import Link from "next/link";

type ActionStatus = "keep" | "remove" | "modified";

interface DecisionItem {
  id: number;
  column: string;
  action: string;
  reason: string;
  confidence: number;
  type: string;
  status: ActionStatus;
  category: string;
}

const INITIAL_DECISIONS: DecisionItem[] = [
  {
    id: 1, column: "CustomerID", action: "Drop column", category: "Identifier Removal",
    reason: "Cardinality equals row count (100%). This column is a unique row identifier with zero predictive signal. Keeping it would add noise to any model.",
    confidence: 97, type: "drop", status: "keep",
  },
  {
    id: 2, column: "Age", action: "Median imputation", category: "Missing Value Handling",
    reason: "14.2% missing values. Distribution skewness of 1.3 makes median imputation (26.0) more robust than mean (29.4). Distribution remains intact.",
    confidence: 89, type: "impute", status: "keep",
  },
  {
    id: 3, column: "Income", action: "Log transform → Median impute → StandardScaler", category: "Feature Engineering",
    reason: "Skewness of 4.7 indicates heavy right tail. Log transform normalizes before imputation. 8.9% nulls filled with log-median. StandardScaler applied post-transform.",
    confidence: 94, type: "transform", status: "keep",
  },
  {
    id: 4, column: "Gender", action: "One-hot encoding (drop_first=True)", category: "Categorical Encoding",
    reason: "Nominal feature with 2 unique values [Male, Female]. 6.1% missing — mode imputation applied first. One-hot with drop_first avoids multicollinearity.",
    confidence: 91, type: "encode", status: "keep",
  },
  {
    id: 5, column: "Contract_Type", action: "Ordinal encoding", category: "Categorical Encoding",
    reason: "Ordinal feature: Month-to-month < One year < Two year. Natural ordering detected. Ordinal encoding preserves this relationship for tree-based models.",
    confidence: 86, type: "encode", status: "keep",
  },
  {
    id: 6, column: "TotalCharges", action: "IQR outlier capping + StandardScaler", category: "Outlier Treatment",
    reason: "35 outliers beyond 3× IQR detected. Winsorization at 5th/95th percentile. Scaling applied after capping to preserve legitimate extreme values.",
    confidence: 82, type: "outlier", status: "keep",
  },
  {
    id: 7, column: "PhoneNumber", action: "Drop column", category: "PII Removal",
    reason: "High-entropy string column. Regex match suggests phone number format. No numeric value extractable. Potential PII — recommended for removal.",
    confidence: 78, type: "drop", status: "keep",
  },
  {
    id: 8, column: "Duplicates", action: "Remove 47 duplicate rows", category: "Data Quality",
    reason: "47 exact duplicate rows detected (0.6% of dataset). Keeping duplicates would introduce sample bias. Deduplication applied before all transformations.",
    confidence: 99, type: "dedup", status: "keep",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Identifier Removal": "#f59e0b",
  "Missing Value Handling": "#8b5cf6",
  "Feature Engineering": "#06b6d4",
  "Categorical Encoding": "#3b82f6",
  "Outlier Treatment": "#f43f5e",
  "PII Removal": "#ec4899",
  "Data Quality": "#10b981",
};

const ACTION_ICONS: Record<string, string> = {
  drop: "🗑️",
  impute: "💉",
  transform: "⚗️",
  encode: "🔤",
  outlier: "📐",
  dedup: "🧹",
};

function ConfidenceBadge({ score }: { score: number }) {
  const color = score >= 90 ? "#10b981" : score >= 80 ? "#f59e0b" : "#f43f5e";
  const label = score >= 90 ? "High" : score >= 80 ? "Medium" : "Low";
  const cls = score >= 90 ? "badge-emerald" : score >= 80 ? "badge-amber" : "badge-rose";
  return (
    <div style={{ textAlign: "right", minWidth: "80px" }}>
      <span className={`badge ${cls}`} style={{ fontSize: "11px" }}>{label}</span>
      <div style={{ fontSize: "20px", fontWeight: 800, color, marginTop: "4px" }}>{score}%</div>
      <div className="progress-bar" style={{ width: "70px", marginTop: "4px", marginLeft: "auto" }}>
        <div
          style={{
            height: "100%", borderRadius: "3px",
            width: `${score}%`,
            background: score >= 90 ? "linear-gradient(90deg,#10b981,#06b6d4)" : score >= 80 ? "linear-gradient(90deg,#f59e0b,#f97316)" : "linear-gradient(90deg,#f43f5e,#ec4899)",
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const [decisions, setDecisions] = useState<DecisionItem[]>(INITIAL_DECISIONS);
  const [executing, setExecuting] = useState(false);
  const [done, setDone] = useState(false);
  const [filter, setFilter] = useState("all");

  const toggle = (id: number) => {
    setDecisions((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: d.status === "keep" ? "remove" : "keep" } : d
      )
    );
  };

  const keptCount = decisions.filter((d) => d.status === "keep").length;
  const removedCount = decisions.filter((d) => d.status === "remove").length;

  const categories = ["all", ...Array.from(new Set(decisions.map((d) => d.category)))];

  const filtered = filter === "all" ? decisions : decisions.filter((d) => d.category === filter);

  const executeApprove = () => {
    setExecuting(true);
    setTimeout(() => {
      setExecuting(false);
      setDone(true);
    }, 2800);
  };

  if (done) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px" }}>
        <div style={{ textAlign: "center", maxWidth: "500px" }}>
          <div style={{ fontSize: "80px", marginBottom: "24px" }}>🎉</div>
          <h1 style={{ fontSize: "36px", fontWeight: 800, marginBottom: "16px", letterSpacing: "-0.03em" }}>
            Plan <span className="gradient-text">executed!</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginBottom: "32px" }}>
            {keptCount} actions applied · {removedCount} overridden · Dataset is now ML-ready.
          </p>
          <Link href="/results">
            <button className="btn-primary" style={{ padding: "14px 32px", fontSize: "16px" }}>
              <span>View Results & Downloads →</span>
            </button>
          </Link>
        </div>
      </main>
    );
  }

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
            { label: "Upload", num: 1, active: false, done: true },
            { label: "AI Plan", num: 2, active: true, done: false },
            { label: "Results", num: 3, active: false, done: false },
          ].map((s, i) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div
                  style={{
                    width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700,
                    background: s.done ? "linear-gradient(135deg,#10b981,#06b6d4)" : s.active ? "linear-gradient(135deg, #3b82f6, #8b5cf6)" : "rgba(255,255,255,0.05)",
                    color: s.active || s.done ? "white" : "var(--text-muted)",
                    border: s.active || s.done ? "none" : "1px solid var(--border)",
                  }}
                >{s.done ? "✓" : s.num}</div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: s.active ? "var(--text-primary)" : "var(--text-muted)" }}>{s.label}</span>
              </div>
              {i < 2 && <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>›</span>}
            </div>
          ))}
        </div>

        {/* Approve button */}
        <button
          className="btn-primary"
          style={{ padding: "8px 20px", fontSize: "14px" }}
          onClick={executeApprove}
          disabled={executing}
        >
          <span>{executing ? "⏳ Executing..." : `✅ Approve & Execute (${keptCount})`}</span>
        </button>
      </nav>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 40px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "8px" }}>
              AI Preprocessing Plan
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
              Gemma analyzed <strong style={{ color: "#93c5fd" }}>customer_churn.csv</strong> and proposed {decisions.length} actions.{" "}
              <span style={{ color: "#6ee7b7" }}>{keptCount} approved</span> · <span style={{ color: "#fda4af" }}>{removedCount} removed</span>
            </p>
          </div>

          <div
            style={{
              padding: "12px 20px",
              borderRadius: "14px",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
              display: "flex",
              gap: "24px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#f43f5e" }}>42</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Current Score</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", fontSize: "20px", color: "var(--text-muted)" }}>→</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#10b981" }}>93</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Predicted Score</div>
            </div>
          </div>
        </div>

        {/* Gemma thinking banner */}
        <div
          style={{
            padding: "14px 20px",
            borderRadius: "12px",
            background: "rgba(139,92,246,0.08)",
            border: "1px solid rgba(139,92,246,0.2)",
            display: "flex",
            gap: "12px",
            alignItems: "center",
            marginBottom: "28px",
          }}
        >
          <span style={{ fontSize: "20px" }}>🧠</span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#c4b5fd", marginBottom: "2px" }}>Gemma 4 Analysis Complete</div>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              I identified 2 identifier columns, 3 numerical features requiring imputation, 2 categorical columns to encode, 
              and 35 outliers. Confidence is high across all decisions. You can override any action below.
            </div>
          </div>
        </div>

        {/* Category filter */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: "5px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                border: "none",
                background: filter === cat
                  ? (cat === "all" ? "linear-gradient(135deg,#3b82f6,#8b5cf6)" : `${CATEGORY_COLORS[cat]}25`)
                  : "rgba(255,255,255,0.05)",
                color: filter === cat
                  ? (cat === "all" ? "white" : CATEGORY_COLORS[cat] || "white")
                  : "var(--text-secondary)",
              }}
            >
              {cat === "all" ? "All Actions" : cat}
            </button>
          ))}
        </div>

        {/* Decision cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {filtered.map((d) => {
            const catColor = CATEGORY_COLORS[d.category] || "#3b82f6";
            const isKept = d.status === "keep";
            return (
              <div
                key={d.id}
                className="decision-card"
                style={{
                  borderRadius: "16px",
                  padding: "20px 24px",
                  border: `1px solid ${isKept ? "rgba(99,179,237,0.15)" : "rgba(244,63,94,0.15)"}`,
                  background: isKept ? "rgba(13,20,36,0.7)" : "rgba(244,63,94,0.04)",
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                  opacity: isKept ? 1 : 0.65,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Side accent */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "3px",
                    background: catColor,
                    opacity: isKept ? 0.7 : 0.2,
                  }}
                />

                {/* Toggle */}
                <button
                  onClick={() => toggle(d.id)}
                  title={isKept ? "Click to remove this action" : "Click to restore this action"}
                  style={{
                    flexShrink: 0,
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    border: `2px solid ${isKept ? "rgba(16,185,129,0.4)" : "rgba(244,63,94,0.4)"}`,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    background: isKept ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
                    transition: "all 0.2s ease",
                    marginTop: "2px",
                  }}
                >
                  {isKept ? "✓" : "✗"}
                </button>

                {/* Action icon */}
                <div
                  style={{
                    flexShrink: 0,
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: `${catColor}15`,
                    border: `1px solid ${catColor}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    marginTop: "2px",
                  }}
                >
                  {ACTION_ICONS[d.type]}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" }}>
                    <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "15px", fontWeight: 700, color: "#93c5fd" }}>
                      {d.column}
                    </code>
                    <span
                      style={{
                        padding: "2px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: `${catColor}20`,
                        color: catColor,
                        border: `1px solid ${catColor}35`,
                      }}
                    >
                      {d.action}
                    </span>
                    <span
                      style={{
                        padding: "1px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {d.category}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.65, maxWidth: "700px" }}>
                    {d.reason}
                  </p>
                </div>

                {/* Confidence */}
                <ConfidenceBadge score={d.confidence} />
              </div>
            );
          })}
        </div>

        {/* Bottom approve bar */}
        <div
          className="glass-bright"
          style={{
            position: "sticky",
            bottom: "24px",
            marginTop: "32px",
            borderRadius: "16px",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: "1px solid var(--border-bright)",
          }}
        >
          <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--text-primary)" }}>{keptCount} actions</strong> will be applied ·{" "}
            <strong style={{ color: "#fda4af" }}>{removedCount} removed</strong> by you
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Link href="/upload">
              <button className="btn-secondary" style={{ padding: "10px 20px", fontSize: "14px" }}>
                ← Re-upload
              </button>
            </Link>
            <button
              className="btn-primary"
              style={{ padding: "10px 28px", fontSize: "14px" }}
              onClick={executeApprove}
              disabled={executing}
            >
              <span>{executing ? "⏳ Executing..." : "✅ Execute Plan"}</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
