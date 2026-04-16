import type { Trend } from "../../types";
import { TECH_TRENDS } from "./tech";
import { MACRO_TRENDS } from "./macro";
import { ENERGY_TRENDS } from "./energy";
import { GEOPOLITICS_TRENDS } from "./geopolitics";
import { DEMOGRAPHIC_TRENDS } from "./demographics";
import { RESOURCE_TRENDS } from "./resources";

// Canonical order: AI, Debasement, Energy, Geopolitics, Demographics, Verification,
// Commodities, SynBio, Bridge States, Carbon, Water, Food, Overcapacity, Housing, Labor.
const ORDER = [
  "t1", "t2", "t3", "t4", "t5",
  "t6", "t7", "t8", "t9", "t10",
  "t11", "t12", "t13", "t14", "t15",
];

const all: Trend[] = [
  ...TECH_TRENDS,
  ...MACRO_TRENDS,
  ...ENERGY_TRENDS,
  ...GEOPOLITICS_TRENDS,
  ...DEMOGRAPHIC_TRENDS,
  ...RESOURCE_TRENDS,
];

export const SEED_TRENDS: Trend[] = ORDER
  .map((id) => all.find((t) => t.id === id))
  .filter((t): t is Trend => Boolean(t));
