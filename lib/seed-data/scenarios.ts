import type { Scenario } from "../types";

export const SCENARIOS: Scenario[] = [
  { name: "The Managed Grind", prob: 50, type: "base", desc: "Financial repression works. Inflation 3-4%, yields capped. Slow debasement. AI shifts to utility.", portfolio: "Long: WGLD, SPUT, ROBO, infra funds, inflation-linked bonds. Gold overweight expresses short-bonds view." },
  { name: "The Great Repricing", prob: 30, type: "bear", desc: "Failed sovereign auction or AI ROI collapse triggers liquidity crisis.", portfolio: "Long: WSLV, WGLD, physical commodities. Overweight anti-correlated assets, reduce equity beta." },
  { name: "The Productivity Renaissance", prob: 20, type: "bull", desc: "AI scaling laws hold. SynBio industrial scale. Productivity surge offsets all.", portfolio: "Long: NVDA, MSFT, GOOG, CCJ/WNUC, IXJ. Short: PFE, MRK, XOP." },
];
