// components/GameApp.tsx
// Redline Garage - Master Game Application & Simulation Orchestrator

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BlueprintSlot,
  CalculatedSpecs,
  CarConfig,
  GameView,
  QualitySetting,
  RaceResult,
  RaceTelemetry,
} from "@/lib/garage/types";
import {
  DEFAULT_CAR_CONFIG,
  PARTS_CATALOG,
  PRESET_BUILDS,
} from "@/lib/garage/catalog";
import { calculateSpecs, stepVehiclePhysics } from "@/lib/garage/physics";
import {
  getInitialBlueprints,
  loadActiveConfig,
  loadGameSettings,
  loadLeaderboard,
  saveActiveConfig,
  saveBlueprintSlot,
  saveGameSettings,
  saveRaceResult,
} from "@/lib/garage/storage";
import { soundEngine } from "@/lib/audio/soundEngine";
import { GarageScene } from "./garage/GarageScene";
import { DragStripScene } from "./garage/DragStripScene";
import { GarageUI } from "./garage/GarageUI";
import { TuningUI } from "./garage/TuningUI";
import { StagingHUD } from "./garage/StagingHUD";
import { ResultScreen } from "./garage/ResultScreen";
import { LeaderboardModal } from "./garage/LeaderboardModal";

const INITIAL_TELEMETRY: RaceTelemetry = {
  timeElapsed: 0,
  distanceMeters: 0,
  speedKmh: 0,
  speedMs: 0,
  rpm: 1000,
  currentGear: 1,
  throttle: 0,
  isShifting: false,
  nosActive: false,
  nosRemainingSec: 5.0,
  tireSlipRatio: 0,
  tireTempC: 45,
  wheelieAngleDeg: 0,
  gForce: 0,
};

export const GameApp: React.FC = () => {
  // 1. 游戏主状态
  const [view, setView] = useState<GameView>("garage");
  const [config, setConfig] = useState<CarConfig>(DEFAULT_CAR_CONFIG);
  const [specs, setSpecs] = useState<CalculatedSpecs>(() => calculateSpecs(DEFAULT_CAR_CONFIG));
  const [blueprints, setBlueprints] = useState<BlueprintSlot[]>([]);
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<RaceResult[]>([]);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);

  // 2. 设置状态
  const [quality, setQuality] = useState<QualitySetting>("high");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [masterVolume, setMasterVolume] = useState<number>(0.22);
  const [autoMode, setAutoMode] = useState<boolean>(true); // 自动挡 + 自动起步

  // 3. 跑线与遥测状态
  const [telemetry, setTelemetry] = useState<RaceTelemetry>(INITIAL_TELEMETRY);
  const [countdownStep, setCountdownStep] = useState<number>(0); // 0=Staged, 1..4=Yellow, 5=Green
  const [cameraMode, setCameraMode] = useState<"chase" | "hood" | "side">("chase");
  const [isBurningOut, setIsBurningOut] = useState<boolean>(false);
  const [burnoutTempBonus, setBurnoutTempBonus] = useState<number>(0);
  const [latestResult, setLatestResult] = useState<RaceResult | null>(null);

  // 对手车状态 (幽灵车同台竞技)
  const [opponentConfig, setOpponentConfig] = useState<CarConfig>(PRESET_BUILDS[1].config);
  const [opponentDistance, setOpponentDistance] = useState<number>(0);

  // Refs 用于高帧率物理循环，避免 React State 频繁重渲染导致掉帧
  const telemetryRef = useRef<RaceTelemetry>(INITIAL_TELEMETRY);
  const configRef = useRef<CarConfig>(DEFAULT_CAR_CONFIG);
  const specsRef = useRef<CalculatedSpecs>(specs);
  const countdownStepRef = useRef<number>(0);
  const isBurningOutRef = useRef<boolean>(false);
  const burnoutTempBonusRef = useRef<number>(0);
  const userThrottleRef = useRef<number>(1.0); // 默认全油门
  const nosTriggeredRef = useRef<boolean>(false);
  const raceFinishedRef = useRef<boolean>(false);

  // 4. 初始化加载本地存档
  useEffect(() => {
    const savedBlueprints = getInitialBlueprints();
    const savedConfig = loadActiveConfig();
    const savedRecords = loadLeaderboard();
    const savedSettings = loadGameSettings();

    setBlueprints(savedBlueprints);
    setConfig(savedConfig);
    configRef.current = savedConfig;
    const computed = calculateSpecs(savedConfig);
    setSpecs(computed);
    specsRef.current = computed;

    setLeaderboard(savedRecords);
    setQuality(savedSettings.quality);
    setSoundEnabled(savedSettings.soundEnabled);
    const vol = savedSettings.masterVolume !== undefined ? savedSettings.masterVolume : 0.22;
    setMasterVolume(vol);
    soundEngine.setVolume(vol);
    soundEngine.setMuted(!savedSettings.soundEnabled);
    setAutoMode(savedSettings.autoShift);
  }, []);

  // 更新配置并实时重算 Specs
  const handleUpdateConfig = useCallback((newConfig: CarConfig) => {
    setConfig(newConfig);
    configRef.current = newConfig;
    const computed = calculateSpecs(newConfig);
    setSpecs(computed);
    specsRef.current = computed;
    saveActiveConfig(newConfig);
  }, []);

  // 蓝图保存与加载
  const handleSelectSlot = useCallback((slotIdx: number) => {
    setActiveSlot(slotIdx);
    const target = blueprints.find((b) => b.slotIndex === slotIdx);
    if (target) {
      handleUpdateConfig(target.config);
    }
  }, [blueprints, handleUpdateConfig]);

  const handleSaveSlot = useCallback((slotIdx: number, name: string) => {
    const updated = saveBlueprintSlot(slotIdx, name, config);
    setBlueprints(updated);
  }, [config]);

  // 音效与画质
  const handleToggleSound = useCallback(() => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    soundEngine.setMuted(!nextVal);
    saveGameSettings({ ...loadGameSettings(), soundEnabled: nextVal });
  }, [soundEnabled]);

  const handleChangeVolume = useCallback((vol: number) => {
    setMasterVolume(vol);
    soundEngine.setVolume(vol);
    if (vol > 0 && !soundEnabled) {
      setSoundEnabled(true);
      soundEngine.setMuted(false);
    }
    saveGameSettings({ ...loadGameSettings(), masterVolume: vol, soundEnabled: vol > 0 });
  }, [soundEnabled]);

  const handleChangeQuality = useCallback((q: QualitySetting) => {
    setQuality(q);
    saveGameSettings({ ...loadGameSettings(), quality: q });
  }, []);

  // 跑线倒数控制 (Christmas Tree Sequence)
  const handleStartCountdown = useCallback(() => {
    if (countdownStepRef.current !== 0) return;
    soundEngine.init();
    soundEngine.startEngineSound(
      PARTS_CATALOG.engine.find((e) => e.id === config.engineId)?.soundProfile ?? "muscle_v8"
    );

    countdownStepRef.current = 1;
    setCountdownStep(1);
    soundEngine.playCountdownBeep(false);

    // 黄灯 1
    setTimeout(() => {
      if (view !== "staging" && view !== "drag") return;
      countdownStepRef.current = 2;
      setCountdownStep(2);
      soundEngine.playCountdownBeep(false);
    }, 500);

    // 黄灯 2
    setTimeout(() => {
      if (view !== "staging" && view !== "drag") return;
      countdownStepRef.current = 3;
      setCountdownStep(3);
      soundEngine.playCountdownBeep(false);
    }, 1000);

    // 黄灯 3
    setTimeout(() => {
      if (view !== "staging" && view !== "drag") return;
      countdownStepRef.current = 4;
      setCountdownStep(4);
      soundEngine.playCountdownBeep(false);
    }, 1500);

    // 绿灯发车！(Green Light Launch)
    setTimeout(() => {
      if (view !== "staging" && view !== "drag") return;
      countdownStepRef.current = 5;
      setCountdownStep(5);
      soundEngine.playCountdownBeep(true);
      setView("drag");
    }, 2000);
  }, [config.engineId, view]);

  // 准备比赛 (Staging)
  const handleEnterStaging = useCallback(() => {
    soundEngine.init();
    soundEngine.stopAllRaceSounds();
    const nosPart = PARTS_CATALOG.nos.find((n) => n.id === config.nosId);
    const initialNos = nosPart?.nosCapacitySec ?? 0;

    const resetTelemetry: RaceTelemetry = {
      ...INITIAL_TELEMETRY,
      nosRemainingSec: initialNos,
    };

    telemetryRef.current = resetTelemetry;
    setTelemetry(resetTelemetry);
    countdownStepRef.current = 0;
    setCountdownStep(0);
    burnoutTempBonusRef.current = 0;
    setBurnoutTempBonus(0);
    isBurningOutRef.current = false;
    setIsBurningOut(false);
    raceFinishedRef.current = false;
    userThrottleRef.current = 1.0;
    nosTriggeredRef.current = false;
    setOpponentDistance(0);

    setView("staging");
    soundEngine.startEngineSound(
      PARTS_CATALOG.engine.find((e) => e.id === config.engineId)?.soundProfile ?? "muscle_v8"
    );
  }, [config.engineId, config.nosId]);

  // 烧胎预热
  const handleStartBurnout = useCallback(() => {
    soundEngine.init();
    isBurningOutRef.current = true;
    setIsBurningOut(true);
    soundEngine.updateBurnoutSound(0.8);
  }, []);

  const handleStopBurnout = useCallback(() => {
    isBurningOutRef.current = false;
    setIsBurningOut(false);
    soundEngine.updateBurnoutSound(0);
  }, []);

  // 手动控制
  const handleManualShiftUp = useCallback(() => {
    soundEngine.playSnapSound();
    soundEngine.playShiftPop();
    const maxGears = PARTS_CATALOG.transmission.find((t) => t.id === config.transmissionId)?.gearCount ?? 4;
    if (telemetryRef.current.currentGear < maxGears) {
      telemetryRef.current.currentGear += 1;
      telemetryRef.current.isShifting = true;
    }
  }, [config.transmissionId]);

  const handleManualShiftDown = useCallback(() => {
    soundEngine.playSnapSound();
    if (telemetryRef.current.currentGear > 1) {
      telemetryRef.current.currentGear -= 1;
    }
  }, []);

  const handleTriggerNos = useCallback(() => {
    soundEngine.init();
    nosTriggeredRef.current = true;
    soundEngine.playNosBurst(true);
  }, []);

  // 5. 核心 60Hz 物理循环与声效迭代
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let zeroTo100Time = 0;
    let zeroTo200Time = 0;
    let sixtyFeetTime = 0;
    let maxG = 0;

    const loop = (currentTime: number) => {
      const dt = Math.min(0.033, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      // 烧胎预热阶段
      if (countdownStepRef.current === 0 && isBurningOutRef.current) {
        burnoutTempBonusRef.current = Math.min(50, burnoutTempBonusRef.current + dt * 25);
        setBurnoutTempBonus(burnoutTempBonusRef.current);
        soundEngine.updateEngineRpm(6500, configRef.current.tuning.redlineRpm, 0.9);
      }

      // 发车绿灯后：进入物理推进
      if (countdownStepRef.current === 5 && !raceFinishedRef.current) {
        const engineSpec = PARTS_CATALOG.engine.find((e) => e.id === configRef.current.engineId);
        const engineProfile = engineSpec?.soundProfile ?? "muscle_v8";

        const stepResult = stepVehiclePhysics({
          dt,
          telemetry: telemetryRef.current,
          config: configRef.current,
          specs: specsRef.current,
          userThrottle: userThrottleRef.current,
          nosTriggered: nosTriggeredRef.current,
          autoShift: autoMode,
          burnoutTireTempBonus: burnoutTempBonusRef.current,
        });

        telemetryRef.current = stepResult.telemetry;

        // 记录分段成绩
        if (stepResult.telemetry.speedKmh >= 100 && zeroTo100Time === 0) {
          zeroTo100Time = stepResult.telemetry.timeElapsed;
        }
        if (stepResult.telemetry.speedKmh >= 200 && zeroTo200Time === 0) {
          zeroTo200Time = stepResult.telemetry.timeElapsed;
        }
        if (stepResult.telemetry.distanceMeters >= 18.28 && sixtyFeetTime === 0) {
          sixtyFeetTime = stepResult.telemetry.timeElapsed;
        }
        if (stepResult.telemetry.gForce > maxG) {
          maxG = stepResult.telemetry.gForce;
        }

        // 声效同步
        soundEngine.updateEngineRpm(
          stepResult.telemetry.rpm,
          configRef.current.tuning.redlineRpm,
          userThrottleRef.current,
          engineProfile
        );
        soundEngine.updateBurnoutSound(stepResult.smokeIntensity);
        soundEngine.playNosBurst(stepResult.telemetry.nosActive);

        if (stepResult.didShift) {
          soundEngine.playShiftPop();
        }

        // 对手车模拟
        setOpponentDistance((prev) => prev + stepResult.telemetry.speedMs * 0.985 * dt);

        // 冲线判定 (402.33 米 / 1/4 英里)
        if (stepResult.quarterMileCrossed && !raceFinishedRef.current) {
          raceFinishedRef.current = true;
          userThrottleRef.current = 0;
          soundEngine.updateBurnoutSound(0);
          soundEngine.stopBurnoutSound();
          soundEngine.playNosBurst(false);
          soundEngine.stopNosSound();
          soundEngine.updateEngineRpm(850, configRef.current.tuning.redlineRpm, 0, engineProfile);

          const finalResult: RaceResult = {
            id: `race_${Date.now()}`,
            timestamp: Date.now(),
            carName: PARTS_CATALOG.chassis.find((c) => c.id === configRef.current.chassisId)?.name ?? "自改直线赛车",
            paintColor: configRef.current.paintColor,
            quarterMileTime: Math.round(stepResult.telemetry.timeElapsed * 1000) / 1000,
            trapSpeedKmh: Math.round(stepResult.telemetry.speedKmh * 10) / 10,
            zeroToHundredTime: Math.round(zeroTo100Time * 1000) / 1000,
            zeroToTwoHundredTime: Math.round(zeroTo200Time * 1000) / 1000,
            sixtyFeetTime: Math.round(sixtyFeetTime * 1000) / 1000,
            maxGForce: Math.round(maxG * 100) / 100,
            isPersonalBest: false,
            carConfig: JSON.parse(JSON.stringify(configRef.current)),
          };

          const { leaderboard: updatedLeaderboard, isPB } = saveRaceResult(finalResult);
          finalResult.isPersonalBest = isPB;
          setLatestResult(finalResult);
          setLeaderboard(updatedLeaderboard);

          soundEngine.playVictoryFanfare(isPB);

          // 冲线后滑行 1.2 秒切入成绩大屏，并彻底停止所有比赛循环音源
          setTimeout(() => {
            soundEngine.stopAllRaceSounds();
            setView("result");
          }, 1200);
        }

        // 同步 React 状态给 HUD 渲染 (节流)
        setTelemetry({ ...stepResult.telemetry });
      }

      if (view === "staging" || view === "drag") {
        animId = requestAnimationFrame(loop);
      }
    };

    if (view === "staging" || view === "drag") {
      animId = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [view, autoMode]);

  // 6. 键盘快捷键响应 (空格/W油门与烧胎, Shift升挡, Ctrl降挡, N氮气, R重赛, Esc回车库)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "Space") {
        if (view === "staging" && countdownStep === 0) {
          handleStartBurnout();
        } else if (view === "staging" && countdownStep === 0) {
          handleStartCountdown();
        }
      } else if (e.code === "KeyN") {
        handleTriggerNos();
      } else if (e.code === "ShiftLeft" || e.code === "KeyE") {
        handleManualShiftUp();
      } else if (e.code === "ControlLeft" || e.code === "KeyQ") {
        handleManualShiftDown();
      } else if (e.code === "KeyR" && (view === "drag" || view === "result")) {
        handleEnterStaging();
      } else if (e.code === "Escape") {
        soundEngine.stopEngineSound();
        setView("garage");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && isBurningOutRef.current) {
        handleStopBurnout();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [view, countdownStep, handleStartBurnout, handleStopBurnout, handleStartCountdown, handleTriggerNos, handleManualShiftUp, handleManualShiftDown, handleEnterStaging]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0a0c] font-sans text-white select-none">
      {/* 3D 场景层 */}
      <div className="absolute inset-0 z-0">
        {view === "garage" || view === "tuning" ? (
          <GarageScene config={config} quality={quality} autoRotate={view === "garage"} />
        ) : (
          <DragStripScene
            config={config}
            telemetry={telemetry}
            countdownStep={countdownStep}
            cameraMode={cameraMode}
            quality={quality}
            opponentConfig={opponentConfig}
            opponentDistance={opponentDistance}
          />
        )}
      </div>

      {/* 2D UI 界面层 */}
      <div className="relative z-10 h-full w-full">
        {view === "garage" && (
          <GarageUI
            config={config}
            specs={specs}
            blueprints={blueprints}
            activeSlot={activeSlot}
            quality={quality}
            soundEnabled={soundEnabled}
            masterVolume={masterVolume}
            onUpdateConfig={handleUpdateConfig}
            onSelectSlot={handleSelectSlot}
            onSaveSlot={handleSaveSlot}
            onGoToTuning={() => setView("tuning")}
            onGoToRace={handleEnterStaging}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onToggleSound={handleToggleSound}
            onChangeVolume={handleChangeVolume}
            onChangeQuality={handleChangeQuality}
          />
        )}

        {view === "tuning" && (
          <TuningUI
            config={config}
            specs={specs}
            onUpdateConfig={handleUpdateConfig}
            onBackToGarage={() => setView("garage")}
            onGoToRace={handleEnterStaging}
          />
        )}

        {(view === "staging" || view === "drag") && (
          <StagingHUD
            telemetry={telemetry}
            maxRpm={config.tuning.redlineRpm || 8000}
            countdownStep={countdownStep}
            cameraMode={cameraMode}
            autoMode={autoMode}
            soundEnabled={soundEnabled}
            masterVolume={masterVolume}
            burnoutTempBonus={burnoutTempBonus}
            isBurningOut={isBurningOut}
            onStartCountdown={handleStartCountdown}
            onSetCameraMode={setCameraMode}
            onToggleAutoMode={() => setAutoMode(!autoMode)}
            onToggleSound={handleToggleSound}
            onChangeVolume={handleChangeVolume}
            onStartBurnout={handleStartBurnout}
            onStopBurnout={handleStopBurnout}
            onManualThrottleChange={(th) => (userThrottleRef.current = th)}
            onManualShiftUp={handleManualShiftUp}
            onManualShiftDown={handleManualShiftDown}
            onTriggerNos={handleTriggerNos}
            onRestartRace={handleEnterStaging}
            onBackToGarage={() => {
              soundEngine.stopAllRaceSounds();
              setView("garage");
            }}
          />
        )}

        {view === "result" && latestResult && (
          <ResultScreen
            result={latestResult}
            onRestartRace={handleEnterStaging}
            onBackToGarage={() => {
              soundEngine.stopAllRaceSounds();
              setView("garage");
            }}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          />
        )}
      </div>

      {/* 荣誉榜排行榜弹窗 */}
      <LeaderboardModal
        records={leaderboard}
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />
    </div>
  );
};
