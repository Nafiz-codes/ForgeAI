"use client";
import { useState, useRef, useCallback, DragEvent } from "react";
import Link from "next/link";
import { SESSION_KEYS, downloadArtifact } from "@/lib/api";
import type { UploadResponse, ColumnAnalysis } from "@/lib/api";

type Stage = "idle" | "uploading" | "done" | "error";

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

export default function UploadPage() {
  const [stage, setStage]     = useState<Stage>("idle");
  const [dragging, setDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [profile, setProfile]   = useState<UploadResponse | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const doUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrorMsg("Only CSV files are supported.");
      setStage("error");
      return;
    }

    setStage("uploading");
    setErrorMsg("");

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail ?? `Server error ${res.status}`);
      }
      const data: UploadResponse = await res.json();

      // Persist for downstream pages
      sessionStorage.setItem(SESSION_KEYS.DATASET_ID, data.dataset_id);
      sessionStorage.setItem(SESSION_KEYS.UPLOAD, JSON.stringify(data));

      setProfile(data);
      setStage("done");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed. Is the backend running?");
      setStage("error");
    }
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) doUpload(file);
    },
    [doUpload]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
  };

  // Stat grid values derived from real profile
  const profileStats = profile
    ? [
        { label: "Rows",            value: profile.rows.toLocaleString(),            color: "#3b82f6" },
        { label: "Columns",         value: String(profile.columns),                  color: "#7c3aed" },
        { label: "Missing values",  value: profile.missing_total.toLocaleString(),   color: profile.missing_total > 0 ? "#d97706" : "#059669" },
        { label: "Duplicate rows",  value: profile.duplicate_rows.toLocaleString(),  color: profile.duplicate_rows > 0 ? "#e11d48" : "#059669" },
        { label: "Health score",    value: `${profile.health_score} / 100`,          color: profile.health_score < 60 ? "#e11d48" : "#059669" },
        { label: "Target column",   value: profile.target_column ?? "—",             color: "#059669" },
      ]
    : [];

  const previewKeys  = profile?.preview?.length ? Object.keys(profile.preview[0]) : [];

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Nav */}
      <nav
        className="glass"
        style={{
          padding: "0 36px", height: "56px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 50,
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
        <StepIndicator active={1} />
        <div style={{ width: "110px" }} />
      </nav>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "52px 36px" }}>
        {/* Page header */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "10px", lineHeight: 1.15 }}>
            Upload your <span className="gradient-text">dataset</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
            Drop any CSV — missing values, duplicates, unformatted columns. ForgeAI will take care of it.
          </p>
        </div>

        {/* ── IDLE ─────────────────────────────────────────────── */}
        {(stage === "idle" || stage === "error") && (
          <>
            <div
              className={`upload-zone ${dragging ? "drag-over" : ""}`}
              style={{
                borderRadius: "14px", padding: "72px 40px",
                textAlign: "center", cursor: "pointer",
                background: dragging ? "rgba(37,99,235,0.05)" : "rgba(15,21,36,0.6)",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <div
                style={{
                  width: "48px", height: "48px", borderRadius: "12px",
                  background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", letterSpacing: "-0.01em" }}>
                {dragging ? "Drop it here" : "Drag and drop your CSV"}
              </h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "22px", fontSize: "14px" }}>
                or click to browse — supports files up to 100 MB
              </p>
              <button className="btn-secondary" style={{ pointerEvents: "none" }}>Choose file</button>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={onFileChange} />
            </div>

            {/* Error banner */}
            {stage === "error" && (
              <div
                style={{
                  marginTop: "16px", padding: "12px 18px", borderRadius: "9px",
                  background: "rgba(225,29,72,0.08)", border: "1px solid rgba(225,29,72,0.25)",
                  fontSize: "13px", color: "#fda4af",
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Sample datasets */}
            <div style={{ marginTop: "24px" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                Or start with a sample
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
                Drop one of these CSV files from the backend&apos;s <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>datasets/</code> folder to try it out.
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                {["titanic.csv", "customer_churn.csv", "heart_disease.csv", "iris.csv", "adult_income.csv"].map((name) => (
                  <span
                    key={name}
                    style={{
                      padding: "4px 11px", borderRadius: "6px",
                      background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-strong)",
                      color: "var(--text-muted)", fontSize: "12px",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── UPLOADING ─────────────────────────────────────────── */}
        {stage === "uploading" && (
          <div
            style={{
              borderRadius: "14px", padding: "72px 40px", textAlign: "center",
              border: "1px solid var(--border)", background: "var(--bg-card)",
            }}
          >
            <div
              style={{
                width: "44px", height: "44px", borderRadius: "50%",
                border: "2px solid var(--border)", borderTopColor: "#7c3aed",
                animation: "spin-slow 0.9s linear infinite", margin: "0 auto 24px",
              }}
            />
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              Uploading & analyzing
            </p>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px", letterSpacing: "-0.02em" }}>
              Gemma is profiling your data
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
              Checking distributions, nulls, cardinality, and outliers...
            </p>
            <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
              {["Scanning columns", "Detecting outliers", "Analyzing distributions", "Scoring health"].map((t) => (
                <span key={t} className="badge badge-violet" style={{ fontSize: "11px" }}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── DONE ─────────────────────────────────────────────── */}
        {stage === "done" && profile && (
          <div>
            {/* Success notice */}
            <div
              style={{
                padding: "14px 20px", borderRadius: "10px",
                background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.22)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: "28px", flexWrap: "wrap", gap: "12px",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: "#6ee7b7", marginBottom: "2px", fontSize: "14px" }}>
                  Analysis complete
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  {profile.rows.toLocaleString()} rows · {profile.columns} columns
                  {profile.target_column ? ` · target: ${profile.target_column}` : ""}
                  {profile.ai_available
                    ? " · AI plan ready"
                    : " · AI plan unavailable — rule-based fallback will be used"}
                </div>
              </div>
              <Link href="/review">
                <button className="btn-primary" style={{ padding: "8px 18px", fontSize: "13px" }}>
                  <span>Review AI plan</span>
                </button>
              </Link>
            </div>

            {/* Gemma summary if available */}
            {profile.ai_summary && (
              <div
                style={{
                  padding: "13px 18px", borderRadius: "9px", marginBottom: "22px",
                  background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)",
                  fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.65,
                }}
              >
                <strong style={{ color: "#c4b5fd", fontWeight: 600 }}>Gemma&apos;s first look: </strong>
                {profile.ai_summary}
              </div>
            )}

            {/* Stats grid */}
            <div
              style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "1px", background: "var(--border-subtle)",
                border: "1px solid var(--border-subtle)", borderRadius: "12px",
                overflow: "hidden", marginBottom: "24px",
              }}
            >
              {profileStats.map((s) => (
                <div key={s.label} style={{ padding: "18px 20px", background: "var(--bg-card)" }}>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: s.color, letterSpacing: "-0.02em", marginBottom: "4px" }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Data preview */}
            {profile.preview.length > 0 && (
              <div style={{ borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden", marginBottom: "20px" }}>
                <div
                  style={{
                    padding: "12px 18px", borderBottom: "1px solid var(--border)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "var(--bg-secondary)",
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: "13px" }}>Data preview</span>
                  <span className="badge badge-blue">First 5 rows</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        {previewKeys.map((k) => <th key={k}>{k}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {profile.preview.map((row, i) => (
                        <tr key={i}>
                          {previewKeys.map((k, j) => (
                            <td key={j} style={{ color: row[k] === null ? "#e11d48" : undefined }}>
                              {row[k] === null ? "null" : String(row[k])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Column analysis */}
            {profile.column_analysis.length > 0 && (
              <div style={{ borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                  <span style={{ fontWeight: 600, fontSize: "13px" }}>Column analysis</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Column</th>
                        <th>Type</th>
                        <th>Missing</th>
                        <th>Unique</th>
                        <th>Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.column_analysis.map((col: ColumnAnalysis) => (
                        <tr key={col.name}>
                          <td>
                            <code style={{ fontFamily: "'JetBrains Mono', monospace", color: "#93c5fd", fontSize: "13px" }}>
                              {col.name}
                            </code>
                          </td>
                          <td>
                            <span className="badge badge-blue" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {col.type}
                            </span>
                          </td>
                          <td style={{ color: col.missing_pct > 0 ? "#fcd34d" : "#6ee7b7" }}>
                            {col.missing_pct}%
                          </td>
                          <td>{col.unique_count.toLocaleString()}</td>
                          <td>
                            <span className={`badge ${col.flagClass}`}>{col.flag}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
