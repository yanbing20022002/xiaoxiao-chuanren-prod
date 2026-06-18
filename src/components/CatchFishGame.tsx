/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Trophy, Anchor, RotateCcw, Heart } from "lucide-react";
import { synth } from "../utils/audio";
import confetti from "canvas-confetti";

interface CatchFishGameProps {
  onGameComplete: (stars: number) => void;
}

interface Fish {
  id: number;
  label: string;
  color: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  scale: number;
}

const FISH_SPECIES = [
  { label: "高粱红鱼", color: "#ef4444" },
  { label: "糯米白鱼", color: "#f8fafc" },
  { label: "大麦黄鱼", color: "#eab308" },
  { label: "稻谷青鱼", color: "#10b981" },
  { label: "玉米金鱼", color: "#f97316" },
  { label: "荞麦紫鱼", color: "#a855f7" },
];

export default function CatchFishGame({ onGameComplete }: CatchFishGameProps) {
  const [fishPool, setFishPool] = useState<Fish[]>([]);
  const [harvestCount, setHarvestCount] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);
  const [results, setResults] = useState<boolean>(false);
  const [ticks, setTicks] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const poolRef = useRef<HTMLDivElement>(null);

  // Initialize 12 custom fishes in different starting conditions
  const startHarvest = () => {
    synth.playWaterDrop();
    const l = Array.from({ length: 12 }).map((_, i) => {
      const species = FISH_SPECIES[i % FISH_SPECIES.length];
      return {
        id: i,
        label: species.label,
        color: species.color,
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 1.5 + 1.0,
        scale: Math.random() * 0.3 + 0.85,
      };
    });
    setFishPool(l);
    setHarvestCount(0);
    setTimeLeft(20);
    setPlaying(true);
    setResults(false);
  };

  // 20-second countdown timer
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPlaying(false);
          setResults(true);
          synth.playChime();
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [playing]);

  // Trajectory update loop representing aquatic swim behaviors
  useEffect(() => {
    if (!playing) return;

    const interval = setInterval(() => {
      setTicks((t) => t + 1);
      setFishPool((currentPool) =>
        currentPool.map((f) => {
          // Add sinusoidal sway representing tail wags
          const sway = Math.sin(ticks * 0.15 + f.id) * 0.4;
          const adjustedAngle = f.angle + sway * 0.15;
          let nx = f.x + Math.cos(adjustedAngle) * f.speed * 0.35;
          let ny = f.y + Math.sin(adjustedAngle) * f.speed * 0.35;

          // Bounce off boundary edges
          let updatedAngle = adjustedAngle;
          if (nx < 5 || nx > 95) {
            updatedAngle = Math.PI - adjustedAngle;
            nx = Math.max(5, Math.min(nx, 95));
          }
          if (ny < 10 || ny > 90) {
            updatedAngle = -adjustedAngle;
            ny = Math.max(10, Math.min(ny, 90));
          }

          return {
            ...f,
            x: nx,
            y: ny,
            angle: updatedAngle,
          };
        })
      );
    }, 40);

    return () => clearInterval(interval);
  }, [playing, ticks]);

  // Click on a fish to catch it!
  const catchSpecificFish = (id: number) => {
    synth.playWaterDrop();
    setFishPool((prev) => prev.filter((f) => f.id !== id));
    setHarvestCount((c) => {
      const nextCount = c + 1;
      if (nextCount >= 8) {
        setPlaying(false);
        setTimeout(() => {
          setResults(true);
          synth.playChime();
        }, 500);
      }
      return nextCount;
    });

    // Splat water visual effect
    confetti({
      particleCount: 15,
      spread: 20,
      colors: ["#38bdf8", "#0284c7", "#ffffff"],
    });
  };

  const calculateStars = () => {
    if (harvestCount >= 8) return 5;
    if (harvestCount >= 5) return 4;
    return 3;
  };

  const finalizeScore = () => {
    const finalStars = calculateStars();
    synth.playChime();
    
    // Spark congrats confetti
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#22c55e", "#dfb15b", "#ef4444"],
    });
    
    onGameComplete(finalStars);
  };

  return (
    <div className="w-full bg-stone-950/85 rounded-2xl p-4 border border-emerald-900/40 relative overflow-hidden flex flex-col justify-between select-none min-h-[295px]">
      {/* Aquatic gradient decor */}
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/10 via-transparent to-teal-950/15 pointer-events-none" />

      {!playing && !results && (
        <div className="text-center py-6 space-y-4 flex-1 flex flex-col justify-center items-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Anchor className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-serif font-bold text-slate-100">泰安清池·鱼跃农门小游戏</h4>
            <p className="text-[10px] text-stone-400 font-serif max-w-xs mx-auto leading-relaxed">
              这里是六粮丰收作坊！在线模拟在充气池中抛网捕捞“六粮鱼”，体验粒米皆学问、秋获满仓的喜悦。<br />
              请在池塘中，快速捕捞 8 条印有谷物名称的神奇灵鱼！
            </p>
          </div>

          <button
            onClick={startHarvest}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:brightness-110 active:scale-95 text-xs font-serif font-semibold tracking-wider rounded-lg transition-all"
          >
            🐟 跃入水中网鱼
          </button>
        </div>
      )}

      {playing && (
        <div className="flex-1 flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 text-[10px] font-serif">
            <span className="text-emerald-400 font-bold">🌾 捕捞六粮谷：</span>
            <span className="text-stone-300">
              已捕获：<span className="text-orange-400 font-bold font-mono">{harvestCount}</span> / 8 条
            </span>
            <span className="text-red-400 font-semibold font-mono flex items-center gap-1">
              ⏳ 剩：{timeLeft}秒
            </span>
          </div>

          {/* Fishing Pool Interactive Grid */}
          <div 
            ref={poolRef}
            className="h-[180px] bg-[#0c1f1a] rounded-xl border border-emerald-900/60 relative overflow-hidden"
          >
            {/* Animating water lilies background dots */}
            <div className="absolute top-4 left-6 w-8 h-8 rounded-full bg-teal-900/40 border border-teal-800/20 flex items-center justify-center text-[8px] text-teal-600/40 font-serif">莲</div>
            <div className="absolute bottom-6 right-12 w-10 h-10 rounded-full bg-teal-900/40 border border-teal-800/20 flex items-center justify-center text-[8px] text-teal-600/40 font-serif">叶</div>

            {fishPool.map((f) => {
              // Transform scale and rotate to match moving trajectories
              const rotateDeg = (f.angle * 180) / Math.PI;

              return (
                <motion.button
                  key={f.id}
                  onClick={() => catchSpecificFish(f.id)}
                  style={{
                    left: `${f.x}%`,
                    top: `${f.y}%`,
                    scale: f.scale,
                  }}
                  className="absolute p-1 cursor-pointer flex flex-col items-center justify-center hover:scale-110 transition-transform origin-center outline-none select-none"
                >
                  {/* The actual structured Fish body vector */}
                  <div 
                    style={{ transform: `rotate(${rotateDeg}deg)` }}
                    className="w-10 h-5 relative flex items-center justify-center transition-transform"
                  >
                    {/* Swim body container */}
                    <div 
                      style={{ backgroundColor: f.color }}
                      className="w-7 h-4 rounded-full relative flex items-center justify-end px-1"
                    >
                      {/* Scale texture and tiny eyes */}
                      <span className="w-1.5 h-1.5 rounded-full bg-black border border-white absolute top-0.5 right-1" />
                      <span className="text-[6px] text-black font-serif font-bold scale-75 select-none uppercase">粮</span>
                    </div>
                    {/* Fan Tail fin */}
                    <div 
                      style={{ borderLeftColor: f.color }}
                      className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-8 absolute -left-2"
                    />
                  </div>
                  {/* Plant species dynamic floating sticker labels */}
                  <span className="text-[7.5px] font-serif font-semibold bg-black/70 border border-white/10 px-1 rounded-sm text-stone-200 mt-1 select-none pointer-events-none scale-90">
                    {f.label}
                  </span>
                </motion.button>
              );
            })}

            {fishPool.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-stone-500 font-serif text-[10px] pointer-events-none">
                六粮鱼游入稻草中... 重整中
              </div>
            )}
          </div>

          <div className="text-[9px] text-stone-500 font-serif text-center">
            点击池中漂流的各灵谷鱼，收获满筐即可。星级判定由您收获的六粮鱼总数判定！
          </div>
        </div>
      )}

      {results && (
        <div className="text-center py-4 space-y-4 flex-1 flex flex-col justify-center items-center">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-serif font-bold text-slate-100">六粮丰收·大庆喜报</h4>
            <div className="text-stone-300 text-xs font-serif leading-relaxed">
              捕获六粮鱼：<span className="text-emerald-400 font-extrabold">{harvestCount} 条</span><br />
              囊括品种：高粱、糯米、稻谷及麦穗各系稻鱼
            </div>
            
            {/* Stars rendering */}
            <div className="flex gap-1 justify-center text-xl text-[#dfb15b] pt-1">
              {Array.from({ length: calculateStars() }).map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>
          </div>

          <div className="flex gap-2.5 w-full">
            <button
              onClick={() => { setResults(false); setPlaying(false); }}
              className="flex-1 py-2 rounded-xl text-[10px] font-serif border border-stone-800 text-stone-400 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重新捕捞</span>
            </button>
            <button
              onClick={finalizeScore}
              className="flex-1 py-2 bg-[#dfb15b] hover:brightness-110 active:scale-95 text-black font-semibold text-xs rounded-xl tracking-wider uppercase font-serif"
            >
              网好收印
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
