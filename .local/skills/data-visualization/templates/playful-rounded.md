---
name: playful-rounded
description: >-
  This "Playful Rounded" dashboard uses a candy categorical palette of coral (#FF6B6B), teal (#2EC4B6), sunny yellow (#FFD166), and purple (#9B5DE5) against a soft off-white background (#FFF7F2) with pure white cards (#FFFFFF) carrying very round 28px corners and a soft diffuse shadow (0 12px 30px rgba(255,107,107,0.10)). Typography pairs the rounded geometric font "Baloo 2" (with fallbacks to Nunito, Quicksand, system-ui) for big cheerful headings/KPIs and "Nunito" for body/labels, with dark slate text (#2B2D42) and muted captions (#9AA0B4). The layout is a fixed 1440×900 grid: a top header bar with the app name, pill-shaped segmented date filter and rounded dropdowns, then a row of four KPI cards, followed by a two-thirds/one-third content row (a smooth SVG area+line chart left, a donut chart right) and a bottom row pairing a chunky rounded-bar chart with a compact data table. Charts are drawn as inline SVG with thick rounded strokes, gently curved area fills using soft gradient opacity, fully rounded bar caps (rx ~10), and colorful candy-toned dots; deltas use green (#06D6A0) up / coral (#FF6B6B) down pills. The overall aesthetic is friendly, bright, bouncy and approachable — generous whitespace, pastel-tinted accents, and rounded everything.
---

# Playful Rounded

This "Playful Rounded" dashboard uses a candy categorical palette of coral (#FF6B6B), teal (#2EC4B6), sunny yellow (#FFD166), and purple (#9B5DE5) against a soft off-white background (#FFF7F2) with pure white cards (#FFFFFF) carrying very round 28px corners and a soft diffuse shadow (0 12px 30px rgba(255,107,107,0.10)). Typography pairs the rounded geometric font "Baloo 2" (with fallbacks to Nunito, Quicksand, system-ui) for big cheerful headings/KPIs and "Nunito" for body/labels, with dark slate text (#2B2D42) and muted captions (#9AA0B4). The layout is a fixed 1440×900 grid: a top header bar with the app name, pill-shaped segmented date filter and rounded dropdowns, then a row of four KPI cards, followed by a two-thirds/one-third content row (a smooth SVG area+line chart left, a donut chart right) and a bottom row pairing a chunky rounded-bar chart with a compact data table. Charts are drawn as inline SVG with thick rounded strokes, gently curved area fills using soft gradient opacity, fully rounded bar caps (rx ~10), and colorful candy-toned dots; deltas use green (#06D6A0) up / coral (#FF6B6B) down pills. The overall aesthetic is friendly, bright, bouncy and approachable — generous whitespace, pastel-tinted accents, and rounded everything.

## Source Code

A self-contained reference implementation of the "Playful Rounded" dashboard
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
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sprout Analytics</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#FFF7F2; --card:#FFFFFF; --ink:#2B2D42; --muted:#9AA0B4;
    --coral:#FF6B6B; --teal:#2EC4B6; --yellow:#FFD166; --purple:#9B5DE5;
    --green:#06D6A0;
    --round:28px;
    --shadow:0 12px 30px rgba(255,107,107,0.10);
    --heading:'Baloo 2','Nunito','Quicksand',system-ui,-apple-system,Segoe UI,sans-serif;
    --body:'Nunito',system-ui,-apple-system,Segoe UI,sans-serif;
  }
  *{box-sizing:border-box}
  html,body{margin:0}
  body{
    width:1440px;height:900px;overflow:hidden;
    background:var(--bg);font-family:var(--body);color:var(--ink);
  }
  .app{width:1440px;height:900px;padding:24px 28px;display:flex;flex-direction:column;gap:18px}

  /* Header */
  header{display:flex;align-items:center;justify-content:space-between}
  .brand{display:flex;align-items:center;gap:14px}
  .logo{width:46px;height:46px;border-radius:16px;background:linear-gradient(135deg,var(--coral),var(--purple));
    display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow)}
  .logo svg{display:block}
  .brand h1{font-family:var(--heading);font-weight:800;font-size:24px;margin:0;letter-spacing:.2px}
  .brand p{margin:0;font-size:12.5px;color:var(--muted);font-weight:700}
  .controls{display:flex;align-items:center;gap:12px}
  .seg{display:flex;background:#fff;border-radius:999px;padding:5px;box-shadow:var(--shadow)}
  .seg button{border:0;background:transparent;font-family:var(--body);font-weight:800;font-size:13px;
    color:var(--muted);padding:8px 16px;border-radius:999px;cursor:pointer}
  .seg button.active{background:var(--teal);color:#fff}
  .pill{display:flex;align-items:center;gap:8px;background:#fff;border-radius:999px;padding:10px 16px;
    font-weight:800;font-size:13px;box-shadow:var(--shadow);color:var(--ink)}
  .pill .dot{width:9px;height:9px;border-radius:50%;background:var(--yellow)}
  .avatar{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--yellow),var(--coral));
    display:flex;align-items:center;justify-content:center;font-family:var(--heading);font-weight:800;color:#fff;box-shadow:var(--shadow)}

  /* KPI row */
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
  .kpi{background:var(--card);border-radius:var(--round);padding:20px 22px;box-shadow:var(--shadow);position:relative;overflow:hidden}
  .kpi .ic{width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:14px}
  .kpi .label{font-size:13px;color:var(--muted);font-weight:800}
  .kpi .val{font-family:var(--heading);font-weight:800;font-size:34px;line-height:1.1;margin:4px 0 8px}
  .delta{display:inline-flex;align-items:center;gap:5px;font-weight:800;font-size:12.5px;padding:5px 11px;border-radius:999px}
  .up{background:rgba(6,214,160,.14);color:#04a87d}
  .down{background:rgba(255,107,107,.14);color:#e85555}

  /* Content rows */
  .row{display:grid;gap:18px}
  .row.two{grid-template-columns:1.9fr 1fr}
  .row.bottom{grid-template-columns:1.45fr 1fr}
  .card{background:var(--card);border-radius:var(--round);padding:20px 22px;box-shadow:var(--shadow)}
  .card .head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
  .card h3{font-family:var(--heading);font-weight:800;font-size:18px;margin:0}
  .card .sub{font-size:12px;color:var(--muted);font-weight:700}
  .legend{display:flex;gap:14px;font-size:12px;font-weight:800;color:var(--muted)}
  .legend span{display:inline-flex;align-items:center;gap:6px}
  .legend i{width:11px;height:11px;border-radius:4px;display:inline-block}

  /* donut center */
  .donut-wrap{display:flex;align-items:center;gap:18px}
  .donut-legend{display:flex;flex-direction:column;gap:10px;flex:1}
  .dl{display:flex;align-items:center;justify-content:space-between;font-weight:800;font-size:13px}
  .dl .l{display:flex;align-items:center;gap:8px;color:var(--ink)}
  .dl .l i{width:12px;height:12px;border-radius:5px}
  .dl .v{color:var(--muted)}

  /* table */
  table{width:100%;border-collapse:collapse}
  th{text-align:left;font-size:11.5px;color:var(--muted);font-weight:800;text-transform:uppercase;letter-spacing:.4px;padding:0 10px 10px}
  td{padding:11px 10px;font-size:13.5px;font-weight:700;border-top:2px solid #F4F1F7}
  .chan{display:flex;align-items:center;gap:9px}
  .chan i{width:26px;height:26px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;font-family:var(--heading)}
  .tag{padding:4px 10px;border-radius:999px;font-size:11.5px;font-weight:800}
  .tg{background:rgba(6,214,160,.14);color:#04a87d}
  .tw{background:rgba(255,209,102,.22);color:#bd8b13}
</style>
</head>
<body>
<div class="app">

  <!-- HEADER -->
  <header>
    <div class="brand">
      <div class="logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 21c0-5 1-9 7-12-5 0-9 2-10 7-1-3-3-4-6-5 2 4 4 6 9 10Z" fill="#fff"/>
        </svg>
      </div>
      <div>
        <h1>Sprout Analytics</h1>
        <p>Growth overview · Workspace: Acme Co.</p>
      </div>
    </div>
    <div class="controls">
      <div class="seg">
        <button>Day</button>
        <button class="active">Week</button>
        <button>Month</button>
      </div>
      <div class="pill"><span class="dot"></span> Apr 1 – Apr 30, 2024</div>
      <div class="pill">All segments ▾</div>
      <div class="avatar">JL</div>
    </div>
  </header>

  <!-- KPI ROW -->
  <section class="kpis">
    <div class="kpi">
      <div class="ic" style="background:rgba(255,107,107,.15)">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M7 6h7a3 3 0 010 6H8a3 3 0 000 6h8" stroke="#FF6B6B" stroke-width="2.4" stroke-linecap="round"/></svg>
      </div>
      <div class="label">Total Revenue</div>
      <div class="val">$248.6k</div>
      <span class="delta up">▲ 12.4%</span>
    </div>
    <div class="kpi">
      <div class="ic" style="background:rgba(46,196,182,.15)">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.2" stroke="#2EC4B6" stroke-width="2.4"/><path d="M3.5 19c0-3 2.4-5 5.5-5s5.5 2 5.5 5M16 7a3 3 0 010 6M19.5 19c0-2-1-3.5-3-4.3" stroke="#2EC4B6" stroke-width="2.4" stroke-linecap="round"/></svg>
      </div>
      <div class="label">Active Users</div>
      <div class="val">38,902</div>
      <span class="delta up">▲ 8.1%</span>
    </div>
    <div class="kpi">
      <div class="ic" style="background:rgba(155,93,229,.15)">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 20L20 4M9 5a3 3 0 11-6 0 3 3 0 016 0Zm12 14a3 3 0 11-6 0 3 3 0 016 0Z" stroke="#9B5DE5" stroke-width="2.4" stroke-linecap="round"/></svg>
      </div>
      <div class="label">Conversion Rate</div>
      <div class="val">5.74%</div>
      <span class="delta down">▼ 1.3%</span>
    </div>
    <div class="kpi">
      <div class="ic" style="background:rgba(255,209,102,.28)">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 17l5-6 4 3 5-7 4 4" stroke="#E0A92B" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="label">MRR</div>
      <div class="val">$62.1k</div>
      <span class="delta up">▲ 6.7%</span>
    </div>
  </section>

  <!-- ROW TWO: area + donut -->
  <section class="row two">
    <div class="card">
      <div class="head">
        <div>
          <h3>Revenue Trend</h3>
          <div class="sub">Weekly revenue vs. target</div>
        </div>
        <div class="legend">
          <span><i style="background:var(--coral)"></i>Revenue</span>
          <span><i style="background:var(--teal)"></i>Target</span>
        </div>
      </div>
      <svg width="100%" height="252" viewBox="0 0 880 252" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#FF6B6B" stop-opacity="0.32"/>
            <stop offset="1" stop-color="#FF6B6B" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <!-- grid -->
        <g stroke="#F1ECF3" stroke-width="2">
          <line x1="0" y1="40" x2="880" y2="40"/>
          <line x1="0" y1="90" x2="880" y2="90"/>
          <line x1="0" y1="140" x2="880" y2="140"/>
          <line x1="0" y1="190" x2="880" y2="190"/>
        </g>
        <!-- area -->
        <path d="M0,180 C70,150 110,120 180,135 C250,150 300,90 380,100 C460,110 500,60 580,72 C660,84 700,55 780,48 C820,44 850,52 880,40 L880,230 L0,230 Z" fill="url(#ag)"/>
        <!-- revenue line -->
        <path d="M0,180 C70,150 110,120 180,135 C250,150 300,90 380,100 C460,110 500,60 580,72 C660,84 700,55 780,48 C820,44 850,52 880,40" fill="none" stroke="#FF6B6B" stroke-width="5" stroke-linecap="round"/>
        <!-- target line -->
        <path d="M0,165 C90,158 150,150 230,142 C320,132 380,128 470,118 C560,108 640,98 720,90 C790,84 840,78 880,72" fill="none" stroke="#2EC4B6" stroke-width="4" stroke-dasharray="3 9" stroke-linecap="round"/>
        <!-- dots -->
        <g fill="#fff" stroke="#FF6B6B" stroke-width="4">
          <circle cx="180" cy="135" r="6"/><circle cx="380" cy="100" r="6"/><circle cx="580" cy="72" r="6"/><circle cx="780" cy="48" r="6"/>
        </g>
        <!-- x labels -->
        <g fill="#9AA0B4" font-size="12" font-weight="700" font-family="Nunito,sans-serif">
          <text x="0" y="248">W1</text><text x="175" y="248">W2</text><text x="375" y="248">W3</text><text x="575" y="248">W4</text><text x="775" y="248">W5</text>
        </g>
      </svg>
    </div>

    <div class="card">
      <div class="head">
        <h3>Traffic Sources</h3>
      </div>
      <div class="donut-wrap" style="margin-top:8px">
        <svg width="172" height="172" viewBox="0 0 42 42">
          <circle cx="21" cy="21" r="15.9" fill="none" stroke="#F4F1F7" stroke-width="7"/>
          <!-- 4 slices, total 100 -->
          <circle cx="21" cy="21" r="15.9" fill="none" stroke="#FF6B6B" stroke-width="7" stroke-dasharray="38 62" stroke-dashoffset="25" stroke-linecap="round"/>
          <circle cx="21" cy="21" r="15.9" fill="none" stroke="#2EC4B6" stroke-width="7" stroke-dasharray="27 73" stroke-dashoffset="-13" stroke-linecap="round"/>
          <circle cx="21" cy="21" r="15.9" fill="none" stroke="#FFD166" stroke-width="7" stroke-dasharray="21 79" stroke-dashoffset="-40" stroke-linecap="round"/>
          <circle cx="21" cy="21" r="15.9" fill="none" stroke="#9B5DE5" stroke-width="7" stroke-dasharray="14 86" stroke-dashoffset="-61" stroke-linecap="round"/>
          <text x="21" y="20" text-anchor="middle" font-family="Baloo 2,sans-serif" font-weight="800" font-size="6.5" fill="#2B2D42">39k</text>
          <text x="21" y="25.5" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="700" font-size="2.8" fill="#9AA0B4">visits</text>
        </svg>
        <div class="donut-legend">
          <div class="dl"><span class="l"><i style="background:var(--coral)"></i>Organic</span><span class="v">38%</span></div>
          <div class="dl"><span class="l"><i style="background:var(--teal)"></i>Direct</span><span class="v">27%</span></div>
          <div class="dl"><span class="l"><i style="background:var(--yellow)"></i>Social</span><span class="v">21%</span></div>
          <div class="dl"><span class="l"><i style="background:var(--purple)"></i>Referral</span><span class="v">14%</span></div>
        </div>
      </div>
    </div>
  </section>

  <!-- ROW THREE: bars + table -->
  <section class="row bottom">
    <div class="card">
      <div class="head">
        <div>
          <h3>New Signups by Day</h3>
          <div class="sub">This week</div>
        </div>
        <div class="legend"><span><i style="background:var(--purple)"></i>Signups</span></div>
      </div>
      <svg width="100%" height="206" viewBox="0 0 560 206">
        <g stroke="#F1ECF3" stroke-width="2">
          <line x1="0" y1="40" x2="560" y2="40"/>
          <line x1="0" y1="95" x2="560" y2="95"/>
          <line x1="0" y1="150" x2="560" y2="150"/>
        </g>
        <g>
          <rect x="18"  y="78"  width="46" height="100" rx="12" fill="#FF6B6B"/>
          <rect x="94"  y="55"  width="46" height="123" rx="12" fill="#2EC4B6"/>
          <rect x="170" y="100" width="46" height="78"  rx="12" fill="#FFD166"/>
          <rect x="246" y="40"  width="46" height="138" rx="12" fill="#9B5DE5"/>
          <rect x="322" y="68"  width="46" height="110" rx="12" fill="#FF6B6B"/>
          <rect x="398" y="92"  width="46" height="86"  rx="12" fill="#2EC4B6"/>
          <rect x="474" y="60"  width="46" height="118" rx="12" fill="#FFD166"/>
        </g>
        <g fill="#9AA0B4" font-size="12" font-weight="700" font-family="Nunito,sans-serif" text-anchor="middle">
          <text x="41" y="198">Mon</text><text x="117" y="198">Tue</text><text x="193" y="198">Wed</text>
          <text x="269" y="198">Thu</text><text x="345" y="198">Fri</text><text x="421" y="198">Sat</text><text x="497" y="198">Sun</text>
        </g>
      </svg>
    </div>

    <div class="card">
      <div class="head"><h3>Top Channels</h3><div class="sub">by revenue</div></div>
      <table>
        <thead>
          <tr><th>Channel</th><th>Users</th><th>Revenue</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><div class="chan"><i style="background:var(--coral)">G</i>Google Ads</div></td>
            <td>12,402</td><td>$84.2k</td><td><span class="tag tg">Healthy</span></td>
          </tr>
          <tr>
            <td><div class="chan"><i style="background:var(--teal)">EM</i>Email</div></td>
            <td>8,910</td><td>$52.7k</td><td><span class="tag tg">Healthy</span></td>
          </tr>
          <tr>
            <td><div class="chan"><i style="background:var(--purple)">IG</i>Instagram</div></td>
            <td>6,533</td><td>$38.1k</td><td><span class="tag tw">Watch</span></td>
          </tr>
          <tr>
            <td><div class="chan"><i style="background:var(--yellow)">RF</i>Referral</div></td>
            <td>4,127</td><td>$21.4k</td><td><span class="tag tg">Healthy</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

</div>
</body>
</html>
```
