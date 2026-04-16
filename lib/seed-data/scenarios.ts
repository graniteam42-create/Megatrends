import type { Scenario } from "../types";

export const SCENARIOS: Scenario[] = [
  {
    name: "The Managed Grind",
    prob: 40,
    type: "base",
    desc: "Financial repression works. Inflation 3-4%, yields capped. Slow debasement. AI shifts to utility.",
    portfolio: "Long: WGLD, SPUT, ROBO, infra funds, ITPS (TIPS). Gold overweight expresses short-bonds view.",
  },
  {
    name: "The Stagflation",
    prob: 25,
    type: "stagflation",
    desc: "5%+ sticky inflation meets negative real growth. Wage-price spiral from t15 Labor + t12 Food + energy shock. 1970s playbook: real assets, TIPS, short-duration, short-growth-multiples.",
    portfolio: "Long: ITPS (TIPS), XOM/CVX, WGLD, WSLV, MOO (agribusiness), NTR. Short: long-duration growth via bear certificates. Avoid: high-multiple tech, rate-sensitive REITs.",
  },
  {
    name: "The Great Repricing",
    prob: 20,
    type: "bear",
    desc: "Failed sovereign auction or AI ROI collapse triggers liquidity crisis.",
    portfolio: "Long: WSLV, WGLD, physical commodities, TAIL (vol). Overweight anti-correlated assets, reduce equity beta. Crash watchlist active.",
  },
  {
    name: "The Productivity Renaissance",
    prob: 15,
    type: "bull",
    desc: "AI scaling laws hold. SynBio industrial scale. Productivity surge offsets all.",
    portfolio: "Long: NVDA, MSFT, GOOG, CCJ/WNUC, IXJ, XYL. Short: PFE, MRK, XOP.",
  },
];
