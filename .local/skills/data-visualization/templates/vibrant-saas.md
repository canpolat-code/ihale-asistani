---
name: vibrant-saas
description: >-
  This "Vibrant SaaS" dashboard uses a clean white canvas (#f6f7fb app background, #ffffff cards) with a signature violet-to-blue brand gradient (linear-gradient 135deg from #7c3aed through #6366f1 to #3b82f6) applied to the hero KPI strip and primary actions. Typography is "Inter" with system-ui/Segoe UI/Arial fallbacks: tight 700–800 weights for numbers and headings, 13–14px medium grays (#64748b) for labels. The layout is a fixed 1440×900 grid with a slim top header (app name + pill filters + gradient date control), a 4-up KPI row (gradient hero card plus three white rounded-xl cards with up/down delta chips in emerald #10b981 / rose #f43f5e), then a 2-column content area: a large white card holding an inline-SVG gradient area chart, a colorful categorical bar chart, and a side donut with a legend, plus a compact data table below. Cards use border-radius 16px, 1px #eef0f6 borders, and soft layered shadows (0 1px 2px rgba(16,24,40,.06), 0 10px 30px rgba(16,24,40,.05)); accent categorical colors are violet #8b5cf6, blue #3b82f6, cyan #06b6d4, amber #f59e0b, and pink #ec4899. The overall feel is bright, friendly, energetic, and product-grade — generous whitespace, rounded geometry, and saturated gradient highlights against airy neutrals.
---

# Vibrant SaaS

This "Vibrant SaaS" dashboard uses a clean white canvas (#f6f7fb app background, #ffffff cards) with a signature violet-to-blue brand gradient (linear-gradient 135deg from #7c3aed through #6366f1 to #3b82f6) applied to the hero KPI strip and primary actions. Typography is "Inter" with system-ui/Segoe UI/Arial fallbacks: tight 700–800 weights for numbers and headings, 13–14px medium grays (#64748b) for labels. The layout is a fixed 1440×900 grid with a slim top header (app name + pill filters + gradient date control), a 4-up KPI row (gradient hero card plus three white rounded-xl cards with up/down delta chips in emerald #10b981 / rose #f43f5e), then a 2-column content area: a large white card holding an inline-SVG gradient area chart, a colorful categorical bar chart, and a side donut with a legend, plus a compact data table below. Cards use border-radius 16px, 1px #eef0f6 borders, and soft layered shadows (0 1px 2px rgba(16,24,40,.06), 0 10px 30px rgba(16,24,40,.05)); accent categorical colors are violet #8b5cf6, blue #3b82f6, cyan #06b6d4, amber #f59e0b, and pink #ec4899. The overall feel is bright, friendly, energetic, and product-grade — generous whitespace, rounded geometry, and saturated gradient highlights against airy neutrals.

## Source Code

A self-contained reference implementation of the "Vibrant SaaS" dashboard
preview. Use it as the visual target — translate the palette, typography, and
layout into the data-visualization React + Tailwind + Recharts app.
The fixed 1440×900 frame and hand-drawn inline-SVG charts below are
preview-rendering artifacts — keep the generated app's layout responsive
and build every chart with Recharts.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1440, initial-scale=1">
<title>Pulse Analytics</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#f6f7fb; --card:#ffffff; --ink:#0f172a; --muted:#64748b; --line:#eef0f6;
    --grad:linear-gradient(135deg,#7c3aed 0%,#6366f1 50%,#3b82f6 100%);
    --violet:#8b5cf6; --blue:#3b82f6; --cyan:#06b6d4; --amber:#f59e0b; --pink:#ec4899;
    --up:#10b981; --down:#f43f5e;
    --shadow:0 1px 2px rgba(16,24,40,.06),0 10px 30px rgba(16,24,40,.05);
  }
  *{box-sizing:border-box}
  html,body{margin:0}
  body{
    width:1440px;height:900px;overflow:hidden;background:var(--bg);
    font-family:'Inter',system-ui,-apple-system,'Segoe UI',Arial,sans-serif;
    color:var(--ink);
  }
  .app{padding:22px 26px;height:900px;display:flex;flex-direction:column;gap:18px}

  /* Header */
  .header{display:flex;align-items:center;justify-content:space-between}
  .brand{display:flex;align-items:center;gap:12px}
  .logo{width:40px;height:40px;border-radius:12px;background:var(--grad);display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow)}
  .logo svg{width:22px;height:22px}
  .brand h1{font-size:19px;font-weight:800;margin:0;letter-spacing:-.3px}
  .brand p{margin:0;font-size:12px;color:var(--muted);font-weight:500}
  .controls{display:flex;align-items:center;gap:10px}
  .pills{display:flex;background:#fff;border:1px solid var(--line);border-radius:12px;padding:4px;box-shadow:var(--shadow)}
  .pill{padding:7px 14px;border-radius:9px;font-size:13px;font-weight:600;color:var(--muted);cursor:pointer}
  .pill.active{color:#fff;background:var(--grad);box-shadow:0 4px 12px rgba(99,102,241,.35)}
  .date{display:flex;align-items:center;gap:8px;background:var(--grad);color:#fff;font-weight:600;font-size:13px;padding:9px 14px;border-radius:12px;box-shadow:0 6px 16px rgba(99,102,241,.3)}
  .date svg{width:16px;height:16px}
  .avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#ec4899,#f59e0b);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px}

  /* KPI row */
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
  .kpi{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px;box-shadow:var(--shadow)}
  .kpi .label{font-size:13px;color:var(--muted);font-weight:600}
  .kpi .val{font-size:28px;font-weight:800;letter-spacing:-.6px;margin-top:6px}
  .kpi .row{display:flex;align-items:center;justify-content:space-between;margin-top:12px}
  .delta{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;padding:4px 8px;border-radius:8px}
  .delta.up{color:var(--up);background:rgba(16,185,129,.1)}
  .delta.down{color:var(--down);background:rgba(244,63,94,.1)}
  .kpi .spark{height:30px}
  .hero{background:var(--grad);color:#fff;border:none}
  .hero .label{color:rgba(255,255,255,.85)}
  .hero .delta.up{color:#fff;background:rgba(255,255,255,.22)}

  /* Content */
  .content{display:grid;grid-template-columns:2.1fr 1fr;gap:16px;flex:1;min-height:0}
  .col{display:flex;flex-direction:column;gap:16px;min-height:0}
  .card{background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:18px;display:flex;flex-direction:column;min-height:0}
  .card h3{margin:0;font-size:15px;font-weight:700}
  .card .sub{margin:2px 0 0;font-size:12px;color:var(--muted);font-weight:500}
  .ch-head{display:flex;align-items:flex-start;justify-content:space-between}
  .legend{display:flex;gap:14px;font-size:12px;font-weight:600;color:var(--muted)}
  .legend span{display:inline-flex;align-items:center;gap:6px}
  .dot{width:9px;height:9px;border-radius:3px;display:inline-block}

  .grid2{display:grid;grid-template-columns:1.35fr 1fr;gap:16px;flex:1;min-height:0}

  /* donut */
  .donut-wrap{display:flex;align-items:center;gap:16px;flex:1}
  .dleg{display:flex;flex-direction:column;gap:10px}
  .dleg .it{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600}
  .dleg .it .v{margin-left:auto;color:var(--muted);font-weight:700}

  /* table */
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;color:var(--muted);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.5px;padding:0 0 10px}
  td{padding:9px 0;border-top:1px solid var(--line);font-weight:600}
  td.muted{color:var(--muted);font-weight:500}
  .badge{font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px}
  .b-up{color:var(--up);background:rgba(16,185,129,.12)}
  .b-pend{color:var(--amber);background:rgba(245,158,11,.13)}
  .b-low{color:var(--down);background:rgba(244,63,94,.12)}
  .right{text-align:right}
</style>
</head>
<body>
<div class="app">

  <!-- HEADER -->
  <div class="header">
    <div class="brand">
      <div class="logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13h3l3 7 4-16 3 9h5"/></svg>
      </div>
      <div>
        <h1>Pulse Analytics</h1>
        <p>Workspace · Acme Growth Team</p>
      </div>
    </div>
    <div class="controls">
      <div class="pills">
        <div class="pill">Day</div>
        <div class="pill">Week</div>
        <div class="pill active">Month</div>
        <div class="pill">Quarter</div>
      </div>
      <div class="date">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        Jan 1 – Jan 31, 2025
      </div>
      <div class="avatar">AK</div>
    </div>
  </div>

  <!-- KPIs -->
  <div class="kpis">
    <div class="kpi hero">
      <div class="label">Total Revenue</div>
      <div class="val">$284,920</div>
      <div class="row">
        <span class="delta up">▲ 12.4%</span>
        <svg class="spark" viewBox="0 0 120 30" preserveAspectRatio="none"><polyline fill="none" stroke="rgba(255,255,255,.85)" stroke-width="2.4" points="0,24 15,20 30,22 45,14 60,16 75,9 90,11 105,5 120,3"/></svg>
      </div>
    </div>
    <div class="kpi">
      <div class="label">Active Users</div>
      <div class="val">48,217</div>
      <div class="row">
        <span class="delta up">▲ 8.1%</span>
        <svg class="spark" viewBox="0 0 120 30" preserveAspectRatio="none"><polyline fill="none" stroke="#8b5cf6" stroke-width="2.4" points="0,20 15,22 30,16 45,18 60,12 75,14 90,8 105,10 120,5"/></svg>
      </div>
    </div>
    <div class="kpi">
      <div class="label">Conversion Rate</div>
      <div class="val">4.92%</div>
      <div class="row">
        <span class="delta down">▼ 0.6%</span>
        <svg class="spark" viewBox="0 0 120 30" preserveAspectRatio="none"><polyline fill="none" stroke="#f43f5e" stroke-width="2.4" points="0,8 15,10 30,7 45,12 60,11 75,16 90,14 105,19 120,21"/></svg>
      </div>
    </div>
    <div class="kpi">
      <div class="label">MRR</div>
      <div class="val">$92,480</div>
      <div class="row">
        <span class="delta up">▲ 5.3%</span>
        <svg class="spark" viewBox="0 0 120 30" preserveAspectRatio="none"><polyline fill="none" stroke="#06b6d4" stroke-width="2.4" points="0,22 15,18 30,19 45,15 60,16 75,11 90,12 105,8 120,6"/></svg>
      </div>
    </div>
  </div>

  <!-- CONTENT -->
  <div class="content">
    <!-- LEFT -->
    <div class="col">
      <!-- Area chart -->
      <div class="card" style="flex:1.3">
        <div class="ch-head">
          <div>
            <h3>Revenue Overview</h3>
            <p class="sub">Daily gross revenue · this month</p>
          </div>
          <div class="legend">
            <span><i class="dot" style="background:#6366f1"></i>Revenue</span>
            <span><i class="dot" style="background:#06b6d4"></i>Target</span>
          </div>
        </div>
        <svg viewBox="0 0 720 230" preserveAspectRatio="none" style="width:100%;flex:1;margin-top:6px">
          <defs>
            <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#6366f1" stop-opacity="0.35"/>
              <stop offset="1" stop-color="#6366f1" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <g stroke="#eef0f6" stroke-width="1">
            <line x1="0" y1="40" x2="720" y2="40"/>
            <line x1="0" y1="90" x2="720" y2="90"/>
            <line x1="0" y1="140" x2="720" y2="140"/>
            <line x1="0" y1="190" x2="720" y2="190"/>
          </g>
          <path d="M0,160 L72,140 L144,150 L216,108 L288,120 L360,80 L432,92 L504,55 L576,68 L648,40 L720,30 L720,230 L0,230 Z" fill="url(#ag)"/>
          <polyline fill="none" stroke="#6366f1" stroke-width="3" points="0,160 72,140 144,150 216,108 288,120 360,80 432,92 504,55 576,68 648,40 720,30"/>
          <polyline fill="none" stroke="#06b6d4" stroke-width="2.4" stroke-dasharray="5 5" points="0,150 72,142 144,134 216,126 288,118 360,110 432,102 504,94 576,86 648,78 720,70"/>
          <circle cx="648" cy="40" r="4.5" fill="#fff" stroke="#6366f1" stroke-width="3"/>
        </svg>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);font-weight:600;margin-top:6px">
          <span>Jan 1</span><span>Jan 6</span><span>Jan 11</span><span>Jan 16</span><span>Jan 21</span><span>Jan 26</span><span>Jan 31</span>
        </div>
      </div>

      <div class="grid2">
        <!-- Bar chart -->
        <div class="card">
          <div class="ch-head">
            <div><h3>Revenue by Channel</h3><p class="sub">in thousands ($)</p></div>
          </div>
          <svg viewBox="0 0 360 200" style="width:100%;flex:1;margin-top:6px">
            <g stroke="#eef0f6"><line x1="0" y1="170" x2="360" y2="170"/></g>
            <g>
              <rect x="22" y="60" width="38" height="110" rx="6" fill="#8b5cf6"/>
              <rect x="92" y="40" width="38" height="130" rx="6" fill="#3b82f6"/>
              <rect x="162" y="90" width="38" height="80" rx="6" fill="#06b6d4"/>
              <rect x="232" y="75" width="38" height="95" rx="6" fill="#f59e0b"/>
              <rect x="302" y="110" width="38" height="60" rx="6" fill="#ec4899"/>
            </g>
            <g font-size="11" fill="#64748b" font-weight="600" text-anchor="middle">
              <text x="41" y="188">Organic</text>
              <text x="111" y="188">Paid</text>
              <text x="181" y="188">Email</text>
              <text x="251" y="188">Social</text>
              <text x="321" y="188">Affil.</text>
            </g>
          </svg>
        </div>

        <!-- Donut -->
        <div class="card">
          <div class="ch-head"><div><h3>Plan Mix</h3><p class="sub">active subscriptions</p></div></div>
          <div class="donut-wrap">
            <svg viewBox="0 0 120 120" width="118" height="118">
              <circle cx="60" cy="60" r="46" fill="none" stroke="#eef0f6" stroke-width="16"/>
              <!-- 46% violet, 30% blue, 16% cyan, 8% amber  circ=289 -->
              <circle cx="60" cy="60" r="46" fill="none" stroke="#8b5cf6" stroke-width="16" stroke-dasharray="133 156" transform="rotate(-90 60 60)"/>
              <circle cx="60" cy="60" r="46" fill="none" stroke="#3b82f6" stroke-width="16" stroke-dasharray="87 202" stroke-dashoffset="-133" transform="rotate(-90 60 60)"/>
              <circle cx="60" cy="60" r="46" fill="none" stroke="#06b6d4" stroke-width="16" stroke-dasharray="46 243" stroke-dashoffset="-220" transform="rotate(-90 60 60)"/>
              <circle cx="60" cy="60" r="46" fill="none" stroke="#f59e0b" stroke-width="16" stroke-dasharray="23 266" stroke-dashoffset="-266" transform="rotate(-90 60 60)"/>
              <text x="60" y="56" text-anchor="middle" font-size="20" font-weight="800" fill="#0f172a">12.4k</text>
              <text x="60" y="72" text-anchor="middle" font-size="9" font-weight="600" fill="#64748b">total</text>
            </svg>
            <div class="dleg">
              <div class="it"><i class="dot" style="background:#8b5cf6"></i>Pro<span class="v">46%</span></div>
              <div class="it"><i class="dot" style="background:#3b82f6"></i>Team<span class="v">30%</span></div>
              <div class="it"><i class="dot" style="background:#06b6d4"></i>Starter<span class="v">16%</span></div>
              <div class="it"><i class="dot" style="background:#f59e0b"></i>Free<span class="v">8%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT -->
    <div class="col">
      <div class="card" style="flex:1">
        <div class="ch-head"><div><h3>Top Accounts</h3><p class="sub">by monthly contract value</p></div></div>
        <table style="margin-top:10px">
          <thead><tr><th>Account</th><th>Plan</th><th class="right">MRR</th><th class="right">Status</th></tr></thead>
          <tbody>
            <tr><td>Northwind Co.</td><td class="muted">Enterprise</td><td class="right">$18,400</td><td class="right"><span class="badge b-up">Healthy</span></td></tr>
            <tr><td>Lumen Labs</td><td class="muted">Pro</td><td class="right">$9,250</td><td class="right"><span class="badge b-up">Healthy</span></td></tr>
            <tr><td>Vertex Media</td><td class="muted">Team</td><td class="right">$6,800</td><td class="right"><span class="badge b-pend">Trial</span></td></tr>
            <tr><td>Cobalt Inc.</td><td class="muted">Pro</td><td class="right">$5,120</td><td class="right"><span class="badge b-up">Healthy</span></td></tr>
            <tr><td>Mosaic Studio</td><td class="muted">Starter</td><td class="right">$2,940</td><td class="right"><span class="badge b-low">At risk</span></td></tr>
            <tr><td>Driftwood AG</td><td class="muted">Team</td><td class="right">$2,310</td><td class="right"><span class="badge b-pend">Trial</span></td></tr>
            <tr><td>Halcyon Tech</td><td class="muted">Pro</td><td class="right">$1,880</td><td class="right"><span class="badge b-up">Healthy</span></td></tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <div class="ch-head"><div><h3>Goal Progress</h3><p class="sub">quarterly revenue target</p></div></div>
        <div style="margin-top:14px;display:flex;flex-direction:column;gap:14px">
          <div>
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:6px"><span>Revenue</span><span style="color:var(--muted)">$285k / $320k</span></div>
            <div style="height:9px;background:#eef0f6;border-radius:6px;overflow:hidden"><div style="width:89%;height:100%;background:var(--grad)"></div></div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:6px"><span>New Customers</span><span style="color:var(--muted)">412 / 500</span></div>
            <div style="height:9px;background:#eef0f6;border-radius:6px;overflow:hidden"><div style="width:82%;height:100%;background:linear-gradient(90deg,#06b6d4,#3b82f6)"></div></div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:6px"><span>Retention</span><span style="color:var(--muted)">94% / 95%</span></div>
            <div style="height:9px;background:#eef0f6;border-radius:6px;overflow:hidden"><div style="width:94%;height:100%;background:linear-gradient(90deg,#ec4899,#f59e0b)"></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</body>
</html>
```
