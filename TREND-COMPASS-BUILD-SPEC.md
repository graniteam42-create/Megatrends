# TREND COMPASS — Complete Build Specification

Build a strategic intelligence web app for tracking mega-trends and investment positioning. This single file contains everything needed — architecture, all seed data, component specs, API routes, styling, and deployment config. No other files needed.

## Tech Stack
- Next.js 14+ (App Router, TypeScript)
- Tailwind CSS (dark theme)
- Vercel KV (Redis) for persistence
- Dual AI: Gemini 2.5 Pro (scans) + Claude Sonnet 4.6 (synthesis)
- EODHD API for live stock/ETF prices
- Simple password auth via middleware + cookie
- Deploy on Vercel

## Environment Variables
```
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
EODHD_API_KEY=...
APP_PASSWORD=your-shared-password
```
Vercel KV vars (KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN) auto-set when you add KV storage in Vercel dashboard.

## Install
```bash
npx create-next-app@latest trend-compass --typescript --tailwind --app --src-dir=false
cd trend-compass
npm install @anthropic-ai/sdk @google/generative-ai @vercel/kv
```

---

## SECTION 1: ALL SEED DATA

Put all of this in `lib/seed-data.ts`. Export each constant.

### 1A. Trends

```typescript
export const STAGES = ["Nascent", "Emerging", "Accelerating", "Consensus", "Overcrowded"];
export const STAGE_COLORS = ["#00e5ff", "#00e676", "#ffea00", "#ff9100", "#ff1744"];
export const HORIZONS = ["6-18 months", "2-5 years", "5-15 years"];

export interface Trend {
  id: string; name: string; stage: number; horizon: string; confidence: number;
  description: string; subTrends: string[]; signals: string[];
  thesis: string; bearCase: string; investmentMap: string; mispricingScore: number;
}

export const SEED_TRENDS: Trend[] = [
  { id: "t1", name: "AI & AGI Disruption", stage: 2, horizon: "2-5 years", confidence: 85, description: "AI automating knowledge work. Trough of disillusionment as enterprise ROI disappoints, but infra buildout continues.", subTrends: ["AI infrastructure", "Knowledge worker displacement", "Enterprise ROI reckoning", "Open-source commoditization"], signals: [], thesis: "Infra buildout durable. Long picks-and-shovels, short AI-wrapper SaaS.", bearCase: "AI infra is massive capital misallocation. Incumbents integrate open-source, crushing challengers.", investmentMap: "Long: NVDA, AVGO, TSM, GOOG, AMZN, MSFT, GEV. Short: Bear certificates on Nasdaq via Avanza Markets. PRIIPs blocks all US inverse ETFs for EU investors.", mispricingScore: 68 },
  { id: "t2", name: "Financial Repression & Fiat Debasement", stage: 0, horizon: "2-5 years", confidence: 75, description: "Central banks impose yield curve control, forced bond-buying, stealth inflation to liquidate debt.", subTrends: ["Dollar erosion", "Gold remonetization", "Bitcoin as digital gold", "BRICS settlement", "Negative real yields"], signals: [], thesis: "Decade of negative real yields. Long hard assets vs. short long-duration bonds.", bearCase: "Financial repression WORKS. No tradeable crisis event.", investmentMap: "Long: WGLD (gold 0.12%), WSLV (silver), IBIT (Bitcoin), GDX/GDXJ (gold miners). Short: 3TYS (3x short 10Y, EU-listed), bear certs on Bund.", mispricingScore: 82 },
  { id: "t3", name: "Climate Acceleration & Energy Transition", stage: 2, horizon: "5-15 years", confidence: 80, description: "Climate change accelerating, forcing emergency energy transition and massive infrastructure spend.", subTrends: ["Nuclear renaissance", "Grid modernization", "Climate migration", "Copper supercycle"], signals: [], thesis: "Market prices orderly transition; reality is chaotic. Nuclear and copper mispriced.", bearCase: "Solar + battery cost crash makes micro-grids bypass centralized overhauls.", investmentMap: "Long: SPUT (physical uranium), U3O8/WNUC (miners), CCJ, NXE, OD7C (copper), GEV, BWXT, PWR, ETN. Short: Coastal REITs.", mispricingScore: 65 },
  { id: "t4", name: "Geopolitical Fragmentation", stage: 2, horizon: "2-5 years", confidence: 75, description: "World splitting into blocs, reshoring supply chains, weaponizing trade and finance.", subTrends: ["Nearshoring boom", "Defense surge", "Semiconductor sovereignty", "Rare earth chains"], signals: [], thesis: "Defense and reshoring capex larger and longer than expected.", bearCase: "Reshoring is inflationary fantasy. Capital forces detente.", investmentMap: "Long: EUDF (defence), RHM.DE, BA.L, LHX, NOC, RARE (strategic metals), MP, ASML, AMAT.", mispricingScore: 55 },
  { id: "t5", name: "Demographic Inversion", stage: 2, horizon: "2-5 years", confidence: 90, description: "Population decline in China, Korea, Japan, Germany. Labor shortages forcing automation.", subTrends: ["Automation as labor substitute", "Healthcare explosion", "Pension erosion"], signals: [], thesis: "Demographics force AI/automation adoption. Long automation, long healthcare.", bearCase: "Productivity renaissance OFFSETS demographic drag.", investmentMap: "Long: Wellington HC fund, IXJ, UNH, LLY, ISRG, ROBO ETF, Fanuc (6954.T), ROK.", mispricingScore: 70 },
  { id: "t6", name: "Trust Crisis & Verification Economy", stage: 1, horizon: "2-5 years", confidence: 80, description: "AI synthetic content makes truth premium. Zero-trust drives verification investment.", subTrends: ["Digital identity", "Content provenance", "Deepfake detection", "Zero-trust security"], signals: [], thesis: "Verification becomes critical infrastructure.", bearCase: "Big tech solves verification internally.", investmentMap: "Long: W1TB (cybersecurity), CRWD, PANW, FTNT, ZS, OKTA, CYBR, Chainlink (LINK).", mispricingScore: 75 },
  { id: "t7", name: "Commodities Financialization", stage: 2, horizon: "2-5 years", confidence: 80, description: "Hard assets becoming monetary reserves. Central banks hoarding gold; extends to silver, copper, uranium.", subTrends: ["Central bank gold buying", "Silver premium", "Uranium reserves", "Copper as collateral"], signals: [], thesis: "Commodities remonetized. Physical ETCs have no equity beta; miners do.", bearCase: "Digital assets absorb alternative reserve demand.", investmentMap: "Physical: WGLD, WSLV, SPUT, OD7C. Miners: GDX, RARE, U3O8. Individual: GOLD (Barrick), FCX (Freeport). Broad: WTIC.", mispricingScore: 72 },
  { id: "t8", name: "Synthetic Biology", stage: 0, horizon: "5-15 years", confidence: 65, description: "AI-powered genomics enabling bio-manufacturing of chemicals, materials, medicines.", subTrends: ["AI drug discovery", "Precision fermentation", "Personalized medicine"], signals: [], thesis: "AI + biology is generational. Watch food/materials before pharma.", bearCase: "Bio-manufacturing perpetually five years away.", investmentMap: "Long: WRNA (BioRevolution), CRSP, NTLA, DNA (Ginkgo), TWST, RXRX. Nascent: 1-3% max.", mispricingScore: 80 },
  { id: "t9", name: "Strategic Bridge States", stage: 1, horizon: "2-5 years", confidence: 78, description: "Countries at nexus of green energy, nearshoring, digital transformation bridge competing blocs.", subTrends: ["Green hydrogen export", "Nearshoring corridors", "Phosphates-to-LFP", "Renewable infra"], signals: [], thesis: "Bridge states capture asymmetric value in a fragmenting world.", bearCase: "Protectionism blocks exports. Political instability.", investmentMap: "Frontier/EM: Schroder Frontier Markets, XSOE. Vietnam: VNM. India: INDA. Mexico: EWW.", mispricingScore: 82 },
  { id: "t10", name: "Carbon as Feedstock", stage: 0, horizon: "5-15 years", confidence: 55, description: "Cheap energy makes CO2 capture economical, turning carbon into manufacturing input.", subTrends: ["Direct air capture", "Synthetic hydrocarbons", "Carbon materials"], signals: [], thesis: "Breaks climate doom loop. When capture below $100/ton, economics flip.", bearCase: "Energy costs never drop enough.", investmentMap: "Long (speculative): OXY (1PointFive DAC), PLUG, NEL.OL, ITM.L, WCO2 (carbon ETC). Monitor only.", mispricingScore: 85 },
];
```

### 1B. Scenarios

```typescript
export const SCENARIOS = [
  { name: "The Managed Grind", prob: 50, type: "base", desc: "Financial repression works. Inflation 3-4%, yields capped. Slow debasement. AI shifts to utility.", portfolio: "Long: WGLD, SPUT, ROBO, infra funds, inflation-linked bonds. Short: Long-duration bonds via 3TYS." },
  { name: "The Great Repricing", prob: 30, type: "bear", desc: "Failed sovereign auction or AI ROI collapse triggers liquidity crisis.", portfolio: "Long: WSLV, PSLV, CHF via XBJA, WTMF (managed futures). Short: Bear certs on Nasdaq, DXSP (short Euro STOXX 50)." },
  { name: "The Productivity Renaissance", prob: 20, type: "bull", desc: "AI scaling laws hold. SynBio industrial scale. Productivity surge offsets all.", portfolio: "Long: NVDA, MSFT, GOOG, WRNA, CCJ/WNUC. Short: PFE, MRK, XOP." },
];
```

### 1C. Convergences

```typescript
export const CONVERGENCES = [
  { trends: ["t1","t5"], name: "Labor Substitution Super-Cycle", insight: "Demographic decline FORCES AI adoption. Most durable AI bull case." },
  { trends: ["t1","t3"], name: "AI Energy Demand Crisis", insight: "AI needs massive power. Accelerates nuclear and grid buildout." },
  { trends: ["t2","t4"], name: "Fiscal Dominance Spiral", insight: "War + reshoring need deficits. Printing accelerates debasement." },
  { trends: ["t3","t4"], name: "Green Mercantilism", insight: "Energy transition is geopolitical weapon. Critical minerals = new oil." },
  { trends: ["t1","t6"], name: "AI vs. Truth Arms Race", insight: "AI makes fakery trivial. Verification becomes critical." },
  { trends: ["t2","t7"], name: "Hard Asset Monetary Reset", insight: "Repression + financialization = remonetization of physical assets." },
  { trends: ["t1","t8"], name: "AI-Biology Convergence", insight: "Protein folding + genomics = new manufacturing paradigm." },
  { trends: ["t5","t8"], name: "Longevity & Healthcare Demand", insight: "Aging + synbio = trillion-dollar personalized medicine." },
  { trends: ["t3","t7"], name: "Copper Supercycle", insight: "All electrification needs copper. No new mines until 2028+." },
  { trends: ["t9","t3"], name: "Bridge State Energy Hubs", insight: "Bridge states with renewables supply clean energy to industrialized nations." },
  { trends: ["t10","t3"], name: "Carbon Alchemy", insight: "Cheap energy + CO2 capture = carbon becomes feedstock." },
];
```

### 1D. Catalysts

```typescript
export const CATALYSTS = [
  { name: "Gold Correction", date: "Ongoing", impact: "Gold -20% from ATH. Silver -32%. Pullback, not invalidation." },
  { name: "FERC Load Rule", date: "Apr 2026", impact: "Hard ceiling for AI data center scaling if delayed." },
  { name: "Cloud Earnings ROI", date: "Q3-Q4 2026", impact: "If AI revenue misses capex, 30-40% AI drawdown. Buy trigger for miners." },
  { name: "Treasury Tails", date: "Ongoing", impact: "Tail spread = repression tested. Confirms gold + bond short." },
  { name: "Uranium > $95/lb", date: "Watch", impact: "At ~$86. Breaking $95 triggers miner re-rating." },
  { name: "Copper Supply Gap", date: "2026-28", impact: "No new mines. AI + EV + grid = structural deficit." },
];
```

### 1E. Positions

Each position has a `status` field. In the standalone app, calculate this DYNAMICALLY from live VIX (via EODHD) instead of using these hardcoded strings. The hardcoded values are the fallback if EODHD is unavailable.

```typescript
export interface Position {
  tier: number; dir: string; ticker: string; name: string; type: string; fee: string;
  trends: string[]; conv: number; why: string; when: string; status: string; corr: string;
}

export const POSITIONS: Position[] = [
  // Tier 1: Physical — Deploy Now
  { tier: 1, dir: "LONG", ticker: "SPUT", name: "HANetf Sprott Physical Uranium ETC", type: "Physical", fee: "1.48% all-in", trends: ["t3","t7","t1"], conv: 95, why: "Sprott buys physical yellowcake at premium. Tightens supply. $86/lb, structural deficit.", when: "Buy now", status: "✅ GO", corr: "Anti-correlated" },
  { tier: 1, dir: "LONG", ticker: "OD7C", name: "WisdomTree Copper ETC", type: "Physical", fee: "0.49%", trends: ["t3","t4","t7","t1"], conv: 90, why: "At intersection of more trends than any asset. No new mines until 2028+.", when: "Buy now", status: "✅ GO", corr: "Anti-correlated" },
  { tier: 1, dir: "LONG", ticker: "WGLD", name: "WisdomTree Core Physical Gold", type: "Physical", fee: "0.12%", trends: ["t2","t7"], conv: 85, why: "Financial repression hedge. 0.12% strictly superior to VZLD (0.39%). Corrected 20%.", when: "Accumulate on dips", status: "🟡 Corrected 20%", corr: "Anti-correlated" },
  { tier: 1, dir: "LONG", ticker: "WSLV", name: "WisdomTree Core Physical Silver", type: "Physical", fee: "0.19%", trends: ["t2","t7","t3"], conv: 82, why: "Dual monetary + industrial (solar). Corrected 32%. Bigger upside in crisis.", when: "Accumulate", status: "🟡 Corrected 32%", corr: "Anti-correlated" },
  // Tier 2: Miners/Sectors — Deploy on Correction
  { tier: 2, dir: "LONG", ticker: "U3O8", name: "HANetf Sprott Uranium Miners UCITS", type: "Miners ETF", fee: "~0.85%", trends: ["t3","t7","t1"], conv: 88, why: "Pure-play uranium miners. Buy when selloff widens gap vs commodity price.", when: "VIX > 30 or S&P -15%", status: "⏳ WAIT", corr: "Equity-correlated" },
  { tier: 2, dir: "LONG", ticker: "WNUC", name: "WisdomTree Uranium & Nuclear", type: "Sector ETF", fee: "0.47%", trends: ["t3","t1"], conv: 85, why: "Broader nuclear incl. GE Vernova, Curtiss-Wright.", when: "On correction", status: "⏳ WAIT", corr: "Equity-correlated" },
  { tier: 2, dir: "LONG", ticker: "IXJ", name: "iShares Global Healthcare", type: "Sector ETF", fee: "0.40%", trends: ["t5","t8"], conv: 82, why: "Highest-confidence trend (Demographics 90%). UNH, LLY, ISRG.", when: "On correction", status: "⏳ WAIT", corr: "Low beta" },
  { tier: 2, dir: "LONG", ticker: "RARE", name: "WisdomTree Strategic Metals & Rare Earths", type: "Miners ETF", fee: "0.55%", trends: ["t3","t4","t7"], conv: 80, why: "Lithium, rare earths, copper miners. Down -17%.", when: "Below EUR 38", status: "🟡 Approaching target", corr: "Equity-correlated" },
  { tier: 2, dir: "LONG", ticker: "GDX", name: "VanEck Gold Miners ETF", type: "Miners ETF", fee: "0.51%", trends: ["t2","t7"], conv: 78, why: "2-3x leverage to gold price.", when: "Wait for gold bottom", status: "⏳ WAIT", corr: "Equity-correlated" },
  { tier: 2, dir: "LONG", ticker: "W1TB", name: "WisdomTree Cybersecurity UCITS", type: "Thematic", fee: "~0.40%", trends: ["t6","t1"], conv: 72, why: "Trust Crisis thesis. Expensive growth stocks — will crash before recovering.", when: "Tech capitulation only", status: "⏳ WAIT", corr: "Equity-correlated" },
  // Tier 3: Individual Stocks
  { tier: 3, dir: "LONG", ticker: "CCJ", name: "Cameco Corp", type: "Stock", fee: "-", trends: ["t3","t7"], conv: 85, why: "Largest Western uranium producer. $2.7B Nuclear Fuel Supply Act.", when: "Sector pullback", status: "⏳ WAIT", corr: "Equity-correlated" },
  { tier: 3, dir: "LONG", ticker: "NXE", name: "NexGen Energy", type: "Stock", fee: "-", trends: ["t3","t7"], conv: 55, why: "Highest-grade undeveloped uranium (Rook I). Development-stage. High risk.", when: "Very small, speculative", status: "⏳ WAIT", corr: "Equity-correlated" },
  // Tier 4: Long Horizon, Hedges, Shorts
  { tier: 4, dir: "LONG", ticker: "WRNA", name: "WisdomTree BioRevolution UCITS", type: "Thematic", fee: "~0.40%", trends: ["t8","t1"], conv: 68, why: "Synthetic Biology ETF. Nascent — high volatility expected.", when: "VIX > 35, max 1-3%", status: "⏳ WAIT", corr: "Equity-correlated" },
  { tier: 4, dir: "LONG", ticker: "IBIT", name: "iShares Bitcoin ETF / 21Shares", type: "Crypto", fee: "0.25-1.5%", trends: ["t2","t6"], conv: 55, why: "Hard asset hedge in theory. Correlates with risk assets in practice.", when: "Dollar-cost average, small", status: "🟡 DCA candidate", corr: "Risk-correlated" },
  { tier: 4, dir: "SHORT", ticker: "3TYS", name: "WisdomTree 3x Short US 10Y (EU)", type: "Inverse ETP", fee: "0.75%+", trends: ["t2"], conv: 72, why: "Core Trade short leg. 3x daily reset decay — tactical only.", when: "Open now, very small", status: "✅ GO — keep tiny", corr: "Anti-bond" },
  { tier: 4, dir: "SHORT", ticker: "Bear Certs", name: "Avanza Markets bear certificates on Nasdaq/S&P", type: "Certificate", fee: "Spread only", trends: ["t1"], conv: 68, why: "PRIIPs blocks all US inverse ETFs. Courtage-free via Avanza Markets.", when: "Tactical Q3-Q4 2026", status: "⏳ WAIT", corr: "Inverse" },
  { tier: 4, dir: "HEDGE", ticker: "XBJA", name: "WisdomTree Long CHF Short EUR", type: "Currency", fee: "0.39%", trends: ["t2","t4"], conv: 58, why: "CHF strengthens in crisis. Cheap hedge.", when: "Buy now", status: "✅ GO", corr: "Anti-correlated" },
  { tier: 4, dir: "HEDGE", ticker: "WTMF", name: "WisdomTree Managed Futures / Lynx Dynamic", type: "Alternative", fee: "0.65-1.5%", trends: [], conv: 60, why: "Uncorrelated returns. Buy hedges in calm markets.", when: "Buy now", status: "✅ GO", corr: "Uncorrelated" },
];

export const TIER_INFO: Record<number, { label: string; sub: string; color: string }> = {
  1: { label: "Deploy Now — Physical Commodities", sub: "Anti-correlated to equities. No timing needed.", color: "#00e676" },
  2: { label: "Deploy on Correction — Miners & Sectors", sub: "Equity beta. Buy when VIX > 30 or -15% correction.", color: "#00e5ff" },
  3: { label: "Individual Picks — High Conviction", sub: "Concentrated bets. Research individually.", color: "#ffea00" },
  4: { label: "Long Horizon & Hedges", sub: "Small positions. Patient capital.", color: "#c084fc" },
};
```

### 1F. Core Trade Structure

```typescript
export const TRADE_LEGS = [
  { side: "LONG", inst: "Physical Gold — WGLD (0.12%), GBSE (EUR hedged), IAU (US)", alloc: "40%", note: "WGLD strictly better than VZLD (0.39%). Identical gold." },
  { side: "LONG", inst: "Physical Uranium — SPUT (HANetf, EU-listed)", alloc: "20%", note: "Sprott buys yellowcake at premium. Anti-correlated." },
  { side: "LONG", inst: "Physical Copper — OD7C (WisdomTree, EU-listed)", alloc: "15%", note: "Every electrification trend needs copper." },
  { side: "LONG", inst: "Gold/Silver Miners — GDX, GDXJ, Franklin Gold, AuAg Silver Bullet", alloc: "25%", note: "Leverage to metal. Buy during corrections." },
  { side: "SHORT", inst: "Long-duration bonds — 3TYS (3x short 10Y, EU), Inverse Bund", alloc: "Overlay", note: "EU PRIIPs blocks US TBT." },
];
```

### 1G. Key Frameworks

```typescript
export const KEY_CONCEPTS = [
  { name: "Physical vs. Miners", desc: "Physical ETCs DON'T correlate with equities. Miners carry equity beta. Buy physical now, miners in crashes." },
  { name: "Sprott Reflexive Loop", desc: "SPUT: Sprott issues units at premium and buys yellowcake. Your purchase tightens supply." },
  { name: "Correlation-Aware Timing", desc: "Expect turmoil? Physical now (anti-correlated), miners later (will get cheaper)." },
  { name: "Roll Yield Tax", desc: "Futures-based ETCs (agriculture) suffer 3-5% hidden annual cost. Physical-backed don't." },
  { name: "Fee Discipline", desc: "WGLD 0.12% vs VZLD 0.39% for identical gold. Always compare TER." },
  { name: "Dotcom Survivor Strategy", desc: "When AI crashes, quality hardware/infra companies fall with junk. Buy the survivors at 40-60% off highs." },
];
```

### 1H. Crash Watchlist

Companies to accumulate during the AI trough of disillusionment. The `now` field should be replaced with live EODHD prices.

```typescript
export interface WatchlistItem {
  ticker: string; name: string; sector: string; trends: string[];
  quality: string; now: string; high: string; offHigh: string;
  buyZone: string; buyPrice: string; maxPos: string;
}

export const CRASH_WATCHLIST: WatchlistItem[] = [
  { ticker: "ASML", name: "ASML Holding", sector: "Semicon Equipment", trends: ["t1","t4"], quality: "Absolute monopoly on EUV lithography. 50%+ margins.", now: "~$680", high: "$1,100", offHigh: "-38%", buyZone: "-50 to -60%", buyPrice: "$440-550", maxPos: "3-5%" },
  { ticker: "TSM", name: "TSMC", sector: "Foundry", trends: ["t1","t4","t3"], quality: "Makes ALL advanced chips. Monopoly on 3nm/2nm.", now: "~$321", high: "$222", offHigh: "Near ATH", buyZone: "Wait for -40%+", buyPrice: "$190-210", maxPos: "3-5%" },
  { ticker: "NVDA", name: "NVIDIA", sector: "Semiconductors", trends: ["t1","t3","t5"], quality: "CUDA lock-in. 75%+ gross margins.", now: "~$166", high: "$212", offHigh: "-22%", buyZone: "-45 to -55%", buyPrice: "$95-115", maxPos: "3-5%" },
  { ticker: "AVGO", name: "Broadcom", sector: "Semiconductors", trends: ["t1","t3","t4"], quality: "Custom AI chips + VMware. 60%+ margins.", now: "~$297", high: "$305", offHigh: "-3%", buyZone: "Wait for -40%+", buyPrice: "$180-210", maxPos: "3-5%" },
  { ticker: "GEV", name: "GE Vernova", sector: "Grid & Nuclear", trends: ["t3","t1","t5"], quality: "Grid + nuclear turbines. AI needs grid regardless of software ROI.", now: "~$830", high: "$948", offHigh: "-12%", buyZone: "-40 to -50%", buyPrice: "$475-570", maxPos: "2-4%" },
  { ticker: "ETN", name: "Eaton Corp", sector: "Electrical Infra", trends: ["t3","t1","t4"], quality: "Data center power, EV charging, grid. Dividend aristocrat.", now: "~$342", high: "$408", offHigh: "-16%", buyZone: "-35 to -45%", buyPrice: "$225-265", maxPos: "2-4%" },
  { ticker: "PWR", name: "Quanta Services", sector: "Grid Construction", trends: ["t3","t1"], quality: "Builds actual grid. Labor moat. $44B backlog.", now: "~$555", high: "$584", offHigh: "-5%", buyZone: "Wait for -40%+", buyPrice: "$290-350", maxPos: "2-3%" },
  { ticker: "BWXT", name: "BWX Technologies", sector: "Nuclear Components", trends: ["t3","t4","t1"], quality: "Only US full nuclear fuel fabrication. Defense monopoly.", now: "~$197", high: "$230", offHigh: "-14%", buyZone: "-35 to -45%", buyPrice: "$127-150", maxPos: "2-3%" },
  { ticker: "FCX", name: "Freeport-McMoRan", sector: "Copper Mining", trends: ["t3","t7","t4","t1"], quality: "World's largest copper producer. Grasberg mine. Low-cost.", now: "~$36", high: "$55", offHigh: "-35%", buyZone: "-45 to -55%", buyPrice: "$25-30", maxPos: "2-4%" },
  { ticker: "OKLO", name: "Oklo Inc", sector: "Micro-Reactors", trends: ["t1","t3"], quality: "SPECULATIVE. Pre-revenue. NRC denied first license. Need regulatory catalyst.", now: "~$46", high: "$194", offHigh: "-76%", buyZone: "Need catalyst", buyPrice: "$20-30 with catalyst", maxPos: "0.5-1%" },
  { ticker: "NBIS", name: "Nebius Group", sector: "AI Cloud Infra", trends: ["t1","t3"], quality: "SPECULATIVE. $27B Meta deal but $596M loss, massive dilution.", now: "~$92", high: "$141", offHigh: "-35%", buyZone: "-55 to -65%", buyPrice: "$50-55", maxPos: "1-2%" },
];
```

---

## SECTION 2: APP ARCHITECTURE

### 4 Tabs — Each with one purpose

| Tab | Name | Purpose | What's on it |
|-----|------|---------|--------------|
| 1 | Landscape | 30-second scan | Trend cards (compact, clickable) + Scenario Matrix |
| 2 | Analysis | Deep dive | Full trend registry with thesis/bear/investment map + convergence zones under each trend + AI scan buttons |
| 3 | Positions | Action page | Positions by tier (collapsible), Crash Watchlist (collapsible), Catalysts (collapsible), Core Trade (collapsible), Key Frameworks (collapsible). All with live prices. |
| 4 | Strategy Lab | Evolution engine | 3 AI tool cards: Full Synthesis, Discover Trends, Challenge Framework |

### Collapsible Sections (Positions tab)
The Positions tab uses expandable/collapsible sections. Only Tier 1 is open by default. Everything else starts collapsed — user clicks header to expand. Each header shows: chevron (▸/▾), title, count badge, and subtitle.

### Position Status — Dynamic Calculation
Fetch VIX from EODHD (`VIX.INDX`) on mount. Calculate status dynamically:
- `when: "Buy now"` → ✅ GO (green)
- `when` includes "VIX > 30" and live VIX < 25 → ⏳ WAIT — VIX at {liveVIX} (gray)
- `when` includes "VIX > 30" and live VIX >= 30 → ✅ TRIGGERED (green)
- `when` includes "VIX > 35" — same logic with 35 threshold
- `when` includes "Below EUR 38" — fetch RARE price from EODHD and compare
- Fallback to hardcoded `status` field if EODHD unavailable

### Crash Watchlist — Live Prices
Replace the hardcoded `now` field with live prices from EODHD. Calculate `offHigh` dynamically: `((livePrice / highPrice) - 1) * 100`. Color-code: green if > 30% off (approaching buy zone), yellow if 15-30% off, gray if < 15% off.

Speculative entries (OKLO, NBIS) get orange border instead of purple to flag risk.

---

## SECTION 3: API ROUTES

### /api/auth (POST)
Verify `password` against `APP_PASSWORD` env var. On success, set HttpOnly cookie `tc_auth=authenticated` with 30-day expiry.

### /api/prices (GET)
Fetch batch prices from EODHD. Cache 5 minutes via Next.js revalidate.

EODHD endpoint: `GET https://eodhd.com/api/real-time/{SYMBOL}.{EXCHANGE}?api_token={KEY}&fmt=json`

**IMPORTANT: Before hardcoding any ticker, verify it via EODHD search API:**
`GET https://eodhd.com/api/search/{QUERY}?api_token={KEY}&fmt=json`

Ticker mapping (verify each one):
```
US stocks: NVDA.US, AVGO.US, CCJ.US, GEV.US, ETN.US, PWR.US, BWXT.US, FCX.US, OKLO.US, NBIS.US, GDX.US, IXJ.US
EU ETCs on Xetra: WGLD.XETRA, OD7C.XETRA, WNUC.XETRA, RARE.XETRA, W1TB.XETRA, WRNA.XETRA, 3TYS.XETRA, XBJA.XETRA
London: SPUT.LSE, U3O8.LSE
Amsterdam: ASML.AS
VIX: VIX.INDX
```

### /api/ai (POST)
Smart router. Body: `{ system: string, prompt: string, tier: "scan" | "synthesis" }`

**Routing:**
- `tier: "scan"` → Gemini 2.5 Pro (cheap, fast: $0.15/$0.60 per M tokens)
- `tier: "synthesis"` → Claude Sonnet 4.6 (quality: $3/$15 per M tokens)

```typescript
// lib/ai-router.ts
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function callAI(system: string, prompt: string, tier: 'scan' | 'synthesis') {
  if (tier === 'scan') {
    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const result = await model.generateContent({
      systemInstruction: system,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return { text: result.response.text(), model: 'Gemini 2.5 Pro' };
  } else {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = message.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    return { text, model: 'Claude Sonnet 4.6' };
  }
}
```

**Which button uses which tier:**
| Button | Tier | Model |
|--------|------|-------|
| ⚡ Scan (per trend) | scan | Gemini 2.5 Pro |
| 🔮 Suggest Trends | scan | Gemini 2.5 Pro |
| 📊 Full Synthesis | synthesis | Claude Sonnet 4.6 |
| 🎯 Challenge Framework | synthesis | Claude Sonnet 4.6 |
| ⚡ Analyze Gaps | synthesis | Claude Sonnet 4.6 |
| Convergence Analysis | synthesis | Claude Sonnet 4.6 |

Show which model answered in the AI result panel: "via Gemini 2.5 Pro" or "via Claude Sonnet 4.6".

### /api/trends (GET/POST)
Read/write trends to Vercel KV. Seed with SEED_TRENDS on first read if KV is empty.

### /api/scans (GET/POST)
Read/write AI scan results to Vercel KV.

---

## SECTION 4: MIDDLEWARE AUTH

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname === '/api/auth') {
    return NextResponse.next();
  }
  const auth = request.cookies.get('tc_auth');
  if (!auth || auth.value !== 'authenticated') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/', '/api/:path*'] };
```

Login page: single password field, dark theme, POST to /api/auth.

---

## SECTION 5: DESIGN SYSTEM

Dark theme. Key colors:
- Background: `#0a0c10` (app), `#0d1117` / `#111827` (cards)
- Primary accent: `#00e5ff` (cyan)
- Long/Success: `#00e676`
- Short/Danger: `#ff1744`
- Warning: `#ffea00`
- Convergence/Hedge: `#c084fc`
- Crash Watchlist: `#e040fb` (speculative items use `#ff9100`)
- Text: `#e0e4ec` (primary), `#94a3b8` (secondary), `#64748b` (muted)
- Borders: `#1e293b`
- Fonts: `JetBrains Mono` for data/tickers, `DM Sans` for body text

Import fonts: `https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap`

Stage pipeline: 5 segments that fill from left based on trend stage. Each stage has its color from STAGE_COLORS.

Conviction scores: large bold number, color matches direction (green for LONG, red for SHORT, purple for HEDGE).

Status badges: green bg for ✅ GO, yellow bg for 🟡 approaching, gray bg for ⏳ WAIT.

---

## SECTION 6: TOKEN EFFICIENCY

- System prompts: under 100 tokens
- Send only relevant data per call (one trend for scan, not all 10)
- Max output: 1500 tokens for synthesis, 1000 for scans
- No web search tools — EODHD provides live prices
- Prompt caching: keep system prompts identical across calls

---

## SECTION 7: DEPLOY

```bash
npm i -g vercel
vercel login
# Vercel Dashboard → Storage → Create KV Database
# Dashboard → Settings → Environment Variables → add ANTHROPIC_API_KEY, GEMINI_API_KEY, EODHD_API_KEY, APP_PASSWORD
vercel --prod
```

---

## BUILD ORDER

1. Scaffold Next.js + install deps
2. Set up middleware auth + login page + /api/auth
3. Create lib/seed-data.ts with all data above
4. Create lib/ai-router.ts with dual-model routing
5. Create /api/prices with EODHD integration (verify every EU ticker via search API first)
6. Create /api/ai endpoint
7. Create /api/trends and /api/scans with Vercel KV
8. Build Tab 1: Landscape (trend cards + scenario matrix)
9. Build Tab 2: Analysis (trend registry + convergences under each trend + AI scan buttons)
10. Build Tab 3: Positions (collapsible tiers + crash watchlist with live prices + catalysts + core trade + frameworks)
11. Build Tab 4: Strategy Lab (3 AI tool cards)
12. Wire up live VIX for dynamic position status calculation
13. Test locally with `npm run dev`
14. Deploy to Vercel
