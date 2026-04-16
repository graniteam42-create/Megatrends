import type { TradeLeg, KeyConcept } from "../types";

export const TRADE_LEGS: TradeLeg[] = [
  { side: "LONG", inst: "Physical Gold - WGLD (0.12%), GBSE (EUR hedged), IAU (US)", alloc: "30%", note: "WGLD strictly better than VZLD (0.39%). Identical gold at HSBC." },
  { side: "LONG", inst: "TIPS - ITPS (iShares $ TIPS UCITS, GBP hedged)", alloc: "10%", note: "Real yields + CPI accretion. Zero equity beta — safer than gold miners for expressing debasement thesis." },
  { side: "LONG", inst: "Physical Uranium - SPUT (HANetf, EU-listed)", alloc: "15%", note: "Sprott buys yellowcake at premium. Anti-correlated." },
  { side: "LONG", inst: "Physical Copper - OD7C (WisdomTree, EU-listed)", alloc: "10%", note: "Every electrification trend needs copper. No mines until 2028+." },
  { side: "LONG", inst: "Gold/Silver Miners - GDX, GDXJ, Franklin Gold, AuAg Silver Bullet", alloc: "15%", note: "Leverage to metal. Buy during corrections for discount." },
  { side: "LONG", inst: "EU Defense - EUDF (VanEck UCITS), RHM.DE, BA.L", alloc: "10%", note: "NATO 2→3.5→5% of GDP. 20-year backlog, structural re-rating underway." },
  { side: "LONG", inst: "Water Infrastructure - IQQQ (iShares Global Water UCITS), XYL", alloc: "5%", note: "Utility-like compounders + AI data-center cooling + climate capex." },
  { side: "SHORT", inst: "US Long Bonds - 3TYS (Leverage Shares inverse UST) or Avanza bear certs", alloc: "5%", note: "Explicit duration short. Complements gold's implicit short-bonds view." },
];

export const KEY_CONCEPTS: KeyConcept[] = [
  { name: "Physical vs. Miners", desc: "Physical ETCs track materials, DON'T correlate with equities. Miners carry equity beta. Buy physical now, miners in crashes." },
  { name: "Sprott Reflexive Loop", desc: "SPUT: Sprott issues units at premium and buys yellowcake. Your purchase tightens supply. Unique mechanism." },
  { name: "Correlation-Aware Timing", desc: "Expect turmoil? Physical commodities now (anti-correlated), miners later (will get cheaper with stocks)." },
  { name: "Roll Yield Tax", desc: "Futures-based ETCs (agriculture) suffer 3-5% hidden annual cost. Physical-backed (gold, uranium) don't." },
  { name: "Fee Discipline", desc: "WGLD 0.12% vs VZLD 0.39% for identical gold. Always compare TER. SPUT 0.85% pays for supply tightening." },
  { name: "Dotcom Survivor Strategy", desc: "When AI trough of disillusionment hits, quality hardware/infra companies crash alongside junk. That's when you buy the survivors." },
  { name: "Invalidation Discipline", desc: "Every trend has an invalidationMetric — a single measurable threshold that would force exit. 'I still believe it' is not a reason to stay in a trade. Review weekly against FRED/EODHD data, not narrative." },
  { name: "TIPS > Miners for Debasement", desc: "If the thesis is real yields stay negative, TIPS pay you exactly that — without mine-operating risk, without equity beta. Miners are leveraged gold; TIPS are defined-benefit inflation hedge." },
  { name: "Tail-Hedge When Vol Is Cheap", desc: "VIX<15 is the time to buy insurance, not when VIX>30 (too late, too expensive). TAIL/put spreads bleed ~2% annually in calm regimes but pay multiples in crashes." },
  { name: "Liquidity Tiering", desc: "In crisis, SPUT/OD7C may trade at 10-15% NAV discounts. WGLD/GDX stay liquid. Know which positions you can actually exit before you need to." },
  { name: "EU Investor Access", desc: "PRIIPs blocks US inverse ETFs + many US ETFs. Use EU UCITS (ITPS, IQQQ, EUDF) or bear certificates via Avanza Markets for directional plays. Always check KID availability before sizing." },
  { name: "Scenario Weighting", desc: "Base 40% (Grind), Stagflation 25%, Bear 20% (Repricing), Bull 15% (Productivity). Portfolio must survive ALL four paths, not just the base case." },
];
