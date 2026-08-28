// app/page.tsx
// Redline Garage - Main Entrypoint with SSR-disabled dynamic client loading

"use client";

import dynamic from "next/dynamic";
import { Flame } from "lucide-react";

const GameApp = dynamic(
  () => import("@/components/GameApp").then((mod) => mod.GameApp),
  {
    ssr: false,
    loading: () => (
      <main className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-[#0a0a0c] text-white select-none">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff3b30] to-[#b3140b] shadow-2xl shadow-red-900/50 animate-pulse">
          <Flame className="h-9 w-9 text-white" />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black italic tracking-widest text-white">
            红线车库 REDLINE GARAGE
          </h1>
          <p className="text-xs font-mono tracking-widest text-neutral-400">
            LOADING PHYSICAL ENGINE & 3D GARAGE...
          </p>
        </div>
      </main>
    ),
  }
);

export default function Home() {
  return <GameApp />;
}