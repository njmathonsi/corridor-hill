/** Strip characters that are dangerous in SQL / HTML contexts (POPIA-safe input layer) */
export function sanitize(str: string | null | undefined): string {
  if (!str) return "";
  return str.replace(/<|>|"|'|;|--|\*\//g, "").trim();
}

/** POPIA: mask middle digits of SA ID number */
export function maskSAID(id: string): string {
  if (!id || id.length < 6) return id;
  const show = 4;
  const tail = 3;
  const mid = id.length - show - tail;
  return id.slice(0, show) + "•".repeat(Math.max(0, mid)) + id.slice(-tail);
}

/** Generate 20 deterministic unit codes for a given block */
export function genUnits(block: string): string[] {
  const floors = [1, 2, 3, 4, 5];
  const unitsPerFloor = [1, 2, 3, 4, 5, 6];
  const list: string[] = [];
  floors.forEach((f) =>
    unitsPerFloor.forEach((u) => list.push(`${f}0${u}`))
  );
  return list.slice(0, 20);
}

/** Seeded occupancy state — deterministic, no DB query required */
export function getRoomState(
  block: string,
  unit: string,
  room: string
): "occupied" | "avail" {
  const seed =
    (block.charCodeAt(0) * 997 +
      parseInt(unit) * 31 +
      room.charCodeAt(0)) %
    10;
  return seed < 3 ? "occupied" : "avail";
}

export const BLOCKS = ["A", "B", "C", "D", "E", "F"] as const;
export type Block = (typeof BLOCKS)[number];

/** Canonical item keys for the 9-item inspection checklist (includes both beds) */
export const INSPECTION_ITEMS: Record<string, string> = {
  walls: "Walls",
  ceiling: "Ceiling",
  "bed-window": "Bed (Near Window)",
  "bed-door": "Bed (Near Door)",
  desk: "Desk & Chair",
  wardrobe: "Wardrobe",
  "door-handle": "Door Handles",
  "door-frame": "Door Frame",
  floor: "Flooring",
};

export type ConditionValue = "Good" | "Damaged";

export interface ConditionMap {
  [key: string]: ConditionValue | undefined;
}

/** Compute Room Asset Integrity Score (0–100) */
export function computeScore(conditions: ConditionMap): number {
  const keys = Object.keys(INSPECTION_ITEMS);
  const good = keys.filter((k) => conditions[k] === "Good").length;
  return Math.round((good / keys.length) * 100) || 0;
}
