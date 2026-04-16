export interface Trend {
  id: string;
  name: string;
  stage: number;
  horizon: string;
  confidence: number;
  description: string;
  subTrends: string[];
  signals: string[];
  thesis: string;
  bearCase: string;
  investmentMap: string;
  mispricingScore: number;
  benchmarkTicker?: string;
  image?: { url: string; thumb: string; credit: string };
  // Quantitative invalidation trigger: the single measurable fact that would
  // force reconsideration of the thesis. Kept optional for backwards compat.
  invalidationMetric?: {
    name: string;
    threshold: string;
    direction: "above" | "below" | "cross";
    source?: string;
  };
}

export interface Scenario {
  name: string;
  prob: number;
  type: "base" | "bear" | "bull" | "stagflation";
  desc: string;
  portfolio: string;
}

export interface Convergence {
  trends: string[];
  name: string;
  insight: string;
}

export interface Catalyst {
  name: string;
  date: string;
  impact: string;
}

export interface Position {
  tier: number;
  dir: "LONG" | "SHORT" | "HEDGE";
  ticker: string;
  name: string;
  type: string;
  fee: string;
  trends: string[];
  conv: number;
  why: string;
  when: string;
  status: string;
  corr: string;
}

export interface TradeLeg {
  side: string;
  inst: string;
  alloc: string;
  note: string;
}

export interface KeyConcept {
  name: string;
  desc: string;
}

export interface CrashWatchItem {
  ticker: string;
  name: string;
  sector: string;
  trends: string[];
  quality: string;
  now: string;
  high: string;
  offHigh: string;
  buyZone: string;
  buyPrice: string;
  maxPos: string;
}

export interface TierInfo {
  label: string;
  sub: string;
  color: string;
}

export interface PriceData {
  close: number;
  change_p: number;
  volume?: number;
  previousClose?: number;
}
