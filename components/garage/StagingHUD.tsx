// components/garage/StagingHUD.tsx
// Redline Garage - High-Impact Drag Race HUD & Telemetry Gauges

import React from "react";
import {
  Flame,
  Camera,
  RotateCcw,
  Zap,
  Gauge,
  Activity,
  ChevronsUp,
  ChevronsDown,
  Sparkles,
} from "lucide-react";
import { RaceTelemetry } from "@/lib/garage/types";
import { soundEngine } from "@/lib/audio/soundEngine";

interface StagingHUDProps {
  telemetry: RaceTelemetry;
  maxRpm: number;
  countdownStep: number; // 0=未起步/烧胎, 1..4=倒数黄灯, 5=绿灯发车
  cameraMode: "chase" | "hood" | "side";
  autoMode: boolean;
  burnoutTempBonus: number;
  isBurningOut: boolean;
  onStartCountdown: () => void;
  onSetCameraMode: (mode: "chase" | "hood" | "side") => void;
  onToggleAutoMode: () => void;
  onStartBurnout: () => void;
  onStopBurnout: () => void;
  onManualThrottleChange: (th: number) => void;
  onManualShiftUp: () => void;
  onManualShiftDown: () => void;
  onTriggerNos: () => void;
  onRestartRace: () => void;
  onBackToGarage: () => void;
}

export const StagingHUD: React.FC<StagingHUDProps> = ({
  telemetry,
  maxRpm,
  countdownStep,
  cameraMode,
  autoMode,
  burnoutTempBonus,
  isBurningOut,
  onStartCountdown,
  onSetCameraMode,
  onToggleAutoMode,
  onStartBurnout,
  onStopBurnout,
  onManualThrottleChange,
  onManualShiftUp,
  onManualShiftDown,
  onTriggerNos,
  onRestartRace,
  onBackToGarage,
}) => {
  const isRacing = countdownStep === 5;
  const isCountdownActive = countdownStep >= 1 && countdownStep <= 4;
  const isStaged = countdownStep === 0;

  const rpmPercent = Math.min(100, Math.max(0, (telemetry.rpm / maxRpm) * 100));
  const isRedline = telemetry.rpm >= maxRpm - 200;

  const distancePercent = Math.min(100, (telemetry.distanceMeters / 402.33) * 100);

  return (
    <div className="pointer-events-none relative flex h-full w-full flex-col justify-between p-4 md:p-6 select-none">
      {/* 顶部：倒数状态、距离进度条与赛道机位切换 */}
      <header className="pointer-events-auto flex items-center justify-between gap-4">
        {/* 左侧：返回与重赛 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundEngine.stopEngineSound();
              onBackToGarage();
            }}
            className="rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-xs font-bold text-neutral-300 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white"
          >
            回车库
          </button>
          <button
            onClick={onRestartRace}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-xs font-bold text-neutral-300 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>重新起步</span>
          </button>
        </div>

        {/* 中间：400米跑道距离进度 */}
        <div className="flex flex-1 max-w-md flex-col gap-1 items-center">
          <div className="flex w-full justify-between text-[11px] font-bold text-neutral-400">
            <span>起点 (0m)</span>
            <span className="text-white">
              {telemetry.distanceMeters.toFixed(1)} / 402.3m (1/4英里)
            </span>
            <span className="text-[#ff3b30]">终点龙门</span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-black/60 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-[#ff3b30] transition-all duration-75"
              style={{ width: `${distancePercent}%` }}
            />
            {/* 60ft 与 200m 分段点 */}
            <div className="absolute top-0 bottom-0 left-[4.5%] w-0.5 bg-white/40" title="60英尺" />
            <div className="absolute top-0 bottom-0 left-[50%] w-0.5 bg-white/40" title="200米 (1/8英里)" />
          </div>
        </div>

        {/* 右侧：视角切换与手动/自动挡切换 */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleAutoMode}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all backdrop-blur-md ${
              autoMode
                ? "border-green-500/40 bg-green-500/15 text-green-400"
                : "border-amber-500/40 bg-amber-500/15 text-amber-300"
            }`}
          >
            {autoMode ? "自动挡 + 自动弹射" : "手动进阶操控"}
          </button>

          <button
            onClick={() => {
              const modes: ("chase" | "hood" | "side")[] = ["chase", "hood", "side"];
              const nextIdx = (modes.indexOf(cameraMode) + 1) % modes.length;
              onSetCameraMode(modes[nextIdx]);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-xs font-bold text-neutral-300 backdrop-blur-md hover:bg-white/10 hover:text-white"
          >
            <Camera className="h-3.5 w-3.5" />
            <span>
              {cameraMode === "chase" ? "追尾视角" : cameraMode === "hood" ? "贴地机盖" : "侧方追焦"}
            </span>
          </button>
        </div>
      </header>

      {/* 预备起跑仪式感：圣诞树大字提示与烧胎按钮 */}
      {isStaged && (
        <div className="pointer-events-auto my-auto mx-auto flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-black/75 p-6 text-center backdrop-blur-xl shadow-2xl max-w-sm">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#ff3b30]">
            <Sparkles className="h-4 w-4" />
            <span>已停入起跑线 (STAGED)</span>
          </div>

          <p className="text-xs text-neutral-300">
            起步前可先长按烧胎预热轮胎，提高胎温与初始抓地力！
          </p>

          {/* 轮胎热量计 */}
          <div className="w-full space-y-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-neutral-400">胎温预热抓地增益</span>
              <span className="text-orange-400">
                +{(burnoutTempBonus * 0.4).toFixed(1)}% 抓地力
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all"
                style={{ width: `${Math.min(100, burnoutTempBonus * 2)}%` }}
              />
            </div>
          </div>

          {/* 烧胎与发车按钮 */}
          <div className="grid grid-cols-2 gap-3 w-full pt-2">
            <button
              onMouseDown={onStartBurnout}
              onMouseUp={onStopBurnout}
              onTouchStart={onStartBurnout}
              onTouchEnd={onStopBurnout}
              className={`flex items-center justify-center gap-1.5 rounded-xl border py-3 text-xs font-black transition-all ${
                isBurningOut
                  ? "border-red-500 bg-red-600 text-white animate-pulse"
                  : "border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
              }`}
            >
              <Flame className="h-4 w-4" />
              <span>按住烧胎 (Burnout)</span>
            </button>

            <button
              onClick={onStartCountdown}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-3 text-xs font-black text-black shadow-lg shadow-green-950/40 hover:brightness-110 active:scale-95"
            >
              <span>点亮圣诞树发车</span>
            </button>
          </div>
        </div>
      )}

      {/* 圣诞树倒数倒计时遮罩 (黄、黄、黄、绿！) */}
      {isCountdownActive && (
        <div className="pointer-events-none my-auto mx-auto flex flex-col items-center gap-2">
          <div className="flex gap-3">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-12 w-12 rounded-full border-2 border-white/20 transition-all duration-100 ${
                  countdownStep > step
                    ? "bg-amber-400 shadow-[0_0_30px_#ffb300]"
                    : "bg-neutral-900"
                }`}
              />
            ))}
          </div>
          <span className="text-2xl font-black italic tracking-widest text-amber-400 animate-pulse">
            READY...
          </span>
        </div>
      )}

      {countdownStep === 5 && telemetry.distanceMeters < 30 && (
        <div className="pointer-events-none my-auto mx-auto text-6xl font-black italic tracking-widest text-green-400 drop-shadow-[0_0_40px_#00ff66] animate-bounce">
          GREEN! GO GO GO!
        </div>
      )}

      {/* 底部：赛车实时仪表盘 (HUD - 极速大屏、转速表、换挡灯、G值、氮气) */}
      <footer className="pointer-events-auto flex flex-wrap items-end justify-between gap-4">
        {/* 左下：用时与 G-Force 遥测 */}
        <div className="flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-black/70 p-3.5 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-neutral-400">实时计时</span>
            <span className="font-mono text-2xl font-black text-yellow-400">
              {telemetry.timeElapsed.toFixed(3)}s
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">瞬时加速度</span>
            <span className="font-bold text-white">{telemetry.gForce.toFixed(2)} G</span>
          </div>
          {telemetry.tireSlipRatio > 0.1 && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-red-400 animate-pulse">
              <Flame className="h-3.5 w-3.5" />
              <span>轮胎打滑中 (SLIP {Math.round(telemetry.tireSlipRatio * 100)}%)</span>
            </div>
          )}
        </div>

        {/* 居中核心：数字速度表 + 换挡转速光柱 */}
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-black/80 px-6 py-4 backdrop-blur-xl shadow-2xl">
          {/* 换挡提示灯条 (Shift Light) */}
          <div className="flex w-full gap-1">
            {Array.from({ length: 12 }).map((_, idx) => {
              const lit = (idx / 12) * 100 <= rpmPercent;
              const isDanger = idx >= 9;
              return (
                <div
                  key={idx}
                  className={`h-2 flex-1 rounded-sm transition-all duration-75 ${
                    lit
                      ? isDanger
                        ? isRedline
                          ? "bg-red-500 animate-ping shadow-[0_0_12px_#ff0000]"
                          : "bg-red-500"
                        : idx >= 6
                        ? "bg-amber-400"
                        : "bg-green-400"
                      : "bg-white/10"
                  }`}
                />
              );
            })}
          </div>

          {/* 挡位与速度 */}
          <div className="flex items-baseline gap-4 mt-1">
            {/* 挡位大方块 */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-neutral-400 uppercase font-bold">GEAR</span>
              <span className="text-4xl font-black text-[#ff3b30]">{telemetry.currentGear}</span>
            </div>

            {/* 大数字时速 */}
            <div className="flex flex-col items-center">
              <span className="font-mono text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                {Math.round(telemetry.speedKmh)}
              </span>
              <span className="text-xs font-bold tracking-widest text-neutral-400 -mt-1">
                KM / H
              </span>
            </div>

            {/* 转速数字 */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-neutral-400 uppercase font-bold">RPM</span>
              <span className="font-mono text-2xl font-bold text-neutral-200">{telemetry.rpm}</span>
            </div>
          </div>
        </div>

        {/* 右下：氮气喷射按钮与手动换挡控制器 (移动端/桌面触控) */}
        <div className="flex items-center gap-3">
          {/* 氮气瓶指示与触发 */}
          <button
            onClick={onTriggerNos}
            disabled={telemetry.nosRemainingSec <= 0}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-4 py-3 shadow-xl transition-all ${
              telemetry.nosActive
                ? "border-cyan-400 bg-cyan-500 text-black shadow-[0_0_25px_#00d2ff] scale-105"
                : telemetry.nosRemainingSec > 0
                ? "border-cyan-500/40 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                : "border-white/5 bg-white/5 text-neutral-600 opacity-50"
            }`}
          >
            <Flame className="h-6 w-6" />
            <span className="text-xs font-black">NOS 氮气</span>
            <span className="text-[10px]">
              {telemetry.nosRemainingSec.toFixed(1)}s
            </span>
          </button>

          {/* 手动挡位升降按键 (若非全自动) */}
          {!autoMode && (
            <div className="flex flex-col gap-1.5">
              <button
                onClick={onManualShiftUp}
                className="flex items-center justify-center rounded-xl border border-white/20 bg-neutral-800 p-2.5 text-white active:bg-neutral-700"
                title="升挡 (Shift Up)"
              >
                <ChevronsUp className="h-5 w-5" />
              </button>
              <button
                onClick={onManualShiftDown}
                className="flex items-center justify-center rounded-xl border border-white/20 bg-neutral-800 p-2.5 text-white active:bg-neutral-700"
                title="降挡 (Shift Down)"
              >
                <ChevronsDown className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
