// components/garage/StagingHUD.tsx
// Redline Garage - High-Impact Drag Race HUD with Live Volume Slider & Contrast Tuning

import React from "react";
import {
  Flame,
  Camera,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronsUp,
  ChevronsDown,
  Sparkles,
} from "lucide-react";
import { RaceTelemetry } from "@/lib/garage/types";
import { soundEngine } from "@/lib/audio/soundEngine";

interface StagingHUDProps {
  telemetry: RaceTelemetry;
  maxRpm: number;
  countdownStep: number;
  cameraMode: "chase" | "hood" | "side";
  autoMode: boolean;
  soundEnabled: boolean;
  masterVolume: number;
  burnoutTempBonus: number;
  isBurningOut: boolean;
  onStartCountdown: () => void;
  onSetCameraMode: (mode: "chase" | "hood" | "side") => void;
  onToggleAutoMode: () => void;
  onToggleSound: () => void;
  onChangeVolume: (vol: number) => void;
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
  soundEnabled,
  masterVolume,
  burnoutTempBonus,
  isBurningOut,
  onStartCountdown,
  onSetCameraMode,
  onToggleAutoMode,
  onToggleSound,
  onChangeVolume,
  onStartBurnout,
  onStopBurnout,
  onManualThrottleChange,
  onManualShiftUp,
  onManualShiftDown,
  onTriggerNos,
  onRestartRace,
  onBackToGarage,
}) => {
  const isCountdownActive = countdownStep >= 1 && countdownStep <= 4;
  const isStaged = countdownStep === 0;

  const rpmPercent = Math.min(100, Math.max(0, (telemetry.rpm / maxRpm) * 100));
  const isRedline = telemetry.rpm >= maxRpm - 200;
  const distancePercent = Math.min(100, (telemetry.distanceMeters / 402.33) * 100);

  return (
    <div className="pointer-events-none relative flex h-full w-full flex-col justify-between p-4 md:p-6 select-none">
      {/* 顶部：倒数状态、距离进度条与赛道机位切换 */}
      <header className="pointer-events-auto flex flex-wrap items-center justify-between gap-3">
        {/* 左侧：返回、重赛与音量调节 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundEngine.stopEngineSound();
              onBackToGarage();
            }}
            className="rounded-xl border border-white/20 bg-black/75 px-3 py-1.5 text-xs font-bold text-neutral-200 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white shadow-lg"
          >
            回车库
          </button>
          <button
            onClick={onRestartRace}
            className="flex items-center gap-1 rounded-xl border border-white/20 bg-black/75 px-3 py-1.5 text-xs font-bold text-neutral-200 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white shadow-lg"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>重新起步</span>
          </button>

          {/* HUD 音量滑条 */}
          <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/75 px-2.5 py-1.5 backdrop-blur-md shadow-lg">
            <button
              onClick={() => {
                soundEngine.init();
                onToggleSound();
              }}
              className="text-neutral-300 hover:text-white transition-colors"
              title={soundEnabled ? "静音" : "开启声音"}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-neutral-500" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={soundEnabled ? masterVolume : 0}
              onChange={(e) => {
                soundEngine.init();
                onChangeVolume(parseFloat(e.target.value));
              }}
              className="w-14 md:w-18 accent-[#ff3b30] cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
              title={`音量: ${Math.round(masterVolume * 100)}%`}
            />
          </div>
        </div>

        {/* 中间：400米跑道距离进度 */}
        <div className="flex flex-1 max-w-md flex-col gap-1 items-center">
          <div className="flex w-full justify-between text-[11px] font-bold text-neutral-300">
            <span>起点 (0m)</span>
            <span className="text-white drop-shadow">
              {telemetry.distanceMeters.toFixed(1)} / 402.3m (1/4英里)
            </span>
            <span className="text-[#ff4d4f] font-black">终点龙门</span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-black/80 border border-white/20 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-[#ff3b30] transition-all duration-75 shadow-[0_0_12px_#ff4d4f]"
              style={{ width: `${distancePercent}%` }}
            />
            {/* 60ft 与 200m 分段点 */}
            <div className="absolute top-0 bottom-0 left-[4.5%] w-0.5 bg-white/70" title="60英尺" />
            <div className="absolute top-0 bottom-0 left-[50%] w-0.5 bg-white/70" title="200米 (1/8英里)" />
          </div>
        </div>

        {/* 右侧：视角切换与手动/自动挡切换 */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleAutoMode}
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all backdrop-blur-md shadow-lg ${
              autoMode
                ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                : "border-amber-500/50 bg-amber-500/20 text-amber-300"
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
            className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/75 px-3 py-1.5 text-xs font-bold text-neutral-200 backdrop-blur-md hover:bg-white/10 hover:text-white shadow-lg"
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
        <div className="pointer-events-auto my-auto mx-auto flex flex-col items-center gap-4 rounded-3xl border border-white/20 bg-black/85 p-6 text-center backdrop-blur-2xl shadow-2xl max-w-sm">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#ff4d4f]">
            <Sparkles className="h-4 w-4" />
            <span>已停入起跑线 (STAGED)</span>
          </div>

          <p className="text-xs font-medium text-neutral-200">
            起步前可先长按烧胎预热轮胎，提高胎温与初始抓地力！
          </p>

          {/* 轮胎热量计 */}
          <div className="w-full space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-neutral-300">胎温预热抓地增益</span>
              <span className="text-orange-400 font-mono">
                +{(burnoutTempBonus * 0.4).toFixed(1)}% 抓地力
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/15 overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-red-600 transition-all"
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
              className={`flex items-center justify-center gap-1.5 rounded-2xl border py-3.5 text-xs font-black transition-all shadow-lg ${
                isBurningOut
                  ? "border-red-500 bg-red-600 text-white animate-pulse"
                  : "border-orange-500/50 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"
              }`}
            >
              <Flame className="h-4 w-4" />
              <span>按住烧胎 (Burnout)</span>
            </button>

            <button
              onClick={onStartCountdown}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 py-3.5 text-xs font-black text-black shadow-xl shadow-green-950/50 hover:brightness-110 active:scale-95"
            >
              <span>点亮圣诞树发车</span>
            </button>
          </div>
        </div>
      )}

      {/* 圣诞树倒数倒计时遮罩 (黄、黄、黄、绿！) */}
      {isCountdownActive && (
        <div className="pointer-events-none my-auto mx-auto flex flex-col items-center gap-3">
          <div className="flex gap-4">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-14 w-14 rounded-full border-2 border-white/30 transition-all duration-100 ${
                  countdownStep > step
                    ? "bg-amber-400 shadow-[0_0_40px_#ffb300]"
                    : "bg-neutral-900"
                }`}
              />
            ))}
          </div>
          <span className="text-3xl font-black italic tracking-widest text-amber-400 animate-pulse drop-shadow-[0_0_20px_#ffb300]">
            READY...
          </span>
        </div>
      )}

      {countdownStep === 5 && telemetry.distanceMeters < 35 && (
        <div className="pointer-events-none my-auto mx-auto text-6xl md:text-7xl font-black italic tracking-widest text-emerald-400 drop-shadow-[0_0_50px_#00ff66] animate-bounce">
          GREEN! GO GO GO!
        </div>
      )}

      {/* 底部：赛车实时仪表盘 (HUD - 极速大屏、转速表、换挡灯、G值、氮气) */}
      <footer className="pointer-events-auto flex flex-wrap items-end justify-between gap-4">
        {/* 左下：用时与 G-Force 遥测 */}
        <div className="flex flex-col gap-1.5 rounded-2xl border border-white/20 bg-black/80 p-4 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-neutral-300">实时计时</span>
            <span className="font-mono text-2xl md:text-3xl font-black text-yellow-300 drop-shadow">
              {telemetry.timeElapsed.toFixed(3)}s
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-300 font-medium">瞬时加速度</span>
            <span className="font-bold text-white font-mono">{telemetry.gForce.toFixed(2)} G</span>
          </div>
          {telemetry.tireSlipRatio > 0.1 && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#ff4d4f] animate-pulse">
              <Flame className="h-3.5 w-3.5" />
              <span>轮胎打滑中 (SLIP {Math.round(telemetry.tireSlipRatio * 100)}%)</span>
            </div>
          )}
        </div>

        {/* 居中核心：数字速度表 + 换挡转速光柱 */}
        <div className="flex flex-col items-center gap-1.5 rounded-3xl border border-white/20 bg-black/85 px-7 py-4 backdrop-blur-2xl shadow-2xl">
          {/* 换挡提示灯条 (Shift Light) */}
          <div className="flex w-full gap-1">
            {Array.from({ length: 12 }).map((_, idx) => {
              const lit = (idx / 12) * 100 <= rpmPercent;
              const isDanger = idx >= 9;
              return (
                <div
                  key={idx}
                  className={`h-2.5 flex-1 rounded-sm transition-all duration-75 ${
                    lit
                      ? isDanger
                        ? isRedline
                          ? "bg-red-500 animate-ping shadow-[0_0_15px_#ff0000]"
                          : "bg-red-500 shadow-[0_0_8px_#ff0000]"
                        : idx >= 6
                        ? "bg-amber-400 shadow-[0_0_8px_#ffaa00]"
                        : "bg-emerald-400 shadow-[0_0_8px_#00ff66]"
                      : "bg-white/10"
                  }`}
                />
              );
            })}
          </div>

          {/* 挡位与速度 */}
          <div className="flex items-baseline gap-5 mt-1">
            {/* 挡位大方块 */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-neutral-300 uppercase font-black">GEAR</span>
              <span className="font-mono text-4xl md:text-5xl font-black text-[#ff4d4f] drop-shadow">
                {telemetry.currentGear}
              </span>
            </div>

            {/* 大数字时速 */}
            <div className="flex flex-col items-center">
              <span className="font-mono text-6xl md:text-7xl font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">
                {Math.round(telemetry.speedKmh)}
              </span>
              <span className="text-xs font-black tracking-widest text-neutral-300 -mt-1">
                KM / H
              </span>
            </div>

            {/* 转速数字 */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-neutral-300 uppercase font-black">RPM</span>
              <span className="font-mono text-2xl md:text-3xl font-bold text-neutral-100 drop-shadow">
                {telemetry.rpm}
              </span>
            </div>
          </div>
        </div>

        {/* 右下：氮气喷射按钮与手动换挡控制器 */}
        <div className="flex items-center gap-3">
          {/* 氮气瓶指示与触发 */}
          <button
            onClick={onTriggerNos}
            disabled={telemetry.nosRemainingSec <= 0}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-5 py-3.5 shadow-2xl transition-all ${
              telemetry.nosActive
                ? "border-cyan-400 bg-cyan-500 text-black shadow-[0_0_30px_#00d2ff] scale-105"
                : telemetry.nosRemainingSec > 0
                ? "border-cyan-500/50 bg-cyan-500/25 text-cyan-200 hover:bg-cyan-500/35"
                : "border-white/10 bg-white/5 text-neutral-600 opacity-50"
            }`}
          >
            <Flame className="h-6 w-6" />
            <span className="text-xs font-black">NOS 氮气</span>
            <span className="text-[10px] font-mono font-bold">
              {telemetry.nosRemainingSec.toFixed(1)}s
            </span>
          </button>

          {/* 手动挡位升降按键 */}
          {!autoMode && (
            <div className="flex flex-col gap-2">
              <button
                onClick={onManualShiftUp}
                className="flex items-center justify-center rounded-xl border border-white/30 bg-neutral-800/90 p-3 text-white active:bg-neutral-700 shadow-lg"
                title="升挡 (Shift Up)"
              >
                <ChevronsUp className="h-5 w-5" />
              </button>
              <button
                onClick={onManualShiftDown}
                className="flex items-center justify-center rounded-xl border border-white/30 bg-neutral-800/90 p-3 text-white active:bg-neutral-700 shadow-lg"
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
