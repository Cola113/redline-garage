// components/garage/GarageUI.tsx
// Redline Garage - Supercar Showroom Turntable Layout with Clear Viewport

import React, { useState } from "react";
import {
  Flame,
  Volume2,
  VolumeX,
  Trophy,
  Play,
  Sliders,
  Check,
  Palette,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BlueprintSlot,
  CalculatedSpecs,
  CarConfig,
  PartCategory,
  QualitySetting,
} from "@/lib/garage/types";
import {
  PAINT_COLORS,
  PARTS_CATALOG,
  PART_CATEGORIES,
  PRESET_BUILDS,
} from "@/lib/garage/catalog";
import { soundEngine } from "@/lib/audio/soundEngine";

interface GarageUIProps {
  config: CarConfig;
  specs: CalculatedSpecs;
  blueprints: BlueprintSlot[];
  activeSlot: number;
  quality: QualitySetting;
  soundEnabled: boolean;
  masterVolume: number;
  onUpdateConfig: (newConfig: CarConfig) => void;
  onSelectSlot: (slotIdx: number) => void;
  onSaveSlot: (slotIdx: number, name: string) => void;
  onGoToTuning: () => void;
  onGoToRace: () => void;
  onOpenLeaderboard: () => void;
  onToggleSound: () => void;
  onChangeVolume: (vol: number) => void;
  onChangeQuality: (q: QualitySetting) => void;
}

export const GarageUI: React.FC<GarageUIProps> = ({
  config,
  specs,
  blueprints,
  activeSlot,
  quality,
  soundEnabled,
  masterVolume,
  onUpdateConfig,
  onSelectSlot,
  onSaveSlot,
  onGoToTuning,
  onGoToRace,
  onOpenLeaderboard,
  onToggleSound,
  onChangeVolume,
  onChangeQuality,
}) => {
  const [activeCategory, setActiveCategory] = useState<PartCategory | "paint" | "presets">("chassis");
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);

  const handleSelectPart = (category: PartCategory, partId: string) => {
    soundEngine.playSnapSound();
    const nextConfig = { ...config };
    if (category === "chassis") nextConfig.chassisId = partId;
    if (category === "engine") nextConfig.engineId = partId;
    if (category === "transmission") nextConfig.transmissionId = partId;
    if (category === "tires") nextConfig.tiresId = partId;
    if (category === "nos") nextConfig.nosId = partId;
    if (category === "aero") nextConfig.aeroId = partId;
    if (category === "exhaust") nextConfig.exhaustId = partId;
    onUpdateConfig(nextConfig);
  };

  const handleSelectPaint = (hex: string) => {
    soundEngine.playSnapSound();
    onUpdateConfig({ ...config, paintColor: hex });
  };

  const handleSelectFinish = (finish: "metallic" | "matte" | "chrome" | "gloss") => {
    soundEngine.playSnapSound();
    onUpdateConfig({ ...config, paintFinish: finish });
  };

  const handleApplyPreset = (presetConfig: CarConfig) => {
    soundEngine.playSnapSound();
    onUpdateConfig(JSON.parse(JSON.stringify(presetConfig)));
  };

  const getActivePartId = (cat: PartCategory): string => {
    if (cat === "chassis") return config.chassisId;
    if (cat === "engine") return config.engineId;
    if (cat === "transmission") return config.transmissionId;
    if (cat === "tires") return config.tiresId;
    if (cat === "nos") return config.nosId;
    if (cat === "aero") return config.aeroId;
    if (cat === "exhaust") return config.exhaustId;
    return "";
  };

  return (
    <div className="pointer-events-none relative flex h-full w-full flex-col justify-between p-3 md:p-5">
      {/* 顶部状态栏与工具栏 */}
      <header className="pointer-events-auto flex flex-wrap items-center justify-between gap-3">
        {/* LOGO */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff3b30] to-[#b3140b] shadow-xl shadow-red-950/60">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-wider text-white drop-shadow">红线车库</span>
              <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-black tracking-widest text-[#ff4d4f] border border-red-500/30">
                REDLINE GARAGE
              </span>
            </div>
            <p className="text-xs font-medium text-neutral-300">沙盒直线加速赛 · 零门槛全自由改装</p>
          </div>
        </div>

        {/* 顶部操作按钮组 */}
        <div className="flex items-center gap-2.5">
          {/* 主音量调节滑条与静音键 */}
          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/80 px-3 py-1.5 backdrop-blur-xl shadow-xl">
            <button
              onClick={() => {
                soundEngine.init();
                onToggleSound();
              }}
              className="text-neutral-300 hover:text-white transition-colors"
              title={soundEnabled ? "点击静音" : "点击开启声音"}
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
              className="w-16 md:w-20 accent-[#ff3b30] cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
              title={`主音量: ${Math.round(masterVolume * 100)}%`}
            />
            <span className="font-mono text-[11px] font-bold text-neutral-200 w-7 text-right">
              {soundEnabled ? `${Math.round(masterVolume * 100)}%` : "0%"}
            </span>
          </div>

          {/* 画质切换 */}
          <div className="flex items-center rounded-xl border border-white/15 bg-black/80 p-1 backdrop-blur-xl shadow-xl">
            {(["low", "medium", "high"] as QualitySetting[]).map((q) => (
              <button
                key={q}
                onClick={() => onChangeQuality(q)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  quality === q
                    ? "bg-[#ff3b30] text-white shadow"
                    : "text-neutral-300 hover:text-white"
                }`}
              >
                {q === "high" ? "极高" : q === "medium" ? "均衡" : "性能"}
              </button>
            ))}
          </div>

          {/* 排行榜 */}
          <button
            onClick={() => {
              soundEngine.init();
              onOpenLeaderboard();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-yellow-500/40 bg-yellow-500/15 px-3.5 py-1.5 text-xs font-bold text-yellow-300 backdrop-blur-xl transition-all hover:bg-yellow-500/25 shadow-xl shadow-yellow-950/30"
          >
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span>纪录榜</span>
          </button>
        </div>
      </header>

      {/* 主体交互区：左浮动零件柜 + 右浮动性能大屏 (保留开阔的 3D 中间展台) */}
      <div className="my-auto flex flex-1 items-center justify-between gap-4 pointer-events-none overflow-hidden py-2">
        {/* 左侧：零件分类抽屉 */}
        <div className="pointer-events-auto flex flex-col gap-2.5 rounded-3xl border border-white/15 bg-black/85 p-4 shadow-2xl backdrop-blur-2xl w-full max-w-sm md:max-w-md max-h-[64vh]">
          {/* 分类 Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {PART_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    soundEngine.init();
                    soundEngine.playSnapSound();
                    setActiveCategory(cat.id);
                  }}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[#ff3b30] text-white shadow-md shadow-red-900/50"
                      : "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              );
            })}
            {/* 车漆与预设 */}
            <button
              onClick={() => {
                soundEngine.init();
                soundEngine.playSnapSound();
                setActiveCategory("paint");
              }}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                activeCategory === "paint"
                  ? "bg-[#ff3b30] text-white shadow-md"
                  : "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>车漆</span>
            </button>
            <button
              onClick={() => {
                soundEngine.init();
                soundEngine.playSnapSound();
                setActiveCategory("presets");
              }}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                activeCategory === "presets"
                  ? "bg-amber-400 text-black shadow-md font-black"
                  : "bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>厂队神车</span>
            </button>
          </div>

          {/* 零件列表 */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {activeCategory !== "paint" && activeCategory !== "presets" && (
              PARTS_CATALOG[activeCategory].map((part) => {
                const isEquipped = getActivePartId(activeCategory) === part.id;
                return (
                  <div
                    key={part.id}
                    onClick={() => handleSelectPart(activeCategory, part.id)}
                    className={`group relative flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-all ${
                      isEquipped
                        ? "border-[#ff3b30] bg-[#ff3b30]/20 shadow-lg shadow-red-950/40"
                        : "border-white/10 bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.08]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white group-hover:text-[#ff4d4f] transition-colors">
                          {part.name}
                        </span>
                        <span className="text-xs text-neutral-400">({part.weightKg} kg)</span>
                      </div>
                      {isEquipped ? (
                        <div className="flex items-center gap-1 rounded-full bg-[#ff3b30] px-2.5 py-0.5 text-[10px] font-black text-white shadow">
                          <Check className="h-3 w-3" />
                          已装载
                        </div>
                      ) : (
                        <button className="rounded-lg bg-white/10 px-2 py-0.5 text-[10px] font-bold text-neutral-300 group-hover:bg-[#ff3b30] group-hover:text-white transition-all">
                          装载
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-neutral-300 line-clamp-1">{part.description}</p>

                    {/* 参数特性徽章 */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {part.baseHp && (
                        <span className="rounded bg-red-500/20 border border-red-500/30 px-1.5 py-0.2 text-[10px] font-bold text-red-300">
                          {part.baseHp} HP
                        </span>
                      )}
                      {part.torqueNm && (
                        <span className="rounded bg-orange-500/20 border border-orange-500/30 px-1.5 py-0.2 text-[10px] font-bold text-orange-300">
                          {part.torqueNm} Nm
                        </span>
                      )}
                      {part.gripCoefficient && (
                        <span className="rounded bg-blue-500/20 border border-blue-500/30 px-1.5 py-0.2 text-[10px] font-bold text-blue-300">
                          抓地 {part.gripCoefficient}
                        </span>
                      )}
                      {part.gearCount && (
                        <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.2 text-[10px] font-bold text-emerald-300">
                          {part.gearCount} 速 ({part.shiftDelayMs}ms)
                        </span>
                      )}
                      {part.nosShotHp && part.nosShotHp > 0 && (
                        <span className="rounded bg-cyan-500/20 border border-cyan-500/30 px-1.5 py-0.2 text-[10px] font-bold text-cyan-200">
                          +{part.nosShotHp} HP NOS
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* 车漆与质感配置 */}
            {activeCategory === "paint" && (
              <div className="space-y-3 p-1">
                <div className="grid grid-cols-4 gap-2">
                  {PAINT_COLORS.map((p) => (
                    <button
                      key={p.hex}
                      onClick={() => handleSelectPaint(p.hex)}
                      className={`group flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all ${
                        config.paintColor === p.hex
                          ? "border-[#ff3b30] bg-white/10 shadow"
                          : "border-white/10 bg-white/5 hover:border-white/30"
                      }`}
                    >
                      <div
                        className="h-7 w-7 rounded-full border-2 border-white/40 shadow"
                        style={{ backgroundColor: p.hex }}
                      />
                      <span className="text-[10px] font-bold text-neutral-200">
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[
                    { id: "metallic", label: "金属高光" },
                    { id: "matte", label: "哑光磨砂" },
                    { id: "chrome", label: "全镀铬" },
                    { id: "gloss", label: "清漆镜面" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleSelectFinish(f.id as any)}
                      className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all ${
                        config.paintFinish === f.id
                          ? "border-[#ff3b30] bg-[#ff3b30] text-white shadow"
                          : "border-white/10 bg-white/5 text-neutral-300 hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 厂队预设配置 */}
            {activeCategory === "presets" && (
              <div className="space-y-2.5 p-1">
                {PRESET_BUILDS.map((preset, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/[0.08] p-3 shadow"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        <span className="text-xs font-black text-amber-300">{preset.name}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-neutral-300">{preset.desc}</p>
                    </div>
                    <button
                      onClick={() => handleApplyPreset(preset.config)}
                      className="self-end rounded-lg bg-amber-400 px-3 py-1 text-[11px] font-black text-black transition-all hover:bg-amber-300 active:scale-95 shadow"
                    >
                      一键装备
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：实时数据遥测大屏 & 蓝图槽位 & 主操作按钮 */}
        <div className="pointer-events-auto flex flex-col gap-2.5 rounded-3xl border border-white/15 bg-black/85 p-4 shadow-2xl backdrop-blur-2xl w-full max-w-xs md:max-w-sm">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#ff4d4f]">
              实时标定遥测
            </span>
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-neutral-200">
              400M 直线规格
            </span>
          </div>

          {/* 核心三项大数字 */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
              <span className="block text-[10px] font-medium text-neutral-400">综合马力</span>
              <span className="text-xl font-black text-white">{specs.peakHp}</span>
              <span className="text-[9px] text-neutral-400 block font-bold">HP</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
              <span className="block text-[10px] font-medium text-neutral-400">峰值扭矩</span>
              <span className="text-xl font-black text-white">{specs.peakTorqueNm}</span>
              <span className="text-[9px] text-neutral-400 block font-bold">Nm</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
              <span className="block text-[10px] font-medium text-neutral-400">整备质量</span>
              <span className="text-xl font-black text-white">{specs.totalWeightKg}</span>
              <span className="text-[9px] text-neutral-400 block font-bold">kg</span>
            </div>
          </div>

          {/* 预测加速与推重比 */}
          <div className="space-y-1.5 rounded-xl bg-black/60 p-3 border border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300">推重比</span>
              <span className="font-bold text-[#ffb84d] font-mono">{specs.powerToWeightRatio} HP/t</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300">0-100 km/h</span>
              <span className="font-bold text-emerald-400 font-mono">{specs.zeroToHundredSecEst} 秒</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300">1/4 英里 (400米)</span>
              <span className="font-black text-[#ff4d4f] font-mono">{specs.quarterMileSecEst} 秒</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300">预估极速</span>
              <span className="font-bold text-cyan-300 font-mono">{specs.topSpeedKmhEst} km/h</span>
            </div>
          </div>

          {/* 蓝图 3 槽位 */}
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between text-[11px] text-neutral-300">
              <span className="font-bold">蓝图槽位 (本地存储)</span>
              <button
                onClick={() => {
                  const name = prompt("请输入蓝图名称：", `改装车 #${activeSlot + 1}`);
                  if (name) onSaveSlot(activeSlot, name);
                }}
                className="text-xs font-bold text-[#ff4d4f] hover:underline"
              >
                保存当前
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1">
              {blueprints.map((b) => (
                <button
                  key={b.slotIndex}
                  onClick={() => {
                    soundEngine.playSnapSound();
                    onSelectSlot(b.slotIndex);
                  }}
                  className={`rounded-lg border p-1.5 text-left transition-all ${
                    activeSlot === b.slotIndex
                      ? "border-[#ff3b30] bg-[#ff3b30]/20 shadow"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <span className="block truncate text-[11px] font-bold text-white">{b.name}</span>
                  <span className="block text-[9px] text-neutral-400">
                    {b.bestQuarterMile ? `${b.bestQuarterMile}s` : "未测速"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 底部两大主操作按钮 */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                soundEngine.init();
                soundEngine.playSnapSound();
                onGoToTuning();
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-neutral-800/95 py-3 text-xs font-bold text-white shadow-xl backdrop-blur-md transition-all hover:bg-neutral-700 active:scale-95"
            >
              <Sliders className="h-4 w-4 text-cyan-400" />
              <span>调参</span>
            </button>

            <button
              onClick={() => {
                soundEngine.init();
                onGoToRace();
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff3b30] to-[#e62117] py-3 text-xs font-black text-white shadow-xl shadow-red-900/60 transition-all hover:brightness-110 active:scale-95"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>点火上道</span>
            </button>
          </div>
        </div>
      </div>

      {/* 底部版权与提示 */}
      <footer className="pointer-events-none flex items-center justify-between text-xs text-neutral-400 font-medium">
        <div>红线车库 REDLINE GARAGE · 真实质量/抓地/风阻物理引擎</div>
        <div className="hidden sm:block">所有零件开局全开 · 自由探索极限</div>
      </footer>
    </div>
  );
};
