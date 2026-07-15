"""
ForgeAI Backend — HTML Report Generator
Owner: Member 2 (Backend Engineer)

Generates a self-contained, beautiful HTML AI Decision Report.
All CSS is inlined — zero external dependencies.
"""

from datetime import datetime


def generate_html_report(
    dataset_name: str,
    health_before: int,
    health_after: int,
    decision_log: list[dict],
    ml_recommendations: list[dict],
    summary: str,
    rows_before: int,
    rows_after: int,
    columns_before: int,
    columns_after: int,
) -> str:
    today = datetime.now().strftime("%B %d, %Y at %H:%M UTC")
    score_delta = health_after - health_before

    # ── Decision log rows ─────────────────────────────────────
    def impact_color(impact: str) -> str:
        return {"High": "#f43f5e", "Medium": "#f59e0b", "Low": "#3b82f6"}.get(impact, "#8b5cf6")

    log_rows = ""
    for i, entry in enumerate(decision_log, 1):
        status_icon = "✅" if "success" in entry.get("status", "success") else "❌"
        imp = entry.get("impact", "Medium")
        log_rows += f"""
        <tr>
          <td style="text-align:center">{status_icon}</td>
          <td style="font-weight:600">{entry.get('action', '')}</td>
          <td style="color:#94a3b8;font-size:13px">{entry.get('column', '')}</td>
          <td style="font-size:12px;color:#94a3b8;max-width:320px">{entry.get('reason', '')[:120]}{'...' if len(entry.get('reason',''))>120 else ''}</td>
          <td><span style="padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;background:{impact_color(imp)}22;color:{impact_color(imp)}">{imp}</span></td>
          <td style="color:#64748b;font-size:12px">{entry.get('time_ms', 0)}ms</td>
        </tr>"""

    # ── ML recommendation rows ────────────────────────────────
    ml_cards = ""
    for rec in ml_recommendations:
        suit = rec.get("suitability", 0)
        suit_color = "#10b981" if suit >= 85 else "#f59e0b" if suit >= 70 else "#f43f5e"
        pros_html = "".join(
            f'<span style="margin:2px 4px;padding:2px 8px;border-radius:6px;'
            f'background:#3b82f620;color:#93c5fd;font-size:11px">✓ {p}</span>'
            for p in rec.get("pros", [])
        )
        ml_cards += f"""
        <div style="border:1px solid #1e293b;border-radius:12px;padding:20px;margin-bottom:12px;
                    background:#0d1424;position:relative;overflow:hidden">
          <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:{suit_color}"></div>
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:18px;font-weight:700;margin-bottom:4px">{rec.get('model','')}</div>
              <div style="font-size:12px;color:#64748b;margin-bottom:8px">{rec.get('type','')}</div>
              <div style="font-size:13px;color:#94a3b8;margin-bottom:10px">{rec.get('reason','')}</div>
              <div>{pros_html}</div>
            </div>
            <div style="text-align:right;min-width:70px">
              <div style="font-size:26px;font-weight:900;color:{suit_color}">{suit}%</div>
              <div style="font-size:11px;color:#64748b">suitability</div>
            </div>
          </div>
        </div>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ForgeAI Decision Report — {dataset_name}</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
      background: #030712;
      color: #e2e8f0;
      line-height: 1.6;
      padding: 40px 20px;
    }}
    .container {{ max-width: 960px; margin: 0 auto; }}
    .card {{
      background: #0d1424;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 24px;
    }}
    .gradient-text {{
      background: linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }}
    .badge {{
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
    }}
    table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
    th {{
      text-align: left;
      padding: 10px 14px;
      color: #64748b;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #1e293b;
    }}
    td {{ padding: 10px 14px; border-bottom: 1px solid #0f172a; vertical-align: top; }}
    tr:last-child td {{ border-bottom: none; }}
    .ring-wrap {{ display: flex; align-items: center; gap: 40px; flex-wrap: wrap; }}
    .ring {{ text-align: center; }}
    .ring-label {{ font-size: 13px; color: #64748b; margin-top: 8px; font-weight: 600; }}
    h1 {{ font-size: 32px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 6px; }}
    h2 {{ font-size: 18px; font-weight: 700; margin-bottom: 16px; }}
    .stat {{ font-size: 28px; font-weight: 900; }}
  </style>
</head>
<body>
  <div class="container">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:48px">
      <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:16px">
        <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);
                    display:flex;align-items:center;justify-content:center;font-size:20px">⚡</div>
        <span style="font-size:24px;font-weight:900">Forge<span style="color:#60a5fa">AI</span></span>
      </div>
      <h1>AI Decision Report</h1>
      <p style="color:#94a3b8;margin-top:8px">
        Dataset: <strong style="color:#93c5fd">{dataset_name}</strong> · Generated: {today}
      </p>
    </div>

    <!-- Health Score -->
    <div class="card">
      <h2>📊 Dataset Health Score</h2>
      <div class="ring-wrap">
        <!-- Before ring -->
        <div class="ring">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="46" fill="none" stroke="#1e293b" stroke-width="10"/>
            <circle cx="60" cy="60" r="46" fill="none" stroke="#f43f5e" stroke-width="10"
              stroke-dasharray="{2*3.14159*46*health_before/100:.1f} {2*3.14159*46:.1f}"
              stroke-dashoffset="{2*3.14159*46*0.25:.1f}" stroke-linecap="round"/>
            <text x="60" y="58" text-anchor="middle" font-size="22" font-weight="900" fill="#f43f5e">{health_before}</text>
            <text x="60" y="72" text-anchor="middle" font-size="10" fill="#64748b">/ 100</text>
          </svg>
          <div class="ring-label">Before Score</div>
        </div>
        <!-- Arrow -->
        <div style="font-size:32px;color:#475569">→</div>
        <!-- After ring -->
        <div class="ring">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="46" fill="none" stroke="#1e293b" stroke-width="10"/>
            <circle cx="60" cy="60" r="46" fill="none" stroke="#10b981" stroke-width="10"
              stroke-dasharray="{2*3.14159*46*health_after/100:.1f} {2*3.14159*46:.1f}"
              stroke-dashoffset="{2*3.14159*46*0.25:.1f}" stroke-linecap="round"/>
            <text x="60" y="58" text-anchor="middle" font-size="22" font-weight="900" fill="#10b981">{health_after}</text>
            <text x="60" y="72" text-anchor="middle" font-size="10" fill="#64748b">/ 100</text>
          </svg>
          <div class="ring-label">After Score</div>
        </div>
        <!-- Improvement badge -->
        <div style="padding:16px 24px;background:#10b98115;border:1px solid #10b98130;border-radius:12px">
          <div class="stat" style="color:#10b981">+{score_delta}</div>
          <div style="font-size:13px;color:#64748b">improvement</div>
        </div>
        <!-- Stats -->
        <div style="display:flex;flex-direction:column;gap:10px">
          <div><span style="color:#64748b;font-size:12px">Rows:</span>
            <span style="font-weight:700;margin-left:8px">{rows_before:,} → {rows_after:,}</span></div>
          <div><span style="color:#64748b;font-size:12px">Columns:</span>
            <span style="font-weight:700;margin-left:8px">{columns_before} → {columns_after}</span></div>
          <div><span style="color:#64748b;font-size:12px">Actions:</span>
            <span style="font-weight:700;margin-left:8px">{len(decision_log)} applied</span></div>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="card">
      <h2>🧠 Gemma Analysis Summary</h2>
      <p style="color:#94a3b8;line-height:1.7">{summary}</p>
    </div>

    <!-- Decision Log -->
    <div class="card">
      <h2>📋 AI Decision Log</h2>
      <table>
        <thead>
          <tr>
            <th style="width:40px"></th>
            <th>Action</th>
            <th>Column</th>
            <th>Reason</th>
            <th>Impact</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>{log_rows}</tbody>
      </table>
    </div>

    <!-- ML Recommendations -->
    <div class="card">
      <h2>🎯 ML Model Recommendations</h2>
      {ml_cards}
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;color:#475569;font-size:13px">
      Generated by <strong style="color:#60a5fa">ForgeAI</strong> ·
      AI reasons. Python executes. Humans approve.
    </div>

  </div>
</body>
</html>"""

    return html
