---
name: minimal-mono
description: >-
  This "Minimal Mono" dashboard uses a pure white (#ffffff) background with near-black text (#111111), a single grayscale ramp (#666666 muted text, #999999 captions, #e5e5e5 hairline borders, #f7f7f7 subtle fills), and exactly one reserved accent — a bright cobalt blue (#2563eb) used only for the primary Revenue metric and its sparkline area. Typography pairs Google Font "Inter" (with system-ui/Helvetica/Arial fallbacks) at tight letter-spacing for labels (uppercase, 10–11px, +0.12em tracking) and large lightweight numerals (28–34px, weight 600) for KPI values. The layout is a generous-air grid on a fixed 1440×900 canvas: a thin-bordered top header with app name and pill-style date/segment controls, a 4-up KPI card row, a 2/3 + 1/3 chart row (inline-SVG area chart for revenue, inline-SVG donut for traffic mix), and a bottom row pairing a thin-bar SVG chart with a minimal data table. All charts are hand-drawn inline SVG using 1px strokes, hairline gridlines (#e5e5e5), grayscale bars (#dddddd), and the lone blue accent only on the revenue area/line; everything sits inside 1px #e5e5e5 borders with no shadows, ~24px padding, and 28px gutters for an austere, editorial, lots-of-whitespace aesthetic.
---

# Minimal Mono

This "Minimal Mono" dashboard uses a pure white (#ffffff) background with near-black text (#111111), a single grayscale ramp (#666666 muted text, #999999 captions, #e5e5e5 hairline borders, #f7f7f7 subtle fills), and exactly one reserved accent — a bright cobalt blue (#2563eb) used only for the primary Revenue metric and its sparkline area. Typography pairs Google Font "Inter" (with system-ui/Helvetica/Arial fallbacks) at tight letter-spacing for labels (uppercase, 10–11px, +0.12em tracking) and large lightweight numerals (28–34px, weight 600) for KPI values. The layout is a generous-air grid on a fixed 1440×900 canvas: a thin-bordered top header with app name and pill-style date/segment controls, a 4-up KPI card row, a 2/3 + 1/3 chart row (inline-SVG area chart for revenue, inline-SVG donut for traffic mix), and a bottom row pairing a thin-bar SVG chart with a minimal data table. All charts are hand-drawn inline SVG using 1px strokes, hairline gridlines (#e5e5e5), grayscale bars (#dddddd), and the lone blue accent only on the revenue area/line; everything sits inside 1px #e5e5e5 borders with no shadows, ~24px padding, and 28px gutters for an austere, editorial, lots-of-whitespace aesthetic.

## Source Code

A self-contained reference implementation of the "Minimal Mono" dashboard
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
<title>Mono Analytics</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#ffffff; --ink:#111111; --muted:#666666; --cap:#999999;
    --line:#e5e5e5; --fill:#f7f7f7; --bar:#dddddd; --accent:#2563eb;
    --font:"Inter",system-ui,-apple-system,"Helvetica Neue",Helvetica,Arial,sans-serif;
  }
  *{box-sizing:border-box}
  html,body{margin:0}
  body{
    width:1440px;height:900px;background:var(--bg);color:var(--ink);
    font-family:var(--font);overflow:hidden;
    -webkit-font-smoothing:antialiased;
  }
  .label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--cap);font-weight:600}
  .root{width:1440px;height:900px;display:flex;flex-direction:column}

  /* Header */
  header{
    height:84px;border-bottom:1px solid var(--line);
    display:flex;align-items:center;justify-content:space-between;
    padding:0 40px;flex:0 0 auto;
  }
  .brand{display:flex;align-items:center;gap:14px}
  .mark{width:26px;height:26px;border:1px solid var(--ink);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}
  .brand h1{font-size:16px;font-weight:600;margin:0;letter-spacing:-.01em}
  .brand .sub{font-size:11px;color:var(--cap);margin-top:2px}
  .controls{display:flex;align-items:center;gap:10px}
  .pill{border:1px solid var(--line);height:34px;padding:0 14px;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);background:#fff}
  .pill.active{color:var(--ink);border-color:var(--ink)}
  .dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
  .seg{display:flex;border:1px solid var(--line)}
  .seg span{height:34px;padding:0 14px;display:flex;align-items:center;font-size:12px;color:var(--muted);border-right:1px solid var(--line)}
  .seg span:last-child{border-right:none}
  .seg span.on{background:var(--ink);color:#fff}

  /* main */
  main{flex:1 1 auto;padding:28px 40px 0;display:flex;flex-direction:column;gap:28px}

  /* KPI */
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:28px}
  .card{border:1px solid var(--line);padding:22px 24px;background:#fff}
  .kpi .val{font-size:32px;font-weight:600;letter-spacing:-.02em;margin:14px 0 8px;line-height:1}
  .kpi.primary .val{color:var(--accent)}
  .delta{font-size:12px;display:flex;align-items:center;gap:6px;color:var(--muted)}
  .delta .up{color:var(--ink);font-weight:600}
  .delta .down{color:var(--ink);font-weight:600}
  .arrow{font-size:11px}
  .kpi .spark{margin-top:14px}

  /* chart row */
  .row{display:grid;gap:28px}
  .row.charts{grid-template-columns:2fr 1fr}
  .row.bottom{grid-template-columns:1.4fr 1fr}
  .panel{border:1px solid var(--line);padding:22px 24px;display:flex;flex-direction:column}
  .phead{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px}
  .phead h3{margin:0;font-size:14px;font-weight:600;letter-spacing:-.01em}
  .phead .meta{font-size:11px;color:var(--cap);margin-top:4px}
  .legend{display:flex;gap:16px;font-size:11px;color:var(--muted);align-items:center}
  .legend i{display:inline-block;width:10px;height:3px;margin-right:6px;vertical-align:middle}

  /* donut */
  .donutwrap{display:flex;align-items:center;gap:24px}
  .dlist{flex:1}
  .dlist .dr{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line);font-size:12px}
  .dlist .dr:last-child{border-bottom:none}
  .dlist .nm{display:flex;align-items:center;gap:8px;color:var(--muted)}
  .dlist .nm b{width:8px;height:8px;display:inline-block}
  .dlist .pc{font-weight:600;color:var(--ink)}

  /* table */
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{ text-align:left;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--cap);font-weight:600;padding:0 0 12px;border-bottom:1px solid var(--line)}
  td{padding:12px 0;border-bottom:1px solid var(--line);color:var(--ink)}
  tr:last-child td{border-bottom:none}
  td.num{text-align:right;font-variant-numeric:tabular-nums}
  th.num{text-align:right}
  .tag{font-size:11px;color:var(--muted)}
  .pos{color:var(--ink);font-weight:600}
  .neg{color:var(--muted);font-weight:600}
</style>
</head>
<body>
<div class="root">
  <header>
    <div class="brand">
      <div class="mark">M</div>
      <div>
        <h1>Mono Analytics</h1>
        <div class="sub">Growth overview · Workspace: Acme Inc.</div>
      </div>
    </div>
    <div class="controls">
      <div class="pill"><span class="dot"></span> Live</div>
      <div class="pill active">Jan 1 – Jan 31, 2024</div>
      <div class="seg">
        <span>7D</span><span class="on">30D</span><span>QTD</span><span>YTD</span>
      </div>
    </div>
  </header>

  <main>
    <!-- KPIs -->
    <section class="kpis">
      <div class="card kpi primary">
        <div class="label">Revenue</div>
        <div class="val">$248,930</div>
        <div class="delta"><span class="up">▲ 12.4%</span> vs prev. 30 days</div>
        <div class="spark">
          <svg width="100%" height="34" viewBox="0 0 220 34" preserveAspectRatio="none">
            <polyline fill="none" stroke="#2563eb" stroke-width="1.5"
              points="0,26 22,24 44,27 66,20 88,22 110,16 132,18 154,11 176,13 198,7 220,4"/>
          </svg>
        </div>
      </div>
      <div class="card kpi">
        <div class="label">Active Users</div>
        <div class="val">38,412</div>
        <div class="delta"><span class="up">▲ 6.1%</span> vs prev. 30 days</div>
        <div class="spark">
          <svg width="100%" height="34" viewBox="0 0 220 34" preserveAspectRatio="none">
            <polyline fill="none" stroke="#999999" stroke-width="1.5"
              points="0,20 22,22 44,18 66,19 88,15 110,17 132,12 154,14 176,11 198,12 220,9"/>
          </svg>
        </div>
      </div>
      <div class="card kpi">
        <div class="label">Conversion</div>
        <div class="val">3.84%</div>
        <div class="delta"><span class="down">▼ 0.3%</span> vs prev. 30 days</div>
        <div class="spark">
          <svg width="100%" height="34" viewBox="0 0 220 34" preserveAspectRatio="none">
            <polyline fill="none" stroke="#999999" stroke-width="1.5"
              points="0,12 22,11 44,14 66,13 88,16 110,15 132,17 154,16 176,19 198,18 220,21"/>
          </svg>
        </div>
      </div>
      <div class="card kpi">
        <div class="label">MRR</div>
        <div class="val">$72,140</div>
        <div class="delta"><span class="up">▲ 4.8%</span> vs prev. 30 days</div>
        <div class="spark">
          <svg width="100%" height="34" viewBox="0 0 220 34" preserveAspectRatio="none">
            <polyline fill="none" stroke="#999999" stroke-width="1.5"
              points="0,24 22,23 44,21 66,22 88,18 110,19 132,17 154,15 176,16 198,13 220,12"/>
          </svg>
        </div>
      </div>
    </section>

    <!-- Charts -->
    <section class="row charts">
      <div class="panel">
        <div class="phead">
          <div>
            <h3>Revenue Trend</h3>
            <div class="meta">Daily net revenue · last 30 days</div>
          </div>
          <div class="legend">
            <span><i style="background:#2563eb"></i>This period</span>
            <span><i style="background:#dddddd"></i>Previous</span>
          </div>
        </div>
        <svg width="100%" height="232" viewBox="0 0 860 232" preserveAspectRatio="none">
          <!-- gridlines -->
          <g stroke="#e5e5e5" stroke-width="1">
            <line x1="0" y1="20" x2="860" y2="20"/>
            <line x1="0" y1="70" x2="860" y2="70"/>
            <line x1="0" y1="120" x2="860" y2="120"/>
            <line x1="0" y1="170" x2="860" y2="170"/>
            <line x1="0" y1="208" x2="860" y2="208"/>
          </g>
          <!-- previous (gray line) -->
          <polyline fill="none" stroke="#dddddd" stroke-width="1.5"
            points="0,150 60,148 120,160 180,140 240,150 300,135 360,142 420,128 480,134 540,120 600,126 660,112 720,118 780,108 860,104"/>
          <!-- this period area -->
          <path fill="#2563eb" fill-opacity="0.07" stroke="none"
            d="M0,140 60,132 120,138 180,118 240,124 300,104 360,110 420,90 480,96 540,78 600,84 660,66 720,72 780,52 860,46 L860,208 L0,208 Z"/>
          <polyline fill="none" stroke="#2563eb" stroke-width="2"
            points="0,140 60,132 120,138 180,118 240,124 300,104 360,110 420,90 480,96 540,78 600,84 660,66 720,72 780,52 860,46"/>
          <circle cx="860" cy="46" r="3.5" fill="#2563eb"/>
        </svg>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--cap);margin-top:10px;letter-spacing:.05em">
          <span>Jan 1</span><span>Jan 8</span><span>Jan 15</span><span>Jan 22</span><span>Jan 31</span>
        </div>
      </div>

      <div class="panel">
        <div class="phead">
          <div>
            <h3>Traffic Mix</h3>
            <div class="meta">By channel</div>
          </div>
        </div>
        <div class="donutwrap">
          <svg width="150" height="150" viewBox="0 0 42 42">
            <circle cx="21" cy="21" r="15.915" fill="none" stroke="#f7f7f7" stroke-width="7"/>
            <!-- segments: 42 / 28 / 18 / 12 of 100 -->
            <circle cx="21" cy="21" r="15.915" fill="none" stroke="#2563eb" stroke-width="7"
              stroke-dasharray="42 58" stroke-dashoffset="25"/>
            <circle cx="21" cy="21" r="15.915" fill="none" stroke="#666666" stroke-width="7"
              stroke-dasharray="28 72" stroke-dashoffset="-17"/>
            <circle cx="21" cy="21" r="15.915" fill="none" stroke="#bbbbbb" stroke-width="7"
              stroke-dasharray="18 82" stroke-dashoffset="-45"/>
            <circle cx="21" cy="21" r="15.915" fill="none" stroke="#dddddd" stroke-width="7"
              stroke-dasharray="12 88" stroke-dashoffset="-63"/>
            <text x="21" y="20" text-anchor="middle" font-size="6" font-weight="700" fill="#111111">38.4k</text>
            <text x="21" y="26" text-anchor="middle" font-size="2.6" fill="#999999" letter-spacing=".1">VISITS</text>
          </svg>
          <div class="dlist">
            <div class="dr"><span class="nm"><b style="background:#2563eb"></b>Organic</span><span class="pc">42%</span></div>
            <div class="dr"><span class="nm"><b style="background:#666666"></b>Direct</span><span class="pc">28%</span></div>
            <div class="dr"><span class="nm"><b style="background:#bbbbbb"></b>Referral</span><span class="pc">18%</span></div>
            <div class="dr"><span class="nm"><b style="background:#dddddd"></b>Social</span><span class="pc">12%</span></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Bottom -->
    <section class="row bottom">
      <div class="panel">
        <div class="phead">
          <div>
            <h3>Signups by Week</h3>
            <div class="meta">New accounts · last 8 weeks</div>
          </div>
          <div class="meta" style="color:var(--ink);font-weight:600">9,820 total</div>
        </div>
        <svg width="100%" height="150" viewBox="0 0 520 150" preserveAspectRatio="none">
          <line x1="0" y1="130" x2="520" y2="130" stroke="#e5e5e5"/>
          <g fill="#dddddd">
            <rect x="6"   y="78"  width="46" height="52"/>
            <rect x="70"  y="62"  width="46" height="68"/>
            <rect x="134" y="84"  width="46" height="46"/>
            <rect x="198" y="50"  width="46" height="80"/>
            <rect x="262" y="40"  width="46" height="90"/>
            <rect x="326" y="58"  width="46" height="72"/>
            <rect x="390" y="30"  width="46" height="100"/>
          </g>
          <rect x="454" y="18" width="46" height="112" fill="#111111"/>
        </svg>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--cap);margin-top:8px">
          <span>W1</span><span>W2</span><span>W3</span><span>W4</span><span>W5</span><span>W6</span><span>W7</span><span>W8</span>
        </div>
      </div>

      <div class="panel">
        <div class="phead">
          <div>
            <h3>Top Plans</h3>
            <div class="meta">Revenue by subscription tier</div>
          </div>
        </div>
        <table>
          <thead>
            <tr><th>Plan</th><th class="num">Accounts</th><th class="num">MRR</th><th class="num">Δ</th></tr>
          </thead>
          <tbody>
            <tr><td>Enterprise <span class="tag">/ annual</span></td><td class="num">312</td><td class="num">$41,200</td><td class="num pos">+5.2%</td></tr>
            <tr><td>Business <span class="tag">/ monthly</span></td><td class="num">948</td><td class="num">$22,640</td><td class="num pos">+3.1%</td></tr>
            <tr><td>Pro <span class="tag">/ monthly</span></td><td class="num">2,104</td><td class="num">$6,920</td><td class="num neg">−1.4%</td></tr>
            <tr><td>Starter <span class="tag">/ monthly</span></td><td class="num">5,780</td><td class="num">$1,380</td><td class="num pos">+0.8%</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</div>
</body>
</html>
```
