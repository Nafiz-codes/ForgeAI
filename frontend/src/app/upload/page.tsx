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
  { label: "Total Rows", value: "7,841", icon: "📋", color: "#3b82f6" },
  { label: "Columns", value: "12", icon: "📊", color: "#8b5cf6" },
  { label: "Missing Values", value: "1,203", icon: "❓", color: "#f59e0b" },
  { label: "Duplicate Rows", value: "47", icon: "🔁", color: "#f43f5e" },
  { label: "Health Score", value: "42", icon: "💊", color: "#f43f5e" },
  { label: "Target Column", value: "Churn", icon: "🎯", color: "#10b981" },
];

const COLUMN_ANALYSIS = [
  { name: "CustomerID", type: "object", missing: "0%", unique: "100%", flag: "⚠️ Identifier", flagClass: "badge-amber" },
  { name: "Age", type: "float64", missing: "14.2%", unique: "68%", flag: "🔴 Has Nulls", flagClass: "badge-rose" },
  { name: "Gender", type: "object", missing: "6.1%", unique: "3", flag: "🟡 Categorical", flagClass: "badge-violet" },
  { name: "Income", type: "float64", missing: "8.9%", unique: "98%", flag: "🔴 Skewed", flagClass: "badge-rose" },
  { name: "Churn", type: "int64", missing: "0%", unique: "2", flag: "🎯 Target", flagClass: "badge-emerald" },
];

type Stage = "idle" | "uploading" | "profiling" | "done";

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
        setTimeout(() => setStage("done"), 2200);
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
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "0" }}>
      {/* Top nav */}
      <nav
        className="glass"
        style={{
          padding: "0 40px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: "9px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>⚡</div>
          <span style={{ fontWeight: 800, fontSize: "16px" }}>Forge<span style={{ color: "#60a5fa" }}>AI</span></span>
        </Link>

        {/* Breadcrumb steps */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {[
            { label: "Upload", num: 1, active: true },
            { label: "AI Plan", num: 2, active: false },
            { label: "Results", num: 3, active: false },
          ].map((s, i) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    background: s.active
                      ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
                      : "rgba(255,255,255,0.05)",
                    color: s.active ? "white" : "var(--text-muted)",
                    border: s.active ? "none" : "1px solid var(--border)",
                  }}
                >
                  {s.num}
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: s.active ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {s.label}
                </span>
              </div>
              {i < 2 && <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>›</span>}
            </div>
          ))}
        </div>

        <div style={{ width: "120px" }} />
      </nav>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "60px 40px" }}>
        {/* Page header */}
        <div style={{ marginBottom: "48px" }}>
          <h1 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "12px" }}>
            Upload your <span className="gradient-text">dataset</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
            Drop any CSV — messy, incomplete, unformatted. ForgeAI handles the rest.
          </p>
        </div>

        {stage === "idle" && (
          <>
            {/* Drop zone */}
            <div
              className={`upload-zone ${dragging ? "drag-over" : ""}`}
              style={{
                borderRadius: "24px",
                padding: "80px 40px",
                textAlign: "center",
                cursor: "pointer",
                background: dragging ? "rgba(59,130,246,0.06)" : "rgba(13,20,36,0.5)",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <div style={{ fontSize: "64px", marginBottom: "20px" }} className={dragging ? "animate-float" : ""}>
                📂
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}>
                {dragging ? "Drop it right here!" : "Drag & drop your CSV file"}
              </h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "15px" }}>
                or click to browse · Supports CSV up to 100MB
              </p>
              <button className="btn-primary" style={{ padding: "10px 24px" }}>
                <span>Browse Files</span>
              </button>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={onFileChange} />
            </div>

            {/* Sample datasets */}
            <div style={{ marginTop: "32px" }}>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>
                Or try a sample dataset:
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {["Titanic.csv", "Customer Churn.csv", "Heart Disease.csv", "Iris.csv", "Adult Income.csv"].map((name) => (
                  <button
                    key={name}
                    onClick={() => simulateUpload(name)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      background: "rgba(59,130,246,0.08)",
                      border: "1px solid rgba(59,130,246,0.2)",
                      color: "#93c5fd",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    📄 {name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {(stage === "uploading" || stage === "profiling") && (
          <div
            className="glass"
            style={{ borderRadius: "24px", padding: "60px 40px", textAlign: "center", border: "1px solid var(--border)" }}
          >
            {stage === "uploading" && (
              <>
                <div style={{ fontSize: "48px", marginBottom: "24px" }}>📤</div>
                <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
                  Uploading <span style={{ color: "#93c5fd" }}>{fileName}</span>
                </h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "32px" }}>Streaming your dataset to ForgeAI...</p>
                <div className="progress-bar" style={{ maxWidth: "400px", margin: "0 auto", height: "8px" }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${progress}%`,
                      background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                      transition: "width 0.15s ease",
                    }}
                  />
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "12px" }}>{Math.round(progress)}%</p>
              </>
            )}

            {stage === "profiling" && (
              <>
                <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
                  <div style={{ fontSize: "48px" }}>🧠</div>
                  <div
                    style={{
                      position: "absolute",
                      inset: "-8px",
                      borderRadius: "50%",
                      border: "2px solid transparent",
                      borderTopColor: "#8b5cf6",
                      animation: "spin-slow 1.2s linear infinite",
                    }}
                  />
                </div>
                <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Gemma is profiling your data</h2>
                <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "16px" }}>
                  {["Scanning columns", "Detecting outliers", "Analyzing distributions", "Scoring health"].map((t, i) => (
                    <span
                      key={t}
                      className="badge badge-violet"
                      style={{ fontSize: "12px", animationDelay: `${i * 0.3}s`, opacity: 0.7 }}
                    >
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
            {/* Success banner */}
            <div
              style={{
                padding: "16px 24px",
                borderRadius: "14px",
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.3)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "32px",
              }}
            >
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <span style={{ fontSize: "20px" }}>✅</span>
                <div>
                  <div style={{ fontWeight: 600, color: "#6ee7b7" }}>{fileName} — analyzed successfully</div>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>7,841 rows · 12 columns · profiling complete</div>
                </div>
              </div>
              <Link href="/review">
                <button className="btn-primary" style={{ padding: "10px 22px", fontSize: "14px" }}>
                  <span>Review AI Plan →</span>
                </button>
              </Link>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "32px" }}>
              {PROFILE_STATS.map((s) => (
                <div key={s.label} className="stat-card" style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>{s.icon}</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, marginTop: "4px" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Data preview */}
            <div className="glass" style={{ borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden", marginBottom: "24px" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontWeight: 600, fontSize: "15px" }}>📋 Data Preview</h3>
                <span className="badge badge-blue" style={{ fontSize: "11px" }}>First 5 rows</span>
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
                          <td key={j} style={{ color: v === "" ? "#f43f5e" : undefined }}>
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
            <div className="glass" style={{ borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ fontWeight: 600, fontSize: "15px" }}>🔬 Column Analysis</h3>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Type</th>
                      <th>Missing</th>
                      <th>Unique</th>
                      <th>AI Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COLUMN_ANALYSIS.map((col) => (
                      <tr key={col.name}>
                        <td><code style={{ fontFamily: "'JetBrains Mono', monospace", color: "#93c5fd" }}>{col.name}</code></td>
                        <td><span className="badge badge-blue" style={{ fontSize: "11px" }}>{col.type}</span></td>
                        <td style={{ color: col.missing !== "0%" ? "#fcd34d" : "#6ee7b7" }}>{col.missing}</td>
                        <td>{col.unique}</td>
                        <td><span className={`badge ${col.flagClass}`} style={{ fontSize: "11px" }}>{col.flag}</span></td>
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
