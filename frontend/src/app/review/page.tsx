"use client";
import { useState } from "react";
import Link from "next/link";

type ActionStatus = "keep" | "remove";

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
    id: 1, column: "CustomerID", action: "Drop column", category: "Identifier removal",
    reason: "Cardinality equals row count (100%). This column is a unique row identifier with no predictive signal. Including it would add noise and potentially cause data leakage.",
    confidence: 97, type: "drop", status: "keep",
  },
  {
    id: 2, column: "Age", action: "Median imputation", category: "Missing values",
    reason: "14.2% missing. Distribution skewness of 1.3 makes median (26.0) more appropriate than mean (29.4). The median is less sensitive to the long right tail.",
    confidence: 89, type: "impute", status: "keep",
  },
  {
    id: 3, column: "Income", action: "Log transform + median impute + StandardScaler", category: "Feature engineering",
    reason: "Skewness of 4.7 indicates a heavy right tail. Log transform normalizes before imputation. 8.9% nulls filled with log-median. StandardScaler applied post-transform.",
    confidence: 94, type: "transform", status: "keep",
  },
  {
    id: 4, column: "Gender", action: "One-hot encoding (drop_first=True)", category: "Encoding",
    reason: "Nominal feature with 2 unique values. 6.1% missing — mode imputation applied first. One-hot with drop_first avoids multicollinearity in linear models.",
    confidence: 91, type: "encode", status: "keep",
  },
  {
    id: 5, column: "Contract_Type", action: "Ordinal encoding", category: "Encoding",
    reason: "Natural ordering detected: Month-to-month < One year < Two year. Ordinal encoding preserves this relationship, which is meaningful for tree-based models.",
    confidence: 86, type: "encode", status: "keep",
  },
  {
    id: 6, column: "TotalCharges", action: "IQR capping + StandardScaler", category: "Outlier treatment",
    reason: "35 outliers beyond 3× IQR detected. Winsorization at 5th/95th percentile caps extremes without removing rows. Scaling applied after capping.",
    confidence: 82, type: "outlier", status: "keep",
  },
  {
    id: 7, column: "PhoneNumber", action: "Drop column", category: "PII removal",
    reason: "High-entropy string column. Pattern matches phone number format. No numeric signal is extractable. Potential PII — recommended for removal before any model training.",
    confidence: 78, type: "drop", status: "keep",
  },
  {
    id: 8, column: "Duplicates", action: "Remove 47 duplicate rows", category: "Data quality",
    reason: "47 exact duplicate rows found (0.6% of dataset). Duplicates introduce sample bias and can inflate model performance metrics. Deduplication runs first.",
    confidence: 99, type: "dedup", status: "keep",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Identifier removal": "#d97706",
  "Missing values": "#7c3aed",
  "Feature engineering": "#0ea5e9",
  "Encoding": "#2563eb",
  "Outlier treatment": "#e11d48",
  "PII removal": "#ec4899",
  "Data quality": "#059669",
};

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
                  width: "22px", height: "22px", borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700,
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

function ConfidenceBadge({ score }: { score: number }) {
  const color = score >= 90 ? "#059669" : score >= 80 ? "#d97706" : "#e11d48";
  const cls = score >= 90 ? "badge-emerald" : score >= 80 ? "badge-amber" : "badge-rose";
  const label = score >= 90 ? "High" : score >= 80 ? "Med" : "Low";

  return (
    <div style={{ textAlign: "right", minWidth: "72px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", marginBottom: "4px" }}>
        <span className={`badge ${cls}`}>{label}</span>
        <span style={{ fontSize: "16px", fontWeight: 800, color }}>{score}%</span>
      </div>
      <div className="progress-bar" style={{ width: "60px", marginLeft: "auto" }}>
        <div
          style={{
            height: "100%", borderRadius: "2px",
            width: `${score}%`,
            background: score >= 90
              ? "linear-gradient(90deg,#059669,#0ea5e9)"
              : score >= 80
              ? "linear-gradient(90deg,#d97706,#f97316)"
              : "linear-gradient(90deg,#e11d48,#ec4899)",
            transition: "width 0.4s ease",
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
      <main
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "480px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "rgba(5,150,105,0.12)",
              border: "1px solid rgba(5,150,105,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: "24px",
            }}
          >
            ✓
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "14px", letterSpacing: "-0.03em" }}>
            Plan <span className="gradient-text">executed</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginBottom: "32px", lineHeight: 1.65 }}>
            {keptCount} actions applied · {removedCount} skipped · your dataset is now ML-ready.
          </p>
          <Link href="/results">
            <button className="btn-primary" style={{ padding: "12px 30px", fontSize: "15px" }}>
              <span>View results and downloads</span>
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

        <StepIndicator active={2} />

        <button
          className="btn-primary"
          style={{ padding: "7px 16px", fontSize: "13px" }}
          onClick={executeApprove}
          disabled={executing}
        >
          <span>{executing ? "Running..." : `Execute (${keptCount} actions)`}</span>
        </button>
      </nav>

      <div style={{ maxWidth: "1060px", margin: "0 auto", padding: "44px 36px" }}>
        {/* Page header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "28px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "8px" }}>
              AI Preprocessing Plan
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Gemma analyzed{" "}
              <code style={{ fontFamily: "'JetBrains Mono', monospace", color: "#93c5fd", fontSize: "13px" }}>
                customer_churn.csv
              </code>{" "}
              and proposed {decisions.length} actions.{" "}
              <span style={{ color: "#6ee7b7" }}>{keptCount} approved</span>
              {removedCount > 0 && (
                <span> · <span style={{ color: "#fda4af" }}>{removedCount} skipped</span></span>
              )}
            </p>
          </div>

          {/* Score delta */}
          <div
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              display: "flex",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#e11d48", letterSpacing: "-0.02em" }}>42</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>current</div>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>→</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#059669", letterSpacing: "-0.02em" }}>93</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>predicted</div>
            </div>
          </div>
        </div>

        {/* Gemma analysis note */}
        <div
          style={{
            padding: "13px 18px",
            borderRadius: "9px",
            background: "rgba(124,58,237,0.06)",
            border: "1px solid rgba(124,58,237,0.18)",
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#a78bfa",
              marginTop: "6px",
              flexShrink: 0,
            }}
          />
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.65 }}>
            <strong style={{ color: "#c4b5fd", fontWeight: 600 }}>Gemma identified</strong> 2 identifier columns,
            3 numerical features needing imputation, 2 categorical columns to encode, and 35 outliers.
            Toggle any action to include or skip it — nothing runs until you confirm.
          </div>
        </div>

        {/* Category filter */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
          {categories.map((cat) => {
            const isActive = filter === cat;
            const catColor = cat === "all" ? "#2563eb" : CATEGORY_COLORS[cat] || "#2563eb";
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  border: "1px solid",
                  transition: "all 0.15s",
                  borderColor: isActive ? `${catColor}50` : "var(--border)",
                  background: isActive ? `${catColor}12` : "transparent",
                  color: isActive ? catColor : "var(--text-muted)",
                }}
              >
                {cat === "all" ? "All" : cat}
              </button>
            );
          })}
        </div>

        {/* Decision cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((d) => {
            const catColor = CATEGORY_COLORS[d.category] || "#2563eb";
            const isKept = d.status === "keep";
            return (
              <div
                key={d.id}
                className="decision-card"
                style={{
                  borderRadius: "12px",
                  padding: "18px 20px",
                  border: `1px solid ${isKept ? "var(--border)" : "rgba(225,29,72,0.18)"}`,
                  background: isKept ? "var(--bg-card)" : "rgba(225,29,72,0.03)",
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                  opacity: isKept ? 1 : 0.55,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Left accent line */}
                <div
                  style={{
                    position: "absolute",
                    left: 0, top: 0, bottom: 0,
                    width: "2px",
                    background: catColor,
                    opacity: isKept ? 0.6 : 0.2,
                  }}
                />

                {/* Toggle */}
                <button
                  onClick={() => toggle(d.id)}
                  title={isKept ? "Skip this action" : "Restore this action"}
                  style={{
                    flexShrink: 0,
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    border: `1px solid ${isKept ? "rgba(5,150,105,0.35)" : "rgba(225,29,72,0.35)"}`,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    background: isKept ? "rgba(5,150,105,0.08)" : "rgba(225,29,72,0.08)",
                    transition: "all 0.18s ease",
                    color: isKept ? "#6ee7b7" : "#fda4af",
                    fontWeight: 600,
                    marginTop: "1px",
                  }}
                >
                  {isKept ? "✓" : "✗"}
                </button>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "6px" }}>
                    <code
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#93c5fd",
                      }}
                    >
                      {d.column}
                    </code>
                    <span
                      style={{
                        padding: "2px 9px",
                        borderRadius: "5px",
                        fontSize: "12px",
                        fontWeight: 500,
                        background: `${catColor}14`,
                        color: catColor,
                        border: `1px solid ${catColor}28`,
                      }}
                    >
                      {d.action}
                    </span>
                    <span
                      style={{
                        padding: "1px 8px",
                        borderRadius: "5px",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {d.category}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.65, maxWidth: "680px" }}>
                    {d.reason}
                  </p>
                </div>

                <ConfidenceBadge score={d.confidence} />
              </div>
            );
          })}
        </div>

        {/* Bottom confirmation bar */}
        <div
          className="glass-bright"
          style={{
            position: "sticky",
            bottom: "20px",
            marginTop: "28px",
            borderRadius: "12px",
            padding: "14px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: "1px solid var(--border-strong)",
          }}
        >
          <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{keptCount} actions</strong> will run
            {removedCount > 0 && (
              <span> · <strong style={{ color: "#fda4af", fontWeight: 600 }}>{removedCount}</strong> skipped</span>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link href="/upload">
              <button className="btn-secondary" style={{ padding: "8px 16px", fontSize: "13px" }}>
                Back to upload
              </button>
            </Link>
            <button
              className="btn-primary"
              style={{ padding: "8px 22px", fontSize: "13px" }}
              onClick={executeApprove}
              disabled={executing}
            >
              <span>{executing ? "Running..." : "Execute plan"}</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
