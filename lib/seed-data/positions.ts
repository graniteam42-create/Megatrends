import type { Position } from "../types";

const TIER_1: Position[] = [
  { tier: 1, dir: "LONG", ticker: "SPUT", name: "HANetf Sprott Physical Uranium ETC", type: "Physical", fee: "1.48% all-in", trends: ["t3","t7","t1"], conv: 95,
    why: "Sprott buys physical yellowcake at premium. Tightens supply. $86/lb, structural deficit.",
    when: "Buy now", status: "GO", corr: "Anti-correlated" },
  { tier: 1, dir: "LONG", ticker: "OD7C", name: "WisdomTree Copper ETC", type: "Physical", fee: "0.49%", trends: ["t3","t4","t7","t1"], conv: 90,
    why: "At intersection of more trends than any asset. No new mines until 2028+.",
    when: "Buy now", status: "GO", corr: "Anti-correlated" },
  { tier: 1, dir: "LONG", ticker: "WGLD", name: "WisdomTree Core Physical Gold", type: "Physical", fee: "0.12%", trends: ["t2","t7"], conv: 85,
    why: "Financial repression hedge. 0.12% strictly superior to VZLD (0.39%). Corrected 20%.",
    when: "Accumulate on dips", status: "APPROACHING", corr: "Anti-correlated" },
  { tier: 1, dir: "LONG", ticker: "WSLV", name: "WisdomTree Core Physical Silver", type: "Physical", fee: "0.19%", trends: ["t2","t7","t3"], conv: 82,
    why: "Dual monetary + industrial (solar). Corrected 32%. Bigger upside in crisis.",
    when: "Accumulate", status: "APPROACHING", corr: "Anti-correlated" },
];

const TIER_2: Position[] = [
  { tier: 2, dir: "LONG", ticker: "WNUC", name: "WisdomTree Uranium & Nuclear", type: "Sector ETF", fee: "0.47%", trends: ["t3","t7","t1"], conv: 88,
    why: "Broader nuclear incl. GE Vernova, Curtiss-Wright. Lower fee, more diversified.",
    when: "On correction", status: "WAIT", corr: "Equity-correlated" },
  { tier: 2, dir: "LONG", ticker: "IXJ", name: "iShares Global Healthcare", type: "Sector ETF", fee: "0.40%", trends: ["t5","t8"], conv: 82,
    why: "Highest-confidence trend (Demographics 90%). UNH, LLY, ISRG. Most predictable demand curve.",
    when: "On correction", status: "WAIT", corr: "Low beta" },
  { tier: 2, dir: "LONG", ticker: "RARE", name: "WisdomTree Strategic Metals & Rare Earths", type: "Miners ETF", fee: "0.55%", trends: ["t3","t4","t7"], conv: 80,
    why: "Lithium, rare earths, copper miners. Green Mercantilism thesis. Down -17%.",
    when: "Below EUR 38", status: "APPROACHING", corr: "Equity-correlated" },
  { tier: 2, dir: "LONG", ticker: "GDX", name: "VanEck Gold Miners ETF", type: "Miners ETF", fee: "0.51%", trends: ["t2","t7"], conv: 78,
    why: "2-3x leverage to gold price. Buy when gold stabilizes from correction.",
    when: "Wait for gold bottom", status: "WAIT", corr: "Equity-correlated" },
  { tier: 2, dir: "LONG", ticker: "W1TB", name: "WisdomTree Cybersecurity UCITS", type: "Thematic", fee: "~0.40%", trends: ["t6","t1"], conv: 72,
    why: "Trust Crisis thesis. CRWD, PANW, FTNT. Expensive growth stocks — will crash in tech selloff before recovering.",
    when: "Tech capitulation only", status: "WAIT", corr: "Equity-correlated" },
];

const TIER_3: Position[] = [
  { tier: 3, dir: "LONG", ticker: "CCJ", name: "Cameco Corp", type: "Stock", fee: "-", trends: ["t3","t7"], conv: 85,
    why: "Largest Western uranium producer. Real revenue, real production. $2.7B Nuclear Fuel Supply Act contracts.",
    when: "Sector pullback", status: "WAIT", corr: "Equity-correlated" },
  { tier: 3, dir: "LONG", ticker: "NXE", name: "NexGen Energy", type: "Stock", fee: "-", trends: ["t3","t7"], conv: 55,
    why: "Highest-grade undeveloped uranium deposit (Rook I). Development-stage, high risk.",
    when: "Very small, speculative only", status: "WAIT", corr: "Equity-correlated" },
];

const TIER_4: Position[] = [
  { tier: 4, dir: "LONG", ticker: "IBIT", name: "iShares Bitcoin ETF / 21Shares", type: "Crypto", fee: "0.25-1.5%", trends: ["t2","t6"], conv: 55,
    why: "In theory a hard asset hedge. Currently correlates with risk assets in every selloff.",
    when: "Dollar-cost average, small", status: "APPROACHING", corr: "Risk-correlated" },
];

export const POSITIONS: Position[] = [...TIER_1, ...TIER_2, ...TIER_3, ...TIER_4];
