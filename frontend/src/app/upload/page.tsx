"use client";
import { useState, useRef, useCallback, DragEvent } from "react";
import Link from "next/link";

const SAMPLE_DATA = [
  { CustomerID: "C001", Age: "34", Gender: "Male", Income: "52000", Churn: "0" },
  { CustomerID: "C002", Age: "", Gender: "Female", Income: "71000", Churn: "1" },
  { CustomerID: "C003", Age: "45", Gender: "", Income: "", Churn: "0" },
  { CustomerID: "C004", Age: "29", Gender: "Male", Income: "38000", Churn: "1" },
  { CustomerID: "C005", Age: "34", Gender: "Male", Income: "52000", Churn: "0" },
];

const PROFILE_STATS = [
  { label: "Rows", value: "7,841", color: "#3b82f6" },
  { label: "Columns", value: "12", color: "#7c3aed" },
  { label: "Missing values", value: "1,203", color: "#d97706" },
  { label: "Duplicate rows", value: "47", color: "#e11d48" },
  { label: "Health score", value: "42 / 100", color: "#e11d48" },
  { label: "Target column", value: "Churn", color: "#059669" },
];

const COLUMN_ANALYSIS = [
  { name: "CustomerID", type: "object", missing: "0%", unique: "100%", flag: "Identifier", flagClass: "badge-amber" },
  { name: "Age", type: "float64", missing: "14.2%", unique: "68%", flag: "Has nulls", flagClass: "badge-rose" },
  { name: "Gender", type: "object", missing: "6.1%", unique: "3", flag: "Categorical", flagClass: "badge-violet" },
  { name: "Income", type: "float64", missing: "8.9%", unique: "98%", flag: "Skewed", flagClass: "badge-rose" },
  { name: "Churn", type: "int64", missing: "0%", unique: "2", flag: "Target", flagClass: "badge-emerald" },
];

type Stage = "idle" | "uploading" | "profiling" | "done";

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
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  background: isDone
                    ? "linear-gradient(135deg, #059669, #0ea5e9)"
                    : isActive
                    ? "#2563eb"
                    : "rgba(255,255,255,0.05)",
                  color: isDone || isActive ? "white" : "var(--text-muted)",
                  border: isDone || isActive ? "none" : "1px solid var(--border)",
                }}
              >
                {isDone ? "✓" : s.num}
              </div>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
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
  const [stage, setStage] = useState<Stage>("idle");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const simulateUpload = useCallback((name: string) => {
    setFileName(name);
    setStage("uploading");
    setProgress(0);

    let p = 0;
    const upTimer = setInterval(() => {
      p += Math.random() * 18 + 5;
      if (p >= 100) {
        clearInterval(upTimer);
        setProgress(100);
        setStage("profiling");
        setTimeout(() => setStage("done"), 2400);
      } else {
        setProgress(Math.min(p, 99));
      }
    }, 120);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) simulateUpload(file.name);
    },
    [simulateUpload]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) simulateUpload(file.name);
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

        {stage === "idle" && (
          <>
            {/* Drop zone */}
            <div
              className={`upload-zone ${dragging ? "drag-over" : ""}`}
              style={{
                borderRadius: "14px",
                padding: "72px 40px",
                textAlign: "center",
                cursor: "pointer",
                background: dragging ? "rgba(37,99,235,0.05)" : "rgba(15,21,36,0.6)",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "rgba(37,99,235,0.12)",
                  border: "1px solid rgba(37,99,235,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
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
              <button className="btn-secondary" style={{ pointerEvents: "none" }}>
                Choose file
              </button>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={onFileChange} />
            </div>

            {/* Sample datasets */}
            <div style={{ marginTop: "24px" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                Or start with a sample
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["Titanic.csv", "Customer Churn.csv", "Heart Disease.csv", "Iris.csv", "Adult Income.csv"].map((name) => (
                  <button
                    key={name}
                    onClick={() => simulateUpload(name)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--border-strong)",
                      color: "var(--text-secondary)",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--text-primary)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-secondary)";
                      e.currentTarget.style.borderColor = "var(--border-strong)";
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {(stage === "uploading" || stage === "profiling") && (
          <div
            style={{
              borderRadius: "14px",
              padding: "60px 40px",
              textAlign: "center",
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
            }}
          >
            {stage === "uploading" && (
              <>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>
                  Uploading
                </p>
                <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "6px", letterSpacing: "-0.02em" }}>
                  {fileName}
                </h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "14px" }}>
                  Transferring your file to ForgeAI...
                </p>
                <div className="progress-bar" style={{ maxWidth: "360px", margin: "0 auto 12px", height: "6px" }}>
                  <div
                    className="progress-fill confidence-high"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{Math.round(progress)}%</p>
              </>
            )}

            {stage === "profiling" && (
              <>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    border: "2px solid var(--border)",
                    borderTopColor: "#7c3aed",
                    animation: "spin-slow 0.9s linear infinite",
                    margin: "0 auto 24px",
                  }}
                />
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>
                  Analyzing
                </p>
                <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px", letterSpacing: "-0.02em" }}>
                  Gemma is profiling your data
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
                  Checking distributions, nulls, cardinality, and outliers...
                </p>
                <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                  {["Scanning columns", "Detecting outliers", "Analyzing distributions", "Scoring health"].map((t) => (
                    <span key={t} className="badge badge-violet" style={{ fontSize: "11px" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {stage === "done" && (
          <div>
            {/* Success notice */}
            <div
              style={{
                padding: "14px 20px",
                borderRadius: "10px",
                background: "rgba(5,150,105,0.08)",
                border: "1px solid rgba(5,150,105,0.22)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "28px",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: "#6ee7b7", marginBottom: "2px", fontSize: "14px" }}>
                  {fileName} — analysis complete
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  7,841 rows · 12 columns · health score 42/100
                </div>
              </div>
              <Link href="/review">
                <button className="btn-primary" style={{ padding: "8px 18px", fontSize: "13px" }}>
                  <span>Review AI plan</span>
                </button>
              </Link>
            </div>

            {/* Stats grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "1px",
                background: "var(--border-subtle)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "24px",
              }}
            >
              {PROFILE_STATS.map((s) => (
                <div
                  key={s.label}
                  style={{
                    padding: "18px 20px",
                    background: "var(--bg-card)",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: "20px", fontWeight: 800, color: s.color, letterSpacing: "-0.02em", marginBottom: "4px" }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Data preview */}
            <div
              style={{
                borderRadius: "12px",
                border: "1px solid var(--border)",
                overflow: "hidden",
                marginBottom: "20px",
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
                <span style={{ fontWeight: 600, fontSize: "13px" }}>Data preview</span>
                <span className="badge badge-blue">First 5 rows</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      {Object.keys(SAMPLE_DATA[0]).map((k) => (
                        <th key={k}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_DATA.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((v, j) => (
                          <td key={j} style={{ color: v === "" ? "#e11d48" : undefined }}>
                            {v === "" ? "null" : v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Column analysis */}
            <div
              style={{
                borderRadius: "12px",
                border: "1px solid var(--border)",
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
                    {COLUMN_ANALYSIS.map((col) => (
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
                        <td style={{ color: col.missing !== "0%" ? "#fcd34d" : "#6ee7b7" }}>{col.missing}</td>
                        <td>{col.unique}</td>
                        <td>
                          <span className={`badge ${col.flagClass}`}>{col.flag}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
