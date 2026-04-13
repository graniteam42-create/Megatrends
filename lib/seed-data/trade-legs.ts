import type { TradeLeg, KeyConcept } from "../types";

export const TRADE_LEGS: TradeLeg[] = [
  { side: "LONG", inst: "Physical Gold - WGLD (0.12%), GBSE (EUR hedged), IAU (US)", alloc: "40%", note: "WGLD strictly better than VZLD (0.39%). Identical gold at HSBC." },
  { side: "LONG", inst: "Physical Uranium - SPUT (HANetf, EU-listed)", alloc: "20%", note: "Sprott buys yellowcake at premium. Anti-correlated." },
  { side: "LONG", inst: "Physical Copper - OD7C (WisdomTree, EU-listed)", alloc: "15%", note: "Every electrification trend needs copper. No mines until 2028+." },
  { side: "LONG", inst: "Gold/Silver Miners - GDX, GDXJ, Franklin Gold, AuAg Silver Bullet", alloc: "25%", note: "Leverage to metal. Buy during corrections for discount." },
  { side: "SHORT", inst: "Long-duration bonds - 3TYS (3x short 10Y, EU), Inverse Bund", alloc: "Overlay", note: "EU PRIIPs blocks US TBT. Gold overweight partially expresses this." },
];

export const KEY_CONCEPTS: KeyConcept[] = [
  { name: "Physical vs. Miners", desc: "Physical ETCs track materials, DON'T correlate with equities. Miners carry equity beta. Buy physical now, miners in crashes." },
  { name: "Sprott Reflexive Loop", desc: "SPUT: Sprott issues units at premium and buys yellowcake. Your purchase tightens supply. Unique mechanism." },
  { name: "Correlation-Aware Timing", desc: "Expect turmoil? Physical commodities now (anti-correlated), miners later (will get cheaper with stocks)." },
  { name: "Roll Yield Tax", desc: "Futures-based ETCs (agriculture) suffer 3-5% hidden annual cost. Physical-backed (gold, uranium) don't." },
  { name: "Fee Discipline", desc: "WGLD 0.12% vs VZLD 0.39% for identical gold. Always compare TER. SPUT 0.85% pays for supply tightening." },
  { name: "Dotcom Survivor Strategy", desc: "When AI trough of disillusionment hits, quality hardware/infra companies crash alongside junk. That's when you buy the survivors." },
];
