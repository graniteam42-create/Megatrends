// Lightweight runtime validation helpers for data crossing trust boundaries
// (AI responses, API request bodies). Avoids a runtime dep on zod while still
// giving type-safe extraction.

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export function asNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function asArray<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/** Extract the first {...} block from a string (strips markdown fences, preambles). */
export function extractJsonObject(raw: string): string | null {
  const match = raw.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

/** Safe JSON.parse → unknown. Returns null on error. */
export function safeParse<T = unknown>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export interface AllocationItem {
  name: string;
  pct: number;
  color?: string;
}

export interface ParsedAllocation {
  allocations: AllocationItem[];
  reasoning: string;
}

export function validateAllocation(raw: unknown): ParsedAllocation | null {
  if (!isRecord(raw)) return null;
  const allocations: AllocationItem[] = [];
  for (const a of asArray(raw.allocations)) {
    if (!isRecord(a)) continue;
    const name = asString(a.name);
    const pct = asNumber(a.pct);
    if (!name || pct <= 0) continue;
    const color = typeof a.color === "string" && a.color ? a.color : undefined;
    allocations.push(color ? { name, pct, color } : { name, pct });
  }

  if (!allocations.length) return null;
  return { allocations, reasoning: asString(raw.reasoning) };
}

export interface ReviewUpdate {
  id: string;
  name: string;
  field: string;
  oldValue: string | number;
  newValue: string | number;
  reason: string;
}

export interface ParsedReview {
  updates: ReviewUpdate[];
  summary: string;
}

export function validateReview(raw: unknown): ParsedReview | null {
  if (!isRecord(raw)) return null;
  const updates = asArray(raw.updates)
    .map((u) => {
      if (!isRecord(u)) return null;
      const id = asString(u.id);
      const field = asString(u.field);
      if (!id || !field) return null;
      const oldValue = (typeof u.oldValue === "number" || typeof u.oldValue === "string") ? u.oldValue : "";
      const newValue = (typeof u.newValue === "number" || typeof u.newValue === "string") ? u.newValue : "";
      return {
        id,
        name: asString(u.name),
        field,
        oldValue,
        newValue,
        reason: asString(u.reason),
      };
    })
    .filter((u): u is ReviewUpdate => u !== null);

  return { updates, summary: asString(raw.summary) };
}
