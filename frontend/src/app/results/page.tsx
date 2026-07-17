"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SESSION_KEYS, downloadArtifact } from "@/lib/api";
import type { ExecuteResponse, DecisionLogEntry, MlRecommendation } from "@/lib/api";
import { DarkModeToggle, useTheme } from "@/lib/theme";

// ── Tab definitions ────────────────────────────────────────────────────────
const TABS = [
  { id: "overview",  label: "Overview" },
  { id: "log",       label: "Decision log" },
  { id: "pipeline",  label: "Pipeline code" },
  { id: "models",    label: "Model suggestions" },
] as const;

type TabId = typeof TABS[number]["id"];

// ── Step Indicator ─────────────────────────────────────────────────────────
function StepIndicator({ active }: { active: 1 | 2 | 3 }) {
  const steps = [
    { label: "Upload", num: 1 },
    { label: "Review plan", num: 2 },
    { label: "Results", num: 3 },
  ];
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      {steps.map((s, i) => {
        const isDone   = s.num < active;
        const isActive = s.num === active;
        return (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "22px", height: "22px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 700,
                  background: isDone ? "#059669" : isActive ? "#2563eb" : "var(--toggle-bg)",
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

// ── Health Ring SVG ────────────────────────────────────────────────────────
function HealthRing({ score, label, color, isDark }: { score: number; label: string; color: string; isDark: boolean }) {
  const r    = 44;
  const circ = 2 * Math.PI * r;
  const pct  = score / 100;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <div style={{ position: "relative", width: "110px", height: "110px" }}>
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r={r} fill="none" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"} strokeWidth="9" />
          <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="9"
            strokeDasharray={`${circ * pct} ${circ}`}
            strokeDashoffset={circ * 0.25}
            strokeLinecap="round"
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color, letterSpacing: "-0.02em" }}>{score}</span>
          <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 500 }}>/ 100</span>
        </div>
      </div>
      <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ── Stat Card (for the top summary row) ────────────────────────────────────
function StatCard({ value, label, sublabel, color, isDark }: {
  value: string;
  label: string;
  sublabel?: string;
  color: string;
  isDark: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: "160px",
        padding: "24px 22px",
        borderRadius: "14px",
        background: isDark ? "var(--bg-card)" : "#ffffff",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-card)",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: 900, color, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{value}</div>
      {sublabel && <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{sublabel}</div>}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [results,    setResults]    = useState<ExecuteResponse | null>(null);
  const [activeTab,  setActiveTab]  = useState<TabId>("overview");
  const [copied,     setCopied]     = useState(false);
  const [dlError,    setDlError]    = useState("");
  const [notFound,   setNotFound]   = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEYS.RESULTS);
    if (!raw) { setNotFound(true); return; }
    try {
      setResults(JSON.parse(raw) as ExecuteResponse);
    } catch {
      setNotFound(true);
    }
  }, []);

  const startOver = () => {
    sessionStorage.removeItem(SESSION_KEYS.DATASET_ID);
    sessionStorage.removeItem(SESSION_KEYS.UPLOAD);
    sessionStorage.removeItem(SESSION_KEYS.RESULTS);
    router.push("/upload");
  };

  const handleDownload = async (type: "csv" | "pipeline" | "report") => {
    if (!results) return;
    setDlError("");
    try {
      const base  = results.dataset_name.replace(".csv", "");
      const fname = type === "csv" ? `${base}_clean.csv` : type === "pipeline" ? "pipeline.py" : "report.html";
      await downloadArtifact(results.job_id, type, fname);
    } catch (err: unknown) {
      setDlError(err instanceof Error ? err.message : "Download failed.");
    }
  };

  const copyCode = () => {
    if (!results?.pipeline_code) return;
    navigator.clipboard.writeText(results.pipeline_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Not found state ──────────────────────────────────────────────────────
  if (notFound) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px" }}>
        <div style={{ textAlign: "center", maxWidth: "420px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "14px", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            No results found
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "28px", lineHeight: 1.65 }}>
            Results are stored in your browser session and weren&apos;t found. Please upload a dataset and execute a plan first.
          </p>
          <Link href="/upload">
            <button className="btn-primary" style={{ padding: "10px 24px" }}>
              <span>Start from upload</span>
            </button>
          </Link>
        </div>
      </main>
    );
  }

  if (!results) return null;

  const beforeAfterRows = [
    { metric: "Rows",         before: results.rows_before.toLocaleString(),    after: results.rows_after.toLocaleString() },
    { metric: "Columns",      before: String(results.columns_before),          after: String(results.columns_after) },
    { metric: "Health score", before: String(results.health_score_before),     after: String(results.health_score_after) },
    { metric: "Completeness", before: "—",                                      after: `${results.completeness_score}%` },
    { metric: "Consistency",  before: "—",                                      after: `${results.consistency_score}%` },
    { metric: "ML readiness", before: "—",                                      after: `${results.ml_readiness_score}%` },
  ];

  const scoreDelta = results.health_score_after - results.health_score_before;
  const navBg = isDark ? "rgba(8,12,20,0.92)" : "rgba(255,255,255,0.95)";

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Nav */}
      <nav
        style={{
          padding: "0 36px", height: "58px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: navBg,
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)",
          position: "sticky", top: 0, zIndex: 50,
          boxShadow: isDark ? "none" : "0 1px 8px rgba(0,0,40,0.07)",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <rect width="22" height="22" rx="6" fill="#2563eb"/>
            <path d="M7 11.5L10 14.5L15 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            Forge<span style={{ color: "#60a5fa" }}>AI</span>
          </span>
        </Link>

        <StepIndicator active={3} />

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <DarkModeToggle />
          <button className="btn-secondary" style={{ padding: "6px 14px", fontSize: "13px" }} onClick={startOver}>
            New dataset
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: "1060px", margin: "0 auto", padding: "40px 36px" }}>

        {/* Download error */}
        {dlError && (
          <div
            style={{
              padding: "10px 16px", borderRadius: "8px", marginBottom: "14px",
              background: "rgba(225,29,72,0.07)", border: "1px solid rgba(225,29,72,0.2)",
              fontSize: "13px", color: isDark ? "#fda4af" : "#e11d48",
            }}
          >
            {dlError}
          </div>
        )}

        {/* ── Top stat cards (DataPrecision AI style) ─────────────────────── */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
          <StatCard
            value={`+${scoreDelta}`}
            label="Health score gain"
            sublabel="Points improvement"
            color="#059669"
            isDark={isDark}
          />
          <StatCard
            value={`${results.health_score_after}`}
            label="Final health score"
            sublabel={`Was ${results.health_score_before} before`}
            color={results.health_score_after >= 80 ? "#059669" : "#d97706"}
            isDark={isDark}
          />
          <StatCard
            value={`${results.actions_applied}`}
            label="Actions applied"
            sublabel="All succeeded"
            color="#2563eb"
            isDark={isDark}
          />
          <StatCard
            value={`${results.rows_after.toLocaleString()}`}
            label="Clean rows"
            sublabel={`${results.rows_before.toLocaleString()} before`}
            color="#7c3aed"
            isDark={isDark}
          />
        </div>

        {/* Completion banner */}
        <div
          style={{
            padding: "18px 22px", borderRadius: "12px",
            background: isDark
              ? "linear-gradient(135deg, rgba(5,150,105,0.08), rgba(14,165,233,0.05))"
              : "linear-gradient(135deg, rgba(5,150,105,0.07), rgba(37,99,235,0.05))",
            border: "1px solid rgba(5,150,105,0.2)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "24px", flexWrap: "wrap", gap: "14px",
            boxShadow: isDark ? "none" : "var(--shadow-card)",
          }}
        >
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "5px", color: "var(--text-primary)" }}>
              <code style={{ fontFamily: "'JetBrains Mono', monospace", color: isDark ? "#67e8f9" : "#0284c7" }}>
                {results.dataset_name}
              </code>{" "}
              is ML-ready
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
              {results.actions_applied} actions applied · {results.rows_after.toLocaleString()} clean rows · health{" "}
              <strong style={{ color: results.health_score_before < 60 ? "#e11d48" : "#d97706" }}>
                {results.health_score_before}
              </strong>{" "}→{" "}
              <strong style={{ color: "#059669" }}>{results.health_score_after}</strong>
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button className="btn-primary" style={{ padding: "8px 18px", fontSize: "13px" }} onClick={() => handleDownload("csv")}>
              <span>Download clean CSV</span>
            </button>
            <button className="btn-secondary" style={{ padding: "8px 18px", fontSize: "13px" }} onClick={() => handleDownload("pipeline")}>
              Download pipeline
            </button>
          </div>
        </div>

        {/* Health rings panel */}
        <div
          style={{
            borderRadius: "14px", padding: "28px",
            border: "1px solid var(--border)",
            background: isDark ? "var(--bg-card)" : "#ffffff",
            marginBottom: "22px",
            display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "20px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Score Change</div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <HealthRing score={results.health_score_before} label="Before" color="#e11d48" isDark={isDark} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "20px", color: "var(--text-muted)" }}>→</span>
                <span className="badge badge-emerald">+{scoreDelta} pts</span>
              </div>
              <HealthRing score={results.health_score_after} label="After" color="#059669" isDark={isDark} />
            </div>
          </div>

          <div style={{ width: "1px", background: "var(--border-subtle)", alignSelf: "stretch" }} />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Quality Breakdown</div>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "center" }}>
              <HealthRing score={results.completeness_score}  label="Completeness" color="#2563eb" isDark={isDark} />
              <HealthRing score={results.consistency_score}   label="Consistency"  color="#7c3aed" isDark={isDark} />
              <HealthRing score={results.ml_readiness_score}  label="ML readiness" color="#0ea5e9" isDark={isDark} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex", gap: "2px", marginBottom: "20px",
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            borderRadius: "10px",
            padding: "3px", width: "fit-content",
            border: "1px solid var(--border)",
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "7px 18px", borderRadius: "8px", fontSize: "13px",
                fontWeight: activeTab === tab.id ? 600 : 400, cursor: "pointer",
                border: "none", transition: "all 0.15s",
                background: activeTab === tab.id ? "#2563eb" : "transparent",
                color: activeTab === tab.id ? "white" : "var(--text-muted)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview ──────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            {/* Before / After */}
            <div
              style={{
                borderRadius: "12px", border: "1px solid var(--border)",
                overflow: "hidden",
                background: isDark ? "var(--bg-card)" : "#ffffff",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div
                style={{
                  padding: "12px 18px", borderBottom: "1px solid var(--border)",
                  background: isDark ? "var(--bg-secondary)" : "#f8faff",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>Before / After</span>
              </div>
              <table className="data-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th style={{ color: "#e11d48" }}>Before</th>
                    <th style={{ color: "#059669" }}>After</th>
                  </tr>
                </thead>
                <tbody>
                  {beforeAfterRows.map((row) => (
                    <tr key={row.metric}>
                      <td>{row.metric}</td>
                      <td style={{ color: isDark ? "#fda4af" : "#e11d48", fontFamily: "'JetBrains Mono', monospace" }}>{row.before}</td>
                      <td style={{ color: "#059669", fontFamily: "'JetBrains Mono', monospace" }}>{row.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Downloads */}
            <div
              style={{
                borderRadius: "12px", border: "1px solid var(--border)",
                background: isDark ? "var(--bg-card)" : "#ffffff",
                overflow: "hidden",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div
                style={{
                  padding: "12px 18px", borderBottom: "1px solid var(--border)",
                  background: isDark ? "var(--bg-secondary)" : "#f8faff",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>Download artifacts</span>
              </div>
              <div style={{ padding: "12px" }}>
                {([
                  { type: "csv"      as const, label: `${results.dataset_name.replace(".csv","")}_clean.csv`, desc: "ML-ready cleaned dataset", color: "#059669" },
                  { type: "pipeline" as const, label: "preprocessing_pipeline.py",                            desc: "Reproducible Python pipeline", color: "#2563eb" },
                  { type: "report"   as const, label: "ai_decision_report.html",                              desc: "Full AI audit trail (opens in tab)", color: "#7c3aed" },
                ]).map((f) => (
                  <div
                    key={f.type}
                    className="card-hover"
                    onClick={() => handleDownload(f.type)}
                    style={{
                      display: "flex", gap: "12px", alignItems: "center",
                      padding: "12px", borderRadius: "8px",
                      border: "1px solid var(--border)",
                      marginBottom: "6px", cursor: "pointer",
                      background: "transparent",
                    }}
                  >
                    <div
                      style={{
                        width: "32px", height: "32px", borderRadius: "7px",
                        background: `${f.color}14`, border: `1px solid ${f.color}28`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={f.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: isDark ? "#93c5fd" : "#2563eb", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.label}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{f.desc}</div>
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

        {/* ── Decision log ──────────────────────────────────────────────────── */}
        {activeTab === "log" && (
          <div
            style={{
              borderRadius: "12px", border: "1px solid var(--border)",
              overflow: "hidden",
              background: isDark ? "var(--bg-card)" : "#ffffff",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                padding: "12px 18px", borderBottom: "1px solid var(--border)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: isDark ? "var(--bg-secondary)" : "#f8faff",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>AI decision log</span>
              <span className="badge badge-emerald">{results.actions_applied} actions · all succeeded</span>
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
                {results.decision_log.map((row: DecisionLogEntry, i: number) => (
                  <tr key={i}>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{row.action}</td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{row.reason}</td>
                    <td>
                      <span className={`badge ${row.impact === "High" ? "badge-rose" : row.impact === "Medium" ? "badge-amber" : "badge-blue"}`}>
                        {row.impact}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>
                      {row.time_ms}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pipeline code ─────────────────────────────────────────────────── */}
        {activeTab === "pipeline" && (
          <div
            style={{
              borderRadius: "12px", border: "1px solid var(--border)",
              overflow: "hidden",
              background: isDark ? "var(--bg-card)" : "#ffffff",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                padding: "12px 18px", borderBottom: "1px solid var(--border)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: isDark ? "var(--bg-secondary)" : "#f8faff",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "13px", fontFamily: "'JetBrains Mono', monospace", color: "var(--text-primary)" }}>
                preprocessing_pipeline.py
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={copyCode}
                  style={{
                    padding: "5px 12px", borderRadius: "6px",
                    background: copied ? "rgba(5,150,105,0.12)" : "var(--toggle-bg)",
                    border: `1px solid ${copied ? "rgba(5,150,105,0.25)" : "var(--border-strong)"}`,
                    color: copied ? "#059669" : "var(--text-secondary)",
                    fontSize: "12px", fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={() => handleDownload("pipeline")}
                  style={{
                    padding: "5px 12px", borderRadius: "6px",
                    background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)",
                    color: isDark ? "#93c5fd" : "#2563eb", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                  }}
                >
                  Download
                </button>
              </div>
            </div>
            <pre
              style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "12px",
                lineHeight: 1.75, padding: "22px", overflowX: "auto",
                color: "var(--text-secondary)", margin: 0,
                background: isDark ? "transparent" : "#f8faff",
              }}
            >
              <code>{results.pipeline_code}</code>
            </pre>
          </div>
        )}

        {/* ── ML Models ─────────────────────────────────────────────────────── */}
        {activeTab === "models" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {results.ml_recommendations.map((m: MlRecommendation, rank: number) => {
              const modelColors: Record<string, string> = {
                "Random Forest":       "#059669",
                "XGBoost":             "#2563eb",
                "Logistic Regression": "#7c3aed",
                "Decision Tree":       "#d97706",
                "SVM":                 "#0ea5e9",
                "Neural Network":      "#ec4899",
              };
              const color = modelColors[m.model] ?? "#2563eb";
              return (
                <div
                  key={m.model}
                  style={{
                    borderRadius: "12px", padding: "20px 22px",
                    border: "1px solid var(--border)",
                    background: isDark ? "var(--bg-card)" : "#ffffff",
                    boxShadow: "var(--shadow-card)",
                    display: "flex", gap: "16px", alignItems: "flex-start",
                    position: "relative", overflow: "hidden",
                  }}
                >
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: color, opacity: 0.7, borderRadius: "2px 0 0 2px" }} />
                  <div
                    style={{
                      flexShrink: 0, width: "28px", height: "28px", borderRadius: "7px",
                      background: `${color}14`, border: `1px solid ${color}28`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "13px", fontWeight: 800, color, marginTop: "1px",
                    }}
                  >
                    {rank + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "7px", flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>{m.model}</h3>
                      <span style={{ padding: "1px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: 500, background: `${color}12`, color, border: `1px solid ${color}28` }}>
                        {m.type}
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: "10px" }}>
                      {m.reason}
                    </p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {(m.pros ?? []).map((p: string) => (
                        <span key={p} className="badge badge-blue" style={{ fontSize: "11px" }}>{p}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "24px", fontWeight: 900, color, letterSpacing: "-0.02em" }}>
                      {m.suitability}%
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "5px" }}>suitability</div>
                    <div className="progress-bar" style={{ width: "72px" }}>
                      <div style={{ height: "100%", borderRadius: "2px", width: `${m.suitability}%`, background: color }} />
                    </div>
                  </div>
                </div>
              );
            })}

            {results.ml_recommendations.length === 0 && (
              <div style={{ padding: "28px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                No model recommendations were returned for this dataset.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
