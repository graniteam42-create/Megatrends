import type { Trend } from "../../types";

// t3 Climate & Energy Transition, t10 Carbon as Feedstock.

export const ENERGY_TRENDS: Trend[] = [
  {
    id: "t3",
    name: "Climate Acceleration & Energy Transition",
    stage: 2,
    horizon: "5-10 years",
    confidence: 80,
    description: "Climate change accelerating, forcing emergency energy transition and massive infrastructure spend.",
    subTrends: ["Nuclear renaissance", "Grid modernization", "Climate migration", "Copper supercycle"],
    signals: [],
    thesis: "Market prices orderly transition; reality is chaotic. Nuclear and copper mispriced.",
    bearCase: "Solar + battery cost crash makes micro-grids bypass centralized overhauls.",
    investmentMap: "Long: SPUT (physical uranium), WNUC (miners), CCJ, NXE, OD7C (copper), GEV, BWXT, PWR, ETN. Short: Coastal REITs.",
    mispricingScore: 65,
    benchmarkTicker: "SPUT",
    invalidationMetric: {
      name: "Uranium spot price (U3O8)",
      threshold: "< $60/lb for 6 months",
      direction: "below",
      source: "UxC, Cameco reports",
    },
  },
  {
    id: "t10",
    name: "Carbon as Feedstock",
    stage: 0,
    horizon: "8-15 years",
    confidence: 55,
    description: "Cheap energy makes CO2 capture economical, turning carbon into manufacturing input.",
    subTrends: ["Direct air capture", "Synthetic hydrocarbons", "Carbon materials"],
    signals: [],
    thesis: "Breaks climate doom loop. When capture below $100/ton, economics flip.",
    bearCase: "Energy costs never drop enough.",
    investmentMap: "Long (speculative): OXY (1PointFive DAC), PLUG, NEL.OL, ITM.L, WCO2 (carbon ETC). Monitor only.",
    mispricingScore: 85,
    benchmarkTicker: "OXY",
    invalidationMetric: {
      name: "Levelized cost of DAC (best-in-class)",
      threshold: "< $100/tonne CO2",
      direction: "below",
      source: "DOE, company reports",
    },
  },
];
