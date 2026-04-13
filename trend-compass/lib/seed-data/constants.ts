export const STAGES = ["Nascent", "Emerging", "Accelerating", "Consensus", "Overcrowded"];
export const STAGE_COLORS = ["#00e5ff", "#00e676", "#ffea00", "#ff9100", "#ff1744"];
export const HORIZONS = ["6-18 months", "2-5 years", "5-15 years"];

export const TIER_INFO: Record<number, { label: string; sub: string; color: string }> = {
  1: { label: "Deploy Now - Physical Commodities", sub: "Anti-correlated to equities. No timing needed.", color: "#00e676" },
  2: { label: "Deploy on Correction - Miners & Sectors", sub: "Equity beta. Buy when VIX > 30 or -15% correction.", color: "#00e5ff" },
  3: { label: "Individual Picks - High Conviction", sub: "Concentrated bets. Research individually.", color: "#ffea00" },
  4: { label: "Long Horizon & Hedges", sub: "Small positions. Patient capital.", color: "#c084fc" },
};
