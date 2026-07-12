"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SESSION_KEYS } from "@/lib/api";
import type { PlanAction, MlRecommendation, ExecuteResponse } from "@/lib/api";

// ── Category colour map ────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  "Identifier Removal":    "#d97706",
  "PII Removal":           "#ec4899",
  "Missing Value Handling":"#7c3aed",
  "Feature Engineering":   "#0ea5e9",
  "Categorical Encoding":  "#2563eb",
  "Outlier Treatment":     "#e11d48",
  "Data Quality":          "#059669",
  "Feature Scaling":       "#06b6d4",
  // lower-case aliases (AI sometimes returns these)
  "Identifier removal":    "#d97706",
  "PII removal":           "#ec4899",
  "Missing values":        "#7c3aed",
  "Feature engineering":   "#0ea5e9",
  "Encoding":              "#2563eb",
  "Outlier treatment":     "#e11d48",
  "Data quality":          "#059669",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function catColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "#2563eb";
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StepIndicator({ active }: { active: 1 | 2 | 3 }) {
  const steps = [
    { label: "Upload", num: 1 },
    { label: "Review plan", num: 2 },
    { label: "Results", num: 3 },
  ];
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      {steps.map((s, i) => {
        const isDone    = s.num < active;
        const isActive  = s.num === active;
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

function ConfidenceBadge({ score }: { score: number }) {
  const color = score >= 90 ? "#059669" : score >= 80 ? "#d97706" : "#e11d48";
  const cls   = score >= 90 ? "badge-emerald" : score >= 80 ? "badge-amber" : "badge-rose";
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
            height: "100%", borderRadius: "2px", width: `${score}%`,
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

// Loading skeleton for decision cards
function CardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          style={{
            borderRadius: "12px", padding: "18px 20px",
            border: "1px solid var(--border)",
            height: "88px",
            backgroundImage: "linear-gradient(90deg, var(--bg-card) 25%, var(--bg-card-hover) 50%, var(--bg-card) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.4s linear infinite",
          }}
        />
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

interface DecisionItem extends PlanAction {
  status: "keep" | "remove";
}

type PageState = "loading" | "ready" | "executing" | "done" | "error";

export default function ReviewPage() {
  const router = useRouter();

  const [pageState, setPageState]   = useState<PageState>("loading");
  const [errorMsg, setErrorMsg]     = useState("");
  const [decisions, setDecisions]   = useState<DecisionItem[]>([]);
  const [planMeta, setPlanMeta]     = useState<{
    datasetId: string;
    healthBefore: number;
    healthPredicted: number;
    summary: string;
    mlRecs: MlRecommendation[];
  } | null>(null);
  const [filter, setFilter]         = useState("all");

  // ── Fetch plan on mount ──────────────────────────────────────────────────
  const fetchPlan = useCallback(async () => {
    const datasetId = sessionStorage.getItem(SESSION_KEYS.DATASET_ID);
    if (!datasetId) {
      router.replace("/upload");
      return;
    }

    setPageState("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/plan/${datasetId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail ?? `Server error ${res.status}`);
      }
      const data = await res.json();

      setPlanMeta({
        datasetId,
        healthBefore:    data.health_score_before,
        healthPredicted: data.predicted_health_score,
        summary:         data.summary ?? "",
        mlRecs:          data.ml_recommendations ?? [],
      });

      setDecisions(
        (data.actions as PlanAction[]).map((a) => ({ ...a, status: "keep" as const }))
      );
      setPageState("ready");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load plan.");
      setPageState("error");
    }
  }, [router]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  // ── Toggle ───────────────────────────────────────────────────────────────
  const toggle = (id: number) => {
    setDecisions((prev) =>
      prev.map((d) => d.id === id ? { ...d, status: d.status === "keep" ? "remove" : "keep" } : d)
    );
  };

  // ── Execute ──────────────────────────────────────────────────────────────
  const executeApprove = async () => {
    if (!planMeta) return;
    setPageState("executing");
    setErrorMsg("");

    const kept = decisions.filter((d) => d.status === "keep");
    const body = {
      dataset_id: planMeta.datasetId,
      approved_actions: kept.map((d) => ({
        id:         d.id,
        column:     d.column,
        action:     d.action,
        type:       d.type,
        reason:     d.reason,
        category:   d.category,
        confidence: d.confidence,
      })),
    };

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail ?? `Execute failed: ${res.status}`);
      }
      const results: ExecuteResponse = await res.json();
      sessionStorage.setItem(SESSION_KEYS.RESULTS, JSON.stringify(results));
      setPageState("done");
      // Small delay so user sees "done" state before redirect
      setTimeout(() => router.push("/results"), 800);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Execution failed.");
      setPageState("ready"); // re-enable the button
    }
  };

  // ── Derived counts ───────────────────────────────────────────────────────
  const keptCount    = decisions.filter((d) => d.status === "keep").length;
  const removedCount = decisions.filter((d) => d.status === "remove").length;
  const categories   = ["all", ...Array.from(new Set(decisions.map((d) => d.category)))];
  const filtered     = filter === "all" ? decisions : decisions.filter((d) => d.category === filter);
  const isExecuting  = pageState === "executing";

  // ── Done state (brief flash before redirect) ─────────────────────────────
  if (pageState === "done") {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px" }}>
        <div style={{ textAlign: "center", maxWidth: "480px" }}>
          <div
            style={{
              width: "56px", height: "56px", borderRadius: "16px",
              background: "rgba(5,150,105,0.12)", border: "1px solid rgba(5,150,105,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px", fontSize: "24px", color: "#6ee7b7",
            }}
          >
            ✓
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "12px", letterSpacing: "-0.03em" }}>
            Plan <span className="gradient-text">executed</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Taking you to the results...
          </p>
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

        <StepIndicator active={2} />

        <button
          className="btn-primary"
          style={{ padding: "7px 16px", fontSize: "13px", opacity: isExecuting ? 0.7 : 1 }}
          onClick={executeApprove}
          disabled={isExecuting || pageState === "loading"}
        >
          <span>{isExecuting ? "Running..." : `Execute (${keptCount})`}</span>
        </button>
      </nav>

      <div style={{ maxWidth: "1060px", margin: "0 auto", padding: "44px 36px" }}>

        {/* ── Error state ──────────────────────────────────────────────────── */}
        {pageState === "error" && (
          <div
            style={{
              padding: "18px 22px", borderRadius: "12px",
              background: "rgba(225,29,72,0.08)", border: "1px solid rgba(225,29,72,0.25)",
              marginBottom: "24px",
            }}
          >
            <div style={{ fontWeight: 600, color: "#fda4af", marginBottom: "8px" }}>
              Could not load the AI plan
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "14px" }}>
              {errorMsg}
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn-primary" style={{ padding: "7px 16px", fontSize: "13px" }} onClick={fetchPlan}>
                <span>Retry</span>
              </button>
              <Link href="/upload">
                <button className="btn-secondary" style={{ padding: "7px 16px", fontSize: "13px" }}>
                  Back to upload
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Execute error inline */}
        {errorMsg && pageState === "ready" && (
          <div
            style={{
              padding: "12px 18px", borderRadius: "9px", marginBottom: "16px",
              background: "rgba(225,29,72,0.07)", border: "1px solid rgba(225,29,72,0.2)",
              fontSize: "13px", color: "#fda4af",
            }}
          >
            Execution failed: {errorMsg}
          </div>
        )}

        {/* ── Loading state ─────────────────────────────────────────────────── */}
        {pageState === "loading" && (
          <>
            <div style={{ marginBottom: "28px" }}>
              <div style={{ width: "200px", height: "32px", borderRadius: "6px", background: "var(--bg-card)", marginBottom: "10px", animation: "shimmer 1.4s linear infinite", backgroundSize: "200% 100%", backgroundImage: "linear-gradient(90deg, var(--bg-card) 25%, var(--bg-card-hover) 50%, var(--bg-card) 75%)" }} />
              <div style={{ width: "340px", height: "18px", borderRadius: "6px", background: "var(--bg-card)", animation: "shimmer 1.4s linear infinite", backgroundSize: "200% 100%", backgroundImage: "linear-gradient(90deg, var(--bg-card) 25%, var(--bg-card-hover) 50%, var(--bg-card) 75%)" }} />
            </div>
            <CardSkeleton />
          </>
        )}

        {/* ── Ready / executing state ──────────────────────────────────────── */}
        {(pageState === "ready" || pageState === "executing") && planMeta && (
          <>
            {/* Page header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "8px" }}>
                  AI Preprocessing Plan
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                  {decisions.length} actions proposed ·{" "}
                  <span style={{ color: "#6ee7b7" }}>{keptCount} approved</span>
                  {removedCount > 0 && (
                    <span> · <span style={{ color: "#fda4af" }}>{removedCount} skipped</span></span>
                  )}
                </p>
              </div>

              {/* Score delta */}
              <div
                style={{
                  padding: "12px 18px", borderRadius: "10px",
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  display: "flex", gap: "16px", alignItems: "center",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: planMeta.healthBefore < 60 ? "#e11d48" : "#d97706", letterSpacing: "-0.02em" }}>
                    {planMeta.healthBefore}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>current</div>
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>→</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#059669", letterSpacing: "-0.02em" }}>
                    {planMeta.healthPredicted}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>predicted</div>
                </div>
              </div>
            </div>

            {/* Gemma summary */}
            {planMeta.summary && (
              <div
                style={{
                  padding: "13px 18px", borderRadius: "9px",
                  background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)",
                  display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: "#a78bfa", marginTop: "6px", flexShrink: 0,
                  }}
                />
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                  <strong style={{ color: "#c4b5fd", fontWeight: 600 }}>Gemma&apos;s analysis: </strong>
                  {planMeta.summary}
                </div>
              </div>
            )}

            {/* Category filter */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
              {categories.map((cat) => {
                const isActive  = filter === cat;
                const cc        = cat === "all" ? "#2563eb" : catColor(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    style={{
                      padding: "4px 12px", borderRadius: "6px", fontSize: "12px",
                      fontWeight: 500, cursor: "pointer", border: "1px solid",
                      transition: "all 0.15s",
                      borderColor: isActive ? `${cc}50` : "var(--border)",
                      background:  isActive ? `${cc}12` : "transparent",
                      color:       isActive ? cc : "var(--text-muted)",
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
                const cc     = catColor(d.category);
                const isKept = d.status === "keep";
                return (
                  <div
                    key={d.id}
                    className="decision-card"
                    style={{
                      borderRadius: "12px", padding: "18px 20px",
                      border: `1px solid ${isKept ? "var(--border)" : "rgba(225,29,72,0.18)"}`,
                      background: isKept ? "var(--bg-card)" : "rgba(225,29,72,0.03)",
                      display: "flex", gap: "14px", alignItems: "flex-start",
                      opacity: isKept ? 1 : 0.55,
                      position: "relative", overflow: "hidden",
                    }}
                  >
                    {/* Left accent */}
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "2px", background: cc, opacity: isKept ? 0.6 : 0.2 }} />

                    {/* Toggle */}
                    <button
                      onClick={() => toggle(d.id)}
                      title={isKept ? "Skip this action" : "Restore this action"}
                      style={{
                        flexShrink: 0, width: "36px", height: "36px", borderRadius: "8px",
                        border: `1px solid ${isKept ? "rgba(5,150,105,0.35)" : "rgba(225,29,72,0.35)"}`,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "14px",
                        background: isKept ? "rgba(5,150,105,0.08)" : "rgba(225,29,72,0.08)",
                        transition: "all 0.18s ease", color: isKept ? "#6ee7b7" : "#fda4af",
                        fontWeight: 600, marginTop: "1px",
                      }}
                    >
                      {isKept ? "✓" : "✗"}
                    </button>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "6px" }}>
                        <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", fontWeight: 700, color: "#93c5fd" }}>
                          {d.column}
                        </code>
                        <span style={{ padding: "2px 9px", borderRadius: "5px", fontSize: "12px", fontWeight: 500, background: `${cc}14`, color: cc, border: `1px solid ${cc}28` }}>
                          {d.action}
                        </span>
                        <span style={{ padding: "1px 8px", borderRadius: "5px", fontSize: "11px", color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
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
                position: "sticky", bottom: "20px", marginTop: "28px",
                borderRadius: "12px", padding: "14px 20px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
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
                  style={{ padding: "8px 22px", fontSize: "13px", opacity: isExecuting ? 0.7 : 1 }}
                  onClick={executeApprove}
                  disabled={isExecuting}
                >
                  <span>{isExecuting ? "Running..." : "Execute plan"}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
