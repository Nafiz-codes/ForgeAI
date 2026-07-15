"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#demo", label: "Try it" },
];

const FEATURE_CARDS = [
  {
    title: "Reasoning, not rules",
    desc: "Gemma reads your dataset profile and reasons about it — the same way a senior data scientist would. It considers skewness, cardinality, null patterns, and outlier distribution before proposing anything.",
    tag: "AI-Powered",
    tagClass: "badge-violet",
    accent: "#7c3aed",
  },
  {
    title: "You stay in control",
    desc: "Every proposed action comes with an explanation. Override what you disagree with, keep columns Gemma flagged for removal, and approve only what makes sense. Nothing runs without your sign-off.",
    tag: "Interactive",
    tagClass: "badge-blue",
    accent: "#2563eb",
  },
  {
    title: "Deterministic execution",
    desc: "Once approved, the plan runs precisely as described — null handling, encoding, scaling, outlier capping, duplicate removal. Same inputs produce the same outputs, every time.",
    tag: "Reproducible",
    tagClass: "badge-emerald",
    accent: "#059669",
  },
  {
    title: "Dataset health scoring",
    desc: "See a numeric health score before and after preprocessing across completeness, consistency, and ML readiness. Not just a pass/fail — a real picture of what changed and why.",
    tag: "Analytics",
    tagClass: "badge-cyan",
    accent: "#0ea5e9",
  },
  {
    title: "Everything you need to ship",
    desc: "Download the cleaned CSV, a generated Python pipeline, and a full audit log. Hand any of these to a teammate and they can reproduce your preprocessing from scratch.",
    tag: "Portable",
    tagClass: "badge-amber",
    accent: "#d97706",
  },
  {
    title: "Model suggestions that make sense",
    desc: "Gemma looks at your cleaned data — class balance, feature count, target type — and recommends models that actually fit, with reasons. Not just a list, a ranked shortlist.",
    tag: "ML-Ready",
    tagClass: "badge-rose",
    accent: "#e11d48",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Upload your CSV",
    desc: "Drop any CSV file. Missing values, duplicates, mixed types, messy column names — none of that matters at this stage.",
    accent: "#2563eb",
  },
  {
    number: "02",
    title: "Gemma profiles the data",
    desc: "In a few seconds, Gemma analyzes cardinality, distributions, skewness, outliers, and correlations to understand what the data actually looks like.",
    accent: "#7c3aed",
  },
  {
    number: "03",
    title: "Review the plan",
    desc: "Every proposed action is shown as a card with reasoning and a confidence score. Approve, skip, or override before anything runs.",
    accent: "#0ea5e9",
  },
  {
    number: "04",
    title: "Download the result",
    desc: "Execute the plan and download your clean dataset, the Python preprocessing pipeline, and a full decision log.",
    accent: "#059669",
  },
];

const DEMO_DECISIONS = [
  {
    column: "CustomerID",
    action: "Drop column",
    reason: "Cardinality equals row count — this is a unique row identifier with no predictive value. Keeping it would add noise to any model.",
    confidence: 97,
    badge: "badge-rose",
  },
  {
    column: "Age",
    action: "Median imputation",
    reason: "14.2% missing values. Distribution is slightly right-skewed (skewness 1.3), making median more robust than mean here.",
    confidence: 89,
    badge: "badge-amber",
  },
  {
    column: "Income",
    action: "Log transform + median impute",
    reason: "Highly skewed distribution (skewness 4.7). Log transform normalizes before scaling. 8.9% nulls filled with log-median.",
    confidence: 94,
    badge: "badge-violet",
  },
  {
    column: "Gender",
    action: "One-hot encoding",
    reason: "Nominal categorical column with 2 unique values. One-hot preferred over label encoding to avoid introducing an ordinal assumption.",
    confidence: 91,
    badge: "badge-blue",
  },
];

function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
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
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: scrolled ? "rgba(8,12,20,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
        transition: "background 0.3s ease, border-color 0.3s ease",
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "9px", textDecoration: "none" }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect width="22" height="22" rx="6" fill="#2563eb"/>
          <path d="M7 11.5L10 14.5L15 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-0.02em" }}>
          Forge<span style={{ color: "#60a5fa" }}>AI</span>
        </span>
      </Link>

      <div style={{ display: "flex", gap: "28px", alignItems: "center" }}>
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href} className="nav-link">
            {l.label}
          </a>
        ))}
      </div>

      <Link href="/upload">
        <button className="btn-primary" style={{ padding: "7px 18px", fontSize: "13px" }}>
          <span>Get started</span>
        </button>
      </Link>
    </nav>
  );
}

function HeroSection() {
  const [typed, setTyped] = useState("");
  const fullText = "ML-ready in under a minute.";

  useEffect(() => {
    const delay = setTimeout(() => {
      let i = 0;
      const timer = setInterval(() => {
        if (i <= fullText.length) {
          setTyped(fullText.slice(0, i));
          i++;
        } else {
          clearInterval(timer);
        }
      }, 55);
      return () => clearInterval(timer);
    }, 600);
    return () => clearTimeout(delay);
  }, []);

  return (
    <section
      className="grid-bg"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 40px 100px",
        overflow: "hidden",
      }}
    >
      {/* Soft glow blobs */}
      <div className="orb" style={{ width: 700, height: 700, background: "radial-gradient(circle, #1e3a8a, #1d4ed8)", top: -300, left: -250 }} />
      <div className="orb" style={{ width: 500, height: 500, background: "radial-gradient(circle, #4c1d95, #6d28d9)", bottom: -150, right: -200 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "820px", textAlign: "center" }}>

        <div style={{ marginBottom: "32px" }}>
          <span className="badge badge-blue" style={{ fontSize: "12px", padding: "4px 12px" }}>
            Powered by Gemma 4
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(42px, 6.5vw, 80px)",
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-0.04em",
            marginBottom: "28px",
          }}
        >
          Your messy data,{" "}
          <span className="gradient-text">cleaned by AI.</span>
          <br />
          <span style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.72em", letterSpacing: "-0.03em" }}>
            {typed}
            <span
              style={{
                display: "inline-block",
                width: "2px",
                height: "0.75em",
                background: "#60a5fa",
                marginLeft: "3px",
                verticalAlign: "middle",
                animation: "blink 1s infinite",
              }}
            />
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(15px, 1.8vw, 18px)",
            color: "var(--text-secondary)",
            lineHeight: 1.75,
            maxWidth: "600px",
            margin: "0 auto 44px",
            fontWeight: 400,
          }}
        >
          Drop a CSV. Gemma profiles it, proposes a preprocessing plan with reasoning, and you decide what runs. No black boxes, no guessing.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/upload">
            <button className="btn-primary" style={{ padding: "12px 28px", fontSize: "15px" }}>
              <span>Start analyzing</span>
            </button>
          </Link>
          <a href="#demo">
            <button className="btn-secondary" style={{ padding: "12px 28px", fontSize: "15px" }}>
              See how it works
            </button>
          </a>
        </div>

        {/* Metrics row */}
        <div
          style={{
            display: "flex",
            gap: "0",
            justifyContent: "center",
            marginTop: "72px",
            flexWrap: "wrap",
          }}
        >
          {[
            { value: "42 → 93", label: "avg. health score gain" },
            { value: "< 5s", label: "AI analysis time" },
            { value: "100%", label: "reproducible output" },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                textAlign: "center",
                padding: "0 32px",
                borderLeft: i > 0 ? "1px solid var(--border)" : "none",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(22px, 3vw, 30px)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary)",
                  marginBottom: "4px",
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" style={{ padding: "100px 40px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "56px" }}>
        <p className="section-label" style={{ marginBottom: "14px" }}>What it does</p>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 800, letterSpacing: "-0.03em", maxWidth: "600px", lineHeight: 1.15 }}>
          The full preprocessing workflow,{" "}
          <span className="gradient-text">handled for you</span>
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1px",
          background: "var(--border-subtle)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {FEATURE_CARDS.map((card, i) => (
          <div
            key={card.title}
            style={{
              background: "var(--bg-card)",
              padding: "28px 32px",
              position: "relative",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-card)")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "28px",
                  height: "28px",
                  borderRadius: "7px",
                  background: `${card.accent}18`,
                  border: `1px solid ${card.accent}30`,
                  fontSize: "14px",
                  lineHeight: "28px",
                  textAlign: "center",
                }}
              >
                {i + 1}
              </span>
              <span className={`badge ${card.tagClass}`}>{card.tag}</span>
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "10px", letterSpacing: "-0.01em", lineHeight: 1.3 }}>
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
    <section id="how-it-works" style={{ padding: "100px 40px", background: "rgba(12,17,32,0.5)" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ marginBottom: "56px" }}>
          <p className="section-label" style={{ marginBottom: "14px" }}>The process</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
            Four steps from raw CSV{" "}
            <span className="gradient-text">to production-ready data</span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "20px" }}>
          {STEPS.map((step, i) => (
            <div key={step.number} style={{ position: "relative" }}>
              <div
                style={{
                  borderRadius: "14px",
                  padding: "26px",
                  height: "100%",
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
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
                    height: "2px",
                    background: step.accent,
                    opacity: 0.6,
                  }}
                />

                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "18px" }}>
                  <span
                    style={{
                      fontSize: "40px",
                      fontWeight: 900,
                      color: `${step.accent}20`,
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                    }}
                  >
                    {step.number}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span style={{ fontSize: "12px", color: "var(--text-dimmed)", marginLeft: "auto" }}>Next</span>
                  )}
                </div>

                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "10px", letterSpacing: "-0.01em" }}>{step.title}</h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7 }}>{step.desc}</p>
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

  const keptCount = Object.values(selected).filter(Boolean).length;

  return (
    <section id="demo" style={{ padding: "100px 40px" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <div style={{ marginBottom: "40px" }}>
          <p className="section-label" style={{ marginBottom: "14px" }}>Interactive preview</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "14px", lineHeight: 1.15 }}>
            This is what the{" "}
            <span className="gradient-text">review step looks like</span>
          </h2>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", maxWidth: "500px", lineHeight: 1.65 }}>
            Each action Gemma proposes gets a card. Toggle to keep or skip. Nothing executes until you say so.
          </p>
        </div>

        <div
          style={{
            borderRadius: "16px",
            border: "1px solid var(--border-strong)",
            background: "var(--bg-card)",
            overflow: "hidden",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: "16px 22px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--bg-secondary)",
            }}
          >
            <div>
              <span style={{ fontWeight: 600, fontSize: "14px" }}>AI Preprocessing Plan</span>
              <span style={{ color: "var(--text-muted)", fontSize: "13px", marginLeft: "10px" }}>
                customer_churn.csv
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="badge badge-emerald">{keptCount} approved</span>
              <Link href="/review">
                <button className="btn-primary" style={{ padding: "6px 14px", fontSize: "13px" }}>
                  <span>Open full review</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Decision cards */}
          <div style={{ padding: "12px" }}>
            {DEMO_DECISIONS.map((d, i) => (
              <div
                key={i}
                style={{
                  borderRadius: "10px",
                  padding: "14px 16px",
                  marginBottom: i < DEMO_DECISIONS.length - 1 ? "6px" : "0",
                  border: `1px solid ${selected[i] ? "var(--border)" : "rgba(225,29,72,0.15)"}`,
                  background: selected[i] ? "transparent" : "rgba(225,29,72,0.03)",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  opacity: selected[i] ? 1 : 0.6,
                  transition: "all 0.2s ease",
                }}
              >
                <button
                  onClick={() => setSelected((p) => ({ ...p, [i]: !p[i] }))}
                  style={{
                    flexShrink: 0,
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: `1px solid ${selected[i] ? "rgba(5,150,105,0.35)" : "rgba(225,29,72,0.35)"}`,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    background: selected[i] ? "rgba(5,150,105,0.1)" : "rgba(225,29,72,0.08)",
                    transition: "all 0.18s ease",
                    color: selected[i] ? "#6ee7b7" : "#fda4af",
                    fontWeight: 600,
                  }}
                >
                  {selected[i] ? "✓" : "✗"}
                </button>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px", flexWrap: "wrap" }}>
                    <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", fontWeight: 600, color: "#93c5fd" }}>
                      {d.column}
                    </code>
                    <span className={`badge ${d.badge}`}>{d.action}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{d.reason}</p>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "17px", fontWeight: 800, color: d.confidence > 90 ? "#059669" : "#d97706" }}>
                    {d.confidence}%
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>confidence</div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              padding: "12px 22px",
              borderTop: "1px solid var(--border)",
              fontSize: "12px",
              color: "var(--text-muted)",
              background: "var(--bg-secondary)",
            }}
          >
            Click any toggle to approve or skip an action. Changes take effect only after you confirm.
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
        background: "rgba(12,17,32,0.4)",
      }}
    >
      <div className="orb" style={{ width: 500, height: 500, background: "radial-gradient(circle, #1e3a8a, #2563eb)", top: "50%", left: "50%", transform: "translate(-50%, -50%)", opacity: 0.15 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "580px", margin: "0 auto" }}>
        <p className="section-label" style={{ marginBottom: "20px" }}>Ready to start?</p>
        <h2
          style={{
            fontSize: "clamp(32px, 5.5vw, 58px)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            marginBottom: "20px",
            lineHeight: 1.1,
          }}
        >
          Stop cleaning data{" "}
          <span className="gradient-text">by hand</span>
        </h2>
        <p style={{ fontSize: "16px", color: "var(--text-secondary)", marginBottom: "36px", lineHeight: 1.7 }}>
          Upload a CSV, review what Gemma recommends, and get a production-ready dataset in minutes. No account needed.
        </p>
        <Link href="/upload">
          <button className="btn-primary" style={{ padding: "13px 36px", fontSize: "15px" }}>
            <span>Upload a dataset</span>
          </button>
        </Link>
        <p style={{ marginTop: "20px", fontSize: "12px", color: "var(--text-muted)" }}>
          Works with Titanic, customer churn, heart disease, income data, and more
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      style={{
        padding: "32px 40px",
        borderTop: "1px solid var(--border-subtle)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
          <rect width="22" height="22" rx="6" fill="#2563eb"/>
          <path d="M7 11.5L10 14.5L15 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontWeight: 700, fontSize: "14px" }}>
          Forge<span style={{ color: "#60a5fa" }}>AI</span>
        </span>
        <span style={{ color: "var(--text-dimmed)", fontSize: "13px", marginLeft: "6px" }}>· AI Data Preprocessing</span>
      </div>

      <div style={{ display: "flex", gap: "24px" }}>
        {[
          { label: "Upload", href: "/upload" },
          { label: "Review", href: "/review" },
          { label: "Results", href: "/results" },
        ].map((l) => (
          <a key={l.label} href={l.href} className="nav-link" style={{ fontSize: "13px" }}>
            {l.label}
          </a>
        ))}
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>
        ForgeAI — July 2026
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
