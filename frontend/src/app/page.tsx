"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#demo", label: "Demo Flow" },
];

const FEATURE_CARDS = [
  {
    icon: "🧠",
    title: "Gemma 4 Reasoning",
    desc: "ForgeAI doesn't just run heuristics — Gemma reads your dataset profile and reasons like a senior data scientist, justifying every decision.",
    badge: "AI-Powered",
    badgeClass: "badge-violet",
    color: "#8b5cf6",
  },
  {
    icon: "🤝",
    title: "Human-AI Collaboration",
    desc: "Review every proposed action before execution. Override recommendations, keep columns Gemma flagged for removal, and stay in full control.",
    badge: "Interactive",
    badgeClass: "badge-blue",
    color: "#3b82f6",
  },
  {
    icon: "⚙️",
    title: "Deterministic Execution",
    desc: "Once approved, the plan executes precisely and reproducibly — null handling, encoding, scaling, outlier treatment, and duplicate removal.",
    badge: "Reproducible",
    badgeClass: "badge-emerald",
    color: "#10b981",
  },
  {
    icon: "📊",
    title: "Dataset Health Score",
    desc: "Watch your dataset score improve from raw to ML-ready. See before/after comparisons across all quality dimensions.",
    badge: "Analytics",
    badgeClass: "badge-cyan",
    color: "#06b6d4",
  },
  {
    icon: "📦",
    title: "Portable Artifacts",
    desc: "Download the cleaned CSV, a generated preprocessing_pipeline.py, and a full AI Decision Log — everything reproducible and documented.",
    badge: "Downloads",
    badgeClass: "badge-amber",
    color: "#f59e0b",
  },
  {
    icon: "🎯",
    title: "ML Recommendations",
    desc: "Gemma analyzes your cleaned data and suggests the best ML models for your problem type with confidence scores and reasoning.",
    badge: "ML-Ready",
    badgeClass: "badge-rose",
    color: "#f43f5e",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Upload Your CSV",
    desc: "Drop any messy CSV — missing values, duplicates, mixed types. ForgeAI handles it all.",
    icon: "📁",
    color: "#3b82f6",
  },
  {
    number: "02",
    title: "AI Profiles the Data",
    desc: "Gemma 4 analyzes cardinality, skewness, outliers, correlations, and identifies identifier columns.",
    icon: "🔍",
    color: "#8b5cf6",
  },
  {
    number: "03",
    title: "Review the Plan",
    desc: "See every proposed action with reasoning. Override, approve, or modify before a single row is touched.",
    icon: "✋",
    color: "#06b6d4",
  },
  {
    number: "04",
    title: "Execute & Download",
    desc: "One click executes the approved plan. Download your clean dataset, pipeline, and full AI report.",
    icon: "🚀",
    color: "#10b981",
  },
];

const DEMO_DECISIONS = [
  {
    column: "CustomerID",
    action: "Drop column",
    reason: "This column appears to be a unique row identifier with cardinality equal to row count. It has no predictive value.",
    confidence: 97,
    type: "drop",
    badge: "badge-rose",
  },
  {
    column: "Age",
    action: "Median imputation",
    reason: "14.2% missing values detected. Distribution is slightly right-skewed (skewness: 1.3), making median more robust than mean.",
    confidence: 89,
    type: "impute",
    badge: "badge-amber",
  },
  {
    column: "Income",
    action: "Log transform + median impute",
    reason: "Highly skewed distribution (skewness: 4.7). Log transform will normalize before scaling. 8.9% missing — median imputation recommended.",
    confidence: 94,
    type: "transform",
    badge: "badge-violet",
  },
  {
    column: "Gender",
    action: "One-hot encoding",
    reason: "Nominal categorical column with 2 unique values. One-hot encoding preferred over label encoding to avoid ordinal assumption.",
    confidence: 91,
    type: "encode",
    badge: "badge-blue",
  },
];

const STATS = [
  { value: "42→93", label: "Health Score Boost", icon: "📈" },
  { value: "< 5s", label: "AI Analysis Time", icon: "⚡" },
  { value: "100%", label: "Reproducible", icon: "🔒" },
  { value: "15+", label: "Dataset Types Supported", icon: "📊" },
];

function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "0 40px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: scrolled ? "rgba(3,7,18,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(99,179,237,0.1)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            boxShadow: "0 0 20px rgba(59,130,246,0.4)",
          }}
        >
          ⚡
        </div>
        <span style={{ fontWeight: 800, fontSize: "18px", letterSpacing: "-0.02em" }}>
          Forge<span style={{ color: "#60a5fa" }}>AI</span>
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href} className="nav-link">
            {l.label}
          </a>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <Link href="/upload">
          <button className="btn-primary" style={{ padding: "8px 20px", fontSize: "14px" }}>
            <span>Try ForgeAI →</span>
          </button>
        </Link>
      </div>
    </nav>
  );
}

function HeroSection() {
  const [typed, setTyped] = useState("");
  const fullText = "ML-ready in seconds.";

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= fullText.length) {
        setTyped(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 60);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      className="grid-bg noise"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 40px 80px",
        overflow: "hidden",
      }}
    >
      {/* Background orbs */}
      <div className="orb" style={{ width: 600, height: 600, background: "radial-gradient(circle, #1d4ed8, #3b82f6)", top: -200, left: -200 }} />
      <div className="orb" style={{ width: 500, height: 500, background: "radial-gradient(circle, #5b21b6, #8b5cf6)", bottom: -100, right: -150 }} />
      <div className="orb" style={{ width: 300, height: 300, background: "radial-gradient(circle, #065f46, #10b981)", top: "40%", right: "20%" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", textAlign: "center" }}>
        {/* Pill badge */}
        <div style={{ marginBottom: "28px", display: "flex", justifyContent: "center" }}>
          <span
            className="badge-violet badge"
            style={{ fontSize: "13px", padding: "6px 16px", gap: "8px" }}
          >
            <span>✨</span>
            <span>Powered by Gemma 4 · Built for ML Engineers</span>
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: "clamp(48px, 7vw, 88px)",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            marginBottom: "24px",
          }}
        >
          Your data,{" "}
          <span className="gradient-text">AI-cleaned.</span>
          <br />
          <span style={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: "0.75em" }}>
            {typed}
            <span
              style={{
                display: "inline-block",
                width: "3px",
                height: "0.8em",
                background: "#60a5fa",
                marginLeft: "4px",
                verticalAlign: "middle",
                animation: "blink 1s infinite",
              }}
            />
          </span>
        </h1>

        {/* Sub */}
        <p
          style={{
            fontSize: "clamp(16px, 2vw, 20px)",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            maxWidth: "680px",
            margin: "0 auto 40px",
          }}
        >
          ForgeAI doesn&apos;t just clean data. It{" "}
          <strong style={{ color: "var(--text-primary)" }}>thinks like a data scientist</strong>, 
          collaborates with you on every decision, and produces{" "}
          <strong style={{ color: "var(--text-primary)" }}>reproducible ML-ready datasets</strong> with full audit trails.
        </p>

        {/* CTA row */}
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/upload">
            <button className="btn-primary" style={{ padding: "14px 32px", fontSize: "16px" }}>
              <span>🚀 Start Analyzing</span>
            </button>
          </Link>
          <a href="#demo">
            <button className="btn-secondary" style={{ padding: "14px 32px", fontSize: "16px" }}>
              Watch Demo Flow →
            </button>
          </a>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: "40px",
            justifyContent: "center",
            marginTop: "64px",
            flexWrap: "wrap",
          }}
        >
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em" }}>
                {s.icon} <span className="gradient-text">{s.value}</span>
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px", fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating mini-card */}
      <div
        className="glass animate-float"
        style={{
          position: "absolute",
          right: "5%",
          top: "30%",
          padding: "16px 20px",
          borderRadius: "14px",
          width: "220px",
          display: "none",
        }}
      >
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>Health Score</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "28px", fontWeight: 800, color: "#f43f5e" }}>42</span>
          <span style={{ fontSize: "24px" }}>→</span>
          <span style={{ fontSize: "28px", fontWeight: 800, color: "#10b981" }}>93</span>
        </div>
        <div className="progress-bar" style={{ marginTop: "10px" }}>
          <div className="progress-fill confidence-high" style={{ width: "93%" }} />
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" style={{ padding: "100px 40px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "64px" }}>
        <span className="badge badge-blue" style={{ marginBottom: "16px" }}>Features</span>
        <h2 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", marginTop: "12px" }}>
          Everything a data scientist does,{" "}
          <span className="gradient-text">automated</span>
        </h2>
        <p style={{ fontSize: "18px", color: "var(--text-secondary)", maxWidth: "600px", margin: "16px auto 0" }}>
          Six pillars of intelligent data preprocessing, working together seamlessly.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "20px",
        }}
      >
        {FEATURE_CARDS.map((card) => (
          <div
            key={card.title}
            className="glass card-hover"
            style={{
              borderRadius: "20px",
              padding: "28px",
              border: "1px solid var(--border)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Glow accent */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: `linear-gradient(90deg, transparent, ${card.color}, transparent)`,
              }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div style={{ fontSize: "36px" }}>{card.icon}</div>
              <span className={`badge ${card.badgeClass}`}>{card.badge}</span>
            </div>

            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "10px", letterSpacing: "-0.01em" }}>
              {card.title}
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7 }}>{card.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      style={{
        padding: "100px 40px",
        background: "linear-gradient(180deg, transparent, rgba(10,15,30,0.6), transparent)",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <span className="badge badge-emerald" style={{ marginBottom: "16px" }}>Process</span>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", marginTop: "12px" }}>
            How <span className="gradient-text">ForgeAI</span> works
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
          {STEPS.map((step, i) => (
            <div
              key={step.number}
              style={{ position: "relative" }}
            >
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: "36px",
                    left: "calc(100% - 0px)",
                    width: "24px",
                    height: "2px",
                    background: `linear-gradient(90deg, ${step.color}, transparent)`,
                    zIndex: 1,
                    display: "none",
                  }}
                />
              )}

              <div
                className="glass"
                style={{
                  borderRadius: "20px",
                  padding: "28px",
                  height: "100%",
                  border: "1px solid var(--border)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: step.color,
                    opacity: 0.8,
                  }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: `${step.color}20`,
                      border: `1px solid ${step.color}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                    }}
                  >
                    {step.icon}
                  </div>
                  <span
                    style={{
                      fontSize: "36px",
                      fontWeight: 900,
                      color: `${step.color}30`,
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                    }}
                  >
                    {step.number}
                  </span>
                </div>

                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>{step.title}</h3>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoSection() {
  const [selected, setSelected] = useState<Record<number, boolean>>({ 0: false, 1: true, 2: true, 3: true });

  return (
    <section id="demo" style={{ padding: "100px 40px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <span className="badge badge-violet" style={{ marginBottom: "16px" }}>Interactive Preview</span>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", marginTop: "12px" }}>
            See the AI Plan Review — <span className="gradient-text">live</span>
          </h2>
          <p style={{ fontSize: "18px", color: "var(--text-secondary)", maxWidth: "560px", margin: "16px auto 0" }}>
            Every proposed action comes with Gemma&apos;s reasoning. You decide what runs.
          </p>
        </div>

        {/* Demo card: AI decisions */}
        <div
          className="glass-bright"
          style={{
            borderRadius: "24px",
            padding: "32px",
            border: "1px solid var(--border-bright)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: "18px" }}>AI Preprocessing Plan</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                Gemma analyzed <strong style={{ color: "var(--text-primary)" }}>customer_churn.csv</strong> · 
                {" "}<span className="badge badge-emerald" style={{ fontSize: "11px" }}>4 actions proposed</span>
              </p>
            </div>
            <Link href="/review">
              <button className="btn-primary" style={{ padding: "10px 20px", fontSize: "14px" }}>
                <span>Approve Plan →</span>
              </button>
            </Link>
          </div>

          {/* Decision cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {DEMO_DECISIONS.map((d, i) => (
              <div
                key={i}
                className="decision-card"
                style={{
                  borderRadius: "14px",
                  padding: "18px 20px",
                  background: selected[i] ? "rgba(59,130,246,0.05)" : "rgba(244,63,94,0.04)",
                  border: `1px solid ${selected[i] ? "rgba(99,179,237,0.15)" : "rgba(244,63,94,0.15)"}`,
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                }}
              >
                {/* Toggle */}
                <button
                  onClick={() => setSelected((p) => ({ ...p, [i]: !p[i] }))}
                  style={{
                    flexShrink: 0,
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    transition: "all 0.2s ease",
                    background: selected[i] ? "rgba(16,185,129,0.15)" : "rgba(244,63,94,0.1)",
                  }}
                >
                  {selected[i] ? "✓" : "✗"}
                </button>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
                    <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", fontWeight: 600, color: "#93c5fd" }}>
                      {d.column}
                    </code>
                    <span className={`badge ${d.badge}`}>{d.action}</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{d.reason}</p>
                </div>

                {/* Confidence */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: d.confidence > 90 ? "#10b981" : "#f59e0b" }}>
                    {d.confidence}%
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>confidence</div>
                  <div className="progress-bar" style={{ width: "60px", marginTop: "6px" }}>
                    <div
                      className={`progress-fill ${d.confidence > 90 ? "confidence-high" : "confidence-medium"}`}
                      style={{ width: `${d.confidence}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div
            style={{
              marginTop: "20px",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.2)",
              fontSize: "13px",
              color: "#c4b5fd",
            }}
          >
            💡 <strong>Tip:</strong> Click the toggle to keep or remove any action. This is your differentiator — 
            ForgeAI <em>never</em> runs without your approval.
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section
      style={{
        padding: "100px 40px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="orb" style={{ width: 400, height: 400, background: "radial-gradient(circle, #1d4ed8, #3b82f6)", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "700px", margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "clamp(36px, 6vw, 64px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            marginBottom: "20px",
            lineHeight: 1.1,
          }}
        >
          Ready to forge your{" "}
          <span className="gradient-text">perfect dataset?</span>
        </h2>
        <p style={{ fontSize: "18px", color: "var(--text-secondary)", marginBottom: "40px", lineHeight: 1.6 }}>
          Upload your first CSV in seconds. No account required.
          <br />
          Get an ML-ready dataset and reproducible pipeline instantly.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/upload">
            <button className="btn-primary" style={{ padding: "16px 40px", fontSize: "17px" }}>
              <span>🚀 Launch ForgeAI</span>
            </button>
          </Link>
        </div>

        <p style={{ marginTop: "24px", fontSize: "13px", color: "var(--text-muted)" }}>
          Titanic · Iris · Heart Disease · Customer Churn · Adult Income · Wine Quality · and more
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      style={{
        padding: "40px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "8px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
          }}
        >
          ⚡
        </div>
        <span style={{ fontWeight: 700, fontSize: "15px" }}>
          Forge<span style={{ color: "#60a5fa" }}>AI</span>
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: "14px", marginLeft: "8px" }}>
          · AI Data Scientist
        </span>
      </div>

      <div style={{ display: "flex", gap: "24px" }}>
        {["Upload", "Review", "Results", "GitHub"].map((l) => (
          <a
            key={l}
            href={l === "GitHub" ? "https://github.com" : `/${l.toLowerCase()}`}
            className="nav-link"
            style={{ fontSize: "13px" }}
          >
            {l}
          </a>
        ))}
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
        Built for the ForgeAI Sprint · July 2026
      </p>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DemoSection />
      <CTASection />
      <Footer />
    </main>
  );
}
