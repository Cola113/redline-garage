// components/garage/LeaderboardModal.tsx
// Redline Garage - Local Best Records & Leaderboard Modal

import React from "react";
import { Trophy, X, Flame, Sparkles, Clock, Zap } from "lucide-react";
import { RaceResult } from "@/lib/garage/types";
import { soundEngine } from "@/lib/audio/soundEngine";

interface LeaderboardModalProps {
  records: RaceResult[];
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  records,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md select-none">
      <div className="relative flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-white/15 bg-[#14151a] p-6 shadow-2xl">
        {/* 顶部标题与关闭 */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-500/20 text-yellow-400">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">红线荣誉榜 · 1/4 英里最佳战绩</h3>
              <p className="text-xs text-neutral-400">已自动持久化保存于本地浏览器缓存</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playSnapSound();
              onClose();
            }}
            className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 成绩列表 */}
        <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1 scrollbar-thin">
          {records.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              暂无比赛记录，快去直线赛道点火跑一趟吧！
            </div>
          ) : (
            records.map((rec, idx) => {
              const isTop1 = idx === 0;
              const isTop3 = idx < 3;
              return (
                <div
                  key={rec.id || idx}
                  className={`flex items-center justify-between rounded-xl border p-3.5 transition-all ${
                    isTop1
                      ? "border-yellow-500/40 bg-yellow-500/10 shadow-lg"
                      : isTop3
                      ? "border-white/15 bg-white/[0.04]"
                      : "border-white/5 bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* 名次角标 */}
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg font-mono text-sm font-black ${
                        idx === 0
                          ? "bg-yellow-500 text-black shadow-md shadow-yellow-500/40"
                          : idx === 1
                          ? "bg-neutral-300 text-black"
                          : idx === 2
                          ? "bg-amber-700 text-white"
                          : "bg-white/10 text-neutral-400"
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{rec.carName}</span>
                        {rec.isPersonalBest && (
                          <span className="rounded bg-yellow-500/20 px-1.5 py-0.2 text-[9px] font-bold text-yellow-300">
                            PB
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                        <span>0-100: {rec.zeroToHundredTime ? `${rec.zeroToHundredTime.toFixed(2)}s` : "-"}</span>
                        <span>尾速: {rec.trapSpeedKmh.toFixed(1)} km/h</span>
                      </div>
                    </div>
                  </div>

                  {/* 1/4 英里用时 */}
                  <div className="text-right">
                    <div className="font-mono text-xl font-black text-[#ff3b30]">
                      {rec.quarterMileTime.toFixed(3)}s
                    </div>
                    <span className="text-[10px] text-neutral-500">
                      {new Date(rec.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
