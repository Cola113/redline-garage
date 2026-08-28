// components/garage/TuningUI.tsx
// Redline Garage - High Precision Tuning Panel with Factory Spec Recommendations

import React from "react";
import {
  Sliders,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Play,
  Zap,
  Gauge,
  Disc,
  Flame,
  Wind,
  CheckCircle2,
} from "lucide-react";
import { CalculatedSpecs, CarConfig, TuningSettings } from "@/lib/garage/types";
import { getFactoryRecommendedTuning } from "@/lib/garage/catalog";
import { soundEngine } from "@/lib/audio/soundEngine";

interface TuningUIProps {
  config: CarConfig;
  specs: CalculatedSpecs;
  onUpdateConfig: (newConfig: CarConfig) => void;
  onBackToGarage: () => void;
  onGoToRace: () => void;
}

export const TuningUI: React.FC<TuningUIProps> = ({
  config,
  specs,
  onUpdateConfig,
  onBackToGarage,
  onGoToRace,
}) => {
  const factorySpecs = getFactoryRecommendedTuning(config);

  const handleUpdateTuning = <K extends keyof TuningSettings>(
    key: K,
    val: TuningSettings[K]
  ) => {
    onUpdateConfig({
      ...config,
      tuning: {
        ...config.tuning,
        [key]: val,
      },
    });
  };

  const handleResetSingle = <K extends keyof TuningSettings>(key: K) => {
    soundEngine.playSnapSound();
    handleUpdateTuning(key, factorySpecs[key]);
  };

  const handleApplyAllFactory = () => {
    soundEngine.playSnapSound();
    onUpdateConfig({
      ...config,
      tuning: { ...factorySpecs },
    });
  };

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-y-auto p-4 md:p-6 bg-black/60 backdrop-blur-xl">
      {/* 顶部标题与一键推荐 */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundEngine.playSnapSound();
              onBackToGarage();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-neutral-300 transition-all hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回车库</span>
          </button>
          <div>
            <h2 className="text-lg font-black tracking-wider text-white">精密调参台 (DYNO TUNING)</h2>
            <p className="text-xs text-neutral-400">调整每个物理变量，挖掘引擎与齿比的最后一匹马力</p>
          </div>
        </div>

        {/* 一键全套推荐 */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleApplyAllFactory}
            className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs font-black text-amber-300 shadow-lg transition-all hover:bg-amber-500/25 active:scale-95"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>一键套用全部厂队推荐</span>
          </button>

          <button
            onClick={() => {
              soundEngine.init();
              onGoToRace();
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff3b30] to-[#e62117] px-5 py-2 text-xs font-black text-white shadow-lg shadow-red-900/40 transition-all hover:brightness-110 active:scale-95"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>点火上道测试</span>
          </button>
        </div>
      </header>

      {/* 中间调参滑条区 (卡片网格) */}
      <main className="my-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 1. 引擎增压与点火角 */}
        <div className="rounded-2xl border border-white/10 bg-[#14151a]/90 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-red-400" />
              <span className="text-sm font-bold text-white">增压压力 / 点火角</span>
            </div>
            <button
              onClick={() => handleResetSingle("boostMultiplier")}
              className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] text-amber-400 hover:bg-white/10"
            >
              <RotateCcw className="h-2.5 w-2.5" /> 厂队推荐
            </button>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-bold text-neutral-300">
              <span>增压系数</span>
              <span className="text-[#ff3b30]">{config.tuning.boostMultiplier.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.5"
              step="0.02"
              value={config.tuning.boostMultiplier}
              onChange={(e) => handleUpdateTuning("boostMultiplier", parseFloat(e.target.value))}
              className="w-full accent-[#ff3b30]"
            />
            <p className="text-[11px] text-neutral-400">
              调大增压马力更强，但起步扭矩过大容易导致轮胎持续冒烟打滑。
            </p>
          </div>
        </div>

        {/* 2. 标定红线转速 */}
        <div className="rounded-2xl border border-white/10 bg-[#14151a]/90 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-bold text-white">红线断油转速 (RPM)</span>
            </div>
            <button
              onClick={() => handleResetSingle("redlineRpm")}
              className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] text-amber-400 hover:bg-white/10"
            >
              <RotateCcw className="h-2.5 w-2.5" /> 厂队推荐
            </button>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-bold text-neutral-300">
              <span>最高转速</span>
              <span className="text-orange-400">{config.tuning.redlineRpm} RPM</span>
            </div>
            <input
              type="range"
              min="5500"
              max="12000"
              step="100"
              value={config.tuning.redlineRpm}
              onChange={(e) => handleUpdateTuning("redlineRpm", parseInt(e.target.value))}
              className="w-full accent-orange-500"
            />
            <p className="text-[11px] text-neutral-400">
              拉高红线可延长各挡极速，减少换挡次数以节省时间。
            </p>
          </div>
        </div>

        {/* 3. 终传主减速比 (Final Drive) */}
        <div className="rounded-2xl border border-white/10 bg-[#14151a]/90 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-bold text-white">主减速比 (Final Drive)</span>
            </div>
            <button
              onClick={() => handleResetSingle("finalDriveRatio")}
              className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] text-amber-400 hover:bg-white/10"
            >
              <RotateCcw className="h-2.5 w-2.5" /> 厂队推荐
            </button>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-bold text-neutral-300">
              <span>终传比</span>
              <span className="text-yellow-400">{config.tuning.finalDriveRatio.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="2.4"
              max="4.8"
              step="0.05"
              value={config.tuning.finalDriveRatio}
              onChange={(e) => handleUpdateTuning("finalDriveRatio", parseFloat(e.target.value))}
              className="w-full accent-yellow-500"
            />
            <p className="text-[11px] text-neutral-400">
              调大主减速比起步初段冲刺更猛；调小主减速比有利于冲线尾速。
            </p>
          </div>
        </div>

        {/* 4. 轮胎胎压 (Tire Pressure) */}
        <div className="rounded-2xl border border-white/10 bg-[#14151a]/90 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Disc className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-bold text-white">轮胎气压 (PSI)</span>
            </div>
            <button
              onClick={() => handleResetSingle("tirePressurePsi")}
              className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] text-amber-400 hover:bg-white/10"
            >
              <RotateCcw className="h-2.5 w-2.5" /> 厂队推荐
            </button>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-bold text-neutral-300">
              <span>后轮气压</span>
              <span className="text-blue-400">{config.tuning.tirePressurePsi} PSI</span>
            </div>
            <input
              type="range"
              min="12"
              max="35"
              step="1"
              value={config.tuning.tirePressurePsi}
              onChange={(e) => handleUpdateTuning("tirePressurePsi", parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
            <p className="text-[11px] text-neutral-400">
              低胎压 (14~18 PSI) 接触面大、起步抓地强；高胎压高速阻力更小。
            </p>
          </div>
        </div>

        {/* 5. 氮气起喷转速阈值 */}
        <div className="rounded-2xl border border-white/10 bg-[#14151a]/90 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-bold text-white">氮气自动起喷转速</span>
            </div>
            <button
              onClick={() => handleResetSingle("nosTriggerRpm")}
              className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] text-amber-400 hover:bg-white/10"
            >
              <RotateCcw className="h-2.5 w-2.5" /> 厂队推荐
            </button>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-bold text-neutral-300">
              <span>起喷阈值</span>
              <span className="text-cyan-400">{config.tuning.nosTriggerRpm} RPM</span>
            </div>
            <input
              type="range"
              min="3000"
              max="7500"
              step="100"
              value={config.tuning.nosTriggerRpm}
              onChange={(e) => handleUpdateTuning("nosTriggerRpm", parseInt(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <p className="text-[11px] text-neutral-400">
              自动模式下到达此转速将自动引燃氮气爆发，避免在 0 速度低转打滑时浪费氮气。
            </p>
          </div>
        </div>

        {/* 6. 尾翼攻角与下压力 */}
        <div className="rounded-2xl border border-white/10 bg-[#14151a]/90 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-bold text-white">尾翼攻角 (下压力 vs 阻力)</span>
            </div>
            <button
              onClick={() => handleResetSingle("wingAngleDeg")}
              className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] text-amber-400 hover:bg-white/10"
            >
              <RotateCcw className="h-2.5 w-2.5" /> 厂队推荐
            </button>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-bold text-neutral-300">
              <span>攻角</span>
              <span className="text-emerald-400">{config.tuning.wingAngleDeg}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={config.tuning.wingAngleDeg}
              onChange={(e) => handleUpdateTuning("wingAngleDeg", parseInt(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <p className="text-[11px] text-neutral-400">
              大攻角高速下压力更稳，但微幅增加风阻；0度攻角极速最高。
            </p>
          </div>
        </div>
      </main>

      {/* 底部实时预估变动提醒 */}
      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-neutral-900/80 p-3.5 text-xs backdrop-blur-md">
        <div className="flex items-center gap-2 text-neutral-300">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <span>参数修改已即时同步至物理引擎 · 当前推重比：</span>
          <span className="font-bold text-amber-400">{specs.powerToWeightRatio} HP/t</span>
        </div>
        <div className="text-neutral-400">
          预估 1/4 英里用时：<span className="font-bold text-[#ff3b30]">{specs.quarterMileSecEst} 秒</span>
        </div>
      </footer>
    </div>
  );
};
