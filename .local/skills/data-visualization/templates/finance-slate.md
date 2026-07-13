---
name: finance-slate
description: >-
  The "Finance Slate" theme uses a cool dark slate palette: page background #0d1117 with panels at #161b22 bordered in #21262d, accented by muted blue #58a6ff, success green #3fb950, and danger red #f85149; primary text is #c9d1d9 with secondary labels in #8b949e. Typography pairs "Inter" for labels/headings with "JetBrains Mono" (tabular-nums) for all numeric values, giving a tight terminal-grade ledger feel. The layout is a fixed 1440×900 grid with a slim 56px header (app name, segmented date control, refresh), a row of four compact KPI cards with colored up/down deltas, then a 2-column main area: a large area/line chart and a candlestick chart on the left, a donut allocation chart on the right, and a dense bottom data table with right-aligned monospaced numerals and zebra-free tight 28px rows. Charts are inline SVG with thin 1px strokes, subtle gradient fills under area lines, green/red candle bodies, and a faint #21262d gridline system. The overall aesthetic is dense, professional, and Bloomberg-terminal-inspired — high information density, restrained color used only for deltas and data, generous use of hairline borders, and crisp small type.
---

# Finance Slate

The "Finance Slate" theme uses a cool dark slate palette: page background #0d1117 with panels at #161b22 bordered in #21262d, accented by muted blue #58a6ff, success green #3fb950, and danger red #f85149; primary text is #c9d1d9 with secondary labels in #8b949e. Typography pairs "Inter" for labels/headings with "JetBrains Mono" (tabular-nums) for all numeric values, giving a tight terminal-grade ledger feel. The layout is a fixed 1440×900 grid with a slim 56px header (app name, segmented date control, refresh), a row of four compact KPI cards with colored up/down deltas, then a 2-column main area: a large area/line chart and a candlestick chart on the left, a donut allocation chart on the right, and a dense bottom data table with right-aligned monospaced numerals and zebra-free tight 28px rows. Charts are inline SVG with thin 1px strokes, subtle gradient fills under area lines, green/red candle bodies, and a faint #21262d gridline system. The overall aesthetic is dense, professional, and Bloomberg-terminal-inspired — high information density, restrained color used only for deltas and data, generous use of hairline borders, and crisp small type.

## Source Code

A self-contained reference implementation of the "Finance Slate" dashboard
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
<title>Finance Slate — Dashboard</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#0d1117; --panel:#161b22; --panel2:#1c2230; --border:#21262d;
    --txt:#c9d1d9; --txt2:#8b949e; --txt3:#6e7681;
    --blue:#58a6ff; --green:#3fb950; --red:#f85149; --amber:#d29922;
  }
  *{box-sizing:border-box}
  html,body{margin:0}
  body{
    width:1440px;height:900px;overflow:hidden;background:var(--bg);color:var(--txt);
    font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    font-size:13px;
  }
  .mono{font-family:"JetBrains Mono",ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-variant-numeric:tabular-nums;}
  .up{color:var(--green)} .down{color:var(--red)}

  /* Header */
  header{
    height:56px;display:flex;align-items:center;gap:18px;padding:0 20px;
    border-bottom:1px solid var(--border);background:#10151c;
  }
  .logo{display:flex;align-items:center;gap:9px;font-weight:700;font-size:15px;letter-spacing:.2px;}
  .logo .dot{width:10px;height:10px;border-radius:2px;background:var(--blue);box-shadow:0 0 8px var(--blue);}
  .logo small{color:var(--txt3);font-weight:500;font-size:11px;border-left:1px solid var(--border);padding-left:9px;margin-left:2px;}
  .spacer{flex:1}
  .seg{display:flex;border:1px solid var(--border);border-radius:6px;overflow:hidden;}
  .seg button{background:transparent;border:none;color:var(--txt2);font-family:inherit;font-size:12px;
    padding:6px 12px;cursor:pointer;border-right:1px solid var(--border);}
  .seg button:last-child{border-right:none}
  .seg button.on{background:var(--panel2);color:var(--txt);font-weight:600}
  .ctl{display:flex;align-items:center;gap:7px;border:1px solid var(--border);border-radius:6px;padding:6px 11px;color:var(--txt2);font-size:12px;background:var(--panel);}
  .ctl b{color:var(--txt);font-weight:600}
  .refresh{background:var(--panel2);border:1px solid var(--border);color:var(--blue);border-radius:6px;padding:7px 13px;font-size:12px;font-weight:600;cursor:pointer;}

  /* layout */
  .wrap{padding:16px 20px;display:flex;flex-direction:column;gap:14px;height:calc(900px - 56px);}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
  .card{background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:14px 16px;}
  .kpi .lab{color:var(--txt2);font-size:11px;text-transform:uppercase;letter-spacing:.7px;display:flex;align-items:center;gap:6px;}
  .kpi .val{font-size:25px;font-weight:600;margin-top:9px;letter-spacing:-.5px;}
  .kpi .row{display:flex;align-items:baseline;justify-content:space-between;margin-top:7px;}
  .delta{font-size:12px;font-weight:600;display:flex;align-items:center;gap:3px;}
  .sub{color:var(--txt3);font-size:11px;}
  .spark{margin-top:2px}

  .main{display:grid;grid-template-columns:1fr 1fr 360px;gap:14px;flex:1;min-height:0;}
  .panelhd{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
  .panelhd h3{margin:0;font-size:13px;font-weight:600;}
  .panelhd .meta{color:var(--txt3);font-size:11px;}
  .tag{font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;border:1px solid var(--border);color:var(--txt2);}
  .legend{display:flex;gap:14px;font-size:11px;color:var(--txt2);}
  .legend i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px;vertical-align:-1px;}

  .bottom{flex:0 0 198px;}
  table{width:100%;border-collapse:collapse;}
  th{text-align:left;color:var(--txt3);font-size:10px;text-transform:uppercase;letter-spacing:.6px;font-weight:600;padding:5px 12px;border-bottom:1px solid var(--border);}
  td{padding:0 12px;height:28px;border-bottom:1px solid #1a2029;font-size:12px;color:var(--txt);}
  td.r,th.r{text-align:right}
  tbody tr:hover{background:#1a212c}
  .pill{font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;}
  .pill.g{background:rgba(63,185,80,.13);color:var(--green)}
  .pill.r{background:rgba(248,81,73,.13);color:var(--red)}
  .pill.b{background:rgba(88,166,255,.13);color:var(--blue)}
  .bar{height:5px;border-radius:3px;background:var(--border);overflow:hidden;width:74px;display:inline-block;vertical-align:middle;}
  .bar i{display:block;height:100%;background:var(--blue);}
</style>
</head>
<body>
  <header>
    <div class="logo"><span class="dot"></span>SLATE<span style="color:var(--blue)">·</span>DESK <small>Treasury Analytics</small></div>
    <div class="spacer"></div>
    <div class="seg">
      <button>1D</button><button>1W</button><button class="on">1M</button><button>3M</button><button>1Y</button>
    </div>
    <div class="ctl">📅 <b>Oct 1 – Oct 31, 2024</b></div>
    <div class="ctl">Acct: <b>All Entities</b> ▾</div>
    <button class="refresh">↻ Refresh</button>
  </header>

  <div class="wrap">
    <!-- KPIs -->
    <div class="kpis">
      <div class="card kpi">
        <div class="lab">Revenue (MTD)</div>
        <div class="val mono">$4.82M</div>
        <div class="row">
          <div class="delta up">▲ 8.4% <span class="sub" style="color:var(--txt3)">vs Sep</span></div>
          <svg class="spark" width="78" height="26" viewBox="0 0 78 26"><polyline fill="none" stroke="var(--green)" stroke-width="1.5" points="0,20 11,18 22,21 33,14 44,15 55,9 66,11 78,4"/></svg>
        </div>
      </div>
      <div class="card kpi">
        <div class="lab">MRR</div>
        <div class="val mono">$612.4K</div>
        <div class="row">
          <div class="delta up">▲ 3.1% <span class="sub" style="color:var(--txt3)">net new</span></div>
          <svg class="spark" width="78" height="26" viewBox="0 0 78 26"><polyline fill="none" stroke="var(--green)" stroke-width="1.5" points="0,16 11,17 22,13 33,14 44,11 55,12 66,8 78,7"/></svg>
        </div>
      </div>
      <div class="card kpi">
        <div class="lab">Active Users</div>
        <div class="val mono">38,204</div>
        <div class="row">
          <div class="delta down">▼ 1.2% <span class="sub" style="color:var(--txt3)">DAU</span></div>
          <svg class="spark" width="78" height="26" viewBox="0 0 78 26"><polyline fill="none" stroke="var(--red)" stroke-width="1.5" points="0,8 11,7 22,11 33,9 44,13 55,12 66,16 78,15"/></svg>
        </div>
      </div>
      <div class="card kpi">
        <div class="lab">Conversion</div>
        <div class="val mono">4.37%</div>
        <div class="row">
          <div class="delta up">▲ 0.42pt <span class="sub" style="color:var(--txt3)">trial→paid</span></div>
          <svg class="spark" width="78" height="26" viewBox="0 0 78 26"><polyline fill="none" stroke="var(--green)" stroke-width="1.5" points="0,18 11,16 22,17 33,12 44,13 55,10 66,9 78,5"/></svg>
        </div>
      </div>
    </div>

    <!-- Main charts -->
    <div class="main">
      <!-- Area chart -->
      <div class="card">
        <div class="panelhd">
          <h3>Net Revenue Flow</h3>
          <div class="legend"><span><i style="background:var(--blue)"></i>Inflow</span><span><i style="background:var(--amber)"></i>Outflow</span></div>
        </div>
        <svg width="100%" height="280" viewBox="0 0 480 280" preserveAspectRatio="none">
          <defs>
            <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#58a6ff" stop-opacity="0.35"/>
              <stop offset="1" stop-color="#58a6ff" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <!-- grid -->
          <g stroke="#21262d" stroke-width="1">
            <line x1="0" y1="40" x2="480" y2="40"/><line x1="0" y1="90" x2="480" y2="90"/>
            <line x1="0" y1="140" x2="480" y2="140"/><line x1="0" y1="190" x2="480" y2="190"/>
            <line x1="0" y1="240" x2="480" y2="240"/>
          </g>
          <!-- y labels -->
          <g fill="#6e7681" font-size="9" font-family="JetBrains Mono">
            <text x="3" y="44">6M</text><text x="3" y="94">4.5M</text><text x="3" y="144">3M</text><text x="3" y="194">1.5M</text>
          </g>
          <!-- area inflow -->
          <path d="M0,200 L40,180 L80,190 L120,150 L160,160 L200,120 L240,135 L280,95 L320,110 L360,70 L400,85 L440,50 L480,60 L480,260 L0,260 Z" fill="url(#ga)"/>
          <polyline fill="none" stroke="var(--blue)" stroke-width="1.8" points="0,200 40,180 80,190 120,150 160,160 200,120 240,135 280,95 320,110 360,70 400,85 440,50 480,60"/>
          <!-- outflow line -->
          <polyline fill="none" stroke="var(--amber)" stroke-width="1.4" stroke-dasharray="3 3" points="0,225 40,218 80,222 120,205 160,210 200,198 240,200 280,185 320,192 360,178 400,182 440,170 480,172"/>
          <g fill="#6e7681" font-size="9" font-family="JetBrains Mono">
            <text x="0" y="276">W1</text><text x="120" y="276">W2</text><text x="240" y="276">W3</text><text x="360" y="276">W4</text><text x="455" y="276">W5</text>
          </g>
        </svg>
      </div>

      <!-- Candlestick -->
      <div class="card">
        <div class="panelhd">
          <h3>Cash Position (Daily)</h3>
          <span class="tag">OHLC</span>
        </div>
        <svg width="100%" height="280" viewBox="0 0 480 280" preserveAspectRatio="none">
          <g stroke="#21262d" stroke-width="1">
            <line x1="0" y1="50" x2="480" y2="50"/><line x1="0" y1="110" x2="480" y2="110"/>
            <line x1="0" y1="170" x2="480" y2="170"/><line x1="0" y1="230" x2="480" y2="230"/>
          </g>
          <g stroke-width="1.2">
            <!-- candles: green=up red=down. x, wick(top,bot), body(top,bot) -->
            <!-- 1 -->
            <line x1="20" y1="60" x2="20" y2="170" stroke="var(--green)"/><rect x="14" y="90" width="12" height="55" fill="var(--green)"/>
            <line x1="48" y1="80" x2="48" y2="160" stroke="var(--red)"/><rect x="42" y="95" width="12" height="40" fill="var(--red)"/>
            <line x1="76" y1="70" x2="76" y2="150" stroke="var(--green)"/><rect x="70" y="100" width="12" height="40" fill="var(--green)"/>
            <line x1="104" y1="55" x2="104" y2="140" stroke="var(--green)"/><rect x="98" y="75" width="12" height="50" fill="var(--green)"/>
            <line x1="132" y1="65" x2="132" y2="135" stroke="var(--red)"/><rect x="126" y="78" width="12" height="35" fill="var(--red)"/>
            <line x1="160" y1="50" x2="160" y2="120" stroke="var(--green)"/><rect x="154" y="62" width="12" height="42" fill="var(--green)"/>
            <line x1="188" y1="58" x2="188" y2="118" stroke="var(--red)"/><rect x="182" y="70" width="12" height="32" fill="var(--red)"/>
            <line x1="216" y1="45" x2="216" y2="110" stroke="var(--green)"/><rect x="210" y="60" width="12" height="38" fill="var(--green)"/>
            <line x1="244" y1="52" x2="244" y2="105" stroke="var(--green)"/><rect x="238" y="62" width="12" height="32" fill="var(--green)"/>
            <line x1="272" y1="60" x2="272" y2="120" stroke="var(--red)"/><rect x="266" y="72" width="12" height="38" fill="var(--red)"/>
            <line x1="300" y1="48" x2="300" y2="108" stroke="var(--green)"/><rect x="294" y="60" width="12" height="35" fill="var(--green)"/>
            <line x1="328" y1="40" x2="328" y2="95" stroke="var(--green)"/><rect x="322" y="52" width="12" height="32" fill="var(--green)"/>
            <line x1="356" y1="55" x2="356" y2="100" stroke="var(--red)"/><rect x="350" y="62" width="12" height="28" fill="var(--red)"/>
            <line x1="384" y1="42" x2="384" y2="92" stroke="var(--green)"/><rect x="378" y="52" width="12" height="30" fill="var(--green)"/>
            <line x1="412" y1="35" x2="412" y2="80" stroke="var(--green)"/><rect x="406" y="45" width="12" height="28" fill="var(--green)"/>
            <line x1="440" y1="48" x2="440" y2="85" stroke="var(--red)"/><rect x="434" y="55" width="12" height="22" fill="var(--red)"/>
          </g>
          <g fill="#6e7681" font-size="9" font-family="JetBrains Mono">
            <text x="3" y="54">9.2M</text><text x="3" y="114">8.0M</text><text x="3" y="174">6.8M</text>
            <text x="14" y="252">10</text><text x="160" y="252">15</text><text x="300" y="252">20</text><text x="430" y="252">25</text>
          </g>
        </svg>
      </div>

      <!-- Donut + breakdown -->
      <div class="card">
        <div class="panelhd">
          <h3>Revenue Mix</h3>
          <span class="meta">by product</span>
        </div>
        <svg width="100%" height="148" viewBox="0 0 200 148">
          <g transform="translate(100,74)">
            <!-- donut segments via stroke-dasharray, r=52 circumference≈326.7 -->
            <circle r="52" fill="none" stroke="#21262d" stroke-width="20"/>
            <circle r="52" fill="none" stroke="var(--blue)"  stroke-width="20" stroke-dasharray="127 200" transform="rotate(-90)"/>
            <circle r="52" fill="none" stroke="var(--green)" stroke-width="20" stroke-dasharray="82 245" transform="rotate(50)"/>
            <circle r="52" fill="none" stroke="var(--amber)" stroke-width="20" stroke-dasharray="59 268" transform="rotate(141)"/>
            <circle r="52" fill="none" stroke="#bc8cff"      stroke-width="20" stroke-dasharray="39 288" transform="rotate(206)"/>
            <text y="-2" text-anchor="middle" fill="#c9d1d9" font-size="20" font-weight="600" font-family="JetBrains Mono">$4.82M</text>
            <text y="14" text-anchor="middle" fill="#6e7681" font-size="9">TOTAL MTD</text>
          </g>
        </svg>
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:9px;">
          <div style="display:flex;align-items:center;font-size:12px;"><i style="width:9px;height:9px;border-radius:2px;background:var(--blue);margin-right:8px;display:inline-block"></i>Core Platform<span class="spacer" style="flex:1"></span><span class="mono">39%</span><span class="mono" style="color:var(--txt3);width:62px;text-align:right">$1.88M</span></div>
          <div style="display:flex;align-items:center;font-size:12px;"><i style="width:9px;height:9px;border-radius:2px;background:var(--green);margin-right:8px;display:inline-block"></i>Enterprise<span style="flex:1"></span><span class="mono">25%</span><span class="mono" style="color:var(--txt3);width:62px;text-align:right">$1.21M</span></div>
          <div style="display:flex;align-items:center;font-size:12px;"><i style="width:9px;height:9px;border-radius:2px;background:var(--amber);margin-right:8px;display:inline-block"></i>Add-ons<span style="flex:1"></span><span class="mono">18%</span><span class="mono" style="color:var(--txt3);width:62px;text-align:right">$868K</span></div>
          <div style="display:flex;align-items:center;font-size:12px;"><i style="width:9px;height:9px;border-radius:2px;background:#bc8cff;margin-right:8px;display:inline-block"></i>Services<span style="flex:1"></span><span class="mono">12%</span><span class="mono" style="color:var(--txt3);width:62px;text-align:right">$578K</span></div>
          <div style="display:flex;align-items:center;font-size:12px;"><i style="width:9px;height:9px;border-radius:2px;background:#21262d;margin-right:8px;display:inline-block"></i>Other<span style="flex:1"></span><span class="mono">6%</span><span class="mono" style="color:var(--txt3);width:62px;text-align:right">$289K</span></div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card bottom" style="padding:0;overflow:hidden;">
      <div class="panelhd" style="padding:11px 14px 9px;margin:0;border-bottom:1px solid var(--border)">
        <h3>Top Accounts — October</h3>
        <span class="meta">showing 6 of 248 · sorted by MRR</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Account</th><th>Segment</th><th>Region</th><th class="r">MRR</th><th class="r">Δ MoM</th>
            <th class="r">Seats</th><th>Health</th><th class="r">Renewal</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Northwind Capital</td><td><span class="pill b">Enterprise</span></td><td>NA-East</td><td class="r mono">$48,200</td><td class="r mono up">+6.2%</td><td class="r mono">1,240</td><td><span class="bar"><i style="width:92%"></i></span></td><td class="r mono">Feb '25</td></tr>
          <tr><td>Halcyon Mutual</td><td><span class="pill b">Enterprise</span></td><td>EMEA</td><td class="r mono">$41,860</td><td class="r mono up">+2.8%</td><td class="r mono">980</td><td><span class="bar"><i style="width:78%"></i></span></td><td class="r mono">Dec '24</td></tr>
          <tr><td>Vertex Holdings</td><td><span class="pill b">Enterprise</span></td><td>APAC</td><td class="r mono">$37,420</td><td class="r mono down">−1.4%</td><td class="r mono">860</td><td><span class="bar"><i style="width:64%"></i></span></td><td class="r mono">Mar '25</td></tr>
          <tr><td>Cardinal Trust</td><td><span class="pill">Mid-Market</span></td><td>NA-West</td><td class="r mono">$29,150</td><td class="r mono up">+4.1%</td><td class="r mono">540</td><td><span class="bar"><i style="width:71%"></i></span></td><td class="r mono">Jan '25</td></tr>
          <tr><td>Meridian Labs</td><td><span class="pill">Mid-Market</span></td><td>EMEA</td><td class="r mono">$24,780</td><td class="r mono up">+3.3%</td><td class="r mono">410</td><td><span class="bar"><i style="width:58%"></i></span></td><td class="r mono">Nov '24</td></tr>
          <tr><td>Brightwater Co.</td><td><span class="pill">Mid-Market</span></td><td>NA-East</td><td class="r mono">$21,300</td><td class="r mono up">+1.9%</td><td class="r mono">375</td><td><span class="bar"><i style="width:52%"></i></span></td><td class="r mono">Apr '25</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
```
