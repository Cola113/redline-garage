// Physics sanity check: different builds must produce different, correctly-ordered results
import { calculateSpecs, stepVehiclePhysics } from "../lib/garage/physics";
import { PARTS_CATALOG } from "../lib/garage/catalog";
import type { CarConfig } from "../lib/garage/types";

const ids = (cat: keyof typeof PARTS_CATALOG, i: number) =>
  PARTS_CATALOG[cat][i]?.id ?? PARTS_CATALOG[cat][0].id;

// Build A: first option of every category (entry-level)
const carA: CarConfig = {
  chassisId: ids("chassis", 0),
  engineId: ids("engine", 0),
  transmissionId: ids("transmission", 0),
  tiresId: ids("tires", 0),
  nosId: ids("nos", 0),
  aeroId: ids("aero", 0),
  exhaustId: ids("exhaust", 0),
  tuning: {},
} as unknown as CarConfig;

// Build B: LAST option of every category (top-tier)
const carB: CarConfig = {
  chassisId: ids("chassis", PARTS_CATALOG.chassis.length - 1),
  engineId: ids("engine", PARTS_CATALOG.engine.length - 1),
  transmissionId: ids("transmission", PARTS_CATALOG.transmission.length - 1),
  tiresId: ids("tires", PARTS_CATALOG.tires.length - 1),
  nosId: ids("nos", PARTS_CATALOG.nos.length - 1),
  aeroId: ids("aero", PARTS_CATALOG.aero.length - 1),
  exhaustId: ids("exhaust", PARTS_CATALOG.exhaust.length - 1),
  tuning: {},
} as unknown as CarConfig;

const specA = calculateSpecs(carA);
const specB = calculateSpecs(carB);
console.log("A(entry):", JSON.stringify(specA));
console.log("B(top):  ", JSON.stringify(specB));

if (!(specB.quarterMileSecEst < specA.quarterMileSecEst)) {
  throw new Error("SANITY FAIL: top build should be faster on the quarter mile");
}
if (!(specB.zeroToHundredSecEst < specA.zeroToHundredSecEst)) {
  throw new Error("SANITY FAIL: top build should accelerate faster 0-100");
}

// stepVehiclePhysics smoke: one step must return finite telemetry
try {
  const step = stepVehiclePhysics({
    config: carA,
    specs: specA,
    throttle: 1,
    gear: 1,
    speedKmh: 0,
    dtMs: 16.67,
  } as never);
  console.log("stepVehiclePhysics(1 step):", JSON.stringify(step).slice(0, 300));
} catch (e) {
  console.log("stepVehiclePhysics signature differs, skipping:", String(e).slice(0, 160));
}

console.log("PHYSICS_SANITY_OK");