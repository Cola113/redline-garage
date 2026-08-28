// Physics sanity check: different builds must produce different, correctly-ordered results
import { calculateSpecs, simulateRace } from "../lib/garage/physics";
import { PARTS_CATALOG } from "../lib/garage/catalog";
import type { CarConfig } from "../lib/garage/types";

const ids = (cat: keyof typeof PARTS_CATALOG, i: number) =>
  PARTS_CATALOG[cat][i]?.id ?? PARTS_CATALOG[cat][0].id;

// Build A: first option of every category (likely entry-level)
const carA: CarConfig = {
  chassisId: ids("chassis", 0),
  engineId: ids("engine", 0),
  transmissionId: ids("transmission", 0),
  tiresId: ids("tires", 0),
  nosId: ids("nos", 0),
  aeroId: ids("aero", 0),
  exhaustId: ids("exhaust", 0),
  paintId: PARTS_CATALOG.paint?.[0]?.id ?? "stock",
  tuning: {},
} as unknown as CarConfig;

// Build B: LAST option of every category (likely top-tier)
const carB: CarConfig = {
  chassisId: ids("chassis", PARTS_CATALOG.chassis.length - 1),
  engineId: ids("engine", PARTS_CATALOG.engine.length - 1),
  transmissionId: ids("transmission", PARTS_CATALOG.transmission.length - 1),
  tiresId: ids("tires", PARTS_CATALOG.tires.length - 1),
  nosId: ids("nos", PARTS_CATALOG.nos.length - 1),
  aeroId: ids("aero", PARTS_CATALOG.aero.length - 1),
  exhaustId: ids("exhaust", PARTS_CATALOG.exhaust.length - 1),
  paintId: PARTS_CATALOG.paint?.[0]?.id ?? "stock",
  tuning: {},
} as unknown as CarConfig;

const specA = calculateSpecs(carA);
const specB = calculateSpecs(carB);
console.log("=== A(entry) specs ===");
console.log(JSON.stringify(specA, null, 1).slice(0, 500));
console.log("=== B(top) specs ===");
console.log(JSON.stringify(specB, null, 1).slice(0, 500));

// Try common simulateRace signatures
let raceA: unknown, raceB: unknown;
try {
  raceA = simulateRace(carA);
  raceB = simulateRace(carB);
  console.log("=== A race ===");
  console.log(JSON.stringify(raceA).slice(0, 600));
  console.log("=== B race ===");
  console.log(JSON.stringify(raceB).slice(0, 600));
} catch (e) {
  console.log("simulateRace error:", String(e).slice(0, 300));
}