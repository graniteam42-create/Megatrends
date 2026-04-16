import type { Position } from "../../types";
import { TIER_1 } from "./tier1";
import { TIER_2 } from "./tier2";
import { TIER_3 } from "./tier3";
import { TIER_4 } from "./tier4";

export const POSITIONS: Position[] = [...TIER_1, ...TIER_2, ...TIER_3, ...TIER_4];
