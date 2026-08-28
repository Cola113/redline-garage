// components/garage/GarageUI.tsx
// Redline Garage - High-Octane Garage Assembly UI & Live Specs Card

import React, { useState } from "react";
import {
  Wrench,
  Flame,
  Zap,
  Gauge,
  Disc,
  Wind,
  Activity,
  Palette,
  Volume2,
  VolumeX,
  Trophy,
  Play,
  Sliders,
  Bookmark,
  Check,
  ChevronRight,
  Shield,
  Layers,
  Sparkles,
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
  onUpdateConfig: (newConfig: CarConfig) => void;
  onSelectSlot: (slotIdx: number) => void;
  onSaveSlot: (slotIdx: number, name: string) => void;
  onGoToTuning: () => void;
  onGoToRace: () => void;
  onOpenLeaderboard: () => void;
  onToggleSound: () => void;
  onChangeQuality: (q: QualitySetting) => void;
}

export const GarageUI: React.FC<GarageUIProps> = ({
  config,
  specs,
  blueprints,
  activeSlot,
  quality,
  soundEnabled,
  onUpdateConfig,
  onSelectSlot,
  onSaveSlot,
  onGoToTuning,
  onGoToRace,
  onOpenLeaderboard,
  onToggleSound,
  onChangeQuality,
}) => {
  const [activeCategory, setActiveCategory] = useState<PartCategory | "paint" | "presets">("chassis");
  const [editingSlotName, setEditingSlotName] = useState<string>("");
  const [isSavingSlot, setIsSavingSlot] = useState<boolean>(false);

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
    <div className="pointer-events-none relative flex h-full w-full flex-col justify-between p-4 md:p-6">
      {/* 顶部状态栏与工具栏 */}
      <header className="pointer-events-auto flex items-center justify-between gap-3">
        {/* LOGO */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff3b30] to-[#b3140b] shadow-lg shadow-red-950/40">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-wider text-white">红线车库</span>
              <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-[#ff3b30]">
                REDLINE GARAGE
              </span>
            </div>
            <p className="text-xs text-neutral-400">沙盒直线加速赛 · 零门槛全自由改装</p>
          </div>
        </div>

        {/* 顶部操作按钮 */}
        <div className="flex items-center gap-2">
          {/* 画质切换 */}
          <div className="flex items-center rounded-lg border border-white/10 bg-neutral-900/80 p-1 backdrop-blur-md">
            {(["low", "medium", "high"] as QualitySetting[]).map((q) => (
              <button
                key={q}
                onClick={() => onChangeQuality(q)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                  quality === q
                    ? "bg-[#ff3b30] text-white shadow"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {q === "high" ? "极高画质" : q === "medium" ? "均衡" : "性能/低配"}
              </button>
            ))}
          </div>

          {/* 音效开关 */}
          <button
            onClick={() => {
              soundEngine.init();
              onToggleSound();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-neutral-900/80 text-neutral-300 transition-all hover:border-white/25 hover:text-white backdrop-blur-md"
            title={soundEnabled ? "音效开" : "音效关"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-green-400" /> : <VolumeX className="h-4 w-4 text-neutral-500" />}
          </button>

          {/* 排行榜 / 历史记录 */}
          <button
            onClick={() => {
              soundEngine.init();
              onOpenLeaderboard();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-bold text-yellow-400 backdrop-blur-md transition-all hover:bg-yellow-500/20"
          >
            <Trophy className="h-4 w-4" />
            <span>纪录榜</span>
          </button>
        </div>
      </header>

      {/* 主体交互区：左侧零件选择柜 + 右侧实时性能大屏 */}
      <div className="my-auto grid grid-cols-1 gap-4 md:grid-cols-12 pointer-events-none">
        {/* 左侧：零件分类与零件库 */}
        <div className="pointer-events-auto col-span-1 md:col-span-7 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#121316]/90 p-4 shadow-2xl backdrop-blur-xl max-h-[68vh] overflow-hidden">
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
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[#ff3b30] text-white shadow-md shadow-red-900/40"
                      : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-neutral-200"
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
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeCategory === "paint"
                  ? "bg-[#ff3b30] text-white shadow-md"
                  : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-neutral-200"
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>车漆涂装</span>
            </button>
            <button
              onClick={() => {
                soundEngine.init();
                soundEngine.playSnapSound();
                setActiveCategory("presets");
              }}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeCategory === "presets"
                  ? "bg-amber-500 text-black shadow-md font-black"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>厂队神车预设</span>
            </button>
          </div>

          {/* 零件列表 */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
            {activeCategory !== "paint" && activeCategory !== "presets" && (
              PARTS_CATALOG[activeCategory].map((part) => {
                const isEquipped = getActivePartId(activeCategory) === part.id;
                return (
                  <div
                    key={part.id}
                    onClick={() => handleSelectPart(activeCategory, part.id)}
                    className={`group relative flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3 transition-all ${
                      isEquipped
                        ? "border-[#ff3b30] bg-[#ff3b30]/10 shadow-lg shadow-red-950/20"
                        : "border-white/5 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-[#ff3b30] transition-colors">
                          {part.name}
                        </span>
                        <span className="text-xs text-neutral-400">({part.weightKg} kg)</span>
                      </div>
                      {isEquipped ? (
                        <div className="flex items-center gap-1 rounded-full bg-[#ff3b30] px-2 py-0.5 text-[10px] font-black text-white">
                          <Check className="h-3 w-3" />
                          已装载
                        </div>
                      ) : (
                        <button className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-neutral-300 group-hover:bg-[#ff3b30] group-hover:text-white transition-all">
                          点击装载
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-neutral-400 line-clamp-1">{part.description}</p>

                    {/* 参数特性徽章 */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {part.baseHp && (
                        <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                          {part.baseHp} 基础匹马力
                        </span>
                      )}
                      {part.torqueNm && (
                        <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-400">
                          {part.torqueNm} Nm 扭矩
                        </span>
                      )}
                      {part.gripCoefficient && (
                        <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">
                          抓地系数 {part.gripCoefficient}
                        </span>
                      )}
                      {part.gearCount && (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                          {part.gearCount} 速变速箱 ({part.shiftDelayMs}ms)
                        </span>
                      )}
                      {part.nosShotHp && part.nosShotHp > 0 && (
                        <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                          +{part.nosShotHp} HP 氮气增压 ({part.nosCapacitySec}s)
                        </span>
                      )}
                      {part.exhaustFlowBonus && part.exhaustFlowBonus > 0 && (
                        <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400">
                          排气增益 +{Math.round(part.exhaustFlowBonus * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* 车漆与质感配置 */}
            {activeCategory === "paint" && (
              <div className="space-y-4 p-2">
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                    车身金属漆面颜色
                  </h4>
                  <div className="grid grid-cols-4 gap-2.5">
                    {PAINT_COLORS.map((p) => (
                      <button
                        key={p.hex}
                        onClick={() => handleSelectPaint(p.hex)}
                        className={`group flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all ${
                          config.paintColor === p.hex
                            ? "border-[#ff3b30] bg-white/10 shadow-md"
                            : "border-white/10 bg-white/5 hover:border-white/30"
                        }`}
                      >
                        <div
                          className="h-8 w-8 rounded-full border border-white/20 shadow-inner"
                          style={{ backgroundColor: p.hex }}
                        />
                        <span className="text-[11px] font-bold text-neutral-300 group-hover:text-white">
                          {p.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                    漆面工艺清漆层
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "metallic", label: "金属高光" },
                      { id: "matte", label: "哑光磨砂" },
                      { id: "chrome", label: "全镀铬" },
                      { id: "gloss", label: "清漆镜面" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleSelectFinish(f.id as any)}
                        className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                          config.paintFinish === f.id
                            ? "border-[#ff3b30] bg-[#ff3b30] text-white"
                            : "border-white/10 bg-white/5 text-neutral-400 hover:text-white"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 厂队预设配置 */}
            {activeCategory === "presets" && (
              <div className="space-y-3 p-1">
                {PRESET_BUILDS.map((preset, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-3.5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        <span className="text-sm font-black text-amber-300">{preset.name}</span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-400">{preset.desc}</p>
                    </div>
                    <button
                      onClick={() => handleApplyPreset(preset.config)}
                      className="self-end rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-black text-black transition-all hover:bg-amber-400"
                    >
                      一键装备此套神车
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：实时数据遥测大屏 & 蓝图槽位 */}
        <div className="pointer-events-auto col-span-1 md:col-span-5 flex flex-col gap-3">
          {/* 实时参数大屏 */}
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#121316]/90 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-widest text-[#ff3b30]">
                实时改装性能标定
              </span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-neutral-300">
                1/4 英里直线规格
              </span>
            </div>

            {/* 核心三项大数字 */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                <span className="block text-[11px] text-neutral-400">综合马力</span>
                <span className="text-2xl font-black text-white">{specs.peakHp}</span>
                <span className="text-[10px] text-neutral-500 block">HP</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                <span className="block text-[11px] text-neutral-400">峰值扭矩</span>
                <span className="text-2xl font-black text-white">{specs.peakTorqueNm}</span>
                <span className="text-[10px] text-neutral-500 block">Nm</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                <span className="block text-[11px] text-neutral-400">整备质量</span>
                <span className="text-2xl font-black text-white">{specs.totalWeightKg}</span>
                <span className="text-[10px] text-neutral-500 block">kg</span>
              </div>
            </div>

            {/* 预测加速与推重比 */}
            <div className="space-y-2 rounded-xl bg-black/40 p-3 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">推重比 (hp/吨)</span>
                <span className="font-bold text-[#ffb340]">{specs.powerToWeightRatio} HP/t</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">预估 0-100 km/h 加速</span>
                <span className="font-bold text-green-400">{specs.zeroToHundredSecEst} 秒</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">预估 1/4 英里 (400米) 耗时</span>
                <span className="font-bold text-[#ff3b30]">{specs.quarterMileSecEst} 秒</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">预估极速 (Top Speed)</span>
                <span className="font-bold text-cyan-400">{specs.topSpeedKmhEst} km/h</span>
              </div>
            </div>

            {/* 蓝图 3 槽位 */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span className="font-bold uppercase tracking-wider">蓝图槽位 (本地存储)</span>
                <button
                  onClick={() => {
                    const name = prompt("请输入蓝图名称：", `改装车 #${activeSlot + 1}`);
                    if (name) onSaveSlot(activeSlot, name);
                  }}
                  className="text-xs text-[#ff3b30] hover:underline"
                >
                  保存当前配置
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {blueprints.map((b) => (
                  <button
                    key={b.slotIndex}
                    onClick={() => {
                      soundEngine.playSnapSound();
                      onSelectSlot(b.slotIndex);
                    }}
                    className={`rounded-lg border p-2 text-left transition-all ${
                      activeSlot === b.slotIndex
                        ? "border-[#ff3b30] bg-[#ff3b30]/15"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <span className="block truncate text-xs font-bold text-white">{b.name}</span>
                    <span className="block text-[10px] text-neutral-400">
                      {b.bestQuarterMile ? `${b.bestQuarterMile}s` : "未测速"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 底部两大主操作按钮：调参 & 点火上道 */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                soundEngine.init();
                soundEngine.playSnapSound();
                onGoToTuning();
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-neutral-800/90 py-3.5 text-sm font-bold text-white shadow-lg backdrop-blur-md transition-all hover:bg-neutral-700 hover:border-white/30 active:scale-[0.98]"
            >
              <Sliders className="h-4 w-4 text-cyan-400" />
              <span>深度调参 (Tuning)</span>
            </button>

            <button
              onClick={() => {
                soundEngine.init();
                onGoToRace();
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff3b30] to-[#e62117] py-3.5 text-sm font-black text-white shadow-xl shadow-red-900/50 transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <Play className="h-5 w-5 fill-white" />
              <span>点火上道 (RACE)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 底部操作快捷提示 */}
      <footer className="pointer-events-none flex items-center justify-between text-xs text-neutral-500">
        <div>红线车库 REDLINE GARAGE · 真实质量/抓地/风阻物理引擎</div>
        <div className="hidden sm:block">所有零件开局全开 · 自由探索极限</div>
      </footer>
    </div>
  );
};
