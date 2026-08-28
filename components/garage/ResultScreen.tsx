// components/garage/ResultScreen.tsx
// Redline Garage - High-Impact 1/4 Mile Drag Race Results & PB Celebration

import React from "react";
import {
  Trophy,
  RotateCcw,
  Wrench,
  Sparkles,
  Zap,
  Gauge,
  Activity,
  CheckCircle,
  Share2,
} from "lucide-react";
import { RaceResult } from "@/lib/garage/types";
import { soundEngine } from "@/lib/audio/soundEngine";

interface ResultScreenProps {
  result: RaceResult;
  onRestartRace: () => void;
  onBackToGarage: () => void;
  onOpenLeaderboard: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  onRestartRace,
  onBackToGarage,
  onOpenLeaderboard,
}) => {
  // 启发性改车调校建议
  const getTuningTip = () => {
    if (result.quarterMileTime > 8.5) {
      return "建议进入调参台加大增压倍率，或在车库换装大马力 V8/W12 引擎与直线大肥胎！";
    }
    if (result.sixtyFeetTime > 1.35) {
      return "起步 60ft 用时稍长：建议在发车前长按烧胎预热轮胎，并将胎压放低至 15~18 PSI 增强抓地！";
    }
    if (result.trapSpeedKmh < 320) {
      return "后段极速仍有空间：试试调小主减速比，或换装钛合金直通排气与四联装氮气！";
    }
    return "成绩极其亮眼！距离传奇神车纪录仅一步之遥，可尝试微调 2 挡齿比实现无缝换挡！";
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center p-4 md:p-6 select-none bg-black/75 backdrop-blur-2xl">
      <div className="relative flex w-full max-w-2xl flex-col gap-6 rounded-3xl border border-white/15 bg-[#121318]/95 p-6 md:p-8 shadow-2xl">
        {/* 顶部标题与 PB 破纪录全场灯光秀标志 */}
        <div className="text-center space-y-2">
          {result.isPersonalBest ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-gradient-to-r from-yellow-500/20 via-amber-500/30 to-yellow-500/20 px-4 py-1.5 text-xs font-black text-yellow-300 shadow-[0_0_25px_rgba(255,190,0,0.3)] animate-bounce">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <span>恭喜！刷新个人最佳纪录 (NEW PERSONAL BEST!)</span>
            </div>
          ) : (
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
              1/4 英里官方测速大屏
            </span>
          )}

          <h2 className="text-3xl md:text-4xl font-black italic tracking-wider text-white">
            冲线成绩单 (TIMESLIP)
          </h2>
          <p className="text-xs text-neutral-400">{result.carName}</p>
        </div>

        {/* 核心两大成绩大字：四分之一英里用时 & 冲线尾速 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1/4 英里时间 */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/30 bg-gradient-to-b from-red-500/15 to-transparent p-6 text-center shadow-lg">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-300">
              1/4 英里用时 (400M ET)
            </span>
            <div className="font-mono text-5xl md:text-6xl font-black tracking-tight text-[#ff3b30] drop-shadow-[0_0_20px_rgba(255,59,48,0.4)] my-1">
              {result.quarterMileTime.toFixed(3)}
              <span className="text-xl ml-1 font-sans text-neutral-400">s</span>
            </div>
            <span className="text-[11px] text-neutral-400">直线加速金标用时</span>
          </div>

          {/* 尾速 */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-yellow-500/15 to-transparent p-6 text-center shadow-lg">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-300">
              冲线尾速 (TRAP SPEED)
            </span>
            <div className="font-mono text-5xl md:text-6xl font-black tracking-tight text-yellow-400 drop-shadow-[0_0_20px_rgba(255,190,0,0.4)] my-1">
              {result.trapSpeedKmh.toFixed(1)}
              <span className="text-xl ml-1 font-sans text-neutral-400">km/h</span>
            </div>
            <span className="text-[11px] text-neutral-400">终点雷达测速</span>
          </div>
        </div>

        {/* 分段加速与 G 值遥测明细 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
            <span className="block text-[11px] text-neutral-400">0-100 km/h</span>
            <span className="text-lg font-black text-white">
              {result.zeroToHundredTime ? `${result.zeroToHundredTime.toFixed(3)}s` : "-"}
            </span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
            <span className="block text-[11px] text-neutral-400">0-200 km/h</span>
            <span className="text-lg font-black text-white">
              {result.zeroToTwoHundredTime ? `${result.zeroToTwoHundredTime.toFixed(3)}s` : "-"}
            </span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
            <span className="block text-[11px] text-neutral-400">60英尺弹射</span>
            <span className="text-lg font-black text-white">
              {result.sixtyFeetTime ? `${result.sixtyFeetTime.toFixed(3)}s` : "-"}
            </span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
            <span className="block text-[11px] text-neutral-400">最大 G 值</span>
            <span className="text-lg font-black text-white">{result.maxGForce.toFixed(2)} G</span>
          </div>
        </div>

        {/* 调校建议提示 */}
        <div className="flex items-start gap-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-xs text-cyan-200">
          <Wrench className="h-5 w-5 shrink-0 text-cyan-400 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-white">技师调校锦囊：</span>
            <p className="text-neutral-300">{getTuningTip()}</p>
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => {
              soundEngine.playSnapSound();
              onBackToGarage();
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-neutral-800 py-3.5 text-xs font-bold text-white transition-all hover:bg-neutral-700 active:scale-98"
          >
            <Wrench className="h-4 w-4 text-cyan-400" />
            <span>回车库继续改装</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playSnapSound();
              onRestartRace();
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff3b30] to-[#e62117] py-3.5 text-xs font-black text-white shadow-lg shadow-red-950/40 transition-all hover:brightness-110 active:scale-98"
          >
            <RotateCcw className="h-4 w-4" />
            <span>趁热再跑一趟</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playSnapSound();
              onOpenLeaderboard();
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 py-3.5 text-xs font-bold text-yellow-400 transition-all hover:bg-yellow-500/20 active:scale-98"
          >
            <Trophy className="h-4 w-4" />
            <span>查看排行榜</span>
          </button>
        </div>
      </div>
    </div>
  );
};
