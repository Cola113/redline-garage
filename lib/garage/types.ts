// lib/garage/types.ts
// Redline Garage - Type Definitions

export type GameView = "garage" | "tuning" | "staging" | "drag" | "result";

export type QualitySetting = "high" | "medium" | "low";

export type PartCategory =
  | "chassis"
  | "engine"
  | "transmission"
  | "tires"
  | "nos"
  | "aero"
  | "exhaust";

export interface PartSpec {
  id: string;
  category: PartCategory;
  name: string;
  subtitle: string;
  description: string;
  weightKg: number; // 重量贡献
  // 引擎属性
  baseHp?: number; // 基础马力
  maxRpm?: number; // 标定红线转速
  torqueNm?: number; // 峰值扭矩
  engineType?: "v8_blower" | "inline4_turbo" | "v6_twin_turbo" | "v12_quad" | "dual_ev";
  soundProfile?: "muscle_v8" | "tuner_i4" | "super_v12" | "ev_whine";
  // 变速箱属性
  gearCount?: number;
  gearRatios?: number[];
  finalDrive?: number;
  shiftDelayMs?: number; // 换挡顿挫时间
  // 轮胎属性
  gripCoefficient?: number; // 基础抓地系数 (0.8 ~ 1.8)
  optimalTempC?: number;
  tireType?: "street" | "semi_slick" | "drag_radial" | "carbon_comp";
  // 氮气属性
  nosShotHp?: number; // 喷射额外马力
  nosCapacitySec?: number; // 氮气容量(秒)
  // 空力属性
  dragCoefficientDelta?: number; // 风阻系数增减 (Cd)
  downforceMultiplier?: number; // 下压力增益
  hasWheelieBar?: boolean;
  // 排气属性
  exhaustFlowBonus?: number; // 排气效率马力增益百分比 (e.g. 0.05 = +5%)
  flameLevel?: number; // 喷火剧烈程度 1-3
  // 3D 外观参数
  style?: string;
  meshConfig?: Record<string, unknown>;
}

export interface TuningSettings {
  // 引擎
  boostMultiplier: number; // 0.8 ~ 1.5x 增压/点火角
  redlineRpm: number; // 6000 ~ 9500 RPM
  // 变速箱
  finalDriveRatio: number; // 2.5 ~ 4.8
  gear1Ratio: number; // 2.0 ~ 4.2
  gear2Ratio: number; // 1.3 ~ 2.8
  gear3Ratio: number; // 0.9 ~ 1.9
  gear4Ratio: number; // 0.7 ~ 1.4
  gear5Ratio: number; // 0.5 ~ 1.1
  gear6Ratio: number; // 0.4 ~ 0.9
  // 轮胎
  tirePressurePsi: number; // 12 ~ 36 PSI (低胎压起步抓地高但高速滚阻大)
  // 氮气
  nosDurationSec: number; // 喷射持续分配
  nosTriggerRpm: number; // 自动喷射转速阈值
  // 空力/悬挂
  wingAngleDeg: number; // 0 ~ 25度 (尾翼攻角，下压力 vs 阻力)
  suspensionStiffness: number; // 0.5 ~ 1.5 (软起步抬头重心后移，硬高速稳定)
}

export interface CarConfig {
  chassisId: string;
  engineId: string;
  transmissionId: string;
  tiresId: string;
  nosId: string;
  aeroId: string;
  exhaustId: string;
  paintColor: string;
  paintFinish: "metallic" | "matte" | "chrome" | "gloss";
  tuning: TuningSettings;
}

export interface CalculatedSpecs {
  totalWeightKg: number;
  peakHp: number;
  peakTorqueNm: number;
  powerToWeightRatio: number; // hp/ton
  topSpeedKmhEst: number;
  zeroToHundredSecEst: number;
  quarterMileSecEst: number;
  gripScore: number;
  aerodynamicsScore: number;
}

export interface RaceTelemetry {
  timeElapsed: number; // 秒
  distanceMeters: number; // 0 ~ 402.33m
  speedKmh: number;
  speedMs: number;
  rpm: number;
  currentGear: number;
  throttle: number; // 0 ~ 1
  isShifting: boolean;
  nosActive: boolean;
  nosRemainingSec: number;
  tireSlipRatio: number; // 打滑率 (0正常, >0.15冒烟打滑)
  tireTempC: number;
  wheelieAngleDeg: number; // 抬头角度
  gForce: number;
}

export interface RaceResult {
  id: string;
  timestamp: number;
  carName: string;
  paintColor: string;
  quarterMileTime: number; // 1/4英里秒数 (402.33m)
  trapSpeedKmh: number; // 尾速
  zeroToHundredTime: number; // 0-100 km/h 秒数
  zeroToTwoHundredTime: number; // 0-200 km/h 秒数
  sixtyFeetTime: number; // 60英尺 (18.28m) 用时
  maxGForce: number;
  isPersonalBest: boolean;
  carConfig: CarConfig;
}

export interface BlueprintSlot {
  slotIndex: number;
  name: string;
  updatedAt: number;
  config: CarConfig;
  bestQuarterMile?: number;
  bestTrapSpeed?: number;
}
