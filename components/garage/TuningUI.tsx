// components/garage/TuningUI.tsx
// Redline Garage - Pro Dyno Tuning Workbench with Categorized Sliders & Real-time Performance HUD

import React, { useMemo, useState } from "react";
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
  Timer,
  Activity,
  Layers,
} from "lucide-react";
import { CalculatedSpecs, CarConfig, TuningSettings } from "@/lib/garage/types";
import { getFactoryRecommendedTuning } from "@/lib/garage/catalog";
import { calculateSpecs } from "@/lib/garage/physics";
import { soundEngine } from "@/lib/audio/soundEngine";

interface TuningUIProps {
  config: CarConfig;
  specs: CalculatedSpecs;
  onUpdateConfig: (newConfig: CarConfig) => void;
  onBackToGarage: () => void;
  onGoToRace: () => void;
}

type TuningCategory = "all" | "engine" | "transmission" | "tires" | "nos" | "aero";

export const TuningUI: React.FC<TuningUIProps> = ({
  config,
  onUpdateConfig,
  onBackToGarage,
  onGoToRace,
}) => {
  const [activeCategory, setActiveCategory] = useState<TuningCategory>("all");
  const factorySpecs = getFactoryRecommendedTuning(config);

  // 实时马力机动态计算 (Live Dyno Specs synchronously evaluated on every slider touch)
  const liveSpecs = useMemo(() => calculateSpecs(config), [config]);

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

  const categories = [
    { id: "all", name: "全部调校", icon: Layers },
    { id: "engine", name: "引擎动力", icon: Zap },
    { id: "transmission", name: "变速箱齿比", icon: Sliders },
    { id: "tires", name: "轮胎抓地", icon: Disc },
    { id: "nos", name: "氮气系统", icon: Flame },
    { id: "aero", name: "空气动力", icon: Wind },
  ] as const;

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-y-auto p-4 md:p-6 bg-black/85 backdrop-blur-2xl">
      {/* 1. 顶部工作台标题与操作区 */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundEngine.playSnapSound();
              onBackToGarage();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-neutral-200 transition-all hover:bg-white/20 hover:text-white shadow"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回车库</span>
          </button>
          <div>
            <h2 className="text-xl font-black tracking-wider text-white drop-shadow">
              马力机调参工作台 (DYNO TUNING BENCH)
            </h2>
            <p className="text-xs font-medium text-neutral-300">
              按零件系统微调物理参数 · 顶部大屏实时推算加速与冲线极速
            </p>
          </div>
        </div>

        {/* 一键全套推荐与发车 */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleApplyAllFactory}
            className="flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/20 px-4 py-2 text-xs font-black text-amber-300 shadow-lg shadow-amber-950/40 transition-all hover:bg-amber-500/30 active:scale-95"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>一键套用厂队推荐</span>
          </button>

          <button
            onClick={() => {
              soundEngine.init();
              onGoToRace();
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff3b30] to-[#e62117] px-5 py-2 text-xs font-black text-white shadow-xl shadow-red-900/50 transition-all hover:brightness-110 active:scale-95"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>点火上道测试</span>
          </button>
        </div>
      </header>

      {/* 2. 顶部大数字实时马力机预估大屏 (Real-time Dyno Stats HUD) */}
      <section className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl border border-white/20 bg-gradient-to-r from-neutral-900/95 via-black/95 to-neutral-900/95 shadow-2xl backdrop-blur-xl">
        {/* 1/4 英里预估 */}
        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-300">
            <Timer className="h-3.5 w-3.5 text-[#ff4d4f]" />
            <span>1/4 英里用时预估</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-2xl md:text-3xl font-black text-[#ff4d4f] drop-shadow-[0_0_12px_#ff4d4f]">
              {liveSpecs.quarterMileSecEst}
            </span>
            <span className="text-xs font-bold text-neutral-400">秒</span>
          </div>
        </div>

        {/* 0-100 加速 */}
        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-300">
            <Activity className="h-3.5 w-3.5 text-amber-400" />
            <span>0-100 km/h 加速</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-2xl md:text-3xl font-black text-amber-400 drop-shadow">
              {liveSpecs.zeroToHundredSecEst}
            </span>
            <span className="text-xs font-bold text-neutral-400">秒</span>
          </div>
        </div>

        {/* 理论尾速 */}
        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-300">
            <Gauge className="h-3.5 w-3.5 text-cyan-400" />
            <span>冲线极速 (Top Speed)</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-2xl md:text-3xl font-black text-cyan-300 drop-shadow">
              {liveSpecs.topSpeedKmhEst}
            </span>
            <span className="text-xs font-bold text-neutral-400">KM/H</span>
          </div>
        </div>

        {/* 马力与推重比 */}
        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-300">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            <span>马力 / 推重比</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-2xl md:text-3xl font-black text-emerald-400 drop-shadow">
              {liveSpecs.peakHp}
            </span>
            <span className="text-xs font-bold text-neutral-400">HP ({liveSpecs.powerToWeightRatio} HP/t)</span>
          </div>
        </div>
      </section>

      {/* 3. 零件系统分类筛选页签 (Category Tabs) */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                soundEngine.playSnapSound();
                setActiveCategory(cat.id);
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                isActive
                  ? "border border-[#ff3b30]/60 bg-[#ff3b30]/20 text-white shadow-[0_0_15px_rgba(255,59,48,0.3)]"
                  : "border border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#ff4d4f]" : "text-neutral-400"}`} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* 4. 分组参数调校卡片 (Categorized Sliders) */}
      <main className="my-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* === 引擎系统 === */}
        {(activeCategory === "all" || activeCategory === "engine") && (
          <>
            {/* 增压压力系数 */}
            <div className="rounded-2xl border border-white/15 bg-[#141720]/95 p-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-bold text-white">增压压力 / 点火角</span>
                </div>
                <button
                  onClick={() => handleResetSingle("boostMultiplier")}
                  className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-white/20"
                >
                  <RotateCcw className="h-2.5 w-2.5" /> 厂队推荐
                </button>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs font-bold text-neutral-200">
                  <span>增压系数</span>
                  <span className="text-[#ff4d4f] font-mono font-black">
                    {config.tuning.boostMultiplier.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.02"
                  value={config.tuning.boostMultiplier}
                  onChange={(e) => handleUpdateTuning("boostMultiplier", parseFloat(e.target.value))}
                  className="w-full accent-[#ff3b30] cursor-pointer"
                />
                <p className="text-[11px] font-medium text-neutral-300">
                  调大增压马力更强，但起步扭矩过大容易导致轮胎持续冒烟打滑。
                </p>
              </div>
            </div>

            {/* 红线断油转速 */}
            <div className="rounded-2xl border border-white/15 bg-[#141720]/95 p-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-bold text-white">红线断油转速 (RPM)</span>
                </div>
                <button
                  onClick={() => handleResetSingle("redlineRpm")}
                  className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-white/20"
                >
                  <RotateCcw className="h-2.5 w-2.5" /> 厂队推荐
                </button>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs font-bold text-neutral-200">
                  <span>最高转速</span>
                  <span className="text-orange-400 font-mono font-black">
                    {config.tuning.redlineRpm} RPM
                  </span>
                </div>
                <input
                  type="range"
                  min="5500"
                  max="12000"
                  step="100"
                  value={config.tuning.redlineRpm}
                  onChange={(e) => handleUpdateTuning("redlineRpm", parseInt(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
                <p className="text-[11px] font-medium text-neutral-300">
                  拉高红线可延长各挡极速，减少换挡次数以节省时间。
                </p>
              </div>
            </div>
          </>
        )}

        {/* === 变速箱系统 === */}
        {(activeCategory === "all" || activeCategory === "transmission") && (
          <div className="rounded-2xl border border-white/15 bg-[#141720]/95 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-bold text-white">主减速比 (Final Drive)</span>
              </div>
              <button
                onClick={() => handleResetSingle("finalDriveRatio")}
                className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-white/20"
              >
                <RotateCcw className="h-2.5 w-2.5" /> 厂队推荐
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs font-bold text-neutral-200">
                <span>终传比</span>
                <span className="text-yellow-400 font-mono font-black">
                  {config.tuning.finalDriveRatio.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="2.4"
                max="4.8"
                step="0.05"
                value={config.tuning.finalDriveRatio}
                onChange={(e) => handleUpdateTuning("finalDriveRatio", parseFloat(e.target.value))}
                className="w-full accent-yellow-500 cursor-pointer"
              />
              <p className="text-[11px] font-medium text-neutral-300">
                调大主减速比起步初段冲刺更猛；调小主减速比有利于冲线尾速。
              </p>
            </div>
          </div>
        )}

        {/* === 轮胎抓地系统 === */}
        {(activeCategory === "all" || activeCategory === "tires") && (
          <div className="rounded-2xl border border-white/15 bg-[#141720]/95 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Disc className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-bold text-white">轮胎气压 (PSI)</span>
              </div>
              <button
                onClick={() => handleResetSingle("tirePressurePsi")}
                className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-white/20"
              >
                <RotateCcw className="h-2.5 w-2.5" /> 厂队推荐
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs font-bold text-neutral-200">
                <span>后轮气压</span>
                <span className="text-blue-400 font-mono font-black">
                  {config.tuning.tirePressurePsi} PSI
                </span>
              </div>
              <input
                type="range"
                min="12"
                max="35"
                step="1"
                value={config.tuning.tirePressurePsi}
                onChange={(e) => handleUpdateTuning("tirePressurePsi", parseInt(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <p className="text-[11px] font-medium text-neutral-300">
                低胎压 (14~18 PSI) 接触面大、起步抓地强；高胎压高速阻力更小。
              </p>
            </div>
          </div>
        )}

        {/* === 氮气喷射系统 === */}
        {(activeCategory === "all" || activeCategory === "nos") && (
          <div className="rounded-2xl border border-white/15 bg-[#141720]/95 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-bold text-white">氮气自动起喷转速</span>
              </div>
              <button
                onClick={() => handleResetSingle("nosTriggerRpm")}
                className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-white/20"
              >
                <RotateCcw className="h-2.5 w-2.5" /> 厂队推荐
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs font-bold text-neutral-200">
                <span>起喷阈值</span>
                <span className="text-cyan-300 font-mono font-black">
                  {config.tuning.nosTriggerRpm} RPM
                </span>
              </div>
              <input
                type="range"
                min="3000"
                max="7500"
                step="100"
                value={config.tuning.nosTriggerRpm}
                onChange={(e) => handleUpdateTuning("nosTriggerRpm", parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <p className="text-[11px] font-medium text-neutral-300">
                自动模式下到达此转速将自动引燃氮气爆发，避免在 0 速度低转打滑时浪费氮气。
              </p>
            </div>
          </div>
        )}

        {/* === 空气动力系统 === */}
        {(activeCategory === "all" || activeCategory === "aero") && (
          <div className="rounded-2xl border border-white/15 bg-[#141720]/95 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">尾翼攻角 (下压力 vs 阻力)</span>
              </div>
              <button
                onClick={() => handleResetSingle("wingAngleDeg")}
                className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-white/20"
              >
                <RotateCcw className="h-2.5 w-2.5" /> 厂队推荐
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs font-bold text-neutral-200">
                <span>攻角</span>
                <span className="text-emerald-400 font-mono font-black">
                  {config.tuning.wingAngleDeg}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={config.tuning.wingAngleDeg}
                onChange={(e) => handleUpdateTuning("wingAngleDeg", parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] font-medium text-neutral-300">
                大攻角高速下压力更稳，但微幅增加风阻；0度攻角极速最高。
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 5. 底部实时同步状态条 */}
      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-neutral-900/90 p-4 text-xs backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-2 text-neutral-200 font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>参数修改已即时同步至物理引擎 · 当前抓地力评级：</span>
          <span className="font-bold text-amber-400 font-mono">{liveSpecs.gripScore} 点</span>
        </div>
        <div className="text-neutral-300 font-medium">
          推重比：<span className="font-black text-emerald-400 font-mono">{liveSpecs.powerToWeightRatio} HP/t</span>
        </div>
      </footer>
    </div>
  );
};
