import type { Trend } from "../../types";

// t5 Demographic Inversion, t15 Labor Renaissance (the bear mirror for t5).

export const DEMOGRAPHIC_TRENDS: Trend[] = [
  {
    id: "t5",
    name: "Demographic Inversion",
    stage: 2,
    horizon: "3-8 years",
    confidence: 90,
    description: "Population decline in China, Korea, Japan, Germany. Labor shortages forcing automation.",
    subTrends: ["Automation as labor substitute", "Healthcare explosion", "Pension erosion", "Humanoid robotics"],
    signals: [],
    thesis: "Demographics force AI/automation adoption. Long automation, long healthcare.",
    bearCase: "Productivity renaissance OFFSETS demographic drag (see t15 Labor Renaissance).",
    investmentMap: "Long: Wellington HC fund, IXJ, UNH, LLY, ISRG, ROBO ETF, Fanuc (6954.T), ROK, ABB. Humanoid robotics: TSLA (Optimus), Figure (private).",
    mispricingScore: 70,
    benchmarkTicker: "IXJ",
    invalidationMetric: {
      name: "Japan / Korea / Germany TFR (total fertility rate)",
      threshold: "combined average > 1.6 sustained 3 years",
      direction: "above",
      source: "World Bank, national statistics",
    },
  },
  {
    id: "t15",
    name: "Labor Renaissance & Wage-Price Spiral",
    stage: 1,
    horizon: "2-5 years",
    confidence: 60,
    description: "The counter-thesis to t5: post-COVID labor bargaining power + unionization (UAW, Teamsters, EU rail) + on-shoring labor demand drives persistent 4-5% wage growth. Wage-price feedback loop, sticky services inflation. Bear case for AI productivity gains absorbing the shock.",
    subTrends: ["Union resurgence", "Services wage stickiness", "Reshored blue-collar demand", "Minimum wage ladders"],
    signals: [],
    thesis: "Short long-duration equities (growth multiples contract), long energy + commodities + TIPS, long domestic industrials with labor pricing power.",
    bearCase: "AI automation breaks the wage-price loop faster than expected; productivity catches up before inflation entrenches.",
    investmentMap: "Long: ITPS (TIPS), XOM/CVX (energy majors), CAT, DE (domestic industrials). Short: long-duration growth via bear certificates on Nasdaq. Avoid: low-margin labor-intensive services (retail, hospitality REITs).",
    mispricingScore: 65,
    benchmarkTicker: "ITPS",
    invalidationMetric: {
      name: "US Atlanta Fed Wage Growth Tracker (trailing 12M)",
      threshold: "< 3.5% for 2 quarters",
      direction: "below",
      source: "Atlanta Fed",
    },
  },
];
