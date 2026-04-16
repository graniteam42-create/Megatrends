import type { Trend } from "../../types";

// t11 Water Scarcity, t12 Food Security & Fertilizer.

export const RESOURCE_TRENDS: Trend[] = [
  {
    id: "t11",
    name: "Water Scarcity & Infrastructure",
    stage: 1,
    horizon: "3-7 years",
    confidence: 85,
    description: "Water is the binding constraint on AI data centers (cooling), semiconductor fabs (~150M gal/day at TSMC), agriculture, and climate migration. US infrastructure past design life; EU hit by repeated droughts. Utility-like cashflows with real-asset + climate + AI tailwinds.",
    subTrends: ["Data center cooling", "Semi fab water", "Desalination", "Pipe replacement", "Water rights monetization"],
    signals: [],
    thesis: "Water equipment (Xylem, Watts) and utilities (American Water, Veolia) compound at utility multiples while absorbing AI/climate capex. Anti-cyclical, low equity beta.",
    bearCase: "Desalination + recycling tech compress margins; regulated utilities capped on returns. Data centers move to dry cooling.",
    investmentMap: "Long: XYL (Xylem), AWK (American Water), VIE.PA (Veolia), PHO (Invesco Water ETF), IQQQ (iShares Water UCITS EU). Individual: WTS (Watts), ECL (Ecolab).",
    mispricingScore: 72,
    benchmarkTicker: "IQQQ",
    invalidationMetric: {
      name: "US Drought Monitor D3+ coverage (trailing 24M avg)",
      threshold: "< 5% sustained 2 years",
      direction: "below",
      source: "NOAA / US Drought Monitor",
    },
  },
  {
    id: "t12",
    name: "Food Security & Fertilizer",
    stage: 1,
    horizon: "2-5 years",
    confidence: 78,
    description: "Climate × fragmentation × Russia/Belarus potash sanctions × topsoil loss. Food weaponization (grain corridors, export bans) ratchets up. Fertilizer oligopoly (Nutrien, Mosaic, ICL) captures pricing. Ag-equipment (Deere) and precision-ag benefit from labor scarcity + yield pressure.",
    subTrends: ["Potash/phosphate supply", "Export bans", "Precision agriculture", "GLP-1 demand shift"],
    signals: [],
    thesis: "Deep-value fertilizer miners (5-6x earnings) + ag-equipment compounders. Optionality on supply shocks.",
    bearCase: "GLP-1 obesity drugs cut global calorie demand; yield tech (AI, gene-edit) breaks the supply constraint faster than demand rises.",
    investmentMap: "Long: NTR (Nutrien), MOS (Mosaic), MOO ETF (VanEck agribusiness), DE (Deere), AGCO, ICL. EU: K+S (SDF.DE), Yara (YAR.OL). Avoid: protein producers with feed-cost exposure (TSN).",
    mispricingScore: 75,
    benchmarkTicker: "MOO",
    invalidationMetric: {
      name: "FAO Food Price Index (trailing 12M)",
      threshold: "< 110 for 2 consecutive quarters",
      direction: "below",
      source: "FAO",
    },
  },
];
