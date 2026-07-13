---
name: warm-report
description: >-
  This "Warm Report" dashboard uses a cream canvas (#FBF4EA) with soft sand cards (#FFFDF8) bordered in #ECDFC9 and lifted by gentle shadows (rgba(120,72,40,0.08)), all in rounded 18px radii. The palette commits to terracotta (#C2562F), a lighter coral-clay (#E07B4C), warm amber (#E0A458), and deep brown (#4A2F22) for headings/text, with muted brown (#8A6F5D) for secondary labels; a warm sequential chart ramp runs #F3D9B9 → #E0A458 → #E07B4C → #C2562F → #9C3B1E. Typography pairs "Fraunces" (serif, for the app title and KPI numbers) with "Inter" (sans, for body, labels, and table) with system fallbacks. The layout is a fixed 1440×900 grid: a top header bar with app name plus date-range and segment pills, a row of four KPI cards, then a main area split into a large area/line chart card (left), a vertical bar chart and a donut stacked on the right, and a slim transactions table beneath; charts are rendered as inline SVG with smooth filled gradient areas, rounded bar tops, soft gridlines (#EFE3CF), and warm-toned series. The overall aesthetic feels editorial, calm, and approachable — like a printed annual report rendered in warm earth tones with generous whitespace and friendly curves.
---

# Warm Report

This "Warm Report" dashboard uses a cream canvas (#FBF4EA) with soft sand cards (#FFFDF8) bordered in #ECDFC9 and lifted by gentle shadows (rgba(120,72,40,0.08)), all in rounded 18px radii. The palette commits to terracotta (#C2562F), a lighter coral-clay (#E07B4C), warm amber (#E0A458), and deep brown (#4A2F22) for headings/text, with muted brown (#8A6F5D) for secondary labels; a warm sequential chart ramp runs #F3D9B9 → #E0A458 → #E07B4C → #C2562F → #9C3B1E. Typography pairs "Fraunces" (serif, for the app title and KPI numbers) with "Inter" (sans, for body, labels, and table) with system fallbacks. The layout is a fixed 1440×900 grid: a top header bar with app name plus date-range and segment pills, a row of four KPI cards, then a main area split into a large area/line chart card (left), a vertical bar chart and a donut stacked on the right, and a slim transactions table beneath; charts are rendered as inline SVG with smooth filled gradient areas, rounded bar tops, soft gridlines (#EFE3CF), and warm-toned series. The overall aesthetic feels editorial, calm, and approachable — like a printed annual report rendered in warm earth tones with generous whitespace and friendly curves.

## Source Code

A self-contained reference implementation of the "Warm Report" dashboard
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
<title>Warm Report — Analytics</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --cream:#FBF4EA;
    --card:#FFFDF8;
    --border:#ECDFC9;
    --grid:#EFE3CF;
    --terra:#C2562F;
    --clay:#E07B4C;
    --amber:#E0A458;
    --sand:#F3D9B9;
    --deep:#9C3B1E;
    --brown:#4A2F22;
    --muted:#8A6F5D;
    --green:#5C8A4E;
    --red:#C2562F;
    --shadow:0 8px 24px rgba(120,72,40,0.08);
    --serif:"Fraunces", Georgia, "Times New Roman", serif;
    --sans:"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  *{box-sizing:border-box}
  html,body{margin:0}
  body{
    width:1440px;height:900px;overflow:hidden;
    background:var(--cream);
    font-family:var(--sans);
    color:var(--brown);
  }
  .app{width:1440px;height:900px;padding:24px 32px;display:flex;flex-direction:column;gap:18px}

  /* header */
  header{display:flex;align-items:center;justify-content:space-between}
  .brand{display:flex;align-items:center;gap:14px}
  .logo{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,var(--clay),var(--terra));display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--serif);font-weight:700;font-size:22px;box-shadow:var(--shadow)}
  .brand h1{font-family:var(--serif);font-weight:600;font-size:24px;margin:0;color:var(--brown)}
  .brand p{margin:2px 0 0;font-size:12px;color:var(--muted)}
  .controls{display:flex;align-items:center;gap:10px}
  .pillgroup{display:flex;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:4px;box-shadow:var(--shadow)}
  .pillgroup button{border:none;background:transparent;font-family:var(--sans);font-size:13px;font-weight:500;color:var(--muted);padding:7px 14px;border-radius:9px;cursor:pointer}
  .pillgroup button.active{background:var(--terra);color:#fff}
  .daterange{display:flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:9px 14px;font-size:13px;font-weight:500;color:var(--brown);box-shadow:var(--shadow)}
  .daterange svg{display:block}

  /* kpi row */
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
  .kpi{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:18px 20px;box-shadow:var(--shadow)}
  .kpi .label{font-size:12.5px;color:var(--muted);font-weight:500;display:flex;align-items:center;gap:8px}
  .dot{width:9px;height:9px;border-radius:50%}
  .kpi .val{font-family:var(--serif);font-weight:600;font-size:34px;color:var(--brown);margin:10px 0 6px;letter-spacing:-0.5px}
  .delta{font-size:12.5px;font-weight:600;display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px}
  .up{color:var(--green);background:rgba(92,138,78,0.12)}
  .down{color:var(--red);background:rgba(194,86,47,0.12)}
  .kpi .sub{font-size:11.5px;color:var(--muted);margin-left:8px}

  /* main grid */
  .main{display:grid;grid-template-columns:1.7fr 1fr;grid-template-rows:auto;gap:18px;flex:1;min-height:0}
  .right-col{display:flex;flex-direction:column;gap:18px;min-height:0}
  .panel{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:18px 20px;box-shadow:var(--shadow);display:flex;flex-direction:column;min-height:0}
  .panel h3{font-family:var(--serif);font-weight:600;font-size:16.5px;margin:0;color:var(--brown)}
  .panel .ph{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
  .panel .ph span{font-size:12px;color:var(--muted)}
  .legend{display:flex;gap:14px;font-size:11.5px;color:var(--muted);margin-top:2px}
  .legend i{width:9px;height:9px;border-radius:3px;display:inline-block;margin-right:5px;vertical-align:middle}

  .charts-area{flex:1;display:flex;align-items:stretch}
  svg{width:100%;display:block}

  /* table */
  .tablecard{padding:14px 20px 8px}
  table{width:100%;border-collapse:collapse;font-size:12.5px}
  th{text-align:left;font-weight:600;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:0.6px;padding:6px 8px;border-bottom:1px solid var(--border)}
  td{padding:8px;border-bottom:1px solid #F4ECDD;color:var(--brown)}
  tr:last-child td{border-bottom:none}
  td.num{text-align:right;font-variant-numeric:tabular-nums}
  .tag{font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px}
  .tag.ok{background:rgba(92,138,78,0.12);color:var(--green)}
  .tag.pend{background:rgba(224,164,88,0.18);color:#A06B1E}
  .tag.fail{background:rgba(194,86,47,0.12);color:var(--terra)}
  .av{width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:600;margin-right:9px;vertical-align:middle}
</style>
</head>
<body>
<div class="app">

  <!-- HEADER -->
  <header>
    <div class="brand">
      <div class="logo">W</div>
      <div>
        <h1>Warm Report</h1>
        <p>Growth Analytics · Q3 Overview</p>
      </div>
    </div>
    <div class="controls">
      <div class="pillgroup">
        <button>Day</button>
        <button>Week</button>
        <button class="active">Month</button>
        <button>Quarter</button>
      </div>
      <div class="daterange">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8A6F5D" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>
        Jul 1 — Sep 30, 2024
      </div>
    </div>
  </header>

  <!-- KPI ROW -->
  <div class="kpis">
    <div class="kpi">
      <div class="label"><span class="dot" style="background:var(--terra)"></span>Revenue</div>
      <div class="val">$284,910</div>
      <span class="delta up">▲ 12.4%</span><span class="sub">vs last month</span>
    </div>
    <div class="kpi">
      <div class="label"><span class="dot" style="background:var(--clay)"></span>Active Users</div>
      <div class="val">38,247</div>
      <span class="delta up">▲ 8.1%</span><span class="sub">vs last month</span>
    </div>
    <div class="kpi">
      <div class="label"><span class="dot" style="background:var(--amber)"></span>Conversion</div>
      <div class="val">4.62%</div>
      <span class="delta down">▼ 0.7%</span><span class="sub">vs last month</span>
    </div>
    <div class="kpi">
      <div class="label"><span class="dot" style="background:var(--deep)"></span>MRR</div>
      <div class="val">$92,180</div>
      <span class="delta up">▲ 5.3%</span><span class="sub">vs last month</span>
    </div>
  </div>

  <!-- MAIN -->
  <div class="main">

    <!-- AREA CHART -->
    <div class="panel">
      <div class="ph">
        <div>
          <h3>Revenue & New Signups</h3>
          <div class="legend"><span><i style="background:var(--terra)"></i>Revenue</span><span><i style="background:var(--amber)"></i>Signups</span></div>
        </div>
        <span>Last 12 weeks</span>
      </div>
      <div class="charts-area">
        <svg viewBox="0 0 740 300" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#C2562F" stop-opacity="0.32"/>
              <stop offset="100%" stop-color="#C2562F" stop-opacity="0.02"/>
            </linearGradient>
            <linearGradient id="areaFill2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#E0A458" stop-opacity="0.28"/>
              <stop offset="100%" stop-color="#E0A458" stop-opacity="0.02"/>
            </linearGradient>
          </defs>
          <!-- gridlines -->
          <g stroke="#EFE3CF" stroke-width="1">
            <line x1="40" y1="40" x2="730" y2="40"/>
            <line x1="40" y1="100" x2="730" y2="100"/>
            <line x1="40" y1="160" x2="730" y2="160"/>
            <line x1="40" y1="220" x2="730" y2="220"/>
            <line x1="40" y1="260" x2="730" y2="260"/>
          </g>
          <!-- y labels -->
          <g fill="#8A6F5D" font-size="10" font-family="Inter">
            <text x="8" y="44">$80k</text>
            <text x="8" y="104">$60k</text>
            <text x="8" y="164">$40k</text>
            <text x="8" y="224">$20k</text>
          </g>
          <!-- signups area (behind) -->
          <path d="M40,210 L103,190 L166,200 L229,170 L292,178 L355,150 L418,160 L481,135 L544,142 L607,120 L670,118 L730,100 L730,260 L40,260 Z" fill="url(#areaFill2)"/>
          <path d="M40,210 L103,190 L166,200 L229,170 L292,178 L355,150 L418,160 L481,135 L544,142 L607,120 L670,118 L730,100" fill="none" stroke="#E0A458" stroke-width="2.5"/>
          <!-- revenue area -->
          <path d="M40,180 L103,165 L166,172 L229,140 L292,148 L355,118 L418,128 L481,95 L544,105 L607,78 L670,72 L730,55 L730,260 L40,260 Z" fill="url(#areaFill)"/>
          <path d="M40,180 L103,165 L166,172 L229,140 L292,148 L355,118 L418,128 L481,95 L544,105 L607,78 L670,72 L730,55" fill="none" stroke="#C2562F" stroke-width="3"/>
          <!-- points -->
          <g fill="#C2562F">
            <circle cx="730" cy="55" r="4.5" stroke="#FFFDF8" stroke-width="2"/>
          </g>
          <!-- x labels -->
          <g fill="#8A6F5D" font-size="10" font-family="Inter">
            <text x="32" y="280">W1</text>
            <text x="158" y="280">W4</text>
            <text x="284" y="280">W6</text>
            <text x="410" y="280">W8</text>
            <text x="536" y="280">W10</text>
            <text x="700" y="280">W12</text>
          </g>
        </svg>
      </div>
    </div>

    <div class="right-col">

      <!-- BAR CHART -->
      <div class="panel" style="flex:1.1">
        <div class="ph">
          <h3>Revenue by Channel</h3>
          <span>This month</span>
        </div>
        <div class="charts-area">
          <svg viewBox="0 0 420 220" preserveAspectRatio="none">
            <g stroke="#EFE3CF" stroke-width="1">
              <line x1="30" y1="30" x2="410" y2="30"/>
              <line x1="30" y1="80" x2="410" y2="80"/>
              <line x1="30" y1="130" x2="410" y2="130"/>
              <line x1="30" y1="180" x2="410" y2="180"/>
            </g>
            <g fill="#8A6F5D" font-size="9" font-family="Inter">
              <text x="6" y="33">90k</text><text x="6" y="83">60k</text><text x="6" y="133">30k</text>
            </g>
            <!-- bars -->
            <g>
              <rect x="48" y="60" width="46" height="120" rx="7" fill="#C2562F"/>
              <rect x="118" y="92" width="46" height="88" rx="7" fill="#E07B4C"/>
              <rect x="188" y="48" width="46" height="132" rx="7" fill="#9C3B1E"/>
              <rect x="258" y="115" width="46" height="65" rx="7" fill="#E0A458"/>
              <rect x="328" y="135" width="46" height="45" rx="7" fill="#F3D9B9"/>
            </g>
            <g fill="#8A6F5D" font-size="10" font-family="Inter" text-anchor="middle">
              <text x="71" y="198">Organic</text>
              <text x="141" y="198">Paid</text>
              <text x="211" y="198">Referral</text>
              <text x="281" y="198">Email</text>
              <text x="351" y="198">Social</text>
            </g>
          </svg>
        </div>
      </div>

      <!-- DONUT -->
      <div class="panel" style="flex:1">
        <div class="ph">
          <h3>Plan Distribution</h3>
          <span>9,842 accounts</span>
        </div>
        <div class="charts-area" style="align-items:center;gap:18px">
          <svg viewBox="0 0 160 160" style="width:150px;flex:none">
            <g transform="rotate(-90 80 80)" fill="none" stroke-width="26">
              <!-- circumference ~ 2*pi*54 = 339.3 -->
              <circle cx="80" cy="80" r="54" stroke="#C2562F" stroke-dasharray="142 197.3"/>
              <circle cx="80" cy="80" r="54" stroke="#E07B4C" stroke-dasharray="95 244.3" stroke-dashoffset="-142"/>
              <circle cx="80" cy="80" r="54" stroke="#E0A458" stroke-dasharray="68 271.3" stroke-dashoffset="-237"/>
              <circle cx="80" cy="80" r="54" stroke="#F3D9B9" stroke-dasharray="34.3 305" stroke-dashoffset="-305"/>
            </g>
            <text x="80" y="76" text-anchor="middle" font-family="Fraunces" font-size="22" font-weight="600" fill="#4A2F22">42%</text>
            <text x="80" y="93" text-anchor="middle" font-family="Inter" font-size="9" fill="#8A6F5D">Pro plan</text>
          </svg>
          <div style="flex:1;display:flex;flex-direction:column;gap:11px;font-size:12.5px">
            <div><span class="dot" style="background:var(--terra);display:inline-block;margin-right:8px"></span>Pro <b style="float:right">42%</b></div>
            <div><span class="dot" style="background:var(--clay);display:inline-block;margin-right:8px"></span>Team <b style="float:right">28%</b></div>
            <div><span class="dot" style="background:var(--amber);display:inline-block;margin-right:8px"></span>Starter <b style="float:right">20%</b></div>
            <div><span class="dot" style="background:var(--sand);display:inline-block;margin-right:8px"></span>Free <b style="float:right">10%</b></div>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- TABLE -->
  <div class="panel tablecard" style="flex:none">
    <div class="ph"><h3 style="font-size:15px">Recent Transactions</h3><span>Updated 4 min ago</span></div>
    <table>
      <thead>
        <tr><th>Account</th><th>Plan</th><th>Channel</th><th>Status</th><th class="num">Amount</th><th class="num">Date</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="av" style="background:var(--terra)">NL</span>Northlake Studio</td>
          <td>Team</td><td>Referral</td><td><span class="tag ok">Paid</span></td>
          <td class="num">$2,480.00</td><td class="num">Sep 28</td>
        </tr>
        <tr>
          <td><span class="av" style="background:var(--clay)">MV</span>Meadow Ventures</td>
          <td>Pro</td><td>Organic</td><td><span class="tag pend">Pending</span></td>
          <td class="num">$1,290.00</td><td class="num">Sep 28</td>
        </tr>
        <tr>
          <td><span class="av" style="background:var(--amber)">CH</span>Clayhouse Co.</td>
          <td>Starter</td><td>Paid</td><td><span class="tag ok">Paid</span></td>
          <td class="num">$348.00</td><td class="num">Sep 27</td>
        </tr>
        <tr>
          <td><span class="av" style="background:var(--deep)">SB</span>Sandbar Labs</td>
          <td>Pro</td><td>Email</td><td><span class="tag fail">Failed</span></td>
          <td class="num">$1,290.00</td><td class="num">Sep 27</td>
        </tr>
      </tbody>
    </table>
  </div>

</div>
</body>
</html>
```
