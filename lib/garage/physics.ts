// lib/garage/physics.ts
// Redline Garage - Real-Time Vehicle Physics & Telemetry Engine

import { PARTS_CATALOG } from "./catalog";
import { CalculatedSpecs, CarConfig, RaceTelemetry, TuningSettings } from "./types";

export function getPart<T extends keyof typeof PARTS_CATALOG>(
  category: T,
  id: string
) {
  return (
    PARTS_CATALOG[category].find((p) => p.id === id) ??
    PARTS_CATALOG[category][0]
  );
}

export function calculateSpecs(config: CarConfig): CalculatedSpecs {
  const chassis = getPart("chassis", config.chassisId);
  const engine = getPart("engine", config.engineId);
  const trans = getPart("transmission", config.transmissionId);
  const tires = getPart("tires", config.tiresId);
  const nos = getPart("nos", config.nosId);
  const aero = getPart("aero", config.aeroId);
  const exhaust = getPart("exhaust", config.exhaustId);

  // 1. 总重量 (kg)
  const totalWeightKg =
    chassis.weightKg +
    (engine.weightKg ?? 200) +
    (trans.weightKg ?? 70) +
    (tires.weightKg ?? 45) +
    (nos.weightKg ?? 0) +
    (aero.weightKg ?? 0) +
    (exhaust.weightKg ?? 15);

  // 2. 马力与扭矩计算
  const boost = config.tuning.boostMultiplier || 1.0;
  const exhaustBonus = 1 + (exhaust.exhaustFlowBonus ?? 0);
  const baseHp = engine.baseHp ?? 600;
  const peakHp = Math.round(baseHp * boost * exhaustBonus);
  const baseTorque = engine.torqueNm ?? 700;
  const peakTorqueNm = Math.round(baseTorque * boost * exhaustBonus);

  // 3. 推重比 (hp/吨)
  const powerToWeightRatio = Math.round((peakHp / (totalWeightKg / 1000)) * 10) / 10;

  // 4. 抓地力评分 (0-100)
  const tireGrip = tires.gripCoefficient ?? 1.2;
  const pressureOptFactor = Math.max(0.7, 1 - Math.abs(config.tuning.tirePressurePsi - 18) * 0.015);
  const gripScore = Math.round(tireGrip * pressureOptFactor * 50);

  // 5. 空气动力学评分
  const baseCd = 0.32;
  const cd = baseCd + (aero.dragCoefficientDelta ?? 0) + (config.tuning.wingAngleDeg * 0.003);
  const aerodynamicsScore = Math.round((1 / cd) * 30);

  // 6. 估算极速与0-100加速
  // 极速由功率与风阻平衡决定: P = 0.5 * rho * Cd * A * v^3
  const frontalArea = 2.15; // m^2
  const airDensity = 1.2; // kg/m^3
  const availablePowerWatts = peakHp * 735.5 * 0.85; // 轮上有效功率
  const maxVelocityMs = Math.pow(availablePowerWatts / (0.5 * airDensity * cd * frontalArea), 1 / 3);
  const topSpeedKmhEst = Math.round(maxVelocityMs * 3.6);

  // 0-100 km/h 估算 (基于推重比与极限抓地)
  const avgG = Math.min(tireGrip * 1.1, (powerToWeightRatio / 300) * 0.9);
  const zeroToHundredSecEst = Math.max(1.3, Math.round((27.78 / (avgG * 9.81)) * 100) / 100);

  // 1/4 英里 (402.33m) 估算
  const quarterMileSecEst = Math.max(6.2, Math.round((5.825 * Math.pow(totalWeightKg / peakHp, 1 / 3)) * 100) / 100);

  return {
    totalWeightKg,
    peakHp,
    peakTorqueNm,
    powerToWeightRatio,
    topSpeedKmhEst,
    zeroToHundredSecEst,
    quarterMileSecEst,
    gripScore,
    aerodynamicsScore,
  };
}

export function getGearRatio(tuning: TuningSettings, gear: number): number {
  switch (gear) {
    case 1:
      return tuning.gear1Ratio;
    case 2:
      return tuning.gear2Ratio;
    case 3:
      return tuning.gear3Ratio;
    case 4:
      return tuning.gear4Ratio;
    case 5:
      return tuning.gear5Ratio;
    case 6:
      return tuning.gear6Ratio;
    default:
      return 0.7;
  }
}

// 直线加速实时物理迭代步
export interface PhysicsStepInput {
  dt: number; // 步长时间 (秒，如 1/60)
  telemetry: RaceTelemetry;
  config: CarConfig;
  specs: CalculatedSpecs;
  userThrottle: number; // 0 ~ 1
  nosTriggered: boolean;
  autoShift: boolean;
  burnoutTireTempBonus: number; // 烧胎积攒的额外轮胎热量 (0 ~ 50度)
}

export interface PhysicsStepOutput {
  telemetry: RaceTelemetry;
  didShift: boolean;
  engineSoundPitch: number; // 0.5 ~ 2.0 (给音效引擎)
  exhaustFlame: boolean;
  smokeIntensity: number; // 0 ~ 1 (轮胎白烟)
  quarterMileCrossed: boolean;
}

export function stepVehiclePhysics({
  dt,
  telemetry,
  config,
  specs,
  userThrottle,
  nosTriggered,
  autoShift,
  burnoutTireTempBonus,
}: PhysicsStepInput): PhysicsStepOutput {
  const engine = getPart("engine", config.engineId);
  const trans = getPart("transmission", config.transmissionId);
  const tires = getPart("tires", config.tiresId);
  const nos = getPart("nos", config.nosId);
  const aero = getPart("aero", config.aeroId);
  const exhaust = getPart("exhaust", config.exhaustId);

  const maxGears = trans.gearCount ?? 4;
  const wheelRadius = 0.34; // 34cm 半径
  const mass = specs.totalWeightKg;
  const redline = config.tuning.redlineRpm || 8000;
  const idleRpm = engine.engineType === "dual_ev" ? 0 : 900;

  let currentGear = telemetry.currentGear;
  let isShifting = telemetry.isShifting;
  let didShift = false;
  let nosActive = telemetry.nosActive;
  let nosRemainingSec = telemetry.nosRemainingSec;

  // 1. 氮气激活逻辑
  if (nosTriggered && nosRemainingSec > 0 && nos.nosShotHp && nos.nosShotHp > 0) {
    nosActive = true;
    nosRemainingSec = Math.max(0, nosRemainingSec - dt);
  } else if (
    config.tuning.nosTriggerRpm > 0 &&
    telemetry.rpm >= config.tuning.nosTriggerRpm &&
    nosRemainingSec > 0 &&
    nos.nosShotHp &&
    nos.nosShotHp > 0
  ) {
    nosActive = true;
    nosRemainingSec = Math.max(0, nosRemainingSec - dt);
  } else {
    nosActive = false;
  }

  // 2. 传动比与转速计算
  const currentRatio = getGearRatio(config.tuning, currentGear);
  const finalDrive = config.tuning.finalDriveRatio;
  const totalRatio = currentRatio * finalDrive;

  // 当前车速转换为引擎转速
  let calculatedRpm = (telemetry.speedMs / (2 * Math.PI * wheelRadius)) * 60 * totalRatio;
  if (calculatedRpm < idleRpm) calculatedRpm = idleRpm;

  // 起步打滑或空油门时的转速抬升
  let targetRpm = calculatedRpm;
  if (userThrottle > 0.1 && telemetry.speedMs < 3.0) {
    // 弹射起步转速高企
    const launchRpm = engine.engineType === "dual_ev" ? 6000 : redline * 0.75;
    targetRpm = Math.max(calculatedRpm, launchRpm * userThrottle);
  }

  // 自动换挡逻辑
  if (autoShift && !isShifting && currentGear < maxGears && targetRpm >= redline - 150) {
    isShifting = true;
    currentGear += 1;
    didShift = true;
  }

  // 换挡顿挫恢复
  if (isShifting) {
    // 换挡期间短暂动力中断 (60ms)
    // 经过 1-3 个物理帧恢复
    targetRpm = Math.max(idleRpm, targetRpm * 0.7);
    isShifting = false; // 简化为瞬时顿挫并触发回火
  }

  const currentRpm = Math.min(redline + 400, Math.max(idleRpm, targetRpm));

  // 3. 引擎扭矩输出
  let effectiveHp = specs.peakHp;
  if (nosActive && nos.nosShotHp) {
    effectiveHp += nos.nosShotHp;
  }

  // 扭矩曲线模拟: 随着 RPM 提升达到峰值，并在红线附近衰减
  let rpmFactor = 1.0;
  if (engine.engineType === "dual_ev") {
    // 电机从 0 开始最大扭矩，高转略衰减
    rpmFactor = Math.max(0.65, 1.0 - (currentRpm / 20000) * 0.35);
  } else {
    const rpmNorm = currentRpm / redline;
    rpmFactor = Math.sin(Math.min(Math.PI, rpmNorm * Math.PI * 0.95 + 0.1));
  }

  const currentTorque = specs.peakTorqueNm * rpmFactor * userThrottle * (nosActive ? 1.3 : 1.0);
  const wheelTorque = currentTorque * totalRatio * 0.88; // 88% 传动效率
  const tractiveForceDrive = wheelTorque / wheelRadius;

  // 4. 轮胎抓地力极限与打滑计算
  const baseGrip = tires.gripCoefficient ?? 1.2;
  const pressureOptFactor = Math.max(0.75, 1 - Math.abs(config.tuning.tirePressurePsi - 18) * 0.015);
  const tempBoost = Math.min(0.2, (burnoutTireTempBonus + (telemetry.tireTempC - 40)) * 0.003);
  const effectiveMu = baseGrip * pressureOptFactor + Math.max(0, tempBoost);

  // 空气下压力
  const wingAngle = config.tuning.wingAngleDeg;
  const downforceN =
    0.5 * 1.2 * (aero.downforceMultiplier ?? 1.0) * (wingAngle * 0.05) * 2.0 * Math.pow(telemetry.speedMs, 2);

  // 后轮法向载荷 (起步时重心后移增重，前轮减重)
  const rearWeightFraction = 0.58 + Math.min(0.25, (telemetry.gForce || 0) * 0.15);
  const normalForceRear = mass * 9.81 * rearWeightFraction + downforceN;
  const maxGripForce = normalForceRear * effectiveMu;

  let actualTractiveForce = tractiveForceDrive;
  let tireSlipRatio = 0;
  let smokeIntensity = 0;

  if (tractiveForceDrive > maxGripForce) {
    // 突破抓地极限，进入滑动摩擦 (动摩擦系数 ~0.82)
    tireSlipRatio = (tractiveForceDrive - maxGripForce) / maxGripForce;
    actualTractiveForce = maxGripForce * 0.85;
    smokeIntensity = Math.min(1.0, tireSlipRatio * 1.5 + (userThrottle > 0.8 ? 0.2 : 0));
  }

  // 5. 空气阻力与滚阻
  const cd = 0.32 + (aero.dragCoefficientDelta ?? 0) + wingAngle * 0.0025;
  const aeroDragForce = 0.5 * 1.2 * cd * 2.15 * Math.pow(telemetry.speedMs, 2);
  const rollingResistanceForce = mass * 9.81 * 0.012 * (1 + (32 - config.tuning.tirePressurePsi) * 0.01);

  // 6. 净加速度
  const netForce = Math.max(0, actualTractiveForce - aeroDragForce - rollingResistanceForce);
  const acceleration = userThrottle > 0 ? netForce / mass : -2.0; // 松油门微弱阻力减速

  const newSpeedMs = Math.max(0, telemetry.speedMs + acceleration * dt);
  const newDistance = telemetry.distanceMeters + ((telemetry.speedMs + newSpeedMs) / 2) * dt;
  const newTime = telemetry.timeElapsed + dt;
  const newGForce = acceleration / 9.81;

  // 7. 翘头 (Wheelie) 角度计算
  let wheelieAngle = 0;
  if (!aero.hasWheelieBar && newGForce > 1.2 && telemetry.speedKmh < 90) {
    wheelieAngle = Math.min(18, (newGForce - 1.2) * 22);
  } else if (aero.hasWheelieBar && newGForce > 1.2) {
    wheelieAngle = Math.min(4.5, (newGForce - 1.2) * 6); // 防翘头小轮锁死角度
  }

  // 8. 排气喷火判定 (换挡时、大油门高转、或侧排气)
  const exhaustFlame =
    (didShift && (exhaust.flameLevel ?? 1) >= 2) ||
    (nosActive && (exhaust.flameLevel ?? 1) >= 1) ||
    (currentRpm > redline - 400 && userThrottle > 0.9);

  const quarterMileCrossed = newDistance >= 402.33;

  const nextTelemetry: RaceTelemetry = {
    timeElapsed: newTime,
    distanceMeters: Math.min(450, newDistance),
    speedMs: newSpeedMs,
    speedKmh: Math.round(newSpeedMs * 3.6 * 10) / 10,
    rpm: Math.round(currentRpm),
    currentGear,
    throttle: userThrottle,
    isShifting,
    nosActive,
    nosRemainingSec,
    tireSlipRatio: Math.round(tireSlipRatio * 100) / 100,
    tireTempC: Math.min(130, telemetry.tireTempC + (smokeIntensity > 0.1 ? dt * 15 : -dt * 2)),
    wheelieAngleDeg: Math.round(wheelieAngle * 10) / 10,
    gForce: Math.round(newGForce * 100) / 100,
  };

  const engineSoundPitch = Math.max(0.6, Math.min(2.5, currentRpm / (redline * 0.75)));

  return {
    telemetry: nextTelemetry,
    didShift,
    engineSoundPitch,
    exhaustFlame,
    smokeIntensity,
    quarterMileCrossed,
  };
}
