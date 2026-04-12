import { useState, useEffect } from "react";

const STAGES = ["Nascent", "Emerging", "Accelerating", "Consensus", "Overcrowded"];
const SC = ["#00e5ff", "#00e676", "#ffea00", "#ff9100", "#ff1744"];
const HORIZONS = ["6-18 months", "2-5 years", "5-15 years"];

const SEED_TRENDS = [
  { id: "t1", name: "AI & AGI Disruption", stage: 2, horizon: "2-5 years", confidence: 85, description: "AI automating knowledge work. Trough of disillusionment as enterprise ROI disappoints, but infra buildout continues.", subTrends: ["AI infrastructure", "Knowledge worker displacement", "Enterprise ROI reckoning", "Open-source commoditization"], signals: [], thesis: "Infra buildout durable. Long picks-and-shovels, short AI-wrapper SaaS.", bearCase: "AI infra is massive capital misallocation. Incumbents integrate open-source, crushing challengers.", investmentMap: "Long: NVDA, AVGO, TSM, GOOG, AMZN, MSFT, GEV. Short: Bear certificates on Nasdaq via Avanza Markets (courtage-free). PRIIPs blocks all US inverse ETFs for EU investors.", mispricingScore: 68 },
  { id: "t2", name: "Financial Repression & Fiat Debasement", stage: 0, horizon: "2-5 years", confidence: 75, description: "Central banks impose yield curve control, forced bond-buying, stealth inflation to liquidate debt.", subTrends: ["Dollar erosion", "Gold remonetization", "Bitcoin as digital gold", "BRICS settlement", "Negative real yields"], signals: [], thesis: "Decade of negative real yields. Long hard assets vs. short long-duration bonds. The grind IS the trade.", bearCase: "Financial repression WORKS. No tradeable crisis event.", investmentMap: "Long: WGLD (gold 0.12%), WSLV (silver), IBIT (Bitcoin), GDX/GDXJ (gold miners), Franklin Gold fund. Short: 3TYS (3x short 10Y, EU-listed), bear certs on Bund.", mispricingScore: 82 },
  { id: "t3", name: "Climate Acceleration & Energy Transition", stage: 2, horizon: "5-15 years", confidence: 80, description: "Climate change accelerating, forcing emergency energy transition and massive infrastructure spend.", subTrends: ["Nuclear renaissance", "Grid modernization", "Climate migration", "Copper supercycle"], signals: [], thesis: "Market prices orderly transition; reality is chaotic. Nuclear and copper mispriced.", bearCase: "Solar + battery cost crash makes micro-grids bypass centralized overhauls.", investmentMap: "Long: SPUT (physical uranium), U3O8/WNUC (miners), CCJ, NXE, UEC, OD7C (copper), OKLO, GEV, BWXT, PWR, ETN. Short: Coastal REITs.", mispricingScore: 65 },
  { id: "t4", name: "Geopolitical Fragmentation", stage: 2, horizon: "2-5 years", confidence: 75, description: "World splitting into blocs, reshoring supply chains, weaponizing trade and finance.", subTrends: ["Nearshoring boom", "Defense surge", "Semiconductor sovereignty", "Rare earth chains"], signals: [], thesis: "Defense and reshoring capex larger and longer than expected.", bearCase: "Reshoring is inflationary fantasy. Capital forces detente.", investmentMap: "Long: EUDF (defence), RHM.DE, BA.L, LHX, NOC, RARE (strategic metals), MP, ASML, AMAT. Short: 50%+ China manufacturing dependency.", mispricingScore: 55 },
  { id: "t5", name: "Demographic Inversion", stage: 2, horizon: "2-5 years", confidence: 90, description: "Population decline in China, Korea, Japan, Germany. Labor shortages forcing automation.", subTrends: ["Automation as labor substitute", "Healthcare explosion", "Pension erosion"], signals: [], thesis: "Demographics force AI/automation adoption. Long automation, long healthcare.", bearCase: "Productivity renaissance OFFSETS demographic drag.", investmentMap: "Long: Wellington HC fund, IXJ, UNH, LLY, ISRG, ROBO ETF, Fanuc (6954.T), ROK.", mispricingScore: 70 },
  { id: "t6", name: "Trust Crisis & Verification Economy", stage: 1, horizon: "2-5 years", confidence: 80, description: "AI synthetic content makes truth premium. Zero-trust drives verification investment.", subTrends: ["Digital identity", "Content provenance", "Deepfake detection", "Zero-trust security"], signals: [], thesis: "Verification becomes critical infrastructure.", bearCase: "Big tech solves verification internally.", investmentMap: "Long: W1TB (cybersecurity), CRWD, PANW, FTNT, ZS, OKTA, CYBR, Chainlink (LINK).", mispricingScore: 75 },
  { id: "t7", name: "Commodities Financialization", stage: 2, horizon: "2-5 years", confidence: 80, description: "Hard assets becoming monetary reserves. Central banks hoarding gold; extends to silver, copper, uranium.", subTrends: ["Central bank gold buying", "Silver premium", "Uranium reserves", "Copper as collateral"], signals: [], thesis: "Commodities remonetized. Physical ETCs have no equity beta; miners do.", bearCase: "Digital assets absorb alternative reserve demand.", investmentMap: "Physical: WGLD (0.12%), WSLV, SPUT, OD7C, VZLA. Miners: GDX, RARE, U3O8. Individual: GOLD (Barrick), FCX (Freeport). Broad: WTIC.", mispricingScore: 72 },
  { id: "t8", name: "Synthetic Biology", stage: 0, horizon: "5-15 years", confidence: 65, description: "AI-powered genomics enabling bio-manufacturing of chemicals, materials, medicines.", subTrends: ["AI drug discovery", "Precision fermentation", "Personalized medicine"], signals: [], thesis: "AI + biology is generational. Watch food/materials before pharma.", bearCase: "Bio-manufacturing perpetually five years away.", investmentMap: "Long: WRNA (BioRevolution), CRSP, NTLA, DNA (Ginkgo), TWST, RXRX. Nascent: 1-3% max, 5-10yr hold.", mispricingScore: 80 },
  { id: "t9", name: "Strategic Bridge States", stage: 1, horizon: "2-5 years", confidence: 78, description: "Countries at nexus of green energy, nearshoring, digital transformation bridge competing blocs.", subTrends: ["Green hydrogen export", "Nearshoring corridors", "Phosphates-to-LFP", "Renewable infra"], signals: [], thesis: "Bridge states capture asymmetric value. Invest in their infrastructure and banking.", bearCase: "Protectionism blocks exports. Political instability.", investmentMap: "Frontier/EM: Schroder Frontier Markets fund, XSOE (WisdomTree EM ex-State-Owned). Vietnam: VNM ETF. India: INDA ETF, Ashoka WhiteOak India Leaders. Mexico: EWW ETF. Look for local banks, miners, port operators, and energy infra in each bridge state.", mispricingScore: 82 },
  { id: "t10", name: "Carbon as Feedstock", stage: 0, horizon: "5-15 years", confidence: 55, description: "Cheap energy makes CO2 capture economical, turning carbon into manufacturing input.", subTrends: ["Direct air capture", "Synthetic hydrocarbons", "Carbon materials"], signals: [], thesis: "Breaks climate doom loop. When capture below $100/ton, economics flip.", bearCase: "Energy costs never drop enough.", investmentMap: "Long (speculative): OXY (owns 1PointFive DAC), PLUG, NEL.OL, ITM.L, WCO2 (carbon ETC). Monitor only.", mispricingScore: 85 },
];

const SCENARIOS = [
  { name: "The Managed Grind", prob: 50, type: "base", desc: "Financial repression works. Inflation 3-4%, yields capped. Slow debasement. AI shifts to utility.", portfolio: "Long: WGLD, SPUT, ROBO, infra funds, inflation-linked bonds. Short: Long-duration bonds via 3TYS." },
  { name: "The Great Repricing", prob: 30, type: "bear", desc: "Failed sovereign auction or AI ROI collapse triggers liquidity crisis.", portfolio: "Long: WSLV, PSLV, CHF via XBJA, WTMF (managed futures). Short: Bear certs on Nasdaq (Avanza Markets), DXSP (short Euro STOXX 50 UCITS)." },
  { name: "The Productivity Renaissance", prob: 20, type: "bull", desc: "AI scaling laws hold. SynBio industrial scale. Productivity surge offsets all.", portfolio: "Long: NVDA, MSFT, GOOG, WRNA, CCJ/WNUC. Short: PFE, MRK, XOP." },
];

const CONVERGENCES = [
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

const CATALYSTS = [
  { name: "Gold Correction", date: "Ongoing", impact: "Gold -20% from ATH. Silver -32%. Pullback, not invalidation." },
  { name: "FERC Load Rule", date: "Apr 2026", impact: "Hard ceiling for AI data center scaling if delayed." },
  { name: "Cloud Earnings ROI", date: "Q3-Q4 2026", impact: "If AI revenue misses capex, 30-40% AI drawdown. Buy trigger for miners." },
  { name: "Treasury Tails", date: "Ongoing", impact: "Tail spread = repression tested. Confirms gold + bond short." },
  { name: "Uranium > $95/lb", date: "Watch", impact: "At ~$86. Breaking $95 triggers miner re-rating." },
  { name: "Copper Supply Gap", date: "2026-28", impact: "No new mines. AI + EV + grid = structural deficit." },
];

const POSITIONS = [
  // Tier 1: Physical — Deploy Now (anti-correlated, no timing needed)
  { tier: 1, dir: "LONG", ticker: "SPUT", name: "HANetf Sprott Physical Uranium ETC", type: "Physical", fee: "1.48% all-in", trends: ["t3","t7","t1"], conv: 95, why: "Sprott buys physical yellowcake at premium. Tightens supply. $86/lb, structural deficit.", when: "Buy now", status: "✅ GO — anti-correlated, no timing needed", corr: "Anti-correlated" },
  { tier: 1, dir: "LONG", ticker: "OD7C", name: "WisdomTree Copper ETC", type: "Physical", fee: "0.49%", trends: ["t3","t4","t7","t1"], conv: 90, why: "At intersection of more trends than any asset. No new mines until 2028+.", when: "Buy now", status: "✅ GO — anti-correlated, no timing needed", corr: "Anti-correlated" },
  { tier: 1, dir: "LONG", ticker: "WGLD", name: "WisdomTree Core Physical Gold", type: "Physical", fee: "0.12%", trends: ["t2","t7"], conv: 85, why: "Financial repression hedge. 0.12% strictly superior to VZLD (0.39%). Corrected 20%.", when: "Accumulate on dips", status: "🟡 Gold at ~$3,100, corrected 20% from $3,500 ATH. Decent entry but not bottom yet", corr: "Anti-correlated" },
  { tier: 1, dir: "LONG", ticker: "WSLV", name: "WisdomTree Core Physical Silver", type: "Physical", fee: "0.19%", trends: ["t2","t7","t3"], conv: 82, why: "Dual monetary + industrial (solar). Corrected 32%. Bigger upside in crisis.", when: "Accumulate", status: "🟡 Silver at ~$34, corrected 32% from $50. Deeper correction = better entry", corr: "Anti-correlated" },

  // Tier 2: Miners/Sectors — Deploy on Correction (equity beta)
  { tier: 2, dir: "LONG", ticker: "U3O8", name: "HANetf Sprott Uranium Miners UCITS", type: "Miners ETF", fee: "~0.85%", trends: ["t3","t7","t1"], conv: 88, why: "Pure-play uranium miners. Buy when selloff widens gap vs commodity price.", when: "VIX > 30 or S&P -15%", status: "⏳ WAIT — VIX ~18, S&P near highs. No correction yet", corr: "Equity-correlated" },
  { tier: 2, dir: "LONG", ticker: "WNUC", name: "WisdomTree Uranium & Nuclear", type: "Sector ETF", fee: "0.47%", trends: ["t3","t1"], conv: 85, why: "Broader nuclear incl. GE Vernova, Curtiss-Wright. Lower fee, more diversified.", when: "On correction", status: "⏳ WAIT — no broad equity correction yet", corr: "Equity-correlated" },
  { tier: 2, dir: "LONG", ticker: "IXJ", name: "iShares Global Healthcare", type: "Sector ETF", fee: "0.40%", trends: ["t5","t8"], conv: 82, why: "Highest-confidence trend (Demographics 90%). UNH, LLY, ISRG. Most predictable demand curve in the framework.", when: "On correction", status: "⏳ WAIT — healthcare hasn't sold off meaningfully", corr: "Low beta" },
  { tier: 2, dir: "LONG", ticker: "RARE", name: "WisdomTree Strategic Metals & Rare Earths", type: "Miners ETF", fee: "0.55%", trends: ["t3","t4","t7"], conv: 80, why: "Lithium, rare earths, copper miners. Green Mercantilism thesis. Down -17%.", when: "Below EUR 38", status: "🟡 APPROACHING — at ~EUR 40, target below 38. Getting close", corr: "Equity-correlated" },
  { tier: 2, dir: "LONG", ticker: "GDX", name: "VanEck Gold Miners ETF", type: "Miners ETF", fee: "0.51%", trends: ["t2","t7"], conv: 78, why: "2-3x leverage to gold price. Buy when gold stabilizes from correction.", when: "Wait for gold bottom", status: "⏳ WAIT — gold still correcting, miners amplify downside", corr: "Equity-correlated" },
  { tier: 2, dir: "LONG", ticker: "W1TB", name: "WisdomTree Cybersecurity UCITS", type: "Thematic", fee: "~0.40%", trends: ["t6","t1"], conv: 72, why: "Trust Crisis thesis. CRWD, PANW, FTNT. But these are expensive growth stocks — will crash in tech selloff before recovering.", when: "Tech capitulation only", status: "⏳ WAIT — no tech capitulation yet. These are expensive", corr: "Equity-correlated" },

  // Tier 3: Individual Stocks
  { tier: 3, dir: "LONG", ticker: "CCJ", name: "Cameco Corp", type: "Stock", fee: "-", trends: ["t3","t7"], conv: 85, why: "Largest Western uranium producer. Real revenue, real production. $2.7B Nuclear Fuel Supply Act contracts.", when: "Sector pullback", status: "⏳ WAIT — CCJ at ~$52, near range top. Wait for pullback to $40s", corr: "Equity-correlated" },
  { tier: 3, dir: "LONG", ticker: "NXE", name: "NexGen Energy", type: "Stock", fee: "-", trends: ["t3","t7"], conv: 55, why: "Highest-grade undeveloped uranium deposit (Rook I). BUT: development-stage, hasn't produced an ounce. High risk.", when: "Very small, speculative only", status: "⏳ WAIT — speculative, needs uranium above $100 to justify", corr: "Equity-correlated" },

  // Tier 4: Long Horizon, Hedges, Shorts
  { tier: 4, dir: "LONG", ticker: "WRNA", name: "WisdomTree BioRevolution UCITS", type: "Thematic", fee: "~0.40%", trends: ["t8","t1"], conv: 68, why: "Synthetic Biology in ETF form. Nascent stage — expect high volatility and potentially years of underperformance before thesis plays out.", when: "VIX > 35, max 1-3%", status: "⏳ WAIT — VIX ~18, far from trigger. Patience", corr: "Equity-correlated" },
  { tier: 4, dir: "LONG", ticker: "IBIT", name: "iShares Bitcoin ETF / 21Shares", type: "Crypto", fee: "0.25-1.5%", trends: ["t2","t6"], conv: 55, why: "In theory a hard asset hedge. In practice, currently correlates with risk assets in every selloff.", when: "Dollar-cost average, small", status: "🟡 BTC at ~$82K, down from $109K ATH. DCA if you believe in decoupling", corr: "Risk-correlated" },
  { tier: 4, dir: "SHORT", ticker: "3TYS", name: "WisdomTree 3x Short US 10Y (EU)", type: "Inverse ETP", fee: "0.75%+", trends: ["t2"], conv: 72, why: "Core Trade short leg. BUT: 3x daily reset decay eats you alive if held long-term. Tactical only.", when: "Open now, very small", status: "✅ GO — structural position, keep tiny. Decay is real", corr: "Anti-bond" },
  { tier: 4, dir: "SHORT", ticker: "Bear Certs", name: "Avanza Markets bear certificates on Nasdaq/S&P (courtage-free)", type: "Certificate", fee: "Spread only", trends: ["t1"], conv: 68, why: "PRIIPs blocks all US inverse ETFs. Bear certs via Avanza Markets are courtage-free. Tactical instrument around earnings.", when: "Tactical around Q3-Q4 2026", status: "⏳ WAIT — too early. Deploy around Q3-Q4 earnings season", corr: "Inverse" },
  { tier: 4, dir: "HEDGE", ticker: "XBJA", name: "WisdomTree Long CHF Short EUR (Avanza-listed)", type: "Currency", fee: "0.39%", trends: ["t2","t4"], conv: 58, why: "Swiss Franc strengthens in crisis. Cheap hedge — holds value in calm, profits in turmoil.", when: "Buy now as small hedge", status: "✅ GO — cheap to hold, crisis insurance", corr: "Anti-correlated" },
  { tier: 4, dir: "HEDGE", ticker: "WTMF", name: "WisdomTree Managed Futures / Lynx Dynamic", type: "Alternative", fee: "0.65-1.5%", trends: [], conv: 60, why: "Uncorrelated returns in any direction. You buy hedges in calm markets, not during the crisis.", when: "Buy now", status: "✅ GO — calm markets = right time for hedges", corr: "Uncorrelated" },
];

const TRADE_LEGS = [
  { side: "LONG", inst: "Physical Gold - WGLD (0.12%), GBSE (EUR hedged), IAU (US)", alloc: "40%", note: "WGLD strictly better than VZLD (0.39%). Identical gold at HSBC." },
  { side: "LONG", inst: "Physical Uranium - SPUT (HANetf, EU-listed)", alloc: "20%", note: "Sprott buys yellowcake at premium. Anti-correlated." },
  { side: "LONG", inst: "Physical Copper - OD7C (WisdomTree, EU-listed)", alloc: "15%", note: "Every electrification trend needs copper. No mines until 2028+." },
  { side: "LONG", inst: "Gold/Silver Miners - GDX, GDXJ, Franklin Gold, AuAg Silver Bullet", alloc: "25%", note: "Leverage to metal. Buy during corrections for discount." },
  { side: "SHORT", inst: "Long-duration bonds - 3TYS (3x short 10Y, EU), Inverse Bund", alloc: "Overlay", note: "EU PRIIPs blocks US TBT. Gold overweight partially expresses this." },
];

const KEY_CONCEPTS = [
  { name: "Physical vs. Miners", desc: "Physical ETCs track materials, DON'T correlate with equities. Miners carry equity beta. Buy physical now, miners in crashes." },
  { name: "Sprott Reflexive Loop", desc: "SPUT: Sprott issues units at premium and buys yellowcake. Your purchase tightens supply. Unique mechanism." },
  { name: "Correlation-Aware Timing", desc: "Expect turmoil? Physical commodities now (anti-correlated), miners later (will get cheaper with stocks)." },
  { name: "Roll Yield Tax", desc: "Futures-based ETCs (agriculture) suffer 3-5% hidden annual cost. Physical-backed (gold, uranium) don't." },
  { name: "Fee Discipline", desc: "WGLD 0.12% vs VZLD 0.39% for identical gold. Always compare TER. SPUT 0.85% pays for supply tightening." },
  { name: "Dotcom Survivor Strategy", desc: "When AI trough of disillusionment hits, quality hardware/infra companies crash alongside junk. That's when you buy the survivors — companies with real revenue, physical assets, and multi-trend alignment. Build positions gradually as they fall 40-60% from highs." },
];

// ─── CRASH WATCHLIST: Quality companies to accumulate during AI trough ───
// Criteria: (1) Hardware/infra > software, (2) Real revenue & margins, (3) Competitive moat,
// (4) Balance sheet survives downturn, (5) Aligned with multiple trends beyond just AI
var CRASH_WATCHLIST = [
  { ticker: "ASML", name: "ASML Holding", sector: "Semicon Equipment", trends: ["t1","t4"], quality: "Absolute monopoly on EUV lithography. 50%+ margins. $36B+ backlog.", now: "~$680", high: "$1,100", offHigh: "-38%", buyZone: "-50 to -60%", buyPrice: "$440-550", maxPos: "3-5%" },
  { ticker: "TSM", name: "TSMC", sector: "Foundry", trends: ["t1","t4","t3"], quality: "Makes ALL advanced chips. Monopoly on 3nm/2nm. 55%+ margins.", now: "~$321", high: "$222 (pre-split ref)", offHigh: "Near ATH", buyZone: "Wait for -40%+", buyPrice: "$190-210", maxPos: "3-5%" },
  { ticker: "NVDA", name: "NVIDIA", sector: "Semiconductors", trends: ["t1","t3","t5"], quality: "CUDA lock-in. 75%+ gross margins. Every AI workload needs GPUs.", now: "~$166", high: "$212", offHigh: "-22%", buyZone: "-45 to -55%", buyPrice: "$95-115", maxPos: "3-5%" },
  { ticker: "AVGO", name: "Broadcom", sector: "Semiconductors", trends: ["t1","t3","t4"], quality: "Custom AI chips + VMware. Diversified. 60%+ margins.", now: "~$297", high: "$305", offHigh: "-3%", buyZone: "Wait for -40%+", buyPrice: "$180-210", maxPos: "3-5%" },
  { ticker: "GEV", name: "GE Vernova", sector: "Grid & Nuclear", trends: ["t3","t1","t5"], quality: "Grid equipment + nuclear turbines. AI needs grid regardless of software ROI.", now: "~$830", high: "$948", offHigh: "-12%", buyZone: "-40 to -50%", buyPrice: "$475-570", maxPos: "2-4%" },
  { ticker: "ETN", name: "Eaton Corp", sector: "Electrical Infra", trends: ["t3","t1","t4"], quality: "Data center power, EV charging, grid. Decades of dividend growth.", now: "~$342", high: "$408", offHigh: "-16%", buyZone: "-35 to -45%", buyPrice: "$225-265", maxPos: "2-4%" },
  { ticker: "PWR", name: "Quanta Services", sector: "Grid Construction", trends: ["t3","t1"], quality: "Builds actual grid. Massive labor moat. $44B backlog. ATH last week.", now: "~$555", high: "$584", offHigh: "-5%", buyZone: "Wait for -40%+", buyPrice: "$290-350", maxPos: "2-3%" },
  { ticker: "BWXT", name: "BWX Technologies", sector: "Nuclear Components", trends: ["t3","t4","t1"], quality: "Only US full nuclear fuel fabrication. Navy + commercial. Defense monopoly.", now: "~$197", high: "$230", offHigh: "-14%", buyZone: "-35 to -45%", buyPrice: "$127-150", maxPos: "2-3%" },
  { ticker: "FCX", name: "Freeport-McMoRan", sector: "Copper Mining", trends: ["t3","t7","t4","t1"], quality: "World's largest copper producer. Grasberg mine. Low-cost.", now: "~$36", high: "$55", offHigh: "-35%", buyZone: "-45 to -55%", buyPrice: "$25-30", maxPos: "2-4%" },
  { ticker: "OKLO", name: "Oklo Inc", sector: "Micro-Reactors", trends: ["t1","t3"], quality: "SPECULATIVE. Pre-revenue. NRC denied first license. Zero working reactors. Only buy post-crash if regulatory milestone achieved.", now: "~$46", high: "$194", offHigh: "-76%", buyZone: "Already crashed. Need regulatory catalyst.", buyPrice: "$20-30 with catalyst", maxPos: "0.5-1%" },
  { ticker: "NBIS", name: "Nebius Group", sector: "AI Cloud Infra", trends: ["t1","t3"], quality: "SPECULATIVE. $27B Meta deal but $596M loss, $16-20B capex, massive dilution. Only buy if Meta deal intact post-crash.", now: "~$92", high: "$141", offHigh: "-35%", buyZone: "-55 to -65%", buyPrice: "$50-55", maxPos: "1-2%" },
];

var TIER_INFO = {
  1: { label: "Deploy Now - Physical Commodities", sub: "Anti-correlated to equities. No timing needed.", color: "#00e676" },
  2: { label: "Deploy on Correction - Miners & Sectors", sub: "Equity beta. Buy when VIX > 30 or -15% correction.", color: "#00e5ff" },
  3: { label: "Individual Picks - High Conviction", sub: "Concentrated bets. Research individually.", color: "#ffea00" },
  4: { label: "Long Horizon & Hedges", sub: "Small positions. Patient capital.", color: "#c084fc" },
};

var font = "JetBrains Mono, Fira Code, monospace";
var fontS = "DM Sans, Segoe UI, sans-serif";

var CSS_TEXT = [
  '@keyframes spin{to{transform:rotate(360deg)}}',
  '@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}',
  '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}',
  '@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap");',
].join("\n");

function badge(c) { return { display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: c + "18", color: c, fontFamily: font }; }
function btn(v) { var b = { padding: "8px 18px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: font }; if (v === "d") return { ...b, background: "rgba(255,23,68,0.15)", color: "#ff1744", border: "1px solid #ff174433" }; if (v === "g") return { ...b, background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid #1e293b" }; return { ...b, background: "#00e5ff", color: "#0a0c10" }; }
var card = { background: "linear-gradient(145deg,#111827,#0f1623)", border: "1px solid #1e293b", borderRadius: 10, padding: 20, marginBottom: 14 };
var meterBg = { height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden", flex: 1 };
var tagStyle = { display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, background: "rgba(255,255,255,0.05)", color: "#94a3b8", marginRight: 4, marginBottom: 4 };
var aiPanel = { background: "linear-gradient(145deg,#0c1a2e,#0f1623)", border: "1px solid #0e4b7a", borderRadius: 10, padding: 20, marginTop: 16 };
var spinStyle = { display: "inline-block", width: 16, height: 16, border: "2px solid #1e293b", borderTopColor: "#00e5ff", borderRadius: "50%", animation: "spin 0.8s linear infinite" };
var lbl = { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: font, marginBottom: 4, display: "block" };

async function callAI(sys, usr) {
  try {
    var r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: sys + "\n\n" + usr }],
      }),
    });
    var d = await r.json();
    if (d.error) return "API Error: " + JSON.stringify(d.error);
    if (!d.content) return "No content. Full response: " + JSON.stringify(d).slice(0, 500);
    var texts = [];
    for (var i = 0; i < d.content.length; i++) {
      if (d.content[i].text) texts.push(d.content[i].text);
    }
    return texts.join("\n") || "Empty text. Content: " + JSON.stringify(d.content).slice(0, 500);
  } catch (e) {
    return "Fetch error: " + e.name + " — " + e.message;
  }
}

function StagePipeline({ stage, onChange }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {STAGES.map((x, i) => (
        <div key={x} onClick={() => onChange && onChange(i)} style={{ flex: 1, height: 8, borderRadius: 4, cursor: onChange ? "pointer" : "default", background: i <= stage ? SC[stage] : "#1e293b", opacity: i <= stage ? 1 : 0.4 }} title={x} />
      ))}
      <span style={{ fontSize: 11, color: SC[stage], marginLeft: 8, fontFamily: font, fontWeight: 600, whiteSpace: "nowrap" }}>{STAGES[stage]}</span>
    </div>
  );
}

function Meter({ label, value }) {
  var c = value > 70 ? "#00e676" : value > 50 ? "#ffea00" : "#ff9100";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ ...lbl, margin: 0, whiteSpace: "nowrap" }}>{label}</span>
      <div style={meterBg}><div style={{ height: "100%", width: value + "%", background: c, borderRadius: 3, transition: "width 0.5s" }} /></div>
      <span style={{ fontSize: 13, fontWeight: 700, color: c, fontFamily: font, minWidth: 38, textAlign: "right" }}>{value}{label === "Confidence" ? "%" : ""}</span>
    </div>
  );
}

export default function TrendCompass() {
  const [tab, setTab] = useState("landscape");
  const [trends, setTrends] = useState(SEED_TRENDS);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [scans, setScans] = useState({});
  const [ready, setReady] = useState(false);
  const empty = { name: "", stage: 0, horizon: "2-5 years", confidence: 50, description: "", subTrends: "", thesis: "", bearCase: "", investmentMap: "", mispricingScore: 50 };
  const [nf, setNf] = useState(empty);
  const [expanded, setExpanded] = useState({ t1: true, t2: false, t3: false, t4: false, crash: false, catalysts: false, core: false, frameworks: false });

  useEffect(() => {
    (async () => {
      try { var r = await window.storage.get("tc6-t"); if (r && r.value) setTrends(JSON.parse(r.value)); } catch(e) {}
      try { var r2 = await window.storage.get("tc6-s"); if (r2 && r2.value) setScans(JSON.parse(r2.value)); } catch(e) {}
      setReady(true);
    })();
  }, []);
  useEffect(() => { if (ready) { window.storage.set("tc6-t", JSON.stringify(trends)).catch(() => {}); } }, [trends, ready]);
  useEffect(() => { if (ready) { window.storage.set("tc6-s", JSON.stringify(scans)).catch(() => {}); } }, [scans, ready]);

  function addTrend() {
    setTrends(p => [...p, { ...nf, id: "t" + Date.now(), subTrends: nf.subTrends.split(",").map(x => x.trim()).filter(Boolean), signals: [], confidence: +nf.confidence, stage: +nf.stage, mispricingScore: +nf.mispricingScore }]);
    setNf(empty); setShowAdd(false);
  }

  async function doScan(t) {
    setLoading(true); setResult("");
    try {
      var r = await callAI("Strategic intelligence analyst. Specific tickers. Recent developments.", "Scan: " + t.name + "\n" + t.description + "\nStage: " + STAGES[t.stage] + "\nThesis: " + t.thesis + "\nBear: " + (t.bearCase || "N/A") + "\n\n1. Latest Signals\n2. Bull vs Bear\n3. Stage Assessment\n4. Mispricing\n5. Investments (tickers)\n6. Watchpoints");
      setResult(r); setScans(p => ({ ...p, [t.id]: { result: r, ts: new Date().toISOString() } }));
    } catch(e) {
      setResult("Scan failed: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  var tabDef = [{ id: "landscape", l: "Landscape" }, { id: "analysis", l: "Analysis" }, { id: "positions", l: "Positions" }, { id: "lab", l: "Strategy Lab" }];

  return (
    <div style={{ fontFamily: fontS, background: "#0a0c10", color: "#e0e4ec", minHeight: "100vh" }}>
      <style>{CSS_TEXT}</style>
      <div style={{ background: "linear-gradient(135deg,#0d1117,#111827)", borderBottom: "1px solid #1e293b", padding: "20px 28px 16px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 100% at 20% 0%,rgba(0,229,255,0.06),transparent 70%)" }} />
        <h1 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, letterSpacing: "0.08em", color: "#00e5ff", margin: 0, position: "relative" }}>{"◈ TREND COMPASS"}</h1>
        <p style={{ fontSize: 12, color: "#64748b", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 2, position: "relative" }}>Strategic Intelligence System</p>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #1e293b", background: "#0d1117", flexWrap: "wrap" }}>
        {tabDef.map(t => (
          <div key={t.id} onClick={() => { setTab(t.id); setResult(""); }} style={{ padding: "12px 24px", fontSize: 13, fontWeight: tab === t.id ? 600 : 400, cursor: "pointer", color: tab === t.id ? "#00e5ff" : "#64748b", borderBottom: tab === t.id ? "2px solid #00e5ff" : "2px solid transparent", background: tab === t.id ? "rgba(0,229,255,0.04)" : "transparent", fontFamily: font }}>{t.l}</div>
        ))}
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>

        {/* LANDSCAPE */}
        {tab === "landscape" && (
          <div style={{ animation: "fadeIn 0.4s" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600 }}>Macro Landscape</h2>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>{trends.length} active trends</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 12 }}>
              {trends.map(t => (
                <div key={t.id} style={{ ...card, cursor: "pointer", padding: 16 }} onClick={() => setTab("analysis")}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, flex: 1, lineHeight: 1.3 }}>{t.name}</h3>
                    <span style={{ ...badge(SC[t.stage]), fontSize: 10 }}>{STAGES[t.stage]}</span>
                  </div>
                  <StagePipeline stage={t.stage} />
                  <div style={{ marginTop: 10 }}><Meter label="Mispricing" value={t.mispricingScore} /></div>
                  <div style={{ marginTop: 6 }}><Meter label="Confidence" value={t.confidence} /></div>
                  <div style={{ marginTop: 8 }}><span style={badge("#94a3b8")}>{t.horizon}</span></div>
                </div>
              ))}
            </div>

            <h3 style={{ marginTop: 32, fontSize: 16, fontWeight: 600, color: "#ffea00" }}>{"◇ Scenario Matrix"}</h3>
            <p style={{ margin: "4px 0 14px", fontSize: 13, color: "#64748b" }}>Probability-weighted futures</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              {SCENARIOS.map((sc, i) => {
                var c = sc.type === "base" ? "#ffea00" : sc.type === "bear" ? "#ff1744" : "#00e676";
                return (
                  <div key={i} style={{ ...card, borderLeft: "3px solid " + c }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <h4 style={{ margin: 0, fontSize: 14, color: c }}>{sc.name}</h4>
                      <span style={{ ...badge(c), fontSize: 13, fontWeight: 700 }}>{sc.prob}%</span>
                    </div>
                    <p style={{ margin: "0 0 10px", fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{sc.desc}</p>
                    <div style={{ padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 6, fontSize: 11, color: "#cbd5e1", lineHeight: 1.5, fontFamily: font }}>{sc.portfolio}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ANALYSIS */}
        {tab === "analysis" && (
          <div style={{ animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Deep Analysis</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={btn("g")} onClick={async () => { setLoading(true); setResult(""); try { var r = await callAI("Suggest 5 NEW mega-trends with specific tickers.", "Current: " + trends.map(t => t.name).join(", ")); setResult(r); } catch(e) { setResult("Error: " + e.message); } finally { setLoading(false); } }} disabled={loading}>{"🔮 Suggest"}</button>
                <button style={btn()} onClick={() => setShowAdd(!showAdd)}>+ Add</button>
              </div>
            </div>

            {showAdd && (
              <div style={{ ...card, borderColor: "#00e5ff33" }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#00e5ff" }}>New Mega-Trend</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div><label style={lbl}>Name</label><input style={{ padding: "10px 14px", borderRadius: 6, border: "1px solid #1e293b", background: "#0d1117", color: "#e0e4ec", fontSize: 14, fontFamily: fontS, width: "100%", boxSizing: "border-box", outline: "none" }} value={nf.name} onChange={e => setNf({ ...nf, name: e.target.value })} /></div>
                  <div><label style={lbl}>Horizon</label><select style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #1e293b", background: "#0d1117", color: "#e0e4ec", fontSize: 13, outline: "none", width: "100%" }} value={nf.horizon} onChange={e => setNf({ ...nf, horizon: e.target.value })}>{HORIZONS.map(h => <option key={h}>{h}</option>)}</select></div>
                </div>
                <div style={{ marginTop: 12 }}><label style={lbl}>Description</label><textarea style={{ padding: "10px 14px", borderRadius: 6, border: "1px solid #1e293b", background: "#0d1117", color: "#e0e4ec", fontSize: 13, fontFamily: fontS, width: "100%", boxSizing: "border-box", outline: "none", resize: "vertical", minHeight: 70 }} value={nf.description} onChange={e => setNf({ ...nf, description: e.target.value })} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
                  <div><label style={lbl}>Stage: {STAGES[nf.stage]}</label><input type="range" min={0} max={4} value={nf.stage} onChange={e => setNf({ ...nf, stage: +e.target.value })} style={{ width: "100%" }} /></div>
                  <div><label style={lbl}>Confidence: {nf.confidence}%</label><input type="range" min={0} max={100} value={nf.confidence} onChange={e => setNf({ ...nf, confidence: +e.target.value })} style={{ width: "100%" }} /></div>
                </div>
                <div style={{ marginTop: 12 }}><label style={lbl}>Thesis</label><textarea style={{ padding: "10px 14px", borderRadius: 6, border: "1px solid #1e293b", background: "#0d1117", color: "#e0e4ec", fontSize: 13, fontFamily: fontS, width: "100%", boxSizing: "border-box", outline: "none", resize: "vertical", minHeight: 70 }} value={nf.thesis} onChange={e => setNf({ ...nf, thesis: e.target.value })} /></div>
                <div style={{ marginTop: 12 }}><label style={{ ...lbl, color: "#ff1744" }}>Bear Case</label><textarea style={{ padding: "10px 14px", borderRadius: 6, border: "1px solid #ff174433", background: "#0d1117", color: "#e0e4ec", fontSize: 13, fontFamily: fontS, width: "100%", boxSizing: "border-box", outline: "none", resize: "vertical", minHeight: 70 }} value={nf.bearCase} onChange={e => setNf({ ...nf, bearCase: e.target.value })} /></div>
                <div style={{ marginTop: 12 }}><label style={{ ...lbl, color: "#00e676" }}>Investment Map (tickers)</label><textarea style={{ padding: "10px 14px", borderRadius: 6, border: "1px solid #00e67633", background: "#0d1117", color: "#e0e4ec", fontSize: 13, fontFamily: fontS, width: "100%", boxSizing: "border-box", outline: "none", resize: "vertical", minHeight: 70 }} value={nf.investmentMap} onChange={e => setNf({ ...nf, investmentMap: e.target.value })} /></div>
                <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                  <button style={btn()} onClick={addTrend} disabled={!nf.name}>Save</button>
                  <button style={btn("g")} onClick={() => setShowAdd(false)}>Cancel</button>
                </div>
              </div>
            )}

            {trends.map(t => {
              var relConv = CONVERGENCES.filter(z => z.trends.includes(t.id));
              return (
                <div key={t.id} style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{t.name}</h3>
                        <span style={badge(SC[t.stage])}>{STAGES[t.stage]}</span>
                        <span style={badge("#94a3b8")}>{t.horizon}</span>
                      </div>
                      <p style={{ margin: "0 0 8px", fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{t.description}</p>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
                      <button style={btn()} onClick={() => doScan(t)} disabled={loading}>{"⚡ Scan"}</button>
                      <button style={btn("d")} onClick={() => setTrends(p => p.filter(x => x.id !== t.id))}>{"✕"}</button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div><StagePipeline stage={t.stage} onChange={v => setTrends(p => p.map(x => x.id === t.id ? { ...x, stage: v } : x))} /></div>
                    <div style={{ display: "flex", gap: 12 }}><div style={{ flex: 1 }}><Meter label="Mispricing" value={t.mispricingScore} /></div><div style={{ flex: 1 }}><Meter label="Confidence" value={t.confidence} /></div></div>
                  </div>
                  <div style={{ marginTop: 8 }}>{t.subTrends.map((x, i) => <span key={i} style={tagStyle}>{x}</span>)}</div>
                  {t.thesis && <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(0,229,255,0.04)", borderRadius: 6, borderLeft: "3px solid #00e5ff" }}><label style={{ ...lbl, marginBottom: 4 }}>Thesis</label><p style={{ margin: 0, fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>{t.thesis}</p></div>}
                  {t.bearCase && <div style={{ marginTop: 8, padding: "10px 14px", background: "rgba(255,23,68,0.04)", borderRadius: 6, borderLeft: "3px solid #ff1744" }}><label style={{ ...lbl, color: "#ff1744", marginBottom: 4 }}>Bear Case</label><p style={{ margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.5, fontStyle: "italic" }}>{t.bearCase}</p></div>}
                  {t.investmentMap && <div style={{ marginTop: 8, padding: "10px 14px", background: "rgba(0,230,118,0.04)", borderRadius: 6, borderLeft: "3px solid #00e676" }}><label style={{ ...lbl, color: "#00e676", marginBottom: 4 }}>Investment Map</label><p style={{ margin: 0, fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>{t.investmentMap}</p></div>}
                  {relConv.length > 0 && <div style={{ marginTop: 12 }}><label style={{ ...lbl, color: "#c084fc", marginBottom: 8 }}>Convergence Zones</label>{relConv.map((z, i) => { var ot = trends.find(x => x.id === z.trends.find(id => id !== t.id)); return (<div key={i} style={{ padding: "8px 12px", background: "rgba(74,29,142,0.08)", borderRadius: 6, borderLeft: "2px solid #4a1d8e", marginBottom: 6 }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 600, color: "#c084fc" }}>{z.name}</span><span style={{ fontSize: 10, color: "#475569" }}>{"×"}</span><span style={badge("#475569")}>{ot ? ot.name : ""}</span></div><p style={{ margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>{z.insight}</p></div>); })}</div>}
                  {scans[t.id] && <div style={{ ...aiPanel, marginTop: 12 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 11, color: "#0ea5e9", fontFamily: font, fontWeight: 600 }}>{"◈ AI SCAN"}</span><span style={{ fontSize: 10, color: "#475569" }}>{new Date(scans[t.id].ts).toLocaleString()}</span></div><div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{scans[t.id].result}</div></div>}
                </div>
              );
            })}
            {result && !loading && <div style={{ ...aiPanel, animation: "fadeIn 0.5s" }}><span style={{ fontSize: 11, color: "#00e676", fontFamily: font, fontWeight: 600 }}>{"◈ AI ANALYSIS"}</span><div style={{ marginTop: 12, fontSize: 13, color: "#cbd5e1", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{result}</div></div>}
          </div>
        )}

        {/* POSITIONS */}
        {tab === "positions" && (
          <div style={{ animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Positions & Watchlist</h2>
              <button style={btn()} onClick={async () => { setLoading(true); setResult(""); try { var r = await callAI("Analyze positions for gaps, concentration, correlation. Suggest specific tickers to add or remove.", "Positions:\n" + POSITIONS.map(p => p.dir + " " + p.ticker + " Conv:" + p.conv).join("\n") + "\nCrash Watchlist: " + CRASH_WATCHLIST.map(w => w.ticker).join(", ") + "\nTrends: " + trends.map(t => t.name).join(", ") + "\n\n1. Zero coverage gaps?\n2. Concentration risks?\n3. Tickers to add?\n4. Tickers to remove?\n5. Allocation %?"); setResult(r); } catch(e) { setResult("Error: " + e.message); } finally { setLoading(false); } }}>{"⚡ Analyze Gaps"}</button>
            </div>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>
              {POSITIONS.filter(p => p.dir === "LONG").length} longs · {POSITIONS.filter(p => p.dir === "SHORT").length} shorts · {POSITIONS.filter(p => p.dir === "HEDGE").length} hedges · {CRASH_WATCHLIST.length} on crash watchlist
            </p>

            {/* === POSITION TIERS (expandable) === */}
            {[1, 2, 3, 4].map(tier => {
              var items = POSITIONS.filter(p => p.tier === tier);
              if (!items.length) return null;
              var info = TIER_INFO[tier];
              var key = "t" + tier;
              var isOpen = expanded[key];
              return (
                <div key={tier} style={{ marginBottom: 12 }}>
                  <div onClick={() => setExpanded(p => ({ ...p, [key]: !p[key] }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid #1e293b" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ color: info.color, fontSize: 14 }}>{isOpen ? "▾" : "▸"}</span>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: info.color }}>{info.label}</h3>
                      <span style={badge("#475569")}>{items.length}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#64748b" }}>{info.sub}</span>
                  </div>
                  {isOpen && (
                    <div style={{ marginTop: 8, ...(tier === 1 ? { display: "flex", flexDirection: "column", gap: 8 } : { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }) }}>
                      {items.map((p, i) => {
                        var dc = p.dir === "LONG" ? "#00e676" : p.dir === "SHORT" ? "#ff1744" : "#c084fc";
                        return (
                          <div key={i} style={{ ...card, borderLeft: "3px solid " + dc, padding: 14, marginBottom: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: font, color: dc }}>{p.ticker}</span>
                                <span style={badge(dc)}>{p.dir}</span>
                                <span style={{ fontSize: 11, color: "#475569" }}>{p.type}{p.fee !== "-" ? " · " + p.fee : ""}</span>
                              </div>
                              <span style={{ fontSize: 18, fontWeight: 700, color: dc, fontFamily: font }}>{p.conv}</span>
                            </div>
                            <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600 }}>{p.name}</p>
                            <p style={{ margin: "0 0 6px", fontSize: 12, color: "#94a3b8", lineHeight: 1.4 }}>{p.why}</p>
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11 }}>
                              <span><span style={{ color: "#64748b" }}>When: </span><span style={{ color: "#00e5ff" }}>{p.when}</span></span>
                              <span><span style={{ color: "#64748b" }}>Corr: </span><span style={{ color: p.corr === "Anti-correlated" ? "#00e676" : p.corr === "Uncorrelated" ? "#c084fc" : "#ffea00" }}>{p.corr}</span></span>
                            </div>
                            {p.status && <div style={{ marginTop: 4, padding: "3px 8px", borderRadius: 4, background: p.status.startsWith("\u2705") ? "rgba(0,230,118,0.08)" : p.status.startsWith("\uD83D\uDFE1") ? "rgba(255,234,0,0.08)" : "rgba(255,255,255,0.03)", fontSize: 11, color: p.status.startsWith("\u2705") ? "#00e676" : p.status.startsWith("\uD83D\uDFE1") ? "#ffea00" : "#94a3b8" }}>{p.status}</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* === CRASH WATCHLIST (expandable) === */}
            <div style={{ marginBottom: 12, marginTop: 20 }}>
              <div onClick={() => setExpanded(p => ({ ...p, crash: !p.crash }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "10px 14px", background: "rgba(224,64,251,0.04)", borderRadius: 8, border: "1px solid #4a1d8e" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#e040fb", fontSize: 14 }}>{expanded.crash ? "▾" : "▸"}</span>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#e040fb" }}>{"🔻 Crash Watchlist — Buy the Survivors"}</h3>
                  <span style={badge("#e040fb")}>{CRASH_WATCHLIST.length}</span>
                </div>
                <span style={{ fontSize: 11, color: "#64748b" }}>Quality companies to accumulate 40-60% off highs</span>
              </div>
              {expanded.crash && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 10px", lineHeight: 1.5 }}>
                    {"Dotcom lesson: Amazon $107→$7→$3,500. The crash kills junk but drags quality hardware/infra companies down too. That's when you buy the survivors. Hardware > Software. Physical assets > Digital promises."}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {CRASH_WATCHLIST.map((w, i) => {
                      var isSpec = w.quality.startsWith("SPEC");
                      return (
                      <div key={i} style={{ ...card, borderLeft: "3px solid " + (isSpec ? "#ff9100" : "#e040fb"), padding: 12, marginBottom: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: font, color: isSpec ? "#ff9100" : "#e040fb" }}>{w.ticker}</span>
                            <span style={badge(isSpec ? "#ff9100" : "#e040fb")}>{w.sector}</span>
                          </div>
                          <span style={{ fontSize: 11, color: "#475569", fontFamily: font }}>{w.maxPos}</span>
                        </div>
                        <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600 }}>{w.name}</p>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6, fontSize: 11 }}>
                          <span style={{ padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)" }}>
                            <span style={{ color: "#64748b" }}>Now: </span><span style={{ color: "#e0e4ec", fontWeight: 600 }}>{w.now}</span>
                          </span>
                          <span style={{ padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)" }}>
                            <span style={{ color: "#64748b" }}>High: </span><span style={{ color: "#94a3b8" }}>{w.high}</span>
                          </span>
                          <span style={{ padding: "2px 6px", borderRadius: 4, background: w.offHigh.startsWith("-") && parseInt(w.offHigh) < -30 ? "rgba(0,230,118,0.1)" : "rgba(255,234,0,0.08)" }}>
                            <span style={{ color: "#64748b" }}>Off high: </span><span style={{ color: parseInt(w.offHigh) < -30 ? "#00e676" : "#ffea00", fontWeight: 600 }}>{w.offHigh}</span>
                          </span>
                        </div>
                        <div style={{ padding: "4px 8px", background: "rgba(224,64,251,0.06)", borderRadius: 4, marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: "#64748b" }}>Buy zone: </span><span style={{ fontSize: 11, color: "#e040fb", fontWeight: 600 }}>{w.buyPrice}</span>
                        </div>
                        <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8", lineHeight: 1.4 }}>{w.quality}</p>
                      </div>);
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* === CATALYSTS (expandable) === */}
            <div style={{ marginBottom: 12 }}>
              <div onClick={() => setExpanded(p => ({ ...p, catalysts: !p.catalysts }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid #1e293b" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#ff9100", fontSize: 14 }}>{expanded.catalysts ? "▾" : "▸"}</span>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#ff9100" }}>{"⚡ Deployment Catalysts"}</h3>
                  <span style={badge("#ff9100")}>{CATALYSTS.length}</span>
                </div>
                <span style={{ fontSize: 11, color: "#64748b" }}>Events that trigger wave transitions</span>
              </div>
              {expanded.catalysts && (
                <div style={{ marginTop: 8 }}>{CATALYSTS.map((c, i) => (
                  <div key={i} style={{ ...card, padding: "10px 14px", display: "flex", gap: 12, marginBottom: 6 }}>
                    <span style={{ ...badge("#ff9100"), minWidth: 65, textAlign: "center", fontSize: 10 }}>{c.date}</span>
                    <div><span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span><span style={{ fontSize: 12, color: "#94a3b8" }}>{" — " + c.impact}</span></div>
                  </div>
                ))}</div>
              )}
            </div>

            {/* === CORE TRADE (expandable) === */}
            <div style={{ marginBottom: 12 }}>
              <div onClick={() => setExpanded(p => ({ ...p, core: !p.core }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid #1e293b" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#00e676", fontSize: 14 }}>{expanded.core ? "▾" : "▸"}</span>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#00e676" }}>{"◈ Core Trade Structure"}</h3>
                </div>
                <span style={{ fontSize: 11, color: "#64748b" }}>Long Hard Assets vs. Short Bonds — 10-15%</span>
              </div>
              {expanded.core && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>{TRADE_LEGS.map((l, i) => {
                  var lc = l.side === "LONG" ? "#00e676" : "#ff1744";
                  return (<div key={i} style={{ padding: "10px 12px", borderRadius: 6, background: l.side === "LONG" ? "rgba(0,230,118,0.05)" : "rgba(255,23,68,0.05)", borderLeft: "3px solid " + lc }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={badge(lc)}>{l.side}</span><span style={{ fontSize: 11, color: "#64748b", fontFamily: font }}>{l.alloc}</span></div>
                    <p style={{ margin: "2px 0", fontSize: 12, color: "#cbd5e1" }}>{l.inst}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "#64748b", fontStyle: "italic" }}>{l.note}</p>
                  </div>);
                })}</div>
              )}
            </div>

            {/* === FRAMEWORKS (expandable) === */}
            <div style={{ marginBottom: 12 }}>
              <div onClick={() => setExpanded(p => ({ ...p, frameworks: !p.frameworks }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid #1e293b" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#64748b", fontSize: 14 }}>{expanded.frameworks ? "▾" : "▸"}</span>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>{"📐 Key Frameworks"}</h3>
                  <span style={badge("#475569")}>{KEY_CONCEPTS.length}</span>
                </div>
              </div>
              {expanded.frameworks && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>{KEY_CONCEPTS.map((k, i) => (
                  <div key={i} style={{ ...card, padding: "10px 12px", marginBottom: 0 }}><h4 style={{ margin: "0 0 4px", fontSize: 12 }}>{k.name}</h4><p style={{ margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>{k.desc}</p></div>
                ))}</div>
              )}
            </div>

            {loading && <div style={{ ...aiPanel, textAlign: "center", padding: 40, animation: "pulse 1.5s infinite" }}><div style={spinStyle} /><p style={{ marginTop: 12, fontSize: 13, color: "#0ea5e9" }}>Analyzing...</p></div>}
            {result && !loading && <div style={{ ...aiPanel, animation: "fadeIn 0.5s" }}><span style={{ fontSize: 11, color: "#00e676", fontFamily: font, fontWeight: 600 }}>{"◈ ANALYSIS"}</span><div style={{ marginTop: 12, fontSize: 13, color: "#cbd5e1", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{result}</div></div>}
          </div>
        )}

        {/* STRATEGY LAB */}
        {tab === "lab" && (
          <div style={{ animation: "fadeIn 0.4s" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 600 }}>Strategy Lab</h2>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>AI-powered tools to evolve the framework</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div style={{ ...card, cursor: "pointer", textAlign: "center" }} onClick={async () => {
                setLoading(true); setResult("");
                try {
                  var r = await callAI("Synthesize mega-trends into positions. Specific tickers, timing, sizing.", "Trends:\n" + trends.map(t => t.name + " [" + STAGES[t.stage] + "] " + t.confidence + "%\nThesis: " + t.thesis + "\nInvestments: " + (t.investmentMap || "N/A")).join("\n\n") + "\n\n1. Top 5 asymmetric plays (tickers)\n2. Asset class positioning\n3. Physical vs equity\n4. Hedges per scenario\n5. Timing\n6. Risks");
                  setResult(r);
                } catch(e) { setResult("Error: " + e.message); } finally { setLoading(false); }
              }}><div style={{ fontSize: 28, marginBottom: 8 }}>{"📊"}</div><h3 style={{ margin: "0 0 6px", fontSize: 15 }}>Full Synthesis</h3><p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>All trends into positions and timing</p></div>

              <div style={{ ...card, cursor: "pointer", textAlign: "center" }} onClick={async () => {
                setLoading(true); setResult("");
                try {
                  var r = await callAI("Suggest 5 NEW mega-trends with specific tickers and mispricing scores.", "Current: " + trends.map(t => t.name).join(", "));
                  setResult(r);
                } catch(e) { setResult("Error: " + e.message); } finally { setLoading(false); }
              }}><div style={{ fontSize: 28, marginBottom: 8 }}>{"🔮"}</div><h3 style={{ margin: "0 0 6px", fontSize: 15 }}>Discover Trends</h3><p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Emerging trends not on radar</p></div>

              <div style={{ ...card, cursor: "pointer", textAlign: "center" }} onClick={async () => {
                setLoading(true); setResult("");
                try {
                  var r = await callAI("Contrarian analyst. Challenge aggressively. Be specific.", trends.map(t => t.name + " [" + STAGES[t.stage] + "] " + t.confidence + "%\nThesis: " + t.thesis + "\nBear: " + (t.bearCase || "N/A")).join("\n\n") + "\n\n1. Which WRONG?\n2. Missing?\n3. Contradictions?\n4. Biggest risk?\n5. Bet AGAINST which?");
                  setResult(r);
                } catch(e) { setResult("Error: " + e.message); } finally { setLoading(false); }
              }}><div style={{ fontSize: 28, marginBottom: 8 }}>{"🎯"}</div><h3 style={{ margin: "0 0 6px", fontSize: 15 }}>Challenge Framework</h3><p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Find flaws and blind spots</p></div>
            </div>
            {loading && <div style={{ ...aiPanel, textAlign: "center", padding: 40, animation: "pulse 1.5s infinite" }}><div style={spinStyle} /><p style={{ marginTop: 12, fontSize: 13, color: "#0ea5e9" }}>Analyzing...</p></div>}
            {result && !loading && <div style={{ ...aiPanel, animation: "fadeIn 0.5s" }}><span style={{ fontSize: 11, color: "#00e676", fontFamily: font, fontWeight: 600 }}>{"◈ ANALYSIS"}</span><div style={{ marginTop: 12, fontSize: 13, color: "#cbd5e1", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{result}</div></div>}
          </div>
        )}

      </div>
    </div>
  );
}
