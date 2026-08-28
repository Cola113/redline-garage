// lib/garage/storage.ts
// Redline Garage - LocalStorage Persistence for Blueprints, Leaderboards & Settings

import { DEFAULT_CAR_CONFIG, PRESET_BUILDS } from "./catalog";
import { BlueprintSlot, CarConfig, QualitySetting, RaceResult } from "./types";

const BLUEPRINTS_KEY = "redline_garage_blueprints_v1";
const ACTIVE_CONFIG_KEY = "redline_garage_active_config_v1";
const LEADERBOARD_KEY = "redline_garage_leaderboard_v1";
const SETTINGS_KEY = "redline_garage_settings_v1";

export interface GameSettings {
  quality: QualitySetting;
  soundEnabled: boolean;
  masterVolume: number;
  autoLaunch: boolean;
  autoShift: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  quality: "high",
  soundEnabled: true,
  masterVolume: 0.22,
  autoLaunch: true,
  autoShift: true,
};

export function getInitialBlueprints(): BlueprintSlot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BLUEPRINTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BlueprintSlot[];
      if (Array.isArray(parsed) && parsed.length === 3) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load blueprints:", e);
  }

  // 默认初始 3 个槽位
  const initial: BlueprintSlot[] = [
    {
      slotIndex: 0,
      name: "槽位 1：烈火战车 (V8 Blower)",
      updatedAt: Date.now(),
      config: PRESET_BUILDS[0].config,
      bestQuarterMile: 7.42,
      bestTrapSpeed: 312,
    },
    {
      slotIndex: 1,
      name: "槽位 2：极速幽灵 (W12 Quad)",
      updatedAt: Date.now(),
      config: PRESET_BUILDS[1].config,
      bestQuarterMile: 7.15,
      bestTrapSpeed: 348,
    },
    {
      slotIndex: 2,
      name: "槽位 3：静默闪电 (Dual-EV)",
      updatedAt: Date.now(),
      config: PRESET_BUILDS[2].config,
      bestQuarterMile: 7.68,
      bestTrapSpeed: 295,
    },
  ];

  try {
    localStorage.setItem(BLUEPRINTS_KEY, JSON.stringify(initial));
  } catch (e) {
    // Ignore storage write error
  }
  return initial;
}

export function saveBlueprintSlot(slotIndex: number, name: string, config: CarConfig, bestTime?: number, bestSpeed?: number): BlueprintSlot[] {
  const current = getInitialBlueprints();
  const target = current.find((b) => b.slotIndex === slotIndex) ?? current[0];
  target.name = name;
  target.config = JSON.parse(JSON.stringify(config));
  target.updatedAt = Date.now();
  if (bestTime !== undefined && (target.bestQuarterMile === undefined || bestTime < target.bestQuarterMile)) {
    target.bestQuarterMile = bestTime;
  }
  if (bestSpeed !== undefined && (target.bestTrapSpeed === undefined || bestSpeed > target.bestTrapSpeed)) {
    target.bestTrapSpeed = bestSpeed;
  }

  try {
    localStorage.setItem(BLUEPRINTS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error(e);
  }
  return current;
}

export function loadActiveConfig(): CarConfig {
  if (typeof window === "undefined") return DEFAULT_CAR_CONFIG;
  try {
    const raw = localStorage.getItem(ACTIVE_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw) as CarConfig;
    }
  } catch (e) {
    console.warn("Failed to load active config:", e);
  }
  return DEFAULT_CAR_CONFIG;
}

export function saveActiveConfig(config: CarConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error(e);
  }
}

export function loadLeaderboard(): RaceResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (raw) {
      return JSON.parse(raw) as RaceResult[];
    }
  } catch (e) {
    console.warn("Failed to load leaderboard:", e);
  }

  // 默认预制历史标杆成绩 (营造竞争感)
  const defaultRecords: RaceResult[] = [
    {
      id: "rec_legend_1",
      timestamp: Date.now() - 86400000 * 3,
      carName: "车队传奇 · 暴风雨",
      paintColor: "#00d2ff",
      quarterMileTime: 6.89,
      trapSpeedKmh: 362.4,
      zeroToHundredTime: 1.48,
      zeroToTwoHundredTime: 3.92,
      sixtyFeetTime: 1.05,
      maxGForce: 2.35,
      isPersonalBest: false,
      carConfig: PRESET_BUILDS[1].config,
    },
    {
      id: "rec_legend_2",
      timestamp: Date.now() - 86400000 * 2,
      carName: "红线技研 · 烈火号",
      paintColor: "#e62117",
      quarterMileTime: 7.24,
      trapSpeedKmh: 326.8,
      zeroToHundredTime: 1.62,
      zeroToTwoHundredTime: 4.31,
      sixtyFeetTime: 1.12,
      maxGForce: 2.18,
      isPersonalBest: false,
      carConfig: PRESET_BUILDS[0].config,
    },
    {
      id: "rec_legend_3",
      timestamp: Date.now() - 86400000 * 1,
      carName: "夜行者 · 极光特调",
      paintColor: "#8a2be2",
      quarterMileTime: 7.55,
      trapSpeedKmh: 308.2,
      zeroToHundredTime: 1.74,
      zeroToTwoHundredTime: 4.65,
      sixtyFeetTime: 1.18,
      maxGForce: 1.95,
      isPersonalBest: false,
      carConfig: PRESET_BUILDS[2].config,
    },
  ];

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(defaultRecords));
  } catch (e) {}
  return defaultRecords;
}

export function saveRaceResult(result: RaceResult): { leaderboard: RaceResult[]; isPB: boolean } {
  const current = loadLeaderboard();
  
  // 检查是否打破个人最佳纪录 (PB)
  const userBests = current.filter((r) => r.isPersonalBest || r.id.startsWith("user_"));
  const previousBestTime = userBests.length > 0
    ? Math.min(...userBests.map((r) => r.quarterMileTime))
    : 999;

  const isPB = result.quarterMileTime < previousBestTime;
  result.isPersonalBest = isPB;
  result.id = `user_${Date.now()}`;

  const updated = [result, ...current]
    .sort((a, b) => a.quarterMileTime - b.quarterMileTime)
    .slice(0, 20); // 保留前20条

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }

  return { leaderboard: updated, isPB };
}

export function loadGameSettings(): GameSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {}
  return DEFAULT_SETTINGS;
}

export function saveGameSettings(settings: GameSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}
}
